/// <reference path="../types/CollectiveConversation/CollectiveConversation.js" />
/// <reference path="../types/ConversationData.js" />

import { ANCHOR_OPTIONS, ConversationTypes } from "../constants/index.js";
import { CreateOrEditParticipantForm } from "./CreateOrEditParticipantForm.js";
import { PullParticipantsFromSceneForm } from "./PullParticipantsFromSceneForm.js";
import {
  getActorDataFromDragEvent,
  moveInArray,
  getDragAndDropIndex,
  hideDragAndDropIndicator,
  showDragAndDropIndicator,
  processParticipantData,
} from "../helpers/index.js";
import { SelectParticipatingUsersFrom } from "./SelectParticipatingUsersFrom.js";

export class CollectiveConversationCreationForm extends FormApplication {
  // State variables
  /** @type {(conversationData: ConversationData) => void | undefined} } */
  #callbackFunction = undefined;

  #participatingUsers = [];
  // #conversationBackground = "";

  // Drag and drop variables
  // dropzoneVisible = false;
  // draggingParticipant = false;

  /**
   * TODO: Add JSDoc
   *
   * @param {(conversationData: ConversationData) => void} callbackFunction
   */
  constructor(callbackFunction) {
    super();
    this.#callbackFunction = callbackFunction;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["form"],
      popOut: true,
      template: "modules/conversation-hud/templates/forms/conversation-creation-form.hbs",
      id: "collective-conversation-creation-form",
      title: game.i18n.localize("CHUD.actions.createConversation"),
      width: 685,
      height: 640,
    });
  }

  getData() {
    // for (const participant of this.participants) {
    //   processParticipantData(participant);
    // }
    console.log(this.#participatingUsers);

    return {
      isGM: game.user.isGM,
      type: ConversationTypes.Collective,
      // conversationBackground: this.conversationBackground,
      participatingUsers: this.#participatingUsers,
    };
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find("#addParticipatingUsers").click(async (e) => {
      new SelectParticipatingUsersFrom((data) => this.#handleAddParticipatingUsers(data), {
        participatingUserIDs: this.#participatingUsers.map((item) => item.id),
      }).render(true);
    });
  }

  /**
   *
   * @param {*} event
   * @param {*} formData
   */
  async _updateObject(event, formData) {
    /** @type {CollectiveConversation} */
    const collectiveConversation = {
      data: {},
      features: {},
    };

    /** @type {ConversationData} */
    const conversationData = {
      type: ConversationTypes.Collective,
      background: formData.conversationBackground,
      conversation: collectiveConversation,
    };

    // Pass data to conversation class
    this.#callbackFunction(conversationData);
  }

  #handleAddParticipatingUsers(data) {
    const selectedUsers = data.users;
    const users = game.users;
    const filteredUsers = users.filter((element) => selectedUsers.includes(element.id));

    // TODO: Create participating user object

    this.#participatingUsers.push(...filteredUsers);

    this.render(false);
  }
}
