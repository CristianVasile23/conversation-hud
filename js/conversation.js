export class ConversationHud {
  // Function that initializes the class data
  init() {
    // Initialize variables
    this.conversationIsActive = false;
    this.conversationIsVisible = false;
    this.conversationIsMinimized = false;
    this.conversationIsSpeakingAs = false;
    this.conversationIsBlurred = true;

    /** @type {ConversationData} */
    this.conversationData = undefined;

    this.dropzoneVisible = false;
    this.draggingParticipant = false;

    // Register socket hooks
    this.registerSocketFunctions();

    // Register conversation sheet
    //this.registerConversationSheet();
  }

  /**
   * Function that registers all socket functions that are used by CHUD.
   */
  registerSocketFunctions() {
    // Wait for the socket to be initialized (if it hasn't been already)
    if (socket) {
      socket.register("renderConversation", this.renderConversation);
      // socket.register("removeConversation", this.removeConversation);

      // socket.register("getActiveConversation", this.getActiveConversation);
      // socket.register("updateActiveConversation", this.updateActiveConversation);

      // socket.register("setActiveParticipant", this.setActiveParticipant);

      // socket.register("toggleConversationBackground", this.toggleConversationBackground);

      // socket.register("setConversationHudVisibility", this.setConversationHudVisibility);

      // socket.register("getActiveConversationVisibility", this.getActiveConversationVisibility);

      // socket.register("updateActivateHudButton", this.updateActivateHudButton);
    } else {
      setTimeout(this.registerSocketFunctions, 250);
    }
  }

  /**
   * Function that renders the conversation hud
   * @param {ConversationData} conversationData TODO
   * @param {boolean} conversationVisible TODO
   **/
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
}
