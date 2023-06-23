export async function preloadTemplates() {
  const templates = [
    "modules/conversation-hud/templates/fragments/conversation_participants_list.hbs",
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
