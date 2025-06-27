/// <reference path="./../types.d.ts" />
/// <reference path="./types/ConversationData.js" />

import { socket } from "./init.js";
import { ConversationCreationForm } from "./forms/index.js";
import { checkIfUserIsGM, getConfirmationFromUser } from "./helpers/index.js";
import { ConversationTypes, MODULE_NAME, SHEET_CLASSES } from "./constants/index.js";
import { CollectiveConversation, GmControlledConversation } from "./conversation-types/index.js";
import { ConversationEvents } from "./constants/events.js";

export class ConversationHud extends EventTarget {
  conversationIsActive = false;
  conversationIsVisible = false;
  activeConversation = undefined;

  constructor() {
    super();

    // Register socket hooks
    this.registerSocketFunctions();
  }

  /**
   * Function that registers all socket functions that are used by CHUD.
   */
  registerSocketFunctions() {
    // Wait for the socket to be initialized (if it hasn't been already)
    if (socket) {
      socket.register("createConversation", this.createConversation.bind(this));
      socket.register("getConversation", this.getConversation.bind(this));
      socket.register("removeConversation", this.removeConversation.bind(this));

      socket.register("setConversationVisibility", this.setConversationVisibility.bind(this));

      socket.register("executeFunction", this.#executeFunctionHelper.bind(this));
    } else {
      setTimeout(() => this.registerSocketFunctions(), 250);
    }
  }

  /**
   * Function that creates and displays the ConversationHUD UI
   *
   * @param {{ conversationData: GMControlledConversationData; currentState: any; }} conversation TODO
   * @param {boolean} conversationIsVisible TODO
   */
  async createConversation(conversation, conversationIsVisible) {
    // Set conversation data
    game.ConversationHud.conversationIsActive = true;
    game.ConversationHud.conversationIsVisible = conversationIsVisible;

    switch (conversation.conversationData.type) {
      case ConversationTypes.GMControlled:
        game.ConversationHud.activeConversation = new GmControlledConversation(
          conversation.conversationData,
          conversation.currentState
        );
        break;

      case ConversationTypes.Collective:
        game.ConversationHud.activeConversation = new CollectiveConversation(
          conversation.conversationData,
          conversation.currentState
        );
        break;

      default:
        // TODO: Handle error case in a better way + add improved logging
        // What needs to be done is set the creation button state to be disabled as there is no active conversation
        console.error("ConversationHUD | Unknown conversation type");
        return;
    }

    game.ConversationHud.activeConversation.createConversation();

    Hooks.call(ConversationEvents.Created);
  }

  /**
   * Function that gets the data of the currently active conversation
   *
   * @returns {{
   *  conversationIsActive: boolean;
   *  conversationIsVisible: boolean;
   *  activeConversation: {
   *    conversationData: GMControlledConversationData | undefined;
   *    currentState: any;
   *  };
   * }}
   */
  getConversation() {
    const dataToReturn = {
      conversationIsActive: game.ConversationHud.conversationIsActive,
      conversationIsVisible: game.ConversationHud.conversationIsVisible,
    };

    if (game.ConversationHud.conversationIsActive) {
      const { conversationData, currentState } = game.ConversationHud.activeConversation.getConversation();
      dataToReturn.activeConversation = {
        conversationData,
        currentState,
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

    Hooks.call(ConversationEvents.Removed);
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
        const dialogContent = await foundry.applications.handlebars.renderTemplate(
          "modules/conversation-hud/templates/forms/save-form.hbs",
          {
            folders,
            // TODO: Localize
            name: game.i18n.format("DOCUMENT.New", { type: "Conversation Sheet" }),
          }
        );

        // TODO: Localize
        return foundry.applications.api.DialogV2.prompt(
          foundry.utils.mergeObject({
            content: dialogContent,
            window: { title: "Save Conversation" },
            ok: {
              label: "Save Conversation",
              callback: (event, button) => {
                const formData = new foundry.applications.ux.FormDataExtended(button.form);
                const formDataObject = formData.object;

                this.#handleSaveConversation(formDataObject);
              },
            },
          })
        );
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
  startConversationFromData(data, visibility) {
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
        data: data.conversationData,
      });
      socket.executeForEveryone("setConversationVisibility", parsedVisibility);
    } else {
      game.ConversationHud.createConversation(data, parsedVisibility);
    }
  }

  async #handleSaveConversation(data) {
    const permissions = {};
    game.users?.forEach((u) => (permissions[u.id] = game.user?.id === u.id ? 3 : 0));

    const dataToSave = game.ConversationHud.getConversation().activeConversation.conversationData;

    // TODO: Maybe check that data to save actually exists

    const newConversationSheet = await JournalEntry.create({
      name: data.name || "New Conversation",
      folder: data.folder || "",
      flags: {
        core: {
          sheetClass: SHEET_CLASSES.conversationSheetClass,
        },
        [MODULE_NAME]: { type: "conversation-sheet" },
      },
      ownership: permissions,
    });

    if (dataToSave && newConversationSheet) {
      await newConversationSheet.createEmbeddedDocuments("JournalEntryPage", [
        {
          text: { content: JSON.stringify(dataToSave) },
          name: "Conversation Sheet Data",
          flags: {
            [MODULE_NAME]: { type: "conversation-sheet-data" },
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
          // Create form
          new ConversationCreationForm().render(true);
        } else {
          ui.notifications.error(game.i18n.localize("CHUD.errors.conversationAlreadyActive"));
        }
      } else {
        if (game.ConversationHud.conversationIsActive) {
          socket.executeForEveryone("removeConversation");
        } else {
          ui.notifications.error(game.i18n.localize("CHUD.errors.noActiveConversation"));
        }
      }
    }
  }

  /**
   * Function that handles conversation being closed
   */
  async closeActiveConversation() {
    const confirmed = await getConfirmationFromUser("CHUD.dialogue.onCloseActiveConversation");
    if (confirmed) {
      game.ConversationHud.onToggleConversation(false);
    }
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
      currentState: undefined,
    };

    socket.executeForEveryone("createConversation", conversation, visibility);
  }
}
