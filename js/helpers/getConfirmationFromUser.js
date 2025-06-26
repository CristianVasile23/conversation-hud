/**
 * [TODO: Add JSDoc]
 */
export function getConfirmationFromUser(
  localizationString,
  confirmIcon = '<i class="fas fa-check"></i>',
  rejectIcon = '<i class="fas fa-times"></i>'
) {
  const titleText = game.i18n.localize(`${localizationString}.title`);
  const contentText = game.i18n.localize(`${localizationString}.content`);
  const confirmText = game.i18n.localize(`${localizationString}.confirm`);
  const rejectText = game.i18n.localize(`${localizationString}.reject`);

  return new Promise((resolve) => {
    let resolved = false;

    foundry.applications.api.DialogV2.confirm({
      content: `<div style="margin-bottom: 8px;">${contentText}</div>`,
      window: { title: titleText },
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
