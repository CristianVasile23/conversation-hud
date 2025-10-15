import { ConversationEvents } from "../constants/events.js";
import { MODULE_NAME } from "../constants/index.js";
import { ModuleSettings } from "../settings.js";
import { showDragAndDropIndicator, hideDragAndDropIndicator, getDragAndDropIndex } from "../helpers/index.js";

const { AbstractSidebarTab } = foundry.applications.sidebar;
const { HandlebarsApplicationMixin } = foundry.applications.api;

export class ConversationSidebar extends HandlebarsApplicationMixin(AbstractSidebarTab) {
  constructor(options = {}) {
    super(options);
    this.hud = game.ConversationHud;

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
  }

  #addDragAndDropListeners() {
    const html = this.element;
    const participantsObject = html.querySelector(".gm-controlled-participants-list");

    if (!participantsObject) return;

    const participantContainers = participantsObject.children; // These are the participant-drag-drop-container elements

    for (let i = 0; i < participantContainers.length; i++) {
      const dragDropContainer = participantContainers[i];
      const participantElement = dragDropContainer.querySelector(".chud-participant");

      if (!participantElement) continue;

      // Make the participant draggable
      participantElement.draggable = true;

      participantElement.ondragstart = (event) => {
        event.dataTransfer.setDragImage(participantElement, 0, 0);
        event.dataTransfer.setData(
          "text/plain",
          JSON.stringify({
            index: i,
            type: "ConversationParticipant",
          })
        );
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

        if (data && data.type === "ConversationParticipant") {
          hideDragAndDropIndicator(dragDropContainer);

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
      };
    }
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
