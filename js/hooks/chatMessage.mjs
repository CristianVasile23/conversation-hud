/**
  [TODO: Add JSDoc]
**/
export const registerHook = () => {
  Hooks.on("chatMessage", (chatLog, message, chatData) => {
    // Check to see if the message is a command, in which case we ignore it
    if (message[0] === "/") return true;

    // TODO: Check this condition when having a collective conversation
    // Check to see if user is a GM as only a GM should be able to speak as another NPC
    if (!game.user.isGM) return true;

    // Check for an active conversation
    if (!game.ConversationHud.conversationIsActive) return true;

    // Check to see if the conversation is visible
    if (!game.ConversationHud.conversationIsVisible) return true;

    const activeConversation = game.ConversationHud.activeConversation?.getConversation();

    if (!activeConversation) return true;

    // Check to see if there is an active participant
    const activeParticipant = activeConversation.currentState.currentActiveParticipant;
    if (activeParticipant === -1) return true;

    // Check to see if the speaking as functionality is enabled
    if (!activeConversation.conversationData.conversation.features.isSpeakingAs) return true;

    // Get active participant
    const participant = activeConversation.conversationData.conversation.data.participants[activeParticipant];
    const participantName = participant.displayName ? participant.name : game.i18n.localize("CHUD.strings.unknown");

    // Remove leading commands if there are any
    message = message.replace(/\\n/g, "<br>");
    const newChatData = {
      ...chatData,
      content: message,
      speaker: {
        alias: participantName,
        actor: null,
        token: null,
      },
      flags: {
        chud: {
          customPortrait: participant.img,
        },
      },
      type: CONST.CHAT_MESSAGE_STYLES.IC,
    };

    ChatMessage.create(newChatData, {});
    return false;
  });
};
