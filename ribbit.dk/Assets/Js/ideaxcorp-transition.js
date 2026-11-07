// Page transitions: a full-screen curtain, left to right.
// The site's own router (min9eda.js) loads the next page in the background, lays it over the old one
// (.page.masked) and, after window._ixPageT seconds, removes the old page and sets the scroll. Within that
// time (see ideaxcorp-transition.css):
//   0 – 45%  the old page fades, blurs a touch and drifts left while the curtain sweeps in from the left;
//  45 – 55%  the screen is covered: the new page takes its place underneath;
//  55 – 100% the curtain slides off to the right, revealing the new page from left to right, and its
//            heading and content fade up in their usual stagger.
// Back/forward go through the router's popstate handler, so they get the same curtain.
// This script also routes the navbar's links through the router, and tells the site's scripts the moment
// the next page is inserted (ix:pageadded), so they set it up before it is first drawn.
;(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window._ixPageT = reduced ? 0.3 : 1.1 // the router's page swap, in seconds (the CSS keyframes use the same 1.1s)

  function internal(a) {
    var href = a.getAttribute('href') || ''
    return href.charAt(0) === '/' && href.indexOf('//') !== 0 && a.target !== '_blank' && !a.hasAttribute('download')
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('.ix-bar a')
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || !internal(a)) return
    if (!window._router || !_router._useAPI) return // no router: the normal link still works
    e.preventDefault()
    if (window._pageTransitioning) return // one transition at a time
    _router.setUrl(a.getAttribute('href'))
  })

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

  // the curtain: one element, made once; CSS runs it while body.ix-transitioning is on
  var curtain = document.createElement('div')
  curtain.className = 'ix-curtain'
  curtain.setAttribute('aria-hidden', 'true')
  curtain.innerHTML = '<span class="ix-curtain-edge"></span><span class="ix-curtain-mark"></span>'
  function addCurtain() { if (!curtain.parentNode) document.body.appendChild(curtain) }
  if (document.body) addCurtain(); else document.addEventListener('DOMContentLoaded', addCurtain)

  // on while the router has a page laid over another (it adds .masked to the new page for the whole swap);
  // watched through class changes on the pages, so nothing runs between transitions
  var on = false
  function check() {
    var masked = document.querySelector('main .page.masked')
    if ((masked !== null) !== on) {
      on = !on
      addCurtain()
      if (on) void curtain.offsetWidth // restart the curtain's animation from its first frame
      document.body.classList.toggle('ix-transitioning', on)
    }
  }
  if (main && window.MutationObserver) new MutationObserver(check).observe(main, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] })
  check()
})()
