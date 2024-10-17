import { MODULE_NAME } from "../constants/index.js";
import { ModuleSettings } from "../settings.js";

/**
  [TODO: Add JSDoc]
**/
export const registerHook = () => {
  // Hook that injects CHUD fields into the scene configuration sheet
  Hooks.on("renderSceneConfig", async (app, html, data) => {
    if (game.settings.get(MODULE_NAME, ModuleSettings.enableSceneConversations)) {
      const conversations = game.journal.filter(
        (item) => item.flags.core?.sheetClass === "conversation-entry-sheet.ConversationEntrySheet"
      );
      const linkedConversation = data.data["flags"]["conversation-hud"]?.sceneConversation || undefined;
      const sceneConversationVisibilityOff = data.data["flags"]["conversation-hud"]?.sceneConversationVisibilityOff || undefined;

      const renderedHtml = await renderTemplate("modules/conversation-hud/templates/fragments/scene_conversation_selector.hbs", {
        conversations: conversations,
        linkedConversation: linkedConversation,
        sceneConversationVisibilityOff: sceneConversationVisibilityOff,
      });

      const appVersion = game.version.split(".")[0];
      if (appVersion && Number(appVersion) >= 12) {
        html.find('div[data-tab="ambience"] > div[data-tab="basic"] > .form-group').last().after(renderedHtml);
      } else {
        html.find('div[data-tab="ambience"] > .form-group').last().after(renderedHtml);
      }

      app.setPosition({ height: "auto" });
    }
  });
};
