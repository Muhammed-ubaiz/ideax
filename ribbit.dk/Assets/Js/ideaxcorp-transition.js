// Page transitions. The site's own router (min9eda.js) already loads the next page in the background and
// reveals it through a growing ellipse (the #circle-mask clip path, 0.8s) over the old page. This adds:
//  - the navbar's links (logo, MENU links, Get In Touch) go through that router too, instead of a full reload;
//  - a purple Ideaxcorp ring that rides just outside the ellipse, so the wipe has a brand edge;
//  - body.ix-transitioning while it runs (the old page sinks back a little; see ideaxcorp-transition.css).
// Back/forward already go through the router's popstate handler.
;(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

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

  // tell the site's scripts the moment the router inserts the next page, so they set it up (arm its scroll
  // reveals, split headings...) before it is first drawn, instead of on their next timer tick
  var main = document.querySelector('main')
  if (main && window.MutationObserver) new MutationObserver(function (list) {
    for (var i = 0; i < list.length; i++) for (var j = 0; j < list[i].addedNodes.length; j++) {
      var n = list[i].addedNodes[j]
      if (n.classList && n.classList.contains('page')) { window.dispatchEvent(new Event('ix:pageadded')); return }
    }
  }).observe(main, { childList: true })

  // the ring follows the clip path's own transform every frame while a page is being revealed
  var ring = null, on = false
  function frame() {
    var masked = document.querySelector('main .page.masked')
    if ((masked !== null) !== on) {
      on = !on
      document.body.classList.toggle('ix-transitioning', on)
      // the old page shrinks about the middle of what is on screen, wherever it was scrolled to
      var old = on && document.querySelector('main .page.removing')
      if (old) old.style.transformOrigin = '50% ' + Math.round(window.innerHeight / 2 - old.getBoundingClientRect().top) + 'px'
      if (!ring) { ring = document.createElement('div'); ring.className = 'ix-pt-ring'; ring.setAttribute('aria-hidden', 'true'); document.body.appendChild(ring) }
      ring.style.display = on && !reduced ? 'block' : 'none'
    }
    if (on && ring && !reduced) {
      // the router animates the clip path with a CSS transform (translate, rotate, scale about its 0,0 centre)
      var clip = document.getElementById('circle-mask')
      var tf = clip && clip.style.transform
      if (tf) ring.style.transform = tf + ' scale(1.14)'
    }
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
})()
