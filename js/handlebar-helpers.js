export function registerHandlebarHelpers() {
  registerLinkedJournalHelper();
  registerPortraitParamsObjectHelper();
  registerParticipantPortraitHelper();
}

function registerLinkedJournalHelper() {
  Handlebars.registerHelper("renderParticipantLinkedJournal", (journalId) => {
    let html = `<p class="linked-journal">`;

    if (journalId) {
      const document = game.journal.get(journalId);
      html += `${game.i18n.localize("CHUD.strings.linkedJournal")}: `;
      if (document) {
        html += `<a onclick="game.ConversationHud.renderJournalSheet('${journalId}')">${document.name}</a>`;
      } else {
        html += `${game.i18n.localize("CHUD.strings.invalidDocumentRef")}`;
      }
    } else {
      html += `${game.i18n.localize("CHUD.strings.noLinkedJournal")}`;
    }

    html += `</p>`;
    return html;
  });
}

function registerPortraitParamsObjectHelper() {
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

function registerParticipantPortraitHelper() {
  const videoFormats = ["mpg", "mp2", "mpeg", "mpe", "mpv", "mp4"];

  Handlebars.registerHelper("renderParticipantPortrait", (portraitPath, additionalParams) => {
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
