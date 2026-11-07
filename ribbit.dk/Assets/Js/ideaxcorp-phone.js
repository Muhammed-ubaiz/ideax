// Phone number by visitor country: the one place the site's numbers are set.
//   India  -> +91 9778480362
//   others -> +971 56 744 8005 (UAE; also the fallback when the country can't be found)
// The pages are written with the UAE number. On load this looks up the visitor's country from their IP
// address (no GPS, no permission prompt, never blocks the page), keeps only the 2-letter country code in
// localStorage for 7 days, and, for India, swaps every UAE number on the page: tel: and WhatsApp links,
// the number shown in text, and labels. Links marked data-phone-fixed (each office's own number) are left
// alone. Page swaps (the site loads pages without a reload) are covered through the ix:pageadded event.
// Other scripts read the current number with window.ixPhone().
;(function () {
  var PHONES = {
    AE: { display: '+971 56 744 8005', e164: '+971567448005' },
    IN: { display: '+91 9778480362', e164: '+919778480362' }
  }
  var FALLBACK = 'AE'
  var BY_COUNTRY = { IN: 'IN' } // countries with their own number; everyone else gets the fallback
  var KEY = 'ix-country', TTL = 7 * 24 * 3600 * 1000, FAIL_TTL = 3600 * 1000
  var LOOKUP = 'https://get.geojs.io/v1/ip/country.json' // free, no key, HTTPS, returns {"country":"IN",...}

  var current = FALLBACK
  window.ixPhone = function () { return PHONES[current] }

  // ---------- applying a number to the page ----------
  var base = PHONES[FALLBACK]
  var digits = function (p) { return p.e164.replace('+', '') }
  function apply(root) {
    if (current === FALLBACK) return // the pages are already written with the fallback number
    var to = PHONES[current]
    root = root || document.body
    if (!root) return
    // links
    Array.prototype.forEach.call(root.querySelectorAll('a[href]'), function (a) {
      if (a.hasAttribute('data-phone-fixed')) return
      var h = a.getAttribute('href'), n = h
      if (/^tel:/i.test(h)) n = h.replace(base.e164, to.e164)
      else if (/wa\.me\/|api\.whatsapp\.com/i.test(h)) n = h.split(digits(base)).join(digits(to))
      if (n !== h) a.setAttribute('href', n)
      var l = a.getAttribute('aria-label')
      if (l && l.indexOf(base.display) >= 0) a.setAttribute('aria-label', l.split(base.display).join(to.display))
    })
    // the number shown in text (not in scripts, not inside a fixed office number)
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (t) {
        if (t.nodeValue.indexOf(base.display) < 0) return NodeFilter.FILTER_SKIP
        var p = t.parentNode
        if (!p || /^(SCRIPT|STYLE|NOSCRIPT)$/.test(p.nodeName) || (p.closest && p.closest('[data-phone-fixed]'))) return NodeFilter.FILTER_SKIP
        return NodeFilter.FILTER_ACCEPT
      }
    })
    var list = [], t
    while ((t = walker.nextNode())) list.push(t)
    list.forEach(function (t) { t.nodeValue = t.nodeValue.split(base.display).join(to.display) })
  }
  window.ixPhoneApply = apply

  function setCountry(cc) {
    var pick = BY_COUNTRY[cc] || FALLBACK
    if (pick === current) return
    current = pick
    if (document.body) apply(document.body)
    document.documentElement.setAttribute('data-phone', current.toLowerCase())
    window.dispatchEvent(new Event('ix:phone'))
  }

  // ---------- finding the country ----------
  function read() {
    try { var v = JSON.parse(localStorage.getItem(KEY) || 'null'); return v && Date.now() - v.t < (v.c ? TTL : FAIL_TTL) ? v : null } catch (e) { return null }
  }
  function save(c) { try { localStorage.setItem(KEY, JSON.stringify({ c: c || '', t: Date.now() })) } catch (e) {} }
  function lookup() {
    var done = false, ctl = window.AbortController ? new AbortController() : null
    var timer = setTimeout(function () { if (ctl) ctl.abort(); if (!done) { done = true; save('') } }, 4000) // no answer: fallback
    fetch(LOOKUP, { cache: 'no-store', credentials: 'omit', signal: ctl ? ctl.signal : undefined })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json() })
      .then(function (d) {
        if (done) return; done = true; clearTimeout(timer)
        var cc = d && typeof d.country === 'string' && /^[A-Z]{2}$/.test(d.country) ? d.country : ''
        save(cc); setCountry(cc)
      })
      .catch(function () { if (!done) { done = true; clearTimeout(timer); save('') } }) // fallback number stays
  }
  function start() {
    var cached = read()
    if (cached) setCountry(cached.c)
    else if (window.fetch) lookup()
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start()
  // pages swapped in later get the same number
  window.addEventListener('ix:pageadded', function () { setTimeout(function () { apply(document.body) }, 0) })
})()
