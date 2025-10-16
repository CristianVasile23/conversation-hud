/**
 * [TODO: Add JSDoc]
 */
export function registerLinkedObjectsHelper() {
  Handlebars.registerHelper("renderParticipantLinkedObjects", (journalId, actorId) => {
    let html = `<div class="chud-linked-objects">`;

    if (!journalId && !actorId) {
      html += `<p>${game.i18n.localize("CHUD.strings.noLinkedDocuments")}</p>`;
    } else {
      if (journalId) {
        const journal = game.journal.get(journalId);
        if (journal) {
          html += `
            <button
              type="button"
              class="inline-control icon fa-solid fa-book-open"
              onclick="game.ConversationHud.renderJournalSheet('${journalId}')"
              data-tooltip
              aria-label="${journal.name}"
            ></button>
          `;
        } else {
          html += `
            <i
              class="chud-icon-book-open-slash chud-invalid-reference"
              data-tooltip
              aria-label="${game.i18n.localize("CHUD.strings.invalidDocumentRef")}"
            ></i>
          `;
        }
      }
      if (actorId) {
        const actor = game.actors.get(actorId);
        if (actor) {
          html += `
            <button
              type="button"
              class="inline-control icon fa-solid fa-user"
              onclick="game.ConversationHud.renderActorSheet('${actorId}')"
              data-tooltip
              aria-label="${actor.name}"
            ></button>
          `;
        } else {
          html += `
            <i
              class="fas fa-user-slash chud-invalid-reference"
              data-tooltip
              aria-label="${game.i18n.localize("CHUD.strings.invalidDocumentRef")}"
            ></i>
          `;
        }
      }
    }

    html += `</div>`;
    return html;
  });
}
