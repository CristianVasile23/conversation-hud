/// <reference path="../types/ConversationData.js" />

import { MODULE_NAME } from "../constants/index.js";

/**
 * Retrieves conversation or faction data from a journal entry by its ID.
 * This function looks for pages with specific flags to identify conversation or faction data.
 *
 * @param {string} journalId - The ID of the journal entry containing conversation or faction data
 * @param {boolean} [showErrors=true] - Whether to display error notifications to the user
 * @returns {GMControlledConversationData | null} The parsed conversation/faction data, or null if not found or invalid
 */
export function getConversationDataFromJournalId(journalId) {
  // Validate journal exists
  const journal = game.journal.get(journalId);
  if (!journal) {
    console.warn(`${MODULE_NAME} | Journal with ID "${journalId}" not found`);
    return null;
  }

  // Look for a page with conversation-sheet-data or faction-sheet-data flag
  const dataPage = journal.pages.find((page) => {
    const pageType = foundry.utils.getProperty(page, "flags.conversation-hud.type");
    return pageType === "conversation-sheet-data" || pageType === "faction-sheet-data";
  });

  if (!dataPage) {
    console.warn(
      `${MODULE_NAME} | Journal "${journal.name}" (${journalId}) has no pages with conversation or faction data`
    );
    return null;
  }

  // Parse the page content
  try {
    const conversationData = JSON.parse(dataPage.text.content);
    return conversationData;
  } catch (error) {
    console.error(`${MODULE_NAME} | Failed to parse data from journal "${journal.name}" (${journalId}):`, error);

    if (error instanceof SyntaxError) {
      ui.notifications.error(game.i18n.localize("CHUD.errors.failedToParse"));
    } else {
      ui.notifications.error(game.i18n.localize("CHUD.errors.genericSheetError"));
    }

    return null;
  }
}
