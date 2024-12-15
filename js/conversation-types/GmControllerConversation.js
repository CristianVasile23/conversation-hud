/// <reference path="../types/ConversationData.js" />
/// <reference path="../types/GmControlledConversation/GmControlledConversationData.js" />

import { ANCHOR_OPTIONS, MODULE_NAME } from "../constants/index.js";
import { ModuleSettings } from "../settings.js";
import {
  createConversationBackgroundContainer,
  checkIfCameraDockIsOnBottomOrTop,
  processParticipantData,
  checkIfUserIsGM,
  getConfirmationFromUser,
} from "../helpers/index.js";
import {
  ChangeConversationBackgroundForm,
  CreateOrEditParticipantForm,
  PullParticipantsFromSceneForm,
} from "../forms/index.js";

export class GmControllerConversation {
  /** @type {ConversationData | undefined} */
  #conversationData = undefined;

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
    for (let i = 0; i < this.#conversationData.conversation.data.participants.length; i++) {
      processParticipantData(this.#conversationData.conversation.data.participants[i]);
    }

    // Create background
    const conversationBackground = createConversationBackgroundContainer(this.#conversationData, conversationIsVisible);

    // Disable the background if the conversation is minimized
    if (this.#conversationData.conversation.features.isMinimized) {
      conversationBackground.classList.remove("visible");
    }

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
    this.#updateConversationControls();

    // After elements are rendered, render the active participant
    this.#changeActiveParticipant({ index: -1 });
  }

  /**
   * TODO: Finish JSDoc
   *
   * @param {boolean} isVisible
   */
  updateConversationVisibility(isVisible) {
    const conversationHud = document.getElementById("ui-conversation-hud");
    if (conversationHud) {
      if (isVisible) {
        conversationHud.classList.add("visible");
      } else {
        conversationHud.classList.remove("visible");
      }
    }

    const conversationBackground = document.getElementById("conversation-hud-background");
    if (conversationBackground) {
      if (isVisible) {
        if (!this.#conversationData.conversation.features.isMinimized) {
          conversationBackground.classList.add("visible");
        }
      } else {
        conversationBackground.classList.remove("visible");
      }
    }

    this.#updateConversationControls();
  }

  /**
   * TODO: Finish JSDoc
   */
  getConversation() {
    const data = this.#conversationData.conversation.data;
    const features = this.#conversationData.conversation.features;

    /** @type {ConversationData} */
    const conversationData = {
      type: this.#conversationData.type,
      background: this.#conversationData.background,
      conversation: {
        data: data,
        features: {
          ...features,

          // Since minimization is something that is also client-sided, we only get the minimization state
          // if the minimization is locked (and that means all clients should have the same minimization state)
          isMinimized: features.isMinimizationLocked ? features.isMinimized : false,
        },
      },
    };

    return conversationData;
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
      case "update-conversation":
        this.#updateConversation(functionData.data);
        break;
      case "add-participant":
        this.#addParticipant();
        break;
      case "edit-participant":
        this.#editParticipant(functionData.data);
        break;
      case "remove-participant":
        this.#removeParticipant(functionData.data);
        break;
      case "change-active-participant":
        this.#changeActiveParticipant(functionData.data);
        break;
      case "toggle-minimize":
        this.#toggleMinimze();
        break;
      case "set-minimization":
        this.#setMinimization(functionData.data);
        break;
      case "toggle-lock-minimization":
        this.#toggleLockMinimization();
        break;
      case "set-lock-minimization":
        this.#setLockMinimization(functionData.data);
        break;
      case "toggle-speaking-as":
        this.#toggleSpeakingAs();
        break;
      case "update-background":
        this.#updateBackground(functionData.data);
        break;
      case "change-background":
        this.#changeBackground();
        break;
      case "toggle-background":
        this.#toggleBackground();
        break;
      case "set-background-visibility":
        this.#setBackgroundVisibility(functionData.data);
        break;
      case "pull-participants-from-scene":
        this.#pullParticipantsFromScene();
      default:
        // TODO: Log error
        break;
    }
  }

  // ------------- PRIVATE FUNCTIONS -------------
  /**
   * TODO: Finish JSDoc
   *
   * @param {*} conversationData
   */
  async #updateConversation(conversationData) {
    this.#conversationData = conversationData;

