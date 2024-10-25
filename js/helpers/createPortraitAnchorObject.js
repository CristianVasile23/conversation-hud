/// <reference path="../types/PortraitAnchor.js" />

import { MODULE_NAME } from "../constants/index.js";
import { ModuleSettings } from "../settings.js";

/**
 * Function that creates an PortraitAnchor object based on the default options defined in the module settings
 *
 * @returns {PortraitAnchor} The PortraitAnchor object
 */
export function createPortraitAnchorObject() {
  return {
    vertical: game.settings.get(MODULE_NAME, ModuleSettings.portraitAnchorVertical),
    horizontal: game.settings.get(MODULE_NAME, ModuleSettings.portraitAnchorHorizontal),
  };
}
