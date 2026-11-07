// Page transitions: a liquid wave.
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
  var on = false
  function check() {
    var masked = document.querySelector('main .page.masked')
    if ((masked !== null) !== on) {
      on = !on
      addFx()
      if (on) {
        var seg0 = location.pathname.split('/')[1] || ''
        word.textContent = NAMES[seg0] || seg0.replace(/-/g, ' ')
        void fx.offsetWidth // restart the label's animation from its first frame
        if (!reduced) { bulge = Math.min(1, window.innerWidth / window.innerHeight); t0 = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(draw) }
      } else {
        clearTimeout(pending); pending = 0
        cancelAnimationFrame(raf); raf = 0; pa.setAttribute('d', ''); pb.setAttribute('d', '')
      }
      document.body.classList.toggle('ix-transitioning', on)
    }
  }
  if (main && window.MutationObserver) new MutationObserver(check).observe(main, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] })
  check()
})()
