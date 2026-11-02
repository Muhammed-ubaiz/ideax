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
  // home page: no bar over the mascot hero; it comes in once the hero has been scrolled past
  function heroCheck() {
    var b = bar()
    if (!b) return
    var hide = !!document.querySelector('.m.showreel') && window.scrollY < window.innerHeight * .9
    if (hide && b.classList.contains('open')) setOpen(b, false)
    b.classList.toggle('ix-bar-off', hide)
  }
  window.addEventListener('scroll', heroCheck, { passive: true })
  window.addEventListener('resize', heroCheck)
  heroCheck()
  setInterval(heroCheck, 500) // pages are swapped in without a reload

  document.addEventListener('keydown', function (e) {
    var b = bar()
    if (e.key === 'Escape' && b && b.classList.contains('open')) { setOpen(b, false); b.querySelector('.ix-bar-menu').focus() }
  })
})()
