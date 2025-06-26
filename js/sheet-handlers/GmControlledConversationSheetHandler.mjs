/// <reference path="../types/GmControlledConversation/GmControlledConversation.js" />

import {
  getActorDataFromDragEvent,
  moveInArray,
  getDragAndDropIndex,
  hideDragAndDropIndicator,
  showDragAndDropIndicator,
  processParticipantData,
} from "../helpers/index.js";
import { CreateOrEditParticipantForm, PullParticipantsFromSceneForm } from "../forms/index.js";
import { ANCHOR_OPTIONS } from "../constants/settings.js";
import { DRAG_AND_DROP_DATA_TYPES } from "../constants/drag-and-drop.js";

export class GmControlledConversationSheetHandler {
  /** @type {GmControlledConversation | undefined} */
  #conversation = undefined;

  /** @type {(conversation: GmControlledConversation) => void | undefined} */
  #onChangeHandler = undefined;

  #draggingParticipant = false;

  /**
   * TODO: Finish JSDoc
   *
   * @param {GmControlledConversation} conversation
   * @param {(conversation: GmControlledConversation) => void} onChangeHandler
   */
  constructor(conversation, onChangeHandler) {
    this.#conversation = conversation;
    this.#onChangeHandler = onChangeHandler;
  }

  /**
   * Replace the current conversation object reference.
   * @param {GmControlledConversation} conversation
   */
  setConversation(conversation) {
    this.#conversation = conversation;
  }

  /**
   * TODO: Finish JSDoc
   *
   * @param {GmControlledConversation | undefined} conversation
   */
  static processData(conversation) {
    if (conversation) {
      // Parse all participants and update their data
      for (let i = 0; i < conversation.data.participants.length; i++) {
        processParticipantData(conversation.data.participants[i]);
      }
    }
  }

  activateListeners(html) {
    html.querySelector("#pull-participants-from-scene").addEventListener("click", async (e) => {
      new PullParticipantsFromSceneForm((data) => {
        for (const participant of data) {
          this.#handleAddParticipant(participant);
        }
      }).render(true);
    });

    html.querySelector("#add-participant").addEventListener("click", (e) => {
      new CreateOrEditParticipantForm(false, (data) => this.#handleAddParticipant(data)).render(true);
    });

    // Drag and drop functionality
    const dragDropWrapper = html.querySelector(".chud-drag-and-drop-container");
    const dragDropZone = html.querySelector(".chud-dropzone");
    if (dragDropWrapper && dragDropZone) {
      dragDropWrapper.ondragenter = () => {
        if (!this.#draggingParticipant) {
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

    const participantsObject = html.querySelector("#conversationParticipantsList");
    if (participantsObject) {
      const conversationParticipants = participantsObject.children;
      for (let i = 0; i < conversationParticipants.length; i++) {
        const dragDropHandler = conversationParticipants[i].querySelector(".chud-drag-drop-handler");

        dragDropHandler.ondragstart = (event) => {
          this.#draggingParticipant = true;
          event.dataTransfer.setDragImage(conversationParticipants[i], 0, 0);

          // Save the index of the dragged participant in the data transfer object
          event.dataTransfer.setData(
            "text/plain",
            JSON.stringify({
              index: i,
              type: DRAG_AND_DROP_DATA_TYPES.ConversationHudParticipant,
              participant: this.#conversation.data.participants[i],
            })
          );
        };

        dragDropHandler.ondragend = (event) => {
          this.#draggingParticipant = false;
        };

        conversationParticipants[i].ondragover = (event) => {
          showDragAndDropIndicator(conversationParticipants[i], event);
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
            moveInArray(this.#conversation.data.participants, oldIndex, newIndex);

            // Update active participant index
            const defaultActiveParticipantIndex = this.#conversation.data.defaultActiveParticipant;
            if (defaultActiveParticipantIndex === oldIndex) {
              this.#conversation.data.defaultActiveParticipant = newIndex;
            } else {
              if (defaultActiveParticipantIndex > oldIndex && defaultActiveParticipantIndex <= newIndex) {
                this.#conversation.data.defaultActiveParticipant -= 1;
              }
              if (defaultActiveParticipantIndex < oldIndex && defaultActiveParticipantIndex >= newIndex) {
                this.#conversation.data.defaultActiveParticipant += 1;
              }
            }

            this.#onChangeHandler(this.#conversation);
          } else {
            // TODO: Improve error logging message
            console.error("ConversationHUD | Data object was empty inside conversation participant ondrop function");
          }

          this.#draggingParticipant = false;
        };

        // Bind function to the set active by default checkbox
        conversationParticipants[i].querySelector("#participant-active-by-default-checkbox").onchange = (event) =>
          this.#handleSetDefaultActiveParticipant(event, i);

        // Bind functions to the edit and remove buttons
        const controls = conversationParticipants[i].querySelector(".chud-participant-action-buttons");
        controls.querySelector("#participant-clone-button").onclick = () => this.#handleCloneParticipant(i);
        controls.querySelector("#participant-delete-button").onclick = () => this.#handleRemoveParticipant(i);
        controls.querySelector("#participant-edit-button").onclick = () => {
          // TODO: Create a function that receives a participant and maps it to the object received by the form
          // Do this for all such forms
          const participantInputForm = new CreateOrEditParticipantForm(
            true,
            (data) => this.#handleEditParticipant(data, i),
            {
              name: this.#conversation.data.participants[i].name,
              displayName: this.#conversation.data.participants[i].displayName,
              img: this.#conversation.data.participants[i].img,
              imgScale: this.#conversation.data.participants[i].imgScale,
              linkedJournal: this.#conversation.data.participants[i].linkedJournal,
              linkedActor: this.#conversation.data.participants[i].linkedActor,
              faction: this.#conversation.data.participants[i].faction,
              anchorOptions: ANCHOR_OPTIONS,
              portraitAnchor: this.#conversation.data.participants[i].portraitAnchor,
            }
          );
          participantInputForm.render(true);
        };
      }
    }
  }

  #handleAddParticipant(participant) {
    processParticipantData(participant);

    this.#conversation.data.participants.push(participant);

    this.#onChangeHandler(this.#conversation);
  }

  #handleEditParticipant(participant, index) {
    processParticipantData(participant);

    this.#conversation.data.participants[index] = participant;

    this.#onChangeHandler(this.#conversation);
  }

  #handleReplaceAllParticipants(participants) {
    const processedParticipants = participants.map((participant) => {
      processParticipantData(participant);
      return participant;
    });

    this.#conversation.data.defaultActiveParticipant = undefined;
    this.#conversation.data.participants = processedParticipants;

    this.#onChangeHandler(this.#conversation);
  }

  #handleRemoveParticipant(index) {
    this.#conversation.data.participants.splice(index, 1);

    this.#onChangeHandler(this.#conversation);
  }

  #handleCloneParticipant(index) {
    const clonedParticipant = this.#conversation.data.participants[index];
    this.#conversation.data.participants.push(clonedParticipant);

    this.#onChangeHandler(this.#conversation);
  }

  #handleSetDefaultActiveParticipant(event, index) {
    if (!event.target) return;

    if (event.target.checked) {
      this.#conversation.data.defaultActiveParticipant = index;
    } else {
      this.#conversation.data.defaultActiveParticipant = undefined;
    }

    this.#onChangeHandler(this.#conversation);
  }
}
