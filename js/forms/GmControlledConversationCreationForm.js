/// <reference path="../types/GmControlledConversation/GmControlledConversation.js" />
/// <reference path="../types/ConversationData.js" />

import { ANCHOR_OPTIONS, CONVERSATION_TYPES } from "../constants/index.js";
import { CreateOrEditParticipantForm } from "./CreateOrEditParticipantForm.js";
import { PullParticipantsFromSceneForm } from "./PullParticipantsFromSceneForm.js";
import {
  getActorDataFromDragEvent,
  moveInArray,
  getDragAndDropIndex,
  hideDragAndDropIndicator,
  showDragAndDropIndicator,
  processParticipantData,
} from "../helpers/index.js";

export class GmControlledConversationCreationForm extends FormApplication {
  // State variables
  /** @type {(conversationData: ConversationData) => void | undefined} } */
  callbackFunction = undefined;
  conversationBackground = "";
  participants = [];
  defaultActiveParticipant = undefined;

  // Drag and drop variables
  dropzoneVisible = false;
  draggingParticipant = false;

  /**
   * TODO: Add JSDoc
   *
   * @param {(conversationData: ConversationData) => void} callbackFunction
   */
  constructor(callbackFunction) {
    super();
    this.callbackFunction = callbackFunction;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["form"],
      popOut: true,
      template: "modules/conversation-hud/templates/conversation_creation_form.hbs",
      id: "conversation-start-form",
      title: game.i18n.localize("CHUD.actions.createConversation"),
      width: 635,
      height: 640,
    });
  }

  getData() {
    for (const participant of this.participants) {
      processParticipantData(participant);
    }

    return {
      isGM: game.user.isGM,
      conversationBackground: this.conversationBackground,
      participants: this.participants,
      defaultActiveParticipant: this.defaultActiveParticipant,
    };
  }

  activateListeners(html) {
    super.activateListeners(html);

    // Add event listener on the pull participants from scene button
    html.find("#pull-participants-from-scene").click(async (e) => {
      const pullParticipantsFromSceneForm = new PullParticipantsFromSceneForm((data) => {
        for (const participant of data) {
          this.#handleAddParticipant(participant);
        }
      });
      return pullParticipantsFromSceneForm.render(true);
    });

    // Add event listener on the add participant button
    html.find("#add-participant").click(async (e) => {
      const participantCreationForm = new CreateOrEditParticipantForm(false, (data) =>
        this.#handleAddParticipant(data)
      );
      return participantCreationForm.render(true);
    });

    // Drag and drop functionality
    const dragDropWrapper = html.find("#gm-controlled-conversation-sheet-content")[0];
    const dragDropZone = html.find("#gm-controlled-conversation-sheet-dropzone")[0];
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

    // Add listeners on all the control buttons present on the conversation participants
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

            // Update sheet
            this.render(false);
          } else {
            console.error("ConversationHUD | Data object was empty inside conversation participant ondrop function");
          }

          this.draggingParticipant = false;
        };

        // Bind function to the set active by default checkbox
        conversationParticipants[i].querySelector("#participant-active-by-default-checkbox").onchange = (event) =>
          this.#handleSetDefaultActiveParticipant(event, i);

        // Bind functions to the edit and remove buttons
        const controls = conversationParticipants[i].querySelector(".controls-wrapper");
        controls.querySelector("#participant-clone-button").onclick = () => this.#handleCloneParticipant(i);
        controls.querySelector("#participant-delete-button").onclick = () => this.#handleRemoveParticipant(i);
        controls.querySelector("#participant-edit-button").onclick = () => {
          const participantEditForm = new CreateOrEditParticipantForm(
            true,
            (data) => this.#handleEditParticipant(data, i),
            {
              name: this.participants[i].name,
              displayName: this.participants[i].displayName,
              img: this.participants[i].img,
              imgScale: this.participants[i].imgScale,
              linkedJournal: this.participants[i].linkedJournal,
              linkedActor: this.participants[i].linkedActor,
              faction: this.participants[i].faction,
              anchorOptions: ANCHOR_OPTIONS,
              portraitAnchor: this.participants[i].portraitAnchor,
            }
          );
          participantEditForm.render(true);
        };
      }
    }
  }

  /**
   *
   * @param {*} event
   * @param {*} formData
   */
  async _updateObject(event, formData) {
    /** @type {GmControlledConversation} */
    const gmControlledConversation = {
      data: {
        participants: this.participants,
        defaultActiveParticipant: this.defaultActiveParticipant,
      },
      features: {
        isMinimized: false,
        isMinimizationLocked: false,
        isSpeakingAs: false,
        isBackgroundVisible: false,
      },
    };

    /** @type {ConversationData} */
    const conversationData = {
      type: CONVERSATION_TYPES.GM_CONTROLLED,
      background: formData.conversationBackground,
      conversation: gmControlledConversation,
    };

    // Pass data to conversation class
    this.callbackFunction(conversationData);
  }

  #handleAddParticipant(data) {
    processParticipantData(data);

    this.participants.push(data);
    this.render(false);
  }

  #handleEditParticipant(data, index) {
    processParticipantData(data);

    this.participants[index] = data;
    this.render(false);
  }

  #handleReplaceAllParticipants(data) {
    const processedData = data.map((participant) => {
      processParticipantData(participant);
      return participant;
    });

    this.defaultActiveParticipant = undefined;
    this.participants = processedData;
    this.render(false);
  }

  #handleRemoveParticipant(index) {
    this.participants.splice(index, 1);
    this.render(false);
  }

  #handleCloneParticipant(index) {
    const clonedParticipant = this.participants[index];
    this.participants.push(clonedParticipant);
    this.render(false);
  }

  #handleSetDefaultActiveParticipant(event, index) {
    if (!event.target) return;

    if (event.target.checked) {
      this.defaultActiveParticipant = index;
    } else {
      this.defaultActiveParticipant = undefined;
    }

    this.render(false);
  }
}
