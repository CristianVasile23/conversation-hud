Hooks.on("getSceneControlButtons", (controls) => {
  if (game.user.isGM) {
    const notesControl = controls.find((c) => c.name === "notes");
    if (notesControl) {
      notesControl.tools.push({
        name: "activateHud",
        title: game.i18n.localize("CHUD.activateHUD"),
        icon: "fas fa-comments",
        toggle: true,
        active: game.ConversationHud.getConversationStatus(),
        visible: game.user.isGM,
        onClick: (toggle) => {
          Hooks.call("toggleConversation", toggle);
        },
        button: true,
      });
    }
  }
});
