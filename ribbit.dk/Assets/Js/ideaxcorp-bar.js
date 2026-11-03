// Top navigation bar (styling in ideaxcorp-bar.css): MENU opens and closes the page links; they close
// again on a link click, a click outside the bar or Escape. The current page's link is marked.
;(function () {
  function bar() { return document.querySelector('.ix-bar') }
  function setOpen(b, open) {
    b.classList.toggle('open', open)
    b.querySelector('.ix-bar-menu').setAttribute('aria-expanded', open ? 'true' : 'false')
  }
  function markCurrent(b) {
    var path = location.pathname.replace(/index[^/]*\.html$/, '')
    Array.prototype.forEach.call(b.querySelectorAll('.ix-bar-links a'), function (a) {
      var here = a.getAttribute('href') === '/' ? path === '/' : path.indexOf(a.getAttribute('href')) === 0
      if (here) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current')
    })
  }

  document.addEventListener('click', function (e) {
    var b = bar()
    if (!b) return
    if (e.target.closest('.ix-bar-menu')) {
      var open = !b.classList.contains('open')
      if (open) markCurrent(b)
      setOpen(b, open)
    } else if (e.target.closest('.ix-bar-panel a') || !b.contains(e.target)) setOpen(b, false)
  })
  // home and About pages: no bar over the hero. An IntersectionObserver watches the hero's scroll space
  // (.m.showreelspace); once less of it than the top half of the screen is left, the bar is past the hero
  // and slides in (.ix-bar-past). CSS keeps it hidden on the home page until then, so it never flashes on load.
  var watched = null, io = null
  function watchHero() {
    var hero = document.querySelector('.m.showreelspace, .ixa-hero') // home's mascot hero, or the About hero
    if (hero === watched) return
    if (io) io.disconnect()
    watched = hero
    if (!hero) return
    io = new IntersectionObserver(function (entries) {
      var b = bar(), past = !entries[entries.length - 1].isIntersecting
      if (!b) return
      if (!past && b.classList.contains('open')) setOpen(b, false)
      b.classList.toggle('ix-bar-past', past)
    }, { rootMargin: '-50% 0px 0px 0px' })
    io.observe(hero)
  }
  watchHero()
  setInterval(watchHero, 1000) // pages are swapped in without a reload: re-attach to the new hero (no layout reads)
  window.addEventListener('ix:pageadded', watchHero)

  document.addEventListener('keydown', function (e) {
    var b = bar()
    if (e.key === 'Escape' && b && b.classList.contains('open')) { setOpen(b, false); b.querySelector('.ix-bar-menu').focus() }
  })
})()
