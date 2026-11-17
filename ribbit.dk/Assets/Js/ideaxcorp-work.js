// Our Portfolio: cards rise in turn and "All Projects" rises in at the end.
;(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // "Our Clients": reveal the heading and logo cards once
  function initClients() {
    var s = document.querySelector('.ix-clients')
    if (!s || s.dataset.ready) return
    s.dataset.ready = '1'
    if (reduced) return
    s.classList.add('armed')

    new IntersectionObserver(function (e, o) {
      if (!e[0].isIntersecting) return
      s.classList.add('in')
      s.dispatchEvent(new Event('ix-clients-in'))
      setTimeout(function () { s.classList.add('done') }, 1800)
      o.disconnect()
    }, { rootMargin: '0px 0px -15% 0px' }).observe(s)
  }

  function init() {
    initClients()
    var section = document.querySelector('.ix-work')
    if (!section || section.dataset.ready) return
    section.dataset.ready = '1'
    var items = Array.prototype.slice.call(section.querySelectorAll('.ix-work-item'))

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
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
  else init()
  setInterval(init, 1000) // the site swaps page content without a full reload
  window.addEventListener('ix:pageadded', init)
})()
// Portfolio "All projects": a purple pill slides behind the chosen filter (the filtering itself: ideaxcorp-pages.js)
;(function () {
  function bars() { return document.querySelectorAll('#all-work .ixp-filters') }
  function move(f, instant) {
    var p = f._pill, b = f.querySelector('.ixp-filter[aria-pressed="true"]')
    if (!p || !b) return
    if (instant) p.style.transition = 'none'
    p.style.width = b.offsetWidth + 'px'; p.style.height = b.offsetHeight + 'px'
    p.style.transform = 'translate(' + b.offsetLeft + 'px,' + b.offsetTop + 'px)'
    if (instant) { void p.offsetWidth; p.style.transition = '' }
    // on a narrow screen the bar scrolls sideways: bring the chosen filter into view
    if (!instant && f.scrollWidth > f.clientWidth) f.scrollTo({ left: Math.max(0, b.offsetLeft - 24), behavior: 'smooth' })
  }
  function init() {
    Array.prototype.forEach.call(bars(), function (f) {
      if (f._pill) return
      var p = document.createElement('span'); p.className = 'ixw-pill'; p.setAttribute('aria-hidden', 'true')
      f.insertBefore(p, f.firstChild); f._pill = p; f.classList.add('ixw-pill-on')
      move(f, true)
    })
  }
  function all(instant) { Array.prototype.forEach.call(bars(), function (f) { move(f, instant) }) }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('#all-work .ixp-filter')
    if (b) setTimeout(function () { move(b.closest('.ixp-filters')) }, 0) // after the filter has marked it pressed
  })
  window.addEventListener('resize', function () { all(true) })
  window.addEventListener('load', function () { all(true) })
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { all(true) })
  window.addEventListener('ix:pageadded', function () { setTimeout(function () { init(); setTimeout(function () { all(true) }, 400) }, 0) })
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init()
})()
// Services, "Our expertise" (styles: "Our expertise: expanding panels" in ideaxcorp-services.css). One panel is
// open at a time: hover or keyboard focus opens one; on touch, the first tap opens a row and the second follows its
// link. Left alone on a wide screen, the panels advance by themselves (every 5.5s, paused while hovered, focused or
// off screen). The panels rise in as the list arrives; the open picture drifts with the scroll (--py).
;(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
  var list = null, ps = [], cur = 0, timer = 0, held = false, seen = false, io = null, queued = false
  function wide() { return window.innerWidth > 1000 }
  function open(i) {
    cur = i
    ps.forEach(function (p, k) { p.classList.toggle('on', k === i) })
    restart()
  }
  function restart() {
    clearTimeout(timer)
    var auto = !reduced && wide() && seen && !held
    list.classList.toggle('auto', auto); list.classList.toggle('hold', held)
    // restart the open panel's progress line
    var bar = ps[cur] && ps[cur].querySelector('.ixsv-bar')
    if (bar) { bar.style.display = 'none'; void bar.offsetWidth; bar.style.display = '' }
    if (auto) timer = setTimeout(function () { open((cur + 1) % ps.length) }, 5500)
  }
  function setup() {
    var l = document.querySelector('.ixsv-panels[data-ixs]')
    if (l === list) return
    list = l; clearTimeout(timer); cur = 0; held = false; seen = false
    if (io) { io.disconnect(); io = null }
    if (!list) return
    ps = Array.prototype.slice.call(list.querySelectorAll('.ixsv-p'))
    ps.forEach(function (p, k) {
      var a = p.querySelector('.ixsv-pa')
      if (fine) p.addEventListener('mouseenter', function () { if (wide()) { held = true; if (cur !== k) open(k); else restart() } })
      a.addEventListener('focus', function () {
        held = true
        // keyboard focus opens the panel; the focus a tap gives first must not, or the tap would count as the second
        var kb = true; try { kb = a.matches(':focus-visible') } catch (e) {}
        if (kb && cur !== k) open(k); else restart()
      })
      a.addEventListener('blur', function () { held = false; restart() })
      p.addEventListener('click', function (e) { if (cur !== k) { e.preventDefault(); e.stopPropagation(); held = true; open(k) } }, true) // first tap opens (caught before the link's own handler), the next follows the link
    })
    list.addEventListener('mouseleave', function () { held = false; restart() })
    if (reduced || !window.IntersectionObserver) { list.classList.add('is-in'); return }
    io = new IntersectionObserver(function (es) {
      var e = es[0]
      if (e.isIntersecting) list.classList.add('is-in')
      seen = e.isIntersecting; restart()
    }, { threshold: .35 })
    io.observe(list)
    queue()
  }
  function queue() { if (!queued) { queued = true; requestAnimationFrame(update) } }
  function update() {
    queued = false
    if (!list || reduced || !document.body.contains(list)) return
    var r = list.getBoundingClientRect(), vh = window.innerHeight
    list.style.setProperty('--py', Math.max(-1, Math.min(1, ((r.top + r.height / 2) - vh / 2) / vh)).toFixed(3))
  }
  window.addEventListener('scroll', queue, { passive: true })
  window.addEventListener('resize', function () { if (list) restart() })
  window.addEventListener('ix:pageadded', function () { setTimeout(setup, 0) })
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup); else setup()
  setInterval(setup, 1000)
})()
// Services, "Our working process" (styles: "Our working process: the rail" in ideaxcorp-services.css). As the rail
// scrolls past, --p runs 0 to 1 (the line fills, the dot rides its tip); every step the line has reached is .on,
// the latest .now. On a wide screen a step sits at its share of the width; on phones, at its place down the column.
;(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  var box = null, ss = [], queued = false, io = null
  var AT = [.1, .3, .5, .7, .9]
  function setup() {
    var b = document.querySelector('.ixpr[data-ixpr]')
    if (b === box) { if (box) queue(); return }
    box = b
    if (io) { io.disconnect(); io = null }
    if (!box) return
    ss = Array.prototype.slice.call(box.querySelectorAll('.ixpr-s'))
    if (reduced) { box.classList.add('is-in'); box.style.setProperty('--p', 1); ss.forEach(function (s) { s.classList.add('on') }); ss[ss.length - 1].classList.add('now'); return }
    if (window.IntersectionObserver) {
      io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { box.classList.add('is-in'); io.disconnect() } }, { rootMargin: '0px 0px -15% 0px' })
      io.observe(box)
    } else box.classList.add('is-in')
    queue()
  }
  function queue() { if (!queued) { queued = true; requestAnimationFrame(update) } }
  function update() {
    queued = false
    if (!box || reduced || !document.body.contains(box)) return
    var r = box.getBoundingClientRect(), vh = window.innerHeight, wide = window.innerWidth > 1000
    // from the rail's top at 75% of the screen to its foot at 55%
    var p = Math.max(0, Math.min(1, (vh * .75 - r.top) / (r.height - vh * .2 + vh * .0001)))
    var at = wide ? AT : ss.map(function (s) { var b = s.getBoundingClientRect(); return (b.top - r.top + 20) / r.height })
    var last = -1
    ss.forEach(function (s, k) { var on = p >= at[k] - .03; s.classList.toggle('on', on); if (on) last = k })
    ss.forEach(function (s, k) { s.classList.toggle('now', k === last) })
    box.style.setProperty('--p', p.toFixed(4))
  }
  window.addEventListener('scroll', queue, { passive: true })
  window.addEventListener('resize', queue)
  window.addEventListener('ix:pageadded', function () { setTimeout(setup, 0) })
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup); else setup()
  setInterval(setup, 1000)
})()
// Services, "Why our approach works" (styles: "Why our approach works: the manifesto index" in
// ideaxcorp-services.css). Each line arrives (.is-in) as it scrolls in; its drawing drifts with the scroll (--py)
// and, with a mouse, a soft light follows the pointer across the hovered line (--mx, --my).
;(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
  var list = null, rows = [], io = null, queued = false
  function setup() {
    var l = document.querySelector('.ixwy[data-ixwy]')
    if (l === list) { if (list) queue(); return }
    list = l
    if (io) { io.disconnect(); io = null }
    if (!list) return
    rows = Array.prototype.slice.call(list.querySelectorAll('.ixwy-r'))
    if (reduced || !window.IntersectionObserver) { rows.forEach(function (r) { r.classList.add('is-in') }); return }
    io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target) } })
    }, { rootMargin: '0px 0px -12% 0px', threshold: .2 })
    rows.forEach(function (r) { io.observe(r) })
    if (fine) rows.forEach(function (r) {
      r.addEventListener('pointermove', function (e) {
        var b = r.getBoundingClientRect()
        r.style.setProperty('--mx', (e.clientX - b.left + 24) + 'px'); r.style.setProperty('--my', (e.clientY - b.top) + 'px')
      })
    })
    queue()
  }
  function queue() { if (!queued) { queued = true; requestAnimationFrame(update) } }
  function update() {
    queued = false
    if (!list || reduced || !document.body.contains(list)) return
    var vh = window.innerHeight
    var ys = rows.map(function (r) { var b = r.getBoundingClientRect(); return Math.max(-1, Math.min(1, (b.top + b.height / 2 - vh / 2) / vh)) })
    rows.forEach(function (r, k) { r.style.setProperty('--py', ys[k].toFixed(3)) })
  }
  window.addEventListener('scroll', queue, { passive: true })
  window.addEventListener('resize', queue)
  window.addEventListener('ix:pageadded', function () { setTimeout(setup, 0) })
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup); else setup()
  setInterval(setup, 1000)
})()
// Portfolio, the project archive under the hero (styles: "All projects: the archive" in
// ideaxcorp-work.css). Posters arrive once (.is-in); the shown projects are dealt, in order, into staggered columns
// (three wide, two narrower) and dealt again after a filter, the grid fading for a moment while it changes (the
// filtering itself: ideaxcorp-pages.js); with a mouse, a "View" disc follows the pointer over any poster.
;(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
  var arc = null, io = null, cols = 0, cur = null, cx = 0, cy = 0, tx = 0, ty = 0, raf = 0
  function setup() {
    var a = document.querySelector('[data-ixw-arc]')
    if (a === arc) return
    arc = a; cols = 0
    if (io) { io.disconnect(); io = null }
    if (!arc) return
    var all = Array.prototype.slice.call(arc.querySelectorAll('.ixw-it'))
    if (reduced || !window.IntersectionObserver) all.forEach(function (e) { e.classList.add('is-in') })
    else {
      io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target) } })
      }, { rootMargin: '0px 0px -10% 0px', threshold: .12 })
      all.forEach(function (e) { io.observe(e) })
    }
    deal()
  }
  // deal the shown projects into columns, left to right, in order
  function deal(force) {
    if (!arc) return
    var n = window.innerWidth > 1000 ? 3 : 2
    if (n === cols && !force) return
    cols = n
    var its = Array.prototype.slice.call(arc.querySelectorAll('.ixw-it'))
    Array.prototype.slice.call(arc.querySelectorAll('.ixw-col')).forEach(function (c) { c.remove() })
    var cs = []
    for (var i = 0; i < n; i++) { var c = document.createElement('div'); c.className = 'ixw-col'; c.setAttribute('role', 'none'); cs.push(c); arc.appendChild(c) }
    var k = 0
    its.forEach(function (it) { if (it.classList.contains('is-hidden')) cs[n - 1].appendChild(it); else cs[k++ % n].appendChild(it) })
    arc.classList.add('cols'); arc.classList.toggle('n3', n === 3); arc.classList.toggle('n2', n === 2)
  }
  document.addEventListener('click', function (e) {
    if (!(e.target.closest && e.target.closest('#all-work .ixp-filter')) || !arc) return
    setTimeout(function () { // after ideaxcorp-pages.js has hidden and shown the projects
      if (reduced) { deal(true); return }
      arc.classList.add('swapping')
      setTimeout(function () {
        deal(true)
        // start the shown posters' rise again, now that they sit in their new columns
        Array.prototype.forEach.call(arc.querySelectorAll('.ixw-it.ixp-filter-anim'), function (it) { it.classList.remove('ixp-filter-anim'); void it.offsetWidth; it.classList.add('ixp-filter-anim') })
        arc.classList.remove('swapping')
      }, 180)
    }, 0)
  })
  // the "View" disc
  function disc() {
    if (cur && document.body.contains(cur)) return cur
    cur = document.createElement('div'); cur.className = 'ixw-cur'; cur.setAttribute('aria-hidden', 'true'); cur.textContent = 'View'
    document.body.appendChild(cur); return cur
  }
  function follow() {
    cx += (tx - cx) * .2; cy += (ty - cy) * .2
    cur.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)'
    raf = (Math.abs(tx - cx) > .3 || Math.abs(ty - cy) > .3) ? requestAnimationFrame(follow) : 0
  }
  if (fine && !reduced) {
    document.addEventListener('pointermove', function (e) {
      var over = e.target.closest && e.target.closest('[data-ixw-view] .ixw-it-media')
      if (!over && !(cur && cur.classList.contains('on'))) return
      var d = disc(); tx = e.clientX; ty = e.clientY
      if (over && !d.classList.contains('on')) { cx = tx; cy = ty; d.classList.add('on') }
      if (!over) d.classList.remove('on')
      if (!raf) raf = requestAnimationFrame(follow)
    }, { passive: true })
    window.addEventListener('scroll', function () { if (cur) cur.classList.remove('on') }, { passive: true })
    window.addEventListener('ix:pageadded', function () { if (cur) cur.classList.remove('on') })
  }
  window.addEventListener('resize', function () { deal() })
  window.addEventListener('ix:pageadded', function () { setTimeout(setup, 0) })
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup); else setup()
  setInterval(setup, 1000)
})()
// Portfolio, project details popup: fades out instead of vanishing (styles: "the project details popup" in
// ideaxcorp-work.css). The close button, a click on the backdrop and Esc are caught before ideaxcorp-pages.js's own
// handler; the popup gets .closing, and when its fade ends it is closed for real, which runs that script's clean-up
// (focus back to the card, the page unlocked, the #project- address cleared). Also hides the "View" disc on opening.
;(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  function shut(d) {
    if (!d || !d.open || d.classList.contains('closing')) return
    if (reduced) { d.close(); return }
    d.classList.add('closing')
    setTimeout(function () { d.classList.remove('closing'); if (d.open) d.close() }, 260)
  }
  document.addEventListener('click', function (e) {
    var t = e.target
    var pj = t.closest && t.closest('[data-project]')
    if (pj) {
      var v = document.querySelector('.ixw-cur'); if (v) v.classList.remove('on')
      // the poster panel takes the project's own colour (the card's --pbg); a link inside the popup keeps the current one
      var card = pj.closest('.ixw-it'), pbg = card && card.style.getPropertyValue('--pbg')
      if (pbg) setTimeout(function () { var dd = document.querySelector('dialog.ixp-dialog'); if (dd) dd.style.setProperty('--pbg', pbg) }, 0)
    }
    var d = t.closest && t.closest('dialog.ixp-dialog')
    if (!d) return
    if (t === d || t.closest('.ixp-dialog-close')) { e.preventDefault(); e.stopPropagation(); shut(d) }
  }, true)
  document.addEventListener('cancel', function (e) { // Esc
    var d = e.target
    if (d && d.matches && d.matches('dialog.ixp-dialog')) { e.preventDefault(); shut(d) }
  }, true)
})()
