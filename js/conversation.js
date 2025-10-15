/// <reference path="./../types.d.ts" />
/// <reference path="./types/ConversationData.js" />

import { socket } from "./init.js";
import { ConversationCreationForm } from "./forms/index.js";
import { checkIfUserIsGM, getConfirmationFromUser, getConversationDataFromJournalId } from "./helpers/index.js";
import { ConversationTypes, MODULE_NAME, SHEET_CLASSES } from "./constants/index.js";
import { CollectiveConversation, GmControlledConversation } from "./conversation-types/index.js";
import { ConversationEvents } from "./constants/events.js";

/**
 * Main conversation HUD class that manages conversation lifecycle and UI interactions.
 * Extends EventTarget to provide custom event handling capabilities.
 */
export class ConversationHud extends EventTarget {
  /** @type {boolean} Whether a conversation is currently active */
  conversationIsActive = false;

  /** @type {boolean} Whether the conversation UI is visible to users */
  conversationIsVisible = false;

  /** @type {CollectiveConversation|GmControlledConversation|undefined} The currently active conversation instance */
  activeConversation = undefined;

  /**
   * Initializes the ConversationHud instance and registers socket functions.
   * @constructor
   */
  constructor() {
    super();

    // Register socket hooks
    this.registerSocketFunctions();
  }

  /**
   * Registers all socket functions that are used by CHUD for cross-client communication.
   * If the socket is not yet initialized, it will retry after 250ms.
   * @returns {void}
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
   * Creates and displays the ConversationHUD UI based on the provided conversation data.
   * Instantiates the appropriate conversation type (GM Controlled or Collective) and initializes the UI.
   * @param {{conversationData: GMControlledConversationData|CollectiveConversationData, currentState: any}} conversation - The conversation data and current state
   * @param {boolean} conversationIsVisible - Whether the conversation should be visible to users
   * @returns {Promise<void>}
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

        game.ConversationHud.conversationIsActive = false;
        game.ConversationHud.conversationIsVisible = false;

        console.error("ConversationHUD | Unknown conversation type");
        return;
    }

    game.ConversationHud.activeConversation.createConversation();

    Hooks.call(ConversationEvents.Created);
  }

  /**
   * Retrieves the data of the currently active conversation including its visibility state.
   * @returns {{
   *   conversationIsActive: boolean,
   *   conversationIsVisible: boolean,
   *   activeConversation: {
   *     conversationData: GMControlledConversationData|CollectiveConversationData,
   *     currentState: any
   *   }|undefined
   * }} The current conversation state and data
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
   * Removes the currently active conversation and cleans up the UI.
   * Resets all conversation state variables and triggers the conversation removed event.
   * @returns {Promise<void>}
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
   * Saves the currently active conversation to a journal entry.
   * Only accessible to GM users. Prompts for a name and folder location.
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
              callback: (_event, button) => {
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
   * Starts a conversation from provided conversation data.
   * If a conversation is already active, it updates the existing one; otherwise creates a new one.
   * Only accessible to GM users.
   * @param {{conversationData: GMControlledConversationData|CollectiveConversationData}} data - The conversation data to start from
   * @param {boolean} [visibility] - Whether the conversation should be visible (optional, defaults to current visibility state)
   * @returns {void}
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
        options: {
          setDefaultParticipant: true,
        },
      });
      socket.executeForEveryone("setConversationVisibility", parsedVisibility);
    } else {
      this.#handleCreateConversationFromData(data.conversationData, parsedVisibility, { setDefaultParticipant: true });
    }
  }

  /**
   * Starts a conversation from a journal entry ID by extracting the conversation data.
   * If a conversation is already active, it updates the existing one; otherwise creates a new one.
   * @param {string} journalId - The ID of the journal entry containing conversation data
   * @param {boolean} [startwithVisibilityOff=false] - Whether to start with visibility turned off
   * @returns {void}
   */
  startConversationFromJournalId(journalId, startwithVisibilityOff = false) {
    const conversationData = getConversationDataFromJournalId(journalId);

    if (conversationData) {
      const visibility = !startwithVisibilityOff;

      if (this.activeConversation) {
        game.ConversationHud.executeFunction({
          scope: "everyone",
          type: "update-conversation",
          data: conversationData,
          options: {
            setDefaultParticipant: true,
          },
        });
        socket.executeForEveryone("setConversationVisibility", visibility);
      } else {
        this.#handleCreateConversationFromData(conversationData, visibility);
      }
    }
  }

