/**
 * [TODO: Add JSDoc]
 */
export function registerLinkedObjectsHelper() {
  Handlebars.registerHelper("renderParticipantLinkedObjects", (journalId, actorId) => {
    let html = `<p class="chud-linked-objects">`;

    if (!journalId && !actorId) {
      html += `${game.i18n.localize("CHUD.strings.noLinkedDocuments")}`;
    } else {
      if (journalId) {
        const journal = game.journal.get(journalId);
        if (journal) {
          html += `
            <a onclick="game.ConversationHud.renderJournalSheet('${journalId}')" title="${journal.name}">
              <i class="fas fa-book"></i>
            </a>
          `;
        } else {
          html += `
            <i class="fas fa-book" title="${game.i18n.localize("CHUD.strings.invalidDocumentRef")}"></i>
          `;
        }
      }
      if (actorId) {
        const actor = game.actors.get(actorId);
        if (actor) {
          html += `
            <a onclick="game.ConversationHud.renderActorSheet('${actorId}')" title="${actor.name}">
              <i class="fas fa-user"></i>
            </a>
          `;
        } else {
          html += `${game.i18n.localize("CHUD.strings.invalidDocumentRef")}`;
        }
      }
    }

    html += `</p>`;
    return html;
  });
}
