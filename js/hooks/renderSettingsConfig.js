import { MODULE_NAME } from "../constants/index.js";

/**
  [TODO: Add JSDoc]
**/
export const registerHook = () => {
  // Hook that adds some separators to the ConversationHud settings page
  Hooks.on("renderSettingsConfig", (app, html, data) => {
    if (!game.user.isGM) return;

    html[0].querySelectorAll(".tab.category").forEach((el) => {
      const moduleId = el.getAttribute("data-tab");
      const module = game.modules.get(moduleId);

      if (!module) return;
      if (module.id !== MODULE_NAME) return;

      const portraitStyle = el.querySelector('div[data-setting-id="conversation-hud.portraitStyle"]');
      const portraitSectionHeader = document.createElement("h3");
      portraitSectionHeader.textContent = game.i18n.localize("CHUD.settings.settingsSheetHeaders.portrait");
      el.insertBefore(portraitSectionHeader, portraitStyle);

      const displayAllParticipantsToPlayers = el.querySelector('div[data-setting-id="conversation-hud.displayAllParticipantsToPlayers"]');
      const featuresSectionHeader = document.createElement("h3");
      featuresSectionHeader.textContent = game.i18n.localize("CHUD.settings.settingsSheetHeaders.feature");
      el.insertBefore(featuresSectionHeader, displayAllParticipantsToPlayers);

      const activeParticipantFontSize = el.querySelector('div[data-setting-id="conversation-hud.activeParticipantFontSize"]');
      el.insertBefore(document.createElement("hr"), activeParticipantFontSize);

      const rpgUiFix = el.querySelector('div[data-setting-id="conversation-hud.rpgUiFix"]');
      const compatibilitySectionHeader = document.createElement("h3");
      compatibilitySectionHeader.textContent = game.i18n.localize("CHUD.settings.settingsSheetHeaders.compatibility");
      el.insertBefore(compatibilitySectionHeader, rpgUiFix);
    });
  });
};
