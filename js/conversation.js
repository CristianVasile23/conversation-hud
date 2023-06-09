import { ConversationInputForm } from "./formConversationInput.js";
import { FileInputForm } from "./formAddParticipant.js";
import { ConversationEntrySheet } from "./conversationEntrySheet.js";
import {
  checkIfConversationActive,
  checkIfUserGM,
  getActorDataFromDragEvent,
  moveInArray,
  updateConversationControls,
  updateConversationLayout,
  hideDragAndDropIndicator,
  displayDragAndDropIndicator,
  getDragAndDropIndex,
} from "./helpers.js";
import { socket } from "./init.js";
import { MODULE_NAME } from "./constants.js";
import { ModuleSettings } from "./settings.js";

export class ConversationHud {
  // Function that initializes the class data
  init() {
    // Initialize variables
    this.conversationIsActive = false;
    this.conversationIsVisible = false;
    this.conversationIsMinimized = false;
    this.conversationIsSpeakingAs = false;
    this.activeConversation = null;

    this.dropzoneVisible = false;
    this.draggingParticipant = false;

    // Register local hooks
    Hooks.on("toggleConversation", this.onToggleConversation.bind(this));

    // Register socket hooks
    this.registerSocketFunctions();

    // Register conversation sheet
    this.registerConversationSheet();
  }

  // Function that initializes the socketlib sockets
  registerSocketFunctions() {
    // Wait for the socket to be initialized (if it hasn't been already)
    if (socket) {
      socket.register("renderConversation", this.renderConversation);
      socket.register("removeConversation", this.removeConversation);

      socket.register("getActiveConversation", this.getActiveConversation);
      socket.register("setActiveConversation", this.setActiveConversation);
      socket.register("updateActiveConversation", this.updateActiveConversation);

      socket.register("setActiveParticipant", this.setActiveParticipant);

      socket.register("setConversationHudVisibility", this.setConversationHudVisibility);

      socket.register("getActiveConversationVisibility", this.getActiveConversationVisibility);

      socket.register("updateActivateHudButton", this.updateActivateHudButton);
    } else {
      setTimeout(this.registerSocketFunctions, 250);
    }
  }

  // Function that register the conversation sheet that is used to store conversations
  registerConversationSheet() {
    DocumentSheetConfig.registerSheet(JournalEntry, "conversation-entry-sheet", ConversationEntrySheet, {
      label: "Conversation Entry Sheet",
      makeDefault: false,
    });
  }

  // Function that renders the conversation hud
  async renderConversation(conversationData, conversationVisible) {
    // Set conversation data
    game.ConversationHud.conversationIsActive = true;
    game.ConversationHud.conversationIsVisible = conversationVisible;
    game.ConversationHud.activeConversation = conversationData;

    // Render templates
    const renderedHtml = await renderTemplate("modules/conversation-hud/templates/conversation.hbs", {
      participants: conversationData.participants,
      isGM: game.user.isGM,
      portraitStyle: game.settings.get(MODULE_NAME, ModuleSettings.portraitStyle),
      portraitAnchor: game.settings.get(MODULE_NAME, ModuleSettings.portraitAnchor),
      activeParticipantFontSize: game.settings.get(MODULE_NAME, ModuleSettings.activeParticipantFontSize),
    });
    const conversationControls = await renderTemplate("modules/conversation-hud/templates/conversation_controls.hbs", {
      isGM: game.user.isGM,
      isMinimized: game.ConversationHud.conversationIsMinimized,
      isVisible: game.ConversationHud.conversationIsVisible,
      isSpeakingAs: game.ConversationHud.conversationIsSpeakingAs,
      features: {
        minimizeEnabled: game.settings.get(MODULE_NAME, ModuleSettings.enableMinimize),
        speakAsEnabled: game.settings.get(MODULE_NAME, ModuleSettings.enableSpeakAs),
      },
    });

    // Create the conversation container
    const element = document.createElement("div");
    element.id = "ui-conversation-hud";
    element.className = "conversation-hud-wrapper";
    if (conversationVisible) {
      element.classList.add("visible");
    }
    element.innerHTML = renderedHtml;

    game.ConversationHud.addDragDropListeners(element);

    const uiBottom = document.getElementById("ui-bottom");
    uiBottom.before(element);

    // Create background
    const conversationBackground = document.createElement("div");
    conversationBackground.id = "conversation-background";
    conversationBackground.className = "conversation-background";
    if (conversationVisible) {
      conversationBackground.classList.add("visible");
    }

    const body = document.body;
    body.append(conversationBackground);

    // Render conversation controls
    const controls = document.createElement("section");
    controls.id = "ui-conversation-controls";
    controls.setAttribute("data-tooltip-direction", "LEFT");
    controls.innerHTML = conversationControls;

    const uiRight = document.getElementById("ui-right");
    uiRight.before(controls);

    // Set image
    game.ConversationHud.changeActiveImage(conversationData.activeParticipant);
  }

