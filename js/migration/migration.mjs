/// <reference path="../types/MigrationData.js" />

import { MODULE_NAME } from "../constants/index.js";

/**
 * Scans all journals in the world to find conversations that need migration from old formats.
 * Supports two legacy formats:
 * - Format 1: Array of participants
 * - Format 2: Object with participants array and additional properties
 *
 * @returns {Record<string, MigrationData>} An object mapping journal IDs to their migration data
 */
export function getConversationsToMigrate() {
  const DEFAULT_PARTICIPANT = {
    name: "Anonymous",
    displayName: true,
    img: "modules/conversation-hud/img/silhouette.jpg",
    imgScale: 1,
    portraitAnchor: {
      vertical: "centerVertical",
      horizontal: "centerHorizontal",
    },
    linkedJournal: "",
    linkedActor: "",
    faction: {
      selectedFaction: "",
      displayFaction: false,
      factionName: "",
      factionLogo: "",
      factionBannerEnabled: false,
      factionBannerShape: "shape-1",
      factionBannerTint: "#000000",
    },
  };

  const migrated = {};

  for (const journal of game.journal) {
    const conversationPage = journal.pages.find(
      (page) => page.flags?.["conversation-hud"]?.type === "conversation" || page.name === "Conversation Participants"
    );

    if (!conversationPage) continue;

    const pageContent = conversationPage.text?.content ?? "";
    let originalData;

    try {
      originalData = JSON.parse(pageContent);
    } catch (e) {
      console.warn(`${MODULE_NAME} | Could not parse JSON for journal ${journal.name}`);
      continue;
    }

    let participants = [];
    let defaultActiveParticipant = -1;
    let background = "";

    if (Array.isArray(originalData)) {
      // Format 1: Array
      participants = originalData.map((p) => ({
        ...structuredClone(DEFAULT_PARTICIPANT),
        ...p,
        displayName: true,
        imgScale: 1,
        portraitAnchor: {
          vertical: "centerVertical",
          horizontal: "centerHorizontal",
        },
        faction: structuredClone(DEFAULT_PARTICIPANT.faction),
        linkedJournal: p.linkedJournal || "",
      }));
    } else if (originalData?.participants) {
      // Format 2: Object with participants
      participants = originalData.participants.map((p) => ({
        ...structuredClone(DEFAULT_PARTICIPANT),
        ...p,
        displayName: p.displayName ?? true,
        imgScale: p.imgScale ?? 1,
        portraitAnchor: {
          vertical: p.portraitAnchor?.vertical ?? "centerVertical",
          horizontal: p.portraitAnchor?.horizontal ?? "centerHorizontal",
        },
        faction: {
          ...structuredClone(DEFAULT_PARTICIPANT.faction),
          ...p.faction,
        },
        linkedJournal: p.linkedJournal ?? "",
      }));
      defaultActiveParticipant = originalData.defaultActiveParticipant ?? -1;
      background = originalData.conversationBackground ?? "";
    }

    // Already migrated or invalid format
    else if (originalData?.conversation?.data?.participants) {
      continue;
    } else {
      console.warn(`Journal ${journal.name} has unrecognized structure`);
      continue;
    }

    const newContent = {
      type: "gm-controlled",
      background,
      conversation: {
        data: {
          participants,
          defaultActiveParticipant,
        },
        features: {
          isMinimized: false,
          isMinimizationLocked: false,
          isSpeakingAs: false,
          isBackgroundVisible: true,
        },
      },
    };

    migrated[journal.id] = {
      journalName: journal.name,
      pageId: conversationPage.id,
      newContent,
    };
  }

  return migrated;
}

/**
 * Scans all journals in the world to find factions that need migration from the old sheet class format.
 * Identifies journals using the legacy "conversation-faction-sheet.ConversationFactionSheet" sheet class.
 *
 * @returns {Record<string, MigrationData>} An object mapping journal IDs to their migration data
 */
