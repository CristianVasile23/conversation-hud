/**
 * [TODO: Add JSDoc]
 */
export function getConfirmationFromUser(
  localizationString,
  onConfirm,
  onReject = () => {},
  confirmIcon = '<i class="fas fa-check"></i>',
  rejectIcon = '<i class="fas fa-times"></i>'
) {
  const dialogPromise = new Promise((resolve, reject) => {
    const titleText = game.i18n.localize(`${localizationString}.title`);
    const contentText = game.i18n.localize(`${localizationString}.content`);
    const confirmText = game.i18n.localize(`${localizationString}.confirm`);
    const rejectText = game.i18n.localize(`${localizationString}.reject`);

    new Dialog({
      title: titleText,
      content: `<div style="margin-bottom: 8px;">${game.i18n.localize(contentText)}</div>`,
      buttons: {
        confirm: {
          icon: confirmIcon,
          label: confirmText,
          callback: () => {
            onConfirm();
            resolve(true);
          },
        },
        reject: {
          icon: rejectIcon,
          label: rejectText,
          callback: () => {
            onReject();
            resolve(false);
          },
        },
      },
      default: "confirm",
    }).render(true);
  });

  return dialogPromise;
}
