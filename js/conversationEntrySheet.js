import { FileInputForm } from "./formAddParticipant.js";
import { getActorDataFromDragEvent } from "./helpers.js";

export class ConversationEntrySheet extends JournalSheet {
  constructor(data, options) {
    super(data, options);
    this.dirty = false;

    const pages = this.object.getEmbeddedCollection("JournalEntryPage").contents;
    if (pages.length === 0) {
      this.participants = [];
    } else {
      try {
        this.participants = JSON.parse(pages[0].text.content);
      } catch (error) {
        if (error instanceof SyntaxError) {
          ui.notifications.error(game.i18n.localize("CHUD.errors.failedToParse"));
        } else {
          ui.notifications.error(game.i18n.localize("CHUD.errors.generic"));
        }
        this.participants = [];
      }
    }
  }

  static get defaultOptions() {
    let defOptions = super.defaultOptions;

    return mergeObject(defOptions, {
      classes: ["sheet", "journal-sheet"],
      title: game.i18n.localize("CHUD.conversationEntry"),
      id: "conversation-entry-sheet",
      template: `modules/conversation-hud/templates/conversation_sheet.html`,
      width: 635,
      height: "auto",
      resizable: false,
    });
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find("#save-conversation").click(async (e) => this.#handleSaveConversation());

    html.find("#show-conversation").click(async (e) => this.#handleShowConversation());

    html.find("#add-participant").click(async (e) => {
      const fileInputForm = new FileInputForm(false, (data) => this.#handleAddParticipant(data));
      return fileInputForm.render(true);
    });

    // Drag and drop functionality
    const dragDropWrapper = html.find("#conversation-sheet-content-wrapper")[0];
    const dragDropZone = html.find("#conversation-sheet-dropzone")[0];
    if (dragDropWrapper && dragDropZone) {
      dragDropWrapper.ondragenter = () => {
        dragDropWrapper.classList.add("active-dropzone");
      };

      dragDropZone.ondragleave = () => {
        dragDropWrapper.classList.remove("active-dropzone");
      };

      dragDropWrapper.ondrop = async (event) => {
        event.preventDefault();
        const data = await getActorDataFromDragEvent(event);
        if (data && data.length > 0) {
          data.forEach((participant) => {
            this.#handleAddParticipant(participant);
          });
        }
        dragDropWrapper.classList.remove("active-dropzone");
      };
    }

    const participantsObject = html.find("#conversation-participants-list")[0];
    if (participantsObject) {
      const participants = participantsObject.children;
      for (let i = 0; i < participants.length; i++) {
        const controls = participants[i].children[2].children;
        controls[0].onclick = () => {
          const fileInputForm = new FileInputForm(true, (data) => this.#handleEditParticipant(data, i), {
            name: this.participants[i].name,
            img: this.participants[i].img,
          });
          fileInputForm.render(true);
        };
        controls[1].onclick = () => this.#handleRemoveParticipant(i);
      }
    }
  }

  getData(options) {
    const baseData = super.getData(options);

    const data = {
      name: baseData.data.name,
      dirty: this.dirty,
      participants: this.participants,
    };

    return data;
  }

  close(options) {
    if (this.dirty) {
      const dialog = new Dialog({
        title: game.i18n.localize("CHUD.unsavedChanges"),
        content: game.i18n.localize("CHUD.unsavedChangesHint"),
        buttons: {
          yes: {
            icon: '<i class="fas fa-save"></i>',
            label: game.i18n.localize("CHUD.save"),
            callback: this.#handleConfirmationClose.bind(this, true),
          },
          no: {
            icon: '<i class="fas fa-trash"></i>',
            label: game.i18n.localize("CHUD.discardChanges"),
            callback: this.#handleConfirmationClose.bind(this, false),
          },
        },
      });
      dialog.render(true);
      return Promise.resolve();
    } else {
      this.dirty = false;
      Object.values(this.editors).forEach((ed) => {
        if (ed.instance) ed.instance.destroy();
      });
      return super.close({ submit: false });
    }
  }

  async #handleConfirmationClose(save) {
    if (save) {
      await this.#handleSaveConversation();
    } else {
      const pages = this.object.getEmbeddedCollection("JournalEntryPage").contents;
      if (pages.length === 0) {
        this.participants = [];
      } else {
        this.participants = JSON.parse(pages[0].text.content);
      }
      this.dirty = false;
    }
    return this.close();
  }

  #handleShowConversation() {
    if (game.ConversationHud) {
      const pages = this.object.getEmbeddedCollection("JournalEntryPage").contents;
      if (pages.length > 0) {
        try {
          const conversationData = JSON.parse(pages[0].text.content);
          game.ConversationHud.startConversationFromData(conversationData);
        } catch (error) {
          if (error instanceof SyntaxError) {
            ui.notifications.error(game.i18n.localize("CHUD.errors.failedToParse"));
          } else {
            ui.notifications.error(game.i18n.localize("CHUD.errors.generic"));
          }
        }
      } else {
        ui.notifications.error(game.i18n.localize("CHUD.errors.activateNoPages"));
      }
    } else {
      ui.notifications.error(game.i18n.localize("CHUD.errors.activateNoInit"));
    }
  }

  async #handleSaveConversation() {
    // Get document pages
    const pages = this.object.getEmbeddedCollection("JournalEntryPage").contents;

    if (pages.length === 0) {
      // Create a document entry page if none are present
      await this.object.createEmbeddedDocuments("JournalEntryPage", [
        {
          text: { content: JSON.stringify(this.participants) },
          name: game.i18n.localize("CHUD.conversationParticipants"),
        },
      ]);
    } else {
      // Otherwise, update the first (and realistically the only) entry page
      pages[0].text.content = JSON.stringify(this.participants);
      await this.object.updateEmbeddedDocuments(
        "JournalEntryPage",
        [
          {
            _id: pages[0]._id,
            name: pages[0].name,
            type: pages[0].type,
            text: { content: pages[0].text?.content || "", format: 1, markdown: undefined },
            src: pages[0].src || "",
            image: { caption: pages[0].image?.caption || "" },
            video: pages[0].video,
          },
        ],
        { render: false, renderSheet: false }
      );
    }

    this.dirty = false;
    this.render(false);
  }

  #handleEditParticipant(data, index) {
    if (data.name === "") {
      data.name = game.i18n.localize("CHUD.anonymous");
    }
    if (data.img === "") {
      data.img = "modules/conversation-hud/img/silhouette.jpg";
    }

    this.participants[index] = data;
    this.dirty = true;
    this.render(false);
  }

  #handleAddParticipant(data) {
    if (data.name === "") {
      data.name = game.i18n.localize("CHUD.anonymous");
    }
    if (data.img === "") {
      data.img = "modules/conversation-hud/img/silhouette.jpg";
    }

    this.participants.push(data);
    this.dirty = true;
    this.render(false);
  }

  #handleRemoveParticipant(index) {
    this.participants.splice(index, 1);
    this.dirty = true;
    this.render(false);
  }
}
