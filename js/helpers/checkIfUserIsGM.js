/**
 * Function that takes checks to see if the user has GM rights or not
 *
 * @returns {boolean}
 */
export function checkIfUserIsGM() {
  if (!game.user.isGM) {
    // ui.notifications.error(game.i18n.localize("CHUD.errors.insufficientRights"));
    return false;
  }
  return true;
}
