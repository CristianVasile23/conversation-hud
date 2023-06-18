export async function preloadTemplates() {
  const templates = [
    "modules/conversation-hud/templates/fragments/conversation_participants_list.hbs",
    "modules/conversation-hud/templates/banner-shapes/shape-1.hbs",
    "modules/conversation-hud/templates/banner-shapes/shape-2.hbs",
    "modules/conversation-hud/templates/banner-shapes/shape-3.hbs",
    "modules/conversation-hud/templates/banner-shapes/shape-4.hbs",
  ];
  return loadTemplates(templates);
}
