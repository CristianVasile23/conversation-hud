/**
 * [TODO: Complete JSDoc documentation]
 *
 * @param {ParticipantData} participant
 */
export function updateParticipantLinkedFaction(participant) {
  if (participant.faction?.selectedFaction) {
    const factionData = getConversationDataFromJournalId(participant.faction.selectedFaction);
    const selectedFactionData = factionData.faction;
    participant.faction = {
      ...selectedFactionData,
      displayFaction: participant.faction.displayFaction,
      selectedFaction: participant.faction.selectedFaction,
    };
  }
}
