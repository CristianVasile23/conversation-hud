/// <reference path="../types/ConversationData.js" />
/// <reference path="../types/GmControlledConversationData.js" />

import { MODULE_NAME } from "../constants/index.js";
import { ModuleSettings } from "../settings.js";
import { createConversationBackgroundContainer, checkIfCameraDockIsOnBottomOrTop, processParticipantData } from "../helpers/index.js";

export class GmControllerConversation {
  /** @type {ConversationData | undefined} */
  #conversationData = undefined;
  #conversationIsMinimized = false;
  #currentActiveParticipant = -1;

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
    const conversationIsVisible = game.ConversationHud.conversationIsVisible;

    // Parse all participants and update their data
    for (let i = 0; i < this.#conversationData.data.participants.length; i++) {
      processParticipantData(this.#conversationData.data.participants[i]);
    }

    console.log(this.#conversationData);

    // Create background
    const conversationBackground = createConversationBackgroundContainer(this.#conversationData, conversationIsVisible);

    // Create the template for the ConversationHUD UI elements
    const template = await this.#getConversationTemplate(this.#conversationData.data);

    // Create the conversation container
    const uiContainer = this.#createConversationContainer(template, conversationIsVisible);

    // Attacher ConversationHUD UI elements to the other FoundryVTT UI elements
    const body = document.body;
    body.append(conversationBackground);

    const uiBottom = document.getElementById("ui-bottom");
    uiBottom.before(uiContainer);

    // Render conversation controls
    //updateConversationControls();

    // After elements are rendered,
    this.changeActiveParticipant({ index: -1 });
  }

  /**
   * TODO: Finish JSDoc
   */
  async removeConversation() {
    const body = document.body;
    const conversationBackground = document.getElementById("conversation-hud-background");
    if (conversationBackground) {
      body.removeChild(conversationBackground);
    }

    const uiMiddle = document.getElementById("ui-middle");
    const conversation = document.getElementById("ui-conversation-hud");
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
   * TODO: Finish JSDoc
   *
   * @param {*} data
   */
  changeActiveParticipant(data) {
    let index = data.index;
    if (this.#currentActiveParticipant === index) {
      index = -1;
    }

    this.#currentActiveParticipant = index;
    this.#updateActiveParticipantImage(index);
    this.#updateParticipantsList(index);
  }

  // ------------- PRIVATE FUNCTIONS -------------
  /**
   * TODO: Finish JSDoc
   *
   * @param {GmControlledConversationData} conversationData
   * @returns {Promise<string>}
   */
  async #getConversationTemplate(conversationData) {
    return await renderTemplate("modules/conversation-hud/templates/conversation.hbs", {
      isGM: game.user.isGM,
      hasDock: checkIfCameraDockIsOnBottomOrTop(),
      participants: conversationData.participants,
      portraitStyle: game.settings.get(MODULE_NAME, ModuleSettings.portraitStyle),
      displayParticipantsToPlayers: game.settings.get(MODULE_NAME, ModuleSettings.displayAllParticipantsToPlayers),
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
    element.className = "conversation-hud-wrapper";

    if (conversationIsVisible) {
      element.classList.add("visible");
    }

    if (this.#conversationIsMinimized) {
      element.classList.add("minimized");
    }

    element.innerHTML = htmlContent;

    // TODO: Uncomment
    // game.ConversationHud.addDragDropListeners(element);

    return element;
  }

  async #updateActiveParticipantImage(index) {
    const template = await renderTemplate("modules/conversation-hud/templates/fragments/active_participant.hbs", {
      displayParticipant: index === -1 ? false : true,
      displayNoParticipantBox: game.settings.get(MODULE_NAME, ModuleSettings.displayNoParticipantBox),
      participant: index === -1 ? null : this.#conversationData.data.participants[index],
      portraitStyle: game.settings.get(MODULE_NAME, ModuleSettings.portraitStyle),
      activeParticipantFontSize: game.settings.get(MODULE_NAME, ModuleSettings.activeParticipantFontSize),
      activeParticipantFactionFontSize: game.settings.get(MODULE_NAME, ModuleSettings.activeParticipantFactionFontSize),
    });

    const activeParticipantAnchorPoint = document.querySelector("#active-participant-anchor-point");
    activeParticipantAnchorPoint.innerHTML = template;
  }

  #updateParticipantsList(index) {
    // Change active class of all other elements
    const conversationParticipants = document.getElementById("conversationParticipantList").children;
    if (conversationParticipants) {
      for (let i = 0; i < conversationParticipants.length; i++) {
        if (index === i) {
          conversationParticipants[i].classList.add("active");
        } else {
          conversationParticipants[i].classList.remove("active");
        }
      }
    }
  }
}
