/**
 * [TODO: Add JSDoc]
 */
export function getConfirmationFromUser(
  localizationString,
  confirmIcon = "fa-solid fa-check",
  rejectIcon = "fa-solid fa-xmark"
) {
  const titleText = game.i18n.localize(`${localizationString}.title`);
  const contentText = game.i18n.localize(`${localizationString}.content`);
  const confirmText = game.i18n.localize(`${localizationString}.confirm`);
  const rejectText = game.i18n.localize(`${localizationString}.reject`);

  return new Promise((resolve) => {
    let resolved = false;

    foundry.applications.api.DialogV2.confirm({
      content: `<p>${contentText}</p>`,
      window: {
        title: titleText,
      },
      position: {
        width: 450,
      },
      yes: {
        icon: confirmIcon,
        label: confirmText,
        default: true,
        callback: () => {
          resolved = true;
          resolve(true);
        },
      },
      no: {
        icon: rejectIcon,
        label: rejectText,
        callback: () => {
          resolved = true;
          resolve(false);
        },
      },
      close: () => {
        if (!resolved) {
          resolve(null);
        }
      },
    });
  });
}
