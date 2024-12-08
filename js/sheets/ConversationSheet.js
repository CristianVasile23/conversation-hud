/// <reference path="../types/ConversationData.js" />

// import { ANCHOR_OPTIONS } from "../constants/index.js";
import { CONVERSATION_TYPES } from "../constants/conversation-types.js";
import { PullParticipantsFromSceneForm, CreateOrEditParticipantForm } from "../forms/index.js";
import {
  // getActorDataFromDragEvent,
  // moveInArray,
  // hideDragAndDropIndicator,
  // showDragAndDropIndicator,
  // getDragAndDropIndex,
  getConfirmationFromUser,
  // processParticipantData,
} from "../helpers/index.js";
import { GmControlledConversationSheetHandler } from "../sheet-handlers/GmControlledConversationSheetHandler.js";

export class ConversationSheet extends JournalSheet {
  #dirty = false;

  /** @type {ConversationData | undefined} */
  #conversationData = undefined;

  /** @type {GmControlledConversationSheetHandler | undefined} */
  #sheetHandler = undefined;

  constructor(data, options) {
    super(data, options);

    const pages = this.object.getEmbeddedCollection("JournalEntryPage").contents;
    if (pages.length > 0) {
      try {
        /** @type {ConversationData} */
        const data = JSON.parse(pages[0].text.content);

        // TODO: Check if valid data

        this.#conversationData = data;

        switch (data.type) {
          case CONVERSATION_TYPES.GM_CONTROLLED:
            this.#sheetHandler = new GmControlledConversationSheetHandler(
              this.#conversationData.conversation,
              (conversation) => this.handleChange(conversation)
            );
            break;
          default:
            // TODO: Log error
            console.error("INVALID TYPE");
            super.close({ submit: false });
            break;
        }
      } catch (error) {
        throw error;
        // if (error instanceof SyntaxError) {
        //   ui.notifications.error(game.i18n.localize("CHUD.errors.failedToParse"));
        // } else {
        //   ui.notifications.error(game.i18n.localize("CHUD.errors.genericSheetError"));
        // }
      }
    }
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "conversation-sheet",
      classes: ["sheet", "journal-sheet", "conversation-sheet"],
      title: game.i18n.localize("CHUD.strings.conversationEntry"),
      template: "modules/conversation-hud/templates/sheets/conversation-sheet.hbs",
      width: 635,
      height: 660,
      resizable: false,
    });
  }

  activateListeners(html) {
    super.activateListeners(html);

    // Check to see if the user is a GM, and if not, exit function early so as not to bind the listeners
    if (!game.user.isGM) {
      return;
    }

    // Event handler for saving conversation sheet
    html.find("#save-conversation").click(() => this.#handleSaveConversation());

    // Event handler for activating conversation sheet
    html.find("#show-conversation").click(() => this.#handleShowConversation());

    // Bind event handler for conversation background image field
    const conversationBackgroundInput = html.find("[name=conversationBackground]")[0];
    conversationBackgroundInput.onchange = (event) => this.#handleChangeConversationBackground(event);

    // Activate sheet handler listeners
    this.#sheetHandler.activateListeners(html);
  }

  getData(options) {
    const baseData = super.getData(options);

    const data = {
      name: baseData.data.name,
      data: baseData.data,
      isGM: game.user.isGM,
      conversationData: this.#conversationData,
      dirty: this.#dirty,
    };

    return data;
  }

  async close() {
    if (this.#dirty) {
      await getConfirmationFromUser(
        "CHUD.dialogue.unsavedChanges",
        this.#handleConfirmationClose.bind(this, true),
        this.#handleConfirmationClose.bind(this, false),
        '<i class="fas fa-save"></i>',
        '<i class="fas fa-trash"></i>'
      );
    } else {
      this.#dirty = false;
      Object.values(this.editors).forEach((ed) => {
        if (ed.instance) ed.instance.destroy();
      });
    }

    return super.close({ submit: false });
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

  async #handleConfirmationClose(save) {
    if (save) {
      await this.#handleSaveConversation();
    } else {
      // const pages = this.object.getEmbeddedCollection("JournalEntryPage").contents;

      // if (pages.length === 0) {
      //   this.participants = [];
      //   this.defaultActiveParticipant = undefined;
      // } else {
      //   this.defaultActiveParticipant = undefined;

      //   const data = JSON.parse(pages[0].text.content);
      //   if (data instanceof Array) {
      //     this.participants = data;
      //   } else {
      //     const participants = data.participants;
      //     const defaultActiveParticipant = data.defaultActiveParticipant;
      //     if (participants) {
      //       this.participants = participants;
      //       if (typeof defaultActiveParticipant !== "undefined") {
      //         this.defaultActiveParticipant = defaultActiveParticipant;
      //       }
      //     }
      //   }
      // }

      this.#dirty = false;
    }
  }

  #handleShowConversation() {
    if (game.ConversationHud) {
      const pages = this.object.getEmbeddedCollection("JournalEntryPage").contents;
      if (pages.length > 0) {
        try {
          const conversationData = JSON.parse(pages[0].text.content);
          const visibility = game.ConversationHud.conversationIsActive
            ? game.ConversationHud.conversationIsVisible
            : true;
          game.ConversationHud.startConversationFromData(conversationData, visibility);
        } catch (error) {
          if (error instanceof SyntaxError) {
            ui.notifications.error(game.i18n.localize("CHUD.errors.failedToParse"));
          } else {
            ui.notifications.error(game.i18n.localize("CHUD.errors.genericSheetError"));
          }
        }
      } else {
        ui.notifications.error(game.i18n.localize("CHUD.errors.activateNoPages"));
      }
    } else {
      ui.notifications.error(game.i18n.localize("CHUD.errors.activateNoInit"));
    }
  }

  async #handleSaveConversation() {
    // Get document pages
    const pages = this.object.getEmbeddedCollection("JournalEntryPage").contents;
    const dataToSave = {
      conversationBackground: this.conversationBackground,
      defaultActiveParticipant: this.defaultActiveParticipant,
      participants: this.participants,
    };

    if (pages.length === 0) {
      // Create a document entry page if none are present
      await this.object.createEmbeddedDocuments("JournalEntryPage", [
        {
          text: { content: JSON.stringify(dataToSave) },
          name: "Conversation Participants",
          flags: {
            "conversation-hud": { type: "conversation" },
          },
        },
      ]);
    } else {
      // Otherwise, update the first (and realistically the only) entry page
      pages[0].text.content = JSON.stringify(dataToSave);
      await this.object.updateEmbeddedDocuments(
        "JournalEntryPage",
        [
          {
            _id: pages[0]._id,
            name: pages[0].name,
            type: pages[0].type,
            text: {
              content: pages[0].text?.content || "",
              format: 1,
              markdown: undefined,
            },
            src: pages[0].src || "",
            image: { caption: pages[0].image?.caption || "" },
            video: pages[0].video,
          },
        ],
        { render: false, renderSheet: false }
      );
    }

    this.#dirty = false;
    this.render(false);
  }

  #handleChangeConversationBackground(event) {
    if (!event.target) return;

    this.#conversationData.background = event.target.value;

    this.#dirty = true;
    this.render(false);
  }
}
