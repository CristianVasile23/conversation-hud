export class ConversationHud {
  // Function that initializes the class data
  init() {
    // Initialize variables
    this.conversationIsActive = false;
    this.conversationIsVisible = false;
    this.conversationIsMinimized = false;
    this.conversationIsSpeakingAs = false;
    this.conversationIsBlurred = true;
    this.activeConversation = null;

    this.dropzoneVisible = false;
    this.draggingParticipant = false;

    // Register socket hooks
    //this.registerSocketFunctions();

    // Register conversation sheet
    //this.registerConversationSheet();
  }
}
