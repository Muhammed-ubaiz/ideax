// Ideaxcorp contact section: reveal on scroll, form validation, and sending.
// This site has no server, so "Send Message" opens the visitor's email app with the message filled in,
// addressed to the email on the form (data-email). The status line says so.
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
    var wrap = field.closest('.ix-field'), err = wrap.querySelector('.ix-field-error')
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
    return ''
  }

  function setupForm(form) {
    var status = form.querySelector('.ix-contact-status')
    Array.prototype.forEach.call(form.querySelectorAll('input, textarea'), function (f) {
      f.addEventListener('blur', function () { if (f.value) setError(f, check(f)) })
      f.addEventListener('input', function () { if (f.closest('.ix-field').classList.contains('invalid')) setError(f, check(f)) })
    })
    form.addEventListener('submit', function (e) {
      e.preventDefault()
      var first = null
      Array.prototype.forEach.call(form.querySelectorAll('input, textarea'), function (f) {
        var msg = check(f); setError(f, msg); if (msg && !first) first = f
      })
      status.className = 'ix-contact-status'
      if (first) { status.textContent = 'Please check the highlighted fields.'; status.classList.add('err'); first.focus(); return }
      var v = function (n) { return form.elements[n].value.trim() }
      var body = 'Name: ' + v('name') + '\nPhone: ' + v('phone') + '\nEmail: ' + v('email') + '\nSubject: ' + v('subject') + '\n\n' + v('message')
      var href = 'mailto:' + form.dataset.email + '?subject=' + encodeURIComponent('[Website] ' + v('subject') + ' – ' + v('name')) + '&body=' + encodeURIComponent(body)
      window.location.href = href
      status.textContent = 'Your email app should now open with your message ready to send. If it doesn’t, email us at ' + form.dataset.email + '.'
      status.classList.add('ok')
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

  // live "Open now / Closed" badge per office, from its own local time (Mon–Fri, 9:00–18:00)
  function officeStatus() {
    Array.prototype.forEach.call(document.querySelectorAll('.ix-office-status[data-tz]'), function (el) {
      try {
        var parts = new Intl.DateTimeFormat('en-GB', { timeZone: el.dataset.tz, weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date())
        var get = function (t) { return (parts.find(function (p) { return p.type === t }) || {}).value }
        var day = get('weekday'), mins = +get('hour') * 60 + +get('minute')
        var open = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].indexOf(day) >= 0 && mins >= 540 && mins < 1080
        el.textContent = open ? 'Open now' : 'Closed now'
        el.classList.toggle('open', open)
      } catch (e) { el.textContent = '' }
    })
  }
  officeStatus()
  setInterval(officeStatus, 60000)

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
  else init()
  setInterval(init, 1000) // pages are swapped in without a full reload
})()
