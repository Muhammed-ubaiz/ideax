// Navbar: shrinks into the eyes pill once the page is scrolled, opens again on hover (mouse) or
// tap (touch), and the eyes blink now and then. Styling in styles.css (.site-header).
;(function () {
  var menu = document.querySelector('.site-header .menu')
  if (!menu) return
  var nav = menu.querySelector('nav'), eyes = menu.querySelector('.menu-eyes')
  var touch = matchMedia('(hover: none)').matches

  function onScroll() {
    var down = scrollY > 20
    menu.classList.toggle('collapsed', down)
    if (!down) menu.classList.remove('open')
  }
  addEventListener('scroll', onScroll, { passive: true })
  onScroll()

  if (!touch) {
    menu.addEventListener('mouseenter', function () { menu.classList.add('open') })
    menu.addEventListener('mouseleave', function () { menu.classList.remove('open') })
  }
  // collapsed pill: first tap opens it, links work once it is open
  nav.addEventListener('click', function (e) {
    if (menu.classList.contains('collapsed') && !menu.classList.contains('open')) { e.preventDefault(); menu.classList.add('open') }
  })
  document.addEventListener('click', function (e) { if (!menu.contains(e.target)) menu.classList.remove('open') })

  ;(function blink() {
    setTimeout(function () {
      eyes.classList.add('blink')
      setTimeout(function () { eyes.classList.remove('blink'); blink() }, 200)
    }, 3000 + Math.random() * 5000)
  })()
})()
