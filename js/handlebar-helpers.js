export function registerHandlebarHelpers() {
  registerLinkedJournalHelper();
}

function registerLinkedJournalHelper() {
  Handlebars.registerHelper("renderParticipantLinkedJournal", (journalId) => {
    let html = `<p class="linked-journal">`;

    if (journalId) {
      const document = game.journal.get(journalId);
      html += `${game.i18n.localize("CHUD.strings.linkedJournal")}: `;
      if (document) {
        html += `<a onclick="game.ConversationHud.renderJournalSheet('${journalId}')">${document.name}</a>`;
      } else {
        html += `${game.i18n.localize("CHUD.strings.invalidDocumentRef")}`;
      }
    } else {
      html += `${game.i18n.localize("CHUD.strings.noLinkedJournal")}`;
    }

    html += `</p>`;
    return html;
  });
}
