import { MODULE_NAME } from "../constants/index.js";
import { ModuleSettings } from "../settings.js";
import { EmbeddedComponent } from "../utils/index.js";

export class GmControlledConversationControls extends EmbeddedComponent {
  static id = "ui-conversation-controls";
  static template = "modules/conversation-hud/templates/conversations/gm-controlled/controls.hbs";
  static target = "#ui-conversation-controls";

  constructor() {
    super({
      id: "ui-conversation-controls",
      template: "modules/conversation-hud/templates/conversations/gm-controlled/controls.hbs",
      target: "#ui-conversation-controls",
    });
  }

  async prepareAndRender() {
    const { conversation } = game.ConversationHud.activeConversation.getConversation();

    await this.update({
      isGM: game.user.isGM,
      isVisible: game.ConversationHud.conversationIsVisible,
      isMinimized: conversation.features.isMinimized,
      isMinimizationLocked: conversation.features.isMinimizationLocked,
      isSpeakingAs: conversation.features.isSpeakingAs,
      isBackgroundVisible: conversation.features.isBackgroundVisible,
      features: {
        minimizeEnabled: game.settings.get(MODULE_NAME, ModuleSettings.enableMinimize),
        speakAsEnabled: game.settings.get(MODULE_NAME, ModuleSettings.enableSpeakAs),
      },
    });
  }
}
