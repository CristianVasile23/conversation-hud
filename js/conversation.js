import { ConversationInputForm } from "./formConversationInput.js";
import { ParticipantInputForm } from "./formAddParticipant.js";
import { PullParticipantsForm } from "./formPullParticipants.js";
import { ConversationBackgroundForm } from "./forms/ConversationBackgroundForm.js";
import { ConversationEntrySheet } from "./sheets/ConversationEntrySheet.js";
import { ConversationFactionSheet } from "./sheets/ConversationFactionSheet.js";
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
  setDefaultDataForParticipant,
  getConfirmationFromUser,
  checkIfCameraDockOnBottomOrTop,
  getConversationDataFromJournalId,
  convertActorToParticipant,
  updateParticipantFactionBasedOnSelectedFaction,
  getPortraitAnchorObjectFromParticipant,
  normalizeParticipantDataStructure,
} from "./helpers.js";
import { socket } from "./init.js";
import { ANCHOR_OPTIONS, MODULE_NAME } from "./constants.js";
import { ModuleSettings } from "./settings.js";

export class ConversationHud {
  // Function that initializes the class data
  init() {
    // Initialize variables
    this.conversationIsActive = false;
    this.conversationIsVisible = false;
    this.conversationIsMinimized = false;
    this.conversationIsSpeakingAs = false;
    this.conversationIsBlurred = true;
    this.activeConversation = null;

    this.dropzoneVisible = false;
    this.draggingParticipant = false;

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
      types: ["base"],
      makeDefault: false,
      label: game.i18n.localize("CHUD.sheets.entrySheet"),
    });

    DocumentSheetConfig.registerSheet(JournalEntry, "conversation-faction-sheet", ConversationFactionSheet, {
      types: ["base"],
      makeDefault: false,
      label: game.i18n.localize("CHUD.sheets.factionSheet"),
    });
  }

  // Function that renders the conversation hud
  async renderConversation(conversationData, conversationVisible) {
    // Set conversation data
    game.ConversationHud.conversationIsActive = true;
    game.ConversationHud.conversationIsVisible = conversationVisible;
    game.ConversationHud.activeConversation = conversationData;

    for (let i = 0; i < conversationData.participants.length; i++) {
      let participant = conversationData.participants[i];

      // Normalize participant data
      participant = normalizeParticipantDataStructure(participant);

      // Update faction banners
      if (participant.faction?.selectedFaction) {
        updateParticipantFactionBasedOnSelectedFaction(participant);
      }

      // Add anchor object if missing
      if (!participant.portraitAnchor) {
        participant.portraitAnchor = getPortraitAnchorObjectFromParticipant(participant);
      }
    }

    // Render templates
    const renderedHtml = await renderTemplate("modules/conversation-hud/templates/conversation.hbs", {
      hasDock: checkIfCameraDockOnBottomOrTop(),
      participants: conversationData.participants,
      isGM: game.user.isGM,
      portraitStyle: game.settings.get(MODULE_NAME, ModuleSettings.portraitStyle),
      displayParticipantsToPlayers: game.settings.get(MODULE_NAME, ModuleSettings.displayAllParticipantsToPlayers),
      activeParticipantFontSize: game.settings.get(MODULE_NAME, ModuleSettings.activeParticipantFontSize),
    });

    // Create the conversation container
    const element = document.createElement("div");
    element.id = "ui-conversation-hud";
    element.className = "conversation-hud-wrapper";
    if (conversationVisible) {
      element.classList.add("visible");
    }
    if (game.ConversationHud.conversationIsMinimized) {
      element.classList.add("minimized");
    }
    element.innerHTML = renderedHtml;

    game.ConversationHud.addDragDropListeners(element);

    const uiBottom = document.getElementById("ui-bottom");
    uiBottom.before(element);

    // Create background
    const conversationBackground = document.createElement("div");
    conversationBackground.id = "conversation-hud-background";
    conversationBackground.className = "conversation-hud-background";

    const blurAmount = game.settings.get(MODULE_NAME, ModuleSettings.blurAmount);
    conversationBackground.style.backdropFilter = `blur(${blurAmount}px)`;

    if (conversationData.conversationBackground) {
      conversationBackground.classList.add("conversation-hud-background-image");
      conversationBackground.style.backgroundImage = `url(${conversationData.conversationBackground})`;
    }

    if (conversationVisible && !game.ConversationHud.conversationIsMinimized) {
      conversationBackground.classList.add("visible");
    }

    const body = document.body;
    body.append(conversationBackground);

    // Render conversation controls
    updateConversationControls();

    // Set image
    game.ConversationHud.changeActiveImage(conversationData.activeParticipant);
  }

  // Function that activates listeners used for drag-drop functionality
  addDragDropListeners(element) {
    if (game.user.isGM) {
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
                type: "ConversationParticipant",
                participant: game.ConversationHud.activeConversation.participants[i],
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
  }

  // Function that removes the active conversation
  async removeConversation() {
    game.ConversationHud.conversationIsActive = false;
    game.ConversationHud.conversationIsVisible = false;
    if (!game.settings.get(MODULE_NAME, ModuleSettings.keepMinimize)) {
      game.ConversationHud.conversationIsMinimized = false;
    }
    game.ConversationHud.conversationIsSpeakingAs = false;
    game.ConversationHud.conversationIsBlurred = true;
    game.ConversationHud.activeConversation = null;

    const body = document.body;
    const conversationBackground = document.getElementById("conversation-hud-background");
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

  // Function that toggles the visibility of the active conversation
  toggleActiveConversationVisibility() {
    if (checkIfUserGM() && checkIfConversationActive()) {
      game.ConversationHud.conversationIsVisible = !game.ConversationHud.conversationIsVisible;
      socket.executeForEveryone("setConversationHudVisibility", game.ConversationHud.conversationIsVisible);
    }
  }

  // Function that toggles the visibility of the active conversation
  setActiveConversationVisibility(visibility) {
    if (checkIfUserGM() && checkIfConversationActive()) {
      if (typeof visibility !== "boolean") {
        return;
      }
      socket.executeForEveryone("setConversationHudVisibility", visibility);
    }
  }

  // Function that updates the data of the currently active conversation
  async updateActiveConversation(conversationData, visibility) {
    // Set conversation data
    game.ConversationHud.activeConversation = conversationData;

    // Update faction banners
    for (const participant of conversationData.participants) {
      if (participant.faction?.selectedFaction) {
        updateParticipantFactionBasedOnSelectedFaction(participant);
      }

      // Add anchor object if missing
      if (!participant.portraitAnchor) {
        participant.portraitAnchor = getPortraitAnchorObjectFromParticipant(participant);
      }
    }

    // Render template
    const renderedHtml = await renderTemplate("modules/conversation-hud/templates/conversation.hbs", {
      hasDock: checkIfCameraDockOnBottomOrTop(),
      participants: conversationData.participants,
      isGM: game.user.isGM,
      portraitStyle: game.settings.get(MODULE_NAME, ModuleSettings.portraitStyle),
      displayParticipantsToPlayers: game.settings.get(MODULE_NAME, ModuleSettings.displayAllParticipantsToPlayers),
      activeParticipantFontSize: game.settings.get(MODULE_NAME, ModuleSettings.activeParticipantFontSize),
    });

    // Add rendered template to the conversation hud
    const conversationHud = document.getElementById("ui-conversation-hud");
    if (conversationHud) {
      conversationHud.innerHTML = renderedHtml;
      game.ConversationHud.addDragDropListeners(conversationHud);
      game.ConversationHud.changeActiveImage(conversationData.activeParticipant);
    }

    const conversationBackground = document.getElementById("conversation-hud-background");
    if (conversationData.conversationBackground) {
      if (!conversationBackground.classList.contains("conversation-hud-background-image")) {
        conversationBackground.classList.add("conversation-hud-background-image");
      }
      conversationBackground.style.backgroundImage = `url(${conversationData.conversationBackground})`;
    } else {
      conversationBackground.classList.remove("conversation-hud-background-image");
      conversationBackground.style.backgroundImage = ``;
    }

    if (visibility !== undefined && game.user.isGM) {
      game.ConversationHud.setActiveConversationVisibility(visibility);
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
  async changeActiveImage(index) {
    const activeParticipantTemplate = await renderTemplate("modules/conversation-hud/templates/fragments/active_participant.hbs", {
      displayParticipant: index === -1 ? false : true,
      participant: game.ConversationHud.activeConversation.participants[index],
      portraitStyle: game.settings.get(MODULE_NAME, ModuleSettings.portraitStyle),
      activeParticipantFontSize: game.settings.get(MODULE_NAME, ModuleSettings.activeParticipantFontSize),
      activeParticipantFactionFontSize: game.settings.get(MODULE_NAME, ModuleSettings.activeParticipantFactionFontSize),
    });

    const activeParticipantAnchorPoint = document.querySelector("#active-participant-anchor-point");
    activeParticipantAnchorPoint.innerHTML = activeParticipantTemplate;

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
      const participantInputForm = new ParticipantInputForm(false, (data) => this.#handleAddParticipant(data));
      participantInputForm.render(true);
    }
  }

  // Function that adds an actor to the active conversation
  addActorToActiveConversation(actorId) {
    if (checkIfUserGM()) {
      const actor = game.actors.get(actorId);
      const participant = convertActorToParticipant(actor);
      this.#handleAddParticipant(participant);
    }
  }

  // Function that adds multiple actors to active conversation
  addActorsToActiveConversation(arrayOfActorIds) {
    if (checkIfUserGM()) {
      for (const actorId of arrayOfActorIds) {
        const actor = game.actors.get(actorId);
        const participant = convertActorToParticipant(actor);
        this.#handleAddParticipant(participant);
      }
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

  // Function that handles conversation being closed
  handleCloseActiveConversation() {
    return getConfirmationFromUser("CHUD.dialogue.onCloseActiveConversation", () => {
      game.ConversationHud.onToggleConversation(false);
    });
  }

  // Function that removes a participant from the active conversation
  removeParticipantFromActiveConversation(index) {
    if (checkIfUserGM()) {
      if (index < 0 || game.ConversationHud.activeConversation.participants.length < index) {
        console.error("ConversationHUD | Tried to update a participant with an invalid index");
        return;
      }

      getConfirmationFromUser("CHUD.dialogue.onRemoveParticipant", () => {
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
      });
    }
  }

  // Function that updates a participant from the active conversation
  updateParticipantFromActiveConversation(index) {
    if (checkIfUserGM()) {
      if (index < 0 || game.ConversationHud.activeConversation.participants.length < index) {
        console.error("ConversationHUD | Tried to update a participant with an invalid index");
        return;
      }

      const participantInputForm = new ParticipantInputForm(true, (data) => this.#handleUpdateParticipant(data, index), {
        name: game.ConversationHud.activeConversation.participants[index].name,
        displayName: game.ConversationHud.activeConversation.participants[index].displayName,
        img: game.ConversationHud.activeConversation.participants[index].img,
        imgScale: game.ConversationHud.activeConversation.participants[index].imgScale,
        linkedJournal: game.ConversationHud.activeConversation.participants[index].linkedJournal,
        linkedActor: game.ConversationHud.activeConversation.participants[index].linkedActor,
        faction: game.ConversationHud.activeConversation.participants[index].faction,
        anchorOptions: ANCHOR_OPTIONS,
        portraitAnchor: getPortraitAnchorObjectFromParticipant(game.ConversationHud.activeConversation.participants[index]),
      });
      participantInputForm.render(true);
    }
  }

  // Function that saves the active conversation to a journal entry
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
            this.#handleSaveConversation(formDataObject);
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
  startConversationFromData(data, visibility) {
    if (checkIfUserGM()) {
      let conversationData = {};

      conversationData.conversationBackground = "";
      conversationData.activeParticipant = -1;
      conversationData.defaultActiveParticipant = undefined;

      if (data instanceof Array) {
        conversationData.participants = data;
      } else {
        const conversationBackground = data.conversationBackground;
        if (conversationBackground) {
          conversationData.conversationBackground = conversationBackground;
        }

        const participants = data.participants;
        const defaultActiveParticipant = data.defaultActiveParticipant;
        if (participants) {
          conversationData.participants = participants;
          if (typeof defaultActiveParticipant !== "undefined") {
            conversationData.defaultActiveParticipant = defaultActiveParticipant;
          }
        }
      }

      let parsedVisibility = true;
      if (game.ConversationHud.conversationIsVisible !== undefined) {
        parsedVisibility = game.ConversationHud.conversationIsVisible;
      }
      if (visibility !== undefined) {
        parsedVisibility = visibility;
      }

      if (this.activeConversation) {
        this.#handleConversationUpdateData(conversationData, parsedVisibility);
      } else {
        this.#handleConversationCreationData(conversationData, parsedVisibility);
      }
    }
  }

  setConversationHudVisibility(newVisibility) {
    game.ConversationHud.conversationIsVisible = newVisibility;
    updateConversationControls();

    const conversationHud = document.getElementById("ui-conversation-hud");
    if (conversationHud) {
      if (newVisibility) {
        conversationHud.classList.add("visible");
      } else {
        conversationHud.classList.remove("visible");
      }
    }

    const conversationBackground = document.getElementById("conversation-hud-background");
    if (conversationBackground) {
      if (newVisibility) {
        if (!game.ConversationHud.conversationIsMinimized) {
          conversationBackground.classList.add("visible");
        }
      } else {
        conversationBackground.classList.remove("visible");
      }
    }
  }

  startConversationFromJournalId(journalId, startHidden = false) {
    const conversationData = getConversationDataFromJournalId(journalId);
    if (conversationData) {
      const visibility = startHidden === true ? false : true;
      game.ConversationHud.startConversationFromData(conversationData, visibility);
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

  // Function that toggles the conversation background blur
  async toggleBackgroundBlur() {
    if (checkIfUserGM() && checkIfConversationActive()) {
      game.ConversationHud.conversationIsBlurred = !game.ConversationHud.conversationIsBlurred;

      const conversationBackground = document.getElementById("conversation-hud-background");
      if (game.ConversationHud.conversationIsBlurred) {
        conversationBackground.style.display = "";
      } else {
        conversationBackground.style.display = "none";
      }

      updateConversationControls();
    }
  }

  // Function to change the conversation background
  changeConversationBackground() {
    if (checkIfUserGM()) {
      const conversationBackgroundForm = new ConversationBackgroundForm((data) => {
        const conversationData = {
          ...game.ConversationHud.activeConversation,
          conversationBackground: data.conversationBackground,
        };
        const visibility = game.ConversationHud.conversationIsVisible;
        game.ConversationHud.updateActiveConversation(conversationData, visibility);
      }, game.ConversationHud.activeConversation.conversationBackground);
      return conversationBackgroundForm.render(true);
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

  // Function that displays the linked notes of the participant at the given index
  async displayLinkedParticipantNotes(index) {
    if (checkIfUserGM() && checkIfConversationActive()) {
      if (index < 0 || game.ConversationHud.activeConversation.participants.length < index) {
        console.error("ConversationHUD | Tried to access a participant with an invalid index");
        return;
      }

      const linkedJournal = game.ConversationHud.activeConversation.participants[index].linkedJournal;
      if (linkedJournal) {
        game.ConversationHud.renderJournalSheet(linkedJournal);
      }
    }
  }

  // Function that receives a journal id and renders the referenced journal sheet in a separate tab
  async renderJournalSheet(journalId) {
    let journal = game.journal.get(journalId);

    if (!journal) {
      ui.notifications.error(game.i18n.localize("CHUD.errors.invalidJournalEntry"));
    } else {
      // Handler for MEJ so that the referenced document is displayed in a separate popup sheet and not the regular MEJ journal
      if (game.modules.get("monks-enhanced-journal")?.active) {
        if (game.MonksEnhancedJournal.getMEJType(journal)) {
          if (journal instanceof JournalEntry) {
            journal = journal.pages.contents[0];
          }
          game.MonksEnhancedJournal.fixType(journal);
        }
      }

      journal.sheet.render(true);
    }
  }

  // Function that displays the linked notes of the participant at the given index
  async displayLinkedParticipantActor(index) {
    if (checkIfUserGM() && checkIfConversationActive()) {
      if (index < 0 || game.ConversationHud.activeConversation.participants.length < index) {
        console.error("ConversationHUD | Tried to access a participant with an invalid index");
        return;
      }

      const linkedActor = game.ConversationHud.activeConversation.participants[index].linkedActor;
      if (linkedActor) {
        game.ConversationHud.renderActorSheet(linkedActor);
      }
    }
  }

  // Function that receives am actor id and renders the referenced actor sheet in a separate tab
  async renderActorSheet(actorId) {
    let actor = game.actors.get(actorId);

    if (!actor) {
      ui.notifications.error(game.i18n.localize("CHUD.errors.invalidActorEntry"));
    } else {
      actor.sheet.render(true);
    }
  }

  // Function that pulls actors from the current scene
  pullActorsFromScene() {
    if (checkIfUserGM()) {
      const pullParticipantsForm = new PullParticipantsForm((data) => {
        for (const participant of data) {
          this.#handleAddParticipant(participant);
        }
      });
      return pullParticipantsForm.render(true);
    }
  }

  // Function that transform an actor to a participant and can be called from anywhere
  actorToParticipant(actor) {
    if (checkIfUserGM()) {
      return convertActorToParticipant(actor);
    }
  }

  // Function that transform a token to a participant and can be called from anywhere
  tokenToParticipant(token) {
    if (checkIfUserGM()) {
      const participant = convertActorToParticipant(token.actor);
      participant.name = token.name;
      participant.id = token.id;
      return participant;
    }
  }

  async #handleSaveConversation(data) {
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
      const dataToSave = {
        conversationBackground: game.ConversationHud.activeConversation.conversationBackground,
        defaultActiveParticipant: game.ConversationHud.activeConversation.defaultActiveParticipant,
        participants: game.ConversationHud.activeConversation.participants,
      };
      await newConversationSheet.createEmbeddedDocuments("JournalEntryPage", [
        {
          text: { content: JSON.stringify(dataToSave) },
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
    setDefaultDataForParticipant(data);

    if (data.faction?.selectedFaction) {
      updateParticipantFactionBasedOnSelectedFaction(data);
    }

    // Add anchor object if missing
    if (!data.portraitAnchor) {
      data.portraitAnchor = getPortraitAnchorObjectFromParticipant(data);
    }

    // Push participant to the active conversation then update all the others
    game.ConversationHud.activeConversation.participants.push(data);
    socket.executeForEveryone("updateActiveConversation", game.ConversationHud.activeConversation);
  }

  #handleUpdateParticipant(data, index) {
    setDefaultDataForParticipant(data);

    // Update participant with the given index
    game.ConversationHud.activeConversation.participants[index] = data;
    socket.executeForEveryone("updateActiveConversation", game.ConversationHud.activeConversation);
  }

  // Function that parses conversation input form data and then activates the conversation hud
  #handleConversationCreationData(formData, visibility = true) {
    if (game.ConversationHud.conversationIsActive) {
      ui.notifications.error(game.i18n.localize("CHUD.errors.conversationAlreadyActive"));
      return;
    }

    let parsedData = {};
    parsedData.conversationBackground = formData.conversationBackground;
    parsedData.activeParticipant = -1;
    if (typeof formData.defaultActiveParticipant !== "undefined") {
      parsedData.activeParticipant = formData.defaultActiveParticipant;
    }
    parsedData.participants = formData.participants;
    parsedData.defaultActiveParticipant = formData.defaultActiveParticipant;

    socket.executeForEveryone("renderConversation", parsedData, visibility);

    // Finally, set the button status to active now that a conversation is active
    socket.executeForAllGMs("updateActivateHudButton", true);
  }

  // Function that parses conversation input form data and then updates the conversation hud
  #handleConversationUpdateData(formData, visibility) {
    let parsedData = {};
    parsedData.conversationBackground = formData.conversationBackground;
    parsedData.activeParticipant = -1;
    if (typeof formData.defaultActiveParticipant !== "undefined") {
      parsedData.activeParticipant = formData.defaultActiveParticipant;
    }
    parsedData.participants = formData.participants;
    parsedData.defaultActiveParticipant = formData.defaultActiveParticipant;

    socket.executeForEveryone("updateActiveConversation", parsedData, visibility);
  }
}
