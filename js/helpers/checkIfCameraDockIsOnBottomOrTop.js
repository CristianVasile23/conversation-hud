/**
 *  TODO: Add JSDoc
 *
 * @returns {boolean}
 */
export function checkIfCameraDockIsOnBottomOrTop() {
  const cameraViews = document.getElementById("camera-views");

  if (cameraViews) {
    if (cameraViews.classList.contains("camera-position-bottom") || cameraViews.classList.contains("camera-position-top")) {
      return true;
    }
  }

  return false;
}
