// Ideaxcorp CMS: the screens (sign-in, dashboard, all posts, the editor). Data and sign-in: store.js.
// Routes (in the address's #): #/dashboard, #/posts, #/new, #/edit/<slug>.
import { openStore, MOCK, StoreError } from './store.js'
import LEGACY from './legacy-posts.js'

// ---------- basics ----------
const $ = (s, r = document) => r.querySelector(s)
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s))
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const CATS = { 'web-development': 'Web Development', branding: 'Branding', 'digital-marketing': 'Digital Marketing', technology: 'Technology', design: 'Design' }
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const LIMITS = { title: 160, slug: 100, excerpt: 300, topic: 30, author: 60, seoTitle: 70, seoDescription: 160 }
const SITE = location.origin
const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') }
const fmtDate = (s) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); return m ? +m[3] + ' ' + MONTHS[+m[2] - 1] + ' ' + m[1] : '—' }
function ago(ms) {
  if (!ms) return ''
  const s = Math.round((Date.now() - ms) / 1000)
  if (s < 45) return 'just now'
  if (s < 3600) return Math.round(s / 60) + ' min ago'
  if (s < 86400) return Math.round(s / 3600) + ' h ago'
  if (s < 86400 * 30) return Math.round(s / 86400) + ' d ago'
  const d = new Date(ms); return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear()
}
export const slugify = (s) => String(s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, LIMITS.slug).replace(/-+$/, '')
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/
const textOf = (html) => { const d = document.createElement('div'); d.innerHTML = html || ''; return (d.textContent || '').replace(/\s+/g, ' ').trim() }
const wordsOf = (html) => { const t = textOf(html); return t ? t.split(' ').length : 0 }
const postUrl = (p) => p.externalUrl || '/blog/post/?s=' + encodeURIComponent(p.slug)
const I = {
  edit: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/></svg>',
  eye: '<svg viewBox="0 0 24 24"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  doc: '<svg viewBox="0 0 24 24"><path d="M5 4h11l3 3v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"/><path d="M8 10h8M8 14h8M8 18h5"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="m5 12 5 5 9-10"/></svg>',
  draft: '<svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
  x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  img: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/></svg>',
  ext: '<svg viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  warn: '<svg viewBox="0 0 24 24"><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg>',
  dl: '<svg viewBox="0 0 24 24"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>'
}

// ---------- notices ----------
function toast(msg, opts = {}) {
  const t = document.createElement('div')
  t.className = 'toast' + (opts.error ? ' err' : '')
  t.setAttribute('role', opts.error ? 'alert' : 'status')
  t.innerHTML = '<i>' + (opts.error ? I.x : I.check) + '</i><span>' + esc(msg) + '</span>' + (opts.link ? '<a href="' + esc(opts.link.href) + '" target="_blank" rel="noopener">' + esc(opts.link.text) + '</a>' : '')
  $('#toasts').appendChild(t)
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 260) }, opts.error ? 6000 : 3800)
}
// a confirmation (resolves true / false); for deleting, the action runs while the dialog shows it's busy
function ask({ title, text, yes = 'Delete', danger = true, action }) {
  return new Promise((resolve) => {
    const m = $('#modal'), y = $('#modal-yes'), n = $('#modal-no'), back = document.activeElement
    $('#modal-h').textContent = title; $('#modal-p').textContent = text
    $('#modal-ic').innerHTML = danger ? I.trash : I.warn; $('#modal-ic').className = 'modal-ic' + (danger ? '' : ' warn')
    y.className = 'btn ' + (danger ? 'btn-danger' : 'btn-primary'); $('.btn-t', y).textContent = yes
    m.hidden = false; setTimeout(() => n.focus(), 30)
    const done = (v) => { m.hidden = true; cleanup(); if (back && back.focus) back.focus(); resolve(v) }
    const onYes = async () => {
      if (!action) return done(true)
      y.classList.add('is-busy'); n.disabled = true
      try { await action(); y.classList.remove('is-busy'); n.disabled = false; done(true) } catch (e) { y.classList.remove('is-busy'); n.disabled = false; toast(e.message || 'Something went wrong.', { error: true }) }
    }
    const onNo = () => done(false)
    const onKey = (e) => { if (e.key === 'Escape') onNo(); if (e.key === 'Tab') { const f = [n, y]; const i = f.indexOf(document.activeElement); if (e.shiftKey && i <= 0) { e.preventDefault(); y.focus() } else if (!e.shiftKey && i === 1) { e.preventDefault(); n.focus() } } }
    const onBg = (e) => { if (e.target === m) onNo() }
    function cleanup() { y.removeEventListener('click', onYes); n.removeEventListener('click', onNo); document.removeEventListener('keydown', onKey); m.removeEventListener('click', onBg) }
    y.addEventListener('click', onYes); n.addEventListener('click', onNo); document.addEventListener('keydown', onKey); m.addEventListener('click', onBg)
  })
}
function busy(btn, on) { if (!btn) return; btn.classList.toggle('is-busy', on); btn.disabled = on }

