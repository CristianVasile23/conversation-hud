import { ConversationEvents } from "../constants/events.js";
import { DRAG_AND_DROP_DATA_TYPES, MODULE_NAME } from "../constants/index.js";
import { ModuleSettings } from "../settings.js";
import {
  showDragAndDropIndicator,
  hideDragAndDropIndicator,
  getDragAndDropIndex,
  getActorDataFromDragEvent,
} from "../helpers/index.js";

const { AbstractSidebarTab } = foundry.applications.sidebar;
const { HandlebarsApplicationMixin } = foundry.applications.api;

export class ConversationSidebar extends HandlebarsApplicationMixin(AbstractSidebarTab) {
  constructor(options = {}) {
    super(options);
    this.hud = game.ConversationHud;

    // Drag and drop state
    this.dropzoneVisible = false;
    this.draggingParticipant = false;

    // Bind the update handler once so it can be correctly removed later
    this._boundOnUpdate = this._onConversationUpdate.bind(this);

    // Register hooks
    Hooks.on(ConversationEvents.Updated, this._boundOnUpdate);
    Hooks.on(ConversationEvents.Created, this._boundOnUpdate);
    Hooks.on(ConversationEvents.Removed, this._boundOnUpdate);
  }

  static tabName = "conversation";

  static PARTS = {
    header: {
      template: "modules/conversation-hud/templates/sidebar/header.hbs",
    },
    participants: {
      template: "modules/conversation-hud/templates/sidebar/participants.hbs",
      scrollable: [".conversation-participants"],
    },
    footer: {
      template: "modules/conversation-hud/templates/sidebar/footer.hbs",
    },
  };

  static DEFAULT_OPTIONS = {
    id: "conversation-sidebar",
    classes: ["sidebar-tab", "conversation-sidebar"],
    window: { title: "CHUD.strings.activeConversation" },
    position: {
      height: "auto",
    },
  };

  async _prepareContext(options) {
    const base = await super._prepareContext(options);

    const { conversationData, currentState } = game.ConversationHud.activeConversation?.getConversation() ?? {};

    // TODO: Improve code used to display list, ideally should be a single variable and check for GM and settings should be here, template should only check one variable to determine if list is shown
    const displayParticipantsToPlayers = game.settings.get(MODULE_NAME, ModuleSettings.displayAllParticipantsToPlayers);

    return {
      ...base,
      isActive: game.ConversationHud.conversationIsActive,
      isVisible: game.ConversationHud.conversationIsVisible,
      conversationType: conversationData?.type ?? null,
      participants: conversationData?.conversation.data.participants ?? [],
      activeParticipantIndex: currentState?.currentActiveParticipant ?? -1,
      displayParticipantsToPlayers,
    };
  }

  _onConversationUpdate() {
    if (this.rendered) {
      this.render(false);
    }
  }

  _onRender(context, options) {
    super._onRender?.(context, options);

    // Only add drag and drop for GMs on GM-controlled conversations
    if (!game.user.isGM || !context.isActive || context.conversationType !== "gm-controlled") {
      return;
    }

    this.#addDragAndDropListeners();
    this.#addDropzoneListener();
  }

  #addDragAndDropListeners() {
    const html = this.element;
    const participantsObject = html.querySelector(".gm-controlled-participants-list");

    if (!participantsObject) return;

    // Get participants data from the active conversation
    const { conversationData } = game.ConversationHud.activeConversation?.getConversation() ?? {};
    const participants = conversationData?.conversation.data.participants ?? [];

    const participantContainers = participantsObject.children;

