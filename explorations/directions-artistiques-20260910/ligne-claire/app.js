import { boot, C, icon } from '../shared/experience.js';

const esc = (text) => String(text ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
const arrow = () => icon('arrow');
const route = (screen, label, className = '', extra = '') => `<button type="button" class="${className}" data-action="navigate" data-screen="${screen}" ${extra}>${label}</button>`;
const action = (name, label, className = 'btn-primary', glyph = 'arrow') => `<button type="button" data-action="${name}" class="${className}"><span>${esc(label)}</span>${icon(glyph)}</button>`;
const ordinal = (number) => `<span class="ordinal" aria-hidden="true">${String(number).padStart(2, '0')}</span>`;

function masthead(state) {
  return `<header class="masthead">
    ${route('accueil', '<img src="/brand/levois-horizontal.svg" alt="LEVOIS — accueil" width="117" height="36">', 'brand')}
    ${state.screen === 'accueil'
      ? `<nav class="top-nav" aria-label="Choisir mon projet">${C.home.projects.map(p => route(p.screen, esc(p.label))).join('')}</nav>`
      : route('accueil', `${icon('back')}<span>Accueil</span>`, 'masthead-back')}
  </header>`;
}

function colophon() {
  return `<footer class="colophon"><p>Cas d’étude illustratif · aucune donnée transmise.</p>${action('reset', 'Recommencer cet exemple', '', 'back')}</footer>`;
}

function home() {
  const title = esc(C.home.title).replace('Des choix plus clairs.', '<em>Des choix plus clairs.</em>');
  return `<div class="spread home-spread">
    <div><h1 class="home-title">${title}</h1><p class="intro">${esc(C.home.intro)}</p></div>
    <div class="home-choices"><nav aria-label="Partir de ma situation">${C.home.projects.map((p,i) => route(p.screen, `${ordinal(i+1)}<span class="row-title">${esc(p.label)}</span>${arrow()}`, 'project-row')).join('')}</nav>
      ${route('local', `<span>${esc(C.home.local)}</span>${arrow()}`, 'local-link')}
    </div>
  </div>`;
}

function choices(items, value, name) {
  return items.map(item => `<button type="button" class="response" data-action="${name}" data-value="${item.id}" aria-pressed="${item.id === value}"><span class="radio" aria-hidden="true"></span><span class="response-label">${esc(item.label)}</span></button>`).join('');
}

function visits(state) {
  const result = C.visitResult(state.visit);
  return `<article class="spread visit-spread">
    <div class="article-intro"><h1>${esc(C.visit.title)}</h1><p class="lead">${esc(C.visit.insight)}</p></div>
    <div class="reading-field"><h2 class="visit-question" id="visit-question">${esc(C.visit.question)}</h2>
      <div class="response-list" role="group" aria-labelledby="visit-question">${choices(C.visit.options, state.visit, 'visit')}</div>
      ${result ? `<section class="visit-impact" id="impact" tabindex="-1" aria-label="Ce que votre réponse change"><div class="annotation"><h2>${esc(result.title)}</h2><p>${esc(result.answer)}</p><p>${esc(result.consequence)}</p></div><p class="limits">${esc(C.visit.limit)}</p>${action('question', C.visit.next)}</section>`
        : `<p class="initial-note">${esc(C.visit.limit)}</p>`}
    </div>
  </article>`;
}

function specimen(example, priority) {
  const relevant = priority.id === 'calme' ? 'work' : priority.id === 'recevoir' ? 'living' : 'outside';
  return `<section class="specimen" aria-label="${esc(example.name)} fictif"><h3 class="specimen-letter"><span class="sr-only">Logement </span>${example.id}</h3><p class="specimen-size">${example.area} m²</p>
    <ul class="specimen-details">${['work','living','outside'].map(key => `<li class="${key === relevant ? 'examined' : ''}"><span>${esc(example[key])}</span></li>`).join('')}</ul>
  </section>`;
}

function buyer(state) {
  const p = C.priorities.find(item => item.id === state.priority) || C.priorities[0];
  const title = esc(C.buyer.title).replace('rendre possible', '<em>rendre possible</em>');
  return `<article class="spread search-spread">
    <div class="article-intro"><h1>${title}</h1><p class="intro">${esc(C.buyer.intro)}</p>
      <div class="response-list" role="group" aria-label="Votre priorité pour cette comparaison">${choices(C.priorities, p.id, 'priority')}</div>
      <div class="signature">${action('focus-impact', C.buyer.signature)}</div>
      <p class="limits">${esc(C.buyer.selectionHint)}</p>
    </div>
    <section class="reading-field" id="impact" tabindex="-1" aria-label="Ce que cette réponse change">
      <p class="comparison-label">Deux logements fictifs</p><div class="comparison">${C.examples.map(item => specimen(item,p)).join('')}</div>
      <div class="annotation"><h2>${esc(p.consequence)}</h2><p>${esc(p.why)}</p></div>
      <p class="limits">${esc(C.buyer.limit)}</p>
      <div class="next-priority">${action('confirm', 'Garder cette priorité')}</div>
    </section>
  </article>`;
}

function readingSection(section, index) {
  return `<section class="reading-section" aria-labelledby="reading-${section.id}">${ordinal(index+1)}<div><h2 id="reading-${section.id}">${esc(section.title)}</h2><p>${esc(section.text)}</p></div></section>`;
}

function reading(state) {
  const r = C.reading(state);
  const title = esc(r.title).replace('un peu plus clair.', '<em>un peu plus clair.</em>');
  return `<article class="reading-page">
    <header class="reading-head"><h1>${title}</h1><div class="reading-aside"><p>${esc(r.priority.label)}</p>${state.revision > 0 ? '<p class="revision-note">Votre lecture a suivi votre choix.</p>' : ''}${action('correct', 'Modifier ma réponse', 'text-action', 'edit')}</div></header>
    <div class="reading-body"><div class="reading-sections">${r.sections.slice(0,4).map(readingSection).join('')}</div>
      <div class="reading-next">${readingSection(r.sections[4], 4)}
        <div class="human"><figure><img src="/images/levois-mouaad.webp" alt="Portrait de Mouaad Boullourou" width="84" height="106"><figcaption class="human-caption">Mouaad Boullourou</figcaption></figure><div><h3>Un regard humain,<br>pour aller plus loin.</h3><p class="credential">Mouaad Boullourou<br>Conseiller immobilier SAFTI</p><p>Relire les points ouverts, rapprocher votre projet du terrain et distinguer ce qui demande une vérification.</p></div></div>
        <div class="reading-actions" aria-label="Choisir librement la suite">${action('save', 'Garder cette lecture', 'btn-primary', 'download')}${action('copy', 'M’envoyer cette synthèse sans appel', 'action-row')}${action('reread', 'Demander à Mouaad de relire', 'action-row')}${action('exchange', 'Échanger avec Mouaad', 'action-row')}</div>
      </div>
    </div>
  </article>`;
}

function local() {
  return `<article class="brief"><h1>${esc(C.local.title)}</h1><p class="lead">${esc(C.local.intro)}</p><div class="brief-lines">${C.local.points.map((text,i) => `<div class="brief-line">${ordinal(i+1)}<p>${esc(text)}</p></div>`).join('')}</div><div class="annotation"><p class="annotation-name">Un repère éclaire une question. Il ne remplace pas le contexte.</p></div>${route('accueil', `<span>Revenir à ma situation</span>${arrow()}`, 'btn-primary')}</article>`;
}

function transition() {
  return `<article class="brief"><h1>${esc(C.transition.title)}</h1><p class="lead">${esc(C.transition.intro)}</p><div class="annotation"><h2>Deux projets, une dépendance à éclairer.</h2><p>${esc(C.transition.consequence)}</p></div><p class="limits">${esc(C.transition.limit)}</p><div class="brief-lines"><div class="brief-line">${ordinal(1)}<div><strong>Ce que la vente rend possible</strong><p>Le produit de la vente et le moment où il pourrait être disponible restent à vérifier.</p></div></div><div class="brief-line">${ordinal(2)}<div><strong>Ce que l’achat demande</strong><p>Le calendrier et la période entre deux logements doivent être regardés ensemble.</p></div></div></div>${route('recherche', `<span>Préciser mon prochain logement</span>${arrow()}`, 'btn-primary')}${route('accueil', `${icon('back')}<span>Revenir à ma situation</span>`, 'text-action')}</article>`;
}

const pages = { accueil:home, visites:visits, recherche:buyer, lecture:reading, transition, local };
boot({ direction:'ligne-claire', render:state => `<div class="shell">${masthead(state)}${(pages[state.screen] || home)(state)}${colophon()}</div>` });
