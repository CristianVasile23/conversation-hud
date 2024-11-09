export function registerRenderMinimizeButtonHelper() {
  Handlebars.registerHelper("renderMinimizeButton", (isGM, isMinimized, isMinimizationLocked) => {
    let button = document.createElement("div");
    button.classList.add("control-button");

    button.setAttribute(
      "onclick",
      `game.ConversationHud.executeFunction({ scope: "local", type: "toggle-minimize", data: {} })`
    );

    if (isMinimizationLocked) {
      if (!isGM) {
        button.classList.add("disabled");
      }
    }

    if (isMinimized) {
      button.setAttribute("data-tooltip", game.i18n.localize("CHUD.actions.maximizeConversation"));
    } else {
      button.setAttribute("data-tooltip", game.i18n.localize("CHUD.actions.minimizeConversation"));
    }

    let icon = document.createElement("i");
    if (isMinimized) {
      icon.classList.add("fas", "fa-chevron-left");
    } else {
      icon.classList.add("fas", "fa-chevron-right");
    }
    button.append(icon);

    return button.outerHTML;
  });
}
