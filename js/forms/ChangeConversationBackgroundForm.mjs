const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class ChangeConversationBackgroundForm extends HandlebarsApplicationMixin(ApplicationV2) {
  /* -------------------------------------------- */
  /*  State                                       */
  /* -------------------------------------------- */

  callbackFunction = undefined;
  conversationBackground = undefined;

  constructor(callbackFunction, conversationBackground) {
    super();
    this.callbackFunction = callbackFunction;
    this.conversationBackground = conversationBackground;
  }

  /* -------------------------------------------- */
  /*  Rendering                                   */
  /* -------------------------------------------- */

  static DEFAULT_OPTIONS = {
    id: "chud-conversation-background-form",
    classes: ["form"],
    tag: "form",
    window: {
      contentClasses: ["standard-form"],
      title: "CHUD.actions.changeConversationBackground",
    },
    form: {
      handler: this.#handleSubmit,
      closeOnSubmit: true,
    },
    position: {
      width: 520,
      height: "auto",
    },
  };

  static PARTS = {
    body: {
      template: "modules/conversation-hud/templates/forms/conversation-background-form.hbs",
    },
    footer: {
      template: "templates/generic/form-footer.hbs",
    },
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.buttons = [
      {
        type: "submit",
        icon: "fa-solid fa-save",
        label: "CHUD.actions.save",
      },
    ];

    return {
      conversationBackground: this.conversationBackground,
      ...context,
    };
  }

  _onRender(context, options) {
    super._onRender(context, options);
  }

  /* -------------------------------------------- */
  /*  Handlers                                    */
  /* -------------------------------------------- */

  /**
   *
   * @param {*} event
   * @param {*} form
   * @param {*} formData
   */
  static async #handleSubmit(event, form, formData) {
    this.callbackFunction(formData);
  }
}
