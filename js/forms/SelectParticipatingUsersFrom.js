import { CreateOrEditParticipantForm } from "./CreateOrEditParticipantForm.js";
import {
  convertActorToParticipant,
  getConversationDataFromJournalId,
  processParticipantData,
} from "../helpers/index.js";

export class SelectParticipatingUsersFrom extends FormApplication {
  // State variables
  #callbackFunction = undefined;
  #data = undefined;

  constructor(callbackFunction, data) {
    super();
    this.#callbackFunction = callbackFunction;
    this.#data = data;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["form"],
      popOut: true,
      template: "modules/conversation-hud/templates/forms/select-participating-users-form.hbs",
      id: "conversation-pull-participants",
      title: game.i18n.localize("CHUD.actions.selectParticipatingUsers"),
      width: 400,
      resizable: false,
    });
  }

  getData() {
    // We only want to render the users which are not already selected
    const users = game.users;
    const filteredUsers = users.filter((element) => !this.#data.participatingUserIDs.includes(element.id));

    return {
      users: filteredUsers,
    };
  }

  async _updateObject(event, formData) {
    this.#callbackFunction(formData);
  }

  activateListeners(html) {
    super.activateListeners(html);
  }
}
