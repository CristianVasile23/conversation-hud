import { CHUD_SCHEMA_VERSION, MODULE_NAME } from "../constants/index.js";
import { getConversationsToMigrate, getFactionsToMigrate } from "../migration/migration.mjs";
import { MigrationForm } from "../migration/MigrationForm.mjs";
import { ModuleSettings } from "../settings.js";

/**
  [TODO: Add JSDoc]
**/
export const registerHook = () => {
  const getDataToMigrate = () => {
    const conversationsToMigrate = getConversationsToMigrate();
    const factionsToMigrate = getFactionsToMigrate();

    return { conversationsToMigrate, factionsToMigrate };
  };

  Hooks.once("ready", async function () {
    const currentSchemaVersion = game.settings.get(MODULE_NAME, ModuleSettings.schemaVersion);

    if (!currentSchemaVersion || foundry.utils.isNewerVersion(CHUD_SCHEMA_VERSION, currentSchemaVersion)) {
      const dataToMigrate = getDataToMigrate();

      if (!Object.keys(dataToMigrate).length !== 0) {
        new MigrationForm(dataToMigrate).render(true);
      } else {
        await game.settings.set(MODULE_NAME, ModuleSettings.schemaVersion, CHUD_SCHEMA_VERSION);
      }
    }
  });
};
