import { CreateOrEditParticipantForm } from "./CreateOrEditParticipantForm.mjs";
import {
  convertActorToParticipant,
  getConversationDataFromJournalId,
  processParticipantData,
} from "../helpers/index.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class PullParticipantsFromSceneForm extends HandlebarsApplicationMixin(ApplicationV2) {
  /* -------------------------------------------- */
  /*  State                                       */
  /* -------------------------------------------- */

  callbackFunction = undefined;
  participants = [];

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

  /* -------------------------------------------- */
  /*  Rendering                                   */
  /* -------------------------------------------- */

  static DEFAULT_OPTIONS = {
    id: "conversation-pull-participants-{id}",
    classes: ["form"],
    tag: "form",
    window: {
      contentClasses: ["standard-form"],
      title: "CHUD.actions.pullParticipants",
    },
    form: {
      handler: this.#handleSubmit,
      closeOnSubmit: true,
    },
    position: {
      width: 450,
      height: 650,
    },
  };

  static PARTS = {
    body: {
      template: "modules/conversation-hud/templates/forms/pull-scene-participants-form.hbs",
      scrollable: ["#sceneParticipantsList"],
    },
    footer: {
      template: "templates/generic/form-footer.hbs",
    },
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.buttons = [
      {
        type: "submit",
        icon: "fa-solid fa-plus",
        label: "CHUD.actions.addActors",
      },
    ];

    return {
      participants: this.participants,
      ...context,
    };
  }

  _onRender(context, options) {
    super._onRender(context, options);

    const html = this.element;

    html.querySelector("#deselect-all").addEventListener("click", () => {
      this.#setCheckedStatusForAllActors(false);
    });

    html.querySelector("#select-visible").addEventListener("click", () => {
      this.#handleSelectOnlyVisibleActors();
    });

    html.querySelector("#select-all").addEventListener("click", () => {
      this.#setCheckedStatusForAllActors(true);
    });

    const actorsObject = html.querySelector("#participants-pulled-from-scene");
    if (actorsObject) {
      const pulledActors = actorsObject.children;
      for (let i = 0; i < pulledActors.length; i++) {
        pulledActors[i]
          .querySelector("#pull-participant-checkbox")
          .addEventListener("change", (event) => this.#handleSetIncludeActorCheckbox(event, i));

        const participantEditButton = pulledActors[i].querySelector("#participant-edit-button");
        if (participantEditButton) {
          participantEditButton.addEventListener("click", () => this.#handleEditParticipant(i));
        }

        const showLinkedConversationButton = pulledActors[i].querySelector("#show-linked-conversation-button");
        if (showLinkedConversationButton) {
          showLinkedConversationButton.addEventListener("click", () => this.#handleShowLinkedConversation(i));
        }
      }
    }
  }

  /* -------------------------------------------- */
  /*  Handlers                                    */
  /* -------------------------------------------- */

  /**
   *
   * @param {*} event
   * @param {*} form
   * @param {*} formData
   */
  static async #handleSubmit(event, form, formData) {
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
            // TODO: Create a better logging message that uses a non-hardcoded module name
            console.error(
              "ConversationHUD | Tried to pull participant from scene with unknown type of " + participant.type
            );
            break;
        }
      }
    }
    this.callbackFunction(selectedParticipants);
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
    const participantEditForm = new CreateOrEditParticipantForm(
      true,
      (data) => this.#handleEditParticipantHelper(data, index),
      this.participants[index].data
    );
    participantEditForm.render(true);
  }

  #handleEditParticipantHelper(data, index) {
    processParticipantData(data);
    this.participants[index].data = data;
    this.render(false);
  }

  #handleShowLinkedConversation(index) {
    const journalId = this.participants[index].data;
    game.ConversationHud.renderJournalSheet(journalId);
  }
}
