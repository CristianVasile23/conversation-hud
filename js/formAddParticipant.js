export class FileInputForm extends FormApplication {
  constructor(isEditing, callbackFunction, participantData) {
    super();
    this.isEditing = isEditing;
    this.callbackFunction = callbackFunction;
    this.participantData = participantData;

    // Participant data
    this.participantName = participantData?.name || "";
    this.participantImg = participantData?.img || "";

    // Faction data
    this.displayFaction = participantData?.faction?.displayFaction || false;
    this.factionName = participantData?.faction?.factionName || "";
    this.factionLogo = participantData?.faction?.factionLogo || "";
    this.factionBannerEnabled = participantData?.faction?.factionBannerEnabled || false;
    this.factionBannerShape = participantData?.faction?.factionBannerShape || "shape-1";
    this.factionBannerTint = participantData?.faction?.factionBannerTint || "#000000";
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["form"],
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
    return {
      isEditing: this.isEditing,
      participantData: this.participantData,

      participantName: this.participantName,
      participantImg: this.participantImg,

      displayFaction: this.displayFaction,
      factionName: this.factionName,
      factionLogo: this.factionLogo,
      factionBannerEnabled: this.factionBannerEnabled,
      factionBannerShape: this.factionBannerShape,
      factionBannerTint: this.factionBannerTint,
    };
  }

  async _updateObject(event, formData) {
    const participantData = {
      name: formData.participantName,
      img: formData.participantImg,
      faction: {
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
