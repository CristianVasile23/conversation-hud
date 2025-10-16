import { MODULE_NAME } from "../constants/index.js";
import { ModuleSettings } from "../settings.js";

/**
  [TODO: Add JSDoc]
**/
export const registerHook = () => {
  // Hook that starts a conversation if there is one associated to the currently active scene
  Hooks.on("updateScene", (scene, data, options, userId) => {
    if (!("active" in data) || data.active !== true) return;

    // Only run this code for the user who triggered the update
    if (game.user.id !== userId) return;

    if (!game.user.isGM) return;

    if (game.settings.get(MODULE_NAME, ModuleSettings.enableSceneConversations)) {
      const journalId = scene["flags"]["conversation-hud"]?.sceneConversation;
      const startWithVisibilityOff = scene["flags"]["conversation-hud"]?.sceneConversationVisibilityOff || false;

      if (journalId) {
        game.ConversationHud.startConversationFromJournalId(journalId, startWithVisibilityOff);
      }
    }
  });
};
