/// <reference path="../types/MigrationData.js" />

import { CHUD_SCHEMA_VERSION, MODULE_NAME } from "../constants/index.js";
import { getConversationsToMigrate, getFactionsToMigrate } from "../migration/migration.mjs";
import { MigrationForm } from "../migration/MigrationForm.mjs";
import { ModuleSettings } from "../settings.js";
import { checkIfUserIsGM } from "../helpers/checkIfUserIsGM.js";

/**
 * Registers the data migration hook that checks for outdated schema versions and triggers migration when needed.
 * This hook runs once when the game is ready and compares the current schema version with the latest version.
 * If migration is needed, it opens the MigrationForm with the data to migrate.
 *
 * @returns {void}
 */
export const registerHook = () => {
  /**
   * Retrieves all conversations and factions that need to be migrated to the current schema version.
   *
   * @returns {{conversationsToMigrate: Record<string, MigrationData>, factionsToMigrate: Record<string, MigrationData>}} An object containing records of conversations and factions that require migration, keyed by journal ID
   */
  const getDataToMigrate = () => {
    const conversationsToMigrate = getConversationsToMigrate();
    const factionsToMigrate = getFactionsToMigrate();

    return { conversationsToMigrate, factionsToMigrate };
  };

  Hooks.once("ready", async function () {
    // Only GMs should handle data migration
    if (!checkIfUserIsGM()) {
      return;
    }

    const currentSchemaVersion = game.settings.get(MODULE_NAME, ModuleSettings.schemaVersion);

    if (!currentSchemaVersion || foundry.utils.isNewerVersion(CHUD_SCHEMA_VERSION, currentSchemaVersion)) {
      const dataToMigrate = getDataToMigrate();
      const hasDataToMigrate =
        Object.keys(dataToMigrate.conversationsToMigrate).length > 0 ||
        Object.keys(dataToMigrate.factionsToMigrate).length > 0;

      if (hasDataToMigrate) {
        new MigrationForm(dataToMigrate).render(true);
      } else {
        await game.settings.set(MODULE_NAME, ModuleSettings.schemaVersion, CHUD_SCHEMA_VERSION);
      }
    }
  });
};
