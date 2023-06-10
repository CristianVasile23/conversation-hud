import { MODULE_NAME } from "./constants.js";

export const ModuleSettings = {
  portraitStyle: "portraitStyle",
  portraitAnchor: "portraitAnchor",
  enableMinimize: "enableMinimize",
  enableSpeakAs: "enableSpeakAs",
  activeParticipantFontSize: "activeParticipantFontSize",
  rpgUiFix: "rpgUiFix",
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
    },
  });

  game.settings.register(MODULE_NAME, ModuleSettings.portraitAnchor, {
    name: game.i18n.localize(`CHUD.settings.portraitAnchor.name`),
    hint: game.i18n.localize(`CHUD.settings.portraitAnchor.hint`),
    scope: "world",
    config: true,
    requiresReload: true,
    type: String,
    default: "center",
    choices: {
      top: game.i18n.localize(`CHUD.settings.portraitAnchor.choices.top`),
      center: game.i18n.localize(`CHUD.settings.portraitAnchor.choices.center`),
      bottom: game.i18n.localize(`CHUD.settings.portraitAnchor.choices.bottom`),
    },
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

  game.settings.register(MODULE_NAME, ModuleSettings.activeParticipantFontSize, {
    name: game.i18n.localize(`CHUD.settings.activeParticipantFontSize.name`),
    hint: game.i18n.localize(`CHUD.settings.activeParticipantFontSize.hint`),
    scope: "world",
    config: true,
    requiresReload: true,
    type: String,
    default: "regular",
    choices: {
      verySmall: game.i18n.localize(`CHUD.settings.activeParticipantFontSize.choices.verySmall`),
      small: game.i18n.localize(`CHUD.settings.activeParticipantFontSize.choices.small`),
      regular: game.i18n.localize(`CHUD.settings.activeParticipantFontSize.choices.regular`),
      large: game.i18n.localize(`CHUD.settings.activeParticipantFontSize.choices.large`),
      veryLarge: game.i18n.localize(`CHUD.settings.activeParticipantFontSize.choices.veryLarge`),
    },
  });

  game.settings.register(MODULE_NAME, ModuleSettings.rpgUiFix, {
    name: game.i18n.localize(`CHUD.settings.rpgUiFix.name`),
    hint: game.i18n.localize(`CHUD.settings.rpgUiFix.hint`),
    scope: "world",
    config: true,
    requiresReload: true,
    type: Boolean,
    default: false,
  });
}
