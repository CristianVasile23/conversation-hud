import { registerHook as registerChatMessageHook } from "./chatMessage.js";
import { registerHook as registerRenderSceneConfigHook } from "./renderSceneConfig.js";
import { registerHook as registerRenderSettingsConfigHook } from "./renderSettingsConfig.js";
import { registerHook as registerRenderTokenConfigHook } from "./renderTokenConfig.js";
import { registerHook as registerUpdateSceneHook } from "./updateScene.js";

export const registerHooks = () => {
  registerChatMessageHook();
  registerRenderSceneConfigHook();
  registerRenderSettingsConfigHook();
  registerRenderTokenConfigHook();
  registerUpdateSceneHook();
};
