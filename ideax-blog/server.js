import { randomBytes } from 'node:crypto'
import { mkdirSync, unlink } from 'node:fs'
import path from 'node:path'
import express from 'express'
import multer from 'multer'
import { checkCsrf, endSession, loadSession, loginLimiter, requireAdmin, startSession, verifyLogin } from './src/auth.js'
import { db, posts } from './src/db.js'
import * as views from './src/views.js'

const PORT = process.env.PORT || 4000
const app = express()
app.disable('x-powered-by')
app.set('trust proxy', 1) // correct client IPs behind a hosting proxy (for the login limiter)

mkdirSync('uploads', { recursive: true })

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('X-Frame-Options', 'DENY')
  next()
})
app.use(express.static('public'))
app.use('/uploads', express.static('uploads', { maxAge: '30d' }))
app.use(express.urlencoded({ extended: false, limit: '1mb' }))
app.use(loadSession)

// ---------- cover image uploads ----------

const imageTypes = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' }
const upload = multer({
  storage: multer.diskStorage({
    destination: 'uploads',
    filename: (req, file, cb) => cb(null, randomBytes(12).toString('hex') + imageTypes[file.mimetype]),
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) =>
    imageTypes[file.mimetype] ? cb(null, true) : cb(new Error('Cover must be a JPG, PNG, WebP or GIF image.')),
})

// Runs multer and turns its errors (too big, wrong type) into a friendly message on the form.
const withCover = (req, res, next) =>
  upload.single('cover')(req, res, (err) => {
    if (err) req.uploadError = err.code === 'LIMIT_FILE_SIZE' ? 'Cover image must be 5 MB or smaller.' : err.message
    next()
  })

function deleteUpload(url) {
  if (url?.startsWith('/uploads/')) unlink(path.join('uploads', path.basename(url)), () => {})
}

function readPostForm(req) {
  return {
    title: String(req.body.title || '').trim().slice(0, 160),
    excerpt: String(req.body.excerpt || '').trim().slice(0, 300),
    content: String(req.body.content || ''),
    status: req.body.status === 'published' ? 'published' : 'draft',
    cover: req.file ? `/uploads/${req.file.filename}` : null,
  }
}

// ---------- public ----------

app.get('/', (req, res) => res.redirect('/blog'))

app.get('/blog', (req, res) => res.send(views.blogIndex(posts.published())))

app.get('/blog/:slug', (req, res) => {
  const post = posts.bySlug(req.params.slug)
  if (!post) return res.status(404).send(views.notFound())
  const more = posts.published().filter((p) => p.id !== post.id).slice(0, 3)
  res.send(views.blogPost(post, more))
})

// ---------- admin: login ----------

app.get('/admin/login', (req, res) => (req.user ? res.redirect('/admin') : res.send(views.loginPage())))

app.post('/admin/login', (req, res) => {
  const { email = '', password = '' } = req.body ?? {}
  if (loginLimiter.blocked(req.ip)) {
    return res.status(429).send(views.loginPage({ email, error: 'Too many attempts. Please wait 15 minutes and try again.' }))
  }
  const user = verifyLogin(email, password)
  if (!user) {
    loginLimiter.fail(req.ip)
    return res.status(401).send(views.loginPage({ email, error: 'Wrong email or password.' }))
  }
  loginLimiter.reset(req.ip)
  startSession(res, user.id)
  res.redirect('/admin')
})

app.post('/admin/logout', requireAdmin, checkCsrf, (req, res) => {
  endSession(req, res)
  res.redirect('/admin/login')
})

// ---------- admin: posts ----------

const flashes = { created: 'Post created.', saved: 'Changes saved.', deleted: 'Post deleted.' }

app.get('/admin', requireAdmin, (req, res) => {
  res.send(views.dashboard(req.user, req.csrf, posts.all(), flashes[req.query.done]))
})

app.get('/admin/posts/new', requireAdmin, (req, res) => res.send(views.editor(req.user, req.csrf)))

app.post('/admin/posts', requireAdmin, withCover, checkCsrf, (req, res) => {
  const data = readPostForm(req)
  const error = req.uploadError || (!data.title && 'Please add a title.')
  if (error) {
    deleteUpload(data.cover)
    return res.status(400).send(views.editor(req.user, req.csrf, { ...data, cover: null }, error))
  }
  posts.create(data)
  res.redirect('/admin?done=created')
})

app.get('/admin/posts/:id/edit', requireAdmin, (req, res) => {
  const post = posts.byId(Number(req.params.id))
  if (!post) return res.redirect('/admin')
  res.send(views.editor(req.user, req.csrf, post))
})

app.post('/admin/posts/:id', requireAdmin, withCover, checkCsrf, (req, res) => {
  const post = posts.byId(Number(req.params.id))
  if (!post) return res.redirect('/admin')
  const data = readPostForm(req)
  const error = req.uploadError || (!data.title && 'Please add a title.')
  if (error) {
    deleteUpload(data.cover)
    return res.status(400).send(views.editor(req.user, req.csrf, { ...post, ...data, cover: post.cover }, error))
  }
  // replacing or removing the cover deletes the old file
  if (data.cover || req.body.remove_cover) {
    deleteUpload(post.cover)
    if (!data.cover) posts.removeCover(post.id)
  }
  posts.update(post.id, data)
  res.redirect('/admin?done=saved')
})

app.post('/admin/posts/:id/delete', requireAdmin, checkCsrf, (req, res) => {
  const post = posts.byId(Number(req.params.id))
  if (post) {
    deleteUpload(post.cover)
    posts.remove(post.id)
  }
  res.redirect('/admin?done=deleted')
})

app.use((req, res) => res.status(404).send(views.notFound()))

app.listen(PORT, () => {
  const admins = db.prepare('SELECT COUNT(*) AS n FROM users').get().n
  console.log(`Ideax blog running at http://localhost:${PORT}/blog`)
  if (!admins) console.log('No admin yet. Create one with: npm run create-admin -- you@example.com "a long password"')
})
