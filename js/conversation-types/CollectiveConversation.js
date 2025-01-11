/// <reference path="../types/ConversationData.js" />

import { ANCHOR_OPTIONS, DRAG_AND_DROP_DATA_TYPES, MODULE_NAME } from "../constants/index.js";
import { ModuleSettings } from "../settings.js";
import {
  createConversationBackgroundContainer,
  checkIfCameraDockIsOnBottomOrTop,
  processParticipantData,
  checkIfUserIsGM,
  getConfirmationFromUser,
  showDragAndDropIndicator,
  hideDragAndDropIndicator,
  getDragAndDropIndex,
  moveInArray,
  getActorDataFromDragEvent,
} from "../helpers/index.js";
import {
  ChangeConversationBackgroundForm,
  CreateOrEditParticipantForm,
  PullParticipantsFromSceneForm,
} from "../forms/index.js";

export class CollectiveConversation {
  /** @type {CollectiveConversationObject | undefined} */
  #conversationData = undefined;

  #participatingUsersActiveParticipantMap = new Map();

  /**
   * TODO: Finish JSDoc
   *
   * @param {CollectiveConversationObject} conversationData
   */
  constructor(conversationData) {
    this.#conversationData = conversationData;
    for (const participatingUser of conversationData.conversation.data.participatingUsers) {
      this.#participatingUsersActiveParticipantMap.set(participatingUser.id, -1);
    }
  }

  /**
   * TODO: Finish JSDoc
   */
  async createConversation() {
    const conversationIsVisible = game.ConversationHud.conversationIsVisible;

    // TODO: Update the data of the participants

    // Create background
    const conversationBackground = createConversationBackgroundContainer(this.#conversationData, conversationIsVisible);

    // Create the template for the ConversationHUD UI elements
    const template = await this.#getConversationTemplate(this.#conversationData.conversation.data);

    // Create the conversation container
    const uiContainer = this.#createConversationContainer(template, conversationIsVisible);

    // Attacher ConversationHUD UI elements to the other FoundryVTT UI elements
    const body = document.body;
    body.append(conversationBackground);

    const uiBottom = document.getElementById("ui-bottom");
    uiBottom.before(uiContainer);

    // Render conversation controls
    // this.#updateConversationControls();

    // After elements are rendered, render the active participant
    // this.#changeActiveParticipant({ index: -1 });
  }

  /**
   * TODO: Finish JSDoc
   *
   * @param {boolean} isVisible
   */
  updateConversationVisibility(isVisible) {
    // const conversationHud = document.getElementById("ui-conversation-hud");
    // if (conversationHud) {
    //   if (isVisible) {
    //     conversationHud.classList.add("visible");
    //   } else {
    //     conversationHud.classList.remove("visible");
    //   }
    // }
    // const conversationBackground = document.getElementById("active-conversation-background");
    // if (conversationBackground) {
    //   if (isVisible) {
    //     if (!this.#conversationData.conversation.features.isMinimized) {
    //       conversationBackground.classList.add("visible");
    //     }
    //   } else {
    //     conversationBackground.classList.remove("visible");
    //   }
    // }
    // this.#updateConversationControls();
  }

  /**
   * TODO: Finish JSDoc
   */
  getConversation() {
    // const data = this.#conversationData.conversation.data;
    // const features = this.#conversationData.conversation.features;
    // /** @type {GMControlledConversationData} */
    // const conversationData = {
    //   type: this.#conversationData.type,
    //   background: this.#conversationData.background,
    //   conversation: {
    //     data: data,
    //     features: {
    //       ...features,
    //       // Since minimization is something that is also client-sided, we only get the minimization state
    //       // if the minimization is locked (and that means all clients should have the same minimization state)
    //       isMinimized: features.isMinimizationLocked ? features.isMinimized : false,
    //     },
    //   },
    // };
    // return conversationData;
  }

  /**
   * TODO: Finish JSDoc
   */
  async removeConversation() {
    const body = document.body;
    const conversationBackground = document.getElementById("active-conversation-background");
    if (conversationBackground) {
      body.removeChild(conversationBackground);
    }

    const uiMiddle = document.getElementById("ui-middle");
    const conversation = document.getElementById("ui-conversation-hud");
    // TODO: Add check that uiMiddle exists
    if (conversation) {
      uiMiddle.removeChild(conversation);
    }

    // Remove GM conversation controls
    const uiInterface = document.getElementById("interface");
    const controls = document.getElementById("ui-conversation-controls");
    if (controls) {
      uiInterface.removeChild(controls);
    }
  }

  /**
   *
   * @param {*} functionData
   */
  executeFunction(functionData) {
    switch (functionData.type) {
      case "change-active-participant":
        this.#changeActiveParticipant(functionData.data);
        break;
      default:
        // TODO: Log error
        break;
    }
  }

  // ------------- PRIVATE FUNCTIONS -------------
  /**
   * TODO: Finish JSDoc
   *
   * @param {*} data
   */
  #changeActiveParticipant(data) {
    const userIndex = data.userIndex;
    const userID = this.#conversationData.conversation.data.participatingUsers[userIndex].id;

    let participantIndex = data.participantIndex;
    if (this.#participatingUsersActiveParticipantMap.get(userID) === participantIndex) {
      participantIndex = -1;
    }

    this.#participatingUsersActiveParticipantMap.set(userID, participantIndex);
    this.#updateActiveParticipantImage(userIndex, participantIndex);
    // this.#updateParticipantsList(index);
  }

