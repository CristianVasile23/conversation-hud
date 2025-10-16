import { createPortraitAnchorObject } from "./createPortraitAnchorObject.js";
import { normalizeParticipantDataStructure } from "./normalizeParticipantDataStructure.js";
import { setDefaultParticipantData } from "./setDefaultParticipantData.js";
import { updateParticipantLinkedFaction } from "./updateParticipantLinkedFaction.js";

/**
 * [TODO: Complete JSDoc documentation]
 *
 * @param {Object} data
 */
export function processParticipantData(data) {
  normalizeParticipantDataStructure(data);

  // Set default participant data (such as default image or participant name)
  setDefaultParticipantData(data);

  // In case the participant has a linked faction, update its values
  // This is needed because the linked faction might have been updated, therefore the new data must
  // be obtained
  updateParticipantLinkedFaction(data);

  // Add anchor object if it's missing from the participant data
  if (!data.portraitAnchor) {
    data.portraitAnchor = createPortraitAnchorObject(data);
  }
}
