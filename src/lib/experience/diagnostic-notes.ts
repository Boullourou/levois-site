import { escapeHtml as e } from './context';
import type { HumanNote } from './types';

/** Render only the notes carried by the displayed version, not the live session. */
export function diagnosticNotesHTML(notes: readonly HumanNote[] | undefined): string {
  if (!notes?.length) return '';
  return '<section class="lv-history lv-human-notes" aria-labelledby="synthesis-notes-title"><h2 id="synthesis-notes-title">Précisions conservées</h2>' +
    '<p class="lv-note">Ces notes sont conservées avec cette version.</p>' + notes.map(note => {
      const date = new Date(note.createdAt);
      const dateLabel = Number.isFinite(date.getTime())
        ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' }).format(date)
        : 'Date non renseignée';
      return '<article class="lv-reading-item"><p class="lv-note">Auteur indiqué : ' + e(note.author) + ' · ' + e(dateLabel) + '</p>' +
        '<p>' + e(note.text) + '</p>' + (note.source ? '<p class="lv-note">Source indiquée : ' + e(note.source) + '</p>' : '') + '</article>';
    }).join('') + '</section>';
}
