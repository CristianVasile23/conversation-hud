/**
 * [TODO: Add JSDoc]
 */
// TODO: Pass an object instead of multiple params
export function getConfirmationFromUser(
  localizationString,
  onConfirm = () => {},
  onReject = () => {},
  confirmIcon = '<i class="fas fa-check"></i>',
  rejectIcon = '<i class="fas fa-times"></i>'
) {
  const titleText = game.i18n.localize(`${localizationString}.title`);
  const contentText = game.i18n.localize(`${localizationString}.content`);
  const confirmText = game.i18n.localize(`${localizationString}.confirm`);
  const rejectText = game.i18n.localize(`${localizationString}.reject`);

  return foundry.applications.api.DialogV2.confirm({
    content: `<div style="margin-bottom: 8px;">${game.i18n.localize(contentText)}</div>`,
    window: { title: titleText },
    yes: {
      icon: confirmIcon,
      label: confirmText,
      default: true,
      callback: () => {
        onConfirm();
      },
    },
    no: {
      icon: rejectIcon,
      label: rejectText,
      callback: () => {
        onReject();
      },
    },
  });
}
