export function hideDragAndDropIndicator(targetElement) {
  const topIndicator = targetElement.querySelector("#drag-drop-indicator-top");
  const bottomIndicator = targetElement.querySelector("#drag-drop-indicator-bottom");
  topIndicator.style["display"] = "none";
  bottomIndicator.style["display"] = "none";
}
