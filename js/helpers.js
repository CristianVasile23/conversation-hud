export async function getActorDataFromDragEvent(event) {
  try {
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
        const pages = entry.getEmbeddedCollection("JournalEntryPage").contents;

        const conversationParticipants = [];
        pages.forEach((page) => {
          let participant;
          switch (page.type) {
            case "text":
              if (page.flags["conversation-hud"]) {
                // Handle text pages with the the CHUD flag
                const pageType = page.flags["conversation-hud"].type;
                if (pageType && pageType === "conversation") {
                  const participants = JSON.parse(page.text.content);
                  conversationParticipants.push(...participants);
                }
              } else if (page.flags["monks-enhanced-journal"]) {
                // Handle text pages with the the MEJ flag
                const pageType = page.flags["monks-enhanced-journal"].type;
                if (pageType && (pageType === "person" || pageType === "picture")) {
                  participant = {
                    name: page.name || "",
                    img: page.src || "",
                  };
                  conversationParticipants.push(participant);
                }
              } else {
                // Fallback for older saved conversations that have no flag attached
                // This is a hacky workaround
                if (page.name === "Conversation Participants") {
                  // Add the new flag to the old conversation page
                  if (!page.flags["conversation-hud"]) {
                    page.flags["conversation-hud"] = { type: "conversation" };
                  }
                  const participants = JSON.parse(page.text.content);
                  conversationParticipants.push(...participants);
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
  } catch (e) {
    ui.notifications.error(game.i18n.localize("CHUD.errors.generic"));
    console.error(e);
    return null;
  }
}
