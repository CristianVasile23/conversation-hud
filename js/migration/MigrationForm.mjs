import { MODULE_NAME } from "../constants/generic.js";
import { CHUD_SCHEMA_VERSION } from "../constants/versions.mjs";
import { getConfirmationFromUser } from "../helpers/index.js";
import { ModuleSettings } from "../settings.js";
import { migrateConversations, migrateFactions } from "./migration.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class MigrationForm extends HandlebarsApplicationMixin(ApplicationV2) {
  /* -------------------------------------------- */
  /*  State                                       */
  /* -------------------------------------------- */

  #dataToMigrate = {};

  constructor(dataToMigrate) {
    super();

    this.#dataToMigrate = dataToMigrate;
  }

  /* -------------------------------------------- */
  /*  Rendering                                   */
  /* -------------------------------------------- */

  static DEFAULT_OPTIONS = {
    id: "conversation-migration-form",
    classes: ["form"],
    tag: "form",
    window: {
      contentClasses: ["standard-form"],
      title: "CHUD.strings.migration.migrationWizard",
    },
    form: {
      closeOnSubmit: false,
    },
    position: {
      width: 650,
      height: 800,
    },
  };

  static PARTS = {
    body: {
      template: "modules/conversation-hud/templates/forms/migration-form.hbs",
      scrollable: [".scrollable"],
    },
    footer: {
      template: "templates/generic/form-footer.hbs",
    },
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    const factions = Object.values(this.#dataToMigrate?.factionsToMigrate || {});
    const conversations = Object.values(this.#dataToMigrate?.conversationsToMigrate || {});

    const factionList = factions.map((f) => ({
      name: f.journalName,
      type: "Faction",
    }));

    const conversationList = conversations.map((c) => ({
      name: c.journalName,
      type: "Conversation",
    }));

    const itemsToMigrate = [...factionList, ...conversationList];

    return {
      ...context,
      buttons: [
        {
          type: "submit",
          icon: "fa-solid fa-screwdriver-wrench",
          label: "CHUD.actions.startMigration",
          disabled: itemsToMigrate.length === 0,
        },
      ],
      itemsToMigrate,
    };
  }

  _onRender(context, options) {
    super._onRender(context, options);

    const html = this.element;

    html.querySelector("button[type='submit']").addEventListener("click", () => this.#handleMigration());
  }

  /* -------------------------------------------- */
  /*  Handlers                                    */
  /* -------------------------------------------- */

  async #handleMigration() {
    const confirmed = await getConfirmationFromUser(
      "CHUD.dialogue.onMigrateData",
      "fa-solid fa-screwdriver-wrench",
      "fa-solid fa-xmark"
    );

    if (!confirmed) return;

    const failedFactionMigrations = await migrateFactions();
    const failedConversationMigrations = await migrateConversations();

    const hasFailures = failedFactionMigrations.length || failedConversationMigrations.length;

    if (hasFailures) {
      ui.notifications.info(game.i18n.localize("CHUD.warnings.migrationNotComplete"));
      console.warn(`${MODULE_NAME} | Some migrations failed:`, {
        factions: failedFactionMigrations,
        conversations: failedConversationMigrations,
      });
    } else {
      await game.settings.set(MODULE_NAME, ModuleSettings.schemaVersion, CHUD_SCHEMA_VERSION);
      ui.notifications.info(game.i18n.localize("CHUD.info.migrationComplete"));
    }

    this.close();
  }
}
