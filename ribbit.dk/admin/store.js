// The admin's data layer: sign-in and the posts, behind one small interface used by admin.js.
// - Live: Firebase Authentication (email/password; passwords are hashed and checked by Firebase, never here) and
//   Firestore. Who may read drafts and write is decided on the server, by firestore.rules, not by this file.
// - Test (localhost only, /admin/?mock=1): the same interface over this browser's storage, with a test login,
//   so every screen can be tried without touching the live data. The public blog pages read it too while it is on.
// A post: { slug, title, excerpt, content, category, alsoIn[], topic, author, publishedAt 'YYYY-MM-DD', seoTitle,
//   seoDescription, status 'published'|'draft', hasImage, imageW, imageH, [imagePath, externalUrl, cover, order] }.
// Its featured image is kept apart, in postImages/<slug>: { data: 'data:image/webp;base64,…', w, h }.

const FIREBASE = {
  apiKey: 'AIzaSyDWJwGL3MpVqGCwxLmN7a1YKISMmmwlUsM', // (the web app's public identifiers, not secrets)
  authDomain: 'ideaxcorp-3089b.firebaseapp.com',
  projectId: 'ideaxcorp-3089b',
  appId: '1:281588608067:web:9e38b458d71dd77ccab8f6'
}
const SDK = 'https://www.gstatic.com/firebasejs/10.14.1/'
// the username is the part of the admin account's email before the @ (an email works too)
const ADMIN_DOMAIN = 'admin.ideaxcorp.com'
export const usernameToEmail = (u) => (u.includes('@') ? u : u + '@' + ADMIN_DOMAIN).trim().toLowerCase()

const LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)
export const MOCK = LOCAL && new URLSearchParams(location.search).get('mock') === '1'

const FIELDS = ['title', 'slug', 'excerpt', 'content', 'category', 'alsoIn', 'topic', 'author', 'publishedAt', 'seoTitle',
  'seoDescription', 'status', 'hasImage', 'imageW', 'imageH', 'imagePath', 'externalUrl', 'cover', 'order']
function pick(p) { const o = {}; for (const k of FIELDS) if (p[k] !== undefined && p[k] !== null) o[k] = p[k]; return o }
function toMs(t) { return t && typeof t.toMillis === 'function' ? t.toMillis() : typeof t === 'number' ? t : t ? Date.parse(t) : 0 }

export class StoreError extends Error { constructor(code, message) { super(message); this.code = code } }

// ---------- live: Firebase ----------
async function firebaseStore() {
  const [{ initializeApp }, auth, fs] = await Promise.all([
    import(SDK + 'firebase-app.js'), import(SDK + 'firebase-auth.js'), import(SDK + 'firebase-firestore.js')
  ])
  const app = initializeApp(FIREBASE)
  const A = auth.getAuth(app)
  await auth.setPersistence(A, auth.browserSessionPersistence) // signed out when the browser closes
  const db = fs.getFirestore(app)
  const created = new Map() // each post's createdAt, kept as read (the rules require it unchanged on edit)
  const denied = (e) => e && (e.code === 'permission-denied' || /insufficient permissions/i.test(e.message))
  const wrap = (e) => { if (denied(e)) return new StoreError('denied', 'This account doesn’t have permission to do that.'); return new StoreError(e.code || 'error', e.message || 'Something went wrong.') }
  function fromDoc(d) { const v = d.data(); created.set(d.id, v.createdAt); return { ...v, slug: d.id, createdAt: toMs(v.createdAt), updatedAt: toMs(v.updatedAt) } }
  function body(p, isNew) {
    return { ...pick(p), alsoIn: p.alsoIn || [], hasImage: !!p.hasImage, updatedAt: fs.serverTimestamp(), createdAt: isNew ? fs.serverTimestamp() : created.get(p.slug) }
  }
  return {
    mode: 'live',
    onAuth(cb) { return auth.onAuthStateChanged(A, (u) => cb(u ? { email: u.email, name: u.email.split('@')[0] } : null)) },
    async signIn(username, password) {
      try { await auth.signInWithEmailAndPassword(A, usernameToEmail(username), password) } catch (e) {
        const c = e.code || ''
        if (/invalid-credential|wrong-password|user-not-found|invalid-email|invalid-login/.test(c)) throw new StoreError('credentials', 'Incorrect username or password.')
        if (/too-many-requests/.test(c)) throw new StoreError('throttled', 'Too many attempts. Please wait a few minutes and try again.')
        if (/network/.test(c)) throw new StoreError('network', 'Can’t reach the server. Check your connection.')
        if (/operation-not-allowed/.test(c)) throw new StoreError('setup', 'Email/password sign-in isn’t enabled for this project yet.')
        throw new StoreError(c || 'error', 'Sign-in failed. Please try again.')
      }
    },
    signOut() { return auth.signOut(A) },
    async listAll() {
      try { const s = await fs.getDocs(fs.collection(db, 'posts')); return s.docs.map(fromDoc) } catch (e) { throw wrap(e) }
    },
    async get(slug) {
      try { const d = await fs.getDoc(fs.doc(db, 'posts', slug)); return d.exists() ? fromDoc(d) : null } catch (e) { throw wrap(e) }
    },
    async getImage(slug) {
      try { const d = await fs.getDoc(fs.doc(db, 'postImages', slug)); return d.exists() ? d.data() : null } catch (e) { throw wrap(e) }
    },
    async exists(slug) { try { return (await fs.getDoc(fs.doc(db, 'posts', slug))).exists() } catch (e) { throw wrap(e) } },
    // image: undefined = unchanged, null = removed, { data, w, h } = new
    async save(post, image, oldSlug) {
      const renamed = oldSlug && oldSlug !== post.slug, isNew = !oldSlug || renamed
      try {
        if (isNew && await this.exists(post.slug)) throw new StoreError('slug-taken', 'Another post already uses this slug.')
        let img = image
        if (renamed && img === undefined && post.hasImage && !post.imagePath) img = await this.getImage(oldSlug) // (moved with the post)
        const b = fs.writeBatch(db)
        b.set(fs.doc(db, 'posts', post.slug), body(post, isNew))
        if (img) b.set(fs.doc(db, 'postImages', post.slug), { data: img.data, w: img.w, h: img.h })
        else if (img === null) b.delete(fs.doc(db, 'postImages', post.slug))
        if (renamed) { b.delete(fs.doc(db, 'posts', oldSlug)); b.delete(fs.doc(db, 'postImages', oldSlug)) }
        await b.commit()
        if (renamed) created.delete(oldSlug)
        return await this.get(post.slug)
      } catch (e) { throw e instanceof StoreError ? e : wrap(e) }
    },
    async remove(slug) {
      try { const b = fs.writeBatch(db); b.delete(fs.doc(db, 'posts', slug)); b.delete(fs.doc(db, 'postImages', slug)); await b.commit(); created.delete(slug) } catch (e) { throw wrap(e) }
    },
    async importMany(posts) {
      try {
        const b = fs.writeBatch(db)
        for (const p of posts) b.set(fs.doc(db, 'posts', p.slug), body(p, true))
        await b.commit()
      } catch (e) { throw wrap(e) }
    }
  }
}

