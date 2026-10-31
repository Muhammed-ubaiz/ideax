import { mkdirSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'

mkdirSync('data', { recursive: true })

export const db = new DatabaseSync('data/blog.db')

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY,
    email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    csrf       TEXT NOT NULL,
    expires_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS posts (
    id           INTEGER PRIMARY KEY,
    title        TEXT NOT NULL,
    slug         TEXT NOT NULL UNIQUE,
    excerpt      TEXT NOT NULL DEFAULT '',
    content      TEXT NOT NULL DEFAULT '',
    cover        TEXT,
    status       TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    published_at TEXT,
    created_at   TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );
`)

export function slugify(text) {
  const base =
    text
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'post'
  // make it unique by adding -2, -3, ...
  let slug = base
  for (let n = 2; db.prepare('SELECT 1 FROM posts WHERE slug = ?').get(slug); n++) slug = `${base}-${n}`
  return slug
}

export const posts = {
  published: () =>
    db.prepare(`SELECT * FROM posts WHERE status = 'published' ORDER BY published_at DESC`).all(),
  all: () => db.prepare('SELECT * FROM posts ORDER BY updated_at DESC').all(),
  bySlug: (slug) => db.prepare(`SELECT * FROM posts WHERE slug = ? AND status = 'published'`).get(slug),
  byId: (id) => db.prepare('SELECT * FROM posts WHERE id = ?').get(id),

  create({ title, excerpt, content, cover, status }) {
    const slug = slugify(title)
    db.prepare(
      `INSERT INTO posts (title, slug, excerpt, content, cover, status, published_at)
       VALUES (?, ?, ?, ?, ?, ?, CASE WHEN ? = 'published' THEN datetime('now') END)`,
    ).run(title, slug, excerpt, content, cover ?? null, status, status)
    return slug
  },

  update(id, { title, excerpt, content, cover, status }) {
    // Until a post has been published its URL follows the title; after that it stays fixed so links don't break.
    const current = db.prepare('SELECT title, published_at FROM posts WHERE id = ?').get(id)
    if (current && !current.published_at && current.title !== title) {
      db.prepare('UPDATE posts SET slug = ? WHERE id = ?').run(`tmp-${id}`, id)
      db.prepare('UPDATE posts SET slug = ? WHERE id = ?').run(slugify(title), id)
    }
    db.prepare(
      `UPDATE posts SET title = ?, excerpt = ?, content = ?, cover = COALESCE(?, cover), status = ?,
         published_at = CASE WHEN ? = 'published' THEN COALESCE(published_at, datetime('now')) END,
         updated_at = datetime('now')
       WHERE id = ?`,
    ).run(title, excerpt, content, cover ?? null, status, status, id)
  },

  removeCover: (id) => db.prepare('UPDATE posts SET cover = NULL WHERE id = ?').run(id),
  remove: (id) => db.prepare('DELETE FROM posts WHERE id = ?').run(id),
}
