function getMigratedConversations() {
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
      console.warn(`Could not parse JSON for journal ${journal.name}`);
      continue;
    }

    const oldContent = originalData;
    let participants = [];
    let defaultActiveParticipant = -1;
    let background = "";

    // Format 1: Array
    if (Array.isArray(originalData)) {
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
    }
    // Format 2: Object with participants
    else if (originalData?.participants) {
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

    // Final migrated structure
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
      // oldContent,
      newContent,
    };
  }

  return migrated;
}

function getMigratedFactions() {
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

export async function migrateConversations() {
  const migratedData = getMigratedConversations();
  if (!migratedData || Object.keys(migratedData).length === 0) {
    ui.notifications.warn("No conversations were migrated.");
    return;
  }

  // Find or create the "MigratedEntries" folder
  let folder = game.folders.find((f) => f.name === "Migration - Conversations" && f.type === "JournalEntry");
  if (!folder) {
    folder = await Folder.create({
      name: "Migration - Conversations",
      type: "JournalEntry",
      color: "#6c757d",
    });
  }

  for (const [journalId, data] of Object.entries(migratedData)) {
    const originalName = data.journalName;
    const newName = `${originalName} (Migrated)`;
    const conversationData = data.newContent;

    await JournalEntry.create({
      name: newName,
      folder: folder.id,
      flags: {
        "conversation-hud": {
          type: "conversation-sheet",
        },
        core: {
          sheetClass: "conversation-sheet.ConversationSheet",
        },
      },
      pages: [
        {
          name: "_chud_conversation_data",
          type: "text",
          text: {
            content: JSON.stringify(conversationData, null, 2),
            format: CONST.JOURNAL_ENTRY_PAGE_FORMATS.PLAIN_TEXT,
          },
          flags: {
            "conversation-hud": {
              type: "conversation-sheet-data",
            },
          },
        },
      ],
    });
  }

  ui.notifications.info("Conversations migrated successfully.");
}

export async function migrateFactions() {
  const migratedData = getMigratedFactions();
  if (!migratedData || Object.keys(migratedData).length === 0) {
    ui.notifications.warn("No journals were migrated.");
    return;
  }

  // Find or create the "MigratedEntries" folder
  let folder = game.folders.find((f) => f.name === "Migration - Factions" && f.type === "JournalEntry");
  if (!folder) {
    folder = await Folder.create({
      name: "Migration - Factions",
      type: "JournalEntry",
      color: "#6c757d",
    });
  }

  for (const [journalId, data] of Object.entries(migratedData)) {
    const originalName = data.journalName;
    const newName = `${originalName} (Migrated)`;
    const factionData = data.newContent;

    await JournalEntry.create({
      name: newName,
      folder: folder.id,
      flags: {
        "conversation-hud": {
          type: "faction-sheet",
        },
        core: {
          sheetClass: "faction-sheet.FactionSheet",
        },
      },
      pages: [
        {
          name: "_chud_faction_data",
          type: "text",
          text: {
            content: JSON.stringify(factionData, null, 2),
            format: CONST.JOURNAL_ENTRY_PAGE_FORMATS.PLAIN_TEXT,
          },
          flags: {
            "conversation-hud": {
              type: "faction-sheet-data",
            },
          },
        },
      ],
    });
  }

  ui.notifications.info("Factions migrated successfully.");
}
