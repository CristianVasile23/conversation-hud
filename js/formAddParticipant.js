import { getConversationDataFromJournalId } from "./helpers.js";

export class FileInputForm extends FormApplication {
  constructor(isEditing, callbackFunction, participantData) {
    super();
    this.isEditing = isEditing;
    this.callbackFunction = callbackFunction;
    this.participantData = participantData;

    // Participant data
    this.participantName = participantData?.name || "";
    this.participantImg = participantData?.img || "";

    // Linked journal
    this.linkedJournal = participantData?.linkedJournal || "";

    // Faction data
    this.selectedFaction = participantData?.faction?.selectedFaction || "";
    this.displayFaction = participantData?.faction?.displayFaction || false;
    this.factionName = participantData?.faction?.factionName || "";
    this.factionLogo = participantData?.faction?.factionLogo || "";
    this.factionBannerEnabled = participantData?.faction?.factionBannerEnabled || false;
    this.factionBannerShape = participantData?.faction?.factionBannerShape || "shape-1";
    this.factionBannerTint = participantData?.faction?.factionBannerTint || "#000000";
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["form", "scene-sheet"],
      popOut: true,
      template: `modules/conversation-hud/templates/add_edit_participant.hbs`,
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

    const participantImgInput = html.find("[name=participantImg]")[0];
    participantImgInput.addEventListener("change", (event) => this.onUpdateParticipantImg(event));

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

    // Activate banner shape buttons
    const bannerShapeButtons = html.find(".banner-shape-button");
    for (const button of bannerShapeButtons) {
      const buttonId = button.getAttribute("id");
      button.addEventListener("click", () => this.onUpdateBannerShape(buttonId));
    }
  }

  getData(options) {
    const journals = game.journal.map((doc) => {
      return { id: doc.id, name: doc.name };
    });
    journals.sort((a, b) => a.name.localeCompare(b.name));

    // Get a list of all the saved factions
    const savedFactions = game.journal.filter(
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
      participantImg: this.participantImg,

      selectedFaction: this.selectedFaction,

      displayFaction: this.displayFaction,
      factionName: selectedFactionData.factionName,
      factionLogo: selectedFactionData.factionLogo,
      factionBannerEnabled: selectedFactionData.factionBannerEnabled,
      factionBannerShape: selectedFactionData.factionBannerShape,
      factionBannerTint: selectedFactionData.factionBannerTint,

      linkedJournal: this.linkedJournal,

      savedFactions: savedFactions,
      journals: journals,
    };
  }

  async _updateObject(event, formData) {
    const participantData = {
      name: formData.participantName,
      img: formData.participantImg,
      linkedJournal: formData.linkedJournal,
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

  onUpdateParticipantImg(event) {
    if (!event.target) return;

    this.participantImg = event.target.value;
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
}
