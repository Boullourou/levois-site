(() => {
 'use strict';
 const d=document,H=d.documentElement,$=s=>d.querySelector(s);

 // Scroll progress bar
 const bar=$('#bar');
 function onScroll() {
   const y = window.scrollY, mx = H.scrollHeight - window.innerHeight;
   if (bar) bar.style.transform = 'scaleX(' + (mx > 0 ? y / mx : 0) + ')';
 }
 window.addEventListener('scroll', onScroll, { passive: true });
 onScroll();

 // Autoplay hero video
 const vid = $('#hp-vid');
 if (vid) {
   vid.play().catch(() => {});
 }
})();