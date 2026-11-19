// Ideaxcorp Contact page (/contact/): pieces marked data-ixct rise in as they scroll into view (in turn within each
// section); the office tabs show one office and its map at a time, with a dark pill sliding under the chosen tab
// (arrow keys move between tabs); a soft light follows the pointer over the three contact cards.
// The form's validation and sending stay in ideaxcorp-contact.js. Pages are swapped in without a reload, so setup
// runs again on ix:pageadded and once a second, and only once per element.
;(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target) } })
  }, { rootMargin: '0px 0px -10% 0px' }) : null

  function reveals(page) {
    Array.prototype.forEach.call(page.querySelectorAll('section'), function (sec) {
      var k = 0
      Array.prototype.forEach.call(sec.querySelectorAll('[data-ixct]:not([data-ixct-ready])'), function (el) {
        el.setAttribute('data-ixct-ready', '')
        el.style.setProperty('--d', Math.min(k++, 5) * 0.08 + 's')
        if (io && !reduce) io.observe(el); else el.classList.add('is-in')
      })
    })
  }

  function tabs(page) {
    var bar = page.querySelector('.ixct-tabs')
    if (!bar) return
    if (bar.dataset.ready) { if (bar.ixPlace) bar.ixPlace(); return }
    bar.dataset.ready = '1'
    var btns = Array.prototype.slice.call(bar.querySelectorAll('.ixct-tab'))
    var ind = bar.querySelector('.ixct-tab-ind')
    function place() {
      var on = bar.querySelector('[aria-selected="true"]')
      if (!on || !ind || !on.offsetWidth) return
      ind.style.width = on.offsetWidth + 'px'
      ind.style.transform = 'translateX(' + (on.offsetLeft - 5) + 'px)'
    }
    function pick(b, focus) {
      btns.forEach(function (x) {
        var on = x === b, p = document.getElementById(x.getAttribute('aria-controls'))
        x.setAttribute('aria-selected', on ? 'true' : 'false')
        x.tabIndex = on ? 0 : -1
        if (p) { p.hidden = !on; p.classList.toggle('is-shown', on && !reduce) }
      })
      if (focus) b.focus()
      place()
    }
    btns.forEach(function (b, i) {
      b.addEventListener('click', function () { pick(b) })
      b.addEventListener('keydown', function (e) {
        var n = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
        if (!n) return
        e.preventDefault()
        pick(btns[(i + n + btns.length) % btns.length], true)
      })
    })
    bar.ixPlace = place
    pick(btns[0])
    btns.forEach(function (x) { var p = document.getElementById(x.getAttribute('aria-controls')); if (p) p.classList.remove('is-shown') })
    window.addEventListener('resize', place)
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(place)
  }

  function light(page) {
    if (reduce || !window.matchMedia('(hover: hover)').matches) return
    Array.prototype.forEach.call(page.querySelectorAll('.ixct-card:not([data-light])'), function (c) {
      c.setAttribute('data-light', '')
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect()
        c.style.setProperty('--mx', (e.clientX - r.left) + 'px')
        c.style.setProperty('--my', (e.clientY - r.top) + 'px')
      })
    })
  }

  function setup() {
    var page = document.querySelector('.ixct-intro')
    if (!page) return
    page = page.closest('.page') || document
    document.documentElement.classList.add('ixct-on')
    reveals(page); tabs(page); light(page)
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup)
  else setup()
  window.addEventListener('ix:pageadded', setup)
  setInterval(setup, 1000)
})()
