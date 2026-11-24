// Blog CMS, public side (posts are written in /admin/; styles: ideaxcorp-blog.css for the cards,
// ideaxcorp-blogpost.css for the article page).
// - Blog page (/blog/): the published posts are read from Firestore and dealt into the article grid, newest first,
//   in the grid's own card markup; ideaxcorp-blog.js then lays them out, counts them and filters them as before. The
//   cards written into the page stay until the posts arrive (and stay if they can't be read).
// - Article page (/blog/post/?s=<slug>): the post itself, with its SEO title and description.
// - Preview (/blog/post/?preview=1, opened from the admin): the post being edited, from this browser's storage.
// Reads go straight to Firestore's REST API (no SDK on the public site); its security rules let anyone read
// published posts only. The site swaps pages without reloading, so this runs again whenever a page arrives.
;(function () {
  var CFG = { project: 'ideaxcorp-3089b', key: 'AIzaSyDWJwGL3MpVqGCwxLmN7a1YKISMmmwlUsM' } // (the web app's public identifiers, not secrets)
  var BASE = 'https://firestore.googleapis.com/v1/projects/' + CFG.project + '/databases/(default)/documents'
  var CATS = { 'web-development': 'Web Development', branding: 'Branding', 'digital-marketing': 'Digital Marketing', technology: 'Technology', design: 'Design' }
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  var MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  // ---------- reading ----------
  // a local test store (localhost only, switched on by the admin's ?mock=1): the same data, kept in this browser
  var LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)
  function mockDb() {
    if (!LOCAL) return null
    try { if (localStorage.getItem('ixblog-mock-on') !== '1') return null; return JSON.parse(localStorage.getItem('ixblog-mock-db') || '{"posts":{},"images":{}}') } catch (e) { return null }
  }
  function val(v) { // a Firestore REST value, as plain JSON
    if (!v) return null
    if ('stringValue' in v) return v.stringValue
    if ('booleanValue' in v) return v.booleanValue
    if ('integerValue' in v) return +v.integerValue
    if ('doubleValue' in v) return v.doubleValue
    if ('timestampValue' in v) return v.timestampValue
    if ('nullValue' in v) return null
    if ('arrayValue' in v) return (v.arrayValue.values || []).map(val)
    if ('mapValue' in v) return fields(v.mapValue.fields || {})
    return null
  }
  function fields(f) { var o = {}; for (var k in f) o[k] = val(f[k]); return o }
  function published() {
    var m = mockDb()
    if (m) return Promise.resolve(Object.keys(m.posts).map(function (k) { return m.posts[k] }).filter(function (p) { return p.status === 'published' }))
    return fetch(BASE + ':runQuery?key=' + CFG.key, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ structuredQuery: { from: [{ collectionId: 'posts' }], where: { fieldFilter: { field: { fieldPath: 'status' }, op: 'EQUAL', value: { stringValue: 'published' } } } } })
    }).then(function (r) { if (!r.ok) throw new Error('posts ' + r.status); return r.json() })
      .then(function (rows) { return rows.filter(function (r) { return r.document }).map(function (r) { return fields(r.document.fields || {}) }) })
  }
  function onePost(slug) {
    var m = mockDb()
    if (m) { var p = m.posts[slug]; return Promise.resolve(p && p.status === 'published' ? p : null) }
    return fetch(BASE + '/posts/' + encodeURIComponent(slug) + '?key=' + CFG.key).then(function (r) {
      if (r.status === 404 || r.status === 403) return null // (a draft reads as not found)
      if (!r.ok) throw new Error('post ' + r.status)
      return r.json().then(function (d) { return fields(d.fields || {}) })
    })
  }
  var imgCache = {}
  function image(slug) {
    if (imgCache[slug]) return imgCache[slug]
    var m = mockDb()
    if (m) return (imgCache[slug] = Promise.resolve(m.images[slug] || null))
    return (imgCache[slug] = fetch(BASE + '/postImages/' + encodeURIComponent(slug) + '?key=' + CFG.key)
      .then(function (r) { return r.ok ? r.json().then(function (d) { return fields(d.fields || {}) }) : null })
      .catch(function () { delete imgCache[slug]; return null }))
  }
  function newestFirst(a, b) { return (b.publishedAt || '').localeCompare(a.publishedAt || '') || (a.order || 0) - (b.order || 0) }

  // ---------- helpers ----------
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] }) }
  function day(d, long) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || ''); return m ? +m[3] + ' ' + (long ? MONTHS_LONG : MONTHS)[+m[2] - 1] + ' ' + m[1] : '' }
  function words(html) { var t = String(html || '').replace(/<[^>]+>/g, ' ').trim(); return t ? t.split(/\s+/).length : 0 }
  function readTime(p) { return Math.max(1, Math.round(words(p.content) / 220)) + ' min read' }
  // a post links out only while its full text lives elsewhere; once written here, it opens on this site
  function hrefOf(p) { return p.externalUrl && !p.content ? p.externalUrl : '/blog/post/?s=' + encodeURIComponent(p.slug) }
  // the article's body, kept to plain text formatting (whatever was saved): headings, paragraphs, emphasis, lists,
  // quotes, code and links (http, https, mailto and site links only)
  var ALLOWED = { P: 1, H2: 1, H3: 1, H4: 1, STRONG: 1, B: 1, EM: 1, I: 1, U: 1, A: 1, UL: 1, OL: 1, LI: 1, BLOCKQUOTE: 1, CODE: 1, PRE: 1, BR: 1, HR: 1 }
  function clean(html) {
    var doc = new DOMParser().parseFromString('<div>' + String(html || '') + '</div>', 'text/html')
    function walk(n) {
      Array.prototype.slice.call(n.childNodes).forEach(function (c) {
        if (c.nodeType === 3) return
        if (c.nodeType !== 1 || /^(SCRIPT|STYLE|IFRAME|OBJECT|EMBED|TEMPLATE|SVG|MATH)$/.test(c.tagName)) { c.remove(); return }
        walk(c)
        if (!ALLOWED[c.tagName]) { while (c.firstChild) c.parentNode.insertBefore(c.firstChild, c); c.remove(); return }
        Array.prototype.slice.call(c.attributes).forEach(function (a) { if (!(c.tagName === 'A' && a.name === 'href')) c.removeAttribute(a.name) })
        if (c.tagName === 'A') {
          var h = (c.getAttribute('href') || '').trim()
          if (!/^(https?:|mailto:|\/|#)/i.test(h)) c.removeAttribute('href')
          else if (/^https?:/i.test(h) && h.indexOf(location.origin) !== 0) { c.setAttribute('target', '_blank'); c.setAttribute('rel', 'noopener') }
        }
      })
    }
    var root = doc.body.firstChild; walk(root); return root.innerHTML
  }
  var ARROW = '<svg viewBox="0 0 22 12" aria-hidden="true"><path d="M1 6h19M15.5 1.5 20.5 6l-5 4.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  function cover(p, i) {
    var c = p.cover || { style: 'c' + (i % 3), kicker: (p.topic || CATS[p.category] || 'Article') + ' · ' + readTime(p), text: p.title }
    return '<span class="ixbl-cover ' + esc(c.style) + '"><span class="ixbl-cover-grid" aria-hidden="true"></span><span class="ixbl-cover-k">' + esc(c.kicker) + '</span><b>' + esc(c.text) + '</b><span class="ixbl-cover-mark" aria-hidden="true">ideaxcorp.</span></span>'
  }

  // ---------- the blog page ----------
  function card(p, i) {
    var cats = [p.category].concat(p.alsoIn || []).join(' '), name = CATS[p.category] || ''
    var media = p.imagePath ? '<img width="' + (p.imageW || 1200) + '" height="' + (p.imageH || 800) + '" src="' + esc(p.imagePath) + '" alt="' + esc(p.title) + '" loading="lazy" decoding="async">' : cover(p, i)
    var ext = p.externalUrl && !p.content ? ' target="_blank" rel="noopener"' : ''
    return '<li class="ixbl-item" data-cat="' + esc(cats) + '"' + (p.hasImage && !p.imagePath ? ' data-ixcms-img="' + esc(p.slug) + '"' : '') + '><article class="ixbl-art"><a class="ixbl-art-link" href="' + esc(hrefOf(p)) + '"' + ext + '>' +
      '<span class="ixbl-art-no" aria-hidden="true"></span><span class="ixbl-art-media" data-label="' + esc(name) + '"><span class="ixbl-art-img">' + media + '</span></span>' +
      '<span class="ixbl-art-body"><span class="ixbl-meta"><span class="ixbl-cat">' + esc(name) + '</span><span aria-hidden="true">·</span><time datetime="' + esc(p.publishedAt) + '">' + day(p.publishedAt) + '</time>' + (p.topic ? '<span class="ixbl-topic-tag">' + esc(p.topic) + '</span>' : '') + '</span>' +
      '<span class="ixbl-art-h">' + esc(p.title) + '</span><span class="ixbl-art-text">' + esc(p.excerpt) + '</span></span><span class="ixbl-art-go" aria-hidden="true">' + ARROW + '</span></a></article></li>'
  }
  // uploaded images load as their card nears the screen (each is fetched on its own, so the list stays light)
  function lazyImages(ul) {
    var lis = ul.querySelectorAll('[data-ixcms-img]')
    function load(li) {
      var slug = li.getAttribute('data-ixcms-img'); li.removeAttribute('data-ixcms-img')
      image(slug).then(function (im) {
        if (!im || !im.data) return
        var box = li.querySelector('.ixbl-art-img'), img = new Image()
        img.width = im.w; img.height = im.h; img.alt = (li.querySelector('.ixbl-art-h') || {}).textContent || ''; img.decoding = 'async'
        img.onload = function () { box.innerHTML = ''; box.appendChild(img) }
        img.src = im.data
      })
    }
    if (!window.IntersectionObserver) { Array.prototype.forEach.call(lis, load); return }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); load(e.target) } }) }, { rootMargin: '600px 0px' })
    Array.prototype.forEach.call(lis, function (li) { io.observe(li) })
  }
  function blogPage(grid) {
    grid.setAttribute('data-ixcms', 'loading')
    published().then(function (posts) {
      if (!document.contains(grid)) return
      if (!posts.length) { grid.setAttribute('data-ixcms', 'empty'); return } // (the cards written into the page stay)
      posts.sort(newestFirst)
      // a fresh list in its place: the grid's script sees a new list and deals, counts and reveals it again
      var ul = grid.cloneNode(false)
      ul.setAttribute('data-ixcms', 'live'); ul.innerHTML = posts.map(card).join('')
      // keep the chosen category, if one was picked while the posts were on their way
      var on = document.querySelector('.ixbl-filters .ixp-filter[aria-pressed="true"]'), v = on && on.getAttribute('data-value')
      grid.parentNode.replaceChild(ul, grid)
      if (v && v !== 'all') setTimeout(function () { on.click() }, 0)
      lazyImages(ul)
    }).catch(function (e) { grid.setAttribute('data-ixcms', 'error'); if (window.console) console.warn('Blog posts could not be loaded:', e.message) })
  }

  // ---------- the article page ----------
  function setMeta(name, content, prop) {
    var sel = prop ? 'meta[property="' + name + '"]' : 'meta[name="' + name + '"]', m = document.head.querySelector(sel)
    if (!m) { m = document.createElement('meta'); m.setAttribute(prop ? 'property' : 'name', name); document.head.appendChild(m) }
    m.setAttribute('content', content)
  }
  function articleHtml(p, preview) {
    var name = CATS[p.category] || '', when = day(p.publishedAt, true)
    var hero = p.imageData ? '<figure class="ixbp-figure" data-reveal><img src="' + esc(p.imageData) + '" width="' + (p.imageW || 1600) + '" height="' + (p.imageH || 900) + '" alt="' + esc(p.title) + '" decoding="async"></figure>'
      : p.imagePath ? '<figure class="ixbp-figure" data-reveal><img src="' + esc(p.imagePath) + '" width="' + (p.imageW || 1600) + '" height="' + (p.imageH || 900) + '" alt="' + esc(p.title) + '" decoding="async"></figure>'
      : p.hasImage ? '<figure class="ixbp-figure is-loading" data-reveal data-ixbp-img="' + esc(p.slug) + '" style="aspect-ratio:' + (p.imageW || 16) + '/' + (p.imageH || 9) + '"></figure>' : ''
    var body = p.content ? clean(p.content) : (p.externalUrl ? '<p>' + esc(p.excerpt) + '</p><p><a href="' + esc(p.externalUrl) + '">Read the full article on ideaxcorp.com</a></p>' : '')
    return (preview ? '<p class="ixbp-preview" role="status"><b>Preview</b> This is how the article will look. It is not public until you publish it.</p>' : '') +
      '<div class="ixbp-head">' + // (not <header>/<footer>: the site styles those as its navbar and footer)
        '<a class="ixbp-back" href="/blog/"><svg viewBox="0 0 22 12" aria-hidden="true"><path d="M21 6H2M6.5 1.5 1.5 6l5 4.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>All articles</a>' +
        '<p class="ixbp-tags"><span class="ixbl-cat">' + esc(name) + '</span>' + (p.topic ? '<span class="ixbl-topic-tag">' + esc(p.topic) + '</span>' : '') + '</p>' +
        '<h1 class="ixbp-title">' + esc(p.title) + '</h1>' +
        (p.excerpt ? '<p class="ixbp-lead">' + esc(p.excerpt) + '</p>' : '') +
        '<p class="ixbp-meta"><span class="ixbp-by">' + esc(p.author || 'Ideaxcorp Team') + '</span><span aria-hidden="true">·</span><time datetime="' + esc(p.publishedAt) + '">' + when + '</time><span aria-hidden="true">·</span><span>' + readTime(p) + '</span></p>' +
      '</div>' + hero +
      '<div class="ixbp-body">' + body + '</div>' +
      '<div class="ixbp-foot"><a class="ixp-btn" href="/blog/">More articles</a></div>'
  }
  function articlePage(root) {
    var q = new URLSearchParams(location.search), slug = (q.get('s') || '').toLowerCase(), preview = q.get('preview') === '1'
    root.setAttribute('data-ixcms', 'loading')
    var got
    if (preview) { try { got = Promise.resolve(JSON.parse(localStorage.getItem('ixblog-preview') || 'null')) } catch (e) { got = Promise.resolve(null) } }
    else got = slug ? onePost(slug) : Promise.resolve(null)
    got.then(function (p) {
      if (!document.contains(root)) return
      if (!p) {
        root.innerHTML = '<div class="ixbp-missing"><h1 class="ixbp-title">Article not found.</h1><p class="ixbp-lead">It may have been moved or unpublished.</p><a class="ixp-btn" href="/blog/">Back to the blog</a></div>'
        root.setAttribute('data-ixcms', 'missing'); return
      }
      root.innerHTML = articleHtml(p, preview)
      root.setAttribute('data-ixcms', 'live')
      document.title = (p.seoTitle || p.title) + (preview ? ' (preview)' : ' | Ideaxcorp')
      var desc = p.seoDescription || p.excerpt || ''
      setMeta('description', desc); setMeta('og:title', p.seoTitle || p.title, true); setMeta('og:description', desc, true); setMeta('og:type', 'article', true)
      if (preview) setMeta('robots', 'noindex')
      var ld = document.getElementById('ixbp-ld'); if (!ld) { ld = document.createElement('script'); ld.type = 'application/ld+json'; ld.id = 'ixbp-ld'; document.head.appendChild(ld) }
      ld.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.seoTitle || p.title, description: desc, datePublished: p.publishedAt, author: { '@type': 'Organization', name: p.author || 'Ideaxcorp' }, publisher: { '@type': 'Organization', name: 'Ideaxcorp' } })
      var fig = root.querySelector('[data-ixbp-img]')
      if (fig) image(fig.getAttribute('data-ixbp-img')).then(function (im) {
        if (!im || !im.data) { fig.remove(); return }
        var img = new Image(); img.width = im.w; img.height = im.h; img.alt = p.title; img.src = im.data
        fig.classList.remove('is-loading'); fig.style.aspectRatio = ''; fig.appendChild(img)
      })
      // reveals: shown as they scroll in, as elsewhere on the site
      var els = root.querySelectorAll('[data-reveal], .ixbp-head > *, .ixbp-body > *')
      Array.prototype.forEach.call(els, function (e, i) { e.style.setProperty('--d', Math.min(i, 6) * .06 + 's') })
      requestAnimationFrame(function () { root.classList.add('is-in') })
    }).catch(function (e) {
      root.innerHTML = '<div class="ixbp-missing"><h1 class="ixbp-title">Couldn’t load this article.</h1><p class="ixbp-lead">Please check your connection and try again.</p><a class="ixp-btn" href="">Try again</a></div>'
      root.setAttribute('data-ixcms', 'error'); if (window.console) console.warn('Article could not be loaded:', e.message)
    })
  }

  function setup() {
    var grid = document.querySelector('[data-ixbl-grid]:not([data-ixcms])')
    if (grid) blogPage(grid)
    var art = document.querySelector('[data-ixbp]:not([data-ixcms])')
    if (art) articlePage(art)
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup); else setup()
  window.addEventListener('ix:pageadded', function () { setTimeout(setup, 0) })
  setInterval(setup, 1000)
})()
