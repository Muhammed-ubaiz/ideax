// Subtle scroll motion layered on top of the site's own smooth scroller:
// parallax on the footer wordmark and the client heading (portfolio posters stay at their true size).
// Reads positions once per frame from the scroll the site already drives, so it never fights it.
;(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced) {
    // no eased scrolling either: jump straight to where the visitor scrolls
    var stop = setInterval(function () { if (window._smoothScroller) { window._smoothScroller._speed = 1; clearInterval(stop) } }, 200)
    return
  }

  // [selector, strength in px across one screen height, extra scale]
  var LAYERS = [
    ['footer .ix-footer-mark', -60, 1],      // footer wordmark moves slower than the page
    ['.ix-clients-head', -18, 1],            // client heading floats slightly against the cards
  ]
  var items = []
  function collect() {
    items = []
    LAYERS.forEach(function (l) {
      Array.prototype.forEach.call(document.querySelectorAll(l[0]), function (el) {
        if (el.dataset.ixPx) return
        el.dataset.ixPx = '1'
        el.style.willChange = 'translate'
        if (l[2] !== 1) el.style.scale = l[2]
      })
      Array.prototype.forEach.call(document.querySelectorAll(l[0]), function (el) { items.push({ el: el, k: l[1] }) }) // same strength on phones as on desktop
    })
  }

  // parallax: worked out only while the page scrolls (one pass per frame), idle otherwise
  var last = -1, queued = false
  function frame() {
    queued = false
    var y = window.scrollY
    if (y === last) return
    last = y
    var vh = window.innerHeight
    for (var i = 0; i < items.length; i++) {
      var it = items[i], r = it.el.getBoundingClientRect()
      if (r.bottom < -200 || r.top > vh + 200) continue
      // -1 when the element's centre is at the bottom of the screen, +1 at the top
      var p = Math.max(-1, Math.min(1, 1 - (r.top + r.height / 2) / (vh / 2)))
      it.el.style.translate = '0 ' + (-p * it.k).toFixed(1) + 'px'
    }
  }
  function queue() { if (!queued) { queued = true; requestAnimationFrame(frame) } }
  window.addEventListener('scroll', queue, { passive: true })
  window.addEventListener('resize', function () { last = -1; queue() })

  // looping CSS animations (marquees, outlined text bands, bobbing mascots, scroll cues) pause while their
  // section is off screen: running, each one makes the browser recalculate styles on every frame of scrolling.
  // They start again a little before the section scrolls back in (300px margin).
  var offIO = window.IntersectionObserver ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { e.target.classList.toggle('ix-off', !e.isIntersecting) })
  }, { rootMargin: '300px 0px' }) : null
  function watchSections() {
    if (!offIO) return
    Array.prototype.forEach.call(document.querySelectorAll('main .page > *, footer'), function (el) {
      if (el.dataset.ixOff) return
      el.dataset.ixOff = '1'; offIO.observe(el)
    })
  }
  watchSections()
  window.addEventListener('ix:pageadded', function () { setTimeout(watchSections, 0) })

  collect()
  setInterval(function () { collect(); watchSections() }, 1500) // pages are swapped in without a reload
  window.addEventListener('ix:pageadded', function () { collect(); last = -1; queue() })
  queue()
})()

// "Marketing Agency": open a gap between the two words as wide as the small figure (outlaw) and
// stand it in that gap with its hands on the "A". The site's script parks it at the line's centre
// minus half of "Agency", which with these font sizes lands behind the "g" of "Marketing".
;(function () {
  var lastKey = ''
  function place() {
    var fig = document.querySelector('.m.push-titles .line .animations.smaller')
    if (!fig) { lastKey = ''; return }
    var line = fig.parentNode, texts = line.querySelectorAll('.text')
    // the "push" sequence (outlaw_pull frames) is the pose shown for most of the scroll
    var seq = fig.querySelector('.png-sequence[data-type="push"]')
    var vw = (window.GLB && GLB._vw) || line.clientWidth
    var key = vw + 'x' + fig.offsetWidth + 'x' + texts[0].offsetHeight
    if (key === lastKey || !seq || !fig.offsetWidth) return
    lastKey = key

    // where that figure is drawn: shifted by data-xadjust %, scaled about its bottom-right corner;
    // its hands reach to 358px of the 366px-wide frames, so the visible right edge is just inside the box
    var cw = fig.offsetWidth, scale = parseFloat(seq.getAttribute('data-scale')) || 1
    var xa = (parseFloat(seq.getAttribute('data-xadjust')) || 0) / 100
    var figW = cw * scale, handX = cw * (xa + 1) - figW * (8 / 366)
    var size = parseFloat(getComputedStyle(texts[0]).fontSize)
    var space = size * 0.25 // the &nbsp; after "Marketing"
    var gap = Math.max(0, figW * 1.1 - space)
    Array.prototype.forEach.call(texts, function (t) { t.children[0].style.marginRight = gap + 'px' })

    // hands just over the A's foot
    var a = texts[0].children[1], t = texts[0]
    fig.style.marginLeft = (t.offsetLeft + a.offsetLeft + size * 0.04 - (vw / 2 - a.offsetWidth / 2) - handX) + 'px'
    // the wider text starts gap/2 further left: keep the explorer just left of "Marketing"
    var explorer = line.querySelector('.animations:not(.smaller)')
    if (explorer) explorer.style.left = -gap / 2 + 'px'
  }
  window.addEventListener('resize', function () { lastKey = ''; place() })
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { lastKey = ''; place() })
  place()
  setInterval(place, 1000) // pages are swapped in without a reload
})()
