// Ideaxcorp contact section: reveal on scroll, form validation, and sending.
// Sending: with a Web3Forms access key on the form (data-key), the message is posted to Web3Forms, which
// emails it to the inbox the key was made for; the visitor gets a thank-you on the page. Without a key it
// falls back to opening the visitor's email app, addressed to data-email. A hidden "botcheck" box catches
// spam bots (people never see or tick it).
;(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  function reveal(s) {
    if (reduced) return
    s.classList.add('armed')
    var d = 0
    Array.prototype.forEach.call(s.querySelectorAll('.ix-contact-left > *, .ix-contact-list > li, .ix-contact-form, .ix-office'), function (el) {
      el.style.setProperty('--d', (d = Math.min(d + 0.06, 0.6)) + 's')
    })
    new IntersectionObserver(function (e, o) {
      if (!e[0].isIntersecting) return
      s.classList.add('in')
      setTimeout(function () { s.classList.add('done') }, 1800)
      o.disconnect()
    }, { rootMargin: '0px 0px -12% 0px' }).observe(s)
  }

  function setError(field, msg) {
    var wrap = field.closest('.ix-field'), err = wrap && wrap.querySelector('.ix-field-error')
    if (!wrap) return // (the hidden spam trap is not a visible field)
    wrap.classList.toggle('invalid', !!msg)
    field.setAttribute('aria-invalid', msg ? 'true' : 'false')
    if (msg && !err) { err = document.createElement('span'); err.className = 'ix-field-error'; err.id = field.id + '-error'; wrap.appendChild(err) }
    if (err) err.textContent = msg || ''
    if (msg) field.setAttribute('aria-describedby', field.id + '-error'); else field.removeAttribute('aria-describedby')
  }
  function check(field) {
    var v = field.value.trim()
    if (field.required && !v) return 'Please fill in this field.'
    if (field.type === 'email' && v && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) return 'Please enter a valid email address.'
    if (field.type === 'tel' && v && !/^\+?[\d\s()-]{7,}$/.test(v)) return 'Please enter a valid phone number.'
    if (field.type === 'url' && v && !/^(https?:\/\/)?[^\s.]+\.[^\s]{2,}$/i.test(v)) return 'Please enter a website address, like yourbusiness.com.'
    return ''
  }

  function setupForm(form) {
    var status = form.querySelector('.ix-contact-status')
    Array.prototype.forEach.call(form.querySelectorAll('input, textarea'), function (f) {
      f.addEventListener('blur', function () { if (f.value) setError(f, check(f)) })
      f.addEventListener('input', function () { var w = f.closest('.ix-field'); if (w && w.classList.contains('invalid')) setError(f, check(f)) })
    })
    form.addEventListener('submit', function (e) {
      e.preventDefault()
      var first = null
      Array.prototype.forEach.call(form.querySelectorAll('input, textarea'), function (f) {
        var msg = check(f); setError(f, msg); if (msg && !first) first = f
      })
      status.className = 'ix-contact-status'
      if (first) { status.textContent = 'Please check the highlighted fields.'; status.classList.add('err'); first.focus(); return }
      var v = function (n) { var el = form.elements[n]; return el ? el.value.trim() : '' }
      var bot = form.elements.botcheck
      if (bot && bot.checked) { done(); return } // a bot ticked the hidden box: quietly drop it
      var extra = [['Website', v('website')], ['Goal', v('goal')], ['Timeline', v('timeline')]].filter(function (p) { return p[1] })
      var key = (form.dataset.key || '').trim()
      if (!key) { // no Web3Forms key yet: the visitor's email app, as before
        var NL = String.fromCharCode(10)
        var body = 'Name: ' + v('name') + NL + 'Phone: ' + v('phone') + NL + 'Email: ' + v('email') + NL + 'Subject: ' + v('subject') +
          extra.map(function (p) { return NL + p[0] + ': ' + p[1] }).join('') + NL + NL + v('message')
        window.location.href = 'mailto:' + form.dataset.email + '?subject=' + encodeURIComponent('[Website] ' + v('subject') + ' – ' + v('name')) + '&body=' + encodeURIComponent(body)
        status.textContent = 'Your email app should now open with your message ready to send. If it doesn’t, email us at ' + form.dataset.email + '.'
        status.classList.add('ok')
        return
      }
      var btn = form.querySelector('[type="submit"]'); btn.disabled = true
      status.textContent = 'Sending…'
      var data = { access_key: key, subject: '[Website] ' + v('subject') + ' – ' + v('name'), from_name: 'Ideaxcorp website',
        name: v('name'), email: v('email'), phone: v('phone'), service: v('subject'), message: v('message'), page: location.pathname }
      extra.forEach(function (p) { data[p[0].toLowerCase()] = p[1] })
      fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) { return r.json() })
        .then(function (r) { if (r && r.success) done(); else fail() })
        .catch(fail)
        .then(function () { btn.disabled = false })
      function done() {
        var who = v('name').split(' ')[0] // (read before the form is cleared)
        form.reset()
        status.className = 'ix-contact-status ok'
        status.textContent = 'Thank you' + (who ? ', ' + who : '') + '! Your message has been sent. We reply within 24 hours.'
        if (window.gtag) window.gtag('event', 'generate_lead', { form: 'contact' }) // (once GA4 is added)
      }
      function fail() {
        status.className = 'ix-contact-status err'
        status.textContent = 'Sorry, the message could not be sent. Please email us at ' + form.dataset.email + ' or WhatsApp ' + (window.ixPhone ? window.ixPhone().display : '') + '.'
      }
    })
  }

  function init() {
    Array.prototype.forEach.call(document.querySelectorAll('.ix-contact'), function (s) {
      if (s.dataset.ready) return
      s.dataset.ready = '1'
      reveal(s)
      if (typeof officeStatus === 'function') officeStatus()
      var form = s.querySelector('.ix-contact-form')
      if (form) setupForm(form)
    })
  }

  // live "Open now / Closed" badge per office, from its own local time (Mon–Sat, 9:00–18:00)
  function officeStatus() {
    Array.prototype.forEach.call(document.querySelectorAll('.ix-office-status[data-tz]'), function (el) {
      try {
        var parts = new Intl.DateTimeFormat('en-GB', { timeZone: el.dataset.tz, weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date())
        var get = function (t) { return (parts.find(function (p) { return p.type === t }) || {}).value }
        var day = get('weekday'), mins = +get('hour') * 60 + +get('minute')
        var open = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(day) >= 0 && mins >= 540 && mins < 1080
        el.textContent = open ? 'Open now' : 'Closed now'
        el.classList.toggle('open', open)
      } catch (e) { el.textContent = '' }
    })
  }
  officeStatus()
  setInterval(officeStatus, 60000)

  // footer clocks beside the site's own Dubai time: India time (any element with .ix-time and data-tz), HH:MM
  function clocks() {
    Array.prototype.forEach.call(document.querySelectorAll('.ix-time[data-tz]'), function (el) {
      try { el.textContent = new Intl.DateTimeFormat('en-GB', { timeZone: el.dataset.tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()) }
      catch (e) { el.textContent = '' }
    })
  }
  clocks()
  setInterval(clocks, 30000)
  window.addEventListener('ix:pageadded', clocks)

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
  else init()
  setInterval(init, 1000) // pages are swapped in without a full reload
  window.addEventListener('ix:pageadded', init) // set up a swapped-in page before it is first drawn
})()
