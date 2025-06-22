import { ConversationEvents } from "../constants/events.js";

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
    // TODO: Localize
    title: "Conversation",
    id: "conversation-sidebar",
    classes: ["sidebar-tab", "conversation-sidebar"],
    popOut: true,
    width: 350,
    height: "auto",
  };

  async _prepareContext(options) {
    const base = await super._prepareContext(options);
    const hud = game.ConversationHud;
    const conversationData = hud.activeConversation?.getConversation();

    return {
      ...base,
      isActive: hud.conversationIsActive,
      isVisible: hud.conversationIsVisible,
      conversationType: conversationData?.type ?? null,
      activeParticipantIndex: conversationData?.currentState?.currentActiveParticipant ?? -1,
      participants: conversationData?.conversation?.data?.participants ?? [],
    };
  }

  _onConversationUpdate() {
    if (this.rendered) {
      this.render(false);
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
      const newContainer = this.element?.querySelector(".conversation-participants");
      if (newContainer) newContainer.scrollTop = scrollTop;
    });

    return result;
  }
}
