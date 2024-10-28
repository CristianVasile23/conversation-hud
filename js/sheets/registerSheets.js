import { ConversationFactionSheet } from "./ConversationFactionSheet.js";

export function registerSheets() {
  // DocumentSheetConfig.registerSheet(JournalEntry, "conversation-entry-sheet", ConversationEntrySheet, {
  //   types: ["base"],
  //   makeDefault: false,
  //   label: game.i18n.localize("CHUD.sheets.entrySheet"),
  // });

  DocumentSheetConfig.registerSheet(JournalEntry, "conversation-faction-sheet", ConversationFactionSheet, {
    types: ["base"],
    makeDefault: false,
    label: game.i18n.localize("CHUD.sheets.factionSheet"),
  });
}
