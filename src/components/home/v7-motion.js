(() => {
 'use strict';
 const d=document,H=d.documentElement,$=s=>d.querySelector(s);
 if(!('IntersectionObserver' in window))return;
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),lerp=(a,b,t)=>a+(b-a)*t;
 const reduced=matchMedia('(prefers-reduced-motion:reduce)');
 const mb=$('#mo'),lv=$('#lv'),vb=$('#vb'),lo=$('#quartier'),vw=$('#vw'),lt=$('#lt'),hp=$('#hp'),hd=$('#hd'),bar=$('#bar');
 let mo=reduced.matches,paused=false,vis=false,loaded=false,tk=0,explicitPlay=false;
 const canPlay=()=>vis&&!paused&&!mo&&!d.hidden&&(!navigator.connection?.saveData||explicitPlay);
 function vid(){
   if(canPlay()){
     if(!loaded){lv.src=lv.dataset.src;lv.load();loaded=true;}
     lv.play().catch(()=>{vb.textContent='Lire la vidéo';});
   }else lv.pause();
 }
 function up(){
   tk=0;const y=scrollY,mx=H.scrollHeight-innerHeight;
   bar.style.transform='scaleX('+(mx>0?y/mx:0)+')';hd.classList.toggle('s',y>40);
   hp.style.setProperty('--y',mo?'0px':Math.min(y,innerHeight*1.2)*.12+'px');
   const r=lo.getBoundingClientRect(),p=clamp(-r.top/Math.max(1,r.height-innerHeight),0,1);
   const e=clamp(p*1.7,0,1),k=1-Math.pow(1-e,3);
   vw.style.setProperty('--h',lerp(58,100,k)+'svh');
   vw.style.setProperty('--r',lerp(999,0,k)+'px');
   lt.style.setProperty('--o',mo?1:clamp((p-.25)*4,0,1));
   lt.inert=!mo&&p<.26;
 }
 function setMo(value){
   const wasLocal=lo.getBoundingClientRect().top<innerHeight&&lo.getBoundingClientRect().bottom>0;
   mo=value;H.classList.toggle('mo',value);mb.setAttribute('aria-pressed',String(value));
   mb.textContent=value?'Activer les animations':'Réduire les animations';
   if(wasLocal)lo.scrollIntoView({behavior:'instant',block:'start'});
   up();vid();
 }
 mb.onclick=()=>setMo(!mo);reduced.addEventListener('change',e=>setMo(e.matches));
 const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('v');io.unobserve(e.target)}}),{threshold:.12});
 d.querySelectorAll('.r').forEach(e=>io.observe(e));
 const tabs=[...d.querySelectorAll('[role=tab]')],panels=[...d.querySelectorAll('[role=tabpanel]')];
 function act(i,focus=false){
   tabs.forEach((t,n)=>{t.setAttribute('aria-selected',String(n===i));t.tabIndex=n===i?0:-1;panels[n].hidden=n!==i;panels[n].classList.remove('in')});
   void panels[i].offsetWidth;panels[i].classList.add('in');if(focus)tabs[i].focus();
 }
 tabs.forEach((t,i)=>{
   t.onclick=()=>act(i);
   t.onkeydown=e=>{let n;const delta={ArrowDown:1,ArrowRight:1,ArrowUp:-1,ArrowLeft:-1}[e.key];
     if(delta)n=(i+delta+tabs.length)%tabs.length;
     if(e.key==='Home')n=0;if(e.key==='End')n=tabs.length-1;
     if(n!==undefined){e.preventDefault();act(n,true);}
   };
 });act(0);
 vb.hidden=false;
 lv.addEventListener('play',()=>{vb.textContent='Pause vidéo';vb.setAttribute('aria-label','Mettre la vidéo en pause')});
 lv.addEventListener('pause',()=>{vb.textContent='Lire la vidéo';vb.setAttribute('aria-label','Lire la vidéo')});
 vb.onclick=()=>{
   if(lv.paused){paused=false;explicitPlay=true;if(mo)setMo(false);}
   else paused=true;
   vid();
 };
 new IntersectionObserver(es=>{vis=es[0].isIntersecting;vid()},{threshold:.15}).observe($('#st'));
 d.addEventListener('visibilitychange',vid);
 addEventListener('scroll',()=>{if(!tk)tk=requestAnimationFrame(up)},{passive:true});
 addEventListener('resize',up);
 const mcta=$('#mcta');let inHero=true,inContact=false;
 function contact(){const show=!inHero&&!inContact;mcta.classList.toggle('v',show);mcta.inert=!show;}
 new IntersectionObserver(es=>{inHero=es[0].isIntersecting;contact()},{rootMargin:'-70% 0px 0px 0px'}).observe($('#haut'));
 new IntersectionObserver(es=>{inContact=es[0].isIntersecting;contact()}).observe($('#mouaad'));
 if(matchMedia('(hover:hover) and (pointer:fine)').matches)d.querySelectorAll('.pill,.call').forEach(b=>{
   b.onmousemove=e=>{if(mo)return;const r=b.getBoundingClientRect();b.style.transform='translate('+((e.clientX-r.left-r.width/2)*.18)+'px,'+((e.clientY-r.top-r.height/2)*.28)+'px)'};
   b.onmouseleave=()=>b.style.transform='';
 });
 setMo(mo);up();
})();
