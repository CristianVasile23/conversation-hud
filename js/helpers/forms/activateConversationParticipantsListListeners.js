import { DRAG_AND_DROP_DATA_TYPES } from "../../constants/drag-and-drop.js";
import { getDragAndDropIndex, hideDragAndDropIndicator, showDragAndDropIndicator } from "../index.js";

/**
 * [TODO: Complete JSDoc documentation of type]
 *
 * @typedef {Object} ActivateConversationParticipantsListListenersProps
 * @property {HTMLElement} conversationParticipantsListHTML - [TODO]
 * @property {(oldIndex: number, newIndex: number) => void} handleDrop - [TODO]
 * @property {(value: boolean) => void} setIsDraggingAParticipant - [TODO]
 * @property {(index: number) => any} getParticipantData - [TODO]
 * @property {(index: number, event: any) => void} handleSetDefaultActiveParticipant - [TODO]
 * @property {(index: number) => void} handleCloneParticipant - [TODO]
 * @property {(index: number) => void} handleEditParticipant - [TODO]
 * @property {(index: number) => void} handleRemoveParticipant - [TODO]
 */

/**
 * TODO - Finish JSDoc
 *
 * @param {ActivateConversationParticipantsListListenersProps} props
 */
export function activateConversationParticipantsListListeners(props) {
  const {
    conversationParticipantsListHTML,
    handleDrop,
    setIsDraggingAParticipant,
    getParticipantData,
    handleSetDefaultActiveParticipant,
    handleCloneParticipant,
    handleEditParticipant,
    handleRemoveParticipant,
  } = props;

  const conversationParticipants = conversationParticipantsListHTML.children;

  for (let index = 0; index < conversationParticipants.length; index++) {
    const participant = conversationParticipants[index];
    const dragDropHandler = participant.querySelector(".chud-drag-drop-handler");

    dragDropHandler.ondragstart = (event) => {
      setIsDraggingAParticipant(true);

      event.dataTransfer.setDragImage(participant, 0, 0);

      // Save the index of the dragged participant in the data transfer object
      event.dataTransfer.setData(
        "text/plain",
        JSON.stringify({
          index,
          type: DRAG_AND_DROP_DATA_TYPES.ConversationHudParticipant,
          participant: getParticipantData(index),
        })
      );
    };

    dragDropHandler.ondragend = () => {
      setIsDraggingAParticipant(false);
    };

    participant.ondragover = (event) => {
      event.preventDefault();
      event.stopPropagation();
      showDragAndDropIndicator(participant, event);
    };

    participant.ondragleave = (event) => {
      // Only hide indicators if we're actually leaving the participant container
      if (!participant.contains(event.relatedTarget)) {
        hideDragAndDropIndicator(participant);
      }
    };

    participant.ondrop = (event) => {
      const data = JSON.parse(event.dataTransfer.getData("text/plain"));

      if (data) {
        hideDragAndDropIndicator(participant);

        const oldIndex = data.index;

        // If we drag and drop a participant on the same spot, exit the function early as it makes no sense to reorder the array
        if (oldIndex === index) {
          return;
        }

        // Get the new index of the dropped element
        let newIndex = getDragAndDropIndex(event, index, oldIndex, participant);

        handleDrop(oldIndex, newIndex);
      } else {
        console.error("ConversationHUD | Data object was empty inside conversation participant ondrop function");
      }

      setIsDraggingAParticipant(false);
    };

    // Bind function to the set active by default checkbox
    participant.querySelector("#participant-active-by-default-checkbox").onchange = (event) =>
      handleSetDefaultActiveParticipant(index, event);

    // Bind functions to the edit and remove buttons
    const controls = participant.querySelector(".chud-participant-action-buttons");
    controls.querySelector("#participant-clone-button").onclick = () => handleCloneParticipant(index);
    controls.querySelector("#participant-edit-button").onclick = () => handleEditParticipant(index);
    controls.querySelector("#participant-delete-button").onclick = () => handleRemoveParticipant(index);
  }
}