  // Function that activates listeners used for drag-drop functionality
  addDragDropListeners(element) {
    // Drag & drop listeners for the dropzone
    const conversationContent = element.querySelector("#conversation-hud-content");
    const dragDropZone = element.querySelector("#conversation-hud-dropzone");

    conversationContent.ondragenter = (event) => {
      if (!game.ConversationHud.draggingParticipant) {
        game.ConversationHud.dropzoneVisible = true;
        conversationContent.classList.add("active-dropzone");
      }
    };

    dragDropZone.ondragleave = () => {
      if (game.ConversationHud.dropzoneVisible) {
        game.ConversationHud.dropzoneVisible = false;
        conversationContent.classList.remove("active-dropzone");
      }
    };

    conversationContent.ondrop = async (event) => {
      if (game.ConversationHud.dropzoneVisible) {
        game.ConversationHud.handleActorDrop(event);

        game.ConversationHud.dropzoneVisible = false;
        conversationContent.classList.remove("active-dropzone");
      }
    };

    // Drag & drop listeners for the participants list
    const conversationParticipantList = element.querySelector("#conversationParticipantList");
    const conversationParticipants = conversationParticipantList.children;
    if (conversationParticipants) {
      for (let i = 0; i < conversationParticipants.length - 1; i++) {
        conversationParticipants[i].ondragstart = (event) => {
          game.ConversationHud.draggingParticipant = true;
          conversationParticipantList.classList.add("drag-active");

          // Save the index of the dragged participant in the data transfer object
          event.dataTransfer.setData(
            "text/plain",
            JSON.stringify({
              index: i,
            })
          );
        };

        conversationParticipants[i].ondragend = (event) => {
          game.ConversationHud.draggingParticipant = false;
          conversationParticipantList.classList.remove("drag-active");
        };

        conversationParticipants[i].ondragover = (event) => {
          displayDragAndDropIndicator(conversationParticipants[i], event);
        };

        conversationParticipants[i].ondragleave = (event) => {
          hideDragAndDropIndicator(conversationParticipants[i]);
        };

        conversationParticipants[i].ondrop = (event) => {
          const participants = game.ConversationHud.activeConversation?.participants;
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
            moveInArray(participants, oldIndex, newIndex);

            // Update active participant index
            const activeParticipantIndex = game.ConversationHud.activeConversation.activeParticipant;
            if (activeParticipantIndex === oldIndex) {
              game.ConversationHud.activeConversation.activeParticipant = newIndex;
            } else {
              if (activeParticipantIndex > oldIndex && activeParticipantIndex <= newIndex) {
                game.ConversationHud.activeConversation.activeParticipant -= 1;
              }
              if (activeParticipantIndex < oldIndex && activeParticipantIndex >= newIndex) {
                game.ConversationHud.activeConversation.activeParticipant += 1;
              }
            }

            game.ConversationHud.activeConversation.participants = participants;
            socket.executeForEveryone("updateActiveConversation", game.ConversationHud.activeConversation);
          } else {
            console.error("ConversationHUD | Data object was empty inside conversation participant ondrop function");
          }

          game.ConversationHud.draggingParticipant = false;
        };
      }
    }
  }

  // Function that removes the active conversation
  async removeConversation() {
    game.ConversationHud.conversationIsActive = false;
    game.ConversationHud.conversationIsVisible = false;
    game.ConversationHud.conversationIsMinimized = false;
    game.ConversationHud.conversationIsSpeakingAs = false;
    game.ConversationHud.activeConversation = null;

    const body = document.body;
    const conversationBackground = document.getElementById("conversation-background");
    if (conversationBackground) {
      body.removeChild(conversationBackground);
    }

    const uiMiddle = document.getElementById("ui-middle");
    const conversation = document.getElementById("ui-conversation-hud");
    if (conversation) {
      uiMiddle.removeChild(conversation);
    }

    // Remove GM conversation controls
    const uiInterface = document.getElementById("interface");
    const controls = document.getElementById("ui-conversation-controls");
    if (controls) {
      uiInterface.removeChild(controls);
    }
  }

  // Function that gets the data of the currently active conversation
  getActiveConversation() {
    let conversationObject = {};
    conversationObject.conversationIsActive = game.ConversationHud.conversationIsActive;
    conversationObject.activeConversation = game.ConversationHud.activeConversation;
    return conversationObject;
  }

  // Function that returns the visibility of the currently active conversation
  getActiveConversationVisibility() {
    return game.ConversationHud.conversationIsVisible;
  }

  // Function that sets the data of the currently active conversation
  setActiveConversation(conversationData) {
    game.ConversationHud.activeConversation = conversationData;
  }

  // Function that updates the data of the currently active conversation
  async updateActiveConversation(conversationData) {
    // Set conversation data
    game.ConversationHud.activeConversation = conversationData;

    // Render template
    const renderedHtml = await renderTemplate("modules/conversation-hud/templates/conversation.hbs", {
      participants: conversationData.participants,
      isGM: game.user.isGM,
      portraitStyle: game.settings.get(MODULE_NAME, ModuleSettings.portraitStyle),
      portraitAnchor: game.settings.get(MODULE_NAME, ModuleSettings.portraitAnchor),
      activeParticipantFontSize: game.settings.get(MODULE_NAME, ModuleSettings.activeParticipantFontSize),
    });

    // Add rendered template to the conversation hud
    const conversationHud = document.getElementById("ui-conversation-hud");
    if (conversationHud) {
      conversationHud.innerHTML = renderedHtml;
      game.ConversationHud.addDragDropListeners(conversationHud);
      game.ConversationHud.changeActiveImage(conversationData.activeParticipant);
    }
  }

  // Function that either triggers the conversation creation form, or removes the active conversation
  async onToggleConversation(shouldCreateConversation) {
    if (checkIfUserGM()) {
      if (shouldCreateConversation) {
        if (!game.ConversationHud.conversationIsActive) {
          // Set button active status to false until a successful form has been completed
          ui.controls.controls
            .find((controls) => controls.name === "notes")
            .tools.find((tools) => tools.name === "activateHud").active = false;

          // Create form
          new ConversationInputForm((data) => this.#handleConversationCreationData(data)).render(true);
        } else {
          ui.notifications.error(game.i18n.localize("CHUD.errors.conversationAlreadyActive"));
        }
      } else {
        if (game.ConversationHud.conversationIsActive) {
          socket.executeForEveryone("removeConversation");
          socket.executeForAllGMs("updateActivateHudButton", false);
        } else {
          ui.notifications.error(game.i18n.localize("CHUD.errors.noActiveConversation"));
        }
      }
    }
  }

  // Function that changes the active participant
  changeActiveParticipant(index) {
    if (checkIfUserGM()) {
      // If we have clicked on an already active participant, then we will remove them as active
      if (game.ConversationHud.activeConversation.activeParticipant === index) {
        index = -1;
      }

      socket.executeForEveryone("setActiveParticipant", index);
    }
  }

  // Function called by the socketlib sockets
  setActiveParticipant(index) {
    game.ConversationHud.activeConversation.activeParticipant = index;
    game.ConversationHud.changeActiveImage(index);
  }

  // Function that changes the active participant image
  changeActiveImage(index) {
    const image = document.getElementById("conversationActiveParticipant");
    const imageText = document.getElementById("conversationActiveParticipantName");
    const activeMsg = document.getElementById("conversationNoActiveParticipantMsg");

    if (index === -1) {
      image.src = "";
      image.classList.remove("active");
      imageText.textContent = "";
      imageText.classList.remove("active");

      activeMsg.classList.add("active");
    } else {
      image.src = this.activeConversation.participants[index].img;
      image.classList.add("active");
      imageText.textContent = this.activeConversation.participants[index].name;
      imageText.classList.add("active");

      activeMsg.classList.remove("active");
    }

    // Change active class of all other elements
    const conversationParticipants = document.getElementById("conversationParticipantList").children;
    if (conversationParticipants) {
      for (let i = 0; i < conversationParticipants.length; i++) {
        if (index === i) {
          conversationParticipants[i].classList.add("active");
        } else {
          conversationParticipants[i].classList.remove("active");
        }
      }
    }
  }

  // Function that adds a participant to the active conversation
  addParticipantToActiveConversation() {
    if (checkIfUserGM()) {
      const fileInputForm = new FileInputForm(false, (data) => this.#handleAddParticipant(data));
      fileInputForm.render(true);
    }
  }

  // Function that handles drag and drop order rearrangement of conversation participants
  async handleParticipantDrop(event) {
    if (checkIfUserGM()) {
      event.preventDefault();
    }
  }

  // Function that handles drag and drop for actors
  async handleActorDrop(event) {
    if (checkIfUserGM()) {
      event.preventDefault();
      const data = await getActorDataFromDragEvent(event);
      if (data && data.length > 0) {
        data.forEach((participant) => {
          this.#handleAddParticipant(participant);
        });
      }
    }
  }

  // Function that removes a participant from the active conversation
  removeParticipantFromActiveConversation(index) {
    if (checkIfUserGM()) {
      // Check to see if the removed participant is the active one
      // Otherwise, check to see if the removed participant is before the active one, in which case
      // we need to update the active participant index by lowering it by one
      if (game.ConversationHud.activeConversation.activeParticipant === index) {
        game.ConversationHud.activeConversation.activeParticipant = -1;
      } else if (index < game.ConversationHud.activeConversation.activeParticipant) {
        game.ConversationHud.activeConversation.activeParticipant -= 1;
      }

      // Remove participant with the given index
      game.ConversationHud.activeConversation.participants.splice(index, 1);

      socket.executeForEveryone("updateActiveConversation", game.ConversationHud.activeConversation);
    }
  }

  // Function that updates a participant from the active conversation
  updateParticipantFromActiveConversation(index) {
    if (checkIfUserGM()) {
      if (index < 0 || this.activeConversation.participants.length < index) {
        console.error("ConversationHUD | Tried to update a participant with an invalid index");
        return;
      }

      const fileInputForm = new FileInputForm(true, (data) => this.#handleUpdateParticipant(data, index), {
        name: this.activeConversation.participants[index].name,
        img: this.activeConversation.participants[index].img,
      });
      fileInputForm.render(true);
    }
  }

  // Function that saves the active conversation to a clipboard
  async saveActiveConversation() {
    if (checkIfUserGM()) {
      if (game.ConversationHud.activeConversation) {
        // Create a prompt for saving the conversation, asking the users to introduce a name and to specify a folder
        const folders = game.folders.filter((f) => f.type === "JournalEntry" && f.displayed);
        const dialogContent = await renderTemplate("modules/conversation-hud/templates/conversation_save.hbs", {
          folders,
          name: game.i18n.format("DOCUMENT.New", { type: "Conversation Sheet" }),
        });

        return Dialog.prompt({
          title: "Save Conversation",
          content: dialogContent,
          label: "Save Conversation",
          callback: (html) => {
            const formElement = html[0].querySelector("form");
            const formData = new FormDataExtended(formElement);
            const formDataObject = formData.object;
            this.#handleConversationSave(formDataObject);
          },
          rejectClose: false,
        });
      } else {
        ui.notifications.error(game.i18n.localize("CHUD.errors.noActiveConversation"));
      }
    }
  }

  updateActivateHudButton(status) {
    ui.controls.controls.find((controls) => controls.name === "notes").tools.find((tools) => tools.name === "activateHud").active = status;
    ui.controls.render();
  }

  // Function that can be called from a macro in order to trigger a conversation
  startConversationFromData(participants) {
    if (checkIfUserGM()) {
      let conversationData = {};
      conversationData.type = 1;
      conversationData.participants = participants;
      conversationData.activeParticipant = -1;

      if (this.activeConversation) {
        this.#handleConversationUpdateData(conversationData);
      } else {
        this.#handleConversationCreationData(conversationData);
      }
    }
  }

  setConversationHudVisibility(newVisibility) {
    game.ConversationHud.conversationIsVisible = newVisibility;
    updateConversationControls();

    const conversationHud = document.getElementById("ui-conversation-hud");
    if (newVisibility) {
      conversationHud.classList.add("visible");
    } else {
      conversationHud.classList.remove("visible");
    }

    const conversationBackground = document.getElementById("conversation-background");
    if (newVisibility) {
      if (!game.ConversationHud.conversationIsMinimized) {
        conversationBackground.classList.add("visible");
      }
    } else {
      conversationBackground.classList.remove("visible");
    }
  }

  // Function that toggles the visibility of the active conversation
  toggleActiveConversationVisibility() {
    if (checkIfUserGM() && checkIfConversationActive()) {
      game.ConversationHud.conversationIsVisible = !game.ConversationHud.conversationIsVisible;
      socket.executeForEveryone("setConversationHudVisibility", game.ConversationHud.conversationIsVisible);
    }
  }

  // Function that minimizes or maximizes the active conversation
  async toggleActiveConversationMode() {
    if (game.settings.get(MODULE_NAME, ModuleSettings.enableMinimize)) {
      if (checkIfConversationActive()) {
        game.ConversationHud.conversationIsMinimized = !game.ConversationHud.conversationIsMinimized;
        updateConversationControls();
        updateConversationLayout();
      }
    } else {
      ui.notifications.error(game.i18n.localize("CHUD.errors.featureNotEnabled"));
    }
  }

  // Function that toggles the speaking as mode
  async toggleSpeakingAsMode() {
    if (game.settings.get(MODULE_NAME, ModuleSettings.enableSpeakAs)) {
      if (checkIfUserGM() && checkIfConversationActive()) {
        game.ConversationHud.conversationIsSpeakingAs = !game.ConversationHud.conversationIsSpeakingAs;
        updateConversationControls();
      }
    } else {
      ui.notifications.error(game.i18n.localize("CHUD.errors.featureNotEnabled"));
    }
  }

  // Function that adds token participants to a conversation
  toggleTokenParticipantsConversationStatus(participants) {
    if (checkIfUserGM() && checkIfConversationActive()) {
      const currentParticipants = game.ConversationHud.activeConversation.participants;

      // Parse the list of current participants and check if there are any token participants within it
      // If so, create separate list of indexes which will be used to remove the active token participants
      let participantsToAdd = [];
      let participantsIndexesToRemove = [];
      participants.forEach((participant) => {
        const index = currentParticipants.findIndex((e) => e.id === participant.id);
        if (index !== -1) {
          participantsIndexesToRemove.push(index);
        } else {
          participantsToAdd.push(participant);
        }
      });

      // Sort indexes in descending order so as not to shift the array when removing participants
      participantsIndexesToRemove = participantsIndexesToRemove.sort((a, b) => b - a);
      participantsIndexesToRemove.forEach((index) => {
        this.removeParticipantFromActiveConversation(index);
      });

      participantsToAdd.forEach((participant) => {
        this.#handleAddParticipant(participant);
      });
    }
  }

  async #handleConversationSave(data) {
    const permissions = {};
    game.users?.forEach((u) => (permissions[u.id] = game.user?.id === u.id ? 3 : 0));
    const newConversationSheet = await JournalEntry.create({
      name: data.name || "New Conversation",
      folder: data.folder || "",
      flags: {
        core: {
          sheetClass: `conversation-entry-sheet.${ConversationEntrySheet.name}`,
        },
      },
      ownership: permissions,
    });

    if (newConversationSheet) {
      await newConversationSheet.createEmbeddedDocuments("JournalEntryPage", [
        {
          text: { content: JSON.stringify(this.activeConversation.participants) },
          name: "Conversation Participants",
          flags: {
            "conversation-hud": { type: "conversation" },
          },
        },
      ]);
      ui.notifications.info(game.i18n.localize("CHUD.info.saveSuccessful"));
    } else {
      ui.notifications.error(game.i18n.localize("CHUD.errors.saveUnsuccessful"));
    }
  }

  // Function that adds a single participant to the active conversation
  #handleAddParticipant(data) {
    if (data.name === "") {
      data.name = game.i18n.localize("CHUD.anonymous");
    }
    if (data.img === "") {
      data.img = "modules/conversation-hud/img/silhouette.jpg";
    }

    // Push participant to the active conversation then update all the others
    game.ConversationHud.activeConversation.participants.push(data);
    socket.executeForEveryone("updateActiveConversation", game.ConversationHud.activeConversation);
  }

  #handleUpdateParticipant(data, index) {
    if (data.name === "") {
      data.name = game.i18n.localize("CHUD.anonymous");
    }
    if (data.img === "") {
      data.img = "modules/conversation-hud/img/silhouette.jpg";
    }

    // Update participant with the given index
    game.ConversationHud.activeConversation.participants[index] = data;
    socket.executeForEveryone("updateActiveConversation", game.ConversationHud.activeConversation);
  }

  // Function that parses conversation input form data and then activates the conversation hud
  #handleConversationCreationData(formData) {
    if (game.ConversationHud.conversationIsActive) {
      ui.notifications.error(game.i18n.localize("CHUD.errors.conversationAlreadyActive"));
      return;
    }

    let parsedData = {};
    parsedData.activeParticipant = -1;
    parsedData.participants = formData.participants;

    socket.executeForEveryone("renderConversation", parsedData, true);

    // Finally, set the button status to active now that a conversation is active
    socket.executeForAllGMs("updateActivateHudButton", true);
  }

  // Function that parses conversation input form data and then updates the conversation hud
  #handleConversationUpdateData(formData) {
    let parsedData = {};
    parsedData.activeParticipant = -1;
    parsedData.participants = formData.participants;

    socket.executeForEveryone("updateActiveConversation", parsedData);
  }
}
