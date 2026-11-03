// Phones and tablets: on the home page the title lines reveal on scroll (the hero itself is
// ideaxcorp-hero.js); the footer characters
// play as they scroll into view, the way they pop out on hover on desktop. Styling in ideaxcorp-mobile.css.
;(function () {
  var touch = window.matchMedia('(hover: none)').matches

  function onScroll() {
    document.body.classList.toggle('ix-past-hero', window.scrollY > window.innerHeight * 0.7)
  }
  window.addEventListener('scroll', onScroll, { passive: true })

  // home on a phone: after the mascot hero (ideaxcorp-hero.js), each title line rises and fades in as it
  // comes up the screen, and eases out at the top
  var phone = window.matchMedia('(max-width: 767.5px)')
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  var on = false, lastY = -1, lastW = 0
  function ease(t) { t = Math.max(0, Math.min(1, t)); return 1 - Math.pow(1 - t, 3) }
  ;(function frame() {
    var home = phone.matches && !reduced && !!document.querySelector('.m.showreel')
    if (on && !home) Array.prototype.forEach.call(document.querySelectorAll('.m.push-titles .line'), function (l) { l.style.translate = l.style.scale = l.style.opacity = '' })
    if (home && !on) lastY = -1
    on = home
    var y = window.scrollY, vh = window.innerHeight
    if (on && (y !== lastY || window.innerWidth !== lastW)) {
      lastY = y; lastW = window.innerWidth
      Array.prototype.forEach.call(document.querySelectorAll('.m.push-titles .line'), function (l) {
        var r = l.getBoundingClientRect(), mid = r.top + r.height / 2
        var inn = ease((vh - r.top) / (vh * 0.3))     // 0 as its top meets the bottom edge, 1 once 30% up the screen
        var out = ease((vh * 0.18 - mid) / (vh * 0.25)) // fades once its middle passes 18% from the top
        var shown = inn * (1 - out)
        l.style.opacity = shown.toFixed(3)
        l.style.translate = '0 ' + ((1 - inn) * 70 - out * 40).toFixed(1) + 'px'
        l.style.scale = (0.88 + 0.12 * shown).toFixed(3)
      })
    }
    requestAnimationFrame(frame)
  })()

  // the site's FooterFigure listens for mouseenter/mouseleave: send those as each figure comes into view
  function initFooter() {
    if (!touch) return
    var figs = document.querySelectorAll('footer .figures .f')
    Array.prototype.forEach.call(figs, function (f) {
      if (f.dataset.ixScroll) return
      f.dataset.ixScroll = '1'
      new IntersectionObserver(function (e) {
        f.dispatchEvent(new Event(e[0].isIntersecting ? 'mouseenter' : 'mouseleave'))
      }, { threshold: 0.6 }).observe(f)
    })
  }

  function init() { onScroll(); initFooter() }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
  else init()
  setInterval(init, 1000) // the site swaps page content without a full reload
})()
