/**
 * [TODO: Add JSDoc]
 */
export function registerParticipantPortraitHelper() {
  const videoFormats = ["mpg", "mp2", "mpeg", "mpe", "mpv", "mp4"];

  Handlebars.registerHelper("renderParticipantPortrait", (portraitPath, additionalParams) => {
    const isVideo = portraitPath ? videoFormats.includes(portraitPath.split(".")[1]) : false;
    let html;

    if (isVideo) {
      html = `<video src="${portraitPath}" autoplay loop muted `;
    } else {
      html = `<img src="${portraitPath}" `;
    }

    if (additionalParams) {
      for (const [key, value] of Object.entries(additionalParams)) {
        html += `${key}="${value}"`;
      }
    }

    html += ">";

    if (isVideo) {
      html += `</video>`;
    } else {
      html += `</img>`;
    }

    return html;
  });
}