export function getFactionsToMigrate() {
  const migrated = {};

  for (const journal of game.journal) {
    // Check if the journal uses the old faction sheet class
    const sheetClass = journal.flags?.core?.sheetClass;
    if (sheetClass !== "conversation-faction-sheet.ConversationFactionSheet") continue;

    const factionPage = journal.pages.contents.toSorted((a, b) => a.sort - b.sort)[0];

    if (!factionPage) continue;

    const pageContent = factionPage.text?.content ?? "";
    let originalData;

    try {
      originalData = JSON.parse(pageContent);
    } catch (e) {
      console.warn(`Could not parse JSON for journal ${journal.name}`);
      continue;
    }

    migrated[journal.id] = {
      journalName: journal.name,
      pageId: factionPage.id,
      newContent: originalData,
    };
  }

  return migrated;
}

/**
 * Migrates all conversations from old formats to the new format.
 * Updates journal pages with the new data structure and sets appropriate flags.
 * Shows notifications for successful migrations and logs errors for failures.
 *
 * @returns {Promise<string[]>} A promise that resolves to an array of journal names that failed to migrate
 */
export async function migrateConversations() {
  const migratedData = getConversationsToMigrate();
  const failedMigrations = [];

  if (!migratedData || Object.keys(migratedData).length === 0) {
    ui.notifications.warn("No conversations were found to migrate.");
    return [];
  }

  for (const [journalId, data] of Object.entries(migratedData)) {
    try {
      const journal = game.journal.get(journalId);
      if (!journal) throw new Error("Journal not found");

      const page = journal.pages.get(data.pageId);
      if (!page) throw new Error("Page not found");

      await page.update({
        name: "_chud_conversation_data",
        text: {
          content: JSON.stringify(data.newContent, null, 2),
          format: CONST.JOURNAL_ENTRY_PAGE_FORMATS.PLAIN_TEXT,
        },
        flags: {
          "conversation-hud": {
            type: "conversation-sheet-data",
          },
        },
      });

      await journal.update({
        flags: {
          "conversation-hud": {
            type: "conversation-sheet",
          },
          core: {
            sheetClass: "conversation-sheet.ConversationSheet",
          },
        },
      });
    } catch (error) {
      console.error(`${MODULE_NAME} | Failed to migrate conversation ${data.journalName}:`, error);
      failedMigrations.push(data.journalName);
    }
  }

  return failedMigrations;
}

/**
 * Migrates all factions from the old sheet class format to the new format.
 * Updates journal pages with the new data structure and sets appropriate flags.
 * Shows notifications for successful migrations and logs errors for failures.
 *
 * @returns {Promise<string[]>} A promise that resolves to an array of journal names that failed to migrate
 */
export async function migrateFactions() {
  const migratedData = getFactionsToMigrate();
  const failedMigrations = [];

  if (!migratedData || Object.keys(migratedData).length === 0) {
    ui.notifications.warn("No factions were found to migrate.");
    return [];
  }

  for (const [journalId, data] of Object.entries(migratedData)) {
    try {
      const journal = game.journal.get(journalId);
      if (!journal) throw new Error("Journal not found");

      const page = journal.pages.get(data.pageId);
      if (!page) throw new Error("Page not found");

      await page.update({
        name: "_chud_faction_data",
        text: {
          content: JSON.stringify(data.newContent, null, 2),
          format: CONST.JOURNAL_ENTRY_PAGE_FORMATS.PLAIN_TEXT,
        },
        flags: {
          "conversation-hud": {
            type: "faction-sheet-data",
          },
        },
      });

      await journal.update({
        flags: {
          "conversation-hud": {
            type: "faction-sheet",
          },
          core: {
            sheetClass: "faction-sheet.FactionSheet",
          },
        },
      });
    } catch (error) {
      console.error(`${MODULE_NAME} | Failed to migrate faction ${data.journalName}:`, error);
      failedMigrations.push(data.journalName);
    }
  }

  return failedMigrations;
}
