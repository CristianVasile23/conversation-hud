/**
  [TODO: Add JSDoc]
**/
export const registerHook = () => {
  // Hook that injects CHUD fields into the token configuration sheet
  Hooks.on("renderTokenConfig", async (app, html, data) => {
    // TODO: Use proper sheet class from constants
    const conversations = game.journal.filter((item) => item.flags.core?.sheetClass === "conversation-sheet.ConversationEntrySheet");

    const excludeFromBeingPulled = data.object["flags"]["conversation-hud"]?.excludeFromBeingPulled || undefined;
    const linkedConversation = data.object["flags"]["conversation-hud"]?.linkedConversation || undefined;

    const renderedHtml = await renderTemplate("modules/conversation-hud/templates/fragments/actor_linked_conversation.hbs", {
      excludeFromBeingPulled: excludeFromBeingPulled,
      conversations: conversations,
      linkedConversation: linkedConversation,
    });

    html.find('div[data-tab="character"] > .form-group').last().after(renderedHtml);
    app.setPosition({ height: "auto" });
  });
};
