import { ConversationInputForm } from "./formConversationInput.js";
import { FileInputForm } from "./formAddParticipant.js";
import { ConversationEntrySheet } from "./conversationEntrySheet.js";

class ConversationHud {
  // Function that initializes the class data
  init() {
    // Initialize variables
    this.conversationIsActive = false;
    this.conversationIsVisible = false;
    this.conversationIsMinimized = false;
    this.activeConversation = null;

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

    // Data that is passed to the template
    const template_data = {
      participants: conversationData.participants,
      isGM: game.user.isGM,
    };

    // Render templates
    const renderedHtml = await renderTemplate("modules/conversation-hud/templates/conversation.html", template_data);
    const conversationControls = await renderTemplate("modules/conversation-hud/templates/conversation_controls.html", {
      isGM: game.user.isGM,
      isMinimized: game.ConversationHud.conversationIsMinimized,
    });

    // Create the conversation container
    const element = document.createElement("div");
    element.id = "ui-conversation-hud";
    element.className = "conversation-hud-wrapper";
    if (conversationVisible) {
      element.classList.add("visible");
    }
    element.innerHTML = renderedHtml;

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
    controls.innerHTML = conversationControls;

    const uiRight = document.getElementById("ui-right");
    uiRight.before(controls);

    // Set image
    game.ConversationHud.changeActiveImage(conversationData.activeParticipant);
  }

  // Function that removes the active conversation
  async removeConversation() {
    game.ConversationHud.conversationIsActive = false;
    game.ConversationHud.conversationIsVisible = false;
    game.ConversationHud.conversationIsMinimized = false;
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

    // Data that is passed to the template
    const template_data = {
      participants: conversationData.participants,
      isGM: game.user.isGM,
    };

    // Render template
    const renderedHtml = await renderTemplate("modules/conversation-hud/templates/conversation.html", template_data);

    // Add rendered template to the conversation hud
    const conversationHud = document.getElementById("ui-conversation-hud");
    if (conversationHud) {
      conversationHud.innerHTML = renderedHtml;

      // Set image
      game.ConversationHud.changeActiveImage(conversationData.activeParticipant);
    }
  }

