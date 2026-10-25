/// <reference path="../types/ParticipatingUserData.js" />
/// <reference path="../types/ConversationData.js" />

import { ANCHOR_OPTIONS } from "../constants/index.js";
import { CreateOrEditParticipantForm } from "./CreateOrEditParticipantForm.mjs";
import { PullParticipantsFromSceneForm } from "./PullParticipantsFromSceneForm.mjs";
import {
  moveInArray,
  processParticipantData,
  activateConversationParticipantsListListeners,
} from "../helpers/index.js";
import { SelectParticipatingUsersFrom } from "./SelectParticipatingUsersFrom.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class CollectiveConversationParticipantsEditForm extends HandlebarsApplicationMixin(ApplicationV2) {
  /** @type {(participatingUsers: ParticipatingUserData[]) => void | undefined} } */
  #callbackFunction = undefined;

  /** @type {ParticipatingUserData[]} */
  #participatingUsers = [];

  /** @type {Map<string, boolean>} */
  #minimizedSections = new Map();

  #isDraggingAParticipant = false;

  /**
   * @param {(participatingUsers: ParticipatingUserData[]) => void} callbackFunction
   * @param {ParticipatingUserData[]} participatingUsers
   */
  constructor(callbackFunction, participatingUsers) {
    super();
    this.#callbackFunction = callbackFunction;
    this.#participatingUsers = participatingUsers;
  }

  static DEFAULT_OPTIONS = {
    id: "collective-conversation-participants-edit-form",
    classes: ["form"],
    tag: "form",
    window: {
      contentClasses: ["standard-form"],
      title: "CHUD.actions.createConversation",
    },
    form: {
      handler: this.#handleSubmit,
      closeOnSubmit: true,
    },
    position: {
      width: 685,
      height: 800,
    },
  };

  static PARTS = {
    body: {
      template: "modules/conversation-hud/templates/forms/edit-collective-conversation-participating-users-form.hbs",
      scrollable: [".chud-form-content"],
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
        icon: "fa-solid fa-check",
        label: "CHUD.actions.editParticipatingUsers",
      },
    ];

    for (const participatingUser of this.#participatingUsers) {
      for (const participant of participatingUser.participants) {
        processParticipantData(participant);
      }
      participatingUser.sectionIsMinimized = this.#minimizedSections.get(participatingUser.id);
    }

    return {
      isGM: game.user.isGM,
      participatingUsers: this.#participatingUsers,
      ...context,
    };
  }

  _onRender(context, options) {
    super._onRender(context, options);

    const html = this.element;

    html.querySelector("#addParticipatingUsers").addEventListener("click", () => {
      new SelectParticipatingUsersFrom((data) => this.#handleAddParticipatingUsers(data), {
        participatingUserIDs: this.#participatingUsers.map((item) => item.id),
      }).render(true);
    });

    const participatingUsersHTML = html.querySelector("#conversationParticipatingUsersList");
    if (participatingUsersHTML) {
      const participatingUsers = participatingUsersHTML.children;
      for (let index = 0; index < participatingUsers.length; index++) {
        const participatingUser = participatingUsers[index];

        const accordionButton = participatingUser.querySelector("#accordionButton");
        const collapsibleWrapper = participatingUser.querySelector(".chud-collapsible-content-wrapper");
        accordionButton.addEventListener("click", () => {
          accordionButton.classList.toggle("chud-collapsed");
          collapsibleWrapper.classList.toggle("chud-collapsed");

          const userID = this.#participatingUsers[index].id;
          const minimizationState = this.#minimizedSections.get(userID);
          this.#minimizedSections.set(userID, !minimizationState);
        });

        participatingUser.querySelector("#pullSceneActorsButton").addEventListener("click", () => {
          new PullParticipantsFromSceneForm((data) => {
            for (const participant of data) {
              this.#handleAddParticipantToParticipatingUser(index, participant);
            }
          }).render(true);
        });

        participatingUser.querySelector("#addParticipantButton").addEventListener("click", () => {
          new CreateOrEditParticipantForm(false, (data) =>
            this.#handleAddParticipantToParticipatingUser(index, data)
          ).render(true);
        });

        const conversationParticipantsListHTML = participatingUser.querySelector("#conversationParticipantsList");
        if (conversationParticipantsListHTML) {
          activateConversationParticipantsListListeners({
            conversationParticipantsListHTML,
            handleDrop: (oldIndex, newIndex) => {
              moveInArray(this.#participatingUsers[index].participants, oldIndex, newIndex);

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

  static async #handleSubmit(event, form, formData) {
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

    for (const userID of addedUsers) {
      this.#minimizedSections.set(userID, false);
    }

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
