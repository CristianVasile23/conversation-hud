import { ConversationFactionSheet } from "./ConversationFactionSheet.js";
import { ConversationSheet } from "./ConversationSheet.mjs";

/**
 * TODO: Finish JSDoc
 */
export function registerSheets() {
  DocumentSheetConfig.registerSheet(JournalEntry, "conversation-faction-sheet", ConversationFactionSheet, {
    types: ["base"],
    makeDefault: false,
    label: game.i18n.localize("CHUD.sheets.factionSheet"),
  });

  DocumentSheetConfig.registerSheet(JournalEntry, "conversation-sheet", ConversationSheet, {
    types: ["base"],
    makeDefault: false,
    label: game.i18n.localize("CHUD.sheets.entrySheet"),
  });
}
