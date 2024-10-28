export function registerJsonHelper() {
  Handlebars.registerHelper("json", (context) => {
    return JSON.stringify(context);
  });
}
