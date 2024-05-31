import { ANCHOR_OPTIONS } from "../constants.js";
import { ParticipantInputForm } from "../formAddParticipant.js";
import { PullParticipantsForm } from "../formPullParticipants.js";
import {
  getActorDataFromDragEvent,
  moveInArray,
  hideDragAndDropIndicator,
  displayDragAndDropIndicator,
  getDragAndDropIndex,
  getConfirmationFromUser,
  updateParticipantFactionBasedOnSelectedFaction,
  getPortraitAnchorObjectFromParticipant,
  processParticipantData,
} from "../helpers.js";

export class ConversationEntrySheet extends JournalSheet {
  constructor(data, options) {
    super(data, options);
    this.dirty = false;

    this.conversationBackground = "";

    this.dropzoneVisible = false;
    this.draggingParticipant = false;

    this.participants = [];
    this.defaultActiveParticipant = undefined;

    const pages = this.object.getEmbeddedCollection("JournalEntryPage").contents;
    if (pages.length > 0) {
      try {
        const data = JSON.parse(pages[0].text.content);
        if (data instanceof Array) {
          this.participants = data;
        } else {
          const conversationBackground = data.conversationBackground;
          if (conversationBackground) {
            this.conversationBackground = conversationBackground;
          }

          const participants = data.participants;
          const defaultActiveParticipant = data.defaultActiveParticipant;
          if (participants) {
            this.participants = participants;
            if (typeof defaultActiveParticipant !== "undefined") {
              this.defaultActiveParticipant = defaultActiveParticipant;
            }
          } else {
            throw new SyntaxError();
          }
        }
      } catch (error) {
        if (error instanceof SyntaxError) {
          ui.notifications.error(game.i18n.localize("CHUD.errors.failedToParse"));
        } else {
          ui.notifications.error(game.i18n.localize("CHUD.errors.genericSheetError"));
        }
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

    html.find("#save-conversation").click(async (e) => this.#handleSaveConversation());

    html.find("#show-conversation").click(async (e) => this.#handleShowConversation());

    html.find("#pull-participants-from-scene").click(async (e) => {
      const pullParticipantsForm = new PullParticipantsForm((data) => {
        for (const participant of data) {
          this.#handleAddParticipant(participant);
        }
      });
      return pullParticipantsForm.render(true);
    });

    html.find("#add-participant").click(async (e) => {
      const participantInputForm = new ParticipantInputForm(false, (data) => this.#handleAddParticipant(data));
      return participantInputForm.render(true);
    });

    // Bind event handler for conversation background image field
    const conversationBackgroundInput = html.find("[name=conversationBackground]")[0];
    conversationBackgroundInput.onchange = (event) => this.#handleChangeConversationBackground(event);

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
            if (event.ctrlKey) {
              this.#handleReplaceAllParticipants(data);
            } else {
              data.forEach((participant) => {
                this.#handleAddParticipant(participant);
              });
            }
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
              type: "ConversationParticipant",
              participant: this.participants[i],
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

            // Update active participant index
            const defaultActiveParticipantIndex = this.defaultActiveParticipant;
            if (defaultActiveParticipantIndex === oldIndex) {
              this.defaultActiveParticipant = newIndex;
            } else {
              if (defaultActiveParticipantIndex > oldIndex && defaultActiveParticipantIndex <= newIndex) {
                this.defaultActiveParticipant -= 1;
              }
              if (defaultActiveParticipantIndex < oldIndex && defaultActiveParticipantIndex >= newIndex) {
                this.defaultActiveParticipant += 1;
              }
            }

            this.dirty = true;
            this.render(false);
          } else {
            console.error("ConversationHUD | Data object was empty inside conversation participant ondrop function");
          }

          this.draggingParticipant = false;
        };

        // Bind function to the set active by default checkbox
        conversationParticipants[i].querySelector("#participant-active-by-default").onchange = (event) =>
          this.#handleSetDefaultActiveParticipant(event, i);

        // Bind functions to the edit and remove buttons
        const controls = conversationParticipants[i].querySelector(".controls-wrapper");
        controls.querySelector("#participant-clone-button").onclick = () => this.#handleCloneParticipant(i);
        controls.querySelector("#participant-delete-button").onclick = () => this.#handleRemoveParticipant(i);
        controls.querySelector("#participant-edit-button").onclick = () => {
          const participantInputForm = new ParticipantInputForm(true, (data) => this.#handleEditParticipant(data, i), {
            name: this.participants[i].name,
            displayName: this.participants[i].displayName,
            img: this.participants[i].img,
            imgScale: this.participants[i].imgScale,
            linkedJournal: this.participants[i].linkedJournal,
            linkedActor: this.participants[i].linkedActor,
            faction: this.participants[i].faction,
            anchorOptions: ANCHOR_OPTIONS,
            portraitAnchor: getPortraitAnchorObjectFromParticipant(this.participants[i]),
          });
          participantInputForm.render(true);
        };
      }
    }
  }