  /**
   * TODO: Finish JSDoc
   *
   * @param {CollectiveConversationData} conversationData
   * @returns {Promise<string>}
   */
  async #getConversationTemplate(conversationData) {
    return await renderTemplate("modules/conversation-hud/templates/conversations/collective/interface.hbs", {
      isGM: game.user.isGM,
      hasDock: checkIfCameraDockIsOnBottomOrTop(),

      participatingUsers: conversationData.participatingUsers,
      portraitStyle: game.settings.get(MODULE_NAME, ModuleSettings.portraitStyle),
      // displayParticipantsToPlayers: game.settings.get(MODULE_NAME, ModuleSettings.displayAllParticipantsToPlayers),
      activeParticipantFontSize: game.settings.get(MODULE_NAME, ModuleSettings.activeParticipantFontSize),
    });
  }

  /**
   * TODO: Finish JSDoc
   *
   * @param {string} htmlContent
   * @param {boolean} conversationIsVisible
   * @returns {HTMLDivElement}
   */
  #createConversationContainer(htmlContent, conversationIsVisible) {
    const element = document.createElement("div");
    element.id = "ui-conversation-hud";
    element.className = "chud-active-conversation-wrapper";

    if (conversationIsVisible) {
      element.classList.add("visible");
    }

    if (this.#conversationData.conversation.features.isMinimized) {
      element.classList.add("minimized");
    }

    element.innerHTML = htmlContent;

    // TODO: Activate drag and drop listened
    // this.#addDragAndDropListeners(element);

    return element;
  }

  async #updateActiveParticipantImage(userIndex, participantIndex) {
    const template = await renderTemplate(
      "modules/conversation-hud/templates/fragments/active-participant-content.hbs",
      {
        displayParticipant: participantIndex === -1 ? false : true,
        displayNoParticipantBox: game.settings.get(MODULE_NAME, ModuleSettings.displayNoParticipantBox),
        participant:
          participantIndex === -1
            ? null
            : this.#conversationData.conversation.data.participatingUsers[userIndex].participants[participantIndex],
        portraitStyle: game.settings.get(MODULE_NAME, ModuleSettings.portraitStyle),
        activeParticipantFontSize: game.settings.get(MODULE_NAME, ModuleSettings.activeParticipantFontSize),
        activeParticipantFactionFontSize: game.settings.get(
          MODULE_NAME,
          ModuleSettings.activeParticipantFactionFontSize
        ),
      }
    );

    const activeParticipantAnchorPoint = document.querySelector("#active-participant-anchor-point");
    console.log(activeParticipantAnchorPoint);
    // activeParticipantAnchorPoint.innerHTML = template;
  }
}
