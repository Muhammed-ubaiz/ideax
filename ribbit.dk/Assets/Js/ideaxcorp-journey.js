// Home journey (styling in ideaxcorp-journey.css). One character, the explorer, carries the whole page:
//  1. the hero ([data-walk="hero"]) is the scene where the characters carry the headline words into place
//     (ideaxcorp-build.js), or the site's title scene where they push them in (min9eda.js);
//  2. once the headline is built, the explorer by "Marketing" jumps straight down out of the
//     scene: a crouch, a spring up, a fall (shrinking to walking size) and a squash-and-rebound landing at the
//     bottom of the screen. The walking guide takes over from the hero figure in the same place, pose and size,
//     so it is one character throughout; scrolling back up plays the jump in reverse;
//  3. from where it landed it walks the bottom of the screen as on the About page: one slow, steady walk to the
//     right over the rest of the page, facing its way, with a step-bounce, and the section in the middle of the
//     screen ([data-say]) named in its speech bubble;
//  4. while the CTA ([data-walk="cta"]) is in the middle of the screen, its first button pulses.
// Everything follows a smoothed copy of the scroll position, so it scrubs with the scroll and never jumps.
;(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  var FRAMES = 40, frames = [], steps = [] // explorer_idle: its resting pose (345x390); explorer_push: its walk, leaning on its staff (360x360); both face right
  var hero = null, guide = null, img = null, say = null
  var ss = null, x = null, lastX = null, dir = 1, walk = 0, movedAt = 0, lastFrame = '', label = '', ctaSec = null
  var from = null // the hero explorer's place on screen when the jump starts
  var running = false, lastT = 0

  function src(i, set) { return '/Assets/Grx/explorer_' + (set || 'idle') + '/' + String(i).padStart(3, '0') + '.webp?v=2' } // lossless WebP copies of the frames

  function build() {
    if (guide) return
    guide = document.createElement('div'); guide.className = 'ixj-guide'; guide.setAttribute('aria-hidden', 'true')
    guide.innerHTML = '<span class="ixj-say"></span><img src="' + src(0) + '" alt="" width="345" height="390">'
    document.body.appendChild(guide)
    img = guide.querySelector('img'); say = guide.querySelector('.ixj-say')
    // fetched once the page has loaded, so they don't hold up the load event (and the site's intro with it)
    var fetchAll = function () {
      for (var i = 0; i < FRAMES; i++) {
        var im = new Image(); im.src = src(i); frames.push(im)
        var st = new Image(); st.src = src(i, 'push'); steps.push(st)
      }
    }
    if (document.readyState === 'complete') fetchAll(); else window.addEventListener('load', fetchAll, { once: true })
  }

  function setup() {
    var h = document.querySelector('[data-walk="hero"]')
    if (h === hero) return
    hero = h
    // the title scene opens the page: min9eda.js then starts its words at the screen edges and has the
    // figures bring them in over the pinned scroll (desktop and laptop)
    window._ixPtHero = !!(hero && hero.classList.contains('push-titles'))
    // so the titles take their starting places now, and again once the site has switched their figures on
    ;[0, 400, 1200, 3000].forEach(function (t) { setTimeout(function () { window.dispatchEvent(new Event('scroll')) }, t) })
    if (!hero) { if (guide) guide.classList.remove('on', 'talk'); return }
    build()
    ctaSec = document.querySelector('[data-walk="cta"]')
    ss = x = lastX = from = null; label = ''
    wake()
  }

  // the explorer in the hero ("Marketing"), and the frame it is showing
  function heroFig() {
    var c = hero.querySelector('[data-ixs-char="explorer"]')
    if (c) return c
    var lines = hero.querySelectorAll('.line')
    return lines[2] ? lines[2].querySelector('.animations:not(.smaller)') : null
  }
  function figRect(a) {
    var im = a && (a.querySelector('.png-sequence:not(.hide) .img:not(.hide)') || a.querySelector('img'))
    var r = im && im.getBoundingClientRect()
    return r && r.width ? { cx: r.left + r.width / 2, bottom: r.bottom, h: r.height } : null
  }

  function clamp(v) { return Math.max(0, Math.min(1, v)) }
  function ease(t) { return t * t * (3 - 2 * t) }

  // ---------- frame ----------
  function frame(now) {
    running = false
    if (!hero || !document.body.contains(hero)) { setup(); if (!hero) return }
    var dt = Math.min(64, now - (lastT || now)); lastT = now
    var w = window.innerWidth, vh = window.innerHeight, gw = guide.offsetWidth, gh = guide.offsetHeight
    var sy = window.scrollY
    hero.classList.toggle('ixj-moved', sy - hero.offsetTop > 40) // the hero's scroll cue goes once the scroll starts
    var ready = !window._introOn && !window._pageTransitioning // not over the intro screen or a page transition

    // the scrub: a smoothed copy of the scroll position drives everything
    if (ss === null || reduced) ss = sy
    else ss += (sy - ss) * (1 - Math.pow(1 - 0.14, dt / 16.67))
    if (Math.abs(sy - ss) < 0.3) ss = sy

    // the jump: after the titles have landed (on desktops the last line settles 1.15 screens into the hero's
    // scroll; on phones they show at once), and over before the hero lets go of the screen
    var top = hero.offsetTop, pinEnd = top + hero.offsetHeight - vh
    var j0 = Math.min(top + (w >= 768 ? 1.2 : 0.06) * vh, pinEnd - 0.3 * vh), j1 = j0 + 0.26 * vh
    if (hero.dataset.jump0) { j0 = top + parseFloat(hero.dataset.jump0) * (pinEnd - top); j1 = top + parseFloat(hero.dataset.jump1) * (pinEnd - top) } // the hero says when
    var t = reduced ? (ss > j0 ? 1 : 0) : clamp((ss - j0) / (j1 - j0))
    var fig = heroFig()
    // the hero figure's place: where the hero scene says it stands (ideaxcorp-build.js), or else its place on screen
    if (hero.dataset.handoff) from = JSON.parse(hero.dataset.handoff)
    else if (t <= 0) { var fr = figRect(fig); if (fr) from = fr } // keeps it up to date until it jumps
    if (!from) from = { cx: w * 0.15, bottom: vh * 0.7, h: gh * 1.5 }

    // where it lands: straight below the hero figure, standing on the bottom of the screen
    var landX = Math.max(8, Math.min(w - gw - 8, from.cx - gw / 2))
    var tx, ty = 0, sc = 1, sqx = 1, sqy = 1, rot = 0, speech = ''
    if (t < 1) {
      // from the figure's place (scaled to its size) to the landing spot
      var s0 = from.h / gh, startTy = from.bottom - (vh - 6), rise = from.h * 0.22
      tx = from.cx - gw / 2
      if (t < 0.18) { // anticipation: bends down
        var a = ease(t / 0.18); sc = s0; ty = startTy; sqy = 1 - 0.12 * a; sqx = 1 + 0.06 * a
      } else if (t < 0.38) { // take-off: springs up, stretched, leaning back
        var b = (t - 0.18) / 0.2, bo = 1 - Math.pow(1 - b, 2); sc = s0; ty = startTy - rise * bo
        sqy = 0.88 + 0.2 * bo; sqx = 1.06 - 0.1 * bo; rot = -6 * bo
      } else if (t < 0.86) { // the fall: gravity, shrinking to walking size, turning upright
        var c = (t - 0.38) / 0.48; ty = (startTy - rise) + (0 - (startTy - rise)) * c * c
        tx = from.cx - gw / 2 + (landX - (from.cx - gw / 2)) * c
        sc = s0 + (1 - s0) * c; sqy = 1.08 - 0.08 * c; sqx = 0.96 + 0.04 * c; rot = -6 + 10 * Math.sin(c * Math.PI * 0.9)
      } else { // the landing: squash, then a small rebound
        var d = (t - 0.86) / 0.14; tx = landX
        sqy = 1 - 0.16 * Math.sin(Math.PI * Math.min(1, d * 1.8)) * (d < 0.56 ? 1 : 0); sqx = 2 - sqy
        ty = d > 0.56 ? -Math.sin(Math.PI * (d - 0.56) / 0.44) * gh * 0.08 : 0
      }
      x = lastX = null; walk = 0
    } else {
      // walking, as on the About page: from where it landed to the right over the rest of the page
      var max = document.documentElement.scrollHeight - vh
      var p = clamp((ss - j1) / Math.max(1, max - j1))
      x = landX + ((w - gw) * 0.9 - landX) * p
      if (lastX !== null && Math.abs(x - lastX) > 0.2) { dir = x < lastX ? -1 : 1; walk += Math.abs(x - lastX); movedAt = now }
      lastX = x; tx = x
      // the section in the middle of the screen names itself
      var mid = vh / 2, secs = document.querySelectorAll('[data-say]')
      for (var i = 0; i < secs.length; i++) {
        var r = secs[i].getBoundingClientRect()
        if (r.top <= mid && r.bottom > mid) { speech = secs[i].getAttribute('data-say'); break }
      }
    }

    // the hero figure hands over to the guide the moment the jump starts (same frames, place and size)
    var shown = t > 0 && ready && !document.body.classList.contains('ix-transitioning')
    if (fig) fig.style.visibility = shown ? 'hidden' : '' // hidden only while the guide stands in for it, so it never vanishes
    guide.classList.toggle('on', shown)
    guide.classList.toggle('left', t >= 1 && dir < 0)
    guide.style.translate = tx.toFixed(1) + 'px ' + ty.toFixed(1) + 'px'
    guide.style.scale = (sc * sqx).toFixed(4) + ' ' + (sc * sqy).toFixed(4)
    guide.style.rotate = rot.toFixed(2) + 'deg'
    // its resting loop plays all the time, as the hero figure's does
    // walking: its walk cycle, the steps keeping pace with the ground it covers; standing (and jumping): its resting loop
    var walking = !reduced && t >= 1 && now - movedAt < 180
    var set = walking ? steps : frames, fi = walking ? Math.floor(walk / 2.6) % FRAMES : reduced ? 0 : Math.floor(now / 50) % FRAMES
    var key = (walking ? 'w' : 'i') + fi
    if (key !== lastFrame && set[fi] && set[fi].complete) { img.src = set[fi].src; lastFrame = key }

    // the bubble names the section in view
    if (speech && speech !== label) { label = speech; say.textContent = speech; say.classList.remove('pop'); void say.offsetWidth; say.classList.add('pop') }
    if (!speech) label = ''
    guide.classList.toggle('talk', !!speech)
    if (ctaSec) ctaSec.classList.toggle('ixj-arrived', speech !== '' && speech === (ctaSec.getAttribute('data-say') || ''))

    if (ss !== sy || shown) wake() // keeps scrubbing, and the resting loop plays while it is shown
  }
  function wake() { if (!running) { running = true; requestAnimationFrame(frame) } }

  // services rows on the home page: the image floats beside the cursor (the About page does its own)
  document.addEventListener('mousemove', function (e) {
    var row = e.target.closest && e.target.closest('.ixj-svc')
    if (!row) return
    var im = row.querySelector('.ixb-svc-img'), r = row.getBoundingClientRect()
    if (im) im.style.translate = (e.clientX - r.left + 28).toFixed(0) + 'px ' + (e.clientY - r.top - im.offsetHeight / 2).toFixed(0) + 'px'
  }, { passive: true })

  window.addEventListener('scroll', wake, { passive: true })
  window.addEventListener('resize', wake)
  window.addEventListener('ix:pageadded', function () { setTimeout(function () { hero = null; setup() }, 0) })
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup)
  else setup()
  setInterval(function () { setup(); if (hero) wake() }, 400) // waits out the intro; re-attaches after page swaps
})()
