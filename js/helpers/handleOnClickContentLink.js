/**
 * Handles Ctrl+Click on conversation journal entries to start conversations
 *
 * @param {Event} event - The click event that triggered this function
 */
export function handleOnClickContentLink(event) {
  event.preventDefault();

  // Check permissions
  if (!this.testUserPermission(game.user, "LIMITED")) {
    ui.notifications.warn(game.i18n.localize("CHUD.errors.activateNoPerms"));
    return;
  }

  // Check if ConversationHud is initialized
  if (!game.ConversationHud) {
    ui.notifications.error(game.i18n.localize("CHUD.errors.activateNoInit"));
    return;
  }

  game.ConversationHud.startConversationFromJournalId(this.id);
}
