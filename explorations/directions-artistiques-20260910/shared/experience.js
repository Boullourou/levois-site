// Socle de preuve seulement. Aucun import ni appel au site de production.
export const C = {
  home: {
    title: 'Un projet immobilier. Des choix plus clairs.',
    intro: 'Partir de votre situation, comprendre vos options, décider de la suite.',
    projects: [
      { id: 'acheter', label: 'Acheter', text: 'Trouver ce qui compte vraiment dans votre prochain lieu de vie.', screen: 'recherche' },
      { id: 'vendre', label: 'Vendre', text: 'Comprendre votre situation avant de choisir la prochaine action.', screen: 'visites' },
      { id: 'transition', label: 'Vendre et acheter', text: 'Mettre les deux projets dans le bon ordre.', screen: 'transition' },
    ],
    local: 'Explorer les repères locaux',
  },
  visit: {
    title: 'Des visites, mais aucune offre ?',
    insight: 'Une visite sans offre ne suffit pas à expliquer ce qui freine la vente.',
    question: 'Qu’est-ce qui revient après les visites ?',
    options: [
      { id: 'commun', label: 'Le même point revient' },
      { id: 'divers', label: 'Les retours sont différents' },
      { id: 'inconnu', label: 'Je n’ai pas de retour précis' },
    ],
    limit: 'Ces retours ne suffisent pas à conclure sur le prix ou sur la qualité du bien.',
    next: 'Préparer la prochaine question',
  },
  priorities: [
    {
      id: 'calme', label: 'Travailler au calme', short: 'Le calme pour travailler',
      consequence: 'Une pièce qui ferme compte davantage que des mètres carrés en plus.',
      criterion: 'Un espace qui s’isole', candidate: 'A',
      why: 'A possède une pièce indépendante. B est plus grand, mais son bureau se trouve dans le séjour.',
      conditional: 'Une surface plus petite pourrait convenir si le travail peut réellement s’isoler. Ce compromis reste à confirmer avec vous.',
      verify: 'L’isolation sonore, le budget complet et les temps de trajet. Le type de bien reste ouvert.',
      next: 'Vérifier si la pièce peut vraiment s’isoler, puis replacer ce besoin dans votre enveloppe complète.',
      understood: 'Votre prochain logement doit permettre de travailler sans occuper la pièce de vie.',
      solid: 'Le calme pour travailler est votre priorité dans cette comparaison. Les autres usages ne sont pas abandonnés.',
    },
    {
      id: 'recevoir', label: 'Recevoir mes proches', short: 'Une place pour les proches',
      consequence: 'La façon de se retrouver compte davantage que la surface totale.',
      criterion: 'Une pièce de vie adaptée', candidate: 'B',
      why: 'B possède un séjour ouvert. A réserve davantage de place à une pièce indépendante. La capacité d’accueil reste à observer.',
      conditional: 'Une pièce séparée pourrait compter moins si le séjour permet de recevoir comme vous le souhaitez. Rien n’est encore écarté.',
      verify: 'La circulation autour de la table, les possibilités de couchage, le budget complet et les temps de trajet.',
      next: 'Décrire un moment où vous recevez, puis vérifier que l’agencement peut l’accueillir.',
      understood: 'Votre prochain logement doit laisser une vraie place aux moments avec vos proches.',
      solid: 'Recevoir vos proches est votre priorité dans cette comparaison. Le calme et le dehors ne sont pas exclus.',
    },
    {
      id: 'dehors', label: 'Profiter du dehors', short: 'Du dehors au quotidien',
      consequence: 'L’usage de l’extérieur compte davantage que sa seule présence dans l’annonce.',
      criterion: 'Un extérieur réellement utilisable', candidate: 'A',
      why: 'A propose un jardin de 35 m² ; B un balcon de 6 m². Ces surfaces ne disent pas encore comment vous pourrez en profiter.',
      conditional: 'Un petit extérieur pourrait suffire s’il correspond à vos usages. Ce compromis reste à discuter, pas à déduire.',
      verify: 'L’accès, l’exposition, le vis-à-vis, l’entretien, le budget complet et les temps de trajet.',
      next: 'Préciser ce que vous voulez faire dehors, puis vérifier les conditions réelles d’usage.',
      understood: 'Votre prochain logement doit vous permettre de profiter régulièrement d’un espace extérieur.',
      solid: 'Le dehors est votre priorité dans cette comparaison. Les autres usages restent ouverts.',
    },
  ],
  examples: [
    { id: 'A', name: 'Logement A', area: 92, work: 'Pièce indépendante', living: 'Séjour compact', outside: 'Jardin · 35 m²', outsideArea: 35 },
    { id: 'B', name: 'Logement B', area: 105, work: 'Bureau dans le séjour', living: 'Séjour ouvert', outside: 'Balcon · 6 m²', outsideArea: 6 },
  ],
  buyer: {
    title: 'Qu’est-ce que votre prochain logement doit rendre possible ?',
    intro: 'Partons de votre quotidien, avant de choisir un type de bien.',
    signature: 'Voir ce que cette réponse change',
    limit: 'Deux logements fictifs pour comparer un usage. Budget, localisation, nuisances et disponibilité inconnus.',
    selectionHint: 'Une priorité pour cette comparaison. Rien d’autre n’est écarté.',
  },
  local: {
    title: 'Un repère local, pas encore une conclusion.',
    intro: 'Une vente enregistrée éclaire un marché passé. Elle ne dit ni ce qui est disponible, ni ce que vaut votre logement.',
    points: ['Regarder le périmètre et la période.', 'Distinguer la surface du bien et ses conditions réelles.', 'Garder visible le nombre de ventes observées.'],
  },
  transition: {
    title: 'Vendre et acheter : qu’est-ce qui dépend de quoi ?',
    intro: 'Le point de départ est de comprendre ce que la vente doit rendre possible pour l’achat.',
    consequence: 'Si l’achat dépend du produit de la vente, l’ordre des étapes et la période entre les deux deviennent des décisions à préparer.',
    limit: 'Aucun financement relais, délai de vente ou relogement n’est présumé possible.',
  },
};

