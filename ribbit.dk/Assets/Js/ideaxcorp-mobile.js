// Phones and tablets: on the home page the hero logo sits in the middle of the first screen and
// hides once the hero is scrolled past (it would sit on top of the content); the footer characters
// play as they scroll into view, the way they pop out on hover on desktop. Styling in ideaxcorp-mobile.css.
;(function () {
  var touch = window.matchMedia('(hover: none)').matches

  function onScroll() {
    document.body.classList.toggle('ix-past-hero', window.scrollY > window.innerHeight * 0.7)
  }
  window.addEventListener('scroll', onScroll, { passive: true })

  // home on a phone: the desktop showreel logo is hidden (CSS) and a big logo fills the middle of the
  // first screen instead; scrolling lifts it at a third of the page's speed while it shrinks and fades.
  // Then each title line rises and fades in as it comes up the screen, and eases out at the top.
  var phone = window.matchMedia('(max-width: 767.5px)')
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  var hero = null, lastY = -1, lastW = 0
  function ease(t) { t = Math.max(0, Math.min(1, t)); return 1 - Math.pow(1 - t, 3) }
  ;(function frame() {
    var home = phone.matches && document.querySelector('.m.showreel')
    if (home && !hero) {
      hero = document.createElement('div')
      hero.className = 'ix-mhero'
      hero.setAttribute('aria-hidden', 'true')
      hero.innerHTML = '<img src="/Assets/Grx/ideaxcorp_logo_dark.webp" width="798" height="374" alt="">'
      document.body.appendChild(hero)
      lastY = -1
    } else if (!home && hero) {
      hero.remove(); hero = null
      Array.prototype.forEach.call(document.querySelectorAll('.m.push-titles .line'), function (l) { l.style.translate = l.style.scale = l.style.opacity = '' })
    }
    var y = window.scrollY, vh = window.innerHeight
    if (hero && (y !== lastY || window.innerWidth !== lastW)) {
      lastY = y; lastW = window.innerWidth
      var p = Math.min(1, y / (vh * 0.7))
      hero.style.translate = '0 ' + (-y * (reduced ? 0 : 0.35)).toFixed(1) + 'px'
      hero.style.scale = (1 - 0.18 * ease(p)).toFixed(3)
      hero.style.opacity = (1 - ease(p)).toFixed(3)
      hero.style.visibility = p >= 1 ? 'hidden' : ''
      if (!reduced) Array.prototype.forEach.call(document.querySelectorAll('.m.push-titles .line'), function (l, i) {
        var r = l.getBoundingClientRect(), mid = r.top + r.height / 2
        var inn = ease((vh - r.top) / (vh * 0.4))     // 0 as its top meets the bottom edge, 1 once 40% up the screen
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