// ---------- the article body: kept to simple formatting (the public page cleans it again) ----------
const ALLOWED = { P: 1, H2: 1, H3: 1, H4: 1, STRONG: 1, B: 1, EM: 1, I: 1, U: 1, A: 1, UL: 1, OL: 1, LI: 1, BLOCKQUOTE: 1, CODE: 1, PRE: 1, BR: 1, HR: 1 }
const RENAME = { H1: 'H2', H5: 'H4', H6: 'H4', DIV: 'P' }
function cleanHtml(html) {
  const doc = new DOMParser().parseFromString('<div>' + String(html || '') + '</div>', 'text/html')
  const root = doc.body.firstChild
  ;(function walk(n) {
    for (const c of Array.from(n.childNodes)) {
      if (c.nodeType === 3) continue
      if (c.nodeType !== 1 || /^(SCRIPT|STYLE|IFRAME|OBJECT|EMBED|TEMPLATE|SVG|MATH|META|LINK|TITLE)$/.test(c.tagName)) { c.remove(); continue }
      walk(c)
      let el = c
      if (RENAME[el.tagName]) { const r = doc.createElement(RENAME[el.tagName]); while (el.firstChild) r.appendChild(el.firstChild); el.replaceWith(r); el = r }
      if (!ALLOWED[el.tagName]) { while (el.firstChild) el.parentNode.insertBefore(el.firstChild, el); el.remove(); continue }
      for (const a of Array.from(el.attributes)) if (!(el.tagName === 'A' && a.name === 'href')) el.removeAttribute(a.name)
      if (el.tagName === 'A') { const h = (el.getAttribute('href') || '').trim(); if (!/^(https?:|mailto:|\/|#)/i.test(h)) el.removeAttribute('href') }
    }
  })(root)
  // well-formed blocks: a paragraph never holds a list or heading (the editor can nest them), and loose text at the
  // top level is wrapped in paragraphs
  const BLOCK = /^(P|H2|H3|H4|UL|OL|BLOCKQUOTE|PRE|HR)$/
  for (const p of Array.from(root.querySelectorAll('p'))) {
    if (Array.from(p.children).some((c) => BLOCK.test(c.tagName))) { while (p.firstChild) p.parentNode.insertBefore(p.firstChild, p); p.remove() }
  }
  let run = null
  for (const c of Array.from(root.childNodes)) {
    if (c.nodeType === 1 && BLOCK.test(c.tagName)) { run = null; continue }
    if (!run && ((c.nodeType === 3 && !c.textContent.trim()) || (c.nodeType === 1 && c.tagName === 'BR'))) { c.remove(); continue }
    if (!run) { run = doc.createElement('p'); root.insertBefore(run, c) }
    run.appendChild(c)
  }
  // tidy: no empty paragraphs at the ends
  let h = root.innerHTML.replace(/<p>(\s|&nbsp;|<br>)*<\/p>/g, '').trim()
  return h
}

// ---------- images: resized and compressed in the browser before they are saved ----------
const MAX_IN = 15 * 1024 * 1024, MAX_OUT = 900000 // (a stored image stays under Firestore's 1 MB per document)
function loadImage(file) {
  return new Promise((res, rej) => { const u = URL.createObjectURL(file), im = new Image(); im.onload = () => { URL.revokeObjectURL(u); res(im) }; im.onerror = () => { URL.revokeObjectURL(u); rej(new Error('This file couldn’t be read as an image.')) }; im.src = u })
}
async function compress(file) {
  if (!/^image\/(jpeg|png|webp|gif|avif)$/.test(file.type)) throw new Error('Please choose a JPG, PNG or WebP image.')
  if (file.size > MAX_IN) throw new Error('That image is over 15 MB. Please choose a smaller one.')
  const im = await loadImage(file)
  if (im.naturalWidth < 400) throw new Error('That image is too small (at least 400px wide works best).')
  let w = Math.min(1600, im.naturalWidth), h = Math.round(im.naturalHeight * w / im.naturalWidth)
  const c = document.createElement('canvas'), x = c.getContext('2d')
  const probe = c.toDataURL('image/webp').startsWith('data:image/webp') ? 'image/webp' : 'image/jpeg'
  for (let pass = 0; pass < 5; pass++) {
    c.width = w; c.height = h; x.fillStyle = '#FFF'; x.fillRect(0, 0, w, h); x.drawImage(im, 0, 0, w, h)
    for (const q of [0.84, 0.76, 0.68, 0.6, 0.52]) {
      const data = c.toDataURL(probe, q)
      if (data.length < MAX_OUT) return { data, w, h }
    }
    w = Math.round(w * 0.82); h = Math.round(h * 0.82)
  }
  throw new Error('That image couldn’t be made small enough. Please try another.')
}

// ---------- state ----------
let store = null, user = null, posts = [], loaded = false, current = null
const imgCache = new Map()
async function refresh() { posts = await store.listAll(); loaded = true; $('#side-count').textContent = posts.length || ''; return posts }
const sorted = (list) => list.slice().sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || '') || (b.updatedAt || 0) - (a.updatedAt || 0))
function thumbHtml(p) {
  if (p.imagePath) return '<span class="thumb"><img src="' + esc(p.imagePath) + '" alt="" loading="lazy"></span>'
  if (p.hasImage) { const d = imgCache.get(p.slug); return '<span class="thumb" data-thumb="' + esc(p.slug) + '">' + (d ? '<img src="' + d + '" alt="">' : '') + '</span>' }
  const c = p.cover ? p.cover.style : 'c' + (p.title.length % 3)
  return '<span class="thumb ' + esc(c) + '">' + esc((p.title || '?').trim().slice(0, 2).toUpperCase()) + '</span>'
}
function fillThumbs(root) {
  for (const el of $$('[data-thumb]', root)) {
    const slug = el.getAttribute('data-thumb')
    if (imgCache.has(slug)) continue
    store.getImage(slug).then((im) => { if (!im) return; imgCache.set(slug, im.data); for (const t of $$('[data-thumb="' + CSS.escape(slug) + '"]')) t.innerHTML = '<img src="' + im.data + '" alt="">' }).catch(() => {})
  }
}

// ---------- sign in ----------
function showLogin() {
  $('#boot').hidden = true; $('#app').hidden = true; $('#login').hidden = false
  document.title = 'Sign in · Ideaxcorp CMS'
  if (store.mode === 'mock') { const m = $('#login-mock'); m.hidden = false; m.textContent = 'Test mode (this computer only). Username “' + store.testLogin.username + '”, password “' + store.testLogin.password + '”.' }
  setTimeout(() => $('#lg-user').focus(), 50)
}
function setupLogin() {
  const f = $('#login-form'), u = $('#lg-user'), p = $('#lg-pass'), t = $('#lg-toggle'), sub = $('#lg-submit')
  t.addEventListener('click', () => {
    const show = p.type === 'password'; p.type = show ? 'text' : 'password'
    t.setAttribute('aria-pressed', String(show)); t.setAttribute('aria-label', show ? 'Hide password' : 'Show password'); p.focus()
  })
  const fieldErr = (input, msg) => { input.closest('.field').classList.toggle('has-err', !!msg); $('#' + input.id + '-err').textContent = msg || ''; input.setAttribute('aria-invalid', msg ? 'true' : 'false') }
  u.addEventListener('input', () => fieldErr(u, '')); p.addEventListener('input', () => fieldErr(p, ''))
  f.addEventListener('submit', async (e) => {
    e.preventDefault(); $('#lg-err').textContent = ''
    const un = u.value.trim(), pw = p.value
    let bad = false
    if (!un) { fieldErr(u, 'Enter your username.'); bad = true } else if (un.length < 3 || /\s/.test(un)) { fieldErr(u, 'That doesn’t look like a username.'); bad = true }
    if (!pw) { fieldErr(p, 'Enter your password.'); bad = true } else if (pw.length < 6) { fieldErr(p, 'Passwords are at least 6 characters.'); bad = true }
    if (bad) { f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake'); (u.getAttribute('aria-invalid') === 'true' ? u : p).focus(); return }
    busy(sub, true)
    try { await store.signIn(un, pw) } // (onAuth shows the studio)
    catch (err) { busy(sub, false); $('#lg-err').textContent = err.message; f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake'); p.select() }
  })
}
async function enter(u) {
  try { await refresh() } catch (e) {
    await store.signOut()
    showLogin(); busy($('#lg-submit'), false)
    $('#lg-err').textContent = e.code === 'denied' ? 'This account doesn’t have admin access.' : 'Couldn’t load the posts: ' + e.message
    return
  }
  user = u
  busy($('#lg-submit'), false); $('#lg-pass').value = ''
  $('#boot').hidden = true; $('#login').hidden = true; $('#app').hidden = false
  $('#me-name').textContent = u.name; $('#me-av').textContent = u.name.slice(0, 1)
  $('#me-mode').textContent = store.mode === 'mock' ? 'Test mode' : 'Administrator'
  $('#mock-bar').hidden = store.mode !== 'mock'
  if (!location.hash || location.hash === '#' || location.hash === '#/') history.replaceState(null, '', '#/dashboard')
  route()
}

// ---------- routing ----------
let leaving = false
async function guard() {
  if (!current || !current.dirty()) return true
  return ask({ title: 'Discard unsaved changes?', text: 'You have changes to this post that haven’t been saved.', yes: 'Discard', danger: false })
}
let lastHash = location.hash
window.addEventListener('hashchange', async () => {
  if (leaving) { leaving = false; return }
  if (!user) return
  if (!(await guard())) { leaving = true; location.hash = lastHash; return }
  route()
})
window.addEventListener('beforeunload', (e) => { if (current && current.dirty()) { e.preventDefault(); e.returnValue = '' } })
function setTop({ crumb = '', title = '', actions = '' }) {
  $('#crumb').innerHTML = crumb; $('#top-h').textContent = title; $('#top-actions').innerHTML = actions
  document.title = title + ' · Ideaxcorp CMS'
}
function route() {
  lastHash = location.hash
  current = null
  const h = location.hash.replace(/^#\/?/, '').split('?')[0], [name, arg] = h.split('/')
  for (const a of $$('.side-nav a')) a.classList.toggle('on', a.dataset.nav === (name === 'edit' ? 'posts' : name))
  closeMenu()
  const v = $('#view'); v.classList.remove('enter'); void v.offsetWidth; v.classList.add('enter')
  window.scrollTo(0, 0)
  if (name === 'posts') return viewPosts()
  if (name === 'new') return viewEditor(null)
  if (name === 'edit' && arg) return viewEditor(decodeURIComponent(arg))
  return viewDashboard()
}

// ---------- dashboard ----------
function viewDashboard() {
  const pub = posts.filter((p) => p.status === 'published').length, dr = posts.length - pub
  const recent = posts.slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0) || (b.publishedAt || '').localeCompare(a.publishedAt || '')).slice(0, 6)
  const missing = LEGACY.filter((l) => !posts.some((p) => p.slug === l.slug))
  const hour = new Date().getHours()
  setTop({ crumb: 'Overview', title: 'Dashboard', actions: '<a class="btn btn-primary" href="#/new">' + I.plus + '<span>New post</span></a>' })
  $('#view').innerHTML =
    '<div class="hello"><div><h2>Good ' + (hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening') + ', ' + esc(user.name) + '.</h2><p>Here’s what’s on the Ideaxcorp blog.</p></div></div>' +
    '<div class="stats">' +
      '<a class="card stat t" href="#/posts"><span class="stat-k"><span class="stat-ic">' + I.doc + '</span>Total posts</span><p class="stat-n">' + posts.length + '</p><p class="stat-s">All articles in the CMS</p></a>' +
      '<a class="card stat p" href="#/posts?status=published"><span class="stat-k"><span class="stat-ic">' + I.check + '</span>Published</span><p class="stat-n">' + pub + '</p><p class="stat-s">Live on the blog</p></a>' +
      '<a class="card stat d" href="#/posts?status=draft"><span class="stat-k"><span class="stat-ic">' + I.draft + '</span>Drafts</span><p class="stat-n">' + dr + '</p><p class="stat-s">Only visible here</p></a>' +
    '</div>' +
    '<div class="dash-grid">' +
      '<section class="card"><div class="card-h"><h2>Recently added</h2><a class="btn btn-text" href="#/posts">View all</a></div>' +
        (recent.length ? '<ul class="recent">' + recent.map((p) => '<li><a href="#/edit/' + encodeURIComponent(p.slug) + '">' + thumbHtml(p) + '<span class="recent-t"><b>' + esc(p.title) + '</b><span>' + esc(CATS[p.category] || '') + ' · ' + (p.createdAt ? 'added ' + ago(p.createdAt) : fmtDate(p.publishedAt)) + '</span></span><span class="pill ' + p.status + '">' + (p.status === 'published' ? 'Published' : 'Draft') + '</span></a></li>').join('') + '</ul>'
          : '<div class="empty"><div class="empty-ic">' + I.doc + '</div><h3>No posts yet</h3><p>Write your first article, or bring in the existing ones.</p><a class="btn btn-primary" href="#/new">' + I.plus + 'New post</a></div>') +
      '</section>' +
      '<div class="quick">' +
        '<a class="quick-new" href="#/new"><span class="qi">' + I.plus + '</span><span><b>Write a new post</b><span>Draft it, preview it, publish when ready.</span></span></a>' +
        (missing.length ? '<div class="import" id="import"><h3>Bring in the existing articles</h3><p>' + missing.length + ' article' + (missing.length > 1 ? 's are' : ' is') + ' on the blog page but not in the CMS yet. Import ' + (missing.length > 1 ? 'them' : 'it') + ' once to manage every article here.</p><button type="button" class="btn btn-primary" id="import-btn"><span class="spin" aria-hidden="true"></span>' + I.dl + '<span class="btn-t">Import ' + missing.length + ' article' + (missing.length > 1 ? 's' : '') + '</span></button></div>' : '') +
        '<div class="card tip"><h3>Publishing checklist</h3><ol><li>A clear title and a short excerpt</li><li>A featured image (wide works best)</li><li>Category and topic</li><li>SEO title and description</li><li>Preview, then publish</li></ol></div>' +
      '</div>' +
    '</div>'
  fillThumbs($('#view'))
  const ib = $('#import-btn')
  if (ib) ib.addEventListener('click', async () => {
    busy(ib, true)
    try { await store.importMany(missing); await refresh(); toast('Imported ' + missing.length + ' article' + (missing.length > 1 ? 's' : '') + '.'); viewDashboard() }
    catch (e) { busy(ib, false); toast(e.message, { error: true }) }
  })
}

// ---------- all posts ----------
function viewPosts() {
  const q0 = new URLSearchParams(location.hash.split('?')[1] || '')
  let filter = ['published', 'draft'].includes(q0.get('status')) ? q0.get('status') : 'all', query = ''
  setTop({ crumb: '<a href="#/dashboard">Dashboard</a> / Posts', title: 'All posts', actions: '<a class="btn btn-primary" href="#/new">' + I.plus + '<span>New post</span></a>' })
  $('#view').innerHTML =
    '<section class="card">' +
      '<div class="toolbar"><label class="search"><span class="sr">Search posts</span>' + I.search + '<input class="input" type="search" id="q" placeholder="Search by title, slug, category or topic" autocomplete="off"></label>' +
      '<div class="seg" role="group" aria-label="Filter by status"><button type="button" data-f="all">All <b></b></button><button type="button" data-f="published">Published <b></b></button><button type="button" data-f="draft">Drafts <b></b></button></div></div>' +
      '<div id="list"></div>' +
    '</section>'
  const counts = () => { const pub = posts.filter((p) => p.status === 'published').length; const b = $$('.seg b'); b[0].textContent = posts.length; b[1].textContent = pub; b[2].textContent = posts.length - pub }
  function draw() {
    for (const b of $$('.seg button')) b.setAttribute('aria-pressed', String(b.dataset.f === filter))
    counts()
    const ql = query.toLowerCase()
    const list = sorted(posts).filter((p) => (filter === 'all' || p.status === filter) && (!ql || [p.title, p.slug, CATS[p.category], p.topic, p.author].join(' ').toLowerCase().includes(ql)))
    const box = $('#list')
    if (!posts.length) { box.innerHTML = '<div class="empty"><div class="empty-ic">' + I.doc + '</div><h3>No posts yet</h3><p>Your articles will be listed here.</p><a class="btn btn-primary" href="#/new">' + I.plus + 'New post</a></div>'; return }
    if (!list.length) { box.innerHTML = '<div class="empty"><div class="empty-ic">' + I.search + '</div><h3>No matching posts</h3><p>Try another search or filter.</p></div>'; return }
    box.innerHTML = '<table class="table"><thead><tr><th>Post</th><th class="t-col-cat">Category</th><th>Status</th><th>Date</th><th class="t-col-upd">Updated</th><th><span class="sr">Actions</span></th></tr></thead><tbody>' +
      list.map((p) => '<tr data-slug="' + esc(p.slug) + '">' +
        '<td class="t-col-post"><div class="t-post">' + thumbHtml(p) + '<div style="min-width:0"><a href="#/edit/' + encodeURIComponent(p.slug) + '">' + esc(p.title) + '</a><span class="t-slug">/' + esc(p.slug) + (p.externalUrl ? '<span class="ext">' + I.ext + 'ideaxcorp.com</span>' : '') + '</span></div></div></td>' +
        '<td class="t-col-cat"><span class="tag">' + esc(CATS[p.category] || p.category) + '</span></td>' +
        '<td class="t-col-status"><span class="pill ' + p.status + '">' + (p.status === 'published' ? 'Published' : 'Draft') + '</span></td>' +
        '<td class="t-col-date"><span class="t-date">' + fmtDate(p.publishedAt) + '</span></td>' +
        '<td class="t-col-upd"><span class="t-date"><small>' + esc(ago(p.updatedAt)) + '</small></span></td>' +
        '<td class="t-col-act"><div class="t-act">' +
          '<a class="icon-btn" href="#/edit/' + encodeURIComponent(p.slug) + '" aria-label="Edit ' + esc(p.title) + '" title="Edit">' + I.edit + '</a>' +
          '<button type="button" class="icon-btn" data-act="view" aria-label="' + (p.status === 'published' ? 'View' : 'Preview') + ' ' + esc(p.title) + '" title="' + (p.status === 'published' ? 'View on the blog' : 'Preview') + '">' + I.eye + '</button>' +
          '<button type="button" class="icon-btn danger" data-act="del" aria-label="Delete ' + esc(p.title) + '" title="Delete">' + I.trash + '</button>' +
        '</div></td></tr>').join('') + '</tbody></table>'
    fillThumbs(box)
  }
  $('.seg').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { filter = b.dataset.f; draw() } })
  $('#q').addEventListener('input', (e) => { query = e.target.value.trim(); draw() })
  $('#list').addEventListener('click', async (e) => {
    const b = e.target.closest('[data-act]'); if (!b) return
    const p = posts.find((x) => x.slug === b.closest('tr').dataset.slug); if (!p) return
    if (b.dataset.act === 'view') {
      if (p.status === 'published') window.open(postUrl(p), '_blank', 'noopener')
      else { const im = p.hasImage ? await store.getImage(p.slug).catch(() => null) : null; openPreview(p, im && im.data) }
    }
    if (b.dataset.act === 'del') {
      await ask({ title: 'Delete “' + p.title + '”?', text: 'It will be removed from the blog and from the CMS. This can’t be undone.', action: async () => { await store.remove(p.slug); imgCache.delete(p.slug); await refresh() } }) && (toast('Post deleted.'), draw())
    }
  })
  draw()
}

// ---------- preview ----------
function openPreview(p, imageData) {
  try { localStorage.setItem('ixblog-preview', JSON.stringify({ ...p, imageData: imageData || null })) } catch (e) { toast('The preview is too large for this browser’s storage.', { error: true }); return }
  window.open('/blog/post/?preview=1', '_blank', 'noopener')
}

// ---------- the editor ----------
async function viewEditor(slug) {
  const isNew = !slug
  setTop({ crumb: '<a href="#/dashboard">Dashboard</a> / <a href="#/posts">Posts</a>', title: isNew ? 'New post' : 'Edit post' })
  $('#view').innerHTML = '<div class="card"><div class="skel-row"></div><div class="skel-row"></div><div class="skel-row"></div></div>'
  let post
  if (isNew) post = { title: '', slug: '', excerpt: '', content: '', category: 'digital-marketing', alsoIn: [], topic: '', author: 'Ideaxcorp Team', publishedAt: today(), seoTitle: '', seoDescription: '', status: 'draft', hasImage: false }
  else {
    try { post = await store.get(slug) } catch (e) { toast(e.message, { error: true }) }
    if (!post) { setTop({ crumb: '<a href="#/posts">Posts</a>', title: 'Not found' }); $('#view').innerHTML = '<div class="card empty"><div class="empty-ic">' + I.doc + '</div><h3>This post doesn’t exist</h3><p>It may have been deleted or renamed.</p><a class="btn btn-ghost" href="#/posts">Back to all posts</a></div>'; return }
  }
  let image // undefined = unchanged, null = removed, { data, w, h } = new
  let imgSrc = post.imagePath || null
  if (post.hasImage && !post.imagePath) { try { const im = await store.getImage(post.slug); if (im) { imgSrc = im.data; imgCache.set(post.slug, im.data) } } catch (e) {} }
  const origSlug = isNew ? null : post.slug
  let slugTouched = !isNew, saving = false
  setTop({
    crumb: '<a href="#/dashboard">Dashboard</a> / <a href="#/posts">Posts</a>', title: isNew ? 'New post' : post.title || 'Untitled',
    actions: '<span class="pill ' + post.status + '" id="ed-pill">' + (post.status === 'published' ? 'Published' : 'Draft') + '</span><button type="button" class="btn btn-ghost" id="ed-prev">' + I.eye + '<span class="btn-t-long">Preview</span></button>'
  })
  const catOpts = Object.entries(CATS).map(([k, v]) => '<option value="' + k + '"' + (post.category === k ? ' selected' : '') + '>' + v + '</option>').join('')
  const also = Object.entries(CATS).map(([k, v]) => '<label class="chip"><input type="checkbox" value="' + k + '"' + ((post.alsoIn || []).includes(k) ? ' checked' : '') + '><span>' + v + '</span></label>').join('')
  $('#view').innerHTML =
    '<form class="ed" id="ed" novalidate>' +
      '<div class="card ed-main">' +
        (post.externalUrl ? '<p class="ed-note">This article’s full text is on ideaxcorp.com: <a href="' + esc(post.externalUrl) + '" target="_blank" rel="noopener">' + esc(post.externalUrl) + '</a>. Its card on the blog links there. Write the article below to publish it on this site instead.</p>' : '') +
        '<div class="field" data-f="title"><label class="sr" for="f-title">Title</label><textarea id="f-title" class="ed-title" rows="1" maxlength="' + LIMITS.title + '" placeholder="Post title">' + esc(post.title) + '</textarea><p class="field-err"></p></div>' +
        '<div class="field" data-f="slug" style="margin-bottom:0"><div class="slug"><span>/blog/post/?s=</span><input id="f-slug" value="' + esc(post.slug) + '" maxlength="' + LIMITS.slug + '" spellcheck="false" aria-label="Slug"><button type="button" id="slug-gen" title="Make the slug from the title">Regenerate</button></div><p class="field-err" style="margin:-14px 0 16px"></p></div>' +
        '<div class="field" data-f="excerpt"><label for="f-excerpt">Excerpt <small><span class="count" id="c-excerpt"></span></small></label><textarea id="f-excerpt" rows="3" maxlength="' + LIMITS.excerpt + '" placeholder="One or two sentences for the blog card and the top of the article.">' + esc(post.excerpt) + '</textarea><p class="field-err"></p></div>' +
        '<div class="field" data-f="content"><span class="lbl">Content</span>' +
          '<div class="rte"><div class="rte-bar" role="toolbar" aria-label="Formatting">' +
            '<select data-cmd="block" aria-label="Text style"><option value="p">Paragraph</option><option value="h2">Heading 2</option><option value="h3">Heading 3</option><option value="h4">Heading 4</option></select><span class="rte-sep"></span>' +
            '<button type="button" data-cmd="bold" title="Bold (Ctrl+B)" aria-label="Bold"><b>B</b></button><button type="button" data-cmd="italic" title="Italic (Ctrl+I)" aria-label="Italic"><i style="font-family:Georgia,serif">I</i></button><button type="button" data-cmd="underline" title="Underline (Ctrl+U)" aria-label="Underline"><u>U</u></button><span class="rte-sep"></span>' +
            '<button type="button" data-cmd="insertUnorderedList" title="Bulleted list" aria-label="Bulleted list"><svg viewBox="0 0 24 24"><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1" fill="currentColor"/><circle cx="4.5" cy="12" r="1" fill="currentColor"/><circle cx="4.5" cy="18" r="1" fill="currentColor"/></svg></button>' +
            '<button type="button" data-cmd="insertOrderedList" title="Numbered list" aria-label="Numbered list"><svg viewBox="0 0 24 24"><path d="M10 6h10M10 12h10M10 18h10M4 5h1v4M4 9h2M4 15.5c0-.8.6-1.5 1.5-1.5s1.5.6 1.5 1.3c0 1.2-3 1.7-3 3.7h3"/></svg></button>' +
            '<button type="button" data-cmd="blockquote" title="Quote" aria-label="Quote"><svg viewBox="0 0 24 24"><path d="M7 7H4v6h3l-1 4M17 7h-3v6h3l-1 4"/></svg></button>' +
            '<button type="button" data-cmd="pre" title="Code block" aria-label="Code block"><svg viewBox="0 0 24 24"><path d="m8 8-4 4 4 4M16 8l4 4-4 4"/></svg></button><span class="rte-sep"></span>' +
            '<button type="button" data-cmd="link" title="Link (Ctrl+K)" aria-label="Link"><svg viewBox="0 0 24 24"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg></button>' +
            '<button type="button" data-cmd="unlink" title="Remove link" aria-label="Remove link"><svg viewBox="0 0 24 24"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7M4 4l16 16"/></svg></button>' +
            '<button type="button" data-cmd="insertHorizontalRule" title="Divider" aria-label="Divider"><svg viewBox="0 0 24 24"><path d="M4 12h16"/></svg></button>' +
            '<button type="button" data-cmd="removeFormat" title="Clear formatting" aria-label="Clear formatting"><svg viewBox="0 0 24 24"><path d="M6 5h12M12 5l-3 14M4 20l16-16" /></svg></button><span class="rte-sep"></span>' +
            '<button type="button" data-cmd="undo" title="Undo (Ctrl+Z)" aria-label="Undo"><svg viewBox="0 0 24 24"><path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/></svg></button><button type="button" data-cmd="redo" title="Redo (Ctrl+Y)" aria-label="Redo"><svg viewBox="0 0 24 24"><path d="m15 14 5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h3"/></svg></button>' +
          '</div><div class="rte-doc" id="f-content" contenteditable="true" role="textbox" aria-multiline="true" aria-label="Content" data-placeholder="Start writing your article…"></div>' +
          '<div class="rte-foot"><span id="c-words"></span><span>Paste from Docs or Word keeps headings, lists and links.</span></div></div><p class="field-err"></p></div>' +
      '</div>' +
      '<aside class="ed-side">' +
        '<section class="card panel"><h3>Publish</h3>' +
          '<div class="publish-row"><span>Status</span><span class="pill ' + post.status + '" id="ed-pill2">' + (post.status === 'published' ? 'Published' : 'Draft') + '</span></div>' +
          '<div class="field" data-f="publishedAt"><label for="f-date">Publish date</label><input id="f-date" type="date" value="' + esc(post.publishedAt) + '" required><p class="field-err"></p></div>' +
          '<p class="form-err" id="ed-err" role="alert"></p>' +
          '<div class="publish-btns">' +
            '<button type="button" class="btn btn-primary" id="ed-publish"><span class="spin" aria-hidden="true"></span><span class="btn-t">' + (post.status === 'published' ? 'Update' : 'Publish') + '</span></button>' +
            '<button type="button" class="btn btn-ghost" id="ed-draft"><span class="spin" aria-hidden="true"></span><span class="btn-t">' + (post.status === 'published' ? 'Unpublish' : 'Save draft') + '</span></button>' +
            '<button type="button" class="btn btn-ghost" id="ed-prev2">' + I.eye + 'Preview</button>' +
          '</div>' +
          '<p class="saved-at" id="saved-at">' + (isNew ? 'Not saved yet' : 'Last saved ' + esc(ago(post.updatedAt))) + '</p>' +
          (isNew ? '' : '<button type="button" class="btn btn-text" id="ed-del" style="width:100%;color:var(--red);margin-bottom:12px">' + I.trash + 'Delete post</button>') +
        '</section>' +
        '<section class="card panel"><h3>Featured image</h3><div id="imgzone"></div><p class="field-err" id="img-err" style="margin:-6px 0 12px"></p></section>' +
        '<section class="card panel"><h3>Organisation</h3>' +
          '<div class="field" data-f="category"><label for="f-cat">Category</label><select id="f-cat">' + catOpts + '</select><p class="field-err"></p></div>' +
          '<div class="field"><span class="lbl">Also list under <small>optional</small></span><div class="chips" id="f-also">' + also + '</div></div>' +
          '<div class="field" data-f="topic"><label for="f-topic">Topic tag <small><span class="count" id="c-topic"></span></small></label><input id="f-topic" value="' + esc(post.topic) + '" maxlength="' + LIMITS.topic + '" placeholder="e.g. SEO, AI search"><p class="field-err"></p></div>' +
          '<div class="field" data-f="author"><label for="f-author">Author</label><input id="f-author" value="' + esc(post.author) + '" maxlength="' + LIMITS.author + '" autocomplete="off"><p class="field-err"></p></div>' +
        '</section>' +
        '<section class="card panel"><h3>SEO</h3>' +
          '<div class="serp" aria-hidden="true"><div class="serp-u" id="serp-u"></div><div class="serp-t" id="serp-t"></div><div class="serp-d" id="serp-d"></div></div>' +
          '<div class="field" data-f="seoTitle"><label for="f-seot">SEO title <small><span class="count" id="c-seot"></span></small></label><input id="f-seot" value="' + esc(post.seoTitle) + '" maxlength="' + (LIMITS.seoTitle + 30) + '" placeholder="Defaults to the post title"><p class="field-err"></p></div>' +
          '<div class="field" data-f="seoDescription"><label for="f-seod">SEO description <small><span class="count" id="c-seod"></span></small></label><textarea id="f-seod" rows="3" maxlength="' + (LIMITS.seoDescription + 60) + '" placeholder="Defaults to the excerpt">' + esc(post.seoDescription) + '</textarea><p class="field-err"></p></div>' +
        '</section>' +
      '</aside>' +
    '</form>'

  const F = { title: $('#f-title'), slug: $('#f-slug'), excerpt: $('#f-excerpt'), content: $('#f-content'), date: $('#f-date'), cat: $('#f-cat'), topic: $('#f-topic'), author: $('#f-author'), seot: $('#f-seot'), seod: $('#f-seod') }
  F.content.innerHTML = cleanHtml(post.content)
  try { document.execCommand('defaultParagraphSeparator', false, 'p') } catch (e) {}

  // the values in the form, as a post
  function read() {
    return {
      ...post,
      title: F.title.value.replace(/\s+/g, ' ').trim(), slug: F.slug.value.trim(), excerpt: F.excerpt.value.replace(/\s+/g, ' ').trim(),
      content: cleanHtml(F.content.innerHTML), category: F.cat.value, alsoIn: $$('#f-also input:checked').map((i) => i.value).filter((v) => v !== F.cat.value),
      topic: F.topic.value.trim(), author: F.author.value.trim() || 'Ideaxcorp Team', publishedAt: F.date.value,
      seoTitle: F.seot.value.trim(), seoDescription: F.seod.value.replace(/\s+/g, ' ').trim()
    }
  }
  const snapshot = () => JSON.stringify(read()) + '|' + (image === undefined ? 'same' : image ? image.data.length : 'none')
  let saved = snapshot()
  current = { dirty: () => !saving && snapshot() !== saved }

  // counters, the SEO snippet, the title's height
  function counter(el, out, max) { const n = el.value.length; out.textContent = n + ' / ' + max; out.className = 'count' + (n > max ? ' over' : n > 0 && n >= max * 0.6 ? ' good' : '') }
  function seo() {
    const p = read()
    $('#serp-u').textContent = SITE.replace(/^https?:\/\//, '') + ' › blog › ' + (p.slug || 'your-post')
    $('#serp-t').textContent = (p.seoTitle || p.title || 'Post title') + (p.seoTitle ? '' : ' | Ideaxcorp')
    $('#serp-d').textContent = p.seoDescription || p.excerpt || 'Your description shows here in search results.'
    counter(F.seot, $('#c-seot'), LIMITS.seoTitle); counter(F.seod, $('#c-seod'), LIMITS.seoDescription)
    counter(F.excerpt, $('#c-excerpt'), LIMITS.excerpt); counter(F.topic, $('#c-topic'), LIMITS.topic)
  }
  function growTitle() { F.title.style.height = 'auto'; F.title.style.height = F.title.scrollHeight + 'px' }
  function words() { const n = wordsOf(F.content.innerHTML); $('#c-words').textContent = n + ' word' + (n === 1 ? '' : 's') + ' · ' + Math.max(1, Math.round(n / 220)) + ' min read' }
  F.title.addEventListener('input', () => {
    growTitle()
    if (!slugTouched) F.slug.value = slugify(F.title.value)
    $('#top-h').textContent = F.title.value.trim() || (isNew ? 'New post' : 'Untitled')
    clearErr('title'); clearErr('slug'); seo()
  })
  F.title.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); F.excerpt.focus() } })
  F.slug.addEventListener('input', () => { slugTouched = true; clearErr('slug'); seo() })
  F.slug.addEventListener('blur', () => { if (F.slug.value) F.slug.value = slugify(F.slug.value) ; seo() })
  $('#slug-gen').addEventListener('click', () => { F.slug.value = slugify(F.title.value); slugTouched = false; clearErr('slug'); seo() })
  for (const el of [F.excerpt, F.seot, F.seod, F.topic, F.author, F.date, F.cat]) el.addEventListener('input', () => { clearErr(el.closest('.field') && el.closest('.field').dataset.f); seo() })
  F.cat.addEventListener('change', () => { for (const i of $$('#f-also input')) { i.disabled = i.value === F.cat.value; if (i.disabled) i.checked = false } })
  F.cat.dispatchEvent(new Event('change'))
  growTitle(); seo(); words()
  if (isNew) setTimeout(() => F.title.focus(), 60)

  // ---- rich text ----
  const bar = $('.rte-bar'), blockSel = $('[data-cmd="block"]', bar)
  function exec(cmd, val) { F.content.focus(); document.execCommand(cmd, false, val); sync() }
  function inDoc() { const s = getSelection(); return s.rangeCount && F.content.contains(s.anchorNode) }
  function sync() {
    if (!inDoc()) return
    for (const c of ['bold', 'italic', 'underline', 'insertUnorderedList', 'insertOrderedList']) { const b = $('[data-cmd="' + c + '"]', bar); if (b) b.classList.toggle('on', document.queryCommandState(c)) }
    let n = getSelection().anchorNode; if (n && n.nodeType === 3) n = n.parentNode
    const blk = n && n.closest ? n.closest('h2,h3,h4,p,blockquote,pre,li') : null, tag = blk ? blk.tagName.toLowerCase() : 'p'
    blockSel.value = ['h2', 'h3', 'h4'].includes(tag) ? tag : 'p'
    $('[data-cmd="blockquote"]', bar).classList.toggle('on', !!(n && n.closest && n.closest('blockquote')))
    $('[data-cmd="pre"]', bar).classList.toggle('on', !!(n && n.closest && n.closest('pre')))
  }
  bar.addEventListener('mousedown', (e) => { if (e.target.closest('button')) e.preventDefault() }) // (keeps the selection)
  bar.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return
    const c = b.dataset.cmd
    if (c === 'link') return linkPop()
    if (c === 'blockquote' || c === 'pre') { const on = b.classList.contains('on'); return exec('formatBlock', on ? 'p' : c) }
    exec(c)
  })
  blockSel.addEventListener('change', () => exec('formatBlock', blockSel.value))
  document.addEventListener('selectionchange', sync)
  F.content.addEventListener('input', () => { words(); clearErr('content') })
  F.content.addEventListener('paste', (e) => {
    e.preventDefault()
    const html = e.clipboardData.getData('text/html'), text = e.clipboardData.getData('text/plain')
    const clean = html ? cleanHtml(html) : esc(text).split(/\n{2,}/).map((p) => '<p>' + p.replace(/\n/g, '<br>') + '</p>').join('')
    document.execCommand('insertHTML', false, clean); words()
  })
  F.content.addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); linkPop() } })
  function linkPop() {
    const s = getSelection(); if (!inDoc() || !s.rangeCount) { F.content.focus(); return }
    const range = s.getRangeAt(0).cloneRange(), r = range.getBoundingClientRect()
    let a = s.anchorNode; if (a && a.nodeType === 3) a = a.parentNode; a = a && a.closest ? a.closest('a') : null
    const pop = document.createElement('div'); pop.className = 'linkpop'
    pop.innerHTML = '<input type="url" placeholder="https://…" aria-label="Link address" value="' + esc(a ? a.getAttribute('href') : '') + '"><button type="button" class="btn btn-primary">Apply</button>'
    document.body.appendChild(pop)
    pop.style.left = Math.max(8, Math.min(innerWidth - pop.offsetWidth - 8, r.left + scrollX)) + 'px'; pop.style.top = (r.bottom + scrollY + 8) + 'px'
    const inp = $('input', pop); inp.focus(); inp.select()
    const close = () => { pop.remove(); document.removeEventListener('mousedown', outside, true) }
    const outside = (e) => { if (!pop.contains(e.target)) close() }
    const apply = () => {
      let u = inp.value.trim(); close()
      F.content.focus(); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(range)
      if (!u) { document.execCommand('unlink'); return }
      if (!/^(https?:|mailto:|\/|#)/i.test(u)) u = 'https://' + u
      if (range.collapsed && !a) document.execCommand('insertHTML', false, '<a href="' + esc(u) + '">' + esc(u) + '</a>')
      else document.execCommand('createLink', false, u)
      sync()
    }
    $('button', pop).addEventListener('click', apply)
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); apply() } if (e.key === 'Escape') { close(); F.content.focus() } })
    setTimeout(() => document.addEventListener('mousedown', outside, true), 0)
  }

  // ---- the featured image ----
  function drawImage() {
    const z = $('#imgzone')
    if (imgSrc) {
      z.innerHTML = '<div class="imgbox"><img src="' + esc(imgSrc) + '" alt="Featured image preview"><div class="imgbox-bar"><button type="button" id="img-change">Replace</button><button type="button" id="img-remove">Remove</button></div>' + (image ? '<span class="imgbox-meta">' + image.w + '×' + image.h + ' · ' + Math.round(image.data.length * 0.75 / 1024) + ' KB</span>' : '') + '</div>'
      $('#img-change').addEventListener('click', () => pick())
      $('#img-remove').addEventListener('click', () => { image = null; imgSrc = null; drawImage() })
    } else {
      z.innerHTML = '<label class="drop" id="drop"><span class="di">' + I.img + '</span><b>Upload an image</b><span>Drag it here or click to choose<br>JPG, PNG or WebP · wide works best</span><input type="file" accept="image/jpeg,image/png,image/webp" id="img-file" aria-label="Upload a featured image"></label>'
      const d = $('#drop'), inp = $('#img-file')
      inp.addEventListener('change', () => inp.files[0] && take(inp.files[0]))
      d.addEventListener('dragover', (e) => { e.preventDefault(); d.classList.add('over') })
      d.addEventListener('dragleave', () => d.classList.remove('over'))
      d.addEventListener('drop', (e) => { e.preventDefault(); d.classList.remove('over'); const f = e.dataTransfer.files[0]; if (f) take(f) })
    }
  }
  function pick() { const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/jpeg,image/png,image/webp'; i.onchange = () => i.files[0] && take(i.files[0]); i.click() }
  async function take(file) {
    $('#img-err').textContent = ''
    const d = $('#drop'); if (d) { d.classList.add('busy'); d.querySelector('b').textContent = 'Optimising…' }
    try { image = await compress(file); imgSrc = image.data; drawImage() }
    catch (e) { $('#img-err').textContent = e.message; drawImage() }
  }
  drawImage()

  // ---- checking, saving ----
  function setErr(f, msg) { const el = $('[data-f="' + f + '"]'); if (!el) return; el.classList.add('has-err'); $('.field-err', el).textContent = msg }
  function clearErr(f) { if (!f) return; const el = $('[data-f="' + f + '"]'); if (!el) return; el.classList.remove('has-err'); $('.field-err', el).textContent = ''; $('#ed-err').textContent = '' }
  function validate(p, status) {
    for (const el of $$('.ed .field.has-err')) { el.classList.remove('has-err'); $('.field-err', el).textContent = '' }
    const errs = {}
    if (!p.title) errs.title = 'Give the post a title.'
    else if (p.title.length > LIMITS.title) errs.title = 'Keep the title under ' + LIMITS.title + ' characters.'
    if (!p.slug) errs.slug = 'The slug can’t be empty.'
    else if (!SLUG_RE.test(p.slug)) errs.slug = 'Use lowercase letters, numbers and single dashes only.'
    else if (posts.some((x) => x.slug === p.slug && x.slug !== origSlug)) errs.slug = 'Another post already uses this slug.'
    if (!/^\d{4}-\d{2}-\d{2}$/.test(p.publishedAt)) errs.publishedAt = 'Choose a date.'
    if (!CATS[p.category]) errs.category = 'Choose a category.'
    if (p.seoTitle.length > LIMITS.seoTitle + 30) errs.seoTitle = 'Too long for search results.'
    if (p.seoDescription.length > LIMITS.seoDescription + 60) errs.seoDescription = 'Too long for search results.'
    if (status === 'published') {
      if (!p.excerpt) errs.excerpt = 'Add an excerpt; it shows on the blog card.'
      if (!p.content && !p.externalUrl) errs.content = 'Write the article before publishing.'
      else if (p.content && wordsOf(p.content) < 30 && !p.externalUrl) errs.content = 'The article is very short (under 30 words).'
    }
    for (const [k, v] of Object.entries(errs)) setErr(k, v)
    const first = Object.keys(errs)[0]
    if (first) {
      const el = $('[data-f="' + first + '"]'); el.scrollIntoView({ block: 'center', behavior: 'smooth' })
      const f = $('input,textarea,select,[contenteditable]', el); if (f) setTimeout(() => f.focus({ preventScroll: true }), 250)
      $('#ed-err').textContent = Object.keys(errs).length === 1 ? 'Please fix the highlighted field.' : 'Please fix the ' + Object.keys(errs).length + ' highlighted fields.'
    }
    return !first
  }
  async function save(status, btn) {
    if (saving) return
    const p = read(); p.status = status
    if (p.slug && !SLUG_RE.test(p.slug)) { p.slug = slugify(p.slug); F.slug.value = p.slug }
    if (!p.slug && p.title) { p.slug = slugify(p.title); F.slug.value = p.slug }
    if (!validate(p, status)) return
    if (image) { p.hasImage = true; p.imageW = image.w; p.imageH = image.h; delete p.imagePath }
    else if (image === null) { p.hasImage = false; delete p.imageW; delete p.imageH; delete p.imagePath }
    else p.hasImage = !!post.hasImage
    delete p.createdAt; delete p.updatedAt
    saving = true; busy(btn, true)
    try {
      const out = await store.save(p, image, origSlug)
      if (image) imgCache.set(out.slug, image.data)
      if (image === null) imgCache.delete(out.slug)
      await refresh()
      saving = false; saved = snapshot()
      const was = post.status
      toast(status === 'published' ? (was === 'published' ? 'Changes published.' : 'Post published.') : (was === 'published' ? 'Post unpublished and saved as a draft.' : 'Draft saved.'),
        status === 'published' ? { link: { href: postUrl(out), text: 'View' } } : {})
      current = null
      if (isNew || out.slug !== origSlug) { leaving = true; location.hash = '#/edit/' + encodeURIComponent(out.slug); leaving = false }
      viewEditor(out.slug)
    } catch (e) {
      saving = false; busy(btn, false)
      if (e.code === 'slug-taken') setErr('slug', e.message)
      $('#ed-err').textContent = e.message || 'Couldn’t save. Please try again.'
      toast('Couldn’t save: ' + (e.message || 'error'), { error: true })
    }
  }
  $('#ed-publish').addEventListener('click', (e) => save('published', e.currentTarget))
  $('#ed-draft').addEventListener('click', (e) => save('draft', e.currentTarget))
  const prev = () => { const p = read(); p.status = post.status; openPreview(p, imgSrc && imgSrc.startsWith('data:') ? imgSrc : null) }
  $('#ed-prev').addEventListener('click', prev); $('#ed-prev2').addEventListener('click', prev)
  $('#ed').addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(post.status === 'published' ? 'published' : 'draft', post.status === 'published' ? $('#ed-publish') : $('#ed-draft')) } })
  const del = $('#ed-del')
  if (del) del.addEventListener('click', async () => {
    const ok = await ask({ title: 'Delete “' + post.title + '”?', text: 'It will be removed from the blog and from the CMS. This can’t be undone.', action: async () => { await store.remove(origSlug); imgCache.delete(origSlug); await refresh() } })
    if (ok) { current = null; toast('Post deleted.'); location.hash = '#/posts' }
  })
}

