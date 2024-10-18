// TODO: Import and export all helper functions
import { getDragAndDropIndex, hideDragAndDropIndicator, showDragAndDropIndicator } from "./drag-and-drop/index.js";
import { registerHandlebarsHelpers, preloadHandlebarsTemplates } from "./handlebars-helpers/index.js";
import { checkConversationDataAvailability } from "./checkConversationDataAvailability.js";
import { createPortraitAnchorObject } from "./createPortraitAnchorObject.js";
import { fixRpgUiIncompatibility } from "./fixRpgUiIncompatibility.js";
import { getActorDataFromDragEvent } from "./getActorDataFromDragEvent.js";
import { handleOnClickContentLink } from "./handleOnClickContentLink.js";
import { moveInArray } from "./moveInArray.js";
import { normalizeParticipantDataStructure } from "./normalizeParticipantDataStructure.js";
import { processParticipantData } from "./processParticipantData.js";
import { setDefaultParticipantData } from "./setDefaultParticipantData.js";
import { updateParticipantLinkedFaction } from "./updateParticipantLinkedFaction.js";

export {
  // Drag and drop
  getDragAndDropIndex,
  hideDragAndDropIndicator,
  showDragAndDropIndicator,

  // Handlebars helpers
  registerHandlebarsHelpers,
  preloadHandlebarsTemplates,

  // Rest
  checkConversationDataAvailability,
  createPortraitAnchorObject,
  fixRpgUiIncompatibility,
  getActorDataFromDragEvent,
  handleOnClickContentLink,
  moveInArray,
  normalizeParticipantDataStructure,
  processParticipantData,
  setDefaultParticipantData,
  updateParticipantLinkedFaction,
};
