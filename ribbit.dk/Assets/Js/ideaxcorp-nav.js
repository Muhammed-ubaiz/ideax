// "Get in touch" is a plain link to the Ideaxcorp contact page. The site script still listens on
// .meeting buttons to open Ribbit's booking form, so stop the click here before it reaches them.
window.addEventListener('click', function (e) {
  if (e.target.closest && e.target.closest('a.meeting')) e.stopPropagation()
}, true)

// Corner logo: white-text version when the actual background behind the logo is dark, dark-text
// version when it is light. Reads the real colour under the logo instead of trusting section markers.
;(function () {
  function bgAt(x, y, skip) {
    var els = document.elementsFromPoint(x, y)
    for (var i = 0; i < els.length; i++) {
      var el = els[i]
      if (skip.contains(el) || el === document.documentElement) continue
      if (el.tagName === 'IMG') { var px = imgPixel(el, x, y); if (px) return px }
      // some browsers report only an image's frame at a point, not the image: check its child images
      var kids = el.children
      for (var j = 0; j < kids.length; j++) {
        if (kids[j].tagName !== 'IMG') continue
        var kr = kids[j].getBoundingClientRect()
        if (x >= kr.left && x <= kr.right && y >= kr.top && y <= kr.bottom) { var kp = imgPixel(kids[j], x, y); if (kp) return kp }
      }
      var cs = getComputedStyle(el)
      if (cs.backgroundImage && cs.backgroundImage !== 'none' && /gradient/.test(cs.backgroundImage)) {
        var m = cs.backgroundImage.match(/rgba?\([^)]+\)/)          // first gradient stop is a fair sample
        if (m) return m[0]
      }
      var c = cs.backgroundColor
      if (c && !/rgba\(0, 0, 0, 0\)|transparent/.test(c)) return c
    }
    return getComputedStyle(document.body).backgroundColor
  }
  // colour of an image at a screen point (handles object-fit cover/contain and object-position)
  var canv = {}
  function imgPixel(img, x, y) {
    if (!img.complete || !img.naturalWidth) return null
    try {
      var c = canv[img.currentSrc]
      if (!c) {
        c = document.createElement('canvas')
        var k = Math.min(1, 400 / img.naturalWidth)
        c.width = Math.max(1, Math.round(img.naturalWidth * k)); c.height = Math.max(1, Math.round(img.naturalHeight * k))
        c.getContext('2d', { willReadFrequently: true }).drawImage(img, 0, 0, c.width, c.height)
        canv[img.currentSrc] = c
      }
      var r = img.getBoundingClientRect(), cs = getComputedStyle(img), fit = cs.objectFit
      var iw = img.naturalWidth, ih = img.naturalHeight, sc
      if (fit === 'cover') sc = Math.max(r.width / iw, r.height / ih)
      else if (fit === 'contain' || fit === 'scale-down') sc = Math.min(r.width / iw, r.height / ih)
      else sc = null
      var u, v
      if (sc) {
        var dw = iw * sc, dh = ih * sc, pos = cs.objectPosition.split(' ')
        var px = function (p, free) { return /%$/.test(p) ? parseFloat(p) / 100 * free : parseFloat(p) || 0 }
        var ox = px(pos[0] || '50%', r.width - dw), oy = px(pos[1] || '50%', r.height - dh)
        u = (x - r.left - ox) / dw; v = (y - r.top - oy) / dh
      } else { u = (x - r.left) / r.width; v = (y - r.top) / r.height }
      if (u < 0 || u > 1 || v < 0 || v > 1) return null
      var d = c.getContext('2d', { willReadFrequently: true }).getImageData(Math.min(c.width - 1, u * c.width | 0), Math.min(c.height - 1, v * c.height | 0), 1, 1).data
      if (d[3] < 128) return null // transparent part of the image: look behind it
      return 'rgb(' + d[0] + ',' + d[1] + ',' + d[2] + ')'
    } catch (e) { return null }
  }
  function isDark(c) {
    var n = (c.match(/[\d.]+/g) || [255, 255, 255]).map(Number)
    if (n.length > 3 && n[3] < .5) return false
    return 0.2126 * n[0] + 0.7152 * n[1] + 0.0722 * n[2] < 128
  }
  var tick = false
  function update() {
    tick = false
    var reel = document.querySelector('.ix-reel')
    if (!reel) return
    var loop = reel.closest('.loop') || reel
    var r = reel.getBoundingClientRect()
    if (!r.width) return
    // sample left, centre and right of the logo; dark if most samples are dark
    var y = r.top + r.height / 2, darkCount = 0
    ;[0.2, 0.5, 0.8].forEach(function (f) { if (isDark(bgAt(r.left + r.width * f, y, loop))) darkCount++ })
    reel.classList.toggle('on-dark', darkCount >= 2)
  }
  function queue() { if (!tick) { tick = true; requestAnimationFrame(update) } }
  window.addEventListener('scroll', queue, { passive: true })
  window.addEventListener('resize', queue)
  setInterval(update, 300) // the site also moves things with its own smooth scroller
})()
