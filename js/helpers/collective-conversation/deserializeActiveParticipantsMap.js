/**
 * Function that deserializes an active participants map used in the collective conversation
 *
 * @param {Map<string, number>} serializedActiveParticipantsMap
 * @returns {Map<string, number>}
 */
export function deserializeActiveParticipantsMap(serializedActiveParticipantsMap) {
  return new Map(serializedActiveParticipantsMap);
}
