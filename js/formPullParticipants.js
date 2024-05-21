import { EMPTY_FACTION } from "./constants.js";

export class PullParticipantsForm extends FormApplication {
  constructor(callbackFunction) {
    super();
    this.callbackFunction = callbackFunction;

    // Get all NPCs from current scene
    const tokens = game.scenes.current.tokens;
    const participants = tokens.map((token) => {
      const actor = token.actor;
      const participant = {
        name: token.name,
        img: actor.img,
        id: token.id,
        checked: token.hidden ? false : true,
        hidden: token.hidden,
      };
      return participant;
    });

    this.participants = participants;
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["form"],
      popOut: true,
      template: `modules/conversation-hud/templates/pull_participants.hbs`,
      id: "conversation-pull-participants",
      title: game.i18n.localize("CHUD.actions.pullParticipants"),
      width: 450,
      height: 650,
      resizable: false,
    });
  }

  getData() {
    return {
      participants: this.participants,
    };
  }

  async _updateObject(event, formData) {
    const selectedParticipants = [];
    for (const participant of this.participants) {
      if (participant.checked) {
        const parsedParticipant = {
          faction: EMPTY_FACTION,
          img: participant.img,
          linkedJournal: "",
          name: participant.name,
        };
        selectedParticipants.push(parsedParticipant);
      }
    }
    this.callbackFunction(selectedParticipants);
  }

  activateListeners(html) {
    html.find("#deselect-all").click(() => {
      this.#setCheckedStatusForAllActors(false);
    });

    html.find("#select-visible").click(() => {
      this.#handleSelectOnlyVisibleActors();
    });

    html.find("#select-all").click(() => {
      this.#setCheckedStatusForAllActors(true);
    });

    const actorsObject = html.find("#participants-pulled-from-scene")[0];
    if (actorsObject) {
      const pulledActors = actorsObject.children;
      for (let i = 0; i < pulledActors.length; i++) {
        pulledActors[i].querySelector("#pull-participant-checkbox").onchange = (event) => this.#handleSetIncludeActorCheckbox(event, i);
      }
    }
  }

  #setCheckedStatusForAllActors(value) {
    for (let i = 0; i < this.participants.length; i++) {
      this.participants[i].checked = value;
    }
    this.render(false);
  }

  #handleSelectOnlyVisibleActors() {
    for (let i = 0; i < this.participants.length; i++) {
      if (this.participants[i].hidden) {
        this.participants[i].checked = false;
      } else {
        this.participants[i].checked = true;
      }
    }
    this.render(false);
  }

  #handleSetIncludeActorCheckbox(event, index) {
    this.participants[index].checked = event.target.checked;
  }
}
