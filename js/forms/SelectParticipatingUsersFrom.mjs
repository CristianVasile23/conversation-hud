import { getConfirmationFromUser } from "../helpers/index.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class SelectParticipatingUsersFrom extends HandlebarsApplicationMixin(ApplicationV2) {
  /* -------------------------------------------- */
  /*  State                                       */
  /* -------------------------------------------- */

  callbackFunction = undefined;
  initialSelectedUsers = [];
  selectedUsers = [];

  constructor(callbackFunction, data) {
    super();
    this.callbackFunction = callbackFunction;
    this.initialSelectedUsers = data.participatingUserIDs;
    this.selectedUsers = data.participatingUserIDs;
  }

  /* -------------------------------------------- */
  /*  Rendering                                   */
  /* -------------------------------------------- */

  static DEFAULT_OPTIONS = {
    id: "chud-select-participating-users",
    classes: ["form"],
    tag: "form",
    window: {
      contentClasses: ["standard-form"],
      title: "CHUD.actions.selectParticipatingUsers",
    },
    form: {
      handler: this.#handleSubmit,
      closeOnSubmit: true,
    },
    position: {
      width: 400,
      height: "auto",
    },
  };

  static PARTS = {
    body: {
      template: "modules/conversation-hud/templates/forms/select-participating-users-form.hbs",
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
        label: "CHUD.actions.addUsers",
      },
    ];

    const users = game.users;
    return {
      users: users.map((user) => {
        return {
          userData: user,
          isChecked: this.selectedUsers.includes(user.id),
        };
      }),
      ...context,
    };
  }

  _onRender(context, options) {
    super._onRender(context, options);

    const html = this.element;

    const selectAllButton = html.querySelector("#select-all");
    selectAllButton.addEventListener("click", () => this.#onSelectAll());

    const deselectAllButton = html.querySelector("#deselect-all");
    deselectAllButton.addEventListener("click", () => this.#onDeselectAll());
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
    const data = foundry.utils.expandObject(formData.object);

    const initialIDs = new Set(this.initialSelectedUsers);
    const newIDs = new Set(data.users.filter((user) => user));

    const addedIDs = newIDs.difference(initialIDs);
    const removedIDs = initialIDs.difference(newIDs);
    const unaffectedIDs = initialIDs.difference(removedIDs);

    const payload = {
      data,
      addedUsers: Array.from(addedIDs),
      removedUsers: Array.from(removedIDs),
      unaffectedUsers: Array.from(unaffectedIDs),
    };

    // If there are participating users that have been removed, inform the user of this fact so that they do not
    // unknowingly remove a participating user that has associated data
    if (removedIDs.size !== 0) {
      const userHasConfirmed = await getConfirmationFromUser("CHUD.dialogue.onRemoveParticipatingUser");
      if (userHasConfirmed) {
        this.callbackFunction(payload);
      }
    } else {
      this.callbackFunction(payload);
    }
  }

  #onSelectAll() {
    const userIDs = game.users.map((user) => user.id);
    this.selectedUsers = userIDs;
    this.render(false);
  }

  #onDeselectAll() {
    this.selectedUsers = [];
    this.render(false);
  }
}
