import { CreateOrEditParticipantForm } from "./CreateOrEditParticipantForm.mjs";
import {
  convertActorToParticipant,
  getConversationDataFromJournalId,
  processParticipantData,
} from "../helpers/index.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class OwnedActorsSelectionForm extends HandlebarsApplicationMixin(ApplicationV2) {
  callbackFunction = undefined;
  participants = [];

  constructor(callbackFunction) {
    super();
    this.callbackFunction = callbackFunction;

    const ownedActors = game.actors.filter((actor) => actor.isOwner);
    // TODO: Populate this.participants from ownedActors
  }

  static DEFAULT_OPTIONS = {
    id: "conversation-pull-participants",
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
      scrollable: [".scrollable"],
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

  static async #handleSubmit(event, form, formData) {
    const selectedParticipants = [];
    for (const participant of this.participants) {
      if (participant.checked) {
        switch (participant.type) {
          case "conversation": {
            const data = getConversationDataFromJournalId(participant.data);
            let linkedParticipants = [];

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
          }
          case "participant":
            participant.data.linkedActor = participant.actorId;
            selectedParticipants.push(participant.data);
            break;
          default:
            console.error("ConversationHUD | Unknown participant type: " + participant.type);
            break;
        }
      }
    }
    this.callbackFunction(selectedParticipants);
  }
}
