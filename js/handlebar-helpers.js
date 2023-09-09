export function registerHandlebarHelpers() {
  registerLinkedJournalHelper();
}

function registerLinkedJournalHelper() {
  Handlebars.registerHelper("renderParticipantLinkedJournal", (journalId) => {
    let html = `<p class="linked-journal">`;

    if (journalId) {
      const document = game.journal.get(journalId);
      html += `Linked journal: <a onclick="game.ConversationHud.renderJournalSheet('${journalId}')">${document.name}</a>`;
    } else {
      html += `No linked journal`;
    }

    html += `</p>`;
    return html;
  });
}
