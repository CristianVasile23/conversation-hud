import { EMPTY_FACTION } from "../constants/index.js";
import { getConfirmationFromUser } from "../helpers/index.js";

const { JournalEntrySheet } = foundry.applications.sheets.journal;
const { HandlebarsApplicationMixin } = foundry.applications.api;

// TODO: Add JSDoc
export class FactionSheet extends HandlebarsApplicationMixin(JournalEntrySheet) {
  #dirty = false;

  /** @type {any | undefined} */
  #faction = { ...EMPTY_FACTION };

  constructor(...args) {
    super(...args);

    // Get document pages
    const page = this.document.pages.find(
      (p) => foundry.utils.getProperty(p, "flags.conversation-hud.type") === "faction-sheet-data"
    );

    if (page) {
      try {
        const data = JSON.parse(page.text.content);
        const faction = data.faction;
        if (faction) {
          this.#faction = faction;
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

  static PARTS = {
    header: {
      template: "modules/conversation-hud/templates/sheets/faction-sheet/header.hbs",
    },
    body: {
      template: "modules/conversation-hud/templates/sheets/faction-sheet/body.hbs",
    },
    footer: {
      template: "modules/conversation-hud/templates/sheets/faction-sheet/footer.hbs",
    },
  };

  static DEFAULT_OPTIONS = {
    classes: ["chud-faction-sheet"],
    tag: "form",
    window: {
      contentClasses: ["chud-faction-sheet-content"],
      // TODO: Change name from conversationFactionEntry to factionEntry or factionSheet
      title: "CHUD.strings.conversationFactionEntry",
      resizable: false,
    },
    position: {
      width: 640,
      height: "auto",
    },
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    return {
      ...context,
      isGM: game.user.isGM,
      dirty: this.#dirty,
      faction: this.#faction,
    };
  }

  _onRender(context, options) {
    super._onRender(context, options);

    const html = this.element;

    // Check to see if the user is a GM, and if not, exit function early so as not to bind the listeners
    if (!game.user.isGM) {
      return;
    }

    html.querySelector("[name=factionName]").addEventListener("change", (event) => this.#onUpdateFactionName(event));

    html.querySelector("[name=factionImg]").addEventListener("change", (event) => this.#onUpdateFactionLogo(event));

    html
      .querySelector("[name=displayFactionBanner]")
      .addEventListener("change", (event) => this.#onToggleFactionBanner(event));

    html.querySelector("[name=factionTint]").addEventListener("change", (event) => this.#onUpdateBannerTint(event));

    // Activate banner shape buttons
    const bannerShapeButtons = html.querySelectorAll(".banner-shape-button");
    for (const button of bannerShapeButtons) {
      const buttonId = button.getAttribute("id");
      button.addEventListener("click", () => this.#onUpdateBannerShape(buttonId));
    }

    html.querySelector("#save-faction").addEventListener("click", () => this.#handleSaveChanges());

    // Workaround for the fact that DocumentSheetV2 does not support heights smaller than 680px
    queueMicrotask(() => {
      html.style.minHeight = "0px";
    });
  }

  #onUpdateFactionName(event) {
    if (!event.target) return;

    this.#faction.factionName = event.target.value;
    this.#dirty = true;
    this.render(false);
  }

  #onToggleFactionBanner(event) {
    if (!event.target) return;

    this.#faction.factionBannerEnabled = event.target.checked;
    this.#dirty = true;
    this.render(false);
  }

  #onUpdateFactionLogo(event) {
    if (!event.target) return;

    this.#faction.factionLogo = event.target.value;
    this.#dirty = true;
    this.render(false);
  }

  async #onUpdateBannerShape(selectedShapeId) {
    this.#faction.factionBannerShape = selectedShapeId;
    this.#dirty = true;
    this.render(false);
  }

  #onUpdateBannerTint(event) {
    if (!event.target) return;

    this.#faction.factionBannerTint = event.target.value;
    this.#dirty = true;
    this.render(false);
  }

  async close(options = {}) {
    if (this.#dirty) {
      const confirmed = await getConfirmationFromUser(
        "CHUD.dialogue.unsavedChanges",
        '<i class="fas fa-save"></i>',
        '<i class="fas fa-trash"></i>'
      );

      if (confirmed === null) {
        return false;
      }

      if (confirmed) {
        await this.#handleSaveChanges();
      } else {
        await this.#handleDiscardChanges();
      }
    }

    return super.close(options);
  }

  async #handleSaveChanges() {
    const page = this.document.pages.find(
      (p) => foundry.utils.getProperty(p, "flags.conversation-hud.type") === "faction-sheet-data"
    );

    const dataToSave = {
      faction: this.#faction,
    };

    if (!page) {
      // Create a document entry page if none are present
      await this.document.createEmbeddedDocuments("JournalEntryPage", [
        {
          text: { content: JSON.stringify(dataToSave) },
          name: "_chud_faction_data",
          flags: {
            "conversation-hud": { type: "faction-sheet-data" },
          },
        },
      ]);
    } else {
      // Otherwise update the page
      await page.update({
        text: { content: JSON.stringify(dataToSave) },
      });
    }

    this.#dirty = false;
    this.render(false);
  }

  async #handleDiscardChanges() {
    const page = this.document.pages.find(
      (p) => foundry.utils.getProperty(p, "flags.conversation-hud.type") === "faction-sheet-data"
    );

    if (!page) {
      this.#faction = undefined;
    } else {
      this.#faction = JSON.parse(page.text.content);
    }

    this.#dirty = false;
  }
}
