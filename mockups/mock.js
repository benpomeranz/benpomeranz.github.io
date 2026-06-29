// Shared mockup behavior: the mode toggle, persisted across the mock
// pages via localStorage so the little site keeps one mode as you browse.
(function () {
  function apply(mode) {
    document.body.setAttribute('data-mode', mode);
    var b = document.getElementById('m-brick');
    var a = document.getElementById('m-alpine');
    if (b) b.classList.toggle('active', mode === 'brick');
    if (a) a.classList.toggle('active', mode === 'alpine');
    try { localStorage.setItem('mockMode', mode); } catch (e) {}
  }
  window.setMode = function (mode) { apply(mode); };

  var saved = 'brick';
  try { saved = localStorage.getItem('mockMode') || 'brick'; } catch (e) {}
  apply(saved);
})();
