import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { db } from './db.js'

const SESSION_DAYS = 7
const COOKIE = 'ideax_sid'

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

function checkPassword(password, stored) {
  const [salt, hash] = stored.split(':')
  const expected = Buffer.from(hash, 'hex')
  const actual = scryptSync(password, salt, 64)
  return timingSafeEqual(expected, actual)
}

const sha256 = (s) => createHash('sha256').update(s).digest('hex')

function readCookie(req, name) {
  const match = (req.headers.cookie || '').split(/;\s*/).find((c) => c.startsWith(`${name}=`))
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null
}

function setCookie(res, value, maxAgeSeconds) {
  const parts = [`${COOKIE}=${value}`, 'Path=/', 'HttpOnly', 'SameSite=Lax', `Max-Age=${maxAgeSeconds}`]
  if (process.env.NODE_ENV === 'production') parts.push('Secure')
  res.setHeader('Set-Cookie', parts.join('; '))
}

// Returns the user if the email/password match, otherwise null.
export function verifyLogin(email, password) {
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email).trim())
  if (!user) {
    hashPassword(password) // same work either way, so timing doesn't reveal which emails exist
    return null
  }
  return checkPassword(String(password), user.password_hash) ? user : null
}

export function startSession(res, userId) {
  const token = randomBytes(32).toString('hex')
  const expires = Date.now() + SESSION_DAYS * 864e5
  db.prepare('INSERT INTO sessions (token_hash, user_id, csrf, expires_at) VALUES (?, ?, ?, ?)').run(
    sha256(token),
    userId,
    randomBytes(24).toString('hex'),
    expires,
  )
  setCookie(res, token, SESSION_DAYS * 86400)
}

export function endSession(req, res) {
  const token = readCookie(req, COOKIE)
  if (token) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(token))
  setCookie(res, '', 0)
}

// Middleware: attaches req.user and req.csrf when a valid session cookie is present.
export function loadSession(req, res, next) {
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now())
  const token = readCookie(req, COOKIE)
  if (token) {
    const row = db
      .prepare(
        `SELECT s.csrf, u.id, u.email FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?`,
      )
      .get(sha256(token))
    if (row) {
      req.user = { id: row.id, email: row.email }
      req.csrf = row.csrf
    }
  }
  next()
}

export function requireAdmin(req, res, next) {
  if (!req.user) return res.redirect('/admin/login')
  next()
}

// Every admin form carries the session's CSRF token in a hidden field.
export function checkCsrf(req, res, next) {
  const sent = Buffer.from(String(req.body?._csrf || ''))
  const expected = Buffer.from(req.csrf || '')
  if (!expected.length || sent.length !== expected.length || !timingSafeEqual(sent, expected)) {
    return res.status(403).send('Invalid form token. Go back, refresh the page and try again.')
  }
  next()
}

// Simple in-memory brake on password guessing: 5 failures per IP per 15 minutes.
const failures = new Map()
export const loginLimiter = {
  blocked(ip) {
    const f = failures.get(ip)
    if (f && f.until < Date.now()) failures.delete(ip)
    return (failures.get(ip)?.count ?? 0) >= 5
  },
  fail(ip) {
    const f = failures.get(ip) ?? { count: 0, until: Date.now() + 15 * 60e3 }
    f.count++
    failures.set(ip, f)
  },
  reset: (ip) => failures.delete(ip),
}
