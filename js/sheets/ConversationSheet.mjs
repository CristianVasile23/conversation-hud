/// <reference path="../types/ConversationData.js" />

// import { ANCHOR_OPTIONS } from "../constants/index.js";
import { ConversationTypes } from "../constants/conversation-types.js";
import {
  // getActorDataFromDragEvent,
  // moveInArray,
  // hideDragAndDropIndicator,
  // showDragAndDropIndicator,
  // getDragAndDropIndex,
  getConfirmationFromUser,
  // processParticipantData,
} from "../helpers/index.js";
import { GmControlledConversationSheetHandler } from "../sheet-handlers/GmControlledConversationSheetHandler.mjs";

const { JournalEntrySheet } = foundry.applications.sheets.journal;
const { HandlebarsApplicationMixin } = foundry.applications.api;

export class ConversationSheet extends HandlebarsApplicationMixin(JournalEntrySheet) {
  #dirty = false;

  /** @type {GMControlledConversationData | undefined} */
  #conversationData = undefined;

  /** @type {GmControlledConversationSheetHandler | undefined} */
  #sheetHandler = undefined;

  constructor(...args) {
    super(...args);

    // Get document pages
    const page = this.document.pages.find(
      (p) => foundry.utils.getProperty(p, "flags.conversation-hud.type") === "conversation-sheet-data"
    );

    if (page) {
      try {
        /** @type {GMControlledConversationData} */
        const data = JSON.parse(page.text.content);

        // TODO: Check if valid data
        this.#conversationData = data;

        switch (data.type) {
          case ConversationTypes.GMControlled:
            this.#sheetHandler = new GmControlledConversationSheetHandler(
              this.#conversationData.conversation,
              (conversation) => this.handleChange(conversation)
            );
            break;
          default:
            // console.error("INVALID TYPE");
            // return this.close({});
            throw new Error("Invalid sheet type");
        }
      } catch (error) {
        // TODO: Uncomment when reverting back to functionality of treating errors
        throw error;
        // if (error instanceof SyntaxError) {
        //   ui.notifications.error(game.i18n.localize("CHUD.errors.failedToParse"));
        // } else {
        //   ui.notifications.error(game.i18n.localize("CHUD.errors.genericSheetError"));
        // }
      }
    }
  }

  static PARTS = {
    header: {
      template: "modules/conversation-hud/templates/sheets/conversation-sheet/header.hbs",
    },
    body: {
      template: "modules/conversation-hud/templates/sheets/conversation-sheet/body.hbs",
      scrollable: [".conversation-participants"],
    },
    footer: {
      template: "modules/conversation-hud/templates/sheets/conversation-sheet/footer.hbs",
    },
  };

  static DEFAULT_OPTIONS = {
    id: "conversation-sheet",
    classes: ["chud-conversation-sheet"],
    tag: "form",
    window: {
      contentClasses: ["chud-conversation-sheet-content"],
      title: "CHUD.strings.conversationEntry",
      resizable: false,
    },
    position: {
      width: 635,
      height: 860,
    },
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    // Data processing needs to be done before rendering to ensure that all data rendered is updated
    // One example where data can be outdated is for factions that are selected via saved faction sheets
    // If the faction sheet is updated, the participant data needs to be updated as well
    switch (this.#conversationData.type) {
      case ConversationTypes.GMControlled:
        GmControlledConversationSheetHandler.processData(this.#conversationData.conversation);
        break;
      default:
        // TODO: Handle error
        console.error("INVALID TYPE");
    }

    return {
      ...context,
      isGM: game.user.isGM,
      conversationData: this.#conversationData,
      dirty: this.#dirty,
    };
  }

  _onRender(context, options) {
    super._onRender(context, options);

    const html = this.element;

    // Check to see if the user is a GM, and if not, exit function early so as not to bind the listeners
    if (!game.user.isGM) {
      return;
    }

    // Event handler for saving conversation sheet
    html.querySelector("#save-conversation").addEventListener("click", () => this.#handleSaveChanges());

    // Event handler for activating conversation sheet
    html.querySelector("#show-conversation").addEventListener("click", () => this.#handleShowConversation());

    // Bind event handler for conversation background image field
    html
      .querySelector("[name=conversationBackground]")
      .addEventListener("change", (event) => this.#handleChangeConversationBackground(event));

    // Activate sheet handler listeners
    this.#sheetHandler.activateListeners(html);
  }

  async close(options = {}) {
    if (this.#dirty) {
      const confirmed = await getConfirmationFromUser("CHUD.dialogue.unsavedChanges");

      if (confirmed === null) {
        return false;
      }

      if (confirmed) {
        await this.#handleSaveChanges();
      } else {
        await this.#handleDiscardChanges();
      }
    }

    return super.close(options);
  }

  /**
   * TODO: Finish JSDoc
   *
   * @param {GmControlledConversation} conversation
   */
  handleChange(conversation) {
    this.#conversationData.conversation = conversation;

    this.#dirty = true;
    this.render(false);
  }

  #handleShowConversation() {
    if (game.ConversationHud) {
      // Get document pages
      const page = this.document.pages.find(
        (p) => foundry.utils.getProperty(p, "flags.conversation-hud.type") === "conversation-sheet-data"
      );

      if (page) {
        try {
          const conversationData = JSON.parse(page.text.content);
          const visibility = game.ConversationHud.conversationIsActive
            ? game.ConversationHud.conversationIsVisible
            : true;

          const conversationCreationObject = {
            conversationData,
            currentState: undefined,
          };

          game.ConversationHud.startConversationFromData(conversationCreationObject, visibility);
        } catch (error) {
          // TODO: Uncomment when error handling needs to be added back
          throw error;
          // if (error instanceof SyntaxError) {
          //   ui.notifications.error(game.i18n.localize("CHUD.errors.failedToParse"));
          // } else {
          //   ui.notifications.error(game.i18n.localize("CHUD.errors.genericSheetError"));
          // }
        }
      } else {
        ui.notifications.error(game.i18n.localize("CHUD.errors.activateNoPages"));
      }
    } else {
      ui.notifications.error(game.i18n.localize("CHUD.errors.activateNoInit"));
    }
  }

  async #handleSaveChanges() {
    // Get document pages
    const page = this.document.pages.find(
      (p) => foundry.utils.getProperty(p, "flags.conversation-hud.type") === "conversation-sheet-data"
    );

    if (!page) {
      // Create a document entry page if none are present
      await this.document.createEmbeddedDocuments("JournalEntryPage", [
        {
          text: { content: JSON.stringify(this.#conversationData) },
          name: "_chud_conversation_data",
          flags: {
            "conversation-hud": { type: "conversation-sheet-data" },
          },
        },
      ]);
    } else {
      // Otherwise update the page
      await page.update({
        text: { content: JSON.stringify(this.#conversationData) },
      });
    }

    this.#dirty = false;
    this.render(false);
  }

  async #handleDiscardChanges() {
    const page = this.document.pages.find(
      (p) => foundry.utils.getProperty(p, "flags.conversation-hud.type") === "conversation-sheet-data"
    );

    if (!page) {
      this.#conversationData = undefined;
    } else {
      this.#conversationData = JSON.parse(page.text.content);

      // Reset handler data
      switch (this.#conversationData.type) {
        case ConversationTypes.GMControlled:
          this.#sheetHandler.setConversation(this.#conversationData.conversation);
          break;
        default:
          this.#sheetHandler = undefined;
      }
    }

    this.#dirty = false;
  }

  #handleChangeConversationBackground(event) {
    if (!event.target) return;

    this.#conversationData.background = event.target.value;

    this.#dirty = true;
    this.render(false);
  }
}
