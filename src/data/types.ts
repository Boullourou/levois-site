/** Types du moteur de signaux LEVOIS — données séparées de l'interface. */

export type Niveau = 'hypothese' | 'repete' | 'convergents';

export interface SignalWeight {
  signal: string;
  poids: number;
}

export interface AnswerOption {
  value: string;
  label: string;
  signals: SignalWeight[];
  /** Fragment de reformulation — proposition complète insérable dans une phrase. */
  fragment?: string;
  /** Réponse de type « je ne sais pas » : compte pour l'insuffisance de données. */
  inconnue?: boolean;
}

export interface Question {
  id: string;
  label: string;
  aide: string;
  options: AnswerOption[];
}

export interface ResultRule {
  /** Signal principal auquel cette règle répond. */
  gap: string;
  /** Nom humain de la famille d'écart. */
  titre: string;
  definition: string;
  interpretation: string;
  limite: string;
  action: string;
  resourceId: string;
  ctaLabel: string;
}

export interface Situation {
  id: string;
  slug: string;
  ordinal: string;
  titre: string;
  reconnaissance: string;
  imageSlot: string;
  objectif: string;
  questions: Question[];
  regles: ResultRule[];
  /** Résultat affiché quand trop de réponses sont inconnues. */
  donneesInsuffisantes: Omit<ResultRule, 'gap'>;
}

export interface ComputedResult {
  situationId: string;
  reformulation: string;
  niveau: Niveau | 'insuffisant';
  regle: Omit<ResultRule, 'gap'>;
  /** Seconde piste éventuelle en cas de signaux d'égale intensité. */
  secondePiste?: Pick<ResultRule, 'titre' | 'definition'>;
  reponses: { question: string; reponse: string }[];
}
