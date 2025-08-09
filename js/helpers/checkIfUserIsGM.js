/**
 * Function that takes checks to see if the user has GM rights or not
 *
 * @returns {boolean}
 */
export function checkIfUserIsGM() {
  if (game.user.isGM) {
    return true;
  }
  return false;
}
