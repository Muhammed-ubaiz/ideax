// Custom cursor (styling in ideaxcorp-cursor.css), two states only: a small glowing purple dot that sits exactly
// on the pointer, and a thin purple ring with a small arrow in the middle over links, buttons,
// navigation and portfolio images. Desktop only (a fine pointer that can hover); touch devices keep the default.
// The position is written once per frame, and only when the pointer has moved.
;(function () {
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)')
  if (!fine.matches) return
  var root = document.documentElement
  var HOVER = 'a, button, [role="button"], label, summary, select, input[type="submit"], input[type="button"], .ixp-card-link, .ix-bar-menu, ' +
    '.ix-work-media, .ixp-card-media, .project-thumb .media, .ixa-g'
  var TEXT = 'input:not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"]), textarea, [contenteditable="true"]'

  var cur = document.createElement('div')
  cur.className = 'ix-cur'
  cur.setAttribute('aria-hidden', 'true')
  cur.innerHTML = '<span class="ix-cur-dot"></span>' +
    '<span class="ix-cur-badge"><span class="ix-cur-arrow"><svg viewBox="0 0 24 24"><path d="M7 17 17 7M9 7h8v8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span></span>'
  document.body.appendChild(cur)
  root.classList.add('ix-cur-on')

  var x = 0, y = 0, queued = false
  function paint() { queued = false; cur.style.translate = x + 'px ' + y + 'px' }
  function onMove(e) {
    x = e.clientX; y = e.clientY
    if (!queued) { queued = true; requestAnimationFrame(paint) }
    if (!root.classList.contains('ix-cur-in')) root.classList.add('ix-cur-in')
  }
  function onOver(e) {
    var t = e.target
    if (!t || !t.closest) return
    var text = !!t.closest(TEXT)
    root.classList.toggle('ix-cur-text', text)
    var h = t.closest(HOVER)
    if (h && h.matches('.ixp-team > li')) h = null // a team card opens in place (it's no link): the plain dot
    root.classList.toggle('ix-cur-hover', !text && !!h)
  }
  function onOut(e) { if (!e.relatedTarget) root.classList.remove('ix-cur-in') } // left the window, or into an iframe
  function onBlur() { root.classList.remove('ix-cur-in') }

  document.addEventListener('mousemove', onMove, { passive: true })
  document.addEventListener('mouseover', onOver, { passive: true })
  document.addEventListener('mouseout', onOut, { passive: true })
  window.addEventListener('blur', onBlur)

  // a device that stops reporting a fine pointer (e.g. a tablet unplugged from its keyboard) gets the default cursor back
  function teardown() {
    document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseover', onOver)
    document.removeEventListener('mouseout', onOut); window.removeEventListener('blur', onBlur)
    root.classList.remove('ix-cur-on', 'ix-cur-in', 'ix-cur-hover', 'ix-cur-text')
    cur.remove()
  }
  if (fine.addEventListener) fine.addEventListener('change', function (e) { if (!e.matches) teardown() })
})()