  // Function that either triggers the conversation creation form, or removes the active conversation
  async onToggleConversation(toggle) {
    if (toggle) {
      if (!this.conversationIsActive) {
        // Set button active status to false until a successful form has been completed
        ui.controls.controls.find((controls) => controls.name == "notes").tools.find((tools) => tools.name == "activateHud").active = false;

        // Create form
        new ConversationInputForm((data) => this.#handleConversationCreationData(data)).render(true);
      }
    } else {
      if (this.conversationIsActive) {
        socket.executeForEveryone("removeConversation");
        socket.executeForAllGMs("updateActivateHudButton", false);
      }
    }
  }

  // Function that returns whether or not a conversation is currently active
  getConversationStatus() {
    return this.conversationIsActive;
  }

  // Function that changes the active participant
  changeActiveParticipant(index) {
    if (game.user.isGM) {
      // If we have clicked on an already active participant, then we will remove them as active
      if (game.ConversationHud.activeConversation.activeParticipant === index) {
        index = -1;
      }

      socket.executeForEveryone("setActiveParticipant", index);
    }
  }

  // Function called by the socketlib sockets
  setActiveParticipant(index) {
    // Change active participant
    game.ConversationHud.activeConversation.activeParticipant = index;

    // Set the image
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
    if (game.user.isGM) {
      const fileInputForm = new FileInputForm(false, (data) => this.#handleAddParticipant(data));
      fileInputForm.render(true);
    }
  }

  // Function that removes a participant from the active conversation
  removeParticipantFromActiveConversation(index) {
    if (game.user.isGM) {
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
    if (game.user.isGM) {
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
    if (game.user.isGM) {
      if (this.activeConversation) {
        // Create a prompt for saving the conversation, asking the users to introduce a name and to specify a folder
        const folders = game.folders.filter((f) => f.type === "JournalEntry" && f.displayed);
        const dialogContent = await renderTemplate("modules/conversation-hud/templates/conversation_save.html", {
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
        },
      ]);
      ui.notifications.info(game.i18n.localize("CHUD.info.saveSuccessful"));
    } else {
      ui.notifications.error(game.i18n.localize("CHUD.errors.saveUnsuccessful"));
    }
  }

  // Function that can be called from a macro in order to trigger a conversation
  startConversationFromData(participants) {
    if (game.user.isGM) {
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
    this.conversationIsVisible = newVisibility;
    game.ConversationHud.conversationIsVisible = newVisibility;

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
    this.conversationIsVisible = !this.conversationIsVisible;
    socket.executeForEveryone("setConversationHudVisibility", this.conversationIsVisible);
  }

  // Function that minimizes or maximizes the active conversation
  async toggleActiveConversationMode() {
    const isMinimized = !this.conversationIsMinimized;
    this.conversationIsMinimized = isMinimized;

    // Update the controls
    const uiInterface = document.getElementById("interface");
    const controls = document.getElementById("ui-conversation-controls");
    if (controls) {
      // Remove the old controls
      uiInterface.removeChild(controls);
    }

    const conversationControls = await renderTemplate("modules/conversation-hud/templates/conversation_controls.html", {
      isGM: game.user.isGM,
      isMinimized: game.ConversationHud.conversationIsMinimized,
    });

    const updatedControls = document.createElement("section");
    updatedControls.id = "ui-conversation-controls";
    updatedControls.innerHTML = conversationControls;

    const uiRight = document.getElementById("ui-right");
    uiRight.before(updatedControls);

    // Update the layout
    const conversationHud = document.getElementById("ui-conversation-hud");
    if (isMinimized) {
      conversationHud.classList.add("minimized");
    } else {
      conversationHud.classList.remove("minimized");
    }

    if (game.ConversationHud.conversationIsVisible) {
      const conversationBackground = document.getElementById("conversation-background");
      if (isMinimized) {
        conversationBackground.classList.remove("visible");
      } else {
        conversationBackground.classList.add("visible");
      }
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
    let parsedData = {};
    parsedData.activeParticipant = -1;
    parsedData.participants = formData.participants;

    socket.executeForEveryone("renderConversation", parsedData, true);

    // Finally, set the button status to active now that a conversation is active
    socket.executeForAllGMs("updateActivateHudButton", true);
  }

  updateActivateHudButton(status) {
    ui.controls.controls.find((controls) => controls.name == "notes").tools.find((tools) => tools.name == "activateHud").active = status;
    ui.controls.render();
  }

  // Function that parses conversation input form data and then updates the conversation hud
  #handleConversationUpdateData(formData) {
    let parsedData = {};
    parsedData.activeParticipant = -1;
    parsedData.participants = formData.participants;

    socket.executeForEveryone("updateActiveConversation", parsedData);
  }
}

async function checkConversationDataAvailability(users) {
  // let userId = users[0].id;
  for (let i = 0; i < users.length; i++) {
    const result = await socket.executeAsUser("getActiveConversation", users[i].id);

    // Check to see if we have a result and it is an active conversation
    if (result) {
      if (result.conversationIsActive) {
        // We found an active conversation
        const userId = users[i].id;
        return { result, userId };
      }
    }
  }
}

let socket;
Hooks.once("socketlib.ready", () => {
  socket = socketlib.registerModule("conversation-hud");
});

Hooks.on("init", () => {
  game.ConversationHud = new ConversationHud();
  game.ConversationHud.init();
});

Hooks.on("ready", async () => {
  if (game.user.isGM) {
    // Get a list of the connected users
    const regularUsers = game.users.filter((item) => item.active && item.id !== game.user.id && !item.isGM);
    const gmUsers = game.users.filter((item) => item.active && item.id !== game.user.id && item.isGM);

    // Prioritize getting data from the GM users before trying to get data from the regular users
    let conversationData;
    if (gmUsers.length > 0) {
      conversationData = await checkConversationDataAvailability(gmUsers);
    }

    // If we found no active conversation in the gm users, check to see if the regular users have one
    if (!conversationData) {
      if (regularUsers.length > 0) {
        conversationData = await checkConversationDataAvailability(regularUsers);
      }
    }

    if (conversationData) {
      const visibility = await socket.executeAsUser("getActiveConversationVisibility", conversationData.userId);
      game.ConversationHud.renderConversation(conversationData.result.activeConversation, visibility);
    }
  } else {
    try {
      // Get conversation data from a GM
      const result = await socket.executeAsGM("getActiveConversation");

      // If there is an active conversation, render it
      if (result.conversationIsActive) {
        const visibility = await socket.executeAsGM("getActiveConversationVisibility");
        game.ConversationHud.renderConversation(result.activeConversation, visibility);
      }
    } catch (error) {
      if (error.name === "SocketlibNoGMConnectedError") {
        // If no GM is connected, try to get the data from another user
        const users = game.users.filter((item) => item.active && item.id !== game.user.id);

        if (users.length > 0) {
          const { result, userId } = await checkConversationDataAvailability(users);

          if (result) {
            const visibility = await socket.executeAsUser("getActiveConversationVisibility", userId);
            game.ConversationHud.renderConversation(result.activeConversation, visibility);
          }
        }
      } else {
        console.error(error);
      }
    }
  }
});
