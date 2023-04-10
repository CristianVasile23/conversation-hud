export async function getActorDataFromDragEvent(event) {
  const data = TextEditor.getDragEventData(event);

  switch (data.type) {
    case "Actor":
      const actor = await Actor.implementation.fromDropData(data);
      if (actor) {
        const data = {
          name: actor.name || "",
          img: actor.img || "",
        };
        return [data];
      } else {
        ui.notifications.error(game.i18n.localize("CHUD.errors.invalidActor"));
        return null;
      }
    case "JournalEntry":
      const entry = await JournalEntry.implementation.fromDropData(data);
      const conversationParticipants = [];
      const pages = entry.getEmbeddedCollection("JournalEntryPage").contents;
      pages.forEach((page) => {
        let participant;
        switch (page.type) {
          case "text":
            // Handle text pages only if they have the the MEJ flag
            if (page.flags["monks-enhanced-journal"]) {
              const pageType = entry.flags["monks-enhanced-journal"].pagetype;
              if (pageType && (pageType === "person" || pageType === "picture")) {
                participant = {
                  name: page.name || "",
                  img: page.src || "",
                };
                conversationParticipants.push(participant);
              }
            }
            break;
          case "image":
            participant = {
              name: page.image.caption || "",
              img: page.src || "",
            };
            conversationParticipants.push(participant);
            break;
          default:
            break;
        }
      });
      if (conversationParticipants.length > 0) {
        return conversationParticipants;
      } else {
        ui.notifications.warn(game.i18n.localize("CHUD.warnings.noParticipantDataFound"));
        return null;
      }
    default:
      ui.notifications.error(game.i18n.localize("CHUD.errors.typeNotSupported"));
      return null;
  }
}