    for (let i = 0; i < participantContainers.length; i++) {
      const dragDropContainer = participantContainers[i];
      const participantElement = dragDropContainer.querySelector(".chud-participant");

      if (!participantElement) continue;

      // Make the participant draggable
      participantElement.draggable = true;

      participantElement.ondragstart = (event) => {
        this.draggingParticipant = true;
        event.dataTransfer.setDragImage(participantElement, 0, 0);

        // Save the index of the dragged participant in the data transfer object
        event.dataTransfer.setData(
          "text/plain",
          JSON.stringify({
            index: i,
            type: DRAG_AND_DROP_DATA_TYPES.ConversationHudParticipant,
            participant: participants[i],
          })
        );
      };

      participantElement.ondragend = () => {
        this.draggingParticipant = false;
      };

      // Attach drag events to the drag-drop-container
      dragDropContainer.ondragover = (event) => {
        event.preventDefault();
        event.stopPropagation();
        showDragAndDropIndicator(dragDropContainer, event);
      };

      dragDropContainer.ondragleave = (event) => {
        // Only hide indicators if we're actually leaving the container
        if (!dragDropContainer.contains(event.relatedTarget)) {
          hideDragAndDropIndicator(dragDropContainer);
        }
      };

      dragDropContainer.ondrop = (event) => {
        event.preventDefault();
        const data = JSON.parse(event.dataTransfer.getData("text/plain"));

        if (data && data.type === DRAG_AND_DROP_DATA_TYPES.ConversationHudParticipant) {
          const oldIndex = data.index;
          const newIndex = getDragAndDropIndex(event, i, oldIndex, dragDropContainer);

          // Don't do anything if dropped on the same spot
          if (oldIndex === newIndex) {
            return;
          }

          // Execute the reorder function
          game.ConversationHud.executeFunction({
            scope: "everyone",
            type: "reorder-participants",
            data: { oldIndex, newIndex },
          });
        }

        hideDragAndDropIndicator(dragDropContainer);
        this.draggingParticipant = false;
      };
    }
  }

  #addDropzoneListener() {
    const html = this.element;
    const dropzoneContainer = html.querySelector(".conversation-participants");

    if (!dropzoneContainer) {
      return;
    }

    dropzoneContainer.ondragenter = (event) => {
      if (!this.draggingParticipant) {
        this.dropzoneVisible = true;
        dropzoneContainer.classList.add("active-dropzone");
      }
    };

    dropzoneContainer.ondragleave = (event) => {
      // Only hide if we're leaving the container entirely
      if (this.dropzoneVisible && !dropzoneContainer.contains(event.relatedTarget)) {
        this.dropzoneVisible = false;
        dropzoneContainer.classList.remove("active-dropzone");
      }
    };

    dropzoneContainer.ondragover = (event) => {
      if (this.dropzoneVisible) {
        event.preventDefault();
      }
    };

    dropzoneContainer.ondrop = async (event) => {
      if (this.dropzoneVisible) {
        event.preventDefault();
        event.stopPropagation();

        const data = await getActorDataFromDragEvent(event);
        if (data && data.length > 0) {
          // Add participants to the active conversation
          game.ConversationHud.executeFunction({
            scope: "everyone",
            type: "add-participants",
            data: data,
          });
        }

        this.dropzoneVisible = false;
        dropzoneContainer.classList.remove("active-dropzone");
      }
    };
  }

  /** @override */
  close(options) {
    // Clean up hook listeners
    Hooks.off(ConversationEvents.Updated, this._boundOnUpdate);
    Hooks.off(ConversationEvents.Created, this._boundOnUpdate);
    Hooks.off(ConversationEvents.Removed, this._boundOnUpdate);
    return super.close(options);
  }

  // Manual scroll layout restoration since FoundryVTT v13 scrollable functionality does not seem to work as expected
  async render(force = false, options = {}) {
    const container = this.element?.querySelector(".conversation-participants");
    const scrollTop = container?.scrollTop ?? 0;

    const result = await super.render(force, options);

    queueMicrotask(() => {
      const participantsList = this.element?.querySelector(".conversation-participants");
      if (participantsList) {
        participantsList.scrollTop = scrollTop;
      }
    });

    return result;
  }
}
