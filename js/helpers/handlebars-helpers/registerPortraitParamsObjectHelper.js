/**
 * [TODO: Add JSDoc]
 */
export function registerPortraitParamsObjectHelper() {
  Handlebars.registerHelper("portraitParamsObject", function ({ hash }) {
    const parsedObject = {};

    for (const [key, value] of Object.entries(hash)) {
      if (typeof value === "object") {
        if (value.string) {
          parsedObject[key] = value.string;
        } else {
          parsedObject[key] = value;
        }
      } else {
        parsedObject[key] = value;
      }
    }

    return parsedObject;
  });
}
