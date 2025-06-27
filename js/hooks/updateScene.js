import { MODULE_NAME } from "../constants/index.js";
import { ModuleSettings } from "../settings.js";

/**
  [TODO: Add JSDoc]
**/
export const registerHook = () => {
  // Hook that starts a conversation if there is one associated to the currently active scene
  Hooks.on("updateScene", (scene, data, options) => {
    if (game.settings.get(MODULE_NAME, ModuleSettings.enableSceneConversations)) {
      if (scene.active) {
        const journalId = scene["flags"]["conversation-hud"]?.sceneConversation;
        const startWithVisibilityOff = scene["flags"]["conversation-hud"]?.sceneConversationVisibilityOff || false;

        if (journalId) {
          game.ConversationHud.startConversationFromJournalId(journalId, startWithVisibilityOff);
        }
      }
    }
  });
};
