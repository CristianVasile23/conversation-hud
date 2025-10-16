import { FactionSheet } from "./FactionSheet.mjs";
import { ConversationSheet } from "./ConversationSheet.mjs";

/**
 * TODO: Finish JSDoc
 */
export function registerSheets() {
  foundry.applications.apps.DocumentSheetConfig.registerSheet(JournalEntry, "faction-sheet", FactionSheet, {
    types: ["base"],
    makeDefault: false,
    label: game.i18n.localize("CHUD.sheets.factionSheet"),
  });

  foundry.applications.apps.DocumentSheetConfig.registerSheet(JournalEntry, "conversation-sheet", ConversationSheet, {
    types: ["base"],
    makeDefault: false,
    // TODO: Change string name to conversationSheet
    label: game.i18n.localize("CHUD.sheets.entrySheet"),
  });
}
