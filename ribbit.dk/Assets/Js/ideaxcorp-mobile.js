// Phones and tablets: hide the home page's corner logo once the hero is scrolled past (it would sit
// on top of the content), and play the footer characters as they scroll into view, the way they
// pop out on hover on desktop. Styling in ideaxcorp-mobile.css.
;(function () {
  var touch = window.matchMedia('(hover: none)').matches

  function onScroll() {
    document.body.classList.toggle('ix-past-hero', window.scrollY > window.innerHeight * 0.45)
  }
  window.addEventListener('scroll', onScroll, { passive: true })

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
