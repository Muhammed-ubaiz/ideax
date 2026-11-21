// Page transitions: a liquid wave (and, between the pages listed in BOOK, a book's page turning).
// The site's own router (min9eda.js) loads the next page in the background, lays it over the old one
// (.page.masked) and, after window._ixPageT seconds, removes the old page and sets the scroll. Within that
// time (styles in ideaxcorp-transition.css):
//   0 – 45%  the old page lifts, softens and fades while two waves rise from the bottom: a purple one, then the
//            dark brand one, their top edges bulging like liquid; the destination's name rises in the middle;
//  45 – 55%  the screen is covered: the new page takes its place underneath;
//  55 – 100% the waves drain upwards (dark first, purple trailing), revealing the new page from the bottom, and its
//            heading and content fade up in their usual stagger.
// Every internal link goes through the router: links inside the page (the router binds those itself), and the
// navbar, menu and footer, which stay on screen between pages, plus links added by scripts. Back/forward go
// through the router's popstate handler, so they get the same wave. One transition at a time.
// This script also tells the site's scripts the moment the next page is inserted (ix:pageadded), so they set it
// up before it is first drawn.
;(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  var T = reduced ? 0.3 : 1.2
  window._ixPageT = T // the router's page swap, in seconds (the CSS keyframes use the same 1.2s)

  // ---------- links ----------
  // the navbar and footer stay put between pages, so their relative links ("contact/", "../index.html") would
  // resolve against whichever page is showing: fix them to site paths once, from the page they came with
  var FILE = /\.(pdf|zip|png|jpe?g|webp|gif|svg|mp4|webm|xml|txt|json)$/i
  function sitePath(href, base) {
    try { var u = new URL(href, base) } catch (e) { return null }
    if (u.origin !== location.origin || FILE.test(u.pathname)) return null
    return u.pathname.replace(/index(?:[0-9a-f]{4})?\.html$/, '') + u.search + u.hash
  }
  function fixLinks() {
    Array.prototype.forEach.call(document.querySelectorAll('a[href]'), function (a) {
      if (a.closest('main .page')) return
      var h = a.getAttribute('href')
      if (!h || h.charAt(0) === '/' || h.charAt(0) === '#' || /^[a-z]+:/i.test(h)) return
      var p = sitePath(h, location.href); if (p) a.setAttribute('href', p)
    })
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fixLinks); else fixLinks()

  function route(a, e) {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return null
    if ((a.target && a.target !== '_self') || a.hasAttribute('download')) return null
    var h = a.getAttribute('href') || ''
    if (!h || h.charAt(0) === '#' || /^(mailto|tel|javascript):/i.test(h)) return null
    var p = sitePath(h, location.href)
    if (!p) return null
    var path = p.split(/[?#]/)[0]
    if (path === location.pathname && p.indexOf('#') >= 0) return null // a jump on this page: the router scrolls
    return p
  }
  var pending = 0 // from the click until the router's swap is over (it only flags the swap once the page has loaded)
  function busy() { return pending || window._pageTransitioning || on }
  function elsewhere(p) { return p !== null && p.split(/[?#]/)[0] !== location.pathname }
  // first, before the router's own link handlers: while a transition runs, every internal link waits (stops a
  // second click starting a second page load); otherwise a click to another page marks the start of one
  window.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]')
    if (!a) return
    var p = route(a, e)
    if (p === null || !window._router || !_router._useAPI) return
    if (busy()) { e.preventDefault(); e.stopImmediatePropagation(); return }
    if (elsewhere(p)) start()
    // the navbar, menu and footer stay outside the page, where the router doesn't bind links: route them here
    // (here, as a script on the navbar stops some clicks before they bubble)
    if (!a.closest('main .page')) {
      e.preventDefault()
      // the router bound the footer's links with their original relative hrefs: keep the click from reaching
      // them (the navbar's own listener, which closes its menu, still gets navbar clicks)
      if (a.closest('footer')) e.stopPropagation()
      if (elsewhere(p)) _router.setUrl(p)
    }
  }, true)
  // links added to the page by scripts after the router bound its links: sent through it here
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented) return // the router took it
    var a = e.target.closest && e.target.closest('a[href]')
    var p = a && route(a, e)
    if (!p || !window._router || !_router._useAPI) return // the normal link still works
    e.preventDefault()
    if (elsewhere(p)) _router.setUrl(p)
  })
  function start() { clearTimeout(pending); pending = setTimeout(function () { pending = 0 }, 6000) }

  // ---------- the new page arrives ----------
  var main = document.querySelector('main')
  if (main && window.MutationObserver) new MutationObserver(function (list) {
    for (var i = 0; i < list.length; i++) for (var j = 0; j < list[i].addedNodes.length; j++) {
      var n = list[i].addedNodes[j]
      if (n.classList && n.classList.contains('page')) {
        // a page that arrived by a transition (the home hero hides until it has laid itself out; 2.5s at most)
        n.classList.add('ix-arrived'); setTimeout(function () { n.classList.remove('ix-arrived') }, 2500)
        window.dispatchEvent(new Event('ix:pageadded')); return
      }
    }
  }).observe(main, { childList: true })

  // ---------- the waves ----------
  var NAMES = { '': 'Home', about: 'About', services: 'Services', portfolio: 'Portfolio', blog: 'Blog', contact: 'Contact',
    'privacy-policy': 'Privacy', projects: 'Projects', process: 'Process' }
  var fx = document.createElement('div')
  fx.className = 'ix-liquid'
  fx.setAttribute('aria-hidden', 'true')
  fx.innerHTML =
    '<svg viewBox="0 0 100 100" preserveAspectRatio="none">' +
      '<defs><linearGradient id="ix-liquid-g" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#2A0C4E"/><stop offset=".55" stop-color="#170A28"/><stop offset="1" stop-color="#120A1C"/>' +
      '</linearGradient></defs>' +
      '<path class="ix-liquid-a" d=""/><path class="ix-liquid-b" d="" fill="url(#ix-liquid-g)"/>' +
    '</svg>' +
    '<div class="ix-liquid-label"><span class="ix-liquid-mark"></span><span class="ix-liquid-word"></span></div>'
  var pa = fx.querySelector('.ix-liquid-a'), pb = fx.querySelector('.ix-liquid-b'), word = fx.querySelector('.ix-liquid-word')
  function addFx() { if (!fx.parentNode) document.body.appendChild(fx) }
  if (document.body) addFx(); else document.addEventListener('DOMContentLoaded', addFx)

  function ease(x) { x = Math.max(0, Math.min(1, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2 }
  function seg(t, a, b) { return ease((t - a) / (b - a)) }
  // a wave rising from the bottom: p 0 → 1 fills the screen; then q 0 → 1 drains it upwards
  var bulge = 1 // the curve's depth, shallower on tall (portrait) screens so it stays a wave, not a U
  function wave(p, q) {
    if (q > 0) {
      var y = 100 * (1 - q), k = 16 * bulge * Math.sin(Math.PI * q)
      return 'M0 0H100V' + y.toFixed(2) + 'C70 ' + (y + k).toFixed(2) + ' 30 ' + (y + k).toFixed(2) + ' 0 ' + y.toFixed(2) + 'Z'
    }
    var y2 = 100 * (1 - p), k2 = 18 * bulge * Math.sin(Math.PI * p)
    return 'M0 100V' + y2.toFixed(2) + 'C30 ' + (y2 - k2).toFixed(2) + ' 70 ' + (y2 - k2).toFixed(2) + ' 100 ' + y2.toFixed(2) + 'V100Z'
  }
  var t0 = 0, raf = 0
  function draw(now) {
    var t = Math.min(1, (now - t0) / (T * 1000))
    pa.setAttribute('d', wave(seg(t, 0, .40), seg(t, .60, .98)))   // purple: leads in, trails out
    pb.setAttribute('d', wave(seg(t, .05, .44), seg(t, .54, .92)))  // dark: covers by 44%, drains first
    raf = t < 1 && on ? requestAnimationFrame(draw) : 0
  }

  // on while the router has a page laid over another (it adds .masked to the new page for the whole swap);
  // watched through class changes on the pages, so nothing runs between transitions
  // ---------- the book ----------
  // pages listed here are chapters of a book: going from one to another turns a page instead of the waves (later
  // in the list: the current page turns away over the left, like a book's page, showing the next underneath;
  // earlier: the page comes back over from the left onto it). Styles in ideaxcorp-transition.css (.ix-book).
  var BOOK = window.IX_BOOK || ['/', '/about/']
  var lastPath = location.pathname, book = ''
  var sheet = document.createElement('div'), shade = document.createElement('div')
  sheet.className = 'ix-book-sheet'; shade.className = 'ix-book-shade'
  sheet.setAttribute('aria-hidden', 'true'); shade.setAttribute('aria-hidden', 'true')
  function bookMode(from, to) {
    var a = BOOK.indexOf(from), b = BOOK.indexOf(to)
    if (reduced || a < 0 || b < 0 || a === b) return ''
    return b > a ? 'fwd' : 'back'
  }
  // the characters carry the page: going forward, the Creator pulls the turning page's edge (walking backwards,
  // leaning back, in her pull frames) while the Jester pushes it from the other side with its dome; going back,
  // the Creator pushes the page back into place while the Jester braces against its edge, walking backwards. Both
  // stand on the floor of the screen and follow the page's edge as it turns: read every frame from the turning
  // sheet's box (it turns exactly with the page). Frames: Assets/Grx/<name>_*/NNN.webp, 24 a second.
  var G = '/Assets/Grx/', CAST = {
    creator: { pull: ['creator_pull', 40], push: ['creator_push', 40], reach: { pull: .535, push: .6 }, ar: 1 },
    jester: { push: ['jester_push_2', 58], reach: { push: .47 }, ar: .889 }
  }
  function seq(s) { var a = []; for (var i = 0; i < s[1]; i++) a.push(G + s[0] + '/' + ('00' + i).slice(-3) + '.webp?v=3'); return a }
  var castEl = null, castRaf = 0, castOn = false, preloaded = false
  function preloadCast() {
    if (preloaded || reduced) return
    preloaded = true
    ;[CAST.creator.pull, CAST.creator.push, CAST.jester.push].forEach(function (s) { seq(s).forEach(function (u) { var im = new Image(); im.src = u }) })
  }
  function castStart(mode) {
    if (reduced) return
    preloadCast()
    if (!castEl) {
      castEl = document.createElement('div'); castEl.className = 'ix-book-cast'; castEl.setAttribute('aria-hidden', 'true')
      castEl.innerHTML = '<div class="ix-bc ix-bc-creator"><img alt=""></div><div class="ix-bc ix-bc-jester"><img alt=""></div>'
      document.body.appendChild(castEl)
    }
    var H = Math.max(130, Math.min(window.innerHeight * .24, 240)), floor = window.innerHeight - 8, t0 = performance.now()
    var cre = castEl.querySelector('.ix-bc-creator'), jes = castEl.querySelector('.ix-bc-jester')
    var cs = seq(mode === 'fwd' ? CAST.creator.pull : CAST.creator.push), js = seq(CAST.jester.push), cImg = cre.querySelector('img'), jImg = jes.querySelector('img')
    var cReach = mode === 'fwd' ? CAST.creator.reach.pull : CAST.creator.reach.push
    cre.style.height = H + 'px'; jes.style.height = H * .92 + 'px'
    castOn = true; castEl.classList.add('on')
    function frame(now) {
      if (!castOn) return
      var r = sheet.getBoundingClientRect(), edge = r.width ? r.right : 0, t = (now - t0) / 1000, f = Math.floor(t * 24)
      // the Creator: on the page's side of its edge (she holds it), the Jester on the far side (it pushes or braces)
      var cx = edge - H * cReach, jx = edge + H * .92 * CAST.jester.reach.push
      cre.style.transform = 'translate3d(' + (cx - H / 2).toFixed(1) + 'px,' + (floor - H).toFixed(1) + 'px,0)'
      jes.style.transform = 'translate3d(' + (jx - H * .92 / 2).toFixed(1) + 'px,' + (floor - H * .92).toFixed(1) + 'px,0)'
      castEl.style.opacity = Math.max(0, Math.min(1, (edge - innerWidth * .03) / (innerWidth * .1))).toFixed(3) // they go with the page into the spine (and come out of it)
      var cu = cs[f % cs.length], ju = js[(mode === 'fwd' ? f : js.length * 9 - f) % js.length]
      if (cImg.getAttribute('src') !== cu) cImg.src = cu
      if (jImg.getAttribute('src') !== ju) jImg.src = ju
      castRaf = requestAnimationFrame(frame)
    }
    cancelAnimationFrame(castRaf); castRaf = requestAnimationFrame(frame)
  }
  function castStop() { castOn = false; cancelAnimationFrame(castRaf); if (castEl) { castEl.classList.remove('on'); castEl.style.opacity = '' } }
  // the frames are fetched quietly on the two pages that turn into each other, so they are ready for the turn
  setTimeout(function () { if (BOOK.indexOf(location.pathname) >= 0) preloadCast() }, 4000)
  function bookStart(mode) {
    if (!sheet.parentNode) { document.body.appendChild(shade); document.body.appendChild(sheet) }
    var old = document.querySelector('main .page.removing')
    // the page turns about its left edge at the middle of the screen, wherever it was scrolled to
    if (old) old.style.transformOrigin = '0 ' + Math.round(window.scrollY + window.innerHeight / 2) + 'px'
    // turning back: the previous page comes back open at its end (like turning back a page in a book), and stays
    // there, at its footer, once the turn is over
    var nw = document.querySelector('main .page.masked')
    if (mode === 'back' && nw) {
      var endY = Math.max(0, nw.scrollHeight - window.innerHeight)
      nw.style.top = -endY + 'px'; nw.style.transformOrigin = '0 ' + Math.round(endY + window.innerHeight / 2) + 'px'
      toEnd = true
    }
    void sheet.offsetWidth
    document.body.classList.add('ix-book', 'ix-book-' + mode)
    castStart(mode)
  }
  var toEnd = false, userMoved = false
  ;['wheel', 'touchstart', 'keydown'].forEach(function (t) { window.addEventListener(t, function () { userMoved = true }, { passive: true }) })
  function scrollToEnd() {
    var max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
    if (window._smoothScroller && window._smoothScroller.scrollTo) window._smoothScroller.scrollTo(max, true); else window.scrollTo(0, max)
  }
  function bookEnd() {
    castStop()
    Array.prototype.forEach.call(document.querySelectorAll('main .page'), function (p) { p.style.top = '' })
    if (toEnd) { // at once; and again while the page is still laying itself out (it grows), unless the visitor scrolls meanwhile
      toEnd = false; userMoved = false; scrollToEnd()
      ;[80, 250, 500, 800, 1200, 1600].forEach(function (t) { setTimeout(function () { if (!userMoved) scrollToEnd() }, t) })
    }
    document.body.classList.remove('ix-book', 'ix-book-fwd', 'ix-book-back')
    Array.prototype.forEach.call(document.querySelectorAll('main .page'), function (p) { p.style.transformOrigin = '' })
  }

  var on = false
  function check() {
    var masked = document.querySelector('main .page.masked')
    if ((masked !== null) !== on) {
      on = !on
      addFx()
      if (on) {
        book = bookMode(lastPath, location.pathname)
        if (book) { bookStart(book); document.body.classList.add('ix-transitioning'); return } // (no waves)
        var seg0 = location.pathname.split('/')[1] || ''
        word.textContent = NAMES[seg0] || seg0.replace(/-/g, ' ')
        void fx.offsetWidth // restart the label's animation from its first frame
        if (!reduced) { bulge = Math.min(1, window.innerWidth / window.innerHeight); t0 = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(draw) }
      } else {
        lastPath = location.pathname
        if (book) { book = ''; bookEnd() }
        clearTimeout(pending); pending = 0
        cancelAnimationFrame(raf); raf = 0; pa.setAttribute('d', ''); pb.setAttribute('d', '')
      }
      document.body.classList.toggle('ix-transitioning', on)
    }
  }
  if (main && window.MutationObserver) new MutationObserver(check).observe(main, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] })
  check()
})()
