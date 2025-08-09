/**
 * [TODO: Add JSDoc]
 */
export function getDragAndDropIndex(event, targetIndex, oldIndex, targetElement = null) {
  // Use the provided targetElement, or find it by traversing up from event.target
  if (!targetElement) {
    targetElement = event.target;
    while (targetElement && !targetElement.classList.contains('participant-drag-drop-container')) {
      targetElement = targetElement.parentElement;
    }
    
    if (!targetElement) {
      // Fallback to the original behavior if we can't find the container
      targetElement = event.target;
    }
  }
  
  let bounding = targetElement.getBoundingClientRect();
  let offset = bounding.y + bounding.height / 2;

  // Get the new index of the dropped element
  let newIndex;
  if (event.clientY - offset > 0) {
    // Element is dropped at the bottom
    if (oldIndex > targetIndex) {
      newIndex = targetIndex + 1;
    } else {
      newIndex = targetIndex;
    }
  } else {
    // Element is dropped at the top
    if (oldIndex > targetIndex) {
      newIndex = targetIndex;
    } else {
      newIndex = targetIndex - 1;
    }
  }

  return newIndex;
}
