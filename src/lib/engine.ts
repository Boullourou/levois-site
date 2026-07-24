import type { ComputedResult, Niveau, ResultRule, Situation } from '../data/types';

/**
 * Moteur de décision LEVOIS — déterministe et transparent.
 *
 * 1. agrège les signaux pondérés portés par chaque réponse ;
 * 2. identifie le signal principal (et une seconde piste en cas d'égalité) ;
 * 3. calcule un niveau qualitatif selon le nombre de questions convergentes ;
 * 4. assemble la reformulation à partir des fragments choisis ;
 * 5. sélectionne interprétation, limite, action, ressource et CTA.
 *
 * Aucun score chiffré n'est exposé. Aucune conclusion n'est inventée :
 * si les données sont insuffisantes, le résultat le dit.
 */

export interface AnswerMap {
  [questionId: string]: string;
}

interface SignalScore {
  signal: string;
  poids: number;
  /** Nombre de questions distinctes ayant contribué. */
  contributions: number;
}

export function computeResult(situation: Situation, answers: AnswerMap): ComputedResult {
  const scores = new Map<string, SignalScore>();
  const fragments: string[] = [];
  const reponses: { question: string; reponse: string }[] = [];
  let inconnues = 0;
  let repondues = 0;

  for (const question of situation.questions) {
    const value = answers[question.id];
    if (!value) continue;
    const option = question.options.find((o) => o.value === value);
    if (!option) continue;
    repondues++;
    reponses.push({ question: question.label, reponse: option.label });
    if (option.fragment) fragments.push(option.fragment);
    if (option.inconnue) inconnues++;
    for (const { signal, poids } of option.signals) {
      const cur = scores.get(signal) ?? { signal, poids: 0, contributions: 0 };
      cur.poids += poids;
      cur.contributions += 1;
      scores.set(signal, cur);
    }
  }

  const reformulation = assembleReformulation(fragments);

  // Données insuffisantes : la moitié ou plus des réponses sont « je ne sais pas »,
  // ou aucun signal n'a été alimenté.
  if (repondues === 0 || inconnues >= Math.ceil(repondues / 2) || scores.size === 0) {
    return {
      situationId: situation.id,
      reformulation,
      niveau: 'insuffisant',
      regle: situation.donneesInsuffisantes,
      reponses,
    };
  }

  const ranked = [...scores.values()].sort(
    (a, b) => b.poids - a.poids || b.contributions - a.contributions
  );
  const principal = ranked[0];
  const second = ranked[1];

  const regle = findRule(situation, principal.signal);

  // Niveau qualitatif : nombre de questions distinctes qui convergent.
  let niveau: Niveau;
  if (principal.contributions >= 3) niveau = 'convergents';
  else if (principal.contributions === 2) niveau = 'repete';
  else niveau = 'hypothese';

  // Égalité stricte de poids ET de contributions → deux pistes à distinguer.
  let secondePiste: ComputedResult['secondePiste'];
  if (
    second &&
    second.signal !== principal.signal &&
    second.poids === principal.poids &&
    second.contributions === principal.contributions
  ) {
    const r2 = findRule(situation, second.signal);
    if (r2 && r2.titre !== regle.titre) {
      secondePiste = { titre: r2.titre, definition: r2.definition };
      // Deux pistes d'égale intensité : on reste prudent sur le niveau.
      if (niveau === 'convergents') niveau = 'repete';
    }
  }

  return {
    situationId: situation.id,
    reformulation,
    niveau,
    regle,
    secondePiste,
    reponses,
  };
}

function findRule(situation: Situation, signal: string): ResultRule {
  const rule = situation.regles.find((r) => r.gap === signal);
  // Un signal sans règle propre (signal transverse peu alimenté) retombe
  // sur la règle la plus proche : la première règle de la situation sert
  // de lecture par défaut, jamais de conclusion inventée.
  return rule ?? { gap: signal, ...situation.donneesInsuffisantes };
}

/** Assemble les fragments en deux à trois phrases lisibles. */
function assembleReformulation(fragments: string[]): string {
  const parts = fragments.filter(Boolean);
  if (parts.length === 0) return '';
  const sentences: string[] = [];
  for (let i = 0; i < parts.length; i += 2) {
    sentences.push(parts.slice(i, i + 2).join(' et '));
  }
  return sentences
    .map((s, i) => (i === 0 ? `Vous avez indiqué que ${s}.` : `${capitalize(s)}.`))
    .join(' ');
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export const NIVEAU_LABELS: Record<string, { label: string; explication: string }> = {
  hypothese: {
    label: 'Hypothèse à vérifier',
    explication:
      'Une seule de vos réponses pointe dans cette direction. C’est une piste de lecture, pas une conclusion — elle demande à être confrontée aux faits.',
  },
  repete: {
    label: 'Signal qui se répète',
    explication:
      'Plusieurs de vos réponses vont dans la même direction, mais une vérification concrète reste nécessaire avant d’en tirer une décision.',
  },
  convergents: {
    label: 'Signaux convergents',
    explication:
      'Vos réponses convergent nettement vers cette lecture. Elle reste une lecture — la vérification sur pièces demeure indispensable avant d’agir.',
  },
  insuffisant: {
    label: 'Données insuffisantes',
    explication:
      'Vos réponses ne permettent pas d’identifier un écart avec sérieux. LEVOIS préfère vous le dire que de conclure dans le vide.',
  },
};
