/**
 * [TODO: Add JSDoc]
 */

// TODO: Add comments that explain what happens in the function
export function handleOnClickContentLink(event, wrapped) {
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

  // TODO: Use proper sheet class from constants
  if (document?.flags?.core?.sheetClass === "conversation-hud.ConversationSheet") {
    if (!document.testUserPermission(game.user, "LIMITED")) {
      ui.notifications.warn(game.i18n.localize("CHUD.errors.activateNoPerms"));
    } else {
      if (event.ctrlKey) {
        if (game.ConversationHud) {
          const pages = document.getEmbeddedCollection("JournalEntryPage").contents;
          if (pages.length > 0) {
            try {
              const conversationData = JSON.parse(pages[0].text.content);
              const visibility = game.ConversationHud.conversationIsActive ? game.ConversationHud.conversationIsVisible : true;
              game.ConversationHud.startConversationFromData(conversationData, visibility);
            } catch (error) {
              if (error instanceof SyntaxError) {
                ui.notifications.error(game.i18n.localize("CHUD.errors.failedToParse"));
              } else {
                ui.notifications.error(game.i18n.localize("CHUD.errors.genericSheetError"));
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
