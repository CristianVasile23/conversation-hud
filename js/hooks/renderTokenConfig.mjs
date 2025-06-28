/**
  [TODO: Add JSDoc]
**/
export const registerHook = () => {
  // Hook that injects CHUD fields into the token configuration sheet
  Hooks.on("renderTokenConfig", async (app, html, data) => {
    // TODO: Use proper sheet class from constants
    const conversations = game.journal.filter(
      (entry) => foundry.utils.getProperty(entry, "flags.conversation-hud.type") === "conversation-sheet"
    );

    const excludeFromBeingPulled = data.document["flags"]["conversation-hud"]?.excludeFromBeingPulled || undefined;
    const linkedConversation = data.document["flags"]["conversation-hud"]?.linkedConversation || undefined;

    const renderedHtml = await foundry.applications.handlebars.renderTemplate(
      "modules/conversation-hud/templates/fragments/actor-linked-conversation-data.hbs",
      {
        excludeFromBeingPulled: excludeFromBeingPulled,
        conversations: conversations,
        linkedConversation: linkedConversation,
      }
    );

    const target = html.querySelector('div[data-tab="identity"] > .form-group:last-of-type');
    if (target) {
      target.insertAdjacentHTML("afterend", renderedHtml);
    }

    app.setPosition({ height: "auto" });
  });
};
