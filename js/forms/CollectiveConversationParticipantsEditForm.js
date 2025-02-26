/// <reference path="../types/ParticipatingUserData.js" />
/// <reference path="../types/ConversationData.js" />

import { ANCHOR_OPTIONS } from "../constants/index.js";
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

export class CollectiveConversationParticipantsEditForm extends FormApplication {
  // State variables
  /** @type {(participatingUsers: ParticipatingUserData[]) => void | undefined} } */
  #callbackFunction = undefined;

  /** @type {ParticipatingUserData[]} */
  #participatingUsers = [];

  /** @type {Map<string, boolean>} */
  #minimizedSections = new Map();

  // Drag and drop variables
  #dropzoneVisible = false;
  #isDraggingAParticipant = false;

  /**
   * TODO: Add JSDoc
   *
   * @param {(participatingUsers: ParticipatingUserData[]) => void} callbackFunction
   * @param {ParticipatingUserData[]} participatingUsers
   */
  constructor(callbackFunction, participatingUsers) {
    super();
    this.#callbackFunction = callbackFunction;
    this.#participatingUsers = participatingUsers;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["form"],
      popOut: true,
      template: "modules/conversation-hud/templates/forms/edit-collective-conversation-participating-users-form.hbs",
      id: "collective-conversation-creation-form",
      title: game.i18n.localize("CHUD.actions.createConversation"),
      width: 685,
      height: 800,
      scrollY: [".chud-form-section.chud-form-content.chud-overflow-y-auto"],
    });
  }

  getData() {
    for (const participatingUser of this.#participatingUsers) {
      for (const participant of participatingUser.participants) {
        processParticipantData(participant);
      }

      // TODO: Dirty hack, make something better
      participatingUser.sectionIsMinimized = this.#minimizedSections.get(participatingUser.id);
    }

    return {
      isGM: game.user.isGM,
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

          const userID = this.#participatingUsers[index].id;
          const minimizationState = this.#minimizedSections.get(userID);
          this.#minimizedSections.set(userID, !minimizationState);
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
        // TODO: Remove
        // participatingUser.querySelector("#removeParticipatingUserButton").onclick = () => {
        //   getConfirmationFromUser("CHUD.dialogue.onRemoveParticipatingUser", () =>
        //     this.#handleRemoveParticipatingUsers(index)
        //   );
        // };

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
    this.#callbackFunction(this.#participatingUsers);
  }

  #handleAddParticipatingUsers(data) {
    const unaffectedUsers = data.unaffectedUsers;
    const addedUsers = data.addedUsers;

    const existingParticipatingUsers = unaffectedUsers.map(
      (userID) => this.#participatingUsers.find((user) => user.id === userID) ?? null
    );

    const users = game.users;
    const filteredUsers = users.filter((element) => addedUsers.includes(element.id));
    const newParticipatingUsers = filteredUsers.map((user) => {
      return {
        id: user.id,
        name: user.name,
        color: user.color,
        defaultActiveParticipant: undefined,
        participants: [],
      };
    });

    this.#participatingUsers = [...existingParticipatingUsers, ...newParticipatingUsers].sort(
      (userA, userB) => userA.id - userB.id
    );

    // Set minimization state only for new users (or previously removed ones)
    for (const userID of addedUsers) {
      this.#minimizedSections.set(userID, false);
    }

    this.render(false);
  }

  // TODO: Remove
  // #handleRemoveParticipatingUsers(index) {
  //   this.#participatingUsers.splice(index, 1);

  //   this.render(false);
  // }

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