C.visitResult = (value) => ({
  commun: {
    title: 'Un frein à examiner.',
    answer: 'Le même point revient dans plusieurs retours.',
    consequence: 'Distinguez ce qui peut être précisé, changé, ou doit être accepté comme une limite du bien.',
    question: '« Qu’est-ce que ce point change concrètement pour votre projet ? »',
  },
  divers: {
    title: 'Des raisons à distinguer.',
    answer: 'Les visiteurs n’expriment pas tous le même frein.',
    consequence: 'Séparez les raisons liées à leur projet de celles liées au logement. Leur fréquence seule ne permet pas de trancher.',
    question: '« Est-ce le logement qui ne convient pas, ou une condition de votre projet qui reste ouverte ? »',
  },
  inconnu: {
    title: 'Un retour concret à construire.',
    answer: 'Vous n’avez pas encore de retour assez précis.',
    consequence: 'Avant de modifier la présentation ou le prix, cherchez ce qui a empêché la personne de se projeter.',
    question: '« Qu’est-ce qui vous a manqué pour envisager la suite ? »',
  },
}[value] || null);

C.reading = (state) => {
  const p = C.priorities.find(p => p.id === state.priority) || C.priorities[0];
  return {
    title: 'Votre projet, un peu plus clair.', priority: p, understood: p.understood,
    solid: p.solid, conditional: p.conditional, verify: p.verify, next: p.next,
    sections: [
      { id: 'compris', title: 'Ce qui est compris', text: p.understood },
      { id: 'solide', title: 'Ce qui paraît solide', text: p.solid },
      { id: 'condition', title: 'Ce qui peut évoluer', text: p.conditional },
      { id: 'verifier', title: 'Ce qui reste à vérifier', text: p.verify },
      { id: 'decision', title: 'La prochaine décision utile', text: p.next },
    ],
  };
};

