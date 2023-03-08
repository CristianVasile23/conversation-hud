export class FileInputForm extends FormApplication {
  constructor(isEditing, callbackFunction) {
    super();
    this.isEditing = isEditing;
    this.callbackFunction = callbackFunction;
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["form"],
      popOut: true,
      template: `modules/conversation-hud/templates/file_input.html`,
      id: "conversation-add-participant",
      title: game.i18n.localize("CHUD.participantData"),
      width: 560,
    });
  }

  getData(options) {
    return {
      isEditing: this.isEditing,
    };
  }

  async _updateObject(event, formData) {
    this.callbackFunction(formData);
  }
}
