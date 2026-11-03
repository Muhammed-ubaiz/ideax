// About, Services, Portfolio and Blog pages: scroll reveals, headline word animation, category filters,
// project detail dialog and in-page anchors. The site's router swaps page content in without a reload,
// so everything is set up by scanning the page again (on pageChange and on a timer) or by delegated events.
document.documentElement.classList.add('ixp-js')

;(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return
      e.target.classList.add('is-in')
      io.unobserve(e.target)
    })
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }) : null

  // wrap every word of a headline in .w > span so the words can rise in one after another
  function splitWords(el) {
    var i = 0
    ;(function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 1) { if (n.tagName !== 'BR') walk(n); return }
        if (n.nodeType !== 3 || !n.textContent.trim()) return
        var frag = document.createDocumentFragment()
        n.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return }
          var w = document.createElement('span'), s = document.createElement('span')
          w.className = 'w'; s.textContent = part; s.style.setProperty('--i', i++)
          w.appendChild(s); frag.appendChild(w)
        })
        n.parentNode.replaceChild(frag, n)
      })
    })(el)
  }

  function scan() {
    var items = document.querySelectorAll('[data-reveal]:not([data-ixp]), .ixp-steps li:not([data-ixp]), .ixp-h1[data-split]:not([data-ixp])')
    Array.prototype.forEach.call(items, function (el) {
      el.setAttribute('data-ixp', '')
      if (el.hasAttribute('data-split')) splitWords(el)
      if (!io || reduce) { el.classList.add('is-in'); return }
      io.observe(el)
    })
    // children of a [data-stagger] list reveal one after another
    Array.prototype.forEach.call(document.querySelectorAll('[data-stagger]:not([data-ixp-st])'), function (list) {
      list.setAttribute('data-ixp-st', '')
      var step = parseFloat(list.getAttribute('data-stagger')) || 0.08
      Array.prototype.forEach.call(list.children, function (c, n) { c.style.setProperty('--d', (n % 4) * step + 's') })
    })
    openFromHash()
  }

  // ---------- category filters ----------
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('.ixp-filter')
    if (!btn) return
    var scope = btn.closest('[data-filter-scope]')
    if (!scope) return
    var value = btn.getAttribute('data-value')
    Array.prototype.forEach.call(scope.querySelectorAll('.ixp-filter'), function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false') })
    var shown = 0
    Array.prototype.forEach.call(scope.querySelectorAll('[data-cat]'), function (item) {
      var match = value === 'all' || (' ' + item.getAttribute('data-cat') + ' ').indexOf(' ' + value + ' ') !== -1
      item.classList.toggle('is-hidden', !match)
      item.classList.remove('ixp-filter-anim')
      if (match) {
        shown++
        item.classList.add('is-in') // skip the scroll reveal for cards brought back by a filter
        void item.offsetWidth
        if (!reduce) { item.style.animationDelay = Math.min(shown - 1, 8) * 50 + 'ms'; item.classList.add('ixp-filter-anim') }
      }
    })
    scope.classList.toggle('is-empty', shown === 0)
    var status = scope.querySelector('.ixp-filter-status')
    if (status) status.textContent = shown + (shown === 1 ? ' item' : ' items') + ' shown'
  })

  // ---------- project detail dialog ----------
  var dialog, lastTrigger
  function getDialog() {
    if (dialog && document.body.contains(dialog)) return dialog
    dialog = document.createElement('dialog')
    dialog.className = 'ixp-dialog'
    dialog.setAttribute('aria-labelledby', 'ixp-dialog-title')
    dialog.addEventListener('click', function (e) {
      if (e.target === dialog || (e.target.closest && e.target.closest('.ixp-dialog-close'))) dialog.close()
    })
    dialog.addEventListener('close', function () {
      document.documentElement.classList.remove('ixp-locked')
      if (location.hash.indexOf('#project-') === 0) history.replaceState(history.state, '', location.pathname + location.search)
      if (lastTrigger && document.body.contains(lastTrigger)) lastTrigger.focus()
    })
    document.body.appendChild(dialog)
    return dialog
  }
  function openProject(id, trigger) {
    var tpl = document.getElementById('detail-' + id)
    if (!tpl || !tpl.content) return false
    var d = getDialog()
    lastTrigger = trigger || null
    d.innerHTML = '<button type="button" class="ixp-dialog-close" aria-label="Close project details">&times;</button>'
    d.appendChild(tpl.content.cloneNode(true))
    if (typeof d.showModal === 'function') { if (!d.open) d.showModal() } else d.setAttribute('open', '')
    document.documentElement.classList.add('ixp-locked')
    history.replaceState(history.state, '', location.pathname + location.search + '#project-' + id)
    var scroller = d.querySelector('.ixp-dialog-body'); if (scroller) scroller.scrollTop = 0
    d.querySelector('.ixp-dialog-close').focus() // the site's own script would otherwise keep focus on the page
    return true
  }
  var hashDone = ''
  function openFromHash() {
    var h = location.hash
    if (h.indexOf('#project-') !== 0 || h === hashDone) return
    if (openProject(h.slice(9))) hashDone = h
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-project]')
    if (!t) return
    e.preventDefault()
    openProject(t.getAttribute('data-project'), t)
  })

  // ---------- in-page anchors ----------
  // capture phase on window: runs before the site's router, which would treat "#id" as a new page
  window.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]')
    if (!a || a.getAttribute('href').length < 2) return
    var target = document.getElementById(a.getAttribute('href').slice(1))
    if (!target) return
    e.preventDefault(); e.stopPropagation()
    var y = target.getBoundingClientRect().top + window.pageYOffset - 30
    window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' })
  }, true)

  window.addEventListener('pageChange', function () { hashDone = ''; setTimeout(scan, 60) })
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan)
  else scan()
  setInterval(scan, 800) // pages are swapped in without a reload
  window.addEventListener('ix:pageadded', scan) // arm a swapped-in page's reveals before it is first drawn
})()
