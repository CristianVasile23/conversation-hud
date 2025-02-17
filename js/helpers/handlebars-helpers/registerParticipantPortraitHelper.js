/**
 * [TODO: Add JSDoc]
 */
export function registerParticipantPortraitHelper() {
  const videoFormats = ["mpg", "mp2", "mpeg", "mpe", "mpv", "mp4"];

  Handlebars.registerHelper("renderParticipantPortrait", (portraitPath, additionalParams) => {
    console.log(portraitPath);

    const isVideo = videoFormats.includes(portraitPath.split(".")[1]);
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
