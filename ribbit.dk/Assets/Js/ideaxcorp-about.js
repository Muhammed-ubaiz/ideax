// About page motion (styling in ideaxcorp-about.css). Runs only while the About page (.ixb-hero) is in the
// document; pages are swapped in without a reload, so it re-arms on 'ix:pageadded'.
//  - hero: "We are Ideaxcorp" split into letters that rise in turn; the brand tile tilts with the mouse
//  - story: the section pins and its panels scroll sideways with the page; images open from a slit
//  - expertise: each row's image floats beside the cursor
//  - numbers count up once; CTA buttons are magnetic
//  - a guide character (the explorer) walks along the bottom of the screen with the scroll, naming each section
;(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
  var page = null, io = null, queued = false
  var story = null, track = null, travel = 0
  var guide = null, guideImg = null, guideSay = null, frames = [], gx = 0, lastY = 0, dist = 0, sections = [], current = ''

  // ---------- setup for a (new) About page ----------
  function init() {
    var hero = document.querySelector('.ixb-hero')
    if (!hero) { teardown(); return }
    var p = hero.closest('.page')
    if (p === page) return
    page = p

    // hero letters
    var title = hero.querySelector('.ixb-title')
    if (title && !title.dataset.split) {
      title.dataset.split = '1'
      var n = 0
      Array.prototype.forEach.call(title.querySelectorAll('.ixb-line'), function (line) {
        var walk = function (node) {
          Array.prototype.slice.call(node.childNodes).forEach(function (c) {
            if (c.nodeType === 3) {
              var frag = document.createDocumentFragment()
              c.textContent.split('').forEach(function (ch) {
                if (ch === ' ') { frag.appendChild(document.createTextNode(' ')); return }
                var o = document.createElement('span'), i = document.createElement('span')
                o.className = 'ixb-ch'; o.style.setProperty('--i', n++); i.textContent = ch; o.appendChild(i); frag.appendChild(o)
              })
              c.parentNode.replaceChild(frag, c)
            } else walk(c)
          })
        }
        walk(line)
      })
      requestAnimationFrame(function () { requestAnimationFrame(function () { title.classList.add('is-in') }) })
    }

    // reveal-once observer: image masks and counters
    if (io) io.disconnect()
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return
        io.unobserve(e.target)
        if (e.target.hasAttribute('data-ixb-count')) count(e.target)
        else e.target.classList.add('is-in')
      })
    }, { rootMargin: '0px 0px -10% 0px' })
    Array.prototype.forEach.call(page.querySelectorAll('.ixb-mask, [data-ixb-count]'), function (el) {
      if (reduced) { el.classList.add('is-in'); return }
      // a figure waits at 0 until it counts up (the page itself carries the real value, for search and without scripts)
      if (el.hasAttribute('data-ixb-count')) el.textContent = (0).toFixed(+(el.getAttribute('data-ixb-dec') || 0))
      // story images sit off to the side until the track brings them in: watch them horizontally too
      io.observe(el)
    })

    story = page.querySelector('.ixb-story'); track = story && story.querySelector('.ixb-story-track')
    sections = Array.prototype.slice.call(page.querySelectorAll('[data-guide]'))
    buildGuide()
    measure(); queue()
  }
  function teardown() {
    page = null; story = null; track = null; sections = []
    if (io) { io.disconnect(); io = null }
    if (guide) guide.classList.remove('on')
  }

  // ---------- numbers ----------
  function count(el) {
    var to = parseFloat(el.getAttribute('data-ixb-count')), dec = +(el.getAttribute('data-ixb-dec') || 0), t0 = null
    if (reduced) { el.textContent = to.toFixed(dec); return }
    ;(function step(now) {
      t0 = t0 || now
      var k = Math.min(1, (now - t0) / 1600), e = 1 - Math.pow(1 - k, 4)
      el.textContent = (to * e).toFixed(dec)
      if (k < 1) requestAnimationFrame(step)
    })(performance.now())
  }

  // ---------- story pin: the section is as tall as the sideways travel ----------
  function measure() {
    if (!story || !track) return
    if (window.innerWidth <= 1000 || reduced) { story.style.height = ''; travel = 0; track.style.transform = ''; return }
    travel = Math.max(0, track.scrollWidth - window.innerWidth)
    story.style.height = (travel + window.innerHeight) + 'px'
  }

  // ---------- per-frame scroll work ----------
  function queue() { if (!queued) { queued = true; requestAnimationFrame(update) } }
  function update() {
    queued = false
    if (!page) return
    var vh = window.innerHeight
    if (story && track && travel) {
      // all reads first, then the one write (no forced layout in between)
      var r = story.getBoundingClientRect()
      var p = Math.max(0, Math.min(1, -r.top / (r.height - vh)))
      // images inside the moving track: open them once they slide into view (measured before this frame's move)
      var w = window.innerWidth, open = []
      Array.prototype.forEach.call(track.querySelectorAll('.ixb-mask:not(.is-in)'), function (m) {
        var b = m.getBoundingClientRect()
        if (b.left < w * .85 && b.right > 0 && b.top < vh && b.bottom > 0) open.push(m)
      })
      track.style.transform = 'translate3d(' + (-p * travel).toFixed(1) + 'px,0,0)'
      story.style.setProperty('--p', p.toFixed(4)) // the progress rail (ideaxcorp-about.css)
      var step = Math.min(3, Math.floor(p * 4 + .12))
      if (story._step !== step) { story._step = step; Array.prototype.forEach.call(story.querySelectorAll('.ixb-rail li'), function (li, i) { li.classList.toggle('on', i <= step); li.classList.toggle('now', i === step) }) }
      open.forEach(function (m) { m.classList.add('is-in') })
    }
    moveGuide()
  }

  // ---------- guide character ----------
  var FRAMES = 40
  function buildGuide() {
    if (!guide) {
      guide = document.createElement('div'); guide.className = 'ixb-guide'; guide.setAttribute('aria-hidden', 'true')
      guide.innerHTML = '<span class="ixb-guide-say"></span><img src="/Assets/Grx/explorer_push/000.webp?v=3" alt="" width="360" height="360">'
      document.body.appendChild(guide)
      guideImg = guide.querySelector('img'); guideSay = guide.querySelector('.ixb-guide-say')
      for (var i = 0; i < FRAMES; i++) { var im = new Image(); im.src = '/Assets/Grx/explorer_push/' + String(i).padStart(3, '0') + '.webp?v=3'; frames.push(im) }
    }
    lastY = window.scrollY; current = ''
  }
  function moveGuide() {
    if (!guide || !page) return
    // the site-wide guide (ideaxcorp-journey.js, html.ix-journey) walks the page instead and this one is hidden:
    // nothing to move (and no layout reads on every scroll)
    if (document.documentElement.classList.contains('ix-journey')) return
    var y = window.scrollY, max = document.documentElement.scrollHeight - window.innerHeight
    var hero = page.querySelector('.ixb-hero')
    var past = hero && y > hero.offsetHeight * .5
    guide.classList.toggle('on', !!past && !document.body.classList.contains('ix-transitioning'))
    var p = max > 0 ? y / max : 0, w = window.innerWidth, size = guide.offsetWidth
    var tx = (w - size) * (0.04 + 0.86 * p)
    var dy = y - lastY; lastY = y
    if (Math.abs(dy) > 0.5) {
      guide.classList.toggle('left', dy < 0) // faces the way it is walking
      dist += Math.abs(dy)
      if (!reduced) { var f = frames[Math.floor(dist / 9) % FRAMES]; if (f && f.complete) guideImg.src = f.src }
    }
    gx = tx
    guide.style.translate = gx.toFixed(1) + 'px 0'
    // the section in the middle of the screen names itself in the speech bubble
    var mid = window.innerHeight / 2, label = ''
    for (var i = 0; i < sections.length; i++) {
      var r = sections[i].getBoundingClientRect()
      if (r.top <= mid && r.bottom > mid) { label = sections[i].getAttribute('data-guide'); break }
    }
    if (label && label !== current) {
      current = label; guideSay.textContent = label
      guideSay.classList.remove('pop'); void guideSay.offsetWidth; guideSay.classList.add('pop')
    }
  }

  // ---------- mouse: hero tile, magnetic buttons ----------
  function onMove(e) {
    if (!fine || reduced) return
    var tile = page && page.querySelector('[data-ixb-tilt]')
    if (tile) {
      var cx = e.clientX / window.innerWidth - .5, cy = e.clientY / window.innerHeight - .5
      tile.style.setProperty('--ry', (-18 + cx * 30).toFixed(1) + 'deg'); tile.style.setProperty('--rx', (12 - cy * 24).toFixed(1) + 'deg')
    }
    // the closing "Let's create what's next" buttons, on every page
    Array.prototype.forEach.call(document.querySelectorAll('main .ixb-magnetic'), function (b) {
      var r = b.getBoundingClientRect(), mx = e.clientX - (r.left + r.width / 2), my = e.clientY - (r.top + r.height / 2)
      var near = Math.abs(mx) < r.width * .9 && Math.abs(my) < r.height * 1.6
      b.style.translate = near ? (mx * .25).toFixed(1) + 'px ' + (my * .35).toFixed(1) + 'px' : ''
    })
  }

  window.addEventListener('scroll', queue, { passive: true })
  window.addEventListener('resize', function () { measure(); queue() })
  document.addEventListener('mousemove', onMove, { passive: true })
  window.addEventListener('ix:pageadded', function () { page = null; setTimeout(init, 0) })
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
  else init()
  setInterval(function () { init(); measure() }, 1500) // late fonts/images change the story's width
})()
// About, "Our creative philosophy" (styles: "philosophy: orbit" in ideaxcorp-about.css): the orbit opens once as it
// arrives (.is-in: the photo, then the lines, then the cards in turn). Pages are swapped in without a reload.
;(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  var el = null
  function setup() {
    var o = document.querySelector('.ixb-or[data-or]')
    if (o === el) return
    el = o
    if (!el || el.classList.contains('is-in')) return
    if (reduced || !window.IntersectionObserver) { el.classList.add('is-in'); return }
    var io = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { es[0].target.classList.add('is-in'); io.disconnect() }
    }, { rootMargin: '0px 0px -18% 0px' })
    io.observe(el)
  }
  window.addEventListener('ix:pageadded', function () { setTimeout(setup, 0) })
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup); else setup()
  setInterval(setup, 1000)
})()
// About, "Our expertise" (styles: "expertise: stacking cards" in ideaxcorp-about.css): each card reveals once as it
// arrives (.is-in); on wide screens, as the next card slides over a pinned one, the one beneath eases back and dims
// (--cover, 0 to 1), and each picture drifts with the scroll (--py, -1 to 1). Reads first, then writes, once a frame.
;(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  var list = null, lis = [], cards = [], queued = false, io = null
  function setup() {
    var l = document.querySelector('#expertise .ixb-svc-list')
    if (l === list) return
    list = l; lis = []; cards = []
    if (io) { io.disconnect(); io = null }
    if (!list) return
    lis = Array.prototype.slice.call(list.children)
    cards = lis.map(function (li) { return li.querySelector('.ixb-svc') })
    if (reduced || !window.IntersectionObserver) { lis.forEach(function (li) { li.classList.add('is-in') }); return }
    io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target) } })
    }, { rootMargin: '0px 0px -15% 0px' })
    lis.forEach(function (li) { io.observe(li) })
    update()
  }
  function update() {
    queued = false
    if (!list || reduced || !document.body.contains(list)) return
    var wide = window.innerWidth > 1000, vh = window.innerHeight
    var r = lis.map(function (li) { return li.getBoundingClientRect() })
    var out = r.map(function (b, k) {
      var cover = 0
      if (wide && k < r.length - 1) cover = Math.max(0, Math.min(1, (b.bottom - r[k + 1].top) / b.height))
      var py = Math.max(-1, Math.min(1, ((b.top + b.height / 2) - vh / 2) / vh))
      return [cover, wide ? py : 0]
    })
    cards.forEach(function (c, k) {
      c.style.setProperty('--cover', out[k][0].toFixed(3))
      c.style.setProperty('--py', out[k][1].toFixed(3))
    })
  }
  window.addEventListener('scroll', function () { if (!queued) { queued = true; requestAnimationFrame(update) } }, { passive: true })
  window.addEventListener('resize', function () { if (!queued) { queued = true; requestAnimationFrame(update) } })
  window.addEventListener('ix:pageadded', function () { setTimeout(setup, 0) })
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup); else setup()
  setInterval(setup, 1000)
})()
// About, "Our approach" (styles: "approach: the path" in ideaxcorp-about.css): the path draws with the scroll
// (--p from when the section's top reaches 70% of the screen until its foot passes 45%), the dot rides its tip,
// and each stop lights up (.on) once the path reaches it; the step pictures drift (--py). Reads, then writes.
;(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  var box = null, fill = null, dot = null, steps = [], nodes = [], len = 0, queued = false
  var AT = [.17, .5, .83] // where the stops sit along the path's height
  function setup() {
    var b = document.querySelector('.ixb-ap[data-ap]')
    if (b === box) return
    box = b
    if (!box) return
    fill = box.querySelector('.ixb-ap-fill'); dot = box.querySelector('.ixb-ap-dot')
    steps = Array.prototype.slice.call(box.querySelectorAll('.ixb-ap-step'))
    nodes = Array.prototype.slice.call(box.querySelectorAll('.ixb-ap-node'))
    len = fill && fill.getTotalLength ? fill.getTotalLength() : 0
    if (reduced) { steps.concat(nodes).forEach(function (e) { e.classList.add('on') }); box.style.setProperty('--p', 1); return }
    update()
  }
  function update() {
    queued = false
    if (!box || reduced || !document.body.contains(box)) return
    var r = box.getBoundingClientRect(), vh = window.innerHeight, wide = window.innerWidth > 1000
    var p = Math.max(0, Math.min(1, (vh * .7 - r.top) / (r.height - vh * .25)))
    var pt = null
    if (wide && len && dot) {
      // the tip of the drawn path: the point at that share of its length, in the box's pixels (the drawing is stretched to fit)
      pt = fill.getPointAtLength(p * len)
    }
    var py = steps.map(function (s) { var b = s.getBoundingClientRect(); return Math.max(-1, Math.min(1, ((b.top + b.height / 2) - vh / 2) / vh)) })
    box.style.setProperty('--p', p.toFixed(4))
    if (pt) dot.style.transform = 'translate(' + (pt.x / 1000 * r.width).toFixed(1) + 'px,' + (pt.y / 1000 * r.height).toFixed(1) + 'px)'
    steps.forEach(function (s, k) {
      // on wide screens the path's height share; on phones the step's own place in the column
      var on = wide ? p >= AT[k] - .02 : (s.getBoundingClientRect().top < vh * .62 || p >= .97) // (the last one at the latest when the line is full)
      s.classList.toggle('on', on); if (nodes[k]) nodes[k].classList.toggle('on', on)
      s.style.setProperty('--py', py[k].toFixed(3))
    })
  }
  window.addEventListener('scroll', function () { if (!queued) { queued = true; requestAnimationFrame(update) } }, { passive: true })
  window.addEventListener('resize', function () { if (!queued) { queued = true; requestAnimationFrame(update) } })
  window.addEventListener('ix:pageadded', function () { setTimeout(setup, 0) })
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup); else setup()
  setInterval(setup, 1000)
})()
// About, "The team" (styles: "team: the wall" in ideaxcorp-about.css): the wall opens once as it arrives (.is-in);
// on wide screens each picture leans towards the pointer, more the nearer it is (--mx/--my), and drifts with the
// scroll (--py), and the big words behind slide with it (--p). A credit and its picture light up together (.on).
// Reads first, then writes, once a frame.
;(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
  var box = null, ms = [], cr = [], px = -1e4, py = -1e4, queued = false, io = null
  function wide() { return window.innerWidth > 1000 }
  function setup() {
    var b = document.querySelector('.ixb-tw[data-tw]')
    if (b === box) return
    box = b
    if (io) { io.disconnect(); io = null }
    if (!box) return
    ms = Array.prototype.slice.call(box.querySelectorAll('.ixb-tw-m'))
    // the name tape: a second copy of the list (hidden from screen readers) makes the loop seamless
    var tape = box.querySelector('.ixb-tw-credits')
    if (tape && !tape.dataset.doubled) {
      tape.dataset.doubled = '1'
      Array.prototype.slice.call(tape.children).forEach(function (li) { var c = li.cloneNode(true); c.setAttribute('aria-hidden', 'true'); tape.appendChild(c) })
    }
    cr = []
    Array.prototype.forEach.call(box.querySelectorAll('.ixb-tw-credits li'), function (li) { var k = +li.getAttribute('data-k'); (cr[k] = cr[k] || []).push(li) })
    function names(k, on) { (cr[k] || []).forEach(function (li) { li.classList.toggle('on', on) }) }
    function link(k, on) { if (ms[k]) ms[k].classList.toggle('on', on); names(k, on) }
    ms.forEach(function (m, k) {
      m.addEventListener('mouseenter', function () { names(k, true) })
      m.addEventListener('mouseleave', function () { names(k, false) })
      m.addEventListener('focus', function () { names(k, true) })
      m.addEventListener('blur', function () { names(k, false) })
    })
    cr.forEach(function (list, k) {
      list.forEach(function (c) {
        c.addEventListener('mouseenter', function () { link(k, true) })
        c.addEventListener('mouseleave', function () { link(k, false) })
      })
    })
    if (fine && !reduced) {
      box.addEventListener('pointermove', function (e) { px = e.clientX; py = e.clientY; queue() })
      box.addEventListener('pointerleave', function () { px = py = -1e4; queue() })
    }
    if (reduced || !window.IntersectionObserver) { box.classList.add('is-in'); return }
    io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { box.classList.add('is-in'); io.disconnect() } }, { rootMargin: '0px 0px -18% 0px' })
    io.observe(box)
    queue()
  }
  function queue() { if (!queued) { queued = true; requestAnimationFrame(update) } }
  function update() {
    queued = false
    if (!box || reduced || !document.body.contains(box) || !wide()) return
    var vh = window.innerHeight, br = box.getBoundingClientRect()
    var rs = ms.map(function (m) { return m.getBoundingClientRect() })
    var p = Math.max(0, Math.min(1, (vh - br.top) / (br.height + vh)))
    box.style.setProperty('--p', p.toFixed(3))
    ms.forEach(function (m, k) {
      var r = rs[k], cx = r.left + r.width / 2, cy = r.top + r.height / 2
      var dx = px - cx, dy = py - cy, d = Math.sqrt(dx * dx + dy * dy), f = Math.max(0, 1 - d / 520)
      var mx = Math.max(-1, Math.min(1, dx / 260)) * f, my = Math.max(-1, Math.min(1, dy / 260)) * f
      m.style.setProperty('--mx', mx.toFixed(3)); m.style.setProperty('--my', my.toFixed(3))
      m.style.setProperty('--py', Math.max(-1, Math.min(1, (cy - vh / 2) / vh)).toFixed(3))
    })
  }
  window.addEventListener('scroll', queue, { passive: true })
  window.addEventListener('resize', queue)
  window.addEventListener('ix:pageadded', function () { setTimeout(setup, 0) })
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup); else setup()
  setInterval(setup, 1000)
})()
