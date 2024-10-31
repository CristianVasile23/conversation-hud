export class ChangeConversationBackgroundForm extends FormApplication {
  callbackFunction = undefined;
  conversationBackground = undefined;

  constructor(callbackFunction, conversationBackground) {
    super();
    this.callbackFunction = callbackFunction;
    this.conversationBackground = conversationBackground;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["form"],
      popOut: true,
      template: `modules/conversation-hud/templates/conversation_background_input.hbs`,
      id: "conversation-background-form",
      title: game.i18n.localize("CHUD.actions.changeConversationBackground"),
      width: 450,
      height: "auto",
      resizable: false,
    });
  }

  getData() {
    return {
      conversationBackground: this.conversationBackground,
    };
  }

  async _updateObject(event, formData) {
    this.callbackFunction(formData);
  }

  activateListeners(html) {
    super.activateListeners(html);
  }
}
