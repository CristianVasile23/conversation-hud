export async function preloadTemplates() {
  const templates = ["modules/conversation-hud/templates/fragments/conversation_participants_list.hbs"];
  return loadTemplates(templates);
}