export function icon(name = 'arrow', size = 22) {
  const paths = {
    arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
    back: '<path d="M19 12H5m6 6-6-6 6-6"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    download: '<path d="M12 3v12m-5-5 5 5 5-5M5 16v5h14v-5"/>',
    edit: '<path d="m15 4 5 5M4 20l5-1L20 8a2.1 2.1 0 0 0-5-5L4 14z"/>',
    location: '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/>',
  };
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.arrow}</svg>`;
}

const screens = new Set(['accueil', 'visites', 'recherche', 'lecture', 'local', 'transition']);
const defaults = () => ({ screen: 'accueil', priority: 'calme', visit: '', confirmed: false, revision: 0 });
const safeRead = (key) => { try { return JSON.parse(sessionStorage.getItem(key) || 'null'); } catch { return null; } };

export function boot({ direction, render }) {
  history.scrollRestoration = 'manual';
  const root = document.getElementById('app');
  const key = `levois-da-v1/${direction}`;
  const saved = safeRead(key);
  let state = { ...defaults(), ...(saved || {}) };
  if (!C.priorities.some(p => p.id === state.priority)) state.priority = 'calme';
  if (!C.visit.options.some(o => o.id === state.visit)) state.visit = '';
  if (!screens.has(state.screen)) state.screen = 'accueil';
  const requested = new URL(location.href).searchParams.get('screen');
  if (screens.has(requested)) state.screen = requested;

  const status = document.createElement('div');
  status.className = 'experience-status'; status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
  document.body.append(status);
  let statusTimer;
  function announce(text) { status.textContent = text; status.classList.add('is-visible'); clearTimeout(statusTimer); statusTimer = setTimeout(() => status.classList.remove('is-visible'), 5000); }
  function persist() { try { sessionStorage.setItem(key, JSON.stringify(state)); } catch { /* Le prototype fonctionne aussi sans stockage. */ } }
  function signal() { if (parent !== window) parent.postMessage({ type: 'levois-screen', direction, screen: state.screen }, location.origin); }
  function draw({ preserve = false, focus = false } = {}) {
    const y = scrollY;
    const active = document.activeElement;
    const remembered = active?.dataset.action ? { action: active.dataset.action, value: active.dataset.value } : null;
    root.innerHTML = render(state, C);
    document.documentElement.dataset.screen = state.screen;
    persist(); signal();
    if (preserve) {
      window.scrollTo(0, y);
      if (remembered) [...root.querySelectorAll('[data-action]')].find(el => el.dataset.action === remembered.action && el.dataset.value === remembered.value)?.focus({ preventScroll: true });
    } else {
      window.scrollTo(0, 0);
      if (focus) { const h = root.querySelector('h1'); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); } }
    }
  }
  function navigate(screen, push = true, focus = true) {
    if (!screens.has(screen)) return;
    state.screen = screen;
    if (push) { const u = new URL(location.href); u.searchParams.set('screen', screen); history.pushState({}, '', u); }
    draw({ focus });
  }
  function pulse() {
    const target = document.getElementById('impact'); if (!target) return;
    target.focus({ preventScroll: true });
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ block: 'center', behavior: reduce ? 'instant' : 'smooth' });
    target.classList.remove('impact-pulse'); void target.offsetWidth; target.classList.add('impact-pulse');
    target.addEventListener('animationend', () => target.classList.remove('impact-pulse'), { once: true });
  }
  function exportReading() {
    const reading = C.reading(state);
    const content = ['LEVOIS — Lecture illustrative', 'Exploration artistique locale — aucun dossier transmis.', '', ...reading.sections.flatMap(s => [s.title, s.text, '']), 'Cette lecture aide à préparer une décision ; elle ne valide ni un budget ni un bien.', 'Mouaad peut relire les points ouverts par écrit si vous le demandez.'].join('\r\n');
    const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = 'LEVOIS-ma-lecture-exemple.txt'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    announce('Votre lecture a été préparée dans un fichier. Aucun contact n’a été créé.');
  }

  let dialog, returnFocus;
  function openDialog(kind) {
    returnFocus = document.activeElement;
    dialog?.remove();
    const reading = C.reading(state);
    const result = C.visitResult(state.visit || 'inconnu');
    const config = {
      copy: { title: 'M’envoyer cette synthèse sans appel', intro: 'Une copie de votre lecture, sans demande d’appel et sans autorisation de relance.', content: `<div class="dialog-reading"><h3>Votre priorité</h3><p>${reading.priority.label}</p><h3>Le point encore ouvert</h3><p>${reading.verify}</p></div>`, cta: 'Prévisualiser ma copie' },
      reread: { title: 'Demander à Mouaad de relire', intro: 'Une relecture humaine écrite, ciblée sur les points ouverts de votre lecture. Elle reste distincte d’un échange direct.', content: `<div class="dialog-reading"><h3>À soumettre à la relecture</h3><p>${reading.verify}</p><label for="open-point">Un point à préciser (facultatif)</label><textarea id="open-point" rows="3" maxlength="700" placeholder="Votre question, en quelques mots"></textarea></div><p>Aucun appel automatique et aucun délai chiffré promis.</p>`, cta: 'Prévisualiser ma demande de relecture' },
      exchange: { title: 'Échanger avec Mouaad', intro: 'Un échange direct pour examiner ce qui demande une connaissance du terrain ou une décision à plusieurs.', content: `<div class="dialog-reading"><h3>Pour préparer cet échange</h3><p>${reading.next}</p><p>Le mode et le moment de l’échange seraient convenus avec vous.</p></div>`, cta: 'Prévisualiser ma demande d’échange' },
      question: { title: 'Une question pour la prochaine visite', intro: result.question, content: `<p>Notez la réponse avec ses mots, puis distinguez le fait observé, l’interprétation et le point encore ouvert.</p><div class="dialog-reading"><h3>La limite à garder en tête</h3><p>${C.visit.limit}</p></div>`, cta: '' },
    }[kind];
    if (!config) return;
    dialog = document.createElement('dialog'); dialog.className = 'experience-dialog';
    dialog.setAttribute('aria-labelledby', 'dialog-title');
    dialog.innerHTML = `<div class="dialog-inner"><button class="dialog-close" aria-label="Fermer">${icon('close')}</button><p class="dialog-demo">Exploration locale · aucun envoi activé</p><h2 id="dialog-title">${config.title}</h2><p class="dialog-intro">${config.intro}</p>${config.content}${config.cta ? `<button class="dialog-submit">${config.cta}${icon()}</button>` : ''}<p class="dialog-feedback" role="status"></p><button class="dialog-return">Revenir à ma lecture</button></div>`;
    document.body.append(dialog); document.body.style.overflow = 'hidden';
    const close = () => dialog.close();
    dialog.querySelector('.dialog-close').addEventListener('click', close);
    dialog.querySelector('.dialog-return').addEventListener('click', close);
    dialog.querySelector('.dialog-submit')?.addEventListener('click', () => {
      dialog.querySelector('.dialog-feedback').textContent = kind === 'copy'
        ? 'Aperçu prêt. Dans cette exploration, aucun e-mail n’est envoyé et aucune coordonnée n’est demandée.'
        : 'Aperçu prêt. Aucune demande n’a été transmise à Mouaad. Ce prototype conserve uniquement les réponses anonymes dans la session.';
      dialog.querySelector('.dialog-feedback').scrollIntoView({ block: 'nearest' });
    });
    dialog.addEventListener('click', event => { if (event.target === dialog) { const b = dialog.getBoundingClientRect(); if (event.clientX < b.left || event.clientX > b.right || event.clientY < b.top || event.clientY > b.bottom) close(); } });
    dialog.addEventListener('close', () => { document.body.style.overflow = ''; dialog.remove(); returnFocus?.focus({ preventScroll: true }); });
    dialog.showModal();
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('[data-action]'); if (!button) return;
    const { action, value, screen } = button.dataset;
    if (action === 'navigate') { event.preventDefault(); navigate(screen); }
    if (action === 'priority' && C.priorities.some(p => p.id === value)) {
      const changed = state.priority !== value; state.priority = value; state.confirmed = false;
      if (changed) state.revision += 1;
      draw({ preserve: true });
      announce('Conséquence actualisée : ' + C.priorities.find(p => p.id === value).consequence);
    }
    if (action === 'visit' && C.visit.options.some(o => o.id === value)) {
      state.visit = value; draw({ preserve: true }); announce(C.visitResult(value).title);
    }
    if (action === 'focus-impact') pulse();
    if (action === 'confirm') { state.confirmed = true; navigate('lecture'); }
    if (action === 'correct') navigate('recherche');
    if (action === 'save') exportReading();
    if (['copy', 'reread', 'exchange', 'question'].includes(action)) openDialog(action);
    if (action === 'reset') { state = defaults(); navigate('accueil'); announce('L’exemple a été réinitialisé.'); }
  });
  window.addEventListener('popstate', () => { const screen = new URL(location.href).searchParams.get('screen') || 'accueil'; navigate(screen, false); });
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== parent) return;
    if (event.data?.type === 'levois-navigate') navigate(event.data.screen, true, false);
  });
  draw();
}
