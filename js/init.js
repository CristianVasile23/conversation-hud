import { MODULE_NAME } from "./constants/index.js";
import { ConversationHud } from "./conversation.js";
import {
  registerHandlebarsHelpers,
  preloadHandlebarsTemplates,
  checkConversationDataAvailability,
  fixRpgUiIncompatibility,
  handleOnClickContentLink,
} from "./helpers/index.js";
import { registerHooks } from "./hooks/index.js";
// import { preloadTemplates } from "./preloadTemplates.js";
import { ModuleSettings, registerSettings } from "./settings.js";

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

Hooks.on("init", async () => {
  // Register the module within libWrapper
  // This will enable users to CTRL + Click conversation links within journals to activate the conversation
  // instead of just rendering the conversation sheet
  if (libWrapper) {
    libWrapper.register(
      MODULE_NAME,
      "TextEditor._onClickContentLink",
      function (wrapped, event) {
        return handleOnClickContentLink.bind(this)(event, wrapped);
      },
      "MIXED"
    );
  }

  // Register all other hooks
  registerHooks();

  // Register settings
  registerSettings();

  // Register the Handlebars helpers
  registerHandlebarsHelpers();

  // Load the Handlebars templates
  preloadHandlebarsTemplates();

  // Initialize the ConversationHUD object
  game.ConversationHud = new ConversationHud();
  game.ConversationHud.init();

  // If RPG UI fix setting is enabled, add the fixed CSS class to the sidebar
  if (game.settings.get(MODULE_NAME, ModuleSettings.rpgUiFix)) {
    fixRpgUiIncompatibility();
  }
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
      // Try to get conversation data from a connected GM
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
