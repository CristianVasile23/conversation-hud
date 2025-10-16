/**
 * Function that serializes the active participants map used by the collective conversation so that it can be safely transferred via socketlib
 *
 * @param {Map<string, number>} activeParticipantsMap
 * @returns {Array<[string, number]>}
 */
export function serializeActiveParticipantsMap(activeParticipantsMap) {
  return Array.from(activeParticipantsMap.entries());
}
