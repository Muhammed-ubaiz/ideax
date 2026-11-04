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
      var r = story.getBoundingClientRect()
      var p = Math.max(0, Math.min(1, -r.top / (r.height - vh)))
      track.style.transform = 'translate3d(' + (-p * travel).toFixed(1) + 'px,0,0)'
      // images inside the moving track: open them once they slide into view
      Array.prototype.forEach.call(track.querySelectorAll('.ixb-mask:not(.is-in)'), function (m) {
        var b = m.getBoundingClientRect()
        if (b.left < window.innerWidth * .85 && b.right > 0 && b.top < vh && b.bottom > 0) m.classList.add('is-in')
      })
    }
    moveGuide()
  }

  // ---------- guide character ----------
  var FRAMES = 40
  function buildGuide() {
    if (!guide) {
      guide = document.createElement('div'); guide.className = 'ixb-guide'; guide.setAttribute('aria-hidden', 'true')
      guide.innerHTML = '<span class="ixb-guide-say"></span><img src="/Assets/Grx/explorer_push/000.png" alt="" width="360" height="360">'
      document.body.appendChild(guide)
      guideImg = guide.querySelector('img'); guideSay = guide.querySelector('.ixb-guide-say')
      for (var i = 0; i < FRAMES; i++) { var im = new Image(); im.src = '/Assets/Grx/explorer_push/' + String(i).padStart(3, '0') + '.png'; frames.push(im) }
    }
    lastY = window.scrollY; current = ''
  }
  function moveGuide() {
    if (!guide || !page) return
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

  // ---------- mouse: hero tile, expertise images, magnetic buttons ----------
  function onMove(e) {
    if (!page || !fine || reduced) return
    var tile = page.querySelector('[data-ixb-tilt]')
    if (tile) {
      var cx = e.clientX / window.innerWidth - .5, cy = e.clientY / window.innerHeight - .5
      tile.style.setProperty('--ry', (-18 + cx * 30).toFixed(1) + 'deg'); tile.style.setProperty('--rx', (12 - cy * 24).toFixed(1) + 'deg')
    }
    var row = e.target.closest && e.target.closest('.ixb-svc')
    if (row) {
      var img = row.querySelector('.ixb-svc-img'), rr = row.getBoundingClientRect()
      img.style.translate = (e.clientX - rr.left + 28).toFixed(0) + 'px ' + (e.clientY - rr.top - img.offsetHeight / 2).toFixed(0) + 'px'
    }
    Array.prototype.forEach.call(page.querySelectorAll('.ixb-magnetic'), function (b) {
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
