/// <reference path="../../types/ConversationData.js" />

import { MODULE_NAME } from "../../constants/index.js";
import { ModuleSettings } from "../../settings.js";

/**
 * TODO: Finish JSDoc
 *
 * @param {boolean} conversationVisible
 * @param {ConversationData} conversationData
 * @returns {HTMLDivElement}
 */
export function createConversationBackgroundContainer(conversationData, conversationVisible) {
  const conversationBackground = document.createElement("div");
  conversationBackground.id = "conversation-hud-background";
  conversationBackground.className = "conversation-hud-background";

  const blurAmount = game.settings.get(MODULE_NAME, ModuleSettings.blurAmount);
  conversationBackground.style.backdropFilter = `blur(${blurAmount}px)`;

  if (conversationData.background) {
    conversationBackground.classList.add("conversation-hud-background-image");
    conversationBackground.style.backgroundImage = `url(${conversationData.background})`;
  }

  if (conversationVisible && !game.ConversationHud.conversationIsMinimized) {
    conversationBackground.classList.add("visible");
  }

  return conversationBackground;
}