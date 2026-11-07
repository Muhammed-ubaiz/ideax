// About page team cards: an interactive introduction for each member (styles in ideaxcorp-team.css).
// Hover a card (desktop), tap it (touch) or focus it and press Enter: the card comes forward in 3D, the portrait
// lifts out of it towards the visitor, a light sweeps across, and the member introduces themselves in a caption.
//  - With a video (data-video="/Assets/Video/team/NAME.mp4" on the card's <li>, ideally an AI talking-head video made
//    from the member's own portrait, with its own voice track), the video plays over the portrait with sound.
//    Browsers only allow sound after the visitor has interacted with the page; until then it plays muted with a
//    "Sound on" button.
//  - Without a video, the portrait itself comes alive (a slow push in to the face, a gentle breathing drift and the
//    light) and the introduction is typed out. No mouth or lip animation is faked.
// A cut-out of the portrait (data-pop, same framing as the photo, transparent background) lets the head step out
// over the frame's top edge. The introduction is data-intro on the <li>; without one it is made from the name and role on the card.
// One member at a time; leaving the card (or tapping elsewhere, Escape, a page change) fades the voice out, stops the
// video and settles the card back into place. Pages are swapped in without a reload, so it re-arms on 'ix:pageadded'.
;(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  var hover = window.matchMedia('(hover: hover) and (pointer: fine)').matches
  var live = null, enterT = 0

  function setup() {
    Array.prototype.forEach.call(document.querySelectorAll('.ixb-team .ixp-team > li'), function (li) {
      if (li._ixt) return
      var frame = li.querySelector('.ixp-team-photo'), figure = li.querySelector('figure')
      if (!frame || !figure) return
      var name = ((li.querySelector('figcaption b') || {}).textContent || '').trim()
      var role = ((li.querySelector('figcaption span') || {}).textContent || '').trim()
      var intro = li.getAttribute('data-intro') || ('Hi, I’m ' + name + ', ' + role + ' at Ideaxcorp. Nice to meet you!')
      // the frame holds the introduction now: only the initials (if any) are decoration
      frame.removeAttribute('aria-hidden')
      var ini = frame.querySelector(':scope > span'); if (ini) ini.setAttribute('aria-hidden', 'true')
      li.tabIndex = 0
      li.setAttribute('role', 'button')
      li.setAttribute('aria-expanded', 'false')
      li.setAttribute('aria-label', 'Meet ' + name + ', ' + role)
      var light = document.createElement('span'); light.className = 'ixt-light'; light.setAttribute('aria-hidden', 'true')
      var panel = document.createElement('div'); panel.className = 'ixt-intro'
      panel.innerHTML = '<span class="ixt-tag">' + (li.dataset.video ? 'Video intro' : 'Hello') + '</span><p class="ixt-text" aria-live="polite"></p>' +
        (li.dataset.video ? '<button type="button" class="ixt-sound">Sound on</button>' : '')
      frame.appendChild(light); figure.appendChild(panel) // the caption sits at the foot of the card, clear of the face
      if (li.dataset.pop) { // a cut-out of the portrait, for stepping out of the frame
        var pop = document.createElement('span'); pop.className = 'ixt-pop'; pop.setAttribute('aria-hidden', 'true')
        pop.innerHTML = '<img src="' + li.dataset.pop + '" alt="" decoding="async">'
        figure.insertBefore(pop, panel); li.classList.add('ixt-has-pop')
      }
      li._ixt = { intro: intro, frame: frame, figure: figure, text: panel.querySelector('.ixt-text'), typeT: 0, startT: 0, fadeT: 0, video: null }
      var snd = panel.querySelector('.ixt-sound')
      if (snd) snd.addEventListener('click', function (e) {
        e.stopPropagation()
        var v = li._ixt.video; if (!v) return
        v.muted = false; v.volume = 1; li.classList.remove('ixt-muted')
      })
    })
  }

  // ---------- open / close ----------
  function open(li) {
    if (!li || !li._ixt || live === li) return
    if (live) close(live)
    live = li
    var d = li._ixt
    li.classList.add('ixt-live')
    li.setAttribute('aria-expanded', 'true')
    clearTimeout(d.startT)
    d.text.textContent = ''
    d.startT = setTimeout(function () { type(d) }, reduced ? 0 : 380) // after the card has come forward
    if (li.dataset.video) play(li)
  }
  function close(li) {
    if (!li || !li._ixt) return
    var d = li._ixt
    li.classList.remove('ixt-live', 'ixt-typing')
    li.setAttribute('aria-expanded', 'false')
    li.style.removeProperty('--ixt-rx'); li.style.removeProperty('--ixt-ry')
    clearTimeout(d.startT); clearInterval(d.typeT)
    stop(li)
    if (live === li) live = null
  }
  function type(d) {
    var s = d.intro, i = 0, li = d.figure.closest('li')
    clearInterval(d.typeT)
    if (reduced) { d.text.textContent = s; return }
    li.classList.add('ixt-typing')
    d.typeT = setInterval(function () {
      i += s.charAt(i) === ' ' ? 2 : 1 // a natural-ish speaking pace (~16 characters a second)
      d.text.textContent = s.slice(0, i)
      if (i >= s.length) { clearInterval(d.typeT); li.classList.remove('ixt-typing') }
    }, 55)
  }

  // ---------- video (when the member has one) ----------
  function play(li) {
    var d = li._ixt, v = d.video
    clearInterval(d.fadeT)
    if (!v) {
      v = d.video = document.createElement('video')
      v.className = 'ixt-video'
      v.playsInline = true; v.setAttribute('playsinline', ''); v.preload = 'auto'
      v.src = li.dataset.video
      v.setAttribute('aria-hidden', 'true') // the caption carries the words
      v.addEventListener('playing', function () { if (live === li) li.classList.add('ixt-playing') })
      v.addEventListener('ended', function () { li.classList.remove('ixt-playing') })
      d.frame.insertBefore(v, d.frame.querySelector('.ixt-light'))
    }
    try { v.currentTime = 0 } catch (e) {}
    v.muted = false; v.volume = 1
    var p = v.play()
    if (p && p.catch) p.catch(function () { // no sound allowed yet: play muted, offer sound
      if (live !== li) return
      v.muted = true; li.classList.add('ixt-muted')
      v.play().catch(function () {})
    })
  }
  function stop(li) {
    var d = li._ixt, v = d.video
    li.classList.remove('ixt-playing', 'ixt-muted')
    if (!v) return
    clearInterval(d.fadeT)
    var k = 0, from = v.volume
    d.fadeT = setInterval(function () { // fade the voice out, then stop
      k++
      v.volume = Math.max(0, from * (1 - k / 8))
      if (k >= 8) { clearInterval(d.fadeT); v.pause(); try { v.currentTime = 0 } catch (e) {} }
    }, 35)
  }

  // ---------- input ----------
  function cardOf(t) { return t && t.closest && t.closest('.ixb-team .ixp-team > li') }
  if (hover) {
    document.addEventListener('mouseover', function (e) {
      var li = cardOf(e.target)
      if (!li || li.contains(e.relatedTarget)) return
      setup()
      clearTimeout(enterT)
      enterT = setTimeout(function () { open(li) }, 140) // a passing mouse doesn't set it off
    })
    document.addEventListener('mouseout', function (e) {
      var li = cardOf(e.target)
      if (!li || li.contains(e.relatedTarget)) return
      clearTimeout(enterT)
      if (live === li) close(li)
    })
    // the card tilts a little towards the mouse
    document.addEventListener('mousemove', function (e) {
      if (!live || reduced || !live.contains(e.target)) return
      var r = live.getBoundingClientRect()
      var x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5
      live.style.setProperty('--ixt-ry', (x * 10).toFixed(2) + 'deg')
      live.style.setProperty('--ixt-rx', (-y * 8).toFixed(2) + 'deg')
    }, { passive: true })
  }
  document.addEventListener('click', function (e) {
    var li = cardOf(e.target)
    if (li) { setup(); if (live === li) { if (!hover) close(li) } else open(li); return }
    if (live) close(live) // a tap elsewhere
  })
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && live) { var l = live; close(l); l.focus(); return }
    var li = cardOf(e.target)
    if (li && e.target === li && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setup(); live === li ? close(li) : open(li) }
  })
  document.addEventListener('focusout', function (e) {
    var li = cardOf(e.target)
    if (li && live === li && !li.contains(e.relatedTarget) && !hover) close(li)
  })
  document.addEventListener('visibilitychange', function () { if (document.hidden && live) close(live) })
  window.addEventListener('ix:pageadded', function () { if (live) close(live); setTimeout(setup, 0) })

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup); else setup()
})()
