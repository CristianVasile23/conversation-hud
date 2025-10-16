import { MODULE_NAME } from "./constants/index.js";
import { ConversationHud } from "./conversation.js";
import {
  registerHandlebarsHelpers,
  preloadHandlebarsTemplates,
  checkConversationDataAvailability,
  handleOnClickContentLink,
} from "./helpers/index.js";
import { registerHooks } from "./hooks/index.js";
import { ModuleSettings, registerSettings } from "./settings.js";
import { registerSheets } from "./sheets/index.js";
import { ConversationSidebar } from "./sidebar/ConversationSidebar.mjs";

// Warning hook in case libWrapper is not installed
Hooks.once("ready", () => {
  if (!game.modules.get("lib-wrapper")?.active && game.user.isGM) {
    ui.notifications.error(game.i18n.localize("CHUD.errors.noLibWrapper"));
  }
});

// Socket initialization
export let socket;
Hooks.once("socketlib.ready", () => {
  socket = socketlib.registerModule("conversation-hud");
});

Hooks.once("uiExtender.init", (uiExtender) => {
  uiExtender.registerDirectory({
    moduleId: MODULE_NAME,
    id: "conversation",
    tooltip: "Conversation",
    icon: "fa-solid fa-masks-theater",
    order: 1,
    applicationClass: ConversationSidebar,
  });
});

Hooks.on("init", async () => {
  // Register libWrapper for content link handling
  if (libWrapper) {
    try {
      libWrapper.register(
        MODULE_NAME,
        `JournalEntry.prototype._onClickDocumentLink`,
        function (wrapped, event) {
          if (!event.ctrlKey) {
            return wrapped(event);
          }

          // Check if document is a conversation
          if (this.flags?.core?.sheetClass === "conversation-sheet.ConversationSheet") {
            return handleOnClickContentLink.call(this, event, wrapped);
          }

          return wrapped(event);
        },
        "MIXED"
      );
    } catch (error) {
      // TODO: Improve error logging
      console.warn(`ConversationHUD | Could not register libWrapper for JournalEntry:`, error);
    }
  }

  // Register all other hooks
  registerHooks();

  // Register settings
  registerSettings();

  // Register the Handlebars helpers
  registerHandlebarsHelpers();

  // Load the Handlebars templates
  preloadHandlebarsTemplates();

  // Register
  registerSheets();

  // Initialize the ConversationHUD object
  game.ConversationHud = new ConversationHud();
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
      game.ConversationHud.createConversation(
        conversationData.result.activeConversation,
        conversationData.result.conversationIsVisible
      );
    }
  } else {
    // TODO: Check to see if this whole else can be removed
    try {
      // Try to get conversation data from a connected GM
      /** @type {{ conversationIsActive: boolean; conversationIsVisible: boolean; activeConversation: { conversationData: GMControlledConversationData; conversationCurrentState: any; } | undefined; }} */
      const result = await socket.executeAsGM("getConversation");

      // If there is an active conversation, render it
      if (result.conversationIsActive) {
        game.ConversationHud.createConversation(result.activeConversation, result.conversationIsVisible);
      }
    } catch (error) {
      if (error.name === "SocketlibNoGMConnectedError") {
        // If no GM is connected, try to get the data from another user
        const users = game.users.filter((item) => item.active && item.id !== game.user.id);

        if (users.length > 0) {
          const { result } = await checkConversationDataAvailability(users);

          if (result) {
            game.ConversationHud.createConversation(result.activeConversation, result.conversationIsVisible);
          }
        }
      } else {
        console.error(error);
      }
    }
  }
});
