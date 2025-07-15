import { MODULE_NAME } from "../constants/index.js";

/**
  [TODO: Add JSDoc]
**/
export const registerHook = () => {
  /**
   * Tracks which form groups have been wrapped already.
   * @type {Set<HTMLElement>}
   */
  const wrappedGroups = new Set();

  /**
   * Groups settings by input ID into a fieldset.
   * @param {HTMLElement} section - The settings tab section.
   * @param {string[]} inputIds - List of input IDs.
   * @param {string} legendKey - i18n key for the legend.
   * @param {Object<string, string|string[]>} [classMap={}] - Optional map of inputId to class(es) to add.
   */
  const wrapLabeledSettingsInFieldset = (section, inputIds, legendKey, classMap = {}) => {
    const fieldset = document.createElement("fieldset");
    fieldset.classList.add("chud-settings-group");

    const legend = document.createElement("legend");
    legend.textContent = game.i18n.localize(legendKey);
    fieldset.appendChild(legend);

    for (const inputId of inputIds) {
      const label = section.querySelector(`label[for="${inputId}"]`);
      const formGroup = label?.closest(".form-group");
      if (formGroup && !wrappedGroups.has(formGroup)) {
        // Apply custom class(es) if defined
        const classes = classMap[inputId];
        if (classes) {
          if (Array.isArray(classes)) {
            classes.forEach((cls) => formGroup.classList.add(cls));
          } else {
            formGroup.classList.add(classes);
          }
        }

        wrappedGroups.add(formGroup);
        fieldset.appendChild(formGroup);
      }
    }

    section.appendChild(fieldset);
  };

  /**
   * Finds any unwrapped .form-group and moves them into an "Others" fieldset.
   * @param {HTMLElement} section - The settings tab section.
   * @param {string} legendKey - i18n key for the "others" legend.
   */
  const wrapRemainingSettingsInFallback = (section, legendKey) => {
    const remaining = Array.from(section.querySelectorAll(".form-group")).filter((fg) => !wrappedGroups.has(fg));

    if (remaining.length === 0) return;

    const fieldset = document.createElement("fieldset");
    fieldset.classList.add("chud-settings-group");

    const legend = document.createElement("legend");
    legend.textContent = game.i18n.localize(legendKey);
    fieldset.appendChild(legend);

    for (const group of remaining) {
      wrappedGroups.add(group);
      fieldset.appendChild(group);
    }

    section.appendChild(fieldset);
  };

  // Hook that adds some separators to the ConversationHud settings page
  Hooks.on("renderSettingsConfig", (_app, html) => {
    if (!game.user.isGM) return;

    const section = html.querySelector(`section[data-category="${MODULE_NAME}"]`);
    if (!section) return;

    // Reset tracking in case this runs more than once
    wrappedGroups.clear();

    wrapLabeledSettingsInFieldset(
      section,
      [
        "settings-config-conversation-hud.portraitStyle",
        "settings-config-conversation-hud.portraitAnchorVertical",
        "settings-config-conversation-hud.portraitAnchorHorizontal",
      ],
      "CHUD.settings.settingsSheetHeaders.portrait"
    );

    wrapLabeledSettingsInFieldset(
      section,
      [
        "settings-config-conversation-hud.displayAllParticipantsToPlayers",
        "settings-config-conversation-hud.displayNoParticipantBox",
        "settings-config-conversation-hud.blurAmount",
      ],
      "CHUD.settings.settingsSheetHeaders.interface",
      {
        "settings-config-conversation-hud.displayAllParticipantsToPlayers": "very-slim",
        "settings-config-conversation-hud.displayNoParticipantBox": "very-slim",
      }
    );

    wrapLabeledSettingsInFieldset(
      section,
      [
        "settings-config-conversation-hud.enableSpeakAs",
        "settings-config-conversation-hud.enableMinimize",
        "settings-config-conversation-hud.keepMinimize",
        "settings-config-conversation-hud.clearActiveParticipantOnVisibilityChange",
        "settings-config-conversation-hud.enableSceneConversations",
      ],
      "CHUD.settings.settingsSheetHeaders.features",
      {
        "settings-config-conversation-hud.enableSpeakAs": "very-slim",
        "settings-config-conversation-hud.enableMinimize": "very-slim",
        "settings-config-conversation-hud.keepMinimize": "very-slim",
        "settings-config-conversation-hud.clearActiveParticipantOnVisibilityChange": "very-slim",
        "settings-config-conversation-hud.enableSceneConversations": "very-slim",
      }
    );

    wrapLabeledSettingsInFieldset(
      section,
      ["settings-config-conversation-hud.migrationWizard"],
      "CHUD.settings.settingsSheetHeaders.dataMigration"
    );

    wrapLabeledSettingsInFieldset(
      section,
      [
        "settings-config-conversation-hud.activeParticipantFontSize",
        "settings-config-conversation-hud.activeParticipantFactionFontSize",
      ],
      "CHUD.settings.settingsSheetHeaders.fontSize"
    );

    // Fallback group
    wrapRemainingSettingsInFallback(section, "CHUD.settings.settingsSheetHeaders.others");
  });
};
