import { GmControlledConversationCreationForm } from "./GmControlledConversationCreationForm.js";

export class ConversationCreationForm extends FormApplication {
  constructor() {
    super();
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["form"],
      popOut: true,
      template: "modules/conversation-hud/templates/forms/conversation_creation_form.hbs",
      // TODO: Localize
      title: game.i18n.localize("CHUD.actions.createConversation") + " - " + "Choose Type", // TODO: Localize
      width: "auto",
      height: 400,
    });
  }

  activateListeners(html) {
    super.activateListeners(html);

    const gmControlledConversationButton = html[0].querySelector("#gm-controlled-conversation-button");
    gmControlledConversationButton.onclick = async () => {
      await this.close({});
      new GmControlledConversationCreationForm((data) => game.ConversationHud.createConversationFromFormData(data)).render(true);
    };
  }

  _updateObject() {}
}
