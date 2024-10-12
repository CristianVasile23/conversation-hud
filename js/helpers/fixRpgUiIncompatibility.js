/**
  [TODO: Add JSDoc]
**/
export function fixRpgUiIncompatibility() {
  let cssFix = document.createElement("link");
  cssFix.rel = "stylesheet";
  cssFix.type = "text/css";
  cssFix.href = "modules/conversation-hud/css/rpg-ui-compatibility.css";
  document.getElementsByTagName("head")[0].appendChild(cssFix);
}
