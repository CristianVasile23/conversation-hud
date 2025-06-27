import { MODULE_NAME } from "../../constants/index.js";
import { ModuleSettings } from "../../settings.js";
import { EmbeddedComponent } from "../../utils/index.js";

export class GmControlledConversationControls extends EmbeddedComponent {
  constructor() {
    super({
      id: "ui-conversation-controls",
      template: "modules/conversation-hud/templates/conversations/gm-controlled/controls.hbs",
      target: "#ui-conversation-controls",
    });
  }

  async prepareAndRender() {
    const { conversationData } = game.ConversationHud.activeConversation.getConversation({
      respectMinimizationLock: false,
    });

    await this.update({
      isGM: game.user.isGM,
      isVisible: game.ConversationHud.conversationIsVisible,
      isMinimized: conversationData.conversation.features.isMinimized,
      isMinimizationLocked: conversationData.conversation.features.isMinimizationLocked,
      isSpeakingAs: conversationData.conversation.features.isSpeakingAs,
      isBackgroundVisible: conversationData.conversation.features.isBackgroundVisible,
      features: {
        minimizeEnabled: game.settings.get(MODULE_NAME, ModuleSettings.enableMinimize),
        speakAsEnabled: game.settings.get(MODULE_NAME, ModuleSettings.enableSpeakAs),
      },
    });
  }
}
