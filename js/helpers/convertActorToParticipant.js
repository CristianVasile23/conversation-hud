/// <reference path="../types/ParticipantData.js" />

import { processParticipantData } from "./processParticipantData.js";

/**
 * Function that converts an Actor entity into a conversation participant
 *
 * @param {Actor} actor The actor entity that will be converted to a conversation participant
 * @returns {ParticipantData}
 */
export function convertActorToParticipant(actor) {
  const participant = {
    name: actor.name,
    img: actor.img,
  };

  processParticipantData(participant);

  return participant;
}
