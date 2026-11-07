// Floating contact buttons on every page: WhatsApp (all screens) and a call button (phones only), bottom right.
// Added once to <body>: page swaps replace only the page content, so they stay put.
// Clicks are reported to GA4 as events once gtag is on the page.
;(function () {
  var PHONE = '+971567448005' // the number shown across the site (+971 56 744 8005)
  function track(name) { if (window.gtag) window.gtag('event', name, { method: 'floating_button' }) }
  function add() {
    if (document.querySelector('.ix-float')) return
    var wrap = document.createElement('div')
    wrap.className = 'ix-float'
    wrap.innerHTML =
      '<a class="ix-float-btn ix-float-call" href="tel:' + PHONE + '" aria-label="Call Ideaxcorp: +971 56 744 8005">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 10.8a15.2 15.2 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z" fill="currentColor"/></svg>' +
      '</a>' +
      '<a class="ix-float-btn ix-float-wa" href="https://wa.me/' + PHONE.replace('+', '') + '" target="_blank" rel="noopener" aria-label="Chat with Ideaxcorp on WhatsApp">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.15l-.3-.18-3 .78.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.25-.12-1.47-.72-1.7-.8-.23-.09-.4-.13-.56.12-.17.25-.64.8-.79.97-.14.17-.29.19-.54.06a6.7 6.7 0 0 1-3.32-2.9c-.25-.43.25-.4.72-1.34.08-.17.04-.31-.02-.43l-.76-1.83c-.2-.48-.4-.41-.56-.42h-.48a.92.92 0 0 0-.67.31 2.8 2.8 0 0 0-.87 2.08 4.87 4.87 0 0 0 1.02 2.58 11.1 11.1 0 0 0 4.27 3.77c1.6.69 2.22.75 3.02.63.49-.07 1.47-.6 1.68-1.18.2-.58.2-1.08.14-1.18-.06-.1-.22-.17-.47-.29z" fill="currentColor"/></svg>' +
        '<span class="ix-float-label">WhatsApp us</span>' +
      '</a>'
    wrap.querySelector('.ix-float-wa').addEventListener('click', function () { track('whatsapp_click') })
    wrap.querySelector('.ix-float-call').addEventListener('click', function () { track('phone_click') })
    document.body.appendChild(wrap)
  }
  if (document.body) add(); else document.addEventListener('DOMContentLoaded', add)
  // the site's own WhatsApp / phone links (contact cards, footer) are counted too
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]')
    if (!a || a.closest('.ix-float')) return
    var h = a.getAttribute('href')
    if (/wa\.me|whatsapp/i.test(h)) track('whatsapp_click')
    else if (/^tel:/i.test(h)) track('phone_click')
  }, true)
})()
