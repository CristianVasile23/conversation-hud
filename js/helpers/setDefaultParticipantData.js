/**
 * [TODO: Complete JSDoc documentation of type]
 *
 * @param {*} participant
 */
export function setDefaultParticipantData(participant) {
  // If
  if (participant.name === "") {
    participant.name = game.i18n.localize("CHUD.strings.anonymous");
  }

  if (participant.img === "") {
    participant.img = "modules/conversation-hud/img/silhouette.jpg";
  }

  if (participant.faction && participant.faction.displayFaction) {
    if (participant.faction.factionName === "") {
      participant.faction.factionName = game.i18n.localize("CHUD.faction.unknownFaction");
    }

    if (participant.faction.factionLogo === "" && !participant.faction.factionBannerEnabled) {
      participant.faction.factionLogo = "icons/svg/combat.svg";
    }
  }
}
