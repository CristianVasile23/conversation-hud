/**
  [TODO: Add JSDoc]
**/
export const registerHook = () => {
  Hooks.on("getSceneControlButtons", (controls) => {
    if (game.user.isGM) {
      const notesControl = controls.find((c) => c.name === "notes");
      if (notesControl) {
        notesControl.tools.push({
          name: "activateHud",
          title: game.i18n.localize("CHUD.actions.activateHUD"),
          icon: "fas fa-comments",
          toggle: true,
          active: game.ConversationHud.conversationIsActive || false,
          visible: game.user.isGM,
          onClick: (toggle) => {
            if (toggle) {
              game.ConversationHud.onToggleConversation(true);
            } else {
              // Update the controls to be active again as we have yet to receive the user's decision
              ui.controls.controls
                .find((controls) => controls.name === "notes")
                .tools.find((tools) => tools.name === "activateHud").active = true;

              // Display conversation closing confirmation dialog
              game.ConversationHud.closeActiveConversation();
            }
          },
          button: true,
        });
      }
    }
  });
};
