/// <reference path="../types/ConversationData.js" />

/**
 * Function that parses a journal entry searching for conversation data
 *
 * @param {string} journalId The ID of the journal entity which should contain a conversation
 * @returns {GMControlledConversationData | null}
 */
export function getConversationDataFromJournalId(journalId) {
  const document = game.journal.get(journalId);
  const pages = document.getEmbeddedCollection("JournalEntryPage").contents;

  // TODO: Get pages in a better way by looking for flag
  // Additionally, this function needs to be reworked since it's not used only for conversation data anymore

  if (pages.length > 0) {
    try {
      const conversationData = JSON.parse(pages[0].text.content);
      return conversationData;
    } catch (error) {
      if (error instanceof SyntaxError) {
        ui.notifications.error(game.i18n.localize("CHUD.errors.failedToParse"));
      } else {
        ui.notifications.error(game.i18n.localize("CHUD.errors.genericSheetError"));
      }
    }
  } else {
    // TODO: This error message needs to be improved
    ui.notifications.error(game.i18n.localize("CHUD.errors.activateNoPages"));
  }

  return null;
}
