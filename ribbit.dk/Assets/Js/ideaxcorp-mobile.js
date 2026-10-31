// Phones and tablets: on the home page the hero logo sits in the middle of the first screen and
// hides once the hero is scrolled past (it would sit on top of the content); the footer characters
// play as they scroll into view, the way they pop out on hover on desktop. Styling in ideaxcorp-mobile.css.
;(function () {
  var touch = window.matchMedia('(hover: none)').matches

  function onScroll() {
    document.body.classList.toggle('ix-past-hero', window.scrollY > window.innerHeight * 0.7)
  }
  window.addEventListener('scroll', onScroll, { passive: true })

  // home on a phone: the hero logo (fixed, normally at the top) sits in the middle of the first
  // screen and rises with the page as you scroll, like the desktop's full-screen logo
  var phone = window.matchMedia('(max-width: 767.5px)')
  ;(function centre() {
    var reel = document.querySelector('.m.showreel'), loop = reel && reel.querySelector('.loop')
    if (reel && loop) {
      if (phone.matches) {
        var applied = parseFloat(reel.style.translate.split(' ')[1]) || 0
        var r = loop.getBoundingClientRect()
        var lift = window.innerHeight * 0.46 - (r.top - applied + r.height / 2) // gap to the middle
        reel.style.translate = '0 ' + Math.max(0, lift - window.scrollY).toFixed(1) + 'px'
      } else if (reel.style.translate) reel.style.translate = ''
    }
    requestAnimationFrame(centre)
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