// ---------- the shell ----------
function closeMenu() { $('#app').classList.remove('menu-open'); $('#scrim').hidden = true; $('#menu-btn').setAttribute('aria-expanded', 'false') }
function setupShell() {
  $('#menu-btn').addEventListener('click', () => { $('#app').classList.add('menu-open'); $('#scrim').hidden = false; $('#menu-btn').setAttribute('aria-expanded', 'true'); $('.side-nav a').focus() })
  $('#scrim').addEventListener('click', closeMenu)
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('#app').classList.contains('menu-open')) closeMenu() })
  $('#logout').addEventListener('click', async () => {
    if (!(await guard())) return
    current = null; user = null; posts = []; loaded = false; imgCache.clear()
    await store.signOut(); history.replaceState(null, '', location.pathname + location.search)
    toast('Signed out.')
  })
  addEventListener('scroll', () => $('.top').classList.toggle('scrolled', scrollY > 4), { passive: true })
}

// ---------- start ----------
;(async function start() {
  try { store = await openStore() } catch (e) {
    $('#boot').innerHTML = '<span>Couldn’t load the CMS. Check your connection and reload.</span>'; return
  }
  setupLogin(); setupShell()
  store.onAuth((u) => { if (u) enter(u); else { user = null; showLogin() } })
})()
