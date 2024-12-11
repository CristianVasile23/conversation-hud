/**
 * Function that registers all the custom Handlebars helpers which are used inside the templates
 */
export function preloadHandlebarsTemplates() {
  const templates = [
    // "modules/conversation-hud/templates/sheets/conversation-sheet.hbs",

    "modules/conversation-hud/templates/sheets/content/gm-controlled-sheet-content.hbs",

    "modules/conversation-hud/templates/forms/content/gm-controlled-conversation-creation-form-content.hbs",

    "modules/conversation-hud/templates/fragments/conversation-participants-list.hbs",
    "modules/conversation-hud/templates/fragments/faction-data.hbs",

    // "modules/conversation-hud/templates/fragments/conversation_participants_list.hbs",
    "modules/conversation-hud/templates/fragments/participant_data_config_tab.hbs",
    "modules/conversation-hud/templates/fragments/faction_data_config_tab.hbs",
    "modules/conversation-hud/templates/fragments/faction_wrapper.hbs",
    "modules/conversation-hud/templates/fragments/active_participant.hbs",

    "modules/conversation-hud/templates/banner-shapes/shape-1.hbs",
    "modules/conversation-hud/templates/banner-shapes/shape-2.hbs",
    "modules/conversation-hud/templates/banner-shapes/shape-3.hbs",
    "modules/conversation-hud/templates/banner-shapes/shape-4.hbs",
    "modules/conversation-hud/templates/banner-shapes/shape-5.hbs",
    "modules/conversation-hud/templates/banner-shapes/shape-6.hbs",
  ];
  return loadTemplates(templates);
}
