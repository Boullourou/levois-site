import { boot, C, icon } from '../shared/experience.js';

const nav = (screen, label, classes = '', contents = '') => `<button type="button" class="${classes}" data-action="navigate" data-screen="${screen}">${contents || label}</button>`;
const action = (name, label, classes = '', symbol = '') => `<button type="button" class="${classes}" data-action="${name}"><span>${label}</span>${symbol ? icon(symbol) : ''}</button>`;
const priorityOf = (state) => C.priorities.find(p => p.id === state.priority) || C.priorities[0];

function shell(state, content) {
  return `<div class="proof-bar"><a href="../" aria-label="Revenir au comparateur des trois directions">${icon('back', 15)}<span>Exploration · À portée</span></a><details class="proof-menu"><summary>Les écrans ${icon('plus', 14)}</summary><nav aria-label="Écrans de l’exploration">${[['accueil','Accueil'],['visites','Visites'],['recherche','Recherche'],['lecture','Lecture']].map(([id,label]) => nav(id,label, state.screen === id ? 'current' : '')).join('')}</nav></details></div>
  <div class="site-shell"><header class="site-header">${nav('accueil','LEVOIS','brand','<img src="/brand/levois-monochrome.svg" alt="LEVOIS" width="108" height="34">')}<div class="header-actions">${state.screen !== 'accueil' ? nav('accueil','Revenir aux choix','back-link',`${icon('back',20)}<span>Les choix</span>`) : '<span class="header-local">À hauteur de vie.</span>'}</div></header><main id="main" class="screen screen-${state.screen}">${content}</main><footer class="site-footer"><span>Une exploration, à votre rythme.</span>${action('reset','Recommencer l’exemple','text-link')}</footer></div>`;
}

function home() {
  return `<div class="home-grid"><div class="home-heading"><h1>${C.home.title.replace('immobilier. ', 'immobilier. <span class="home-second-sentence">')}</span></h1><p class="intro">${C.home.intro}</p></div><figure class="neighborhood"><img src="/images/levois-quartier-1672.webp" alt="Illustration d’un quartier miniature : maisons de pierre, arbres et jardins." width="1672" height="941" fetchpriority="high"><figcaption>Quartier illustré · une évocation, pas une carte.</figcaption></figure><div class="home-choices"><nav class="ribbons home-ribbons" aria-label="Votre projet">${C.home.projects.map(p => nav(p.screen,p.label,'ribbon',`<span>${p.label}</span>${icon()}`)).join('')}</nav>${nav('local',C.home.local,'local-link',`<span>${C.home.local}</span>${icon('location',20)}`)}</div></div>`;
}

function choices(kind, options, selected) {
  return `<div class="ribbons ${kind}-ribbons" role="group" aria-label="${kind === 'priority' ? 'L’usage à examiner' : 'Les retours après les visites'}">${options.map(o => `<button type="button" class="ribbon ${o.id === selected ? 'selected' : ''}" data-action="${kind}" data-value="${o.id}" aria-pressed="${o.id === selected}"><span>${o.label}</span>${icon(o.id === selected ? 'check' : 'arrow',21)}</button>`).join('')}</div>`;
}

function visits(state) {
  const result = C.visitResult(state.visit);
  return `<div class="work-layout visit-layout"><div class="work-story"><h1>${C.visit.title}</h1><div class="first-value"><p>${C.visit.insight}</p></div><p class="quiet-note">Partir de ce que les visites vous ont réellement appris.</p></div><div class="work-detail"><h2 class="question">${C.visit.question}</h2>${choices('visit',C.visit.options,state.visit)}${result ? `<section class="open-sheet visit-sheet" id="impact" tabindex="-1" aria-labelledby="visit-impact"><span class="fold" aria-hidden="true"></span><p class="sheet-caption">Ce que ce retour change</p><h2 id="visit-impact">${result.title}</h2><p>${result.consequence}</p><div class="limit"><p>${C.visit.limit}</p></div></section>${action('question',C.visit.next,'button-primary','arrow')}` : `<div class="visit-start"><span class="small-line" aria-hidden="true"></span><p>Même sans retour précis, une prochaine question peut se préparer.</p><p class="limit-note">${C.visit.limit}</p></div>`}</div></div>`;
}

