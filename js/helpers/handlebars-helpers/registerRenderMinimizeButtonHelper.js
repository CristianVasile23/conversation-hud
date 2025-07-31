export function registerRenderMinimizeButtonHelper() {
  Handlebars.registerHelper("renderMinimizeButton", (isGM, isMinimized, isMinimizationLocked) => {
    let button = document.createElement("button");
    button.type = "button";
    button.classList.add("ui-control", "plain", "icon", "fa-solid");

    button.setAttribute(
      "onclick",
      `game.ConversationHud.executeFunction({ scope: "local", type: "toggle-minimize", data: {} })`
    );

    if (isMinimizationLocked && !isGM) {
      button.classList.add("disabled");
      button.disabled = true;
      button.setAttribute("data-tooltip", game.i18n.localize("CHUD.strings.featureLocked"));
    } else if (isMinimized) {
      button.setAttribute("data-tooltip", game.i18n.localize("CHUD.actions.maximizeConversation"));
    } else {
      button.setAttribute("data-tooltip", game.i18n.localize("CHUD.actions.minimizeConversation"));
    }

    if (isMinimized) {
      button.classList.add("fa-arrows-maximize");
    } else {
      button.classList.add("fa-arrows-minimize");
    }

    let listItem = document.createElement("li");
    listItem.append(button);

    return listItem.outerHTML;
  });
}
