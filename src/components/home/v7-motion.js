(() => {
 'use strict';
 const d=document,H=d.documentElement,$=s=>d.querySelector(s);

 // Scroll progress bar & header styling
 const hd=$('#hd'), bar=$('#bar');
 function onScroll() {
   const y = window.scrollY, mx = H.scrollHeight - window.innerHeight;
   if (bar) bar.style.transform = 'scaleX(' + (mx > 0 ? y / mx : 0) + ')';
   if (hd) hd.classList.toggle('s', y > 40);
 }
 window.addEventListener('scroll', onScroll, { passive: true });
 onScroll();

 // Smooth Tabs interaction for "Qu'est-ce qui vous bloque ?"
 const tabs = [...d.querySelectorAll('[role=tab]')];
 const panels = [...d.querySelectorAll('[role=tabpanel]')];
 function setTab(idx, focus=false) {
   tabs.forEach((t, i) => {
     const isSel = i === idx;
     t.setAttribute('aria-selected', String(isSel));
     t.tabIndex = isSel ? 0 : -1;
     if (panels[i]) {
       panels[i].hidden = !isSel;
       panels[i].classList.toggle('in', isSel);
     }
   });
   if (focus && tabs[idx]) tabs[idx].focus();
 }
 tabs.forEach((t, i) => {
   t.onclick = () => setTab(i);
   t.onkeydown = (e) => {
     let next;
     if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = (i + 1) % tabs.length;
     else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
     else if (e.key === 'Home') next = 0;
     else if (e.key === 'End') next = tabs.length - 1;
     if (next !== undefined) {
       e.preventDefault();
       setTab(next, true);
     }
   };
 });
 if (tabs.length > 0) setTab(0);

 // Reveal on scroll for .r elements
 if ('IntersectionObserver' in window) {
   const io = new IntersectionObserver((entries) => {
     entries.forEach(e => {
       if (e.isIntersecting) {
         e.target.classList.add('v');
         io.unobserve(e.target);
       }
     });
   }, { threshold: 0.1 });
   d.querySelectorAll('.r').forEach(el => io.observe(el));
 }

 // Ambient video autoplay handling without scroll-jacking
 const lv = $('#lv');
 if (lv && 'IntersectionObserver' in window) {
   const vio = new IntersectionObserver((entries) => {
     entries.forEach(e => {
       if (e.isIntersecting) {
         if (!lv.src && lv.dataset.src) {
           lv.src = lv.dataset.src;
           lv.load();
         }
         lv.play().catch(() => {});
       } else {
         lv.pause();
       }
     });
   }, { threshold: 0.2 });
   vio.observe(lv);
 }
})();
