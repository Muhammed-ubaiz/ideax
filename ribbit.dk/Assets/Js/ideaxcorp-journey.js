// The journey (styling in ideaxcorp-journey.css). One character, the explorer, guides the visitor through every page:
//  1. on the home page it starts in the hero ([data-walk="hero"], ideaxcorp-build.js): once the headline is built it
//     jumps straight down out of the scene (a crouch, a spring up, a fall shrinking to walking size, a squash-and-
//     rebound landing at the bottom of the screen), taking over from the hero figure in the same place, pose and size;
//     scrolling back up plays the jump in reverse. On the other pages it walks in from the left edge as the page opens;
//  2. then it walks the bottom of the screen as you scroll: one steady walk from the left to the right over the whole
//     page, facing its way, its legs keeping pace with the ground it covers, the section in the middle of the screen
//     ([data-say]) named in its bubble; while the CTA ([data-walk="cta"]) is in view, its first button pulses;
//  3. at the end of the page its bubble offers the next page (Home, About, Services, Portfolio, Blog, Contact). If the
//     visitor keeps scrolling down at the very bottom (or clicks the bubble) it walks off the bottom edge and the site
//     opens the next page with its own page transition, where the walk carries on. Reaching the end, or stopping
//     there, never moves on by itself; the menu works as usual;
//  4. the same backwards: scrolling on up at the very top (or clicking the bubble that then offers the page before)
//     it walks off the left edge and the previous page opens at its end, where it walks in from the right.
// Everything follows a smoothed copy of the scroll position, so it scrubs with the scroll and never jumps.
;(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  var FRAMES = 40, frames = [], steps = [] // explorer_idle: its resting pose (345x390); explorer_push: its walk, leaning on its staff (360x360); both face right
  var NEXT = { '/': ['/about/', 'About'], '/about/': ['/services/', 'Services'], '/services/': ['/portfolio/', 'Portfolio'], '/portfolio/': ['/blog/', 'Blog'], '/blog/': ['/contact/', 'Contact'] }
  var PREV = { '/about/': ['/', 'Home'], '/services/': ['/about/', 'About'], '/portfolio/': ['/services/', 'Services'], '/blog/': ['/portfolio/', 'Portfolio'], '/contact/': ['/blog/', 'Blog'] }
  var page = null, hero = null, guide = null, img = null, say = null
  var ss = null, x = null, lastX = null, dir = 1, walk = 0, movedAt = 0, lastFrame = '', label = '', ctaSec = null
  var from = null // the hero explorer's place on screen when the jump starts
  var enterT0 = 0, enterRight = false, arriveEnd = false, arriveAt = 0, arriveOld = null, arriveCheck = 0, calmUntil = 0, exitT0 = 0, exitDir = 1, exitFrom = null, intent = 0, intentAt = 0, touchY = null
  var running = false, lastT = 0
  document.documentElement.classList.add('ix-journey') // (the About page's own guide stands down: this one walks every page)

  function src(i, set) { return '/Assets/Grx/explorer_' + (set || 'idle') + '/' + String(i).padStart(3, '0') + '.webp?v=2' } // lossless WebP copies of the frames

  function build() {
    if (guide) return
    guide = document.createElement('div'); guide.className = 'ixj-guide'; guide.setAttribute('aria-hidden', 'true')
    guide.innerHTML = '<span class="ixj-say"></span><img src="' + src(0) + '" alt="" width="345" height="390">'
    document.body.appendChild(guide)
    img = guide.querySelector('img'); say = guide.querySelector('.ixj-say')
    say.addEventListener('click', function () { if (guide.classList.contains('next')) leave(guide.classList.contains('back') ? -1 : 1) }) // the bubble takes you on (or back)
    // fetched once the page has loaded, so they don't hold up the load event (and the site's intro with it)
    var fetchAll = function () {
      for (var i = 0; i < FRAMES; i++) {
        var im = new Image(); im.src = src(i); frames.push(im)
        var st = new Image(); st.src = src(i, 'push'); steps.push(st)
      }
    }
    if (document.readyState === 'complete') fetchAll(); else window.addEventListener('load', fetchAll, { once: true })
  }

  function path() { var p = location.pathname.replace(/index[^/]*\.html$/, ''); return p.endsWith('/') ? p : p + '/' }

  function setup() {
    var p = path(), h = document.querySelector('[data-walk="hero"]')
    if (p === page && h === hero) return
    var newPage = p !== page // (the address changes as the transition starts; the new content, and its hero, come after)
    page = p; hero = h
    // the old title scene (min9eda.js) opens its words at the screen edges when it is the hero
    window._ixPtHero = !!(hero && hero.classList.contains('push-titles'))
    ;[0, 400, 1200, 3000].forEach(function (t) { setTimeout(function () { window.dispatchEvent(new Event('scroll')) }, t) })
    build()
    ctaSec = document.querySelector('[data-walk="cta"]')
    ss = x = lastX = from = exitFrom = null; label = ''; intent = 0; exitT0 = 0
    // without a hero it walks in from the left edge; coming back from the next page it opens at the end and comes in from the right
    if (newPage) {
      arriveEnd = !!window._ixArriveEnd; window._ixArriveEnd = false; arriveAt = 0
      // the address changes before the new content arrives: remember the old page, to wait for the new one
      arriveOld = arriveEnd ? document.querySelector('.page') : null
      calmUntil = performance.now() + 1200 // a new page: scrolling on doesn't count for a moment (no double moves)
    }
    enterRight = arriveEnd; enterT0 = hero && !arriveEnd ? 0 : performance.now()
    wake()
  }

  // the explorer in the hero ("Marketing"), and the frame it is showing
  function heroFig() {
    if (!hero) return null
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
  function maxScroll() { return Math.max(1, document.documentElement.scrollHeight - window.innerHeight) }
  function atEnd() { return window.scrollY >= maxScroll() - 4 }
  function atTop() { return window.scrollY <= 2 }
  function toEnd(max) {
    if (window._smoothScroller && window._smoothScroller.scrollTo) window._smoothScroller.scrollTo(max, true); else window.scrollTo(0, max)
  }
  // the visitor's own scrolling (the look back after arriving never overrides it)
  var lastInput = 0
  ;['wheel', 'touchmove', 'keydown'].forEach(function (t) { window.addEventListener(t, function () { lastInput = performance.now() }, { passive: true }) })

  // ---------- moving on to the next page ----------
  function leave(d) {
    d = d || 1
    if (exitT0 || !(d > 0 ? NEXT : PREV)[page] || window._pageTransitioning) return
    exitDir = d; exitT0 = performance.now(); exitFrom = x; wake()
  }
  function go() {
    var url = (exitDir > 0 ? NEXT : PREV)[page][0]
    if (exitDir < 0) window._ixArriveEnd = true // the previous page opens at its end
    if (window._router && typeof window._router.setUrl === 'function') window._router.setUrl(url) // the site's own page transition
    else location.href = url
  }
  // keeping on scrolling down at the very bottom is the visitor asking for more: then, and only then, it moves on
  // (and scrolling on up at the very top, for the page before)
  window.addEventListener('wheel', function (e) {
    var now = performance.now(), d = e.deltaY > 0 ? 1 : -1
    if (!guide || exitT0 || arriveEnd || now < calmUntil || window._pageTransitioning) { intent = 0; return }
    if (!e.deltaY || !(d > 0 ? NEXT : PREV)[page] || !(d > 0 ? atEnd() : atTop())) { intent = 0; return }
    if (now - intentAt > 1200 || intent * d < 0) intent = 0
    intent += Math.max(-120, Math.min(120, e.deltaY)); intentAt = now; wake()
    if (Math.abs(intent) > 420) leave(d)
  }, { passive: true })
  window.addEventListener('touchstart', function (e) { touchY = e.touches[0].clientY }, { passive: true })
  window.addEventListener('touchmove', function (e) {
    if (touchY === null || exitT0) return
    var m = touchY - e.touches[0].clientY // a deliberate swipe past the end (up) or past the top (down)
    if (m > 140 && NEXT[page] && atEnd()) { touchY = null; leave(1) }
    else if (m < -140 && PREV[page] && atTop()) { touchY = null; leave(-1) }
  }, { passive: true })

  // ---------- frame ----------
  function frame(now) {
    running = false
    setup()
    var dt = Math.min(64, now - (lastT || now)); lastT = now
    var w = window.innerWidth, vh = window.innerHeight, gw = guide.offsetWidth, gh = guide.offsetHeight
    var sy = window.scrollY, max = maxScroll()
    if (hero) hero.classList.toggle('ixj-moved', sy - hero.offsetTop > 40) // the hero's scroll cue goes once the scroll starts
    var ready = !window._introOn && !window._pageTransitioning // not over the intro screen or a page transition

    // back from the next page: this one opens at its end (once it shows), and the guide walks in from the right
    // (through the site's own scroller, which otherwise puts the new page back at its top; a moment after it shows)
    // (only once the new page's content is in: before that the jump would land on the old page and be lost)
    var arrived = !arriveOld || document.querySelector('.page') !== arriveOld
    if (arriveEnd && ready && arrived) {
      if (!arriveAt) arriveAt = now
      if (now - arriveAt > 150) {
        arriveEnd = false; arriveAt = 0; arriveOld = null; max = maxScroll()
        toEnd(max)
        ss = sy = window.scrollY; enterT0 = now; enterRight = true
        arriveCheck = now + 900 // one look back: if the page was put back at its top meanwhile, it goes to the end again
      }
    }
    if (arriveCheck && now > arriveCheck) {
      arriveCheck = 0
      if (window.scrollY < maxScroll() * .5 && performance.now() - lastInput > 900) { toEnd(maxScroll()); ss = sy = window.scrollY }
    }
    // the scrub: a smoothed copy of the scroll position drives everything
    if (ss === null || reduced) ss = sy
    else ss += (sy - ss) * (1 - Math.pow(1 - 0.14, dt / 16.67))
    if (Math.abs(sy - ss) < 0.3) ss = sy

    // the jump out of the hero (home page); elsewhere it is on the ground from the start
    var t = 1, j1 = 0, fig = heroFig()
    if (hero) {
      var top = hero.offsetTop, pinEnd = top + hero.offsetHeight - vh
      var j0 = Math.min(top + (w >= 768 ? 1.2 : 0.06) * vh, pinEnd - 0.3 * vh); j1 = j0 + 0.26 * vh
      if (hero.dataset.jump0) { j0 = top + parseFloat(hero.dataset.jump0) * (pinEnd - top); j1 = top + parseFloat(hero.dataset.jump1) * (pinEnd - top) } // the hero says when
      t = reduced ? (ss > j0 ? 1 : 0) : clamp((ss - j0) / (j1 - j0))
      // the hero figure's place: where the hero scene says it stands (ideaxcorp-build.js), or else its place on screen
      if (hero.dataset.handoff) from = JSON.parse(hero.dataset.handoff)
      else if (t <= 0) { var fr = figRect(fig); if (fr) from = fr }
    }
    if (!from) from = { cx: w * 0.06 + gw / 2, bottom: vh * 0.7, h: gh * 1.5 }

    // where it walks from and to: from where it landed (or the left of the screen) to the right, over the page
    var startX = hero ? Math.max(8, Math.min(w - gw - 8, from.cx - gw / 2)) : (w - gw) * 0.04, endX = (w - gw) * 0.9
    var tx, ty = 0, sc = 1, sqx = 1, sqy = 1, rot = 0, speech = '', walkingNow = false
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
        tx = from.cx - gw / 2 + (startX - (from.cx - gw / 2)) * c
        sc = s0 + (1 - s0) * c; sqy = 1.08 - 0.08 * c; sqx = 0.96 + 0.04 * c; rot = -6 + 10 * Math.sin(c * Math.PI * 0.9)
      } else { // the landing: squash, then a small rebound
        var d = (t - 0.86) / 0.14; tx = startX
        sqy = 1 - 0.16 * Math.sin(Math.PI * Math.min(1, d * 1.8)) * (d < 0.56 ? 1 : 0); sqx = 2 - sqy
        ty = d > 0.56 ? -Math.sin(Math.PI * (d - 0.56) / 0.44) * gh * 0.08 : 0
      }
      x = lastX = null; walk = 0
    } else {
      // the walk: its place follows the scroll over the page; it eases there rather than snapping, so a page that
      // grows as it loads never makes it jump back
      var p = clamp((ss - j1) / Math.max(1, max - j1)), target = startX + (endX - startX) * p
      if (enterT0) { // walking in from its edge as the page opens (its walk starts once the page shows)
        if (!ready) enterT0 = now
        var k = clamp((now - enterT0) / 1300), edge = enterRight ? w + gw : -gw
        target = edge + (target - edge) * (1 - Math.pow(1 - k, 2))
        if (k >= 1) { enterT0 = 0; enterRight = false }
      }
      if (x === null) x = enterT0 ? (enterRight ? w + gw : -gw) : target
      x = enterT0 || reduced ? target : x + (target - x) * (1 - Math.pow(1 - 0.2, dt / 16.67))
      if (exitT0) { // walking off: on and down past the bottom edge (the next page), or back off the left edge (the page before)
        var q = clamp((now - exitT0) / 1100)
        if (exitDir > 0) { x = exitFrom + (Math.min(endX, exitFrom + gw) - exitFrom) * q; ty = gh * 1.3 * q * q }
        else x = exitFrom + (-gw * 1.2 - exitFrom) * q * q
        if (q >= 1) { exitT0 = 0; go() }
      }
      tx = x
      if (lastX !== null && Math.abs(x - lastX) > 0.2) { dir = x < lastX ? -1 : 1; walk += Math.abs(x - lastX) + (exitT0 ? 2 : 0); movedAt = now }
      else if (exitT0) { walk += 2; movedAt = now }
      lastX = x
      // the section in the middle of the screen names itself; at the end of the page, the next page is offered
      var mid = vh / 2, secs = document.querySelectorAll('[data-say]')
      for (var i = 0; i < secs.length; i++) {
        var r = secs[i].getBoundingClientRect()
        if (r.top <= mid && r.bottom > mid) { speech = secs[i].getAttribute('data-say'); break }
      }
      if (NEXT[page] && sy >= max - 4) speech = 'Next: ' + NEXT[page][1] + ' →'
      // at the top, once the visitor scrolls on up (or as it walks back), the page before is offered
      if (PREV[page] && sy <= 2 && (intent < 0 || exitT0 && exitDir < 0)) speech = '← Back: ' + PREV[page][1]
    }
    guide.classList.toggle('next', speech.indexOf('Next: ') === 0 || speech.indexOf('Back: ') > 0)
    guide.classList.toggle('back', speech.indexOf('Back: ') > 0)

    // the hero figure hands over to the guide the moment the jump starts (same frames, place and size)
    var shown = t > 0 && ready && !document.body.classList.contains('ix-transitioning')
    if (fig) fig.style.visibility = shown ? 'hidden' : '' // hidden only while the guide stands in for it, so it never vanishes
    guide.classList.toggle('on', shown)
    guide.classList.toggle('left', t >= 1 && dir < 0)
    guide.style.translate = tx.toFixed(1) + 'px ' + ty.toFixed(1) + 'px'
    guide.style.scale = (sc * sqx).toFixed(4) + ' ' + (sc * sqy).toFixed(4)
    guide.style.rotate = rot.toFixed(2) + 'deg'
    // walking: its walk cycle, the steps keeping pace with the ground it covers; standing (and jumping): its resting loop
    var walking = !reduced && t >= 1 && now - movedAt < 180
    var set = walking ? steps : frames, fi = walking ? Math.floor(walk / 2.6) % FRAMES : reduced ? 0 : Math.floor(now / 50) % FRAMES
    var key = (walking ? 'w' : 'i') + fi
    if (key !== lastFrame && set[fi] && set[fi].complete) { img.src = set[fi].src; lastFrame = key }

    // the bubble
    if (speech && speech !== label) { label = speech; say.textContent = speech; say.classList.remove('pop'); void say.offsetWidth; say.classList.add('pop') }
    if (!speech) label = ''
    guide.classList.toggle('talk', !!speech)
    if (ctaSec) ctaSec.classList.toggle('ixj-arrived', speech !== '' && speech === (ctaSec.getAttribute('data-say') || ''))

    if (ss !== sy || shown || enterT0 || exitT0 || arriveEnd || arriveCheck) wake() // keeps scrubbing, and the resting loop plays while it is shown
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
  window.addEventListener('ix:pageadded', function () { setTimeout(function () { setup(); wake() }, 0) })
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setup(); wake() })
  else { setup(); wake() }
  setInterval(function () { setup(); wake() }, 400) // waits out the intro; re-attaches after page swaps
})()
