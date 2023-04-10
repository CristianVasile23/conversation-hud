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
        return data;
      } else {
        ui.notifications.error(game.i18n.localize("CHUD.errors.invalidActor"));
        return null;
      }
    case "JournalEntry":
      const entry = await JournalEntry.implementation.fromDropData(data);
      // Check if the entry is a MEJ person
      if (entry.flags["monks-enhanced-journal"] && entry.flags["monks-enhanced-journal"].pagetype === "person") {
        const pages = entry.getEmbeddedCollection("JournalEntryPage").contents;
        if (pages.length > 0) {
          const data = {
            name: pages[0].name || "",
            img: pages[0].src || "",
          };
          return data;
        } else {
          ui.notifications.error(game.i18n.localize("CHUD.errors.invalidActor"));
          return null;
        }
      }

      ui.notifications.error(game.i18n.localize("CHUD.errors.typeNotSupported"));
      return null;
    default:
      ui.notifications.error(game.i18n.localize("CHUD.errors.typeNotSupported"));
      return null;
  }
}
