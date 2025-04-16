import { CollectiveConversationCreationForm } from "./CollectiveConversationCreationForm.js";
import { GmControlledConversationCreationForm } from "./GmControlledConversationCreationForm.mjs";

export class ConversationCreationForm extends FormApplication {
  constructor() {
    super();
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["form"],
      popOut: true,
      template: "modules/conversation-hud/templates/forms/conversation-creation-type-selection-form.hbs",
      // TODO: Localize
      title: game.i18n.localize("CHUD.actions.createConversation") + " - " + "Choose Type", // TODO: Localize
      width: "auto",
      height: 400,
    });
  }

  activateListeners(html) {
    super.activateListeners(html);

    const gmControlledConversationButton = html[0].querySelector("#gmControlledConversationButton");
    gmControlledConversationButton.onclick = async () => {
      await this.close({});
      new GmControlledConversationCreationForm((data) => game.ConversationHud.createConversationFromData(data)).render(
        true
      );
    };

    const collectiveConversationButton = html[0].querySelector("#collectiveConversationButton");
    collectiveConversationButton.onclick = async () => {
      await this.close({});
      new CollectiveConversationCreationForm((data) => game.ConversationHud.createConversationFromData(data)).render(
        true
      );
    };
  }

  _updateObject() {}
}
