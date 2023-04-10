import { FileInputForm } from "./formAddParticipant.js";
import { getActorDataFromDragEvent } from "./helpers.js";

export class ConversationInputForm extends FormApplication {
  constructor(callbackFunction) {
    super();
    this.callbackFunction = callbackFunction;
    this.participants = [];
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["form"],
      popOut: true,
      template: "modules/conversation-hud/templates/conversation_input.html",
      id: "conversation-start-form",
      title: game.i18n.localize("CHUD.createConversation"),
      width: 635,
      height: "auto",
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
        dragDropWrapper.classList.add("active-dropzone");
      };

      dragDropZone.ondragleave = () => {
        dragDropWrapper.classList.remove("active-dropzone");
      };

      dragDropWrapper.ondrop = async (event) => {
        event.preventDefault();
        const data = await getActorDataFromDragEvent(event);
        if (data) {
          this.#handleAddParticipant(data);
        }
        dragDropWrapper.classList.remove("active-dropzone");
      };
    }

    // Add listeners on all the control buttons present on the conversation participants
    const participantsObject = html.find("#conversation-participants-list")[0];
    if (participantsObject) {
      const participants = participantsObject.children;
      for (let i = 0; i < participants.length; i++) {
        const controls = participants[i].children[2].children;
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
