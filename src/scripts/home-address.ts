const form=document.querySelector<HTMLFormElement>('[data-world-address]');
if(form){
const input=form.querySelector<HTMLInputElement>('#home-adresse')!,list=document.getElementById('home-address-list')!,status=document.getElementById('home-address-status')!;
type Feature={properties:{label:string;city?:string;postcode?:string;citycode?:string},geometry:{coordinates:number[]}};
let features:Feature[]=[],selected:Feature|null=null,active=-1,timer:number|undefined,request:AbortController|null=null;
const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
function close(){list.hidden=true;input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');active=-1;}
// Real links are the default. Enhance only the local-sales door into an in-place step.
const projects=document.getElementById('home-projects'),place=document.getElementById('home-place'),explore=document.getElementById('home-explore');
if(projects&&place&&explore){
  const trigger=document.createElement('button');
  trigger.type='button';trigger.id=explore.id;
  // Preserve Astro's scoped-style attributes when upgrading the fallback link.
  for(const attr of explore.attributes)if(attr.name.startsWith('data-astro-'))trigger.setAttribute(attr.name,attr.value);
  trigger.append(...explore.childNodes);trigger.setAttribute('aria-controls','home-place');trigger.setAttribute('aria-expanded','false');explore.replaceWith(trigger);
  function showPlace(show:boolean){
    projects!.hidden=show;place!.hidden=!show;trigger.setAttribute('aria-expanded',String(show));
    if(show)input.focus({preventScroll:true});
    else{clearTimeout(timer);request?.abort();close();status.hidden=true;trigger.focus({preventScroll:true});}
  }
  trigger.addEventListener('click',()=>showPlace(true));
  document.getElementById('home-project-back')?.addEventListener('click',()=>showPlace(false));
  place.addEventListener('keydown',e=>{if(e.key==='Escape'&&list.hidden){e.preventDefault();showPlace(false);}});
}
function submitSelected(){if(!selected)return;const url=new URL('/votre-rue',location.origin);url.searchParams.set('q',selected.properties.label);url.searchParams.set('confirmee','1');url.searchParams.set('src',form!.querySelector<HTMLInputElement>('[name=src]')?.value||'accueil');location.assign(url.pathname+url.search);}
function choose(i:number){if(!features[i])return;selected=features[i];input.value=selected.properties.label;close();submitSelected();}
async function suggest(){
request?.abort();request=new AbortController();const q=input.value.trim();if(q.length<3){close();return}
status.textContent='Recherche de votre adresse…';status.hidden=false;
try{const url=new URL('https://data.geopf.fr/geocodage/search');url.searchParams.set('q',q);url.searchParams.set('limit','6');url.searchParams.set('lat','48.46');url.searchParams.set('lon','1.49');url.searchParams.set('autocomplete','1');const response=await fetch(url,{signal:request.signal});if(!response.ok)throw new Error();const data=await response.json();if(input.value.trim()!==q)return;features=(Array.isArray(data.features)?data.features:[]).filter((f:Feature)=>String(f.properties?.citycode||'').startsWith('28'));
if(!features.length){close();status.textContent='Aucune adresse trouvée en Eure-et-Loir. Précisez la rue et la commune.';return;}
list.innerHTML=features.map((f,i)=>'<li role="option" id="home-suggestion-'+i+'" aria-selected="false" data-index="'+i+'"><strong>'+esc(f.properties.label)+'</strong><small>'+esc([f.properties.postcode,f.properties.city].filter(Boolean).join(' '))+'</small></li>').join('');list.hidden=false;input.setAttribute('aria-expanded','true');active=-1;status.textContent='Choisissez l’adresse à explorer.';
}catch(e){if((e as Error).name==='AbortError')return;close();status.textContent='La recherche est momentanément indisponible. Réessayez ou ouvrez les ventes locales.';}
}
input.addEventListener('input',()=>{selected=null;clearTimeout(timer);if(input.value.trim().length<3){request?.abort();close();status.hidden=true;return;}timer=window.setTimeout(suggest,240)});
input.addEventListener('keydown',e=>{if(list.hidden)return;if(e.key==='ArrowDown'){e.preventDefault();active=Math.min(features.length-1,active+1)}else if(e.key==='ArrowUp'){e.preventDefault();active=Math.max(0,active-1)}else if(e.key==='Enter'&&active>=0){e.preventDefault();choose(active);return;}else if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();return;}else return;list.querySelectorAll<HTMLElement>('[role=option]').forEach((el,i)=>el.setAttribute('aria-selected',String(i===active)));const item=document.getElementById('home-suggestion-'+active);if(item){input.setAttribute('aria-activedescendant',item.id);item.scrollIntoView({block:'nearest'});}});
list.addEventListener('click',e=>{const item=(e.target as HTMLElement).closest<HTMLElement>('[data-index]');if(item)choose(Number(item.dataset.index))});
document.addEventListener('click',e=>{if(!form!.contains(e.target as Node))close()});
form.addEventListener('submit',e=>{e.preventDefault();if(selected)submitSelected();else{clearTimeout(timer);suggest();input.focus();}});
}
