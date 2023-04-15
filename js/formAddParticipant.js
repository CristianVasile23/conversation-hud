export class FileInputForm extends FormApplication {
  constructor(isEditing, callbackFunction, participantData) {
    super();
    this.isEditing = isEditing;
    this.callbackFunction = callbackFunction;
    this.participantData = participantData;
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["form"],
      popOut: true,
      template: `modules/conversation-hud/templates/add_edit_participant.hbs`,
      id: "conversation-add-participant",
      title: game.i18n.localize("CHUD.participantData"),
      width: 560,
    });
  }

  getData(options) {
    return {
      isEditing: this.isEditing,
      participantData: this.participantData,
    };
  }

  async _updateObject(event, formData) {
    this.callbackFunction(formData);
  }
}
