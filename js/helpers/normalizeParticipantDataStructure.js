/// <reference path="../types/ParticipantData.js" />

import { EMPTY_FACTION } from "../constants/index.js";

/**
 * Function that takes a participant and normalizes its data structure. This is useful to ensure that no matter how
 * the participant is created, it will always have the same structure.
 *
 * @param {Object} participant The participant to be normalized (Ideally of type ParticipantData)
 * @returns {ParticipantData}
 */
export function normalizeParticipantDataStructure(participant) {
  const normalizedParticipant = {};

  normalizedParticipant.name = participant.name || "";
  normalizedParticipant.displayName = participant.displayName === undefined ? true : participant.displayName;

  normalizedParticipant.img = participant.img || "";
  normalizedParticipant.imgScale = participant.imgScale || 1;

  normalizedParticipant.faction = participant.faction || EMPTY_FACTION;

  normalizedParticipant.linkedJournal = participant.linkedJournal || "";
  normalizedParticipant.linkedActor = participant.linkedActor || "";

  return normalizedParticipant;
}
