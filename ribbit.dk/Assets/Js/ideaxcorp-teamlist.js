// About, "The team" as a masthead (styles in ideaxcorp-teamlist.css): pointing at or focusing a member in the list
// brings their portrait forward on the left (the new one wipes up over the last), with its caption and the count.
// Pages are swapped in without a reload, so it sets itself up on ix:pageadded and once a second, once per list.
;(function () {
  function setup() {
    var box = document.querySelector('.ixtm:not([data-ready])')
    if (!box) return
    box.setAttribute('data-ready', '')
    var rows = Array.prototype.slice.call(box.querySelectorAll('.ixtm-row')), cards = Array.prototype.slice.call(box.querySelectorAll('.ixtm-card'))
    var count = box.querySelector('.ixtm-count b'), cur = 0
    function show(k) {
      if (k === cur) return
      cards.forEach(function (c) { c.classList.remove('was-on') })
      var prev = cards[cur], next = cards[k]
      if (prev) { prev.classList.remove('is-on'); prev.classList.add('was-on') } // (stays under while the next wipes in)
      if (next) next.classList.add('is-on')
      rows.forEach(function (r, i) { r.classList.toggle('is-on', i === k) })
      if (count) count.textContent = ('0' + (k + 1)).slice(-2)
      cur = k
    }
    rows.forEach(function (r, i) {
      r.addEventListener('pointerenter', function () { show(i) })
      r.addEventListener('focus', function () { show(i) })
      r.addEventListener('click', function () { show(i) })
    })
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup); else setup()
  window.addEventListener('ix:pageadded', setup)
  setInterval(setup, 1000)
})()
