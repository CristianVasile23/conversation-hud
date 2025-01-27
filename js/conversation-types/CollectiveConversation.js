/// <reference path="../types/ConversationData.js" />
/// <reference path="../types/CollectiveConversation/CollectiveConversationCurrentState.js" />

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
  serializeActiveParticipantsMap,
  deserializeActiveParticipantsMap,
} from "../helpers/index.js";
import {
  ChangeConversationBackgroundForm,
  CreateOrEditParticipantForm,
  PullParticipantsFromSceneForm,
} from "../forms/index.js";

export class CollectiveConversation {
  /** @type {CollectiveConversationObject | undefined} */
  #conversationData = undefined;

  /** @type {Map<string, number>} */
  #participatingUsersActiveParticipantMap = new Map();

  /**
   * TODO: Finish JSDoc
   *
   * @param {CollectiveConversationObject} conversationData
   * @param {CollectiveConversationCurrentState} conversationCurrentState
   */
  constructor(conversationData, conversationCurrentState) {
    this.#conversationData = conversationData;
    for (const participatingUser of conversationData.conversation.data.participatingUsers) {
      this.#participatingUsersActiveParticipantMap.set(
        participatingUser.id,
        participatingUser.defaultActiveParticipant ?? -1
      );
    }

    if (conversationCurrentState) {
      this.#participatingUsersActiveParticipantMap = deserializeActiveParticipantsMap(
        conversationCurrentState.participatingUsersActiveParticipantMap
      );
    }
  }

  /**
   * TODO: Finish JSDoc
   */
  async createConversation() {
    const conversationIsVisible = game.ConversationHud.conversationIsVisible;

    // TODO: Create function that can be reused
    // Parse all participants and update their data
    for (
      let userIndex = 0;
      userIndex < this.#conversationData.conversation.data.participatingUsers.length;
      userIndex++
    ) {
      const participants = this.#conversationData.conversation.data.participatingUsers[userIndex].participants;
      for (let participantIndex = 0; participantIndex < participants.length; participantIndex++) {
        processParticipantData(participants[participantIndex]);
      }
    }

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
    this.#updateConversationControls();

    // After elements are rendered, render the active participant
    for (let i = 0; i < this.#conversationData.conversation.data.participatingUsers.length; i++) {
      const user = this.#conversationData.conversation.data.participatingUsers[i];
      this.#setActiveParticipant({
        userID: this.#conversationData.conversation.data.participatingUsers[i].id,
        participantIndex: this.#participatingUsersActiveParticipantMap.get(user.id),
      });
    }
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
    const conversationBackground = document.getElementById("active-conversation-background");
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

    /** @type {CollectiveConversationData} */
    const conversationData = {
      type: this.#conversationData.type,
      background: this.#conversationData.background,
      conversation: {
        data: data,
        features: {
          // TODO: On get, here, send default params for other client-sided settings
          ...features,
          // Since minimization is something that is also client-sided, we only get the minimization state
          // if the minimization is locked (and that means all clients should have the same minimization state)
          // isMinimized: features.isMinimizationLocked ? features.isMinimized : false,
        },
      },
    };

    /** @type {CollectiveConversationCurrentState} */
    const conversationCurrentState = {
      participatingUsersActiveParticipantMap: serializeActiveParticipantsMap(
        this.#participatingUsersActiveParticipantMap
      ),
    };

    return { conversationData, conversationCurrentState };
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
      case "update-conversation":
        this.#updateConversation(functionData.data);
        break;
      case "add-participant":
        this.#addParticipant(functionData.data);
        break;
      case "set-active-participant":
        this.#setActiveParticipant(functionData.data);
        break;
      case "change-active-participant":
        this.#changeActiveParticipant(functionData.data);
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
    for (
      let userIndex = 0;
      userIndex < this.#conversationData.conversation.data.participatingUsers.length;
      userIndex++
    ) {
      const participants = this.#conversationData.conversation.data.participatingUsers[userIndex].participants;
      for (let participantIndex = 0; participantIndex < participants.length; participantIndex++) {
        processParticipantData(participants[participantIndex]);
      }
    }

    // Add rendered template to the conversation hud
    const chudInterface = document.getElementById("ui-conversation-hud");
    if (chudInterface) {
      // Create the template for the ConversationHUD UI elements
      const template = await this.#getConversationTemplate(this.#conversationData.conversation.data);

      chudInterface.innerHTML = template;

      for (
        let userIndex = 0;
        userIndex < this.#conversationData.conversation.data.participatingUsers.length;
        userIndex++
      ) {
        this.#setActiveParticipant({
          userID: this.#conversationData.conversation.data.participatingUsers[userIndex].id,
          participantIndex: this.#participatingUsersActiveParticipantMap.get(
            this.#conversationData.conversation.data.participatingUsers[userIndex].id
          ),
        });
      }
    }
  }

  /**
   * TODO: Finish JSDoc
   *
   * @param {*} data
   */
  #changeActiveParticipant(data) {
    const userID = data.userID;
    let participantIndex = data.participantIndex;

    if (this.#participatingUsersActiveParticipantMap.get(userID) === participantIndex) {
      participantIndex = -1;
    }

    this.#participatingUsersActiveParticipantMap.set(userID, participantIndex);
    this.#updateActiveParticipantImage(userID, participantIndex);

    if (game.user.id === userID) {
      this.#updateParticipantsList(participantIndex);
    }
  }

  /**
   * TODO: Finish JSDoc
   *
   * @param {*} data
   */
  #setActiveParticipant(data) {
    const userID = data.userID;
    let participantIndex = data.participantIndex;
    this.#participatingUsersActiveParticipantMap.set(userID, participantIndex);
    this.#updateActiveParticipantImage(userID, participantIndex);

    if (game.user.id === userID) {
      this.#updateParticipantsList(participantIndex);
    }
  }

  /**
   * TODO: Finish JSDoc
   */
  #toggleSpeakingAs() {
    if (game.settings.get(MODULE_NAME, ModuleSettings.enableSpeakAs)) {
      if (game.ConversationHud.conversationIsActive) {
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
    const backgroundContainer = document.getElementById("active-conversation-background");
    if (backgroundContainer) {
      if (background) {
        backgroundContainer.classList.add("chud-active-conversation-background-image");
        backgroundContainer.style.backgroundImage = `url(${background})`;
      } else {
        backgroundContainer.classList.remove("chud-active-conversation-background-image");
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

    const conversationBackground = document.getElementById("active-conversation-background");
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
   *
   * @param {CollectiveConversationData} conversationData
   * @returns {Promise<string>}
   */
  async #getConversationTemplate(conversationData) {
    const currentUserID = game.user.id;
    const currentParticipatingUserData = conversationData.participatingUsers.find((user) => user.id === currentUserID);

    return await renderTemplate("modules/conversation-hud/templates/conversations/collective/interface.hbs", {
      isGM: game.user.isGM,
      hasDock: checkIfCameraDockIsOnBottomOrTop(),

      currentParticipatingUserData: currentParticipatingUserData,
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

  /**
   * TODO: Finish JSDoc
   *
   * @param {*} data
   */
  #addParticipant(data) {
    const userID = data.userID;
    const userIndex = this.#conversationData.conversation.data.participatingUsers.findIndex(
      (user) => user.id === userID
    );

    // TODO: Check if user has rights to add participant
    // if (!checkIfUserIsGM()) {
    //   // TODO: Log error in console
    //   return;
    // }

    new CreateOrEditParticipantForm(false, (data) => this.#addParticipantHelper(data, userIndex)).render(true);
  }

  /**
   * TODO: Finish JSDoc
   *
   * @param {ParticipantData} participantData
   * @param {number} userIndex
   */
  #addParticipantHelper(participantData, userIndex) {
    processParticipantData(participantData);

    // Add the newly created participant to the list of participants for that specific user
    this.#conversationData.conversation.data.participatingUsers[userIndex].participants.push(participantData);

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
   */
  async #updateConversationControls() {
    // Get the HTML elements
    const uiInterface = document.getElementById("interface");
    const controls = document.getElementById("ui-conversation-controls");

    // Remove the old controls if they exist
    if (controls) {
      uiInterface.removeChild(controls);
    }

    const conversationControls = await renderTemplate(
      "modules/conversation-hud/templates/conversations/collective/controls.hbs",
      {
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
      }
    );

    const updatedControls = document.createElement("section");
    updatedControls.id = "ui-conversation-controls";
    updatedControls.setAttribute("data-tooltip-direction", "LEFT");
    updatedControls.innerHTML = conversationControls;

    const uiRight = document.getElementById("ui-right");
    uiRight.before(updatedControls);
  }

  async #updateActiveParticipantImage(userID, participantIndex) {
    const userIndex = this.#conversationData.conversation.data.participatingUsers.findIndex(
      (user) => user.id === userID
    );

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

    const activeParticipantAnchorPoint = document.querySelector(`#active-participant-anchor-point-${userIndex}`);
    activeParticipantAnchorPoint.innerHTML = template;
  }

  /**
   * TODO: Finish JSDoc
   *
   * @param {*} activeParticipantIndex
   */
  #updateParticipantsList(activeParticipantIndex) {
    // Change active class of all other elements
    const conversationParticipants = document.getElementById("selectable-participants-list").children;
    if (conversationParticipants) {
      for (let i = 0; i < conversationParticipants.length; i++) {
        const entryElement = conversationParticipants[i].getElementsByClassName("chud-content")[0];
        if (activeParticipantIndex === i) {
          entryElement?.classList.add("chud-active");
        } else {
          entryElement?.classList.remove("chud-active");
        }
      }
    }
  }
}