// ---------- test: this browser's storage (localhost, ?mock=1) ----------
function mockStore() {
  const KEY = 'ixblog-mock-db', USER = 'ixblog-mock-user'
  const TEST = { username: 'demo', password: 'demo-pass-123' } // (test login, local test mode only)
  localStorage.setItem('ixblog-mock-on', '1') // the public blog pages on this machine read the test data too
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || { posts: {}, images: {} } } catch (e) { return { posts: {}, images: {} } } }
  const write = (db) => { try { localStorage.setItem(KEY, JSON.stringify(db)) } catch (e) { throw new StoreError('quota', 'The test store is full (browser storage). Remove a few test posts.') } }
  const wait = (ms = 250) => new Promise((r) => setTimeout(r, ms))
  let listener = null
  const me = () => (sessionStorage.getItem(USER) ? { email: TEST.username + '@' + ADMIN_DOMAIN, name: TEST.username } : null)
  return {
    mode: 'mock', testLogin: TEST,
    onAuth(cb) { listener = cb; setTimeout(() => cb(me()), 0); return () => { listener = null } },
    async signIn(username, password) {
      await wait(500)
      if (username.trim().toLowerCase() !== TEST.username || password !== TEST.password) throw new StoreError('credentials', 'Incorrect username or password.')
      sessionStorage.setItem(USER, '1'); listener && listener(me())
    },
    async signOut() { sessionStorage.removeItem(USER); listener && listener(null) },
    async listAll() { await wait(); return Object.values(read().posts) },
    async get(slug) { await wait(120); return read().posts[slug] || null },
    async getImage(slug) { return read().images[slug] || null },
    async exists(slug) { return !!read().posts[slug] },
    async save(post, image, oldSlug) {
      await wait(400)
      const db = read(), renamed = oldSlug && oldSlug !== post.slug, isNew = !oldSlug || renamed
      if (isNew && db.posts[post.slug]) throw new StoreError('slug-taken', 'Another post already uses this slug.')
      const now = Date.now(), prev = oldSlug ? db.posts[oldSlug] : null
      db.posts[post.slug] = { ...pick(post), alsoIn: post.alsoIn || [], hasImage: !!post.hasImage, createdAt: prev && !renamed ? prev.createdAt : now, updatedAt: now }
      if (image) db.images[post.slug] = image
      else if (image === null) delete db.images[post.slug]
      else if (renamed && db.images[oldSlug]) db.images[post.slug] = db.images[oldSlug]
      if (renamed) { delete db.posts[oldSlug]; delete db.images[oldSlug] }
      write(db); return db.posts[post.slug]
    },
    async remove(slug) { await wait(); const db = read(); delete db.posts[slug]; delete db.images[slug]; write(db) },
    async importMany(posts) { await wait(); const db = read(), now = Date.now(); for (const p of posts) db.posts[p.slug] = { ...pick(p), alsoIn: p.alsoIn || [], hasImage: !!p.hasImage, createdAt: now, updatedAt: now }; write(db) }
  }
}

export async function openStore() {
  if (!MOCK) { try { localStorage.removeItem('ixblog-mock-on') } catch (e) {} }
  return MOCK ? mockStore() : firebaseStore()
}
