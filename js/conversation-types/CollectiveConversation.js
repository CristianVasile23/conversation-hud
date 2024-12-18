/// <reference path="../types/ConversationData.js" />
/// <reference path="../types/GmControlledConversation/GmControlledConversationData.js" />

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
  /** @type {ConversationData | undefined} */
  #conversationData = undefined;

  /**
   * TODO: Finish JSDoc
   *
   * @param {ConversationData} conversationData
   */
  constructor(conversationData) {
    this.#conversationData = conversationData;
  }

  /**
   * TODO: Finish JSDoc
   */
  async createConversation() {
    // const conversationIsVisible = game.ConversationHud.conversationIsVisible;
    // // Parse all participants and update their data
    // for (let i = 0; i < this.#conversationData.conversation.data.participants.length; i++) {
    //   processParticipantData(this.#conversationData.conversation.data.participants[i]);
    // }
    // // Create background
    // const conversationBackground = createConversationBackgroundContainer(this.#conversationData, conversationIsVisible);
    // // Disable the background if the conversation is minimized
    // if (this.#conversationData.conversation.features.isMinimized) {
    //   conversationBackground.classList.remove("visible");
    // }
    // // Create the template for the ConversationHUD UI elements
    // const template = await this.#getConversationTemplate(this.#conversationData.conversation.data);
    // // Create the conversation container
    // const uiContainer = this.#createConversationContainer(template, conversationIsVisible);
    // // Attacher ConversationHUD UI elements to the other FoundryVTT UI elements
    // const body = document.body;
    // body.append(conversationBackground);
    // const uiBottom = document.getElementById("ui-bottom");
    // uiBottom.before(uiContainer);
    // // Render conversation controls
    // this.#updateConversationControls();
    // // After elements are rendered, render the active participant
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
    // /** @type {ConversationData} */
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
    // const body = document.body;
    // const conversationBackground = document.getElementById("active-conversation-background");
    // if (conversationBackground) {
    //   body.removeChild(conversationBackground);
    // }
    // const uiMiddle = document.getElementById("ui-middle");
    // const conversation = document.getElementById("ui-conversation-hud");
    // // TODO: Add check that uiMiddle exists
    // if (conversation) {
    //   uiMiddle.removeChild(conversation);
    // }
    // // Remove GM conversation controls
    // const uiInterface = document.getElementById("interface");
    // const controls = document.getElementById("ui-conversation-controls");
    // if (controls) {
    //   uiInterface.removeChild(controls);
    // }
  }

  /**
   *
   * @param {*} functionData
   */
  executeFunction(functionData) {
    switch (functionData.type) {
      default:
        // TODO: Log error
        break;
    }
  }

  // ------------- PRIVATE FUNCTIONS -------------
}
