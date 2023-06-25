import { FileInputForm } from "./formAddParticipant.js";
import {
  getActorDataFromDragEvent,
  moveInArray,
  hideDragAndDropIndicator,
  displayDragAndDropIndicator,
  getDragAndDropIndex,
  setDefaultDataForParticipant,
} from "./helpers.js";

export class ConversationEntrySheet extends JournalSheet {
  constructor(data, options) {
    super(data, options);
    this.dirty = false;

    this.dropzoneVisible = false;
    this.draggingParticipant = false;

    const pages = this.object.getEmbeddedCollection("JournalEntryPage").contents;
    if (pages.length === 0) {
      this.participants = [];
    } else {
      try {
        this.participants = JSON.parse(pages[0].text.content);
      } catch (error) {
        if (error instanceof SyntaxError) {
          ui.notifications.error(game.i18n.localize("CHUD.errors.failedToParse"));
        } else {
          ui.notifications.error(game.i18n.localize("CHUD.errors.genericSheetError"));
        }
        this.participants = [];
      }
    }
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["sheet", "journal-sheet"],
      title: game.i18n.localize("CHUD.strings.conversationEntry"),
      id: "conversation-entry-sheet",
      template: `modules/conversation-hud/templates/conversation_sheet.hbs`,
      width: 635,
      height: 500,
      resizable: false,
    });
  }

  activateListeners(html) {
    super.activateListeners(html);

    // Check to see if the user is a GM, and if not, exit function early so as not to bind the listeners
    if (!game.user.isGM) {
      return;
    }

    html.find("#save-conversation").click(async (e) => this.#handleSaveConversation());

    html.find("#show-conversation").click(async (e) => this.#handleShowConversation());

    html.find("#add-participant").click(async (e) => {
      const fileInputForm = new FileInputForm(false, (data) => this.#handleAddParticipant(data));
      return fileInputForm.render(true);
    });

    // Drag and drop functionality
    const dragDropWrapper = html.find("#conversation-sheet-content-wrapper")[0];
    const dragDropZone = html.find("#conversation-sheet-dropzone")[0];
    if (dragDropWrapper && dragDropZone) {
      dragDropWrapper.ondragenter = () => {
        if (!this.draggingParticipant) {
          this.dropzoneVisible = true;
          dragDropWrapper.classList.add("active-dropzone");
        }
      };

      dragDropZone.ondragleave = () => {
        if (this.dropzoneVisible) {
          this.dropzoneVisible = false;
          dragDropWrapper.classList.remove("active-dropzone");
        }
      };

      dragDropWrapper.ondrop = async (event) => {
        if (this.dropzoneVisible) {
          event.preventDefault();

          const data = await getActorDataFromDragEvent(event);
          if (data && data.length > 0) {
            data.forEach((participant) => {
              this.#handleAddParticipant(participant);
            });
          }

          this.dropzoneVisible = false;
          dragDropWrapper.classList.remove("active-dropzone");
        }
      };
    }

    const participantsObject = html.find("#conversation-participants-list")[0];
    if (participantsObject) {
      const conversationParticipants = participantsObject.children;
      for (let i = 0; i < conversationParticipants.length; i++) {
        // Add drag and drop functionality
        const dragDropHandler = conversationParticipants[i].querySelector("#conversation-sheet-drag-drop-handler");

        dragDropHandler.ondragstart = (event) => {
          this.draggingParticipant = true;
          event.dataTransfer.setDragImage(conversationParticipants[i], 0, 0);

          // Save the index of the dragged participant in the data transfer object
          event.dataTransfer.setData(
            "text/plain",
            JSON.stringify({
              index: i,
            })
          );
        };

        dragDropHandler.ondragend = (event) => {
          this.draggingParticipant = false;
        };

        conversationParticipants[i].ondragover = (event) => {
          displayDragAndDropIndicator(conversationParticipants[i], event);
        };

        conversationParticipants[i].ondragleave = (event) => {
          hideDragAndDropIndicator(conversationParticipants[i]);
        };

        conversationParticipants[i].ondrop = (event) => {
          const data = JSON.parse(event.dataTransfer.getData("text/plain"));

          if (data) {
            hideDragAndDropIndicator(conversationParticipants[i]);

            const oldIndex = data.index;

            // If we drag and drop a participant on the same spot, exit the function early as it makes no sense to reorder the array
            if (oldIndex === i) {
              return;
            }

            // Get the new index of the dropped element
            let newIndex = getDragAndDropIndex(event, i, oldIndex);

            // Reorder the array
            moveInArray(this.participants, oldIndex, newIndex);
            this.dirty = true;
            this.render(false);
          } else {
            console.error("ConversationHUD | Data object was empty inside conversation participant ondrop function");
          }

          this.draggingParticipant = false;
        };

        // Bind functions to the edit and remove buttons
        const controls = conversationParticipants[i].querySelector(".controls-wrapper");
        controls.querySelector("#participant-clone-button").onclick = () => {
          const clonedParticipant = this.participants[i];
          this.participants.push(clonedParticipant);
          this.dirty = true;
          this.render(false);
        };
        controls.querySelector("#participant-edit-button").onclick = () => {
          const fileInputForm = new FileInputForm(true, (data) => this.#handleEditParticipant(data, i), {
            name: this.participants[i].name,
            img: this.participants[i].img,
            faction: this.participants[i].faction,
          });
          fileInputForm.render(true);
        };
        controls.querySelector("#participant-delete-button").onclick = () => this.#handleRemoveParticipant(i);
      }
    }
  }

  getData(options) {
    const baseData = super.getData(options);

    const data = {
      isGM: game.user.isGM,
      dirty: this.dirty,
      participants: this.participants,
      name: baseData.data.name,
      data: baseData.data,
    };

    return data;
  }

  close(options) {
    if (this.dirty) {
      const dialog = new Dialog({
        title: game.i18n.localize("CHUD.strings.unsavedChanges"),
        content: game.i18n.localize("CHUD.strings.unsavedChangesHint"),
        buttons: {
          yes: {
            icon: '<i class="fas fa-save"></i>',
            label: game.i18n.localize("CHUD.actions.save"),
            callback: this.#handleConfirmationClose.bind(this, true),
          },
          no: {
            icon: '<i class="fas fa-trash"></i>',
            label: game.i18n.localize("CHUD.actions.discardChanges"),
            callback: this.#handleConfirmationClose.bind(this, false),
          },
        },
      });
      dialog.render(true);
      return Promise.resolve();
    } else {
      this.dirty = false;
      Object.values(this.editors).forEach((ed) => {
        if (ed.instance) ed.instance.destroy();
      });
      return super.close({ submit: false });
    }
  }

  async #handleConfirmationClose(save) {
    if (save) {
      await this.#handleSaveConversation();
    } else {
      const pages = this.object.getEmbeddedCollection("JournalEntryPage").contents;
      if (pages.length === 0) {
        this.participants = [];
      } else {
        this.participants = JSON.parse(pages[0].text.content);
      }
      this.dirty = false;
    }
    return this.close();
  }

  #handleShowConversation() {
    if (game.ConversationHud) {
      const pages = this.object.getEmbeddedCollection("JournalEntryPage").contents;
      if (pages.length > 0) {
        try {
          const conversationData = JSON.parse(pages[0].text.content);
          game.ConversationHud.startConversationFromData(conversationData);
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

    if (pages.length === 0) {
      // Create a document entry page if none are present
      await this.object.createEmbeddedDocuments("JournalEntryPage", [
        {
          text: { content: JSON.stringify(this.participants) },
          name: game.i18n.localize("CHUD.strings.conversationParticipants"),
        },
      ]);
    } else {
      // Otherwise, update the first (and realistically the only) entry page
      pages[0].text.content = JSON.stringify(this.participants);
      await this.object.updateEmbeddedDocuments(
        "JournalEntryPage",
        [
          {
            _id: pages[0]._id,
            name: pages[0].name,
            type: pages[0].type,
            text: { content: pages[0].text?.content || "", format: 1, markdown: undefined },
            src: pages[0].src || "",
            image: { caption: pages[0].image?.caption || "" },
            video: pages[0].video,
          },
        ],
        { render: false, renderSheet: false }
      );
    }

    this.dirty = false;
    this.render(false);
  }

  #handleEditParticipant(data, index) {
    setDefaultDataForParticipant(data);

    this.participants[index] = data;
    this.dirty = true;
    this.render(false);
  }

  #handleAddParticipant(data) {
    setDefaultDataForParticipant(data);

    this.participants.push(data);
    this.dirty = true;
    this.render(false);
  }

  #handleRemoveParticipant(index) {
    this.participants.splice(index, 1);
    this.dirty = true;
    this.render(false);
  }
}
