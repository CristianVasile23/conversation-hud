// Warning hook in case libWrapper is not installed
Hooks.once("ready", () => {
  if (!game.modules.get("lib-wrapper")?.active && game.user.isGM) {
    ui.notifications.error(game.i18n.localize("CHUD.errors.noLibWrapper"));
  }
});

// Hook for wrapping entity click
Hooks.on("init", () => {
  libWrapper.register(
    "conversation-hud",
    "TextEditor._onClickContentLink",
    function (wrapped, event) {
      return handleOnClickContentLink.bind(this)(event, wrapped);
    },
    "MIXED"
  );
});

function handleOnClickContentLink(event, wrapped) {
  event.preventDefault();
  const currentTarget = event.currentTarget;
  let document = null;

  if (currentTarget.dataset.pack) {
    return wrapped.bind(this)(event);
  }

  if (currentTarget.dataset.type !== "JournalEntry") {
    return wrapped.bind(this)(event);
  }

  const collection = game.collections.get(currentTarget.dataset.type);
  document = collection.get(currentTarget.dataset.id);

  if (document?.flags?.core?.sheetClass === "conversation-entry-sheet.ConversationEntrySheet") {
    if (!document.testUserPermission(game.user, "LIMITED")) {
      ui.notifications.warn(game.i18n.localize("CHUD.errors.activateNoPerms"));
    } else {
      if (event.ctrlKey) {
        if (game.ConversationHud) {
          const pages = document.getEmbeddedCollection("JournalEntryPage").contents;
          if (pages.length > 0) {
            try {
              const conversationData = JSON.parse(pages[0].text.content);
              game.ConversationHud.startConversationFromData(conversationData);
            } catch (error) {
              if (error instanceof SyntaxError) {
                ui.notifications.error(game.i18n.localize("CHUD.errors.failedToParse"));
              } else {
                ui.notifications.error(game.i18n.localize("CHUD.errors.generic"));
              }
            }
          } else {
            ui.notifications.error(game.i18n.localize("CHUD.errors.activateNoPages"));
          }
        } else {
          ui.notifications.error(game.i18n.localize("CHUD.errors.activateNoInit"));
        }
        return;
      }
    }
  }

  return wrapped.bind(this)(event);
}
