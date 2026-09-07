import {
  CRITERION_LABELS,
  taxonomyLabel,
  type CriterionCertainty,
  type CriterionEventType,
  type CriterionFlexibility,
  type CriterionImportance,
  type CriterionKey,
  type CriterionMatchingRole,
  type InteractionDirection,
  type InteractionType,
  type ProjectStage,
  type ProjectStatus,
  type ProjectType,
  type SearchScenarioType,
  type TaskPriority,
  type TaskState,
} from './taxonomy';

export type ClientMarkdownCoordinateMode = 'with_coordinates' | 'without_coordinates';

export interface ClientExportPerson {
  id: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  usageName?: string;
  email?: string;
  phone?: string;
  origin?: string;
  summary?: string;
  createdAt?: string;
  lastContactAt?: string;
}

export interface ClientExportProject {
  id: string;
  personId: string;
  type: ProjectType;
  status: ProjectStatus;
  stage: ProjectStage;
  objective?: string;
  timeline?: string;
  relatedProjectIds?: string[];
}

export interface ClientExportBuyerSearch {
  id: string;
  projectId: string;
  summary?: string;
}

export interface ClientExportScenario {
  id: string;
  buyerSearchId: string;
  type: SearchScenarioType;
  label: string;
  condition?: string;
}

export interface ClientExportCriterionEvent {
  id: string;
  buyerSearchId: string;
  scenarioId: string;
  eventType: CriterionEventType;
  key: CriterionKey;
  customLabel?: string;
  value: string;
  importance: CriterionImportance;
  flexibility: CriterionFlexibility;
  certainty: CriterionCertainty;
  matchingRole: CriterionMatchingRole;
  source: string;
  effectiveAt: string;
  recordedAt: string;
  supersedesEventId?: string;
  reason?: string;
}

export interface ClientExportInteraction {
  id: string;
  personId: string;
  projectId?: string;
  occurredAt: string;
  type: InteractionType;
  direction: InteractionDirection;
  summary: string;
  outcome?: string;
  promisedAction?: string;
  promisedDueAt?: string;
}

export interface ClientExportTask {
  id: string;
  projectId: string;
  title: string;
  dueAt?: string;
  priority: TaskPriority;
  state: TaskState;
  waitingReason?: string;
  isNextAction?: boolean;
}

export interface ClientExportDecision {
  id: string;
  projectId: string;
  effectiveAt: string;
  summary: string;
  reason?: string;
}

export interface ClientExportLearning {
  id: string;
  personId?: string;
  projectId?: string;
  summary: string;
  status?: string;
}

export interface ClientMarkdownExportInput {
  generatedAt: string;
  coordinateMode: ClientMarkdownCoordinateMode;
  person: ClientExportPerson;
  projects: ClientExportProject[];
  buyerSearches?: ClientExportBuyerSearch[];
  scenarios?: ClientExportScenario[];
  criterionEvents?: ClientExportCriterionEvent[];
  interactions?: ClientExportInteraction[];
  tasks?: ClientExportTask[];
  decisions?: ClientExportDecision[];
  learnings?: ClientExportLearning[];
}

export interface ClientMarkdownExport {
  content: string;
  filename: string;
  mediaType: 'text/markdown;charset=utf-8';
}

const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const STABLE_ID = /^[A-Za-z0-9](?:[A-Za-z0-9._:-]{0,126}[A-Za-z0-9])?$/;

