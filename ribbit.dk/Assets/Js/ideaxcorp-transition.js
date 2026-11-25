// Page transitions: a liquid wave (and, between Home and About, the pages hauled across a stage as cards).
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
    if (elsewhere(p)) { setPageT(p); start() }
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
    if (elsewhere(p)) { setPageT(p); _router.setUrl(p) }
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
  // ---------- the haul ----------
  // between any two pages, instead of the waves: the current page shrinks into a card
  // on a dark stage, the Jester shoves it off the side while the Creator hauls the next page in after it (a gap
  // between the two, where they walk), and the new card grows back to the full screen. Forward (later in the
  // in HAUL's order, or to a page not listed) the cards travel left; back, right, and the characters are mirrored.
  // Only About back to Home arrives at the end of the page (its footer); every other page arrives at its top. Longer than the waves (HAUL_T),
  // so the router is told the swap time at the click (or the back button), before it starts.
  // Styles in ideaxcorp-transition.css (.ix-haul).
  var HAUL = window.IX_HAUL || ['/', '/about/', '/services/', '/portfolio/', '/process/', '/blog/', '/contact/', '/privacy-policy/'], HAUL_T = 1.9
  function pathOf(p) { return (p || '').split(/[?#]/)[0] }
  function haulMode(from, to) {
    if (reduced || from === to) return ''
    var a = HAUL.indexOf(from), b = HAUL.indexOf(to)
    return a >= 0 && b >= 0 && b < a ? 'back' : 'fwd'
  }
  function setPageT(to) { window._ixPageT = haulMode(location.pathname, pathOf(to)) ? HAUL_T : T }
  window.addEventListener('popstate', function () { window._ixPageT = haulMode(lastPath, location.pathname) ? HAUL_T : T })

  var lastPath = location.pathname, haul = ''
  var stage = document.createElement('div')
  stage.className = 'ix-haul-stage'; stage.setAttribute('aria-hidden', 'true')
  stage.innerHTML = '<span class="ix-haul-word"></span><i class="ix-haul-shadow"></i><i class="ix-haul-shadow"></i>'
  var stageWord = stage.querySelector('.ix-haul-word'), shadows = stage.querySelectorAll('.ix-haul-shadow')
  // a soft shadow under each card, on the stage: the card's box on screen (the page's width, scaled; the screen's
  // height, scaled about its middle)
  function shadowTo(el, r) {
    var s = r.width / (innerWidth || 1), h = innerHeight * s, top = (innerHeight - h) / 2
    el.style.transform = 'translate3d(' + r.left.toFixed(1) + 'px,' + top.toFixed(1) + 'px,0)'
    el.style.width = r.width.toFixed(1) + 'px'; el.style.height = h.toFixed(1) + 'px'; el.style.borderRadius = (32 * s).toFixed(1) + 'px'
    el.style.opacity = Math.max(0, Math.min(1, (1 - s) / .12)).toFixed(3) // (none while a card fills the screen)
  }
  // the characters: the Creator pulls (her frames walk backwards, arms reaching to the right), the Jester pushes
  // (its frames lean to the left); going back, both are mirrored. Frames: Assets/Grx/<name>/NNN.webp, 24 a second.
  var G = '/Assets/Grx/', CAST = {
    creator: { seq: ['creator_pull', 40], reach: .535, ar: 1 },
    jester: { seq: ['jester_push_2', 58], reach: .47, ar: .92 }
  }
  function seq(s) { var a = []; for (var i = 0; i < s[1]; i++) a.push(G + s[0] + '/' + ('00' + i).slice(-3) + '.webp?v=3'); return a }
  var castEl = null, castRaf = 0, castOn = false, preloaded = false
  function preloadCast() {
    if (preloaded || reduced) return
    preloaded = true
    ;[CAST.creator.seq, CAST.jester.seq].forEach(function (s) { seq(s).forEach(function (u) { var im = new Image(); im.src = u }) })
  }
  // their frames are only needed when the visitor changes page: fetched at their first touch, scroll or key, or
  // once the page has loaded and gone quiet, whichever comes first (never in the way of the first screen)
  ;(function () {
    var done = false, go = function () { if (done) return; done = true; preloadCast() }
    ;['pointerdown', 'touchstart', 'keydown', 'wheel'].forEach(function (e) { window.addEventListener(e, go, { once: true, passive: true }) })
    var idle = window.requestIdleCallback || function (f) { setTimeout(f, 1) }
    var later = function () { setTimeout(function () { idle(go) }, 8000) }
    if (document.readyState === 'complete') later(); else window.addEventListener('load', later, { once: true })
  })()
  function castStart(mode, oldP, newP) {
    preloadCast()
    if (!castEl) {
      castEl = document.createElement('div'); castEl.className = 'ix-haul-cast'; castEl.setAttribute('aria-hidden', 'true')
      castEl.innerHTML = '<div class="ix-hc ix-hc-creator"><img alt=""></div><div class="ix-hc ix-hc-jester"><img alt=""></div>'
      document.body.appendChild(castEl)
    }
    // sized to fit the gap between the cards (CSS: 30vw, 50vw on phones)
    var gap = innerWidth * (innerWidth < 768 ? .5 : .3)
    var H = Math.max(80, Math.min(230, innerHeight * .26, gap / 1.95)), floor = innerHeight - 10, t0 = performance.now()
    var cre = castEl.querySelector('.ix-hc-creator'), jes = castEl.querySelector('.ix-hc-jester')
    var cs = seq(CAST.creator.seq), js = seq(CAST.jester.seq), cImg = cre.querySelector('img'), jImg = jes.querySelector('img')
    var Hj = H * CAST.jester.ar, flip = mode === 'back' ? ' scaleX(-1)' : ''
    cre.style.height = H + 'px'; jes.style.height = Hj + 'px'
    castOn = true; castEl.classList.add('on')
    var last = t0, fc = 0, fj = 0, px = null, pj = null
    function frame(now) {
      if (!castOn) return
      var t = (now - t0) / 1000, dt = Math.min(.05, (now - last) / 1000), k = t / HAUL_T
      last = now
      if (follow) follow()
      var ro = oldP.getBoundingClientRect(), rn = newP.getBoundingClientRect(), cx, jx
      shadowTo(shadows[0], ro); shadowTo(shadows[1], rn)
      if (mode === 'fwd') { jx = ro.right + Hj * CAST.jester.reach; cx = rn.left - H * CAST.creator.reach }
      else { jx = ro.left - Hj * CAST.jester.reach; cx = rn.right + H * CAST.creator.reach }
      // their steps follow the ground they cover (a walk cycle about 1.3 times their height), so their feet don't
      // slide; standing, they still shift their weight at a slow pace
      if (px !== null) {
        fc += Math.max(Math.abs(cx - px) / (H * 1.3) * cs.length, dt * 10)
        fj += Math.max(Math.abs(jx - pj) / (Hj * 1.3) * js.length, dt * 10)
      }
      px = cx; pj = jx
      cre.style.transform = 'translate3d(' + (cx - H / 2).toFixed(1) + 'px,' + (floor - H).toFixed(1) + 'px,0)' + flip
      jes.style.transform = 'translate3d(' + (jx - Hj / 2).toFixed(1) + 'px,' + (floor - Hj).toFixed(1) + 'px,0)' + flip
      // they step in as the cards start to travel, and out as the new one settles
      castEl.style.opacity = Math.max(0, Math.min(1, (k - .14) / .1, (.86 - k) / .1)).toFixed(3)
      var cu = cs[Math.floor(fc) % cs.length], ju = js[Math.floor(fj) % js.length]
      if (cImg.getAttribute('src') !== cu) cImg.src = cu
      if (jImg.getAttribute('src') !== ju) jImg.src = ju
      castRaf = requestAnimationFrame(frame)
    }
    cancelAnimationFrame(castRaf); castRaf = requestAnimationFrame(frame)
  }
  function castStop() { castOn = false; cancelAnimationFrame(castRaf); if (castEl) { castEl.classList.remove('on'); castEl.style.opacity = '' } }

  // each page becomes a card: clipped to the part of it on screen (rounded), shrinking about the screen's middle
  function cardOf(p, top) {
    var h = p.offsetHeight, bottom = Math.max(0, h - top - innerHeight)
    p.style.setProperty('clip-path', 'inset(' + Math.round(top) + 'px 0 ' + Math.round(bottom) + 'px 0 round 32px)', 'important')
    p.style.transformOrigin = '50% ' + Math.round(top + innerHeight / 2) + 'px'
  }
  var toEnd = false, userMoved = false, follow = null
  function haulStart(mode) {
    var old = document.querySelector('main .page.removing'), nw = document.querySelector('main .page.masked')
    if (!old || !nw) return false
    if (!stage.parentNode) document.body.appendChild(stage)
    stageWord.textContent = NAMES[location.pathname.split('/')[1] || ''] || ''
    cardOf(old, -old.getBoundingClientRect().top)
    // going back, the previous page comes back open at its end (its footer), and stays there once it is in
    // (it is still laying itself out and grows, so its end is followed every frame; its content shows at once)
    var endY = -1
    var atEnd = mode === 'back' && lastPath === '/about/' && location.pathname === '/'
    document.body.classList.toggle('ix-haul-end', atEnd)
    follow = atEnd ? function () {
      var e = Math.max(0, nw.scrollHeight - innerHeight)
      if (e !== endY) { endY = e; nw.style.top = -e + 'px'; cardOf(nw, e) }
    } : null
    if (follow) {
      toEnd = true; follow()
      Array.prototype.forEach.call(nw.querySelectorAll('[data-reveal]'), function (r) { r.classList.add('is-in') })
    } else {
      cardOf(nw, 0)
      // its first screen shows as it comes in (off screen, it would otherwise wait to be scrolled to)
      Array.prototype.forEach.call(nw.querySelectorAll('[data-reveal]'), function (r) {
        var y = 0, e = r; while (e && e !== nw) { y += e.offsetTop || 0; e = e.offsetParent } // (its place on the page, untransformed)
        if (y < innerHeight * 1.05) r.classList.add('is-in')
      })
    }
    void stage.offsetWidth
    document.body.classList.add('ix-haul', 'ix-haul-' + mode)
    castStart(mode, old, nw)
    return true
  }
  ;['wheel', 'touchstart', 'keydown'].forEach(function (t) { window.addEventListener(t, function () { userMoved = true }, { passive: true }) })
  function scrollToEnd() {
    var max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
    if (window._smoothScroller && window._smoothScroller.scrollTo) window._smoothScroller.scrollTo(max, true); else window.scrollTo(0, max)
  }
  function haulEnd() {
    castStop(); follow = null
    Array.prototype.forEach.call(document.querySelectorAll('main .page'), function (p) { p.style.top = ''; p.style.transformOrigin = ''; p.style.removeProperty('clip-path') })
    document.body.classList.remove('ix-haul', 'ix-haul-fwd', 'ix-haul-back', 'ix-haul-end')
    if (toEnd) { // at once; and again while the page is still laying itself out (it grows), unless the visitor scrolls meanwhile
      toEnd = false; userMoved = false; scrollToEnd()
      ;[80, 250, 500, 800, 1200, 1600].forEach(function (t) { setTimeout(function () { if (!userMoved) scrollToEnd() }, t) })
    }
    window._ixPageT = T
  }

  var on = false
  function check() {
    var masked = document.querySelector('main .page.masked')
    if ((masked !== null) !== on) {
      on = !on
      addFx()
      if (on) {
        haul = haulMode(lastPath, location.pathname)
        if (haul && haulStart(haul)) { document.body.classList.add('ix-transitioning'); return } // (no waves)
        haul = ''
        var seg0 = location.pathname.split('/')[1] || ''
        word.textContent = NAMES[seg0] || seg0.replace(/-/g, ' ')
        void fx.offsetWidth // restart the label's animation from its first frame
        if (!reduced) { bulge = Math.min(1, window.innerWidth / window.innerHeight); t0 = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(draw) }
      } else {
        lastPath = location.pathname
        if (haul) { haul = ''; haulEnd() }
        clearTimeout(pending); pending = 0
        cancelAnimationFrame(raf); raf = 0; pa.setAttribute('d', ''); pb.setAttribute('d', '')
      }
      document.body.classList.toggle('ix-transitioning', on)
    }
  }
  if (main && window.MutationObserver) new MutationObserver(check).observe(main, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] })
  check()
})()
