import { ANCHOR_OPTIONS } from "./constants.js";
import { ParticipantInputForm } from "./formAddParticipant.js";
import {
  convertActorToParticipant,
  getConversationDataFromJournalId,
  getPortraitAnchorObjectFromParticipant,
  setDefaultDataForParticipant,
} from "./helpers.js";

export class PullParticipantsForm extends FormApplication {
  constructor(callbackFunction) {
    super();
    this.callbackFunction = callbackFunction;

    // Get all NPCs from current scene
    const tokens = game.scenes.current.tokens;

    // Filter through the tokens and keep only the ones that are not set to be excluded
    const filteredTokens = tokens.filter((token) => {
      const excludeFromBeingPulled = token["flags"]["conversation-hud"]?.excludeFromBeingPulled;
      if (excludeFromBeingPulled) {
        return false;
      }
      return true;
    });

    let participants = [];

    filteredTokens.forEach((token) => {
      const actor = token.actor;
      const linkedConversation = token["flags"]["conversation-hud"]?.linkedConversation;

      // Create a participant object that is used to display data inside the form
      const participant = {
        name: token.name,
        img: actor.img,
        id: token.id,
        actorId: token.actorId,
        checked: token.hidden ? false : true,
        hidden: token.hidden,
        type: undefined,
        data: undefined,
      };

      // Determine if the actor has a conversation linked or not
      // If not, create a conversation participant object which can be edited
      if (linkedConversation) {
        participant.type = "conversation";
        participant.data = linkedConversation;
      } else {
        participant.type = "participant";
        participant.data = convertActorToParticipant(actor);
        if (participant.hidden) {
          participant.data.displayName = false;
        }
      }

      participants.push(participant);
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
        switch (participant.type) {
          case "conversation":
            const data = getConversationDataFromJournalId(participant.data);
            let linkedParticipants = [];

            // Determine if the data parsed respects the old data format or the new data format
            if (data instanceof Array) {
              linkedParticipants = data;
            } else {
              linkedParticipants = data.participants;
            }

            linkedParticipants.forEach((item) => {
              if (!item.linkedActor) {
                item.linkedActor = participant.actorId;
              }
            });
            selectedParticipants.push(...linkedParticipants);
            break;
          case "participant":
            participant.data.linkedActor = participant.actorId;
            selectedParticipants.push(participant.data);
            break;
          default:
            console.error("ConversationHUD | Tried to pull participant from scene with unknown type of " + participant.type);
            break;
        }
      }
    }
    this.callbackFunction(selectedParticipants);
  }

  activateListeners(html) {
    super.activateListeners(html);

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

        const participantEditButton = pulledActors[i].querySelector("#participant-edit-button");
        if (participantEditButton) {
          participantEditButton.onclick = () => this.#handleEditParticipant(i);
        }

        const showLinkedConversationButton = pulledActors[i].querySelector("#show-linked-conversation-button");
        if (showLinkedConversationButton) {
          showLinkedConversationButton.onclick = () => this.#handleShowLinkedConversation(i);
        }
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

  #handleEditParticipant(index) {
    const participantInputForm = new ParticipantInputForm(true, (data) => this.#handleEditParticipantHelper(data, index), {
      ...this.participants[index].data,
      anchorOptions: ANCHOR_OPTIONS,
      portraitAnchor: getPortraitAnchorObjectFromParticipant(this.participants[index].data),
    });
    participantInputForm.render(true);
  }

  #handleEditParticipantHelper(data, index) {
    setDefaultDataForParticipant(data);
    this.participants[index].data = data;
    this.render(false);
  }

  #handleShowLinkedConversation(index) {
    const journalId = this.participants[index].data;
    game.ConversationHud.renderJournalSheet(journalId);
  }
}
