/**
  [TODO: Add JSDoc]
**/
export const registerHook = () => {
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

    newChatData.speaker.alias = participant.displayName ? participant.name : game.i18n.localize("CHUD.strings.unknown");
    newChatData.speaker.actor = null;
    newChatData.speaker.token = null;

    ChatMessage.create(newChatData, {});
    return false;
  });
};