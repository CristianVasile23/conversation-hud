import { FactionSheet } from "./FactionSheet.mjs";
import { ConversationSheet } from "./ConversationSheet.mjs";

/**
 * TODO: Finish JSDoc
 */
export function registerSheets() {
  DocumentSheetConfig.registerSheet(JournalEntry, "faction-sheet", FactionSheet, {
    types: ["base"],
    makeDefault: false,
    label: game.i18n.localize("CHUD.sheets.factionSheet"),
  });

  DocumentSheetConfig.registerSheet(JournalEntry, "conversation-sheet", ConversationSheet, {
    types: ["base"],
    makeDefault: false,
    // TODO: Change string name to conversationSheet
    label: game.i18n.localize("CHUD.sheets.entrySheet"),
  });
}
