/// <reference path="./../types.d.ts" />
/// <reference path="./types/ConversationData.js" />

import { socket } from "./init.js";
import { ConversationCreationForm } from "./forms/index.js";
import { checkIfUserIsGM, getConfirmationFromUser } from "./helpers/index.js";
import { ConversationTypes, SHEET_CLASSES } from "./constants/index.js";
import { CollectiveConversation, GmControllerConversation } from "./conversation-types/index.js";

export class ConversationHud {
  conversationIsActive = false;
  conversationIsVisible = false;
  activeConversation = undefined;

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
      socket.register("getConversation", this.getConversation);
      socket.register("removeConversation", this.removeConversation);

      socket.register("setConversationVisibility", this.setConversationVisibility);

      socket.register("executeFunction", this.#executeFunctionHelper);

      socket.register("setActivateConversationHudButtonState", this.setActivateConversationHudButtonState);
    } else {
      setTimeout(this.registerSocketFunctions, 250);
    }
  }

  /**
   * Function that creates and displays the ConversationHUD UI
   *
   * @param {{ conversationData: GMControlledConversationData; conversationCurrentState: any; }} conversation TODO
   * @param {boolean} conversationIsVisible TODO
   */
  async createConversation(conversation, conversationIsVisible) {
    // Set conversation data
    game.ConversationHud.conversationIsActive = true;
    game.ConversationHud.conversationIsVisible = conversationIsVisible;

    switch (conversation.conversationData.type) {
      case ConversationTypes.GMControlled:
        game.ConversationHud.activeConversation = new GmControllerConversation(
          conversation.conversationData,
          conversation.conversationCurrentState
        );
        break;

      case ConversationTypes.Collective:
        game.ConversationHud.activeConversation = new CollectiveConversation(
          conversation.conversationData,
          conversation.conversationCurrentState
        );
        break;

      default:
        // TODO: Handle error case in a better way + add improved logging
        // What needs to be done is set the creation button state to be disabled as there is no active conversation
        console.error("ConversationHUD | Unknown conversation type");
        return;
    }

    game.ConversationHud.activeConversation.createConversation();
  }

  /**
   * Function that gets the data of the currently active conversation
   *
   * @returns {{
   *  conversationIsActive: boolean;
   *  conversationIsVisible: boolean;
   *  activeConversation: {
   *    conversationData: GMControlledConversationData | undefined;
   *    conversationCurrentState: any;
   *  };
   * }}
   */
  getConversation() {
    const dataToReturn = {
      conversationIsActive: game.ConversationHud.conversationIsActive,
      conversationIsVisible: game.ConversationHud.conversationIsVisible,
    };

    if (game.ConversationHud.conversationIsActive) {
      const { conversationData, conversationCurrentState } = game.ConversationHud.activeConversation.getConversation();
      dataToReturn.activeConversation = {
        conversationData: conversationData,
        conversationCurrentState: conversationCurrentState,
      };
    } else {
      dataToReturn.activeConversation = undefined;
    }

    return dataToReturn;
  }

  /**
   * TODO: Add JSDoc
   */
  async removeConversation() {
    game.ConversationHud.conversationIsActive = false;
    game.ConversationHud.conversationIsVisible = false;
    game.ConversationHud.activeConversation.removeConversation();
    game.ConversationHud.activeConversation = undefined;
  }

  // Function that saves the active conversation to a journal entry

  /**
   *
   * @returns {Promise<void>}
   */
  async saveActiveConversation() {
    if (checkIfUserIsGM()) {
      if (game.ConversationHud.activeConversation) {
        // Create a prompt for saving the conversation, asking the users to introduce a name and to specify a folder
        const folders = game.folders.filter((f) => f.type === "JournalEntry" && f.displayed);
        const dialogContent = await renderTemplate("modules/conversation-hud/templates/forms/save-form.hbs", {
          folders,
          name: game.i18n.format("DOCUMENT.New", { type: "Conversation Sheet" }),
        });

        // TODO: Localize strings
        return Dialog.prompt({
          title: "Save Conversation",
          content: dialogContent,
          label: "Save Conversation",
          callback: (html) => {
            const formElement = html[0].querySelector("form");
            const formData = new FormDataExtended(formElement);
            const formDataObject = formData.object;

            this.#handleSaveConversation(formDataObject);
          },
          rejectClose: false,
        });
      } else {
        ui.notifications.error(game.i18n.localize("CHUD.errors.noActiveConversation"));
      }
    }
  }

  /**
   * TODO: Add JSDoc
   *
   * @param {*} conversationData
   * @param {*} visibility
   */
  startConversationFromData(conversationData, visibility) {
    if (!checkIfUserIsGM()) {
      return;
    }

    let parsedVisibility = true;
    if (game.ConversationHud.conversationIsVisible !== undefined) {
      parsedVisibility = game.ConversationHud.conversationIsVisible;
    }
    if (visibility !== undefined) {
      parsedVisibility = visibility;
    }

    if (this.activeConversation) {
      game.ConversationHud.executeFunction({
        scope: "everyone",
        type: "update-conversation",
        data: conversationData,
      });
      socket.executeForEveryone("setConversationVisibility", parsedVisibility);
    } else {
      game.ConversationHud.createConversation(conversationData, parsedVisibility);
    }
  }

  async #handleSaveConversation(data) {
    const permissions = {};
    game.users?.forEach((u) => (permissions[u.id] = game.user?.id === u.id ? 3 : 0));

    const dataToSave = game.ConversationHud.getConversation().activeConversation;

    const newConversationSheet = await JournalEntry.create({
      name: data.name || "New Conversation",
      folder: data.folder || "",
      flags: {
        core: {
          sheetClass: SHEET_CLASSES.conversationSheetClass,
        },
      },
      ownership: permissions,
    });

    if (dataToSave && newConversationSheet) {
      await newConversationSheet.createEmbeddedDocuments("JournalEntryPage", [
        {
          text: { content: JSON.stringify(dataToSave) },
          name: "Conversation Sheet Data",
          flags: {
            "conversation-hud": { type: "conversation-sheet-data" },
          },
        },
      ]);

      ui.notifications.info(game.i18n.localize("CHUD.info.saveSuccessful"));
    } else {
      ui.notifications.error(game.i18n.localize("CHUD.errors.saveUnsuccessful"));
    }
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
          this.setActivateConversationHudButtonState(false);

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
    ui.controls.controls.notes.tools["activateHud"].active = state;
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
  createConversationFromData(formData) {
    this.#handleCreateConversationFromData(formData);
  }

  /**
   * TODO: Finish JSDoc
   */
  toggleConversationVisibility() {
    socket.executeForEveryone("setConversationVisibility", !this.conversationIsVisible);
  }

  /**
   *
   * @param {boolean} isVisible
   */
  setConversationVisibility(isVisible) {
    // TODO: Check for an active conversation
    game.ConversationHud.conversationIsVisible = isVisible;
    game.ConversationHud.activeConversation.updateConversationVisibility(isVisible);
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
   * @param {GMControlledConversationData} conversationData
   * @param {boolean} visibility
   */
  #handleCreateConversationFromData(conversationData, visibility = true) {
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

    const conversation = {
      conversationData: conversationData,
      conversationCurrentState: undefined,
    };

    socket.executeForEveryone("createConversation", conversation, visibility);

    // Finally, set the button status to active now that a conversation is active
    socket.executeForAllGMs("setActivateConversationHudButtonState", true);
  }
}
