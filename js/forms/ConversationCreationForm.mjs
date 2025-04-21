import { CollectiveConversationCreationForm } from "./CollectiveConversationCreationForm.js";
import { GmControlledConversationCreationForm } from "./GmControlledConversationCreationForm.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class ConversationCreationForm extends HandlebarsApplicationMixin(ApplicationV2) {
  /* -------------------------------------------- */
  /*  State                                       */
  /* -------------------------------------------- */

  constructor() {
    super();
  }

  /* -------------------------------------------- */
  /*  Rendering                                   */
  /* -------------------------------------------- */

  static DEFAULT_OPTIONS = {
    id: "conversation-type-selection-form",
    classes: ["form"],
    tag: "form",
    window: {
      contentClasses: ["standard-form"],
      title: "CHUD.actions.createConversation - Choose Type", // TODO: Localize
    },
    form: {
      closeOnSubmit: true,
    },
    position: {
      width: "auto",
      height: 400,
    },
  };

  static PARTS = {
    body: {
      template: "modules/conversation-hud/templates/forms/conversation-creation-type-selection-form.hbs",
    },
  };

  _onRender(context, options) {
    super._onRender(context, options);

    const html = this.element;

    const gmControlledConversationSelector = html.querySelector("#gm-controlled-conversation-selector");
    gmControlledConversationSelector.onclick = async () => {
      new GmControlledConversationCreationForm((data) => game.ConversationHud.createConversationFromData(data)).render(
        true
      );
    };

    const collectiveConversationSelector = html.querySelector("#collective-conversation-selector");
    collectiveConversationSelector.onclick = async () => {
      new CollectiveConversationCreationForm((data) => game.ConversationHud.createConversationFromData(data)).render(
        true
      );
    };
  }
}
