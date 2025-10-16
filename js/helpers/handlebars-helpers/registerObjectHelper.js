export function registerObjectHelper() {
  Handlebars.registerHelper("object", ({ hash }) => {
    return hash;
  });
}
