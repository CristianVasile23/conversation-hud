import { MODULE_NAME } from "./constants.js";
import { ModuleSettings } from "./settings.js";

Hooks.on("chatMessage", (chatLog, message, chatData) => {
  // Check to see if the message is a command, in which case we ignore it
  if (message[0] === "/") return true;

  // Check to see if user is a GM as only a GM should be able to speak as another NPC
  if (!game.user.isGM) return true;

  // Check for an active conversation
  if (!game.ConversationHud.conversationIsActive) return true;

  // Check to see if the conversation is visible
  if (!game.ConversationHud.conversationIsVisible) return true;

  // Check to see if there is an active participant
  const activeParticipant = game.ConversationHud.activeConversation.activeParticipant;
  if (activeParticipant === -1) return true;

  // Check to see if the speaking as functionality is enabled
  if (!game.ConversationHud.conversationIsSpeakingAs) return true;

  // Get active participant
  const participant = game.ConversationHud.activeConversation.participants[activeParticipant];

  // Additional check if using tabbed-chatlog to see if the OOC tab is selected, in which case
  // we render the original unchanged message
  if (game.modules.get("tabbed-chatlog")?.active) {
    if ($(".tabbedchatlog a.active").hasClass("ooc")) {
      return true;
    }
  }

  // Remove leading commands if there are any
  message = message.replace(/\\n/g, "<br>");
  let newChatData = {
    content: message,
    ...chatData,
    type: CONST.CHAT_MESSAGE_TYPES.IC,
  };
  newChatData.speaker.alias = participant.name;
  newChatData.speaker.actor = null;
  newChatData.speaker.token = null;

  ChatMessage.create(newChatData, {});
  return false;
});

// Hook that injects scene conversation HTML into the scene config screen
Hooks.on("renderSceneConfig", async (app, html, data) => {
  if (game.settings.get(MODULE_NAME, ModuleSettings.enableSceneConversations)) {
    const conversations = game.journal.filter((item) => item.flags.core?.sheetClass === "conversation-entry-sheet.ConversationEntrySheet");
    const linkedConversation = data.data["flags"]["conversation-hud"]?.sceneConversation || undefined;
    const sceneConversationVisibilityOff = data.data["flags"]["conversation-hud"]?.sceneConversationVisibilityOff || undefined;

    const renderedHtml = await renderTemplate("modules/conversation-hud/templates/fragments/scene_conversation_selector.hbs", {
      conversations: conversations,
      linkedConversation: linkedConversation,
      sceneConversationVisibilityOff: sceneConversationVisibilityOff,
    });

    html.find('div[data-tab="ambience"] > .form-group').last().after(renderedHtml);
    app.setPosition({ height: "auto" });
  }
});

// Hook that starts a conversation if there is one associated to the currently active scene
Hooks.on("updateScene", (scene, data, options) => {
  if (game.settings.get(MODULE_NAME, ModuleSettings.enableSceneConversations)) {
    if (scene.active) {
      const journalId = scene["flags"]["conversation-hud"]?.sceneConversation;
      const visibilityOff = scene["flags"]["conversation-hud"]?.sceneConversationVisibilityOff || false;

      if (journalId) {
        game.ConversationHud.startConversationFromJournalId(journalId, visibilityOff);
      }
    }
  }
});
