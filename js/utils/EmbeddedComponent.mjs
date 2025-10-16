export class EmbeddedComponent {
  constructor({ id, template, target }) {
    this.id = id;
    this.template = template;
    this.target = target;
    this.context = {};
  }

  /**
   * Render the template with current context into the target container
   */
  async render() {
    const container = document.querySelector(this.target);
    if (!container) {
      // TODO: Improve warning
      console.warn(`EmbeddedComponent | Target not found: ${this.target}`);
      return;
    }

    const html = await foundry.applications.handlebars.renderTemplate(this.template, this.context);
    container.innerHTML = html;

    this.activateListeners(container);
  }

  /**
   * Merge new context and immediately render
   *
   * @param {Object} newContext
   */
  async update(newContext = {}) {
    Object.assign(this.context, newContext);
    await this.render();
  }

  /**
   * Hook for child classes to attach DOM events
   *
   * @param {HTMLElement} _html
   */
  activateListeners(_html) {}

  /**
   * Remove the content from the container
   */
  close() {
    const container = document.querySelector(this.target);
    if (container) container.innerHTML = "";
  }
}
