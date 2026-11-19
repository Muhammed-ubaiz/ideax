// Blog page (/blog/; styles: ideaxcorp-blog.css). Featured card, list heading and article cards arrive once as
// they scroll in (.is-in), in turn; the shown articles are dealt into the bento grid (again after each filter); the
// heading counts them; a line slides under the chosen category
// filter. The filtering itself is ideaxcorp-pages.js. The site swaps pages without reloading, so everything is
// set up again when the page changes.
;(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  var list = null, io = null
  function setup() {
    var l = document.querySelector('[data-ixbl-grid]')
    if (l === list) return
    list = l
    if (io) { io.disconnect(); io = null }
    if (!list) return
    var page = list.closest('.page') || document
    var els = Array.prototype.slice.call(page.querySelectorAll('.ixbl-fcard, .ixbl-sec-label, .ixbl-list-head, .ixbl-filters-wrap, .ixbl-item'))
    if (reduced || !window.IntersectionObserver) els.forEach(function (e) { e.classList.add('is-in') })
    else {
      io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target) } })
      }, { rootMargin: '0px 0px -8% 0px', threshold: .1 })
      els.forEach(function (e) { io.observe(e) })
    }
    counts(); layout(); indicator(true)
  }
  // each category's count, from the articles themselves
  function counts() {
    if (!list) return
    var its = Array.prototype.slice.call(list.children)
    Array.prototype.forEach.call(document.querySelectorAll('.ixbl-filters sup[data-count]'), function (s) {
      var v = s.getAttribute('data-count')
      s.textContent = v === 'all' ? its.length : its.filter(function (li) { return (' ' + li.getAttribute('data-cat') + ' ').indexOf(' ' + v + ' ') !== -1 }).length
    })
  }
  // the bento: the first shown article is the feature, the next two the compact blocks, the rest three to a row
  // (the middle one turned over and tinted); leftovers fill a half or a whole row
  function layout() {
    if (!list) return
    var shown = Array.prototype.filter.call(list.children, function (li) { return !li.classList.contains('is-hidden') })
    var rest = Math.max(0, shown.length - 3), whole = rest - rest % 3
    Array.prototype.forEach.call(list.children, function (li) { li.classList.remove('pos-feat', 'pos-mini', 'pos-rest', 'tint', 'rest-b', 'rest-half', 'rest-full') })
    shown.forEach(function (li, k) {
      if (k === 0) li.classList.add('pos-feat')
      else if (k < 3) { li.classList.add('pos-mini'); if (k === 2) li.classList.add('tint') }
      else {
        var r = k - 3
        li.classList.add('pos-rest')
        if (r < whole) { if (r % 3 === 1) li.classList.add('rest-b', 'tint') }
        else li.classList.add(rest % 3 === 1 ? 'rest-full' : 'rest-half')
      }
      li.style.setProperty('--d', (k < 3 ? k : (k - 3) % 3) * 0.08 + 's')
    })
    list.setAttribute('data-n', shown.length)
    var n = document.querySelector('.ixbl-h2-n'); if (n) n.textContent = (shown.length < 10 ? '0' : '') + shown.length
  }
  // the line under the chosen category
  function indicator(instant) {
    var bar = document.querySelector('.ixbl-filters')
    if (!bar) return
    var ind = bar.querySelector('.ixbl-ind')
    if (!ind) { ind = document.createElement('span'); ind.className = 'ixbl-ind'; ind.setAttribute('aria-hidden', 'true'); bar.insertBefore(ind, bar.firstChild); bar.classList.add('has-ind') }
    var b = bar.querySelector('.ixp-filter[aria-pressed="true"]')
    if (!b) return
    if (instant) ind.style.transition = 'none'
    ind.style.width = b.offsetWidth + 'px'
    ind.style.transform = 'translateX(' + b.offsetLeft + 'px)'
    if (instant) { void ind.offsetWidth; ind.style.transition = '' }
    if (!instant && bar.scrollWidth > bar.clientWidth) bar.scrollTo({ left: Math.max(0, b.offsetLeft - 24), behavior: reduced ? 'auto' : 'smooth' })
  }
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('.ixbl-filters .ixp-filter')) setTimeout(function () { layout(); indicator(false) }, 0) // after the filter has run
  })
  window.addEventListener('resize', function () { indicator(true) })
  window.addEventListener('load', function () { indicator(true) })
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { indicator(true) })
  window.addEventListener('ix:pageadded', function () { setTimeout(function () { setup(); setTimeout(function () { indicator(true) }, 400) }, 0) })
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup); else setup()
  setInterval(setup, 1000)
})()
