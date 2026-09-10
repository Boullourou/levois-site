const directions = ['ligne-claire', 'plan-vivant', 'a-portee'];
const frames = [...document.querySelectorAll('iframe')];
const notes = {
  accueil: 'Commencez par les trois accès projet, puis ouvrez les repères locaux séparément.',
  visites: 'Choisissez « Je n’ai pas de retour précis », puis corrigez. La conséquence doit changer sans attente ni coordonnées.',
  recherche: 'Passez du calme aux proches. Le critère mis en évidence change ; aucune autre priorité n’est éliminée.',
  lecture: 'Corrigez votre priorité, gardez la lecture, puis comparez copie, relecture écrite et échange. Aucun envoi ne sera effectué.',
};
let currentScreen = 'accueil';
document.querySelector('[data-id="ligne-claire"]').classList.add('is-selected');
function reportSize() {
  const frame = frames.find(f => f.clientWidth > 0);
  if (frame) document.getElementById('size-label').textContent = frame.clientWidth + ' × 844';
}
const sizesObserver = new ResizeObserver(reportSize);
frames.forEach(f => sizesObserver.observe(f));
function chooseScreen(screen) {
  currentScreen = screen;
  document.querySelectorAll('.screens button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.screen === screen)));
  document.getElementById('try-note').textContent = notes[screen];
  frames.forEach(f => f.contentWindow.postMessage({ type: 'levois-navigate', screen }, location.origin));
  document.querySelectorAll('.open-direction').forEach(a => { const u = new URL(a.href); u.searchParams.set('screen', screen); a.href = u; });
}
document.querySelectorAll('.screens button').forEach(b => b.addEventListener('click', () => chooseScreen(b.dataset.screen)));
document.querySelectorAll('[data-size]').forEach(b => b.addEventListener('click', () => {
  document.documentElement.style.setProperty('--frame', b.dataset.size + 'px');
  document.querySelectorAll('[data-size]').forEach(button => button.setAttribute('aria-pressed', String(button === b)));
  document.getElementById('size-label').textContent = b.dataset.size + ' × 844';
}));
document.querySelectorAll('[data-direction]').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('[data-direction]').forEach(button => button.setAttribute('aria-pressed', String(button === b)));
  document.querySelectorAll('.direction').forEach(card => card.classList.toggle('is-selected', card.dataset.id === b.dataset.direction));
}));
document.getElementById('reset').addEventListener('click', () => {
  directions.forEach(d => { try { sessionStorage.removeItem('levois-da-v1/' + d); } catch {} });
  frames.forEach((f, i) => { f.src = directions[i] + '/?screen=' + currentScreen; });
});
window.addEventListener('message', event => {
  if (event.origin !== location.origin || event.data?.type !== 'levois-screen') return;
  const { direction, screen } = event.data;
  if (!directions.includes(direction)) return;
  const link = document.querySelector(`[data-id="${direction}"] .open-direction`);
  const u = new URL(link.href); u.searchParams.set('screen', screen); link.href = u;
});
