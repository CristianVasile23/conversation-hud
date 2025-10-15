/// <reference path="../types/ParticipantData.js" />

import { getConversationDataFromJournalId } from "./getConversationDataFromJournalId.js";

/**
 * Updates a participant's faction data by fetching it from a linked faction journal.
 * Preserves the displayFaction and selectedFaction values while updating other faction properties.
 *
 * @param {ParticipantData} participant - The participant whose faction data should be updated
 * @returns {void}
 */
export function updateParticipantLinkedFaction(participant) {
  if (participant.faction?.selectedFaction) {
    const factionData = getConversationDataFromJournalId(participant.faction.selectedFaction);

    if (factionData?.faction) {
      participant.faction = {
        ...factionData.faction,
        displayFaction: participant.faction.displayFaction,
        selectedFaction: participant.faction.selectedFaction,
      };
    }
  }
}
