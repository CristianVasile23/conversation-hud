import { registerJsonHelper } from "./registerJsonHelper.js";
import { registerLinkedObjectsHelper } from "./registerLinkedObjectsHelper.js";
import { registerNotEqHelper } from "./registerNotEqHelper.js";
import { registerObjectHelper } from "./registerObjectHelper.js";
import { registerParticipantPortraitHelper } from "./registerParticipantPortraitHelper.js";
import { registerPortraitParamsObjectHelper } from "./registerPortraitParamsObjectHelper.js";
import { registerRenderMinimizeButtonHelper } from "./registerRenderMinimizeButtonHelper.js";
import { registerSwitchHelper } from "./registerSwitchHelper.js";

/**
 * Function that registers all the custom Handlebars helpers which are used inside the templates
 */
export function registerHandlebarsHelpers() {
  registerJsonHelper();
  registerLinkedObjectsHelper();
  registerNotEqHelper();
  registerObjectHelper();
  registerParticipantPortraitHelper();
  registerPortraitParamsObjectHelper();
  registerRenderMinimizeButtonHelper();
  registerSwitchHelper();
}
