/**
  [TODO: Add JSDoc]
**/
export const registerHook = () => {
  let observer;

  const mirroredClasses = ["offset", "lg", "md", "sm", "min"];

  const syncOffsetAndClasses = () => {
    const hotbar = document.getElementById("hotbar");
    const custom = document.getElementById("ui-conversation-controls");
    const conversationHud = document.getElementById("ui-conversation-hud");

    if (!hotbar) return;

    const offset = hotbar.style.getPropertyValue("--offset");
    if (offset && offset.trim() !== "") {
      custom && custom.style.setProperty("--offset", offset);
      conversationHud && conversationHud.style.setProperty("--offset", offset);
    } else {
      custom && custom.style.removeProperty("--offset");
      conversationHud && conversationHud.style.removeProperty("--offset", offset);
    }

    for (const cls of mirroredClasses) {
      if (hotbar.classList.contains(cls)) {
        custom && custom.classList.add(cls);
        conversationHud && conversationHud.classList.add(cls);
      } else {
        custom && custom.classList.remove(cls);
        conversationHud && conversationHud.classList.remove(cls);
      }
    }
  };

  const ensureConversationContainerExists = () => {
    if (!document.getElementById("ui-conversation-hud")) {
      const container = document.createElement("section");
      container.id = "ui-conversation-hud";
      container.className = "chud-active-conversation-wrapper";

      const uiMiddle = document.getElementById("ui-middle");
      if (uiMiddle) {
        uiMiddle.append(container);
      }
    }
  };

  const ensureControlsContainerExists = () => {
    if (!document.getElementById("ui-conversation-controls")) {
      const container = document.createElement("section");
      container.id = "ui-conversation-controls";
      container.classList.add("chud-controls", "faded-ui");
      container.setAttribute("data-tooltip-direction", "UP");

      const uiBottom = document.getElementById("ui-bottom");
      if (uiBottom) {
        uiBottom.insertBefore(container, uiBottom.firstChild);
      }
    }
  };

  Hooks.on("canvasReady", () => {
    ensureConversationContainerExists();
    ensureControlsContainerExists();

    const hotbar = document.getElementById("hotbar");

    observer = new MutationObserver(syncOffsetAndClasses);
    observer.observe(hotbar, { attributes: true, attributeFilter: ["style", "class"] });

    syncOffsetAndClasses();
  });

  Hooks.on("canvasUnload", () => {
    if (observer) observer.disconnect();
  });
};
