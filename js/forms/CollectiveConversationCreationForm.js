/// <reference path="../types/ParticipatingUserData.js" />
/// <reference path="../types/ConversationData.js" />

import { ANCHOR_OPTIONS, ConversationTypes } from "../constants/index.js";
import { CreateOrEditParticipantForm } from "./CreateOrEditParticipantForm.js";
import { PullParticipantsFromSceneForm } from "./PullParticipantsFromSceneForm.js";
import {
  getActorDataFromDragEvent,
  moveInArray,
  processParticipantData,
  getConfirmationFromUser,
  activateConversationParticipantsListListeners,
} from "../helpers/index.js";
import { SelectParticipatingUsersFrom } from "./SelectParticipatingUsersFrom.js";

export class CollectiveConversationCreationForm extends FormApplication {
  // State variables
  /** @type {(conversationData: GMControlledConversationData) => void | undefined} } */
  #callbackFunction = undefined;

  /** @type {ParticipatingUserData[]} */
  #participatingUsers = [];
  #conversationBackground = "";

  // Drag and drop variables
  // dropzoneVisible = false;
  #isDraggingAParticipant = false;

  /**
   * TODO: Add JSDoc
   *
   * @param {(conversationData: GMControlledConversationData) => void} callbackFunction
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
      height: 800,
    });
  }

  getData() {
    for (const participatingUser of this.#participatingUsers) {
      for (const participant of participatingUser.participants) {
        processParticipantData(participant);
      }
    }

    return {
      isGM: game.user.isGM,
      type: ConversationTypes.Collective,
      conversationBackground: this.#conversationBackground,
      participatingUsers: this.#participatingUsers,
    };
  }

  activateListeners(html) {
    super.activateListeners(html);

    // Add participating users button
    html.find("#addParticipatingUsers").click(async (e) => {
      new SelectParticipatingUsersFrom((data) => this.#handleAddParticipatingUsers(data), {
        participatingUserIDs: this.#participatingUsers.map((item) => item.id),
      }).render(true);
    });

    // TODO: Add drag-and-drop functionality for participating users

    // Add listeners on all the control buttons present on the conversation participants
    const participatingUsersHTML = html.find("#conversationParticipatingUsersList")[0];
    if (participatingUsersHTML) {
      const participatingUsers = participatingUsersHTML.children;
      for (let index = 0; index < participatingUsers.length; index++) {
        const participatingUser = participatingUsers[index];

        // Collapse/expand button
        const accordionButton = participatingUser.querySelector("#accordionButton");
        const collapsibleWrapper = participatingUser.querySelector(".chud-collapsible-content-wrapper");
        accordionButton.onclick = () => {
          accordionButton.classList.toggle("chud-collapsed");
          collapsibleWrapper.classList.toggle("chud-collapsed");
        };

        // Pull scene actors button
        participatingUser.querySelector("#pullSceneActorsButton").onclick = async () => {
          const pullParticipantsFromSceneForm = new PullParticipantsFromSceneForm((data) => {
            for (const participant of data) {
              this.#handleAddParticipantToParticipatingUser(index, participant);
            }
          });
          return pullParticipantsFromSceneForm.render(true);
        };

        // TODO: Add owned actors button

        // Add participant button
        participatingUser.querySelector("#addParticipantButton").onclick = () => {
          const participantCreationForm = new CreateOrEditParticipantForm(false, (data) =>
            this.#handleAddParticipantToParticipatingUser(index, data)
          );
          return participantCreationForm.render(true);
        };

        // Remove participant button
        participatingUser.querySelector("#removeParticipatingUserButton").onclick = () => {
          getConfirmationFromUser("CHUD.dialogue.onRemoveParticipatingUser", () =>
            this.#handleRemoveParticipatingUsers(index)
          );
        };

        // Add listeners on all the control buttons present on the conversation participants
        const conversationParticipantsListHTML = participatingUser.querySelector("#conversationParticipantsList");
        if (conversationParticipantsListHTML) {
          activateConversationParticipantsListListeners({
            conversationParticipantsListHTML,
            handleDrop: (oldIndex, newIndex) => {
              // Reorder the array
              moveInArray(this.#participatingUsers[index].participants, oldIndex, newIndex);

              // Update active participant index
              const defaultActiveParticipantIndex = this.#participatingUsers[index].defaultActiveParticipant;
              if (defaultActiveParticipantIndex === oldIndex) {
                this.#participatingUsers[index].defaultActiveParticipant = newIndex;
              } else {
                if (defaultActiveParticipantIndex > oldIndex && defaultActiveParticipantIndex <= newIndex) {
                  this.#participatingUsers[index].defaultActiveParticipant -= 1;
                }
                if (defaultActiveParticipantIndex < oldIndex && defaultActiveParticipantIndex >= newIndex) {
                  this.#participatingUsers[index].defaultActiveParticipant += 1;
                }
              }

              // Update sheet
              this.render(false);
            },
            setIsDraggingAParticipant: (value) => (this.#isDraggingAParticipant = value),
            getParticipantData: (participantIndex) => this.#participatingUsers[index].participants[participantIndex],
            handleSetDefaultActiveParticipant: (participantIndex, event) =>
              this.#handleSetDefaultActiveParticipant(index, participantIndex, event),
            handleCloneParticipant: (participantIndex) => this.#handleCloneParticipant(index, participantIndex),
            handleEditParticipant: (participantIndex) => {
              const participant = this.#participatingUsers[index].participants[participantIndex];
              new CreateOrEditParticipantForm(
                true,
                (data) => this.#handleEditParticipant(index, participantIndex, data),
                {
                  name: participant.name,
                  displayName: participant.displayName,
                  img: participant.img,
                  imgScale: participant.imgScale,
                  linkedJournal: participant.linkedJournal,
                  linkedActor: participant.linkedActor,
                  faction: participant.faction,
                  anchorOptions: ANCHOR_OPTIONS,
                  portraitAnchor: participant.portraitAnchor,
                }
              ).render(true);
            },
            handleRemoveParticipant: (participantIndex) => this.#handleRemoveParticipant(index, participantIndex),
          });
        }
      }
    }
  }

  /**
   *
   * @param {*} event
   * @param {*} formData
   */
  async _updateObject(event, formData) {
    /** @type {CollectiveConversation} */
    const collectiveConversation = {
      data: {
        participatingUsers: this.#participatingUsers,
      },
      features: {
        isMinimized: false,
        isMinimizationLocked: false,
        isSpeakingAs: false,
        isBackgroundVisible: true,
      },
    };

    /** @type {GMControlledConversationData} */
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

    // TODO: Create participating user object through a reusable function
    const participatingUsers = filteredUsers.map((user) => {
      return {
        id: user.id,
        name: user.name,
        color: user.color,
        defaultActiveParticipant: undefined,
        participants: [],
      };
    });

    this.#participatingUsers.push(...participatingUsers);

    this.render(false);
  }