    // Parse all participants and update their data
    for (let i = 0; i < this.#conversationData.conversation.data.participants.length; i++) {
      processParticipantData(this.#conversationData.conversation.data.participants[i]);
    }

    // Create the template for the ConversationHUD UI elements
    const template = await this.#getConversationTemplate(this.#conversationData.conversation.data);

    // Add rendered template to the conversation hud
    const conversationHud = document.getElementById("ui-conversation-hud");
    if (conversationHud) {
      conversationHud.innerHTML = template;
      // game.ConversationHud.addDragDropListeners(conversationHud);
      this.#changeActiveParticipant({ index: this.#currentActiveParticipant });
    }
  }

  /**
   * TODO: Finish JSDoc
   */
  #addParticipant() {
    if (!checkIfUserIsGM()) {
      // TODO: Log error in console
      return;
    }

    new CreateOrEditParticipantForm(false, (data) => this.#addParticipantHelper(data)).render(true);
  }

  /**
   *
   * @param {ParticipantData} participantData
   */
  #addParticipantHelper(participantData) {
    processParticipantData(participantData);

    // Add the newly created participant to the list of participants
    this.#conversationData.conversation.data.participants.push(participantData);

    // Update the conversation for all connected players
    game.ConversationHud.executeFunction({
      scope: "everyone",
      type: "update-conversation",
      data: {
        ...this.#conversationData,
      },
    });
  }

  /**
   *
   * @param {ParticipantData[]} participants
   */
  #addParticipantsHelper(participants) {
    for (const participant of participants) {
      processParticipantData(participant);

      // Add the newly created participant to the list of participants
      this.#conversationData.conversation.data.participants.push(participant);
    }

    // Update the conversation for all connected players
    game.ConversationHud.executeFunction({
      scope: "everyone",
      type: "update-conversation",
      data: {
        ...this.#conversationData,
      },
    });
  }

  /**
   * TODO: Finish JSDoc
   *
   * @param {*} data
   */
  #editParticipant(data) {
    if (!checkIfUserIsGM()) {
      // TODO: Log error in console
      return;
    }

    let index = data.index;
    if (index < 0 || this.#conversationData.conversation.data.participants.length < index) {
      console.error("ConversationHUD | Tried to update a participant with an invalid index");
      return;
    }

    const participant = this.#conversationData.conversation.data.participants[index];
    new CreateOrEditParticipantForm(true, (data) => this.#editParticipantHelper(data, index), {
      ...participant,
      anchorOptions: ANCHOR_OPTIONS,
    }).render(true);
  }

  /**
   * TODO: Finish JSDoc
   *
   * @param {ParticipantData} participantData
   * @param {number} index
   */
  #editParticipantHelper(participantData, index) {
    processParticipantData(participantData);

    // Update participant with the given index
    this.#conversationData.conversation.data.participants[index] = participantData;

    // Update the conversation for all connected players
    game.ConversationHud.executeFunction({
      scope: "everyone",
      type: "update-conversation",
      data: {
        ...this.#conversationData,
      },
    });
  }

  /**
   * TODO: Finish JSDoc
   *
   * @param {*} data
   */
  #removeParticipant(data) {
    if (!checkIfUserIsGM()) {
      // TODO: Log error in console
      return;
    }

    let index = data.index;
    if (index < 0 || this.#conversationData.conversation.data.participants.length < index) {
      console.error("ConversationHUD | Tried to update a participant with an invalid index");
      return;
    }

    getConfirmationFromUser("CHUD.dialogue.onRemoveParticipant", () => this.#removeParticipantHelper(index));
  }

  /**
   * TODO: Finish JSDoc
   *
   * @param {*} index
   */
  #removeParticipantHelper(index) {
    // Check to see if the removed participant is the active one
    // Otherwise, check to see if the removed participant is before the active one, in which case
    // we need to update the active participant index by lowering it by one
    if (this.#currentActiveParticipant === index) {
      this.#currentActiveParticipant = -1;
    } else if (index < this.#currentActiveParticipant) {
      this.#currentActiveParticipant = -1;
    }

    // Remove participant with the given index
    this.#conversationData.conversation.data.participants.splice(index, 1);

    // Update the conversation for all connected players
    game.ConversationHud.executeFunction({
      scope: "everyone",
      type: "update-conversation",
      data: {
        ...this.#conversationData,
      },
    });
  }

  /**
   * TODO: Finish JSDoc
   *
   * @param {*} data
   */
  #changeActiveParticipant(data) {
    let index = data.index;
    if (this.#currentActiveParticipant === index) {
      index = -1;
    }

    this.#currentActiveParticipant = index;
    this.#updateActiveParticipantImage(index);
    this.#updateParticipantsList(index);
  }

  /**
   * TODO: Finish JSDoc
   */
  #toggleMinimze() {
    if (game.settings.get(MODULE_NAME, ModuleSettings.enableMinimize)) {
      if (game.ConversationHud.conversationIsActive) {
        if (this.#conversationData.conversation.features.isMinimizationLocked) {
          game.ConversationHud.executeFunction({
            scope: "everyone",
            type: "set-minimization",
            data: {
              isMinimized: !this.#conversationData.conversation.features.isMinimized,
            },
          });
        } else {
          this.#conversationData.conversation.features.isMinimized =
            !this.#conversationData.conversation.features.isMinimized;
          this.#updateLayout();
        }
      }
    } else {
      ui.notifications.error(game.i18n.localize("CHUD.errors.featureNotEnabled"));
    }
  }

  /**
   * TODO: Finish JSDoc
   *
   * @param {*} data
   */
  #setMinimization(data) {
    const isMinimized = data.isMinimized;

    if (game.settings.get(MODULE_NAME, ModuleSettings.enableMinimize)) {
      if (game.ConversationHud.conversationIsActive) {
        this.#conversationData.conversation.features.isMinimized = isMinimized;
        this.#updateLayout();
      }
    }
  }

  #toggleLockMinimization() {
    // TODO: Add check to see if GM
    if (game.settings.get(MODULE_NAME, ModuleSettings.enableMinimize)) {
      if (game.ConversationHud.conversationIsActive) {
        this.#conversationData.conversation.features.isMinimizationLocked =
          !this.#conversationData.conversation.features.isMinimizationLocked;

        // Update minimization state for all other players
        game.ConversationHud.executeFunction({
          scope: "everyone",
          type: "set-lock-minimization",
          data: {
            isMinimized: this.#conversationData.conversation.features.isMinimized,
            isMinimizationLocked: this.#conversationData.conversation.features.isMinimizationLocked,
          },
        });
      }
    } else {
      ui.notifications.error(game.i18n.localize("CHUD.errors.featureNotEnabled"));
    }
  }

  #setLockMinimization(data) {
    const isMinimized = data.isMinimized;
    const isMinimizationLocked = data.isMinimizationLocked;

    if (game.settings.get(MODULE_NAME, ModuleSettings.enableMinimize)) {
      if (game.ConversationHud.conversationIsActive) {
        this.#conversationData.conversation.features.isMinimized = isMinimized;
        this.#conversationData.conversation.features.isMinimizationLocked = isMinimizationLocked;
        this.#updateLayout();
      }
    }
  }

  /**
   * TODO: Finish JSDoc
   */
  #toggleSpeakingAs() {
    if (game.settings.get(MODULE_NAME, ModuleSettings.enableSpeakAs)) {
      if (checkIfUserIsGM() && game.ConversationHud.conversationIsActive) {
        this.#conversationData.conversation.features.isSpeakingAs =
          !this.#conversationData.conversation.features.isSpeakingAs;
        this.#updateConversationControls();
      }
    } else {
      ui.notifications.error(game.i18n.localize("CHUD.errors.featureNotEnabled"));
    }
  }

  /**
   * TODO: Finish JSDoc
   */
  async #updateBackground(data) {
    const background = data.background;
    const backgroundContainer = document.getElementById("conversation-hud-background");
    if (backgroundContainer) {
      if (background) {
        backgroundContainer.classList.add("conversation-hud-background-image");
        backgroundContainer.style.backgroundImage = `url(${background})`;
      } else {
        backgroundContainer.classList.remove("conversation-hud-background-image");
        backgroundContainer.style.backgroundImage = ``;
      }
    }
  }

  /**
   * TODO: Finish JSDoc
   */
  #changeBackground() {
    if (!checkIfUserIsGM()) {
      // TODO: Log error in console
      return;
    }

    new ChangeConversationBackgroundForm(
      (data) => this.#changeBackgroundHelper(data),
      this.#conversationData.background
    ).render(true);
  }

  /**
   *
   * @param {*} data
   */
  #changeBackgroundHelper(data) {
    this.#conversationData.background = data.conversationBackground;

    // Update the conversation for all connected players
    game.ConversationHud.executeFunction({
      scope: "everyone",
      type: "update-background",
      data: {
        background: this.#conversationData.background,
      },
    });
  }

  /**
   * TODO: Finish JSDoc
   */
  #toggleBackground() {
    this.#conversationData.conversation.features.isBackgroundVisible =
      !this.#conversationData.conversation.features.isBackgroundVisible;

    // Update the conversation for all connected players
    game.ConversationHud.executeFunction({
      scope: "everyone",
      type: "set-background-visibility",
      data: {
        isBackgroundVisible: this.#conversationData.conversation.features.isBackgroundVisible,
      },
    });
  }

  /**
   * TODO: Finish JSDoc
   *
   * @param {*} data
   */
  #setBackgroundVisibility(data) {
    const isBackgroundVisible = data.isBackgroundVisible;

    const conversationBackground = document.getElementById("conversation-hud-background");
    if (isBackgroundVisible) {
      conversationBackground.style.display = "";
    } else {
      conversationBackground.style.display = "none";
    }

    if (game.user.isGM) {
      this.#updateConversationControls();
    }
  }

  /**
   * TODO: Finish JSDoc
   */
  #pullParticipantsFromScene() {
    new PullParticipantsFromSceneForm((data) => this.#addParticipantsHelper(data)).render(true);
  }

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

    if (this.#conversationData.conversation.features.isMinimized) {
      element.classList.add("minimized");
    }

    element.innerHTML = htmlContent;

    // TODO: Uncomment
    // game.ConversationHud.addDragDropListeners(element);

    return element;
  }

  async #updateConversationControls() {
    // Get the HTML elements
    const uiInterface = document.getElementById("interface");
    const controls = document.getElementById("ui-conversation-controls");

    // Remove the old controls if they exist
    if (controls) {
      uiInterface.removeChild(controls);
    }

    const conversationControls = await renderTemplate("modules/conversation-hud/templates/conversation_controls.hbs", {
      isGM: game.user.isGM,
      isVisible: game.ConversationHud.conversationIsVisible,

      isMinimized: this.#conversationData.conversation.features.isMinimized,
      isMinimizationLocked: this.#conversationData.conversation.features.isMinimizationLocked,
      isSpeakingAs: this.#conversationData.conversation.features.isSpeakingAs,
      isBackgroundVisible: this.#conversationData.conversation.features.isBackgroundVisible,

      features: {
        minimizeEnabled: game.settings.get(MODULE_NAME, ModuleSettings.enableMinimize),
        speakAsEnabled: game.settings.get(MODULE_NAME, ModuleSettings.enableSpeakAs),
      },
    });

    const updatedControls = document.createElement("section");
    updatedControls.id = "ui-conversation-controls";
    updatedControls.setAttribute("data-tooltip-direction", "LEFT");
    updatedControls.innerHTML = conversationControls;

    const uiRight = document.getElementById("ui-right");
    uiRight.before(updatedControls);
  }

  async #updateActiveParticipantImage(index) {
    const template = await renderTemplate(
      "modules/conversation-hud/templates/fragments/active-participant-content.hbs",
      {
        displayParticipant: index === -1 ? false : true,
        displayNoParticipantBox: game.settings.get(MODULE_NAME, ModuleSettings.displayNoParticipantBox),
        participant: index === -1 ? null : this.#conversationData.conversation.data.participants[index],
        portraitStyle: game.settings.get(MODULE_NAME, ModuleSettings.portraitStyle),
        activeParticipantFontSize: game.settings.get(MODULE_NAME, ModuleSettings.activeParticipantFontSize),
        activeParticipantFactionFontSize: game.settings.get(
          MODULE_NAME,
          ModuleSettings.activeParticipantFactionFontSize
        ),
      }
    );

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

  #updateLayout() {
    // Update the layout
    const conversationHud = document.getElementById("ui-conversation-hud");
    if (this.#conversationData.conversation.features.isMinimized) {
      conversationHud.classList.add("minimized");
    } else {
      conversationHud.classList.remove("minimized");
    }

    if (game.ConversationHud.conversationIsVisible) {
      const conversationBackground = document.getElementById("conversation-hud-background");
      if (this.#conversationData.conversation.features.isMinimized) {
        conversationBackground.classList.remove("visible");
      } else {
        conversationBackground.classList.add("visible");
      }
    }

    this.#updateConversationControls();
  }
}
