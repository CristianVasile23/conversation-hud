/// <reference path="./types/ConversationData.js" />

import { socket } from "./init.js";
import { ConversationCreationForm } from "./forms/index.js";
import { checkIfUserIsGM } from "./helpers/index.js";
import { ConversationFactionSheet } from "./sheets/index.js";
import { MODULE_NAME } from "./constants/index.js";
import { ModuleSettings } from "./settings.js";

export class ConversationHud {
  conversationIsActive = false;
  conversationIsVisible = false;
  conversationIsMinimized = false;
  conversationIsSpeakingAs = false;
  conversationIsBlurred = true;

  /** @type {ConversationData} */
  conversationData = undefined;

  dropzoneVisible = false;
  draggingParticipant = false;

  constructor() {
    // Register socket hooks
    this.registerSocketFunctions();

    // Register conversation sheet
    this.registerConversationSheet();
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

  // TODO: Move this function in the init.js file
  /**
   * Function that register all sheet entities used by the module
   */
  registerConversationSheet() {
    // DocumentSheetConfig.registerSheet(JournalEntry, "conversation-entry-sheet", ConversationEntrySheet, {
    //   types: ["base"],
    //   makeDefault: false,
    //   label: game.i18n.localize("CHUD.sheets.entrySheet"),
    // });

    DocumentSheetConfig.registerSheet(JournalEntry, "conversation-faction-sheet", ConversationFactionSheet, {
      types: ["base"],
      makeDefault: false,
      label: game.i18n.localize("CHUD.sheets.factionSheet"),
    });
  }

  /**
   * Function that renders the conversation hud
   * @param {ConversationData} conversationData TODO
   * @param {boolean} conversationVisible TODO
   */
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

  /**
   * Function that either triggers the conversation creation form, or removes the active conversation
   */
  async onToggleConversation(shouldCreateConversation) {
    if (checkIfUserIsGM()) {
      if (shouldCreateConversation) {
        if (!game.ConversationHud.conversationIsActive) {
          // Set button active status to false until a successful form has been completed
          ui.controls.controls
            .find((controls) => controls.name === "notes")
            .tools.find((tools) => tools.name === "activateHud").active = false;

          // Create form
          // new ConversationInputForm((data) => this.#handleConversationCreationData(data)).render(true);
          new ConversationCreationForm((data) => console.log(data)).render(true);
        } else {
          ui.notifications.error(game.i18n.localize("CHUD.errors.conversationAlreadyActive"));
        }
      } else {
        if (game.ConversationHud.conversationIsActive) {
          //socket.executeForEveryone("removeConversation");
          //socket.executeForAllGMs("updateActivateHudButton", false);
        } else {
          ui.notifications.error(game.i18n.localize("CHUD.errors.noActiveConversation"));
        }
      }
    }
  }
}
