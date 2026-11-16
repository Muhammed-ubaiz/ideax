// Our Portfolio: cards rise in turn and "All Projects" rises in at the end.
;(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // "Our Clients": reveal the heading and logo cards once
  function initClients() {
    var s = document.querySelector('.ix-clients')
    if (!s || s.dataset.ready) return
    s.dataset.ready = '1'
    if (reduced) return
    s.classList.add('armed')

    new IntersectionObserver(function (e, o) {
      if (!e[0].isIntersecting) return
      s.classList.add('in')
      s.dispatchEvent(new Event('ix-clients-in'))
      setTimeout(function () { s.classList.add('done') }, 1800)
      o.disconnect()
    }, { rootMargin: '0px 0px -15% 0px' }).observe(s)
  }

  function init() {
    initClients()
    var section = document.querySelector('.ix-work')
    if (!section || section.dataset.ready) return
    section.dataset.ready = '1'
    var items = Array.prototype.slice.call(section.querySelectorAll('.ix-work-item'))

    // heading + cards reveal
    var head = section.querySelector('.ix-pf-head')
    if (!reduced) { section.classList.add('armed'); head.classList.add('armed') }
    items.forEach(function (it, i) { it.style.setProperty('--d', (i * 0.09) + 's') })
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return
        e.target.classList.add('in')
        io.unobserve(e.target)
        if (e.target.classList.contains('ix-work-item')) setTimeout(function () { e.target.classList.add('done') }, 2000)
      })
    }, { rootMargin: '0px 0px -12% 0px' })
    io.observe(head)
    items.forEach(function (it) { io.observe(it) })
    io.observe(section.querySelector('.ix-work-end'))
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
  else init()
  setInterval(init, 1000) // the site swaps page content without a full reload
  window.addEventListener('ix:pageadded', init)
})()
// Portfolio "All projects": a purple pill slides behind the chosen filter (the filtering itself: ideaxcorp-pages.js)
;(function () {
  function bars() { return document.querySelectorAll('#all-work .ixp-filters') }
  function move(f, instant) {
    var p = f._pill, b = f.querySelector('.ixp-filter[aria-pressed="true"]')
    if (!p || !b) return
    if (instant) p.style.transition = 'none'
    p.style.width = b.offsetWidth + 'px'; p.style.height = b.offsetHeight + 'px'
    p.style.transform = 'translate(' + b.offsetLeft + 'px,' + b.offsetTop + 'px)'
    if (instant) { void p.offsetWidth; p.style.transition = '' }
    // on a narrow screen the bar scrolls sideways: bring the chosen filter into view
    if (!instant && f.scrollWidth > f.clientWidth) f.scrollTo({ left: Math.max(0, b.offsetLeft - 24), behavior: 'smooth' })
  }
  function init() {
    Array.prototype.forEach.call(bars(), function (f) {
      if (f._pill) return
      var p = document.createElement('span'); p.className = 'ixw-pill'; p.setAttribute('aria-hidden', 'true')
      f.insertBefore(p, f.firstChild); f._pill = p; f.classList.add('ixw-pill-on')
      move(f, true)
    })
  }
  function all(instant) { Array.prototype.forEach.call(bars(), function (f) { move(f, instant) }) }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('#all-work .ixp-filter')
    if (b) setTimeout(function () { move(b.closest('.ixp-filters')) }, 0) // after the filter has marked it pressed
  })
  window.addEventListener('resize', function () { all(true) })
  window.addEventListener('load', function () { all(true) })
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { all(true) })
  window.addEventListener('ix:pageadded', function () { setTimeout(function () { init(); setTimeout(function () { all(true) }, 400) }, 0) })
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init()
})()
