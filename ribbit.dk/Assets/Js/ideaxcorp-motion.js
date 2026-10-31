// Subtle scroll motion layered on top of the site's own smooth scroller:
// parallax on portfolio images (inside their clipped frames), the footer wordmark and the hero logo.
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
    ['.ix-work-media img', 14, 1.08],        // portfolio images drift inside their frames (8% zoom leaves ~17px each side)
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

  var last = -1
  function frame() {
    var y = window.scrollY
    if (y !== last) {
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
    requestAnimationFrame(frame)
  }

  // Slower scrolling through the "Curious / Full-service / Marketing Agency" section: the wheel step
  // eases from 0.5 (normal) down to 0.28 while the section fills the screen, then back up.
  var NORMAL = 0.5, SLOW = 0.28
  function wheelSpeed() {
    var s = document.querySelector('.m.push-titles')
    if (!s) { window._ixWheel = NORMAL; return }
    var r = s.getBoundingClientRect(), vh = window.innerHeight
    // how much of the screen the section covers (0..1), eased so the change is gradual
    var cover = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0)) / vh
    var t = Math.min(1, cover / 0.6)
    t = t * t * (3 - 2 * t)
    window._ixWheel = NORMAL + (SLOW - NORMAL) * t
  }
  ;(function loop() { wheelSpeed(); requestAnimationFrame(loop) })()

  collect()
  setInterval(collect, 1500) // pages are swapped in without a reload
  requestAnimationFrame(frame)
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