  #handleRemoveParticipatingUsers(index) {
    this.#participatingUsers.splice(index, 1);

    this.render(false);
  }

  #handleAddParticipantToParticipatingUser(index, data) {
    processParticipantData(data);
    this.#participatingUsers[index].participants.push(data);

    this.render(false);
  }

  #handleEditParticipant(participatingUserIndex, participantIndex, data) {
    processParticipantData(data);
    this.#participatingUsers[participatingUserIndex].participants[participantIndex] = data;

    this.render(false);
  }

  // TODO: Uncomment when drag-and-drop functionality for participating users is enabled
  // #handleReplaceAllParticipants(data) {
  //   const processedData = data.map((participant) => {
  //     processParticipantData(participant);
  //     return participant;
  //   });

  //   this.defaultActiveParticipant = undefined;
  //   this.participants = processedData;
  //   this.render(false);
  // }

  #handleRemoveParticipant(participatingUserIndex, participantIndex) {
    this.#participatingUsers[participatingUserIndex].participants.splice(participantIndex, 1);

    this.render(false);
  }

  #handleCloneParticipant(participatingUserIndex, participantIndex) {
    const clonedParticipant = this.#participatingUsers[participatingUserIndex].participants[participantIndex];
    this.#participatingUsers[participatingUserIndex].participants.push(clonedParticipant);

    this.render(false);
  }

  #handleSetDefaultActiveParticipant(participatingUserIndex, participantIndex, event) {
    if (!event.target) return;

    if (event.target.checked) {
      this.#participatingUsers[participatingUserIndex].defaultActiveParticipant = participantIndex;
    } else {
      this.#participatingUsers[participatingUserIndex].defaultActiveParticipant = undefined;
    }

    this.render(false);
  }
}
