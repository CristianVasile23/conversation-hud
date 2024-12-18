import { ConversationTypes, DRAG_AND_DROP_DATA_TYPES } from "../constants/index.js";

/**
 * [TODO: Add JSDoc]
 */
export async function getActorDataFromDragEvent(event) {
  try {
    const data = TextEditor.getDragEventData(event);

    switch (data.type) {
      case DRAG_AND_DROP_DATA_TYPES.ConversationHudParticipant:
        return [data.participant];
      case DRAG_AND_DROP_DATA_TYPES.Actor:
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
      case DRAG_AND_DROP_DATA_TYPES.JournalEntry:
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
                if (pageType && pageType === "conversation-sheet-data") {
                  const conversationData = JSON.parse(page.text.content);

                  // TODO: Add actual handling of conversation types
                  if (conversationData.type === ConversationTypes.GMControlled) {
                    conversationParticipants.push(...conversationData.conversation.data.participants);
                  }
                }
              } else if (page.flags["monks-enhanced-journal"]) {
                // Handle text pages with the the MEJ flag
                const pageType = page.flags["monks-enhanced-journal"].type;
                if (pageType) {
                  switch (pageType) {
                    case "person":
                    case "picture":
                    case "organization":
                    case "loot":
                    case "place":
                    case "poi":
                      participant = {
                        name: page.name || "",
                        img: page.src || "",
                      };
                      conversationParticipants.push(participant);
                    default:
                      break;
                  }
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
            case "person":
            case "picture":
            case "organization":
            case "loot":
            case "place":
            case "poi":
              participant = {
                name: page.name || "",
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
