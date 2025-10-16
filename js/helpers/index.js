// TODO: Import and export all helper functions
import { createConversationBackgroundContainer } from "./conversation/index.js";
import { getDragAndDropIndex, hideDragAndDropIndicator, showDragAndDropIndicator } from "./drag-and-drop/index.js";
import { activateConversationParticipantsListListeners } from "./forms/index.js";
import { registerHandlebarsHelpers, preloadHandlebarsTemplates } from "./handlebars-helpers/index.js";
import { getTokenImage, isWildcardToken } from "./wildcard/index.mjs";
import { checkConversationDataAvailability } from "./checkConversationDataAvailability.js";
import { checkIfCameraDockIsOnBottomOrTop } from "./checkIfCameraDockIsOnBottomOrTop.js";
import { checkIfUserIsGM } from "./checkIfUserIsGM.js";
import { convertActorToParticipant } from "./convertActorToParticipant.js";
import { convertTokenToParticipant } from "./convertTokenToParticipant.mjs";
import { createPortraitAnchorObject } from "./createPortraitAnchorObject.js";
import { getActorDataFromDragEvent } from "./getActorDataFromDragEvent.js";
import { getConfirmationFromUser } from "./getConfirmationFromUser.js";
import { getConversationDataFromJournalId } from "./getConversationDataFromJournalId.js";
import { handleOnClickContentLink } from "./handleOnClickContentLink.js";
import { moveInArray } from "./moveInArray.js";
import { normalizeParticipantDataStructure } from "./normalizeParticipantDataStructure.js";
import { processParticipantData } from "./processParticipantData.js";
import { setDefaultParticipantData } from "./setDefaultParticipantData.js";
import { updateParticipantLinkedFaction } from "./updateParticipantLinkedFaction.js";

export { deserializeActiveParticipantsMap, serializeActiveParticipantsMap } from "./collective-conversation/index.js";

export {
  // Conversation
  createConversationBackgroundContainer,

  // Drag and drop
  getDragAndDropIndex,
  hideDragAndDropIndicator,
  showDragAndDropIndicator,

  // Forms
  activateConversationParticipantsListListeners,

  // Handlebars helpers
  registerHandlebarsHelpers,
  preloadHandlebarsTemplates,

  // Wildcard
  getTokenImage,
  isWildcardToken,

  // Rest
  checkConversationDataAvailability,
  checkIfCameraDockIsOnBottomOrTop,
  checkIfUserIsGM,
  convertActorToParticipant,
  convertTokenToParticipant,
  createPortraitAnchorObject,
  getActorDataFromDragEvent,
  getConfirmationFromUser,
  getConversationDataFromJournalId,
  handleOnClickContentLink,
  moveInArray,
  normalizeParticipantDataStructure,
  processParticipantData,
  setDefaultParticipantData,
  updateParticipantLinkedFaction,
};
