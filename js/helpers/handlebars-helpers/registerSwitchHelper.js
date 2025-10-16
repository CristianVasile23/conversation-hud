export function registerSwitchHelper() {
  Handlebars.registerHelper("switch", function (value, options) {
    this.switch_value = value;
    this.switch_break = false;
    return options.fn(this);
  });

  Handlebars.registerHelper("case", function (value, options) {
    if (value == this.switch_value || (value == "default" && this.switch_break == false)) {
      this.switch_break = true;
      return options.fn(this);
    }
  });
}
