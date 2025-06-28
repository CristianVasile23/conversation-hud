import { registerHook as registerChatMessageHook } from "./chatMessage.mjs";
import { registerHook as registerRenderChatMessageHook } from "./renderChatMessage.mjs";
import { registerHook as registerRenderLayoutHook } from "./renderLayout.mjs";
import { registerHook as registerRenderSceneConfigHook } from "./renderSceneConfig.mjs";
import { registerHook as registerRenderSettingsConfigHook } from "./renderSettingsConfig.js";
import { registerHook as registerRenderTokenConfigHook } from "./renderTokenConfig.js";
import { registerHook as registerUpdateSceneHook } from "./updateScene.mjs";

export const registerHooks = () => {
  registerChatMessageHook();
  registerRenderChatMessageHook();
  registerRenderLayoutHook();
  registerRenderSceneConfigHook();
  registerRenderSettingsConfigHook();
  registerRenderTokenConfigHook();
  registerUpdateSceneHook();
};
