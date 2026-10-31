// Our Portfolio: cards rise in turn and their characters drop onto them, each character plays its idle
// loop while visible, and "All Projects" rises in at the end.
;(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  var FRAMES = { explorer_idle: 40, jester_idle_2: 51, outlaw_idle: 25, sage_book: 7, explorer_push: 40, creator_push: 40, outlaw_push: 24 }
  var FPS = { sage_book: 6 } // the meditating sage has few frames: play them slowly
  var src = function (path, i) { return '/Assets/Grx/' + path + '/' + String(i).padStart(3, '0') + '.png' }
  var cache = {}
  function load(path) {
    if (cache[path]) return cache[path]
    cache[path] = []
    for (var i = 0; i < FRAMES[path]; i++) { var im = new Image(); im.src = src(path, i); cache[path].push(im) }
    return cache[path]
  }
  function show(img, path, i) {
    var f = cache[path][i]
    if (f && f.complete && img._i !== i) { img.src = f.src; img._i = i }
  }

  // "Our Clients": reveal the heading and logo cards once
  function initClients() {
    var s = document.querySelector('.ix-clients')
    if (!s || s.dataset.ready) return
    s.dataset.ready = '1'
    if (reduced) {
      Array.prototype.forEach.call(s.querySelectorAll('.ix-walker2'), function (el, i) {
        el.style.transform = 'translateX(' + (s.clientWidth * (0.15 + i * 0.3)) + 'px)'
      })
      return
    }
    s.classList.add('armed')

    // three characters walking across the section under the logos. The walk frames advance with the
    // distance walked (about one frame per 4px) so the feet keep pace with the ground instead of sliding.
    var lane = s.querySelector('.ix-clients-walk')
    var walkers = lane ? Array.prototype.map.call(lane.querySelectorAll('.ix-walker2'), function (el, i) {
      var path = el.dataset.char, list = []
      var r = (el.dataset.frames || '').split('-').map(Number)
      if (r.length === 2) { for (var k = r[0]; k <= r[1]; k += 2) list.push(k) }
      else { for (var k2 = 0; k2 < FRAMES[path]; k2++) list.push(k2) }
      var imgs = list.map(function (n) { var im = new Image(); im.src = src(path, n); return im })
      return { el: el, img: el.querySelector('img'), list: list, imgs: imgs, speed: 55, start: i / 3, x: null, dist: i * 37, cur: -1 }
    }) : []
    var laneOn = false
    if (lane) new IntersectionObserver(function (e) { laneOn = e[0].isIntersecting }).observe(lane)
    var lastT = performance.now()
    ;(function walk(now) {
      var dt = Math.min(0.05, (now - lastT) / 1000); lastT = now
      if (laneOn) {
        var W = lane.clientWidth
        walkers.forEach(function (w) {
          var ww = w.el.offsetWidth || 150
          if (w.x === null) w.x = -ww + (W + ww + 40) * w.start
          var dx = w.speed * dt
          w.x += dx; w.dist += dx
          if (w.x > W) w.x -= W + ww + 40 // walk off the right, come back in from the left (keeps the spacing)
          var idx = Math.floor(w.dist / 4) % w.list.length
          var bob = Math.abs(Math.sin(idx / w.list.length * Math.PI * 2)) * 3 // one lift per stride
          w.el.style.transform = 'translate(' + w.x.toFixed(1) + 'px,' + (-bob).toFixed(1) + 'px)'
          if (idx !== w.cur && w.imgs[idx].complete) { w.img.src = w.imgs[idx].src; w.cur = idx }
        })
      }
      requestAnimationFrame(walk)
    })(lastT)
    hopper(s)
    new IntersectionObserver(function (e, o) {
      if (!e[0].isIntersecting) return
      s.classList.add('in')
      s.dispatchEvent(new Event('ix-clients-in'))
      setTimeout(function () { s.classList.add('done') }, 1800)
      o.disconnect()
    }, { rootMargin: '0px 0px -15% 0px' }).observe(s)
  }

  // The sage walks over the logos with its arms down: along the real top outline of each logo (read
  // from the image's pixels), jumping logo to logo, snaking row by row (right on the first row, down,
  // left on the next...) and back the same way, so it jumps down going one way and up coming back.
  function hopper(s) {
    var el = s.querySelector('.ix-logo-walker')
    if (!el) return
    var img = el.querySelector('img')
    var WALK = [92, 94, 96, 98, 100, 102, 104, 106, 108, 110], AIR = 110, STAND = 92 // sage_push frames, arms down
    var frames = {}
    WALK.forEach(function (n) { var im = new Image(); im.src = src('sage_push', n); frames[n] = im })
    var FOOT = 0.68, SPEED = 46, STRIDE = 5 // feet sit 68% across the 490px frame; px walked per frame
    var on = false, lastT = performance.now(), cur = -1
    var st = null // { i: platform, x, dir: +1 forward along the path / -1 back, mode, ... }
    new IntersectionObserver(function (e) { on = e[0].isIntersecting }).observe(s)

    // top outline of a logo: for each of 200 columns, how far down (0..1) the first solid pixel is
    function outline(im) {
      if (im._top !== undefined) return im._top
      im._top = null
      try {
        var W = 200, H = Math.max(1, Math.round(W * im.naturalHeight / im.naturalWidth))
        var c = document.createElement('canvas'); c.width = W; c.height = H
        var g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0, W, H)
        var d = g.getImageData(0, 0, W, H).data, top = [], first = -1, last = -1
        for (var x = 0; x < W; x++) {
          top[x] = null
          for (var y = 0; y < H; y++) if (d[(y * W + x) * 4 + 3] > 60) { top[x] = y / H; break }
          if (top[x] !== null) { if (first < 0) first = x; last = x }
        }
        if (first < 0) return im._top
        for (var x2 = first; x2 <= last; x2++) if (top[x2] === null) { // fill gaps between letters
          var k = x2; while (top[k] === null) k++
          top[x2] = Math.min(top[x2 - 1], top[k])
        }
        im._top = { t: top, a: first / W, b: (last + 1) / W }
      } catch (e) { // pixels unreadable (e.g. opened from disk): walk on the logo's box top instead
        var flat = []; for (var i = 0; i < 200; i++) flat[i] = 0
        im._top = { t: flat, a: 0, b: 1 }
      }
      return im._top
    }

    // logos in walking order, each with its on-screen edges and a surface height function
    function platforms() {
      var base = s.getBoundingClientRect(), rows = {}, keys = []
      Array.prototype.forEach.call(s.querySelectorAll('.ix-client img'), function (im) {
        var r = im.getBoundingClientRect()
        if (!r.width || !im.complete || !im.naturalWidth) return
        var o = outline(im); if (!o) return
        var k = Math.min(r.width / im.naturalWidth, r.height / im.naturalHeight)
        var w = im.naturalWidth * k, h = im.naturalHeight * k
        var x0 = r.left + (r.width - w) / 2 - base.left, y0 = r.top + (r.height - h) / 2 - base.top
        var p = {
          l: x0 + o.a * w + 6, r: x0 + o.b * w - 6,
          y: function (x) { // highest point under both feet
            var best = Infinity
            for (var f = -6; f <= 6; f += 3) {
              var col = Math.max(0, Math.min(199, Math.floor((x + f - x0) / w * 200)))
              if (o.t[col] !== null) best = Math.min(best, y0 + o.t[col] * h)
            }
            return best === Infinity ? y0 + h : best
          }
        }
        var row = im.closest('.ix-client-wrap').offsetTop
        if (!rows[row]) { rows[row] = []; keys.push(row) }
        rows[row].push(p)
      })
      var out = []
      keys.sort(function (a, b) { return a - b }).forEach(function (row, n) {
        var list = rows[row].sort(function (a, b) { return a.l - b.l })
        if (n % 2) list.reverse()
        list.forEach(function (p) { p.walk = n % 2 ? -1 : 1; out.push(p) })
      })
      return out
    }
    // where a platform is entered / left when travelling the path forward (dir 1) or back (dir -1)
    function entry(p, dir) { return p.walk * dir > 0 ? p.l : p.r }
    function exit(p, dir) { return p.walk * dir > 0 ? p.r : p.l }

    function place(x, y, face, frame, squash) {
      var w = el.offsetWidth, h = el.offsetHeight
      el.style.transform = 'translate(' + (x - w * FOOT).toFixed(1) + 'px,' + (y - h * 0.99).toFixed(1) + 'px) scale(' + face + ',' + (squash || 1) + ')'
      if (frame !== cur && frames[frame].complete) { img.src = frames[frame].src; cur = frame }
    }

    ;(function step(now) {
      var dt = Math.min(0.05, (now - lastT) / 1000); lastT = now
      var P = on && !reduced && s.classList.contains('in') && platforms() // wait for the logos to appear
      if (P && P.length) {
        if (!st || st.i >= P.length) { st = { i: 0, x: entry(P[0], 1), dir: 1, mode: 'walk', dist: 0, t: 0 }; st.y = P[0].y(st.x) }
        var p = P[st.i], face = p.walk * st.dir
        if (st.mode === 'walk') {
          st.x += SPEED * dt * face; st.dist += SPEED * dt
          var end = exit(p, st.dir)
          if ((end - st.x) * face <= 0) { // reached the edge: crouch, then jump to the next logo
            st.x = end
            var ni = st.i + st.dir
            if (ni < 0 || ni >= P.length) { st.mode = 'turn'; st.t = 0 }
            else { st.mode = 'crouch'; st.t = 0; st.to = ni }
          }
          st.y += (p.y(st.x) - st.y) * Math.min(1, dt * 10) // step up and down bumps smoothly
          place(st.x, st.y, face, WALK[Math.floor(st.dist / STRIDE) % WALK.length])
        } else if (st.mode === 'turn') { // end of the path: stand a moment, then walk back
          st.t += dt
          place(st.x, st.y, face, STAND)
          if (st.t > 1.2) { st.dir = -st.dir; st.mode = 'walk' }
        } else if (st.mode === 'crouch') {
          st.t += dt
          place(st.x, st.y, face, STAND, 1 - 0.12 * Math.sin(Math.min(1, st.t / 0.18) * Math.PI))
          if (st.t > 0.18) {
            var q = P[st.to], x1 = entry(q, st.dir)
            st.jump = { x0: st.x, y0: st.y, x1: x1, y1: q.y(x1), face: x1 >= st.x ? 1 : -1 }
            st.jump.dur = Math.max(0.45, Math.min(0.85, Math.hypot(x1 - st.x, st.jump.y1 - st.jump.y0) / 420))
            st.mode = 'jump'; st.t = 0
          }
        } else if (st.mode === 'jump') {
          st.t += dt
          var j = st.jump, t = Math.min(1, st.t / j.dur)
          var apex = Math.min(j.y0, j.y1) - 45 - Math.abs(j.x1 - j.x0) * 0.12 // arc rises above the higher logo
          var y = (1 - t) * (1 - t) * j.y0 + 2 * t * (1 - t) * (2 * apex - (j.y0 + j.y1) / 2) + t * t * j.y1
          place(j.x0 + (j.x1 - j.x0) * t, y, j.face, AIR)
          if (t >= 1) { st.i = st.to; st.x = j.x1; st.y = j.y1; st.mode = 'land'; st.t = 0 }
        } else if (st.mode === 'land') { // small squash on landing
          st.t += dt
          place(st.x, st.y, face, STAND, 1 - 0.1 * Math.sin(Math.min(1, st.t / 0.16) * Math.PI))
          if (st.t > 0.16) st.mode = 'walk'
        }
        el.classList.add('on')
      }
      requestAnimationFrame(step)
    })(lastT)
  }

  function init() {
    initClients()
    var section = document.querySelector('.ix-work')
    if (!section || section.dataset.ready) return
    section.dataset.ready = '1'
    var items = Array.prototype.slice.call(section.querySelectorAll('.ix-work-item'))
    var chars = items.map(function (it) {
      var box = it.querySelector('.ix-work-char'), path = box.dataset.char
      load(path)
      return { img: box.querySelector('img'), path: path, fps: FPS[path] || 24, offset: Math.random() * 10 }
    })

    // heading + cards reveal
    var head = section.querySelector('.ix-pf-head')
    if (!reduced) { section.classList.add('armed'); head.classList.add('armed') }
    items.forEach(function (it, i) { it.style.setProperty('--d', (i * 0.09) + 's') })
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return
        e.target.classList.add('in')
        io.unobserve(e.target)
        if (e.target.classList.contains('ix-work-item')) setTimeout(function () { e.target.classList.add('done') }, 2000)
      })
    }, { rootMargin: '0px 0px -12% 0px' })
    io.observe(head)
    items.forEach(function (it) { io.observe(it) })
    io.observe(section.querySelector('.ix-work-end'))

    var visible = false
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting }).observe(section)

    function tick(now) {
      if (visible && !reduced) {
        // idle loops
        chars.forEach(function (c) { show(c.img, c.path, Math.floor((now / 1000 + c.offset) * c.fps) % FRAMES[c.path]) })
      }
      requestAnimationFrame(tick)
    }
    if (!reduced) requestAnimationFrame(tick)
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
  else init()
  setInterval(init, 1000) // the site swaps page content without a full reload
})()
