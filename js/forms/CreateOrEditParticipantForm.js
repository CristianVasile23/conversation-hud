/// <reference path="../types/ParticipantData.js" />
/// <reference path="../types/PortraitAnchor.js" />

import { ANCHOR_OPTIONS, SHEET_CLASSES } from "../constants/index.js";
import { createPortraitAnchorObject, getConversationDataFromJournalId } from "../helpers/index.js";

export class CreateOrEditParticipantForm extends FormApplication {
  isEditing = false;
  callbackFunction = undefined;
  participantData = undefined;

  // Participant data
  participantName = "";
  displayParticipantName = true;

  participantImg = "";
  participantImgScale = 1;

  portraitAnchor = createPortraitAnchorObject();

  // Linked objects
  linkedJournal = "";
  linkedActor = "";

  // Faction data
  selectedFaction = "";
  displayFaction = false;
  factionName = "";
  factionLogo = "";
  factionBannerEnabled = false;
  factionBannerShape = "shape-1";
  factionBannerTint = "#000000";

  /**
   * @param {boolean} isEditing Boolean used to determine if the input form is for creating a participant or editing an existing one
   * @param {() => void} callbackFunction Callback function which is called when saving the form
   * @param {ParticipantData | undefined} participantData Participant
   */
  constructor(isEditing, callbackFunction, participantData) {
    super();

    this.isEditing = isEditing;
    this.callbackFunction = callbackFunction;
    this.participantData = participantData;

    if (participantData) {
      // Participant data
      this.participantName = participantData.name || "";
      this.displayParticipantName = participantData.displayName === undefined ? true : participantData.displayName;
      this.participantImg = participantData.img || "";
      this.participantImgScale = participantData.imgScale || 1;

      // Set portrait anchor only if the participant data has an anchor object
      // Otherwise, use the default options from the module settings
      if (participantData.portraitAnchor) {
        this.portraitAnchor = participantData.portraitAnchor;
      }

      // Linked objects
      this.linkedJournal = participantData.linkedJournal || "";
      this.linkedActor = participantData.linkedActor || "";

      // Faction data
      if (participantData.faction) {
        this.selectedFaction = participantData.faction.selectedFaction || "";
        this.displayFaction = participantData.faction.displayFaction || false;
        this.factionName = participantData.faction.factionName || "";
        this.factionLogo = participantData.faction.factionLogo || "";
        this.factionBannerEnabled = participantData.faction.factionBannerEnabled || false;
        this.factionBannerShape = participantData.faction.factionBannerShape || "shape-1";
        this.factionBannerTint = participantData.faction.factionBannerTint || "#000000";
      }
    }
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["form", "scene-sheet"],
      popOut: true,
      template: `modules/conversation-hud/templates/forms/add-or-edit-conversation-participant-form.hbs`,
      id: "conversation-add-participant",
      title: game.i18n.localize("CHUD.strings.participantData"),
      width: 640,
      height: "auto",
      tabs: [{ navSelector: ".tabs", contentSelector: "form", initial: "participant-config" }],
    });
  }

  activateListeners(html) {
    super.activateListeners(html);

    // Listeners in the participant form
    const participantNameInput = html.find("[name=participantName]")[0];
    participantNameInput.addEventListener("change", (event) => this.onUpdateParticipantName(event));

    const displayParticipantNameInput = html.find("[name=displayParticipantName]")[0];
    displayParticipantNameInput.addEventListener("change", (event) => this.onUpdateDisplayParticipantNameInput(event));

    const participantImgInput = html.find("[name=participantImg]")[0];
    participantImgInput.addEventListener("change", (event) => this.onUpdateParticipantImg(event));

    const participantImgScaleInput = html.find("[name=participantImgScale]")[0];
    participantImgScaleInput.addEventListener("change", (event) => this.onUpdateParticipantImgScale(event));

    const participantImgVerticalAnchorInput = html.find("[name=portraitAnchorVertical]")[0];
    participantImgVerticalAnchorInput.addEventListener("change", (event) =>
      this.onUpdateParticipantImgAnchor(event, "vertical")
    );

    const participantImgHorizontalAnchorInput = html.find("[name=portraitAnchorHorizontal]")[0];
    participantImgHorizontalAnchorInput.addEventListener("change", (event) =>
      this.onUpdateParticipantImgAnchor(event, "horizontal")
    );

    // Listeners in the faction form
    const selectedFaction = html.find("[name=selectedFaction]")[0];
    selectedFaction.addEventListener("change", (event) => this.onChangeSelectedFaction(event));

    const displayFactionToggle = html.find("[name=displayFaction]")[0];
    displayFactionToggle.addEventListener("change", (event) => this.onToggleFactionDisplay(event));

    const factionNameInput = html.find("[name=factionName]")[0];
    factionNameInput.addEventListener("change", (event) => this.onUpdateFactionName(event));

    const factionLogoInput = html.find("[name=factionImg]")[0];
    factionLogoInput.addEventListener("change", (event) => this.onUpdateFactionLogo(event));

    const factionBannerToggle = html.find("[name=displayFactionBanner]")[0];
    factionBannerToggle.addEventListener("change", (event) => this.onToggleFactionBanner(event));

    const factionBannerTintInput = html.find("[name=factionTint]")[0];
    factionBannerTintInput.addEventListener("change", (event) => this.onUpdateBannerTint(event));

    const factionBannerTintPicker = html.find("[name=factionTintPicker]")[0];
    factionBannerTintPicker.addEventListener("change", (event) => this.onUpdateBannerTint(event));

    // Faction dropzone
    const dragDropWrapper = html.find(".chud-drag-and-drop-container")[0];
    const dragDropZone = html.find(".chud-dropzone")[0];
    if (dragDropWrapper && dragDropZone) {
      dragDropWrapper.ondragenter = () => {
        if (!this.draggingParticipant) {
          this.dropzoneVisible = true;
          dragDropWrapper.classList.add("active-dropzone");
        }
      };

      dragDropZone.ondragleave = () => {
        if (this.dropzoneVisible) {
          this.dropzoneVisible = false;
          dragDropWrapper.classList.remove("active-dropzone");
        }
      };

      dragDropWrapper.ondrop = async (event) => {
        if (this.dropzoneVisible) {
          event.preventDefault();

          const data = TextEditor.getDragEventData(event);
          if (data.type === "JournalEntry") {
            const entry = await JournalEntry.implementation.fromDropData(data);
            const page = entry.getEmbeddedCollection("JournalEntryPage").contents[0];

            if (page.type === "text") {
              const data = JSON.parse(page.text.content);
              const faction = data.faction;
              if (faction) {
                this.selectedFaction = entry.id;
                this.render(false);
              } else {
                ui.notifications.warn(game.i18n.localize("CHUD.warnings.noFactionDataFound"));
              }
            }
          }

          this.dropzoneVisible = false;
          dragDropWrapper.classList.remove("active-dropzone");
        }
      };
    }

    // Activate banner shape buttons
    const bannerShapeButtons = html.find(".banner-shape-button");
    for (const button of bannerShapeButtons) {
      const buttonId = button.getAttribute("id");
      button.addEventListener("click", () => this.onUpdateBannerShape(buttonId));
    }

    // Faction save button
    const exportFaction = html.find("[name=exportFaction]")[0];
    if (exportFaction) {
      exportFaction.addEventListener("click", () => this.saveFaction());
    }
  }

  getData(options) {
    let journals = game.journal.map((journal) => {
      return { id: journal.id, name: journal.name, sheetClass: journal.flags?.core?.sheetClass };
    });
    journals = journals.filter(
      (journal) =>
        // TODO: Use proper sheet class from constants
        journal.sheetClass !== "conversation-sheet.ConversationSheet" &&
        journal.sheetClass !== "conversation-faction-sheet.ConversationFactionSheet"
    );
    journals.sort((a, b) => a.name.localeCompare(b.name));

    const actors = game.actors.map((actor) => {
      return { id: actor.id, name: actor.name };
    });
    actors.sort((a, b) => a.name.localeCompare(b.name));

    // Get a list of all the saved factions
    const savedFactions = game.journal.filter(
      // TODO: Use proper sheet class from constants
      (item) => item.flags.core?.sheetClass === "conversation-faction-sheet.ConversationFactionSheet"
    );

    let selectedFactionData = {
      displayFaction: this.displayFaction,
      factionName: this.factionName,
      factionLogo: this.factionLogo,
      factionBannerEnabled: this.factionBannerEnabled,
      factionBannerShape: this.factionBannerShape,
      factionBannerTint: this.factionBannerTint,
    };

    if (this.selectedFaction) {
      const factionData = getConversationDataFromJournalId(this.selectedFaction);
      selectedFactionData = factionData.faction;
      this.factionBannerShape = factionData.faction.factionBannerShape;
    }

    return {
      isEditing: this.isEditing,
      participantData: this.participantData,

      participantName: this.participantName,
      displayParticipantName: this.displayParticipantName,
      participantImg: this.participantImg,
      participantImgScale: this.participantImgScale,

      anchorOptions: ANCHOR_OPTIONS,
      portraitAnchor: this.portraitAnchor,

      selectedFaction: this.selectedFaction,

      displayFaction: this.displayFaction,
      factionName: selectedFactionData.factionName,
      factionLogo: selectedFactionData.factionLogo,
      factionBannerEnabled: selectedFactionData.factionBannerEnabled,
      factionBannerShape: selectedFactionData.factionBannerShape,
      factionBannerTint: selectedFactionData.factionBannerTint,

      linkedJournal: this.linkedJournal,
      linkedActor: this.linkedActor,

      savedFactions: savedFactions,

      actors: actors,
      journals: journals,
    };
  }

  async _updateObject(event, formData) {
    /** @type {ParticipantData} */
    const participantData = {
      name: formData.participantName,
      displayName: formData.displayParticipantName,
      img: formData.participantImg,
      imgScale: formData.participantImgScale,
      portraitAnchor: this.portraitAnchor,
      linkedJournal: formData.linkedJournal,
      linkedActor: formData.linkedActor,
      faction: {
        selectedFaction: formData.selectedFaction,
        displayFaction: formData.displayFaction,
        factionName: formData.factionName,
        factionLogo: formData.factionImg,
        factionBannerEnabled: formData.displayFactionBanner,
        factionBannerShape: this.factionBannerShape,
        factionBannerTint: formData.factionTint,
      },
    };

    this.callbackFunction(participantData);
  }

  onUpdateParticipantName(event) {
    if (!event.target) return;

    this.participantName = event.target.value;
  }

  onUpdateDisplayParticipantNameInput(event) {
    if (!event.target) return;

    this.displayParticipantName = event.target.checked;
  }

  onUpdateParticipantImg(event) {
    if (!event.target) return;

    this.participantImg = event.target.value;
  }

  onUpdateParticipantImgScale(event) {
    if (!event.target) return;

    this.participantImgScale = event.target.value;
  }

  onUpdateParticipantImgAnchor(event, type) {
    if (!event.target) return;

    this.portraitAnchor[type] = event.target.value;
  }

  onChangeSelectedFaction(event) {
    if (!event.target) return;

    this.selectedFaction = event.target.value;

    // If the new value is the 'Create New Faction' option, reset the form data
    if (event.target.value === "") {
      this.factionName = "";
      this.factionLogo = "";
      this.factionBannerEnabled = false;
      this.factionBannerShape = "shape-1";
      this.factionBannerTint = "#000000";
    }

    this.render(false);
  }

  onToggleFactionDisplay(event) {
    if (!event.target) return;

    this.displayFaction = event.target.checked;
  }

  onUpdateFactionName(event) {
    if (!event.target) return;

    this.factionName = event.target.value;
  }

  onToggleFactionBanner(event) {
    if (!event.target) return;

    this.factionBannerEnabled = event.target.checked;
    this.render(false);
  }

  onUpdateFactionLogo(event) {
    if (!event.target) return;

    this.factionLogo = event.target.value;
    this.render(false);
  }

  async onUpdateBannerShape(selectedShapeId) {
    this.factionBannerShape = selectedShapeId;
    this.render(false);
  }

  onUpdateBannerTint(event) {
    if (!event.target) return;

    this.factionBannerTint = event.target.value;
    this.render(false);
  }

  // Function that saves the active conversation to a journal entry
  async saveFaction() {
    // Create a prompt for saving the conversation, asking the users to introduce a name and to specify a folder
    const folders = game.folders.filter((f) => f.type === "JournalEntry" && f.displayed);
    const dialogContent = await renderTemplate("modules/conversation-hud/templates/form/save-form.hbs", {
      folders,
      name: game.i18n.format("DOCUMENT.New", { type: "Faction Sheet" }),
    });

    return Dialog.prompt({
      title: "Save Faction",
      content: dialogContent,
      label: "Save Faction",
      callback: (html) => {
        const formElement = html[0].querySelector("form");
        const formData = new FormDataExtended(formElement);
        const formDataObject = formData.object;
        this.#handleSaveFaction(formDataObject);
      },
      rejectClose: false,
    });
  }

  async #handleSaveFaction(data) {
    const permissions = {};
    game.users?.forEach((u) => (permissions[u.id] = game.user?.id === u.id ? 3 : 0));

    const newFactionSheet = await JournalEntry.create({
      name: data.name || "New Faction",
      folder: data.folder || "",
      flags: {
        core: {
          sheetClass: SHEET_CLASSES.factionSheetClass,
        },
      },
      ownership: permissions,
    });

    if (newFactionSheet) {
      const dataToSave = {
        faction: {
          displayFaction: false,
          factionName: this.factionName,
          factionLogo: this.factionLogo,
          factionBannerEnabled: this.factionBannerEnabled,
          factionBannerShape: this.factionBannerShape,
          factionBannerTint: this.factionBannerTint,
        },
      };
      await newFactionSheet.createEmbeddedDocuments("JournalEntryPage", [
        {
          text: { content: JSON.stringify(dataToSave) },
          name: "Faction Sheet",
          flags: {
            "conversation-hud": { type: "faction" },
          },
        },
      ]);
      ui.notifications.info(game.i18n.localize("CHUD.info.saveSuccessful"));
    } else {
      ui.notifications.error(game.i18n.localize("CHUD.errors.saveUnsuccessful"));
    }
  }
}
