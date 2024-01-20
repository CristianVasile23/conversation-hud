import { getConfirmationFromUser } from "../helpers.js";

const EMPTY_FACTION = {
  displayFaction: false,
  factionName: "",
  factionLogo: "",
  factionBannerEnabled: false,
  factionBannerShape: "shape-1",
  factionBannerTint: "#000000",
};

export class ConversationFactionSheet extends JournalSheet {
  constructor(data, options) {
    super(data, options);

    this.dirty = false;
    this.faction = { ...EMPTY_FACTION };

    const pages = this.object.getEmbeddedCollection("JournalEntryPage").contents;
    if (pages.length > 0) {
      try {
        const data = JSON.parse(pages[0].text.content);
        const faction = data.faction;
        if (faction) {
          this.faction = faction;
        }
      } catch (error) {
        if (error instanceof SyntaxError) {
          ui.notifications.error(game.i18n.localize("CHUD.errors.failedToParse"));
        } else {
          ui.notifications.error(game.i18n.localize("CHUD.errors.genericSheetError"));
        }
      }
    }
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["sheet", "journal-sheet"],
      title: game.i18n.localize("CHUD.strings.conversationFactionEntry"),
      id: "conversation-entry-sheet",
      template: `modules/conversation-hud/templates/conversation_faction_sheet.hbs`,
      width: 635,
      height: "auto",
      resizable: false,
    });
  }

  activateListeners(html) {
    super.activateListeners(html);

    // Check to see if the user is a GM, and if not, exit function early so as not to bind the listeners
    if (!game.user.isGM) {
      return;
    }

    const factionNameInput = html.find("[name=factionName]")[0];
    factionNameInput.addEventListener("change", (event) => this.onUpdateFactionName(event));

    const factionLogoInput = html.find("[name=factionImg]")[0];
    factionLogoInput.addEventListener("change", (event) => this.onUpdateFactionLogo(event));

    const factionBannerToggle = html.find("[name=displayFactionBanner]")[0];
    factionBannerToggle.addEventListener("change", (event) => this.onToggleFactionBanner(event));

    const factionBannerTintInput = html.find("[name=factionTint]")[0];
    factionBannerTintInput.addEventListener("change", (event) => this.onUpdateBannerTint(event));

    const factionBannerTintPicker = html.find("[name=factionTintPicker]")[0];
    factionBannerTintPicker.addEventListener("change", (event) => this.onUpdateBannerTint(event));

    // Activate banner shape buttons
    const bannerShapeButtons = html.find(".banner-shape-button");
    for (const button of bannerShapeButtons) {
      const buttonId = button.getAttribute("id");
      button.addEventListener("click", () => this.onUpdateBannerShape(buttonId));
    }

    html.find("#save-conversation-faction").click(async (_event) => this.#handleSaveConversation());
  }

  getData(options) {
    const baseData = super.getData(options);

    const data = {
      isGM: game.user.isGM,
      dirty: this.dirty,
      faction: this.faction,
      name: baseData.data.name,
      data: baseData.data,
    };

    return data;
  }

  onToggleFactionDisplay(event) {
    if (!event.target) return;

    this.faction.displayFaction = event.target.checked;
    this.dirty = true;
    this.render(false);
  }

  onUpdateFactionName(event) {
    if (!event.target) return;

    this.faction.factionName = event.target.value;
    this.dirty = true;
    this.render(false);
  }

  onToggleFactionBanner(event) {
    if (!event.target) return;

    this.faction.factionBannerEnabled = event.target.checked;
    this.dirty = true;
    this.render(false);
  }

  onUpdateFactionLogo(event) {
    if (!event.target) return;

    this.faction.factionLogo = event.target.value;
    this.dirty = true;
    this.render(false);
  }

  async onUpdateBannerShape(selectedShapeId) {
    this.faction.factionBannerShape = selectedShapeId;
    this.dirty = true;
    this.render(false);
  }

  onUpdateBannerTint(event) {
    if (!event.target) return;

    this.faction.factionBannerTint = event.target.value;
    this.dirty = true;
    this.render(false);
  }

  async close(options) {
    if (this.dirty) {
      await getConfirmationFromUser(
        "CHUD.dialogue.unsavedChanges",
        this.#handleConfirmationClose.bind(this, true),
        this.#handleConfirmationClose.bind(this, false),
        '<i class="fas fa-save"></i>',
        '<i class="fas fa-trash"></i>'
      );
    } else {
      this.dirty = false;
      Object.values(this.editors).forEach((editor) => {
        if (editor.instance) {
          editor.instance.destroy();
        }
      });
    }

    return super.close({ submit: false });
  }

  async #handleConfirmationClose(save) {
    if (save) {
      await this.#handleSaveConversation();
    } else {
      const pages = this.object.getEmbeddedCollection("JournalEntryPage").contents;

      if (pages.length === 0) {
        this.faction = { ...EMPTY_FACTION };
      } else {
        const data = JSON.parse(pages[0].text.content);
        const faction = data.faction;
        if (faction) {
          this.faction = faction;
        }
      }

      this.dirty = false;
    }
  }

  async #handleSaveConversation() {
    // Get document pages
    const pages = this.object.getEmbeddedCollection("JournalEntryPage").contents;
    const dataToSave = {
      faction: this.faction,
    };

    if (pages.length === 0) {
      // Create a document entry page if none are present
      await this.object.createEmbeddedDocuments("JournalEntryPage", [
        {
          text: { content: JSON.stringify(dataToSave) },
          name: game.i18n.localize("CHUD.strings.factionData"),
        },
      ]);
    } else {
      // Otherwise, update the first (and realistically the only) entry page
      pages[0].text.content = JSON.stringify(dataToSave);
      await this.object.updateEmbeddedDocuments(
        "JournalEntryPage",
        [
          {
            _id: pages[0]._id,
            name: pages[0].name,
            type: pages[0].type,
            text: { content: pages[0].text?.content || "", format: 1, markdown: undefined },
            src: pages[0].src || "",
            image: { caption: pages[0].image?.caption || "" },
            video: pages[0].video,
          },
        ],
        { render: false, renderSheet: false }
      );
    }

    this.dirty = false;
    this.render(false);
  }
}
