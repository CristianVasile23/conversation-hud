/**
 * [TODO: Add JSDoc]
 */
export function getDragAndDropIndex(event, targetIndex, oldIndex) {
  let bounding = event.target.getBoundingClientRect();
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
