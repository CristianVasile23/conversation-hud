export function registerHandlebarHelpers() {
  registerLinkedObjectsHelper();
  registerPortraitParamsObjectHelper();
  registerParticipantPortraitHelper();
}

function registerLinkedObjectsHelper() {
  Handlebars.registerHelper("renderParticipantLinkedObjects", (journalId, actorId) => {
    let html = `<p class="linked-journal">`;

    if (!journalId && !actorId) {
      html += `${game.i18n.localize("CHUD.strings.noLinkedDocuments")}`;
    } else {
      if (journalId) {
        const journal = game.journal.get(journalId);
        if (journal) {
          html += `
            <a onclick="game.ConversationHud.renderJournalSheet('${journalId}')" title="${journal.name}">
              <i class="fas fa-book"></i>
            </a>
          `;
        } else {
          html += `
            <i class="fas fa-book" title="${game.i18n.localize("CHUD.strings.invalidDocumentRef")}"></i>
          `;
        }
      }
      if (actorId) {
        const actor = game.actors.get(actorId);
        if (actor) {
          html += `
            <a onclick="game.ConversationHud.renderActorSheet('${actorId}')" title="${actor.name}">
              <i class="fas fa-user"></i>
            </a>
          `;
        } else {
          html += `${game.i18n.localize("CHUD.strings.invalidDocumentRef")}`;
        }
      }
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
