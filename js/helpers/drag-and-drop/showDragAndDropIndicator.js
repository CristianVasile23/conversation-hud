/**
 * [TODO: Add JSDoc]
 */
export function showDragAndDropIndicator(targetElement, event) {
  let bounding = targetElement.getBoundingClientRect();
  let offset = bounding.y + bounding.height / 2;

  const topIndicator = targetElement.querySelector(".drag-drop-indicator-top");
  const bottomIndicator = targetElement.querySelector(".drag-drop-indicator-bottom");

  if (!topIndicator || !bottomIndicator) return;

  if (event.clientY - offset > 0) {
    topIndicator.style.display = "none";
    bottomIndicator.style.display = "block";
  } else {
    topIndicator.style.display = "block";
    bottomIndicator.style.display = "none";
  }
}
