/**
 * Utility functions for handling wildcard tokens
 */

/**
 * Check if a token uses wildcard images
 * @param {Token} token - The token to check
 * @returns {boolean} True if the token uses wildcard images
 */
export function isWildcardToken(token) {
  const actor = token.actor;
  if (!actor) {
    return false;
  }

  // Check the actor's prototype token for wildcard indicator
  const prototypeImg = actor.prototypeToken?.texture?.src || actor.img;
  return prototypeImg && prototypeImg.includes("*");
}

/**
 * Get the appropriate image for a token (wildcard-aware)
 * @param {Token} token - The token to get image for
 * @returns {string} The appropriate image path
 */
export function getTokenImage(token) {
  if (!token) {
    return null;
  }

  if (isWildcardToken(token)) {
    // For wildcard tokens, use the actual token's current image
    return token.texture?.src || token.img;
  }

  // For non-wildcard tokens, use the actor's image
  return token.actor?.img || token.img;
}
