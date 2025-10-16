import { ConversationHud as ConversationHudClass } from "./js/conversation.js";

export {};

declare global {
  var game: {
    ConversationHud: ConversationHudClass;
  };
}
