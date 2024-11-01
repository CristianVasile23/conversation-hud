import { socket } from "./init.js";
import { EMPTY_FACTION, MODULE_NAME } from "./constants.js";
import { ModuleSettings } from "./settings.js";

export async function getActorDataFromDragEvent(event) {
  try {
    const data = TextEditor.getDragEventData(event);

    switch (data.type) {
      case "ConversationParticipant":
        return [data.participant];
      case "Actor":
        const actor = await Actor.implementation.fromDropData(data);
        if (actor) {
          const data = {
            name: actor.name || "",
            img: actor.img || "",
            linkedActor: actor.id || undefined,
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
                  const data = JSON.parse(page.text.content);
                  let participants = [];

                  // Determine if the data parsed respects the old data format or the new data format
                  if (data instanceof Array) {
                    participants = data;
                  } else {
                    participants = data.participants;
                  }

                  conversationParticipants.push(...participants);
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

export async function checkConversationDataAvailability(users) {
  for (let i = 0; i < users.length; i++) {
    const result = await socket.executeAsUser("getActiveConversation", users[i].id);

    // Check to see if we have a result and it is an active conversation
    if (result) {
      if (result.conversationIsActive) {
        // We found an active conversation
        const userId = users[i].id;
        return { result, userId };
      }
    }
  }
}

export async function updateConversationControls() {
  // Update the controls
  const uiInterface = document.getElementById("interface");
  const controls = document.getElementById("ui-conversation-controls");
  if (controls) {
    // Remove the old controls
    uiInterface.removeChild(controls);
  }

  const conversationControls = await renderTemplate("modules/conversation-hud/templates/conversation_controls.hbs", {
    isGM: game.user.isGM,
    isMinimized: game.ConversationHud.conversationIsMinimized,
    isVisible: game.ConversationHud.conversationIsVisible,
    isSpeakingAs: game.ConversationHud.conversationIsSpeakingAs,
    isBlurred: game.ConversationHud.conversationIsBlurred,
    features: {
      minimizeEnabled: game.settings.get(MODULE_NAME, ModuleSettings.enableMinimize),
      speakAsEnabled: game.settings.get(MODULE_NAME, ModuleSettings.enableSpeakAs),
    },
  });

  const updatedControls = document.createElement("section");
  updatedControls.id = "ui-conversation-controls";
  updatedControls.setAttribute("data-tooltip-direction", "LEFT");
  updatedControls.innerHTML = conversationControls;

  const uiRight = document.getElementById("ui-right");
  uiRight.before(updatedControls);
}

export async function updateConversationLayout() {
  // Update the layout
  const conversationHud = document.getElementById("ui-conversation-hud");
  if (game.ConversationHud.conversationIsMinimized) {
    conversationHud.classList.add("minimized");
  } else {
    conversationHud.classList.remove("minimized");
  }

  if (game.ConversationHud.conversationIsVisible) {
    const conversationBackground = document.getElementById("conversation-hud-background");
    if (game.ConversationHud.conversationIsMinimized) {
      conversationBackground.classList.remove("visible");
    } else {
      conversationBackground.classList.add("visible");
    }
  }
}

export function handleOnClickContentLink(event, wrapped) {
  event.preventDefault();
  const currentTarget = event.currentTarget;
  let document = null;

  if (currentTarget.dataset.pack) {
    return wrapped.bind(this)(event);
  }

  if (currentTarget.dataset.type !== "JournalEntry") {
    return wrapped.bind(this)(event);
  }

  const collection = game.collections.get(currentTarget.dataset.type);
  document = collection.get(currentTarget.dataset.id);

  if (document?.flags?.core?.sheetClass === "conversation-entry-sheet.ConversationEntrySheet") {
    if (!document.testUserPermission(game.user, "LIMITED")) {
      ui.notifications.warn(game.i18n.localize("CHUD.errors.activateNoPerms"));
    } else {
      if (event.ctrlKey) {
        if (game.ConversationHud) {
          const pages = document.getEmbeddedCollection("JournalEntryPage").contents;
          if (pages.length > 0) {
            try {
              const conversationData = JSON.parse(pages[0].text.content);
              const visibility = game.ConversationHud.conversationIsActive ? game.ConversationHud.conversationIsVisible : true;
              game.ConversationHud.startConversationFromData(conversationData, visibility);
            } catch (error) {
              if (error instanceof SyntaxError) {
                ui.notifications.error(game.i18n.localize("CHUD.errors.failedToParse"));
              } else {
                ui.notifications.error(game.i18n.localize("CHUD.errors.genericSheetError"));
              }
            }
          } else {
            ui.notifications.error(game.i18n.localize("CHUD.errors.activateNoPages"));
          }
        } else {
          ui.notifications.error(game.i18n.localize("CHUD.errors.activateNoInit"));
        }
        return;
      }
    }
  }

  return wrapped.bind(this)(event);
}

export function checkIfUserGM() {
  if (!game.user.isGM) {
    if (game.user.isGM) {
      ui.notifications.error(game.i18n.localize("CHUD.errors.insufficientRights"));
    }
    return false;
  }
  return true;
}

export function checkIfConversationActive() {
  if (!game.ConversationHud.conversationIsActive) {
    ui.notifications.error(game.i18n.localize("CHUD.errors.noActiveConversation"));
    return false;
  }
  return true;
}

export function moveInArray(arr, from, to) {
  let item = arr.splice(from, 1);
  arr.splice(to, 0, item[0]);
}

export function displayDragAndDropIndicator(targetElement, event) {
  let bounding = event.target.getBoundingClientRect();
  let offset = bounding.y + bounding.height / 2;

  const topIndicator = targetElement.querySelector("#drag-drop-indicator-top");
  const bottomIndicator = targetElement.querySelector("#drag-drop-indicator-bottom");

  if (event.clientY - offset > 0) {
    topIndicator.style["display"] = "none";
    bottomIndicator.style["display"] = "block";
  } else {
    topIndicator.style["display"] = "block";
    bottomIndicator.style["display"] = "none";
  }
}

export function hideDragAndDropIndicator(targetElement) {
  const topIndicator = targetElement.querySelector("#drag-drop-indicator-top");
  const bottomIndicator = targetElement.querySelector("#drag-drop-indicator-bottom");
  topIndicator.style["display"] = "none";
  bottomIndicator.style["display"] = "none";
}

export function getDragAndDropIndex(event, targetIndex, oldIndex) {
  let bounding = event.target.getBoundingClientRect();
  let offset = bounding.y + bounding.height / 2;

  // Get the new index of the dropped element
  let newIndex;
  if (event.clientY - offset > 0) {
    // Element is dropped at the bottom
    if (oldIndex > targetIndex) {
      newIndex = targetIndex + 1;
    } else {
      newIndex = targetIndex;
    }
  } else {
    // Element is dropped at the top
    if (oldIndex > targetIndex) {
      newIndex = targetIndex;
    } else {
      newIndex = targetIndex - 1;
    }
  }

  return newIndex;
}

export function fixRpgUiIncompatibility() {
  let cssFix = document.createElement("link");
  cssFix.rel = "stylesheet";
  cssFix.type = "text/css";
  cssFix.href = "modules/conversation-hud/css/rpg-ui-compatibility.css";
  document.getElementsByTagName("head")[0].appendChild(cssFix);
}

export function setDefaultDataForParticipant(data) {
  if (data.name === "") {
    data.name = game.i18n.localize("CHUD.strings.anonymous");
  }
  if (data.img === "") {
    data.img = "modules/conversation-hud/img/silhouette.jpg";
  }

  if (data.faction && data.faction.displayFaction) {
    if (data.faction.factionName === "") {
      data.faction.factionName = game.i18n.localize("CHUD.faction.unknownFaction");
    }

    if (data.faction.factionLogo === "" && !data.faction.factionBannerEnabled) {
      data.faction.factionLogo = "icons/svg/combat.svg";
    }
  }
}

export function processParticipantData(data) {
  setDefaultDataForParticipant(data);
  normalizeParticipantDataStructure(data);

  if (data.faction?.selectedFaction) {
    updateParticipantFactionBasedOnSelectedFaction(data);
  }

  // Add anchor object if missing
  if (!data.portraitAnchor) {
    data.portraitAnchor = getPortraitAnchorObjectFromParticipant(data);
  }
}

export function getConfirmationFromUser(
  localizationString,
  onConfirm,
  onReject = () => {},
  confirmIcon = '<i class="fas fa-check"></i>',
  rejectIcon = '<i class="fas fa-times"></i>'
) {
  const dialogPromise = new Promise((resolve, reject) => {
    const titleText = game.i18n.localize(`${localizationString}.title`);
    const contentText = game.i18n.localize(`${localizationString}.content`);
    const confirmText = game.i18n.localize(`${localizationString}.confirm`);
    const rejectText = game.i18n.localize(`${localizationString}.reject`);

    const dialog = new Dialog({
      title: titleText,
      content: `<div style="margin-bottom: 8px;">${game.i18n.localize(contentText)}</div>`,
      buttons: {
        confirm: {
          icon: confirmIcon,
          label: confirmText,
          callback: () => {
            onConfirm();
            resolve(true);
          },
        },
        reject: {
          icon: rejectIcon,
          label: rejectText,
          callback: () => {
            onReject();
            resolve(false);
          },
        },
      },
      default: "confirm",
    });
    dialog.render(true);
  });

  return dialogPromise;
}

export function checkIfCameraDockOnBottomOrTop() {
  const cameraViews = document.getElementById("camera-views");

  if (cameraViews) {
    if (cameraViews.classList.contains("camera-position-bottom") || cameraViews.classList.contains("camera-position-top")) {
      return true;
    }
  }

  return false;
}

export function getConversationDataFromJournalId(journalId) {
  const document = game.journal.get(journalId);
  const pages = document.getEmbeddedCollection("JournalEntryPage").contents;
  if (pages.length > 0) {
    try {
      const conversationData = JSON.parse(pages[0].text.content);
      return conversationData;
    } catch (error) {
      if (error instanceof SyntaxError) {
        ui.notifications.error(game.i18n.localize("CHUD.errors.failedToParse"));
      } else {
        ui.notifications.error(game.i18n.localize("CHUD.errors.genericSheetError"));
      }
    }
  } else {
    ui.notifications.error(game.i18n.localize("CHUD.errors.activateNoPages"));
  }

  return null;
}

export function convertActorToParticipant(actor) {
  const participant = {
    name: actor.name,
    displayName: true,
    img: actor.img,
    linkedJournal: "",
    linkedActor: "",
    faction: EMPTY_FACTION,
  };

  return participant;
}

export function updateParticipantFactionBasedOnSelectedFaction(participant) {
  if (participant.faction.selectedFaction) {
    const factionData = getConversationDataFromJournalId(participant.faction.selectedFaction);
    const selectedFactionData = factionData.faction;
    participant.faction = {
      ...selectedFactionData,
      displayFaction: participant.faction.displayFaction,
      selectedFaction: participant.faction.selectedFaction,
    };
  }
}

export function getPortraitAnchorObjectFromParticipant(participant) {
  return {
    vertical: participant?.portraitAnchor?.vertical || game.settings.get(MODULE_NAME, ModuleSettings.portraitAnchorVertical),
    horizontal: participant?.portraitAnchor?.horizontal || game.settings.get(MODULE_NAME, ModuleSettings.portraitAnchorHorizontal),
  };
}

// Function used to normalize participant data structure for those participants that have been created with previous version of CHUD
export function normalizeParticipantDataStructure(participant) {
  const normalizedParticipant = {
    ...participant,
  };

  normalizedParticipant.name = participant.name || "";

  normalizedParticipant.imgScale = participant.imgScale || 1;

  normalizedParticipant.displayName = participant.displayName === undefined ? true : participant.displayName;
  normalizedParticipant.faction = participant.faction || EMPTY_FACTION;

  normalizedParticipant.linkedJournal = participant.linkedJournal || "";
  normalizedParticipant.linkedActor = participant.linkedActor || "";

  return normalizedParticipant;
}
