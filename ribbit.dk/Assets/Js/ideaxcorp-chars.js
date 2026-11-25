// Character guides (styles in ideaxcorp-chars.css). On each page one of the five 3D characters peeks up from behind
// the hero's label, and another from behind a part of the page worth a look (the form, the list, the team):
//  - it rises from behind its edge when it scrolls into view (and says hello once, in a little bubble), and sinks
//    back when it leaves, to pop up again next time;
//  - on a mouse or trackpad it turns in 3D to follow the pointer, eased so it never jerks;
//  - scroll fast and it ducks behind its edge, peeking out again once you slow down;
//  - click or tap it and it hops and speaks; on the Contact form it cheers when a message is sent.
// SPOTS says which character stands where on which page. Pages are swapped in without a reload, so setup runs again
// on ix:pageadded and once a second; each spot is built once per page.
;(function () {
  var IMG = '/Assets/Grx/intro/'
  var CHAR = { // natural size; peek = how much of its height shows above the edge
    creator: { w: 785, h: 709, peek: .5 },
    outlaw: { w: 575, h: 447, peek: .74 },
    sage: { w: 390, h: 766, peek: .44 },
    jester: { w: 1350, h: 735, peek: .5 },
    explorer: { w: 638, h: 715, peek: .5 }
  }
  var HERO = '.ixp-hero .ixp-eyebrow, .ixb-hero .ixp-eyebrow'
  var SPOTS = {
    '/about/': [{ host: HERO, c: 'creator', side: 'c', w: 78, say: 'Hi there!' }],
    '/services/': [{ host: HERO, c: 'outlaw', side: 'c', w: 92, say: 'Let’s build.' }],
    '/portfolio/': [{ host: HERO, c: 'jester', side: 'c', w: 132, say: 'Take a look!' }],
    '/blog/': [{ host: HERO, c: 'sage', side: 'c', w: 56, say: 'Fresh reads!' },
               { host: '#latest [data-ixbl-grid]', anchor: true, c: 'outlaw', side: 'r', w: 120, wm: 92, x: '3%', say: 'Pick a topic' }],
    '/contact/': [{ host: HERO, c: 'creator', side: 'c', w: 78, say: 'Say hello!' },
                  { host: '.ixct-formbox', c: 'outlaw', side: 'r', w: 126, wm: 98, say: 'We read every message', form: true }],
    '/': [{ host: '#contact-us .ix-contact-form', c: 'creator', side: 'r', w: 118, wm: 92, say: 'Drop us a line!', form: true }]
  }
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
  var all = [], shown = new Set(), px = innerWidth / 2, py = innerHeight / 2, lastY = scrollY, duckT = 0, ducked = false, running = false

  function path() { var p = location.pathname.replace(/index\.html$/, ''); return p.slice(-1) === '/' ? p : p + '/' }
  function current() { var pages = document.querySelectorAll('main .page'); return pages[pages.length - 1] }

  function build(spot, host) {
    var c = CHAR[spot.c], el = document.createElement('span')
    el.className = 'ixch ixch--' + spot.c + ' ixch--' + spot.side
    el.setAttribute('aria-hidden', 'true')
    el.style.cssText = '--w:' + spot.w + 'px;--ar:' + (c.h / c.w).toFixed(4) + ';--peek:' + c.peek + (spot.wm ? ';--wm:' + spot.wm + 'px' : '') + (spot.x ? ';--x:' + spot.x : '')
    el.innerHTML = '<span class="ixch-say">' + spot.say + '</span><span class="ixch-ledge"><span class="ixch-body"><span class="ixch-tilt">' +
      '<img src="' + IMG + spot.c + '.webp" width="' + c.w + '" height="' + c.h + '" alt="" loading="lazy" decoding="async" draggable="false"></span></span></span>'
    host.classList.add('ixch-host')
    if (spot.side !== 'c') { // on stacked layouts the space above a form or list is tight: make room for the head and its bubble
      var wm = spot.wm || spot.w
      host.classList.add('ixch-room')
      host.style.setProperty('--ixch-room', Math.round(wm * c.h / c.w * c.peek + 46) + 'px')
    }
    host.appendChild(el)
    var me = { el: el, tilt: el.querySelector('.ixch-tilt'), rx: 0, ry: 0, rz: 0, greeted: false, sayT: 0, say: spot.say }
    el.addEventListener('click', function (e) { e.stopPropagation(); hop(me, me.say) })
    if (spot.form) watchForm(host, me)
    if (io) io.observe(el); else el.classList.add('is-up')
    all.push(me)
    return me
  }

  function speak(me, text, ms) {
    me.el.querySelector('.ixch-say').textContent = text
    me.el.classList.add('is-say')
    clearTimeout(me.sayT)
    me.sayT = setTimeout(function () { me.el.classList.remove('is-say') }, ms || 2400)
  }
  function hop(me, text) {
    me.el.classList.remove('is-hop'); void me.el.offsetWidth; me.el.classList.add('is-hop')
    setTimeout(function () { me.el.classList.remove('is-hop') }, 800)
    if (text) speak(me, text)
  }
  // the form's helper cheers when the message has gone (ideaxcorp-contact.js marks the status .ok)
  function watchForm(host, me) {
    var st = host.querySelector('.ix-contact-status') || (host.closest('.ix-contact') || host).querySelector('.ix-contact-status')
    if (!st || !window.MutationObserver) return
    new MutationObserver(function () {
      if (st.classList.contains('ok') && /thank/i.test(st.textContent)) hop(me, 'Thank you! 🎉')
      else if (st.classList.contains('err')) speak(me, 'Almost! Check the fields', 2600)
    }).observe(st, { attributes: true, childList: true, characterData: true, subtree: true })
  }

  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      var me = all.filter(function (m) { return m.el === e.target })[0]
      if (!me) return
      if (e.isIntersecting) {
        shown.add(me)
        setTimeout(function () { if (shown.has(me)) me.el.classList.add('is-up') }, 220)
        if (!me.greeted) { me.greeted = true; setTimeout(function () { if (shown.has(me)) speak(me, me.say) }, 1100) }
        loop()
      } else { shown.delete(me); me.el.classList.remove('is-up', 'is-say') }
    })
  }, { threshold: 0, rootMargin: '-8% 0px -14% 0px' }) : null

  // every frame while one is on screen: ease each towards the pointer; duck when the page is scrolled fast
  function loop() {
    if (running || reduce) return
    running = true
    requestAnimationFrame(frame)
  }
  function frame() {
    if (!shown.size) { running = false; return }
    var y = scrollY, v = Math.abs(y - lastY); lastY = y
    if (v > 38) { duckT = performance.now(); if (!ducked) { ducked = true; shown.forEach(function (m) { m.el.classList.add('is-duck') }) } }
    else if (ducked && performance.now() - duckT > 420) { ducked = false; shown.forEach(function (m) { m.el.classList.remove('is-duck') }) }
    shown.forEach(function (m) {
      var tx = 0, ty = 0
      if (fine) {
        var r = m.el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2
        tx = Math.max(-1, Math.min(1, (px - cx) / (innerWidth * .45)))
        ty = Math.max(-1, Math.min(1, (py - cy) / (innerHeight * .55)))
      }
      m.ry += (tx * 20 - m.ry) * .09
      m.rx += (-ty * 12 - m.rx) * .09
      m.rz += (tx * 4 - m.rz) * .09
      m.tilt.style.transform = 'rotateX(' + m.rx.toFixed(2) + 'deg) rotateY(' + m.ry.toFixed(2) + 'deg) rotate(' + m.rz.toFixed(2) + 'deg)'
    })
    requestAnimationFrame(frame)
  }
  window.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse' || e.pointerType === 'pen') { px = e.clientX; py = e.clientY } }, { passive: true })

  function setup() {
    var page = current(), spots = SPOTS[path()]
    if (!page || !spots) return
    spots.forEach(function (spot, i) {
      var host = page.querySelector(spot.host)
      if (!host) return
      if (spot.anchor) { // a list the page lays out itself: stand on an empty anchor just above it, not inside it
        var prev = host.previousElementSibling
        if (prev && prev.classList.contains('ixch-anchor')) return
        var a = document.createElement('div'); a.className = 'ixch-anchor'; a.setAttribute('aria-hidden', 'true')
        host.parentNode.insertBefore(a, host); host = a
      } else if (host.querySelector(':scope > .ixch')) return
      build(spot, host)
    })
    all = all.filter(function (m) { if (document.body.contains(m.el)) return true; shown.delete(m); return false }) // the page that left
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup)
  else setup()
  window.addEventListener('ix:pageadded', setup)
  setInterval(setup, 1000)
})()
