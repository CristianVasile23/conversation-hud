import { FileInputForm } from "./formAddParticipant.js";
import {
  getActorDataFromDragEvent,
  moveInArray,
  hideDragAndDropIndicator,
  displayDragAndDropIndicator,
  getDragAndDropIndex,
} from "./helpers.js";

export class ConversationInputForm extends FormApplication {
  constructor(callbackFunction) {
    super();
    this.callbackFunction = callbackFunction;
    this.participants = [];

    this.dropzoneVisible = false;
    this.draggingParticipant = false;
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["form"],
      popOut: true,
      template: "modules/conversation-hud/templates/conversation_input.hbs",
      id: "conversation-start-form",
      title: game.i18n.localize("CHUD.createConversation"),
      width: 635,
      height: 500,
      resizable: false,
    });
  }

  getData() {
    return {
      participants: this.participants,
    };
  }

  activateListeners(html) {
    // Add event listener on the add participant button
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
        const controls = conversationParticipants[i].querySelector(".participant-controls").children;
        controls[0].onclick = () => {
          const fileInputForm = new FileInputForm(true, (data) => this.#handleEditParticipant(data, i), {
            name: this.participants[i].name,
            img: this.participants[i].img,
          });
          fileInputForm.render(true);
        };
        controls[1].onclick = () => this.#handleRemoveParticipant(i);
      }
    }
  }

  async _updateObject(event, formData) {
    // Parse the form data
    let parsedData = {};

    // Data type is added as a way of future-proofing the code
    parsedData.type = 0;
    parsedData.participants = this.participants;

    // Pass data to conversation class
    this.callbackFunction(parsedData);
  }

  #handleEditParticipant(data, index) {
    if (data.name === "") {
      data.name = game.i18n.localize("CHUD.anonymous");
    }
    if (data.img === "") {
      data.img = "modules/conversation-hud/img/silhouette.jpg";
    }

    this.participants[index] = data;
    this.render(false);
  }

  #handleAddParticipant(data) {
    if (data.name === "") {
      data.name = game.i18n.localize("CHUD.anonymous");
    }
    if (data.img === "") {
      data.img = "modules/conversation-hud/img/silhouette.jpg";
    }

    this.participants.push(data);
    this.render(false);
  }

  #handleRemoveParticipant(index) {
    this.participants.splice(index, 1);
    this.render(false);
  }
}
