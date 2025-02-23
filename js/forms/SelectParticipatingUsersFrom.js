import { getConfirmationFromUser } from "../helpers/index.js";

export class SelectParticipatingUsersFrom extends FormApplication {
  // State variables
  #callbackFunction = undefined;
  #initialSelectedUsers = [];
  #selectedUsers = [];

  constructor(callbackFunction, data) {
    super();
    this.#callbackFunction = callbackFunction;
    this.#initialSelectedUsers = data.participatingUserIDs;
    this.#selectedUsers = data.participatingUserIDs;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["form"],
      popOut: true,
      template: "modules/conversation-hud/templates/forms/select-participating-users-form.hbs",
      id: "conversation-pull-participants",
      title: game.i18n.localize("CHUD.actions.selectParticipatingUsers"),
      width: 400,
      resizable: false,
    });
  }

  activateListeners(html) {
    super.activateListeners(html);

    const selectAllButton = html.find("#select-all")[0];
    selectAllButton.addEventListener("click", () => this.#onSelectAll());

    const deselectAllButton = html.find("#deselect-all")[0];
    deselectAllButton.addEventListener("click", () => this.#onDeselectAll());
  }

  getData() {
    const users = game.users;
    return {
      users: users.map((user) => {
        return {
          userData: user,
          isChecked: this.#selectedUsers.includes(user.id),
        };
      }),
    };
  }

  async _updateObject(event, formData) {
    const initialIDs = new Set(this.#initialSelectedUsers);
    const newIDs = new Set(formData.users.filter((user) => user));

    const addedIDs = newIDs.difference(initialIDs);
    const removedIDs = initialIDs.difference(newIDs);
    const unaffectedIDs = initialIDs.difference(removedIDs);

    const payload = {
      formData,
      addedUsers: Array.from(addedIDs),
      removedUsers: Array.from(removedIDs),
      unaffectedUsers: Array.from(unaffectedIDs),
    };

    // If there are participating users that have been removed, inform the user of this fact so that they do not
    // unknowingly remove a participating user that has associated data
    if (removedIDs.size !== 0) {
      const userHasConfirmed = await getConfirmationFromUser("CHUD.dialogue.onRemoveParticipatingUser");
      if (userHasConfirmed) {
        this.#callbackFunction(payload);
      }
    } else {
      this.#callbackFunction(payload);
    }
  }

  #onSelectAll() {
    const userIDs = game.users.map((user) => user.id);
    this.#selectedUsers = userIDs;
    this.render(false);
  }

  #onDeselectAll() {
    this.#selectedUsers = [];
    this.render(false);
  }
}
