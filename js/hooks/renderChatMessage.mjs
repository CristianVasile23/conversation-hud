/**
  [TODO: Add JSDoc]
**/
export const registerHook = () => {
  // Hook is needed to overwrite the avatar image of conversation messages created when using the 'Speaking As' feature
  Hooks.on("renderChatMessageHTML", (message, html, data) => {
    const img = foundry.utils.getProperty(message, "flags.chud.customPortrait");
    if (!img) return;

    // Wait one tick for the avatar to be rendered
    requestAnimationFrame(() => {
      const avatarImg = html.querySelector("a.avatar > img");
      if (avatarImg) {
        avatarImg.src = img;
      } else {
        // TODO: Improve console warning
        console.warn(`Avatar image not found in message ${message.id}`);
      }
    });
  });
};