  /**
   * Handles saving the current conversation to a journal entry with the provided form data.
   * Creates a new journal entry with appropriate permissions and flags.
   * @private
   * @param {Object} data - The form data containing name and folder information
   * @param {string} data.name - The name for the new journal entry
   * @param {string} data.folder - The folder ID to save the journal entry in
   * @returns {Promise<void>}
   */
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
          name: "_chud_conversation_data",
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
   * Handles the conversation toggle action - either creates a new conversation or removes the active one.
   * Only accessible to GM users. Shows appropriate notifications for various states.
   * @param {boolean} shouldCreateConversation - Whether to create a conversation (true) or remove it (false)
   * @returns {Promise<void>}
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
   * Closes the currently active conversation after getting user confirmation.
   * Prompts the user to confirm the action before proceeding.
   * @returns {Promise<void>}
   */
  async closeActiveConversation() {
    const confirmed = await getConfirmationFromUser("CHUD.dialogue.onCloseActiveConversation");
    if (confirmed) {
      game.ConversationHud.onToggleConversation(false);
    }
  }

  /**
   * Creates a conversation from the provided form data.
   * This is a public wrapper for the private conversation creation handler.
   * @param {GMControlledConversationData|CollectiveConversationData} formData - The conversation data from form input
   * @returns {void}
   */
  createConversationFromData(formData) {
    this.#handleCreateConversationFromData(formData);
  }

  /**
   * Toggles the visibility state of the current conversation for all connected users.
   * Sends the toggle command to all clients via socket communication.
   * @returns {void}
   */
  toggleConversationVisibility() {
    socket.executeForEveryone("setConversationVisibility", !this.conversationIsVisible);
  }

  /**
   * Sets the visibility state of the current conversation and updates the UI accordingly.
   * Triggers the conversation updated event after changing visibility.
   * @param {boolean} isVisible - Whether the conversation should be visible
   * @returns {void}
   */
  setConversationVisibility(isVisible) {
    // TODO: Check for an active conversation
    game.ConversationHud.conversationIsVisible = isVisible;
    game.ConversationHud.activeConversation.updateConversationVisibility(isVisible);

    Hooks.call(ConversationEvents.Updated);
  }

  /**
   * Renders a journal sheet in a separate tab based on the provided journal ID.
   * Shows an error notification if the journal entry is not found.
   * @param {string} journalId - The ID of the journal entry to render
   * @returns {void}
   */
  renderJournalSheet(journalId) {
    let journal = game.journal.get(journalId);
    if (!journal) {
      ui.notifications.error(game.i18n.localize("CHUD.errors.invalidJournalEntry"));
    } else {
      journal.sheet.render(true);
    }
  }

  /**
   * Renders an actor sheet in a separate tab based on the provided actor ID.
   * Shows an error notification if the actor is not found.
   * @param {string} actorId - The ID of the actor to render
   * @returns {Promise<void>}
   */
  async renderActorSheet(actorId) {
    let actor = game.actors.get(actorId);
    if (!actor) {
      ui.notifications.error(game.i18n.localize("CHUD.errors.invalidActorEntry"));
    } else {
      actor.sheet.render(true);
    }
  }

  /**
   * Executes a function on the active conversation with the specified scope.
   * Supports local execution, all users, or all GMs based on the scope parameter.
   * @param {{scope: 'local'|'everyone'|'all-gms', type: string, data: any, options?: any}} functionData - The function execution data
   * @returns {void}
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

  /**
   * Helper function that executes a function on the active conversation locally.
   * This is used internally by the socket system to execute functions received from other clients.
   * @private
   * @param {{type: string, data: any, options?: any}} functionData - The function execution data
   * @returns {void}
   */
  #executeFunctionHelper(functionData) {
    game.ConversationHud.activeConversation.executeFunction(functionData);
  }

  /**
   * Handles the creation of a conversation from the provided data and visibility settings.
   * Ensures no other conversation is active before creating a new one.
   * Sends the conversation creation command to all connected clients.
   * @private
   * @param {GMControlledConversationData|CollectiveConversationData} conversationData - The conversation data to create from
   * @param {boolean} [visibility=true] - Whether the conversation should be visible initially
   * @param {Object} [options] - Additional options for conversation creation
   * @returns {void}
   */
  #handleCreateConversationFromData(conversationData, visibility = true, options) {
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
      currentState: options,
    };

    socket.executeForEveryone("createConversation", conversation, visibility);
  }
}
