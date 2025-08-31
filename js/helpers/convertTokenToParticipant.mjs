/// <reference path="../types/ParticipantData.js" />

import { processParticipantData } from "./processParticipantData.js";
import { getTokenImage } from "./wildcard/index.mjs";

/**
 * Function that converts a Token entity into a conversation participant
 * This preserves the token's actual image (including wildcard images)
 *
 * @param {Token} token The token entity that will be converted to a conversation participant
 * @returns {ParticipantData}
 */
export function convertTokenToParticipant(token) {
  if (!token) {
    // TODO: Improve logging
    throw new Error("ConversationHUD | Cannot convert null token to participant");
  }

  const participant = {
    name: token.name || "Unknown Token",
    img: getTokenImage(token),
  };

  processParticipantData(participant);

  return participant;
}