  getData(options) {
    const baseData = super.getData(options);

    for (const participant of this.participants) {
      if (participant.faction?.selectedFaction) {
        updateParticipantFactionBasedOnSelectedFaction(participant);
      }

      // Add anchor object if missing
      if (!participant.portraitAnchor) {
        participant.portraitAnchor = getPortraitAnchorObjectFromParticipant(participant);
      }
    }

    const data = {
      isGM: game.user.isGM,
      dirty: this.dirty,
      conversationBackground: this.conversationBackground,
      defaultActiveParticipant: this.defaultActiveParticipant,
      participants: this.participants,
      name: baseData.data.name,
      data: baseData.data,
    };

    return data;
  }

  async close(options) {
    if (this.dirty) {
      await getConfirmationFromUser(
        "CHUD.dialogue.unsavedChanges",
        this.#handleConfirmationClose.bind(this, true),
        this.#handleConfirmationClose.bind(this, false),
        '<i class="fas fa-save"></i>',
        '<i class="fas fa-trash"></i>'
      );
    } else {
      this.dirty = false;
      Object.values(this.editors).forEach((ed) => {
        if (ed.instance) ed.instance.destroy();
      });
    }

    return super.close({ submit: false });
  }

  async #handleConfirmationClose(save) {
    if (save) {
      await this.#handleSaveConversation();
    } else {
      const pages = this.object.getEmbeddedCollection("JournalEntryPage").contents;

      if (pages.length === 0) {
        this.participants = [];
        this.defaultActiveParticipant = undefined;
      } else {
        this.defaultActiveParticipant = undefined;

        const data = JSON.parse(pages[0].text.content);
        if (data instanceof Array) {
          this.participants = data;
        } else {
          const participants = data.participants;
          const defaultActiveParticipant = data.defaultActiveParticipant;
          if (participants) {
            this.participants = participants;
            if (typeof defaultActiveParticipant !== "undefined") {
              this.defaultActiveParticipant = defaultActiveParticipant;
            }
          }
        }
      }

      this.dirty = false;
    }
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
          name: game.i18n.localize("CHUD.strings.conversationParticipants"),
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

  #handleChangeConversationBackground(event) {
    if (!event.target) return;

    this.conversationBackground = event.target.value;

    this.dirty = true;
    this.render(false);
  }

  #handleAddParticipant(data) {
    processParticipantData(data);

    this.participants.push(data);
    this.dirty = true;
    this.render(false);
  }

  #handleEditParticipant(data, index) {
    processParticipantData(data);

    this.participants[index] = data;
    this.dirty = true;
    this.render(false);
  }

  #handleReplaceAllParticipants(data) {
    const processedData = data.map((participant) => {
      processParticipantData(participant);
      return participant;
    });

    this.defaultActiveParticipant = undefined;
    this.participants = processedData;
    this.dirty = true;
    this.render(false);
  }

  #handleRemoveParticipant(index) {
    this.participants.splice(index, 1);
    this.dirty = true;
    this.render(false);
  }

  #handleCloneParticipant(index) {
    const clonedParticipant = this.participants[index];
    this.participants.push(clonedParticipant);
    this.dirty = true;
    this.render(false);
  }

  #handleSetDefaultActiveParticipant(event, index) {
    if (!event.target) return;

    if (event.target.checked) {
      this.defaultActiveParticipant = index;
    } else {
      this.defaultActiveParticipant = undefined;
    }

    this.dirty = true;
    this.render(false);
  }
}
