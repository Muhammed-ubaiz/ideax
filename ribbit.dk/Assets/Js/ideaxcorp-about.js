// About page (styling in ideaxcorp-about.css): a light parallax. Images marked data-ixa-par drift inside
// their frames by that fraction of their distance from the middle of the screen, and the gallery's right
// column ([data-ixa-col]) moves a little slower than the page. Positions are read once per frame.
;(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  var queued = false
  function update() {
    queued = false
    var vh = window.innerHeight
    Array.prototype.forEach.call(document.querySelectorAll('[data-ixa-par]'), function (img) {
      var frame = img.parentNode.getBoundingClientRect()
      if (frame.bottom < -100 || frame.top > vh + 100) return
      var k = parseFloat(img.getAttribute('data-ixa-par')) || 0
      var off = (frame.top + frame.height / 2 - vh / 2) * k
      var max = frame.height * 0.06 // the images are 12% taller than their frames
      img.style.translate = '0 ' + Math.max(-max, Math.min(max, off)).toFixed(1) + 'px'
    })
    Array.prototype.forEach.call(document.querySelectorAll('[data-ixa-col]'), function (col) {
      if (window.innerWidth <= 1000) { col.style.translate = ''; return }
      var r = col.parentNode.getBoundingClientRect()
      if (r.bottom < 0 || r.top > vh) return
      col.style.translate = '0 ' + ((r.top + r.height / 2 - vh / 2) * 0.08).toFixed(1) + 'px'
    })
  }
  function queue() { if (!queued) { queued = true; requestAnimationFrame(update) } }
  window.addEventListener('scroll', queue, { passive: true })
  window.addEventListener('resize', queue)
  queue()
  setInterval(queue, 1000) // pages are swapped in without a reload
  window.addEventListener('ix:pageadded', queue)
})()
