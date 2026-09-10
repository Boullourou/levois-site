/** Carry only explicit, allowlisted entry context through the first public links. */
const entryParams=new URLSearchParams(location.search);
const rawEntry=(entryParams.get('src')||entryParams.get('utm_source')||'').toLowerCase();
const allowedEntry=new Set(['video','youtube','instagram','tiktok','facebook','google','qr','recommandation','recommendation']);
const entrySource=allowedEntry.has(rawEntry)?rawEntry:location.pathname.replace(/\/$/,'')==='/bienvenue'?'recommandation':null;
if(entrySource)document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach(link=>{
 const url=new URL(link.href,location.origin);
 if(url.origin!==location.origin||!/^\/(?:$|ma-recherche\/?$|situer-ma-vente\/?$|vendre-et-acheter\/?$|votre-rue\/?$|bienvenue\/?$|carte\/?$|experiences\/)/.test(url.pathname)||url.searchParams.has('src'))return;
 url.searchParams.set('src',entrySource);link.href=url.pathname+url.search+url.hash;
});
