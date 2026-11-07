// Home hero (styling in ideaxcorp-build.css): the headline builds itself as you scroll, and the characters come in
// to join it. One GSAP master timeline, scrubbed by ScrollTrigger over the tall section while its stage stays pinned:
//  1. the first screen: the four words oversized and upright in a zig-zag across the screen ("Curious" top left,
//     "Full-service" right, "Marketing" lower left, "Agency" lower right); no characters yet;
//  2. one after another, each character walks in from its edge to its word (the creator and the explorer from the
//     left, the jester and the small figure from the right), in its own walk frames;
//  3. it puts its hands on the word's outer edge, leans in, and pushes the word to its place in the stacked
//     "Curious / Full-service / Marketing Agency": the word moves only while it is pushed, shrinking to the
//     headline's size, the hands on its edge all the way; it lands with a puff of dust and fills its dot;
//  4. the swoosh draws under "Curious" and the decorations gather round;
//  5. the explorer jumps down into the page (ideaxcorp-journey.js; the section's data-jump0/1 and data-handoff say
//     when and from where); the others stay with the headline.
// Positions are computed in pixels from the screen size and rebuilt on resize.
;(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  // walk/idle: frame folder, count, width/height; face: which way the walk frames look (1 right, -1 left);
  // pull: its pull frames (leaning back, dragging), used when the scroll takes its word back the other way;
  // hops: instead of walking, it bounds in this many hops (the creator, who has no walk of her own);
  // go: its walk without a word (null: its standing pose with a sway and a step-hop), goFace: which way that looks,
  // goScale: how much larger that walk is drawn to match its standing size;
  // side: the side of its word it pushes from: "Curious" and "Marketing" come in from the left, "Full-service" and
  // "Agency" from the right; end: the side it finishes on; size: height relative to the others;
  // hand / handH: its hands' distance from its centre and their height above its feet, in character heights
  var CAST = {
    creator: { word: 'curious', side: -1, end: -1, walk: ['creator_push', 40], pull: ['creator_pull', 40], idle: ['creator_idle', 51], go: null, hops: 3, face: 1, size: 1, hand: .56, handH: .62 },
    jester: { word: 'full', side: 1, end: 1, walk: ['jester_push_2', 58], idle: ['jester_idle_2', 51], go: ['jester_push_2', 58], goFace: -1, face: -1, size: .92, hand: .56, handH: .42 },
    explorer: { word: 'marketing', side: -1, end: -1, walk: ['explorer_push', 40], pull: ['explorer_pull', 40], idle: ['explorer_idle', 40], go: ['explorer_push', 40], goFace: 1, face: 1, size: .86, hand: .5, handH: .56 },
    outlaw: { word: 'agency', side: 1, end: 1, walk: ['outlaw_push', 24], idle: ['outlaw_idle', 25], go: ['outlaw_pull', 26], goFace: 1, goScale: 1.25, face: 1, size: .8, hand: .52, handH: .55 }
  }
  var NAMES = ['creator', 'jester', 'explorer', 'outlaw']
  var frames = {} // folder -> [Image]
  var sec = null, tl = null, st = null, floats = [], ticking = false, resizeT = 0

  function src(dir, i) { return '/Assets/Grx/' + dir + '/' + String(i).padStart(3, '0') + '.webp?v=2' } // lossless WebP copies of the frames: identical to the PNGs, smaller
  // the frames are fetched only once the page has loaded: requested earlier they would hold up the load event, and
  // with it the site's intro screen (until then each character shows the frame in its own <img>)
  function load(set) {
    if (frames[set[0]]) return
    var a = frames[set[0]] = []
    afterLoad(function () { for (var i = 0; i < set[1]; i++) { var im = new Image(); im.decoding = 'async'; im.src = src(set[0], i); a[i] = im } })
  }
  function afterLoad(fn) { if (document.readyState === 'complete') fn(); else window.addEventListener('load', fn, { once: true }) }

  // ---------- frames: walking while its walk value changes, otherwise standing ----------
  // While it moves, its frames run on a steady clock (24 a second, as the site's own figures play), backwards
  // when the scroll goes back; when it stops they hold, so its legs never jerk with the scroll.
  var lastTick = 0
  function tick() {
    if (!sec) return
    var now = performance.now(), dt = Math.min(80, now - (lastTick || now)); lastTick = now
    NAMES.forEach(function (n, k) {
      var c = CAST[n]; if (!c.img) return
      if (c.p.w !== c.lastW) { c.back = c.lastW != null && c.p.w < c.lastW; c.lastW = c.p.w; c.movedAt = now }
      var gx = gsap.getProperty(c.el, 'x'); if (c.lastX != null && Math.abs(gx - c.lastX) > .3) c.dir = gx > c.lastX ? 1 : -1; c.lastX = gx
      if (!c.dir) c.dir = -c.side
      var moving = !reduced && now - c.movedAt < 140
      // the pushing pose only while it holds its word (from the lift until it is set down); walking without it,
      // its own walk, or (the creator, who has none) its standing pose with a sway and a step-hop
      var t = tl ? tl.time() : 0, holding = !reduced && t >= c.holdFrom && t <= c.holdTo, going = moving && !holding // holding: its pushing pose even while the scroll rests
      // scrolling back, a character that has pull frames drags its word back in them (instead of pushing backwards)
      var pulling = holding && c.back && c.pull
      var set = pulling ? c.pull : holding ? c.walk : going && c.go ? c.go : c.idle, list = frames[set[0]], count = set[1]
      var stepping = holding || going && c.go
      if (stepping && moving) c.fa = (c.fa || 0) + (c.back && !pulling ? -1 : 1) * dt * .024 // a pull plays forwards
      var i = stepping ? ((Math.floor(c.fa || 0) % count) + count) % count : Math.floor(now / 50 + k * 11) % count
      // it always faces the way it walks in (towards its word); scrolling back, its walk plays in reverse (a rewind),
      // rather than turning round as well, which made it walk backwards
      var flip = holding ? c.face !== -c.side : going && c.go ? c.goFace !== -c.side : false
      var sway = going && !c.go, ph = (c.fa || 0) / 6 * Math.PI
      c.img.style.bottom = sway ? (Math.abs(Math.sin(ph)) * c.el.offsetHeight * .07).toFixed(1) + 'px' : ''
      c.img.style.rotate = sway ? (Math.sin(ph) * 5).toFixed(2) + 'deg' : ''
      c.img.style.height = going && c.go && c.goScale ? c.goScale * 100 + '%' : ''
      if (c.wordEl) c.wordEl.classList.toggle('ixs-waiting', !reduced && t < c.waitTo) // its word floats until it starts to glide
      var key = set[0] + i + (flip ? 'f' : '')
      if (key !== c.key && list[i] && list[i].complete) { c.img.src = list[i].src; c.img.classList.toggle('ixs-flip', flip); c.key = key }
    })
  }

  // ---------- layout: everything in pixels for this screen ----------
  function layout() {
    var pin = sec.querySelector('.ixs-pin'), W = pin.clientWidth, H = pin.clientHeight, mob = W < 768
    var fs = mob ? { curious: W * .155, full: W * .098, marketing: W * .074, agency: W * .074 } // phones: room for the characters beside the words
      : { curious: Math.min(W * .125, H * .21), full: Math.min(W * .092, H * .155), marketing: Math.min(W * .078, H * .135), agency: Math.min(W * .078, H * .135) }
    var wd = {}
    Object.keys(fs).forEach(function (k) {
      var el = sec.querySelector('.ixs-w-' + k); el.style.fontSize = fs[k].toFixed(1) + 'px'
      wd[k] = { el: el, w: el.offsetWidth, h: el.offsetHeight }
    })
    // the finished headline, centred: three rows, "Marketing" and "Agency" side by side
    var g = (mob ? .45 : .22) * fs.full
    var T = wd.curious.h + wd.full.h + wd.marketing.h + 2 * g, top = (H - T) / 2 + H * .02
    var y1 = top + wd.curious.h / 2, y2 = top + wd.curious.h + g + wd.full.h / 2, y3 = top + wd.curious.h + g + wd.full.h + g + wd.marketing.h / 2
    var gap3 = fs.marketing * (mob ? .3 : .45), pairW = wd.marketing.w + gap3 + wd.agency.w, mLeft = W / 2 - pairW / 2
    var fin = { curious: [W / 2, y1], full: [W / 2, y2], marketing: [mLeft + wd.marketing.w / 2, y3], agency: [mLeft + wd.marketing.w + gap3 + wd.agency.w / 2, y3] }
    // the first screen: oversized and upright in a zig-zag, each word against its own side of the screen
    // (word: [side it is set against, y as a share of the height, scale]); kept inside the screen
    var ini = mob ? { curious: [-1, .2, 1.18], full: [1, .4, 1.25], marketing: [-1, .6, 1.4], agency: [1, .78, 1.6] }
      : { curious: [-1, .2, 1.55], full: [1, .45, 1.35], marketing: [-1, .66, 1.4], agency: [1, .86, 1.55] }
    var base = mob ? W * .15 : Math.min(H * .2, W * .108)
    // each word stands in from its edge by the room its character needs beside it (the frames are drawn wider than
    // the box), and is never wider than what is left
    var who = { curious: 'creator', full: 'jester', marketing: 'explorer', agency: 'outlaw' }
    Object.keys(ini).forEach(function (k) {
      var c = CAST[who[k]], ch = base * c.size, pad = ch * (c.hand + .75) + W * .02
      var v = ini[k], sc = Math.min(v[2], (W - pad - W * .04) / wd[k].w)
      v[2] = sc; v.x = v[0] < 0 ? pad + sc * wd[k].w / 2 : W - pad - sc * wd[k].w / 2; v.y = H * v[1]
    })
    return { W: W, H: H, mob: mob, wd: wd, fin: fin, ini: ini, base: base }
  }

  // ---------- the master timeline ----------
  function build() {
    kill()
    if (!sec || !document.body.contains(sec)) return // the page has been swapped out meanwhile
    var L = layout(), W = L.W, H = L.H, fx0 = extras()
    tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } })
    // T0: the first character sets off, TURN apart; S5: the headline is complete; S6: the explorer jumps down
    var T0 = .5, TURN = .55, S5 = T0 + 3 * TURN + 1 + .35 + 2.1, S6 = S5 + 1.4, END = S6 + 1.4

    NAMES.forEach(function (n, k) {
      var c = CAST[n], wd = L.wd[c.word], el = c.el, wordEl = wd.el, side = c.side
      c.wordEl = wordEl; wordEl.style.setProperty('--lift', 0)
      var ch = L.base * c.size; el.style.setProperty('--h', ch.toFixed(1) + 'px')
      c.p = c.p || { w: 0 }; c.p.w = 0; c.lastW = null
      var feet = function (cy, s) { return cy + wd.h * s * .38 } // a word's baseline, from its centre and scale
      var fx = L.fin[c.word][0], fy = L.fin[c.word][1], iv = L.ini[c.word], s0 = iv[2]
      // 1. the word on the first screen; its character just off its edge
      gsap.set(wordEl, { xPercent: -50, yPercent: -50, x: iv.x, y: iv.y, scale: s0, rotation: 0, opacity: 1 })
      var grabX = iv.x + side * (s0 * wd.w / 2 + c.hand * ch), grabY = feet(iv.y, s0)
      var x0 = side < 0 ? -ch : W + ch
      gsap.set(el, { xPercent: -50, yPercent: -100, x: x0, y: grabY, rotation: 0, opacity: 1 })
      // 2. walks in to its word
      var T = T0 + k * TURN, dw = 1
      if (c.hops) {
        // bounds in: crouch, spring up, land with a squash, a few times, in her standing pose
        var hop = { t: 0 }, hh = ch * .3, nh = c.hops
        tl.to(hop, { t: 1, duration: dw + .3, ease: 'none', onUpdate: function () {
          var e = hop.t, ph = e * nh, u = ph % 1
          gsap.set(el, { x: x0 + (grabX - x0) * (1 - Math.pow(1 - e, 1.4)), y: grabY - Math.sin(Math.PI * Math.min(1, u * 1.15)) * hh * (1 - e * .25) })
          var sq = u < .12 ? 1 - .14 * Math.sin(Math.PI * u / .12) : u > .9 ? 1 - .12 * Math.sin(Math.PI * (u - .9) / .1) : 1 + .08 * Math.sin(Math.PI * (u - .12) / .78)
          gsap.set(c.float, { scaleY: sq, scaleX: 2 - sq })
        } }, T - .3)
      } else {
        tl.to(el, { x: grabX, duration: dw, ease: 'power1.out' }, T)
        tl.to(c.p, { w: '+=' + (Math.abs(grabX - x0) / 3), duration: dw, ease: 'power1.out' }, T)
      }
      // 3. hands on the word: it braces and leans in
      var t3 = T + dw
      c.waitTo = t3; c.holdFrom = t3; c.holdTo = t3 + .35 + 2.1 // its pushing pose, from the contact to the last shove
      tl.to(c.float, { scaleY: .92, scaleX: 1.05, duration: .35, ease: 'power2.out' }, t3)
      tl.to(el, { rotation: -side * 7, duration: .35, ease: 'power2.out' }, t3)
      // ... and pushes it to its place: the word shrinking to the headline's size, the hands on its edge throughout
      var push = { t: 0 }, t4 = t3 + .35, d4 = 2.1
      tl.to(push, { t: 1, duration: d4, ease: 'power2.inOut', onUpdate: function () {
        var e = push.t, sc = s0 + (1 - s0) * e, cx = iv.x + (fx - iv.x) * e, cy = iv.y + (fy - iv.y) * e
        gsap.set(wordEl, { x: cx, y: cy, scale: sc, rotation: -side * 2 * Math.sin(Math.PI * e) })
        gsap.set(el, { x: cx + side * (sc * wd.w / 2 + c.hand * ch), y: feet(cy, sc) })
      } }, t4)
      tl.to(c.float, { keyframes: { scaleY: [.92, 1.03, .94, 1.03, .95, 1], scaleX: [1.05, .98, 1.04, .98, 1.03, 1], easeEach: 'sine.inOut' }, duration: d4 }, t4)
      tl.to(el, { keyframes: { rotation: [7, 10, 6, 9, 5].map(function (r) { return -side * r }), easeEach: 'sine.inOut' }, duration: d4 }, t4)
      tl.to(c.p, { w: '+=' + (Math.hypot(fx - iv.x, fy - iv.y) / 3 + 30), duration: d4, ease: 'power2.inOut' }, t4)
      // 4. the word settles with a little give, the character straightens and steps back; a puff of dust, its dot fills
      var t5 = t4 + d4, standX = fx + side * (wd.w / 2 + c.hand * ch + ch * .12), ffeet = feet(fy, 1)
      tl.to(wordEl, { keyframes: { scaleX: [1, 1.05, .98, 1], scaleY: [1, .95, 1.02, 1], easeEach: 'sine.out' }, duration: .6 }, t5)
      tl.to(el, { x: standX, rotation: 0, duration: .5, ease: 'power2.out' }, t5)
      tl.to(c.p, { w: '+=' + (ch * .12 / 3), duration: .5, ease: 'power2.out' }, t5)
      var bx = [fx - wd.w * .46, fx + wd.w * .46], by = fy + wd.h * .36
      for (var j = 0; j < 6; j++) {
        var pf = fx0.querySelector('.ixs-puff[data-i="' + (k * 6 + j) + '"]'), o = j < 3 ? -1 : 1, a = (j % 3) * .5 + .25
        gsap.set(pf, { x: bx[j < 3 ? 0 : 1], y: by, scale: 0, opacity: 0 })
        tl.to(pf, { keyframes: [{ scale: 1, opacity: .9, duration: .05 }, { x: '+=' + (o * ch * (.25 + a * .2)), y: '-=' + (ch * (.05 + a * .12)), scale: 1.8, opacity: 0, duration: .55, ease: 'power2.out' }] }, t5)
      }
      tl.to(fx0.querySelectorAll('.ixs-prog i')[k], { scale: 1, opacity: 1, duration: .3, ease: 'back.out(3)' }, t5)
      // where the explorer stands (screen pixels: the stage is pinned): the journey jumps it down from here
      if (n === 'explorer') sec.dataset.handoff = JSON.stringify({ cx: Math.round(standX), bottom: Math.round(ffeet), h: Math.round(ch) })
    })

    // the swoosh drawn under "Curious" once the headline is complete
    var cw = L.wd.curious, sw = fx0.querySelector('.ixs-swoosh'), sp = sw.querySelector('path')
    gsap.set(sw, { x: L.fin.curious[0] - cw.w * .46, y: L.fin.curious[1] + cw.h * .44, width: cw.w * .92, height: cw.h * .22 }) // just under the word
    var len = sp.getTotalLength(); gsap.set(sp, { strokeDasharray: len, strokeDashoffset: len })
    tl.to(sp, { strokeDashoffset: 0, duration: .9, ease: 'power2.inOut' }, S5 + .55)

    // the decorations: scattered at first, gathering round the headline in stage 5
    var F = L.fin, top = F.curious[1] - L.wd.curious.h / 2, bot = F.marketing[1] + L.wd.marketing.h / 2
    var left = F.marketing[0] - L.wd.marketing.w / 2, right = F.agency[0] + L.wd.agency.w / 2
    var spots = [[left - 30, top - 10], [right + 20, top + 40], [W / 2 + L.wd.full.w / 2 + 40, F.full[1] - 50], [left - 70, F.full[1] + 20],
      [W / 2 - L.wd.curious.w / 2 - 10, top - 26], [right + 50, bot + 10], [W / 2, bot + 50]]
    sec.querySelectorAll('.ixs-d').forEach(function (d, i) {
      var sp = spots[i % spots.length]
      gsap.set(d, { x: W * (.12 + .76 * ((i * 37) % 100) / 100), y: H * (.1 + .8 * ((i * 61) % 100) / 100), scale: .7, opacity: .55 })
      tl.to(d, { x: Math.max(16, Math.min(W - 60, sp[0])), y: Math.max(16, Math.min(H - 60, sp[1])), scale: 1, opacity: 1, duration: 1.1, ease: 'power3.out' }, S5 + i * .06)
    })
    tl.set({}, {}, END) // the timeline runs to END

    // the journey (ideaxcorp-journey.js) has the explorer jump down while the others walk off
    sec.dataset.jump0 = (S6 / END).toFixed(3); sec.dataset.jump1 = ((S6 + 1.1) / END).toFixed(3)
    sec.classList.add('ixs-built') // laid out (the page transition waits for this before showing the scene)

    if (reduced || !window.ScrollTrigger) {
      // no scroll scene: the finished headline. Without ScrollTrigger yet (it loads without holding up the page),
      // the same timeline follows the plain scroll, smoothed as its scrub would be; it is rebuilt on ScrollTrigger
      // once that arrives
      if (reduced) { sec.classList.add('ixs-static'); tl.progress(S6 / END); return }
      var onScroll = function () {
        var r = sec.getBoundingClientRect(), span = sec.offsetHeight - window.innerHeight
        gsap.to(tl, { progress: span > 0 ? Math.max(0, Math.min(1, -r.top / span)) : 0, duration: 1, ease: 'power3.out', overwrite: true })
      }
      window.addEventListener('scroll', onScroll, { passive: true }); onScroll()
      st = { plain: true, kill: function () { window.removeEventListener('scroll', onScroll); gsap.killTweensOf(tl) } }
      return
    }
    st = ScrollTrigger.create({ trigger: sec, start: 'top top', end: 'bottom bottom', scrub: 1, animation: tl })
  }

  // the effect elements: dust puffs (six per word), the swoosh under "Curious", the progress row (a dot per word)
  function extras() {
    var box = sec.querySelector('.ixs-fx')
    if (box) return box
    box = document.createElement('div'); box.className = 'ixs-fx'; box.setAttribute('aria-hidden', 'true')
    var h = ''
    for (var i = 0; i < 24; i++) h += '<span class="ixs-puff" data-i="' + i + '"></span>'
    h += '<svg class="ixs-swoosh" viewBox="0 0 400 60" preserveAspectRatio="none"><defs><linearGradient id="ixs-sw" x1="0" x2="1"><stop offset="0" stop-color="#B566FF"/><stop offset="1" stop-color="#9700FF"/></linearGradient></defs>' +
      '<path d="M6 40 C 90 12, 200 8, 300 22 S 380 34, 394 18" fill="none" stroke="url(#ixs-sw)" stroke-width="9" stroke-linecap="round"/></svg>'
    h += '<span class="ixs-prog"><i></i><i></i><i></i><i></i></span>'
    box.innerHTML = h
    sec.querySelector('.ixs-pin').appendChild(box)
    return box
  }

  function kill() {
    if (st) { st.kill(); st = null }
    if (tl) { tl.kill(); tl = null }
  }

  function setup() {
    var s = document.querySelector('.m.ixs')
    if (s === sec) return
    if (sec) { kill(); floats.forEach(function (f) { f.kill() }); floats = [] }
    sec = s
    if (!sec) return
    if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger)
    NAMES.forEach(function (n, k) {
      var c = CAST[n]
      c.el = sec.querySelector('[data-ixs-char="' + n + '"]'); c.float = c.el.querySelector('.ixs-float'); c.img = c.el.querySelector('img')
      c.key = ''; c.movedAt = 0; c.p = c.p || { w: 0 }
      load(c.walk); load(c.idle); if (c.go) load(c.go); if (c.pull) load(c.pull)
      // a gentle float, apart from the scroll scene
      if (!reduced) floats.push(gsap.to(c.float, { y: -6, duration: 1.6 + k * .25, ease: 'sine.inOut', yoyo: true, repeat: -1 }))
    })
    if (!ticking) { gsap.ticker.add(tick); ticking = true }
    whenReady(build)
  }

  // builds once the page transition is over and the fonts are in (the words are measured)
  function whenReady(fn) {
    var go = function () {
      if (window._pageTransitioning) { setTimeout(go, 150); return }
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(fn); else fn()
    }
    go()
  }

  window.addEventListener('resize', function () { clearTimeout(resizeT); if (sec) resizeT = setTimeout(function () { build(); if (window.ScrollTrigger) ScrollTrigger.refresh() }, 200) })
  window.addEventListener('ix:pageadded', function () { setTimeout(setup, 0) })
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup)
  else setup()
  setInterval(function () {
    if (sec && !document.body.contains(sec)) { kill(); sec = null }
    setup()
    if (sec && st && st.plain && window.ScrollTrigger) { gsap.registerPlugin(ScrollTrigger); build() } // ScrollTrigger has arrived
  }, 500) // page swaps
})()
