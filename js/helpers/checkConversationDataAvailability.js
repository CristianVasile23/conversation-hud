/// <reference path="../types/ConversationData.js" />

import { socket } from "../init.js";

/**
  Function that parses through the list of provided users and checks to see if there is a user which
  is in an active conversation.

  @param {User[]} users An array of users for which to check the existence of a conversation
  @returns {Promise<{
    result: {
      conversationIsActive: boolean;
      conversationIsVisible: boolean;
      activeConversation: GMControlledConversationData;
    };
    userId: string;
  }>}
**/
export async function checkConversationDataAvailability(users) {
  for (let i = 0; i < users.length; i++) {
    const result = await socket.executeAsUser("getConversation", users[i].id);

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
