export function registerNotEqHelper() {
  Handlebars.registerHelper("notEq", (value, test) => {
    if (value !== test) {
      return true;
    }

    return false;
  });
}
