// Create an admin account, or reset its password if the email already exists.
// Usage: npm run create-admin -- you@example.com "a long password"
import { hashPassword } from '../src/auth.js'
import { db } from '../src/db.js'

const [email, password] = process.argv.slice(2)

if (!email || !password) {
  console.error('Usage: npm run create-admin -- you@example.com "a long password"')
  process.exit(1)
}
if (password.length < 10) {
  console.error('Please use a password of at least 10 characters.')
  process.exit(1)
}

const hash = hashPassword(password)
const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)

if (existing) {
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, existing.id)
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(existing.id)
  console.log(`Password updated for ${email} (all its sessions were signed out).`)
} else {
  db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)').run(email, hash)
  console.log(`Admin created: ${email}`)
}
