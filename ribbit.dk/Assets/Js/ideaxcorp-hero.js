// Home hero: the sage mascot stands with its arms up and the Ideaxcorp logo drops into its hands.
// Scrolling then carries the two up the screen (spring-smoothed): the mascot steps as it climbs, the
// logo rocks on its palms and shrinks, and the shadow stays on the floor. Styling in ideaxcorp-hero.css.
// The site's own showreel (.m.showreel) is hidden and only marks the page.
;(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  var stage = null, anims = [], started = false
  var cur = 0, lastW = 0

  function build() {
    stage = document.createElement('div')
    stage.className = 'ix-hs'
    stage.setAttribute('aria-hidden', 'true')
    stage.innerHTML =
      '<div class="ix-hs-shadow"></div>' +
      '<div class="ix-hs-cam"><div class="ix-hs-rig"><div class="ix-hs-enter"><div class="ix-hs-idle"><div class="ix-hs-body">' +
        '<div class="ix-hs-logo"><img src="/Assets/Grx/ideaxcorp_logo_dark.webp" width="798" height="374" alt="Ideaxcorp"></div>' +
        '<img class="ix-hs-mascot" src="/Assets/Grx/sage_lift.webp" width="311" height="468" alt="">' +
      '</div></div></div></div></div>'
    document.body.appendChild(stage)
    started = false
    cur = 0
    lastW = 0
    if (reduced) { stage.classList.add('ready'); return }
    // hidden until the intro screen is gone
    q('.ix-hs-enter').style.opacity = 0
    q('.ix-hs-logo').style.opacity = 0
    // frame() starts it once the intro has fully gone (_introOn turns false only after its reveal,
    // while "introOver" fires mid-reveal); hidden meanwhile so nothing shows over the intro
    stage.style.visibility = 'hidden'
    setTimeout(play, 12000) // fallback if the intro never reports finishing
  }

  function q(sel) { return stage.querySelector(sel) }

  function play() {
    if (!stage || started) return
    started = true
    stage.style.visibility = stage._p >= 1 ? 'hidden' : ''
    var enter = q('.ix-hs-enter'), logo = q('.ix-hs-logo'), mh = q('.ix-hs-rig').offsetHeight
    var settle = 'cubic-bezier(.22, 1, .36, 1)'
    enter.style.opacity = logo.style.opacity = ''

    // the mascot rises into place, arms up
    anims.push(enter.animate([
      { transform: 'translateY(' + (mh * .18).toFixed(0) + 'px)', opacity: 0 },
      { transform: 'translateY(0px)', opacity: 1 }
    ], { duration: 1100, easing: settle, fill: 'both' }))
    // the logo comes down into its hands, with a soft give in the arms as it lands
    anims.push(logo.animate([
      { transform: 'translateY(' + (-mh * .3).toFixed(0) + 'px) rotate(-6deg)', opacity: 0 },
      { transform: 'translateY(' + (-mh * .1).toFixed(0) + 'px) rotate(-2deg)', opacity: 1, offset: .45 },
      { transform: 'translateY(' + (mh * .025).toFixed(0) + 'px) rotate(1.5deg)', offset: .78 },
      { transform: 'translateY(0px) rotate(0deg)' }
    ], { duration: 1200, delay: 700, easing: 'cubic-bezier(.45, 0, .2, 1)', fill: 'both' }))
    var catchIt = enter.animate([
      { transform: 'scaleY(1)' }, { transform: 'scaleY(1)', offset: .55 },
      { transform: 'scaleY(.965)', offset: .75 }, { transform: 'scaleY(1)' }
    ], { duration: 1500, delay: 700, easing: 'ease-in-out', composite: 'add' })
    anims.push(catchIt)
    catchIt.onfinish = function () {
      if (!stage) return
      anims.forEach(function (a) { a.cancel() })
      anims = []
      stage.classList.add('ready')
    }
  }

  // someone who scrolls straight away skips to the logo in the hands
  function skip() { anims.slice().forEach(function (a) { a.finish() }) }

  function frame() {
    var home = document.querySelector('.m.showreel')
    if (home && !stage) build()
    else if (!home && stage) { anims.forEach(function (a) { a.cancel() }); anims = []; stage.remove(); stage = null }

    if (stage) {
      var vh = window.innerHeight
      if (!started && !window._introOn && !window._pageTransitioning) play() // after the intro or a page transition
      if (anims.length && window.scrollY > vh * .1) skip()
      var target = Math.min(1, window.scrollY / (vh * .95))
      cur += (target - cur) * (reduced ? 1 : .1) // spring-like follow of the scroll
      if (Math.abs(target - cur) < .0004) cur = target
      if (cur !== stage._p || window.innerWidth !== lastW) {
        stage._p = cur; lastW = window.innerWidth
        var p = cur, e = p * p * (3 - 2 * p), move = reduced ? 0 : 1
        var mh = q('.ix-hs-rig').offsetHeight
        q('.ix-hs-cam').style.translate = '0 ' + (-e * vh * .55 * move).toFixed(1) + 'px'
        q('.ix-hs-cam').style.scale = (1 - .05 * e * move).toFixed(4)
        // the climb: three steps over the hero, each a small lift and lean, and the logo rocks the other way on the palms
        var step = Math.sin(p * Math.PI * 6) * move
        var body = q('.ix-hs-body'), logo = q('.ix-hs-logo')
        body.style.translate = '0 ' + (-Math.abs(step) * mh * .025).toFixed(1) + 'px'
        body.style.rotate = (step * 1.6).toFixed(2) + 'deg'
        logo.style.rotate = (-step * .8).toFixed(2) + 'deg' // small, so its edge stays in the fingers
        logo.style.scale = (1 - .4 * e * move).toFixed(4) // the logo shrinks into the hands on the way up
        var sh = q('.ix-hs-shadow')
        sh.style.scale = (1 - .55 * e).toFixed(3)
        sh.style.opacity = (1 - e).toFixed(3)
        var fade = Math.max(0, Math.min(1, (p - .72) / .28))
        stage.style.opacity = (1 - fade * fade * (3 - 2 * fade)).toFixed(3)
        stage.style.visibility = p >= 1 || !started ? 'hidden' : ''
      }
    }
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
})()