const normalizePlainText = (value: string): string =>
  value
    .replace(/\r\n?/g, '\n')
    .replace(CONTROL_CHARACTERS, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join(' · ')
    .trim();

/** Escapes user-controlled text so Markdown cannot introduce raw HTML or links. */
export const escapeMarkdownText = (value: string): string =>
  normalizePlainText(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/([\\`*_[\]{}#!|~])/g, '\\$1');

const yamlString = (value: string): string => JSON.stringify(
  value.replace(CONTROL_CHARACTERS, '').replace(/\r\n?/g, '\n'),
);

const assertStableId = (value: string, label: string): void => {
  if (!STABLE_ID.test(value)) throw new Error(`${label} has an invalid stable identifier`);
};

const assertDate = (value: string, label: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`${label} has an invalid date`);
  return date.toISOString();
};

const safe = (value: string | undefined, fallback = 'Non renseigné'): string =>
  value && normalizePlainText(value) ? escapeMarkdownText(value) : fallback;

const line = (label: string, value: string | undefined, fallback?: string): string =>
  `- **${label} :** ${safe(value, fallback)}`;

const sortDescending = <T>(items: T[], getDate: (item: T) => string): T[] =>
  [...items].sort((left, right) => Date.parse(getDate(right)) - Date.parse(getDate(left)));

const sectionOrEmpty = (lines: string[], emptyLabel = 'Aucun élément enregistré.'): string[] =>
  lines.length ? lines : [`_${emptyLabel}_`];

const criterionLabel = (event: ClientExportCriterionEvent): string =>
  event.key === 'other' && event.customLabel
    ? event.customLabel
    : CRITERION_LABELS[event.key];

const safeFilenamePart = (value: string): string => {
  const ascii = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return ascii || 'client';
};

/**
 * Builds an ephemeral Markdown file from one explicitly scoped aggregate.
 * Child records carrying another person/project/search identifier are ignored,
 * which provides a second defence against cross-dossier export mistakes.
 */
export const generateClientMarkdown = (input: ClientMarkdownExportInput): ClientMarkdownExport => {
  assertStableId(input.person.id, 'person');
  const generatedAt = assertDate(input.generatedAt, 'generatedAt');

  const projects = input.projects.filter((project) => project.personId === input.person.id);
  projects.forEach((project) => assertStableId(project.id, 'project'));
  const projectIds = new Set(projects.map((project) => project.id));

  const buyerSearches = (input.buyerSearches ?? []).filter((search) => projectIds.has(search.projectId));
  buyerSearches.forEach((search) => assertStableId(search.id, 'buyerSearch'));
  const searchIds = new Set(buyerSearches.map((search) => search.id));

  const scenarios = (input.scenarios ?? []).filter((scenario) => searchIds.has(scenario.buyerSearchId));
  scenarios.forEach((scenario) => assertStableId(scenario.id, 'scenario'));
  const scenarioIds = new Set(scenarios.map((scenario) => scenario.id));

  const criterionEvents = (input.criterionEvents ?? []).filter((event) =>
    searchIds.has(event.buyerSearchId) && scenarioIds.has(event.scenarioId));
  criterionEvents.forEach((event) => assertStableId(event.id, 'criterionEvent'));

  const interactions = (input.interactions ?? []).filter((interaction) =>
    interaction.personId === input.person.id
    && (!interaction.projectId || projectIds.has(interaction.projectId)));
  const tasks = (input.tasks ?? []).filter((task) => projectIds.has(task.projectId));
  const decisions = (input.decisions ?? []).filter((decision) => projectIds.has(decision.projectId));
  const learnings = (input.learnings ?? []).filter((learning) =>
    learning.personId === input.person.id
    || (learning.projectId !== undefined && projectIds.has(learning.projectId)));

  const projectIdLines = projects.map((project) => `  - ${yamlString(project.id)}`);
  const frontMatter = [
    '---',
    'levois_export_version: 1',
    'record_type: "client_dossier"',
    `person_id: ${yamlString(input.person.id)}`,
    `generated_at: ${yamlString(generatedAt)}`,
    `coordinate_mode: ${yamlString(input.coordinateMode)}`,
    ...(projectIdLines.length ? ['project_ids:', ...projectIdLines] : ['project_ids: []']),
    '---',
  ];

  const identity = [
    line('Libellé', input.person.displayName),
    line('Origine', input.person.origin),
    line('Créé le', input.person.createdAt),
    line('Dernier contact', input.person.lastContactAt),
    line('Synthèse', input.person.summary),
  ];

  if (input.coordinateMode === 'with_coordinates') {
    identity.splice(1, 0,
      line('Prénom', input.person.firstName),
      line('Nom', input.person.lastName),
      line('Nom d’usage', input.person.usageName),
      line('Email', input.person.email),
      line('Téléphone', input.person.phone));
  } else {
    identity.push('- **Coordonnées :** exclues de cet export');
  }

  const projectLines = projects.flatMap((project) => [
    `### ${safe(project.objective, taxonomyLabel(project.type))}`,
    `- **Identifiant :** \`${escapeMarkdownText(project.id)}\``,
    line('Type', taxonomyLabel(project.type)),
    line('Statut', taxonomyLabel(project.status)),
    line('Stade', taxonomyLabel(project.stage)),
    line('Calendrier', project.timeline),
    ...(project.relatedProjectIds?.filter((id) => projectIds.has(id)).length
      ? [line('Projets liés', project.relatedProjectIds.filter((id) => projectIds.has(id)).join(', '))]
      : []),
    '',
  ]);

  const searchLines = buyerSearches.flatMap((search) => {
    const searchScenarios = scenarios.filter((scenario) => scenario.buyerSearchId === search.id);
    const blocks = [
      `### Recherche \`${escapeMarkdownText(search.id)}\``,
      line('Résumé', search.summary),
      '',
    ];
    for (const scenario of searchScenarios) {
      blocks.push(`#### ${safe(scenario.label, taxonomyLabel(scenario.type))}`);
      blocks.push(line('Scénario', taxonomyLabel(scenario.type)));
      if (scenario.condition) blocks.push(line('Condition', scenario.condition));
      const scenarioEvents = criterionEvents.filter((event) => event.scenarioId === scenario.id);
      const supersededIds = new Set(
        scenarioEvents.map((event) => event.supersedesEventId).filter((id): id is string => Boolean(id)),
      );
      const currentEvents = scenarioEvents.filter((event) =>
        !supersededIds.has(event.id) && event.eventType !== 'remove' && event.eventType !== 'invalidate');
      blocks.push('');
      blocks.push('##### Critères actuels');
      blocks.push(...sectionOrEmpty(currentEvents.map((event) =>
        `- **${safe(criterionLabel(event))} :** ${safe(event.value)} — certitude \`${event.certainty}\`, importance \`${event.importance}\`, flexibilité \`${event.flexibility}\`, rôle \`${event.matchingRole}\`; source : ${safe(event.source)}`)));
      blocks.push('');
    }
    return blocks;
  });

  const nextTasks = tasks.filter((task) => task.isNextAction && !['completed', 'cancelled'].includes(task.state));
  const nextActionLines = nextTasks.map((task) =>
    `- **${safe(task.title)}** — échéance : ${safe(task.dueAt)}, priorité : \`${task.priority}\`, état : \`${task.state}\``);

  const taskLines = tasks.map((task) =>
    `- ${safe(task.title)} — \`${task.state}\` · priorité \`${task.priority}\` · échéance ${safe(task.dueAt)}${task.waitingReason ? ` · attente : ${safe(task.waitingReason)}` : ''}`);

  const interactionLines = sortDescending(interactions, (interaction) => interaction.occurredAt).map((interaction) =>
    `- **${safe(interaction.occurredAt)} · ${taxonomyLabel(interaction.type)} · ${taxonomyLabel(interaction.direction)}** — ${safe(interaction.summary)}${interaction.outcome ? ` · résultat : ${safe(interaction.outcome)}` : ''}${interaction.promisedAction ? ` · retour promis : ${safe(interaction.promisedAction)} (${safe(interaction.promisedDueAt)})` : ''}`);

  const decisionLines = sortDescending(decisions, (decision) => decision.effectiveAt).map((decision) =>
    `- **${safe(decision.effectiveAt)}** — ${safe(decision.summary)}${decision.reason ? ` · raison : ${safe(decision.reason)}` : ''}`);

  const historyLines = sortDescending(criterionEvents, (event) => event.effectiveAt).map((event) =>
    `- **${safe(event.effectiveAt)} · ${safe(criterionLabel(event))}** — ${safe(event.value)} · événement \`${event.eventType}\` · certitude \`${event.certainty}\` · enregistré ${safe(event.recordedAt)} · source : ${safe(event.source)}${event.reason ? ` · raison : ${safe(event.reason)}` : ''}${event.supersedesEventId ? ` · remplace \`${escapeMarkdownText(event.supersedesEventId)}\`` : ''}`);

  const learningLines = learnings.map((learning) =>
    `- ${safe(learning.summary)}${learning.status ? ` — \`${escapeMarkdownText(learning.status)}\`` : ''}`);

  const content = [
    ...frontMatter,
    '',
    `# Fiche client — ${safe(input.person.displayName)}`,
    '',
    '> Export ponctuel LEVOIS. D1 reste la source opérationnelle ; ce fichier ne crée aucune synchronisation.',
    '',
    '## Identité',
    '',
    ...identity,
    '',
    '## Projets',
    '',
    ...sectionOrEmpty(projectLines, 'Aucun projet directement accompagné.'),
    '',
    '## Recherche actuelle',
    '',
    ...sectionOrEmpty(searchLines, 'Aucune recherche acquéreur enregistrée.'),
    '',
    '## Prochaine action',
    '',
    ...sectionOrEmpty(nextActionLines, 'Aucune prochaine action désignée.'),
    '',
    '## Tâches',
    '',
    ...sectionOrEmpty(taskLines),
    '',
    '## Interactions résumées',
    '',
    ...sectionOrEmpty(interactionLines),
    '',
    '## Décisions',
    '',
    ...sectionOrEmpty(decisionLines),
    '',
    '## Historique des critères',
    '',
    ...sectionOrEmpty(historyLines),
    '',
    '## Enseignements LEVOIS',
    '',
    ...sectionOrEmpty(learningLines),
    '',
  ].join('\n');

  return {
    content,
    filename: `levois-${safeFilenamePart(input.person.displayName)}-${generatedAt.slice(0, 10)}.md`,
    mediaType: 'text/markdown;charset=utf-8',
  };
};