function comparison(priority) {
  const rows = [{ key:'area',label:'Surface',format:v=>v+' m²' },{ key:'work',label:'Pour travailler' },{ key:'living',label:'Pièce de vie' },{ key:'outside',label:'Dehors' }];
  const active = { calme:'work',recevoir:'living',dehors:'outside' }[priority.id];
  return `<div class="comparison-wrap"><table class="comparison"><caption>Deux logements fictifs, les mêmes faits.</caption><thead><tr><th scope="col"><span class="sr-only">Ce que l’on compare</span></th>${C.examples.map(e=>`<th scope="col">${e.name}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr class="${row.key===active?'relevant':''}"><th scope="row">${row.label}</th>${C.examples.map(e=>`<td class="${row.key===active && e.id===priority.candidate?'examine':''}">${row.format ? row.format(e[row.key]) : e[row.key]}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

function research(state) {
  const p=priorityOf(state);
  return `<div class="work-layout buyer-layout"><div class="work-story"><h1>${C.buyer.title}</h1><p class="intro">${C.buyer.intro}</p>${choices('priority',C.priorities,state.priority)}<p class="selection-hint">${C.buyer.selectionHint}</p>${action('focus-impact',C.buyer.signature,'button-outline','arrow')}</div><div class="work-detail"><section class="open-sheet buyer-sheet" id="impact" tabindex="-1" aria-labelledby="impact-title"><span class="fold" aria-hidden="true"></span><p class="sheet-caption">${p.criterion}</p><h2 id="impact-title">${p.consequence}</h2>${comparison(p)}<p class="comparison-why">${p.why}</p><p class="reading-rule">Un point à examiner. Aucun choix d’achat déduit.</p></section><p class="evidence-note">${C.buyer.limit}</p>${action('confirm','Garder cette priorité','button-primary','arrow')}</div></div>`;
}

function human() {
  return `<section class="human-handoff" aria-labelledby="human-title"><div class="human-intro"><img src="/images/levois-mouaad.webp" alt="Mouaad Boullourou" width="800" height="1202" loading="lazy"><div><h2 id="human-title">Un regard humain sur ce qui reste ouvert.</h2><p class="human-name">Mouaad Boullourou</p></div></div><p>Relire les points ouverts, rapprocher le projet du terrain, distinguer ce qui demande une vérification.</p><div class="human-actions">${action('reread','Demander à Mouaad de relire','button-outline','arrow')}<p>Une relecture écrite et ciblée, sans appel automatique.</p>${action('exchange','Échanger avec Mouaad','text-link','arrow')}</div></section>`;
}

function reading(state) {
  const r=C.reading(state);
  return `<header class="reading-head"><h1>${r.title}</h1><p>Une lecture à garder, à corriger et à poursuivre à votre rythme.</p></header><div class="reading-layout"><div class="reading-document"><article class="open-sheet reading-sheet" aria-label="Votre lecture illustrative"><span class="fold" aria-hidden="true"></span>${r.sections.map((s,i)=>`<section class="reading-block ${i===4?'next-decision':''}" aria-labelledby="read-${s.id}"><h2 id="read-${s.id}">${s.title}</h2><p>${s.text}</p></section>`).join('')}</article><div class="reading-correction">${action('correct','Corriger cette lecture','text-link','edit')}</div><div class="keep-actions">${action('save','Garder cette lecture','button-primary','download')}${action('copy','M’envoyer cette synthèse sans appel','text-link','arrow')}<p class="evidence-note">Exemple illustratif · sans budget ni bien validé.</p></div></div>${human()}</div>`;
}

function transition() {
  return `<div class="work-layout short-layout"><div class="work-story"><h1>${C.transition.title}</h1><p class="intro">${C.transition.intro}</p></div><div class="work-detail"><div class="connection" aria-hidden="true"><span>Vendre</span><span class="connection-line"></span><span>Acheter</span></div><section class="open-sheet"><span class="fold" aria-hidden="true"></span><h2>L’ordre compte autant que la destination.</h2><p>${C.transition.consequence}</p><div class="limit"><p>${C.transition.limit}</p></div></section><p class="evidence-note">Un aperçu de la transition. Le parcours complet ne fait pas partie de cette exploration.</p>${nav('recherche','Clarifier ce que l’achat doit rendre possible','button-primary',`<span>Clarifier ce que l’achat doit rendre possible</span>${icon()}`)}${nav('accueil','Revenir à ma situation','text-link')}</div></div>`;
}

function local() {
  return `<div class="local-layout"><div class="local-story"><h1>${C.local.title}</h1><p class="intro">${C.local.intro}</p></div><figure class="local-image"><img src="/images/levois-quartier-1672.webp" alt="Un quartier miniature illustré, avec maisons et jardins." width="1672" height="941"><figcaption>Imaginaire habité · aucun lieu ni bien identifié.</figcaption></figure><div class="local-points"><h2>Avant d’interpréter un chiffre.</h2><ol>${C.local.points.map((p,i)=>`<li><span aria-hidden="true">0${i+1}</span><p>${p}</p></li>`).join('')}</ol><p class="evidence-note">Aucun chiffre de marché ni géocodage n’est activé dans cet aperçu.</p>${nav('recherche','Relier le marché à mes usages','button-primary',`<span>Relier le marché à mes usages</span>${icon()}`)}</div></div>`;
}

boot({direction:'a-portee',render:state=>shell(state,({accueil:home,visites:visits,recherche:research,lecture:reading,transition,local}[state.screen]||home)(state))});
