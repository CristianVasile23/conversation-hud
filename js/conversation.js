/// <reference path="./types/ConversationData.js" />

import { socket } from "./init.js";
import { ConversationCreationForm } from "./forms/index.js";
import { checkIfUserIsGM, getConfirmationFromUser } from "./helpers/index.js";
import { ConversationFactionSheet } from "./sheets/index.js";
import { CONVERSATION_TYPES, MODULE_NAME } from "./constants/index.js";
import { ModuleSettings } from "./settings.js";
import { GmControllerConversation } from "./conversation-types/GmControllerConversation.js";

export class ConversationHud {
  conversationIsActive = false;
  conversationIsVisible = false;
  activeConversation = undefined;

  // conversationIsMinimized = false;

  // conversationIsSpeakingAs = false;
  // conversationIsBlurred = true;

  // /** @type {ConversationData} */
  // conversationData = undefined;

  // dropzoneVisible = false;
  // draggingParticipant = false;

  constructor() {
    // Register socket hooks
    this.registerSocketFunctions();
  }

  /**
   * Function that registers all socket functions that are used by CHUD.
   */
  registerSocketFunctions() {
    // Wait for the socket to be initialized (if it hasn't been already)
    if (socket) {
      socket.register("createConversation", this.createConversation);
      socket.register("removeConversation", this.removeConversation);
      // socket.register("getActiveConversation", this.getActiveConversation);

      // socket.register("updateActiveConversation", this.updateActiveConversation);

      socket.register("executeFunction", this.#executeFunctionHelper);

      // socket.register("toggleConversationBackground", this.toggleConversationBackground);

      // socket.register("setConversationHudVisibility", this.setConversationHudVisibility);

      // socket.register("getActiveConversationVisibility", this.getActiveConversationVisibility);

      socket.register("setActivateConversationHudButtonState", this.setActivateConversationHudButtonState);
    } else {
      setTimeout(this.registerSocketFunctions, 250);
    }
  }

  /**
   * Function that displays the ConversationHUD UI
   *
   * @param {ConversationData} conversationData TODO
   * @param {boolean} conversationIsVisible TODO
   */
  async createConversation(conversationData, conversationIsVisible) {
    // Set conversation data
    game.ConversationHud.conversationIsActive = true;
    game.ConversationHud.conversationIsVisible = conversationIsVisible;

    switch (conversationData.type) {
      case CONVERSATION_TYPES.GM_CONTROLLED:
        game.ConversationHud.activeConversation = new GmControllerConversation(conversationData);
        break;

      default:
        // TODO: Handle error case
        break;
    }

    game.ConversationHud.activeConversation.createConversation();
  }

  /**
   * Function the ConversationHUD UI
   */
  async removeConversation() {
    game.ConversationHud.conversationIsActive = false;
    game.ConversationHud.conversationIsVisible = false;
    game.ConversationHud.activeConversation.removeConversation();
    game.ConversationHud.activeConversation = undefined;
  }

  /**
   * Function that either triggers the conversation creation form, or removes the active conversation
   *
   * @param {boolean} shouldCreateConversation
   */
  async onToggleConversation(shouldCreateConversation) {
    if (checkIfUserIsGM()) {
      if (shouldCreateConversation) {
        if (!game.ConversationHud.conversationIsActive) {
          // Set button active status to false until a successful form has been completed
          ui.controls.controls
            .find((controls) => controls.name === "notes")
            .tools.find((tools) => tools.name === "activateHud").active = false;

          // Create form
          new ConversationCreationForm().render(true);
        } else {
          ui.notifications.error(game.i18n.localize("CHUD.errors.conversationAlreadyActive"));
        }
      } else {
        if (game.ConversationHud.conversationIsActive) {
          socket.executeForEveryone("removeConversation");
          socket.executeForAllGMs("setActivateConversationHudButtonState", false);
        } else {
          ui.notifications.error(game.i18n.localize("CHUD.errors.noActiveConversation"));
        }
      }
    }
  }

  /**
   * TODO: Add JSDoc documentation
   *
   * @param {boolean} state
   */
  setActivateConversationHudButtonState(state) {
    ui.controls.controls.find((controls) => controls.name === "notes").tools.find((tools) => tools.name === "activateHud").active = state;
    ui.controls.render();
  }

  /**
   * Function that handles conversation being closed
   */
  closeActiveConversation() {
    getConfirmationFromUser("CHUD.dialogue.onCloseActiveConversation", () => {
      game.ConversationHud.onToggleConversation(false);
    });
  }

  /**
   *
   * @param {*} formData
   */
  createConversationFromFormData(formData) {
    this.#handleConversationCreationData(formData);
  }

  /**
   *
   * @param {{scope: string, type: string, data: any}} functionData
   */
  executeFunction(functionData) {
    // TODO: Check if there is an active conversation

    switch (functionData.scope) {
      case "local":
        this.#executeFunctionHelper(functionData);
        break;
      case "everyone":
        socket.executeForEveryone("executeFunction", functionData);
        break;
      case "all-gms":
        socket.executeForAllGMs("executeFunction", functionData);
      default:
        // TODO: Log error
        break;
    }
  }

  #executeFunctionHelper(functionData) {
    game.ConversationHud.activeConversation.executeFunction(functionData);
  }

  /**
   * Function that parses conversation input form data and then activates the conversation hud
   *
   * @param {ConversationData} formData
   * @param {boolean} visibility
   */
  #handleConversationCreationData(formData, visibility = true) {
    // This function should only be called when there is no other conversation active
    // TODO: Maybe rework this feature so that if there is a conversation active, a dialogue prompt appears
    if (game.ConversationHud.conversationIsActive) {
      // Display notification only to the GMs
      // TODO: Check logic
      if (checkIfUserIsGM()) {
        ui.notifications.error(game.i18n.localize("CHUD.errors.conversationAlreadyActive"));
      }

      return;
    }

    socket.executeForEveryone("createConversation", formData, visibility);

    // Finally, set the button status to active now that a conversation is active
    socket.executeForAllGMs("setActivateConversationHudButtonState", true);
  }
}
