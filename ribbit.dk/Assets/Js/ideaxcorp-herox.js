// Home hero, editorial (styles in ideaxcorp-herox.css).
//  - the headline: each line is split into letters that rise into place one after another; once in, letters lift
//    a little under the pointer, and dip under the feet of a character walking on them;
//  - the cast, each with its own life (frames from Assets/Grx/<name>_idle and _push/_pull, played at 24 a second):
//      Creator: on the left of "Curious", pushes it along (the word slides and leans), rests, pulls it back;
//      Jester:  on the right of "Fullservice", pushes it to the left with its dome, rests, is pushed back;
//      Outlaw:  hops along the tops of the short letters of "Creative Digital", from one to another;
//      Explorer: on the left of "Marketing Agency", pushes it along (as far as the screen allows) and back; scrolling
//                on, it jumps down to the floor of the screen and becomes the site's walking guide (and back up);
//    the pointer moves them a little by their depth (parallax); hovering one sets off its own reaction;
//  - the scroll through the hero (pinned on desktop and tablet): the lines slide apart, the characters riding
//    along with their lines, the card drifts;
//  - the card plays a slideshow of portfolio work.
// Everything moves by time and is eased, so it glides; it only runs while the hero is on screen. Pages are
// swapped in without a reload, so setup runs on ix:pageadded and once a second, once per hero.
;(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
  var G = '/Assets/Grx/'
  var SEQ = { // folder, frames, natural size
    creator: { idle: ['creator_idle', 51], walk: ['creator_push', 40], pull: ['creator_pull', 40], w: 320, h: 320, walkW: 400 },
    jester: { idle: ['jester_idle_2', 51], walk: ['jester_push_2', 58], w: 360, h: 320, walkW: 349 },
    outlaw: { idle: ['outlaw_idle', 25], walk: ['outlaw_pull', 26], w: 280, h: 290, walkW: 240 },
    explorer: { idle: ['explorer_idle', 40], walk: ['explorer_push', 40], w: 283, h: 320, walkW: 320 }
  }
  var px = -1e4, py = -1e4, tx = 0, ty = 0
  window.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return
    px = e.clientX; py = e.clientY; tx = e.clientX / innerWidth * 2 - 1; ty = e.clientY / innerHeight * 2 - 1
  }, { passive: true })
  function urls(seq) { var a = []; for (var i = 0; i < seq[1]; i++) a.push(G + seq[0] + '/' + ('00' + i).slice(-3) + '.webp?v=3'); return a }
  function preload(list) { list.forEach(function (u) { var im = new Image(); im.src = u }) }

  function build(sec) {
    sec.dataset.ready = '1'
    var stage = sec.querySelector('.ixhx-stage'), title = sec.querySelector('.ixhx-title'), card = sec.querySelector('.ixhx-card'), foot = sec.querySelector('.ixhx-foot')
    var lines = Array.prototype.slice.call(sec.querySelectorAll('.ixhx-line'))
    // split each line into letters (the words stay readable to assistive tech through the h1's aria-label)
    var letters = lines.map(function (l, li) {
      var text = l.textContent, out = [], word = null
      l.textContent = ''
      Array.prototype.forEach.call(text, function (c, i) {
        if (c === ' ') { l.appendChild(document.createTextNode(' ')); word = null; return } // (a place the line may break, on phones)
        if (!word) { word = document.createElement('span'); word.className = 'ixhx-word'; l.appendChild(word) } // words never break inside
        var s = document.createElement('span'); s.className = 'ixhx-ch'; s.textContent = c; s.setAttribute('aria-hidden', 'true')
        s.style.setProperty('--d', (.15 + li * .14 + i * .028).toFixed(3) + 's')
        word.appendChild(s); out.push({ el: s, cx: 0, dip: 0 })
      })
      return out
    })
    var cast = Array.prototype.map.call(sec.querySelectorAll('.ixhx-char'), function (el) {
      var name = el.dataset.char, s = SEQ[name]
      return { el: el, img: el.querySelector('img'), name: name, s: s, line: +el.dataset.line, depth: parseFloat(el.dataset.d || '.5'),
        x: 0, y: 0, home: 0, lo: 0, hi: 0, dir: -1, mode: 'idle', until: 0, fi: 0, ft: 0, hop: null, frames: s ? { idle: urls(s.idle), walk: urls(s.walk), pull: s.pull ? urls(s.pull) : null } : null, w: 0, h: 0 }
    })
    var mx = 0, my = 0, p = 0, on = false, raf = 0, last = 0, fs = 100, slid = [0, 0, 0, 0], live = false
    var push = [0, 0, 0, 0], lean = [0, 0, 0, 0], stageW = 0 // how far each line has been pushed (px, + right), and its lean
    // the pushers: which side of their word they stand on (-1 left, pushing it right; 1 right, pushing it left) and how far
    // their hands (or the Jester's dome) reach from their middle, as a share of their height (measured from the frames):
    // the Creator's fingertips .62 pushing, .57 pulling (a little into the letter); the Jester's dome, frame by frame
    var JREACH = [0.495,0.498,0.498,0.495,0.498,0.498,0.495,0.498,0.495,0.486,0.483,0.477,0.473,0.47,0.47,0.473,0.483,0.495,0.505,0.508,0.514,0.517,0.517,0.517,0.52,0.52,0.517,0.517,0.511,0.514,0.511,0.505,0.492,0.486,0.47,0.455,0.439,0.427,0.411,0.423,0.439,0.445,0.452,0.458,0.467,0.48,0.489,0.498,0.505,0.508,0.514,0.517,0.52,0.517,0.511,0.502,0.502,0.502]
    var PUSHER = {
      creator: { side: -1, fwd: function () { return .6 }, back: function () { return .535 } },
      explorer: { side: -1, fwd: function () { return .465 }, back: function () { return .465 } }, // the front of its hat and staff: .49
      jester: { side: 1, fwd: function (i) { return JREACH[i % JREACH.length] - .03 }, back: function (i) { return JREACH[i % JREACH.length] - .03 } }
    }
    var SLIDE = [-7, 6, -5, 6]

    // where everything stands for this screen
    function place() {
      fs = parseFloat(getComputedStyle(title).fontSize)
      var S = stage.getBoundingClientRect(); stageW = S.width, slidY = 0
      // the height of the small letters in this face and size (the top of an "x" above the baseline)
      var cv = document.createElement('canvas').getContext('2d'), cs = getComputedStyle(title)
      cv.font = 'italic 400 ' + fs + 'px ' + cs.fontFamily; var xi = cv.measureText('x').actualBoundingBoxAscent
      cv.font = '400 ' + fs + 'px ' + cs.fontFamily; var xr = cv.measureText('x').actualBoundingBoxAscent
      xh = Math.max(xi, xr) || fs * .42
      lines.forEach(function (l, li) {
        letters[li].forEach(function (L) { var r = L.el.getBoundingClientRect(); L.cx = r.left + r.width / 2 - slid[li] - S.left })
      })
      cast.forEach(function (c) {
        var r = lines[c.line].getBoundingClientRect(), L = r.left - slid[c.line] - S.left, R = r.right - slid[c.line] - S.left, T = r.top - S.top
        c.w = c.el.offsetWidth; c.h = c.el.offsetHeight
        var base = metrics(lines[c.line], S) - slidY, top = base - xh // the baseline (measured), and the tops of the small letters
        if (PUSHER[c.name]) { // stands on the baseline beside its word, its hands on the word's first or last letter
          c.pu = PUSHER[c.name]; c.y = base + fs * .015
          var row = letters[c.line], f0 = row[0].el.getBoundingClientRect(), f1 = row[row.length - 1].el.getBoundingClientRect()
          // the first and last letters' ink at the height of its hands (or dome): measured from the glyph itself, in the
          // face, size, weight and slant in use, so the grip is right whatever the font
          var hy = c.h * (HANDY[c.name] || .55), lf = (f0.right - f0.left), lr = (f1.right - f1.left)
          c.wL = f0.left - slid[c.line] - S.left + ink(row[0].el, hy, 'l', lf) + fs * .01
          c.wR = f1.left - slid[c.line] - S.left + ink(row[row.length - 1].el, hy, 'r', lr) - fs * .01
          var room = fs * (innerWidth < 641 ? .45 : +(c.el.dataset.room || .45)) // the margin it keeps from the screen's edge (phones: always a safe one)
          var ext = row.map(function (Lt) { return Lt.el.getBoundingClientRect() }) // the word's widest row (it may break onto two)
          var extL = Math.min.apply(null, ext.map(function (r) { return r.left })) - slid[c.line] - S.left, extR = Math.max.apply(null, ext.map(function (r) { return r.right })) - slid[c.line] - S.left
          c.max = Math.max(0, Math.min(fs * 1.4, c.pu.side < 0 ? stageW - extR - room : extL - room))
          c.el.classList.toggle('ixhx-away', c.pu.side < 0 ? c.wL - c.h * .47 - c.w / 2 < 2 : c.wR + c.h * .47 + c.w / 2 > stageW - 2) // no room beside its word
          if (!c.placed) { c.x = c.pu.side < 0 ? c.wL - c.h * .6 : c.wR + c.h * .5; c.placed = true; c.pm = 'fwd' }
          return
        }
        else if (c.name === 'jester') { c.y = base; c.home = L + c.w * .2; c.lo = c.home; c.hi = c.home + fs * .9 }
        else if (c.name === 'outlaw') { // stands on the tops of the short small letters only (never sunk into a tall one)
          c.y = top + fs * .01
          var row0 = letters[c.line][0].el.getBoundingClientRect().top // (only the line's first row, if it breaks onto two)
          c.spots = letters[c.line].filter(function (Lt) { return /[aceimnorsuvwxz]/.test(Lt.el.textContent) && Math.abs(Lt.el.getBoundingClientRect().top - row0) < fs * .3 }).map(function (Lt) { return Lt.cx })
          c.lo = Math.min.apply(null, c.spots); c.hi = Math.max.apply(null, c.spots); c.home = c.spots[c.spots.length - 1]
        }
        else { // the Sage: on the baseline just before "Marketing", cheering; away if there is no room for it there
          var m0 = letters[c.line][0].el.getBoundingClientRect().left - slid[c.line] - S.left
          c.y = base + fs * .015; c.home = m0 - fs * .06 - c.w / 2; c.lo = c.hi = c.home
          c.el.classList.toggle('ixhx-away', c.home - c.w / 2 < 4)
        }
        if (!c.placed) { c.x = c.home; c.placed = true } else c.x = Math.max(c.lo, Math.min(c.hi, c.x))
      })
    }
    var xh = 0, slidY = 0
    // how high above the floor each pusher's hands (or dome) meet its word, as a share of its height (from the frames)
    var HANDY = { creator: .6, jester: .3, explorer: .7 }
    // where a letter's ink starts ('l') or ends ('r') at a height above the baseline, from the left of its box
    var inkCv = document.createElement('canvas'), inkCx = inkCv.getContext('2d', { willReadFrequently: true })
    function ink(el, up, side, boxW) {
      try {
        var cs = getComputedStyle(el), size = parseFloat(cs.fontSize), pad = Math.ceil(size * .6), W = Math.ceil(boxW + pad * 2), H = Math.ceil(size * 1.6)
        inkCv.width = W; inkCv.height = H
        inkCx.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + size + 'px ' + cs.fontFamily
        inkCx.textBaseline = 'alphabetic'; inkCx.fillStyle = '#000'
        var base = Math.round(size * 1.2); inkCx.fillText(el.textContent, pad, base)
        var y = Math.max(0, Math.min(H - 3, Math.round(base - up))), d = inkCx.getImageData(0, y - 2, W, 5).data, hit = -1
        for (var x = side === 'l' ? 0 : W - 1; side === 'l' ? x < W : x >= 0; x += side === 'l' ? 1 : -1) {
          var a = 0; for (var r = 0; r < 5; r++) a = Math.max(a, d[(r * W + x) * 4 + 3])
          if (a > 90) { hit = x; break }
        }
        if (hit < 0) return side === 'l' ? 0 : boxW // (no ink at that height: the box edge)
        return hit - pad + (side === 'r' ? 1 : 0)
      } catch (e) { return side === 'l' ? 0 : boxW }
    }
    function metrics(line, S) { // where the line's baseline is, in the stage
      var m = line.querySelector('.ixhx-base')
      if (!m) { m = document.createElement('span'); m.className = 'ixhx-base'; m.setAttribute('aria-hidden', 'true'); line.querySelector('.ixhx-word').appendChild(m) }
      return m.getBoundingClientRect().bottom - S.top
    }
    function draw(c, t) {
      if (c.gone) return // (handed over to the walking guide: it stays, unseen, where it landed)
      if (c.drop) { // jumping down off the headline to the floor of the screen (or back up)
        var d = c.drop, u = d.u, k = u * u * (3 - 2 * u)
        var dx = d.x0 + (d.x1 - d.x0) * k, dy = d.y0 + (d.y1 - d.y0) * u * u - Math.sin(Math.PI * u) * fs * .45, s = d.s0 + (d.s1 - d.s0) * k
        c.el.style.transformOrigin = '50% 100%' // it grows or shrinks to the guide's size on the way, about its feet
        c.el.style.transform = 'translate3d(' + (dx - c.w / 2).toFixed(1) + 'px,' + (dy - c.h).toFixed(1) + 'px,0) scale(' + s.toFixed(3) + ')'
        return
      }
      var x = c.x + slid[c.line] + mx * c.depth * 22, y = c.y + my * c.depth * 14
      if (c.hop) { var u = c.hop.u; y -= Math.sin(Math.PI * u) * c.hop.h }
      c.el.style.transform = 'translate3d(' + (x - c.w / 2).toFixed(1) + 'px,' + (y - c.h).toFixed(1) + 'px,0)'
    }
    function setFrame(c, list, i) { var u = list[i % list.length]; if (c.cur !== u) { c.cur = u; c.img.src = u } }

    // one character's life, a step at a time
    // a pusher's round, as in the original hero: it pushes its word away from its side, rests, brings it back (the
    // Creator pulls it, walking backwards in front of it, leaning back with her hands on the "C"; the Jester is pushed
    // back by the word, braced against it), and rests again
    // holding its word without moving it: the first frame of its push (or pull), its hands (or dome) on the letter
    function hold(c, mode) {
      var list = mode === 'back' && c.frames.pull ? c.frames.pull : c.frames.walk
      var reach = (mode === 'back' ? c.pu.back : c.pu.fwd)(0)
      c.x = c.pu.side < 0 ? c.wL - c.h * reach : c.wR + c.h * reach
      setFrame(c, list, 0)
    }
    function pushStep(c, dt, now) {
      var f = c.frames, sp = fs * .32, li = c.line, fw = -c.pu.side // the way it pushes
      c.ft += dt
      if (c.pm === 'fwd' || c.pm === 'back') {
        var d = c.pm === 'fwd' ? fw : -fw, m = Math.abs(push[li])
        m = Math.max(0, Math.min(c.max, m + (c.pm === 'fwd' ? 1 : -.85) * sp * dt)); push[li] = fw * m
        var fi = Math.floor(c.ft * 24), list = c.pm === 'fwd' ? f.walk : (f.pull || f.walk)
        if (c.pm === 'back' && !f.pull) fi = list.length - 1 - fi % list.length // no pull frames: its push played backwards
        var reach = (c.pm === 'fwd' ? c.pu.fwd : c.pu.back)(fi % list.length)
        c.x = c.pu.side < 0 ? c.wL - c.h * reach : c.wR + c.h * reach // in the word's own frame: it moves with it
        lean[li] += (d * 2.2 - lean[li]) * .12
        setFrame(c, list, fi)
        if ((c.pm === 'fwd' && m >= c.max) || (c.pm === 'back' && m <= 0)) { c.pm = c.pm === 'fwd' ? 'restF' : 'restB'; c.until = now + 1400; c.ft = 0 }
      } else { // resting: still holding its word, in the pose it pushed (or pulled) with
        lean[li] += (0 - lean[li]) * .1
        hold(c, c.pm === 'restB' && f.pull ? 'back' : 'fwd')
        if (now > c.until) { c.pm = c.pm === 'restF' ? 'back' : 'fwd'; c.ft = 0 }
      }
      c.el.classList.remove('is-left') // it always faces its word (the frames are drawn that way)
    }
    function step(c, dt, now) {
      if (c.pu) { // (the round starts once the headline has arrived and been measured)
        if (live && isFinite(c.wL + c.wR + c.max) && (now > c.until || c.pm !== 'fwd' || push[c.line] !== 0)) pushStep(c, dt, now)
        else if (isFinite(c.wL + c.wR)) hold(c, 'fwd') // (before its first push: already holding its word)
        return
      }
      if (!c.s) { // the Sage: bounce, and now and then a jump
        if (!c.hop && now > c.until) { c.hop = { u: 0, h: fs * .5, d: .75 }; c.el.classList.add('is-air') }
        if (c.hop) { c.hop.u += dt / c.hop.d; if (c.hop.u >= 1) { c.hop = null; c.el.classList.remove('is-air'); c.until = now + 4500 + Math.random() * 4000 } }
        return
      }
      c.ft += dt
      if (c.name === 'outlaw' && !c.spots) return // (not measured yet)
      if (c.name === 'outlaw') { // hops: one jump cycle per hop
        if (c.mode === 'idle' && now > c.until) {
          var far = c.spots.filter(function (s) { return Math.abs(s - c.x) > fs * .5 }), to = far.length ? far[Math.floor(Math.random() * far.length)] : c.home
          c.mode = 'walk'; c.from = c.x; c.to = to; c.dir = to < c.x ? -1 : 1; c.hop = { u: 0, h: fs * .55, d: 26 / 24 }; c.ft = 0; c.el.classList.add('is-air')
        }
        if (c.mode === 'walk') {
          c.hop.u = Math.min(1, c.hop.u + dt / c.hop.d)
          var e = c.hop.u < .5 ? 2 * c.hop.u * c.hop.u : 1 - Math.pow(-2 * c.hop.u + 2, 2) / 2
          c.x = c.from + (c.to - c.from) * e
          setFrame(c, c.frames.walk, Math.floor(c.hop.u * 25.99))
          if (c.hop.u >= 1) { c.hop = null; c.mode = 'idle'; c.until = now + 1600 + Math.random() * 2400; c.ft = 0; c.el.classList.remove('is-air') }
        } else setFrame(c, c.frames.idle, Math.floor(c.ft * 24))
      } else { // walks: Creator along the whole line, Jester a few steps and back
        if (c.mode === 'idle' && now > c.until) {
          var span = c.name === 'jester' ? fs * .9 : (c.hi - c.lo)
          c.mode = 'walk'; c.dir = c.x - c.lo > c.hi - c.x ? -1 : 1
          c.to = Math.max(c.lo, Math.min(c.hi, c.x + c.dir * (span * (.45 + Math.random() * .55))))
          c.ft = 0
        }
        if (c.mode === 'walk') {
          var speed = (c.name === 'jester' ? .55 : .9) * fs // per second
          c.x += c.dir * speed * dt
          if ((c.dir > 0 && c.x >= c.to) || (c.dir < 0 && c.x <= c.to)) { c.x = c.to; c.mode = 'idle'; c.until = now + 2200 + Math.random() * 3200; c.ft = 0 }
          setFrame(c, c.frames.walk, Math.floor(c.ft * 24))
        } else setFrame(c, c.frames.idle, Math.floor(c.ft * 24))
      }
      c.el.classList.toggle('is-left', c.dir < 0 && c.mode === 'walk' || (c.mode === 'idle' && c.facedLeft && c.name !== 'jester'))
      if (c.mode === 'walk') c.facedLeft = c.dir < 0
    }

    // the letters: lift a little under the pointer, dip under the feet of a character on them
    function lettersFrame(S) {
      letters.forEach(function (row, li) {
        var feet = cast.filter(function (c) { return c.line === li && c.name === 'outlaw' && !c.hop })
        var rowY = lines[li].getBoundingClientRect(), near = fine && py > rowY.top - 20 && py < rowY.bottom + 20
        row.forEach(function (L) {
          var x = L.cx + slid[li], d = 0
          feet.forEach(function (c) { if (Math.abs(x - (c.x + slid[li])) < c.w * .22) d = fs * .045 })
          if (near) { var k = 1 - Math.min(1, Math.abs(px - S.left - x) / (fs * .9)); d -= k * fs * .07 }
          d = Math.round(d)
          if (d !== L.dip) { L.dip = d; L.el.style.setProperty('--dip', d + 'px') }
        })
      })
    }

    function target() {
      var r = sec.getBoundingClientRect(), span = Math.max(sec.offsetHeight - innerHeight, innerHeight * .8)
      return Math.max(0, Math.min(1, -r.top / span))
    }
    // as in the original hero: once the scroll is well into the hero, the Explorer jumps down off "Marketing Agency"
    // to the floor of the screen, where it becomes the site's walking guide (ideaxcorp-journey.js), which waits off
    // stage until then; scrolling back up, it jumps back up onto its word
    var ex = cast.filter(function (c) { return c.name === 'explorer' })[0]
    function guide() { document.documentElement.classList.toggle('ixhx-on', on && !(ex && ex.gone)) }
    function handoff(e, dt) {
      if (!ex || ex.el.classList.contains('ixhx-away')) return
      var S = stage.getBoundingClientRect(), floor = S.height - 6, at = ex.x + slid[ex.line]
      var g = document.querySelector('.ixj-guide'), gx = Math.max(ex.w / 2 + 8, S.width * .04 + ex.w / 2), gs = 1
      var gi = g && g.querySelector('img'), gr = gi && gi.getBoundingClientRect()
      if (gr && gr.height) { gx = gr.left + gr.width / 2 - S.left; floor = gr.bottom - S.top; gs = gr.height / ex.h } // land right where the guide stands, at its size
      if (!ex.gone && !ex.drop && e > .55) { // down
        ex.drop = { u: 0, dir: 1, x0: at, y0: ex.y, x1: gx, y1: floor, s0: 1, s1: gs }
        ex.el.classList.add('is-air')
      }
      if (ex.gone && e < .42) { // back up
        ex.gone = false; ex.el.classList.remove('is-gone'); guide()
        ex.drop = { u: 0, dir: -1, x0: gx, y0: floor, x1: at, y1: ex.y, s0: gs, s1: 1 }
        ex.el.classList.add('is-air')
      }
      if (ex.drop) {
        if (ex.drop.dir > 0) { ex.drop.x1 = gx; ex.drop.y1 = floor; ex.drop.s1 = gs } // (the guide moves with the scroll: keep aiming at it)
        ex.drop.u = Math.min(1, ex.drop.u + dt / .8)
        setFrame(ex, ex.frames.idle, Math.floor(ex.drop.u * 20))
        if (ex.drop.u >= 1) {
          var down = ex.drop.dir > 0; ex.drop = null; ex.el.classList.remove('is-air')
          if (down) { ex.gone = true; ex.el.classList.add('is-gone'); guide() } // the walking guide takes over from here, in the same spot
          ex.el.style.transformOrigin = ''
        }
      }
    }
    function frame(now) {
      raf = 0
      if (!on) return
      var dt = Math.min(.05, (now - (last || now)) / 1000); last = now
      mx += ((fine ? tx : 0) - mx) * .08; my += ((fine ? ty : 0) - my) * .08
      p += (target() - p) * .1
      var e = p * p * (3 - 2 * p), vw = innerWidth / 100
      lines.forEach(function (l, i) {
        slid[i] = SLIDE[i] * e * vw * (innerWidth < 641 ? .3 : 1) + mx * (i % 2 ? 6 : -6) + push[i] // (gentler on phones: no word slides off)
        l.style.transform = 'translate3d(' + slid[i].toFixed(1) + 'px,0,0)' + (lean[i] ? ' skewX(' + (-lean[i]).toFixed(2) + 'deg)' : '')
      })
      if (card) card.style.transform = live ? 'translate3d(' + (mx * -10 - e * 4 * vw).toFixed(1) + 'px,' + (my * -8 + e * 8 * vw / 2).toFixed(1) + 'px,0) scale(' + (1 + e * .08).toFixed(3) + ')' : ''
      if (foot && live) foot.style.opacity = Math.max(0, 1 - (e - .25) / .2).toFixed(3) // the floor clears before the Explorer lands
      handoff(e, dt)
      cast.forEach(function (c) { if (!c.drop && !c.gone) step(c, dt, now); draw(c, now) })
      if (live) lettersFrame(stage.getBoundingClientRect())
      raf = requestAnimationFrame(frame)
    }

    // hover: each its own reaction
    cast.forEach(function (c) {
      var react = { creator: 'r-spin', jester: 'r-squash', outlaw: '', sage: 'r-wiggle' }[c.name]
      function go() {
        if (c.name === 'outlaw') { c.until = 0; return } // jumps at once
        if (c.name === 'sage') c.until = 0
        c.el.classList.remove(react); void c.el.offsetWidth; c.el.classList.add(react)
        setTimeout(function () { c.el.classList.remove(react) }, 950)
      }
      c.el.addEventListener('pointerenter', function (ev) { if (ev.pointerType === 'mouse') go() })
      c.el.addEventListener('click', go)
    })

    // the card's slideshow
    var shots = card ? card.querySelectorAll('.ixhx-reel img') : [], si = 0
    var reel = card && card.querySelector('.ixhx-reel')
    function tick() { if (!reel) return; reel.classList.remove('tick'); void reel.offsetWidth; reel.classList.add('tick') } // the progress bar under the slide
    if (shots.length) { shots[0].classList.add('on'); if (!reduce) { tick(); setInterval(function () { if (!on) return; shots[si].classList.remove('on'); si = (si + 1) % shots.length; shots[si].classList.add('on'); tick() }, 2800) } }

    // arrive
    var go = function () {
      place()
      cast.forEach(function (c) { if (c.frames) c.img.src = c.cur = c.frames.idle[0]; draw(c, 0) })
      requestAnimationFrame(function () { sec.classList.add('is-in') })
      setTimeout(function () { sec.classList.add('is-cast') }, reduce ? 0 : 900)
      setTimeout(function () { live = true; sec.classList.add('is-live'); place() }, reduce ? 0 : 2600)
      if (!reduce) { cast.forEach(function (c) { if (c.frames) { preload(c.frames.idle); setTimeout(function () { preload(c.frames.walk); if (c.frames.pull) preload(c.frames.pull) }, 1500) } c.until = performance.now() + 2600 + Math.random() * 2500 }) }
    }
    if (document.fonts && document.fonts.ready) Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 1200) })]).then(go)
    else setTimeout(go, 300)
    window.addEventListener('resize', function () { if (document.body.contains(sec)) { place(); cast.forEach(function (c) { draw(c, 0) }) } })
    if (reduce) return
    new IntersectionObserver(function (es) {
      on = es[0].isIntersecting
      guide()
      if (on && !raf) { last = 0; p = target(); raf = requestAnimationFrame(frame) }
    }).observe(sec)
  }

  function setup() {
    var sec = document.querySelector('.m.ixhx')
    if (!sec) document.documentElement.classList.remove('ixhx-on')
    if (sec && !sec.dataset.ready) build(sec)
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup)
  else setup()
  window.addEventListener('ix:pageadded', setup)
  setInterval(setup, 1000)
})()
