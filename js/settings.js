import { MODULE_NAME } from "./constants/index.js";
import { MigrationForm, getConversationsToMigrate, getFactionsToMigrate } from "./migration/index.mjs";

export const ModuleSettings = {
  portraitStyle: "portraitStyle",
  portraitAnchorVertical: "portraitAnchorVertical",
  portraitAnchorHorizontal: "portraitAnchorHorizontal",
  displayAllParticipantsToPlayers: "displayAllParticipantsToPlayers",
  displayNoParticipantBox: "displayNoParticipantBox",
  enableMinimize: "enableMinimize",
  keepMinimize: "keepMinimize",
  enableSpeakAs: "enableSpeakAs",
  clearActiveParticipantOnVisibilityChange: "clearActiveParticipantOnVisibilityChange",
  enableSceneConversations: "enableSceneConversations",
  blurAmount: "blurAmount",
  activeParticipantFontSize: "activeParticipantFontSize",
  activeParticipantFactionFontSize: "activeParticipantFactionFontSize",
  scehmaVersion: "schemaVersion",
};

export function registerSettings() {
  game.settings.register(MODULE_NAME, ModuleSettings.portraitStyle, {
    name: game.i18n.localize(`CHUD.settings.portraitStyle.name`),
    hint: game.i18n.localize(`CHUD.settings.portraitStyle.hint`),
    scope: "world",
    config: true,
    requiresReload: true,
    type: String,
    default: "vertical",
    choices: {
      vertical: game.i18n.localize(`CHUD.settings.portraitStyle.choices.vertical`),
      horizontal: game.i18n.localize(`CHUD.settings.portraitStyle.choices.horizontal`),
      square: game.i18n.localize(`CHUD.settings.portraitStyle.choices.square`),
      auto: game.i18n.localize(`CHUD.settings.portraitStyle.choices.auto`),
    },
  });

  game.settings.register(MODULE_NAME, ModuleSettings.portraitAnchorVertical, {
    name: game.i18n.localize(`CHUD.settings.portraitAnchorVertical.name`),
    hint: game.i18n.localize(`CHUD.settings.portraitAnchorVertical.hint`),
    scope: "world",
    config: true,
    requiresReload: true,
    type: String,
    default: "centerVertical",
    choices: {
      top: game.i18n.localize(`CHUD.settings.portraitAnchorVertical.choices.top`),
      centerVertical: game.i18n.localize(`CHUD.settings.portraitAnchorVertical.choices.center`),
      bottom: game.i18n.localize(`CHUD.settings.portraitAnchorVertical.choices.bottom`),
    },
  });

  game.settings.register(MODULE_NAME, ModuleSettings.portraitAnchorHorizontal, {
    name: game.i18n.localize(`CHUD.settings.portraitAnchorHorizontal.name`),
    hint: game.i18n.localize(`CHUD.settings.portraitAnchorHorizontal.hint`),
    scope: "world",
    config: true,
    requiresReload: true,
    type: String,
    default: "centerHorizontal",
    choices: {
      left: game.i18n.localize(`CHUD.settings.portraitAnchorHorizontal.choices.left`),
      centerHorizontal: game.i18n.localize(`CHUD.settings.portraitAnchorHorizontal.choices.center`),
      right: game.i18n.localize(`CHUD.settings.portraitAnchorHorizontal.choices.right`),
    },
  });

  game.settings.register(MODULE_NAME, ModuleSettings.displayAllParticipantsToPlayers, {
    name: game.i18n.localize(`CHUD.settings.displayAllParticipantsToPlayers.name`),
    hint: game.i18n.localize(`CHUD.settings.displayAllParticipantsToPlayers.hint`),
    scope: "world",
    config: true,
    requiresReload: true,
    type: Boolean,
    default: true,
  });

  game.settings.register(MODULE_NAME, ModuleSettings.displayNoParticipantBox, {
    name: game.i18n.localize(`CHUD.settings.displayNoParticipantBox.name`),
    hint: game.i18n.localize(`CHUD.settings.displayNoParticipantBox.hint`),
    scope: "world",
    config: true,
    requiresReload: true,
    type: Boolean,
    default: true,
  });

  game.settings.register(MODULE_NAME, ModuleSettings.enableSpeakAs, {
    name: game.i18n.localize(`CHUD.settings.enableSpeakAs.name`),
    hint: game.i18n.localize(`CHUD.settings.enableSpeakAs.hint`),
    scope: "world",
    config: true,
    requiresReload: true,
    type: Boolean,
    default: true,
  });

  game.settings.register(MODULE_NAME, ModuleSettings.enableMinimize, {
    name: game.i18n.localize(`CHUD.settings.enableMinimize.name`),
    hint: game.i18n.localize(`CHUD.settings.enableMinimize.hint`),
    scope: "world",
    config: true,
    requiresReload: true,
    type: Boolean,
    default: true,
  });

  game.settings.register(MODULE_NAME, ModuleSettings.keepMinimize, {
    name: game.i18n.localize(`CHUD.settings.keepMinimize.name`),
    hint: game.i18n.localize(`CHUD.settings.keepMinimize.hint`),
    scope: "world",
    config: true,
    requiresReload: false,
    type: Boolean,
    default: false,
  });

  game.settings.register(MODULE_NAME, ModuleSettings.clearActiveParticipantOnVisibilityChange, {
    name: game.i18n.localize(`CHUD.settings.clearActiveParticipantOnVisibilityChange.name`),
    hint: game.i18n.localize(`CHUD.settings.clearActiveParticipantOnVisibilityChange.hint`),
    scope: "world",
    config: true,
    requiresReload: true,
    type: Boolean,
    default: false,
  });

  game.settings.register(MODULE_NAME, ModuleSettings.enableSceneConversations, {
    name: game.i18n.localize(`CHUD.settings.enableSceneConversations.name`),
    hint: game.i18n.localize(`CHUD.settings.enableSceneConversations.hint`),
    scope: "world",
    config: true,
    requiresReload: true,
    type: Boolean,
    default: true,
  });

  game.settings.register(MODULE_NAME, ModuleSettings.blurAmount, {
    name: game.i18n.localize(`CHUD.settings.blurAmount.name`),
    hint: game.i18n.localize(`CHUD.settings.blurAmount.hint`),
    scope: "world",
    config: true,
    requiresReload: true,
    type: Number,
    range: {
      min: 0,
      max: 15,
      step: 1,
    },
    default: 5,
  });

  game.settings.register(MODULE_NAME, ModuleSettings.activeParticipantFontSize, {
    name: game.i18n.localize(`CHUD.settings.activeParticipantFontSize.name`),
    hint: game.i18n.localize(`CHUD.settings.activeParticipantFontSize.hint`),
    scope: "world",
    config: true,
    requiresReload: true,
    type: String,
    default: "regular",
    choices: {
      verySmall: game.i18n.localize(`CHUD.settings.fontSizeOptions.verySmall`),
      small: game.i18n.localize(`CHUD.settings.fontSizeOptions.small`),
      regular: game.i18n.localize(`CHUD.settings.fontSizeOptions.regular`),
      large: game.i18n.localize(`CHUD.settings.fontSizeOptions.large`),
      veryLarge: game.i18n.localize(`CHUD.settings.fontSizeOptions.veryLarge`),
    },
  });

  game.settings.register(MODULE_NAME, ModuleSettings.activeParticipantFactionFontSize, {
    name: game.i18n.localize(`CHUD.settings.activeParticipantFactionFontSize.name`),
    hint: game.i18n.localize(`CHUD.settings.activeParticipantFactionFontSize.hint`),
    scope: "world",
    config: true,
    requiresReload: true,
    type: String,
    default: "regular",
    choices: {
      verySmall: game.i18n.localize(`CHUD.settings.fontSizeOptions.verySmall`),
      small: game.i18n.localize(`CHUD.settings.fontSizeOptions.small`),
      regular: game.i18n.localize(`CHUD.settings.fontSizeOptions.regular`),
      large: game.i18n.localize(`CHUD.settings.fontSizeOptions.large`),
      veryLarge: game.i18n.localize(`CHUD.settings.fontSizeOptions.veryLarge`),
    },
  });

  game.settings.registerMenu(MODULE_NAME, "migrationWizard", {
    name: game.i18n.localize("CHUD.settings.migrationWizard.name"),
    label: game.i18n.localize("CHUD.settings.migrationWizard.button"),
    hint: game.i18n.localize("CHUD.settings.migrationWizard.hint"),
    icon: "fa-solid fa-screwdriver-wrench",
    type: MigrationForm,
    restricted: true,
    onOpen: () => {
      const conversationsToMigrate = getConversationsToMigrate();
      const factionsToMigrate = getFactionsToMigrate();
      const dataToMigrate = { conversationsToMigrate, factionsToMigrate };
      return new MigrationForm(dataToMigrate);
    },
  });

  game.settings.register(MODULE_NAME, ModuleSettings.scehmaVersion, {
    name: "Schema Version",
    scope: "world",
    config: false,
    type: String,
    default: "",
  });
}
