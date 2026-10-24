(() => {
  'use strict';
  const d = document, H = d.documentElement;

  // Header scroll appearance
  const hd = d.querySelector('#hd');
  const bar = d.querySelector('#bar');

  function onScroll() {
    const y = window.scrollY, mx = H.scrollHeight - window.innerHeight;
    if (bar) bar.style.transform = 'scaleX(' + (mx > 0 ? y / mx : 0) + ')';
    if (hd) {
      if (y > 30) {
        hd.classList.add('scrolled');
        hd.style.background = 'rgba(19, 42, 34, 0.92)';
        hd.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.2)';
      } else {
        hd.classList.remove('scrolled');
        hd.style.background = 'rgba(19, 42, 34, 0.75)';
        hd.style.boxShadow = 'none';
      }
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Autoplay hero video smoothly
  const heroVid = d.querySelector('#hero-vid');
  if (heroVid) {
    heroVid.play().catch(() => {});
  }
})();