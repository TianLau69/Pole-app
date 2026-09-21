/* =========================================================
   PLAYLISTS — Programme Pole
   ========================================================= */

const PLAYLISTS_KEY = "pole_playlists";
const CUSTOM_EXERCISES_KEY = "pole_custom_exercises";
const FIGURES_KEY = "pole_figures";

let currentType = "exercise";
let editingId = null;

let launchPlaylistData = null;
let launchIndex = 0;

let timer = null;
let remaining = 0;
let total = 0;


/* =========================================================
   OUTILS LOCALSTORAGE
   ========================================================= */

function readJSON(key, fallback = []) {
  try {
    const value = localStorage.getItem(key);

    if (!value) {
      return fallback;
    }

    const parsed = JSON.parse(value);

    return parsed ?? fallback;

  } catch (error) {

    console.error("Erreur localStorage :", key, error);

    return fallback;
  }
}


function writeJSON(key, value) {

  localStorage.setItem(
    key,
    JSON.stringify(value)
  );

}


/* =========================================================
   DONNÉES
   ========================================================= */

function getPlaylists() {

  return readJSON(
    PLAYLISTS_KEY,
    []
  );

}


function getCustomExercises() {

  return readJSON(
    CUSTOM_EXERCISES_KEY,
    []
  );

}


function getFigures() {

  return readJSON(
    FIGURES_KEY,
    []
  );

}


/* =========================================================
   EXERCICES PAR DÉFAUT
   ========================================================= */

function getProgramsData() {

  if (
    typeof PROGRAMS !== "undefined" &&
    Array.isArray(PROGRAMS)
  ) {
    return PROGRAMS;
  }

  if (
    typeof programs !== "undefined" &&
    Array.isArray(programs)
  ) {
    return programs;
  }

  return [];
}


function defaultExercises() {

  const programs = getProgramsData();

  if (!programs.length) {
    return [];
  }

  const result = [];

  programs.forEach(program => {

    if (!program || !Array.isArray(program.sections)) {
      return;
    }

    program.sections.forEach(section => {

      if (
        !Array.isArray(section) ||
        !Array.isArray(section[1])
      ) {
        return;
      }

      const sectionName = section[0];

      section[1].forEach((exercise, index) => {

        if (!Array.isArray(exercise)) {
          return;
        }

        const name = exercise[0] || "Exercice";

        const duration =
          exercise[1] ||
          "1 min";

        const kind =
          exercise[2] ||
          "stretch";

        const description =
          exercise[3] ||
          "";

        let seconds =
          Number(exercise[4]);

        if (!Number.isFinite(seconds) || seconds <= 0) {

          seconds =
            parseDuration(duration);

        }

        /*
          Numéro global de l'exercice.

          Les images par défaut sont dans :

          assets/exercises/01.jpg
          assets/exercises/02.jpg
          ...
          assets/exercises/38.jpg

          playlists.html se trouve dans :

          pole-playlists/

          Donc il faut remonter d'un niveau :
          ../assets/exercises/
        */

        result.push({

          id:
            "default-" +
            result.length,

          type:
            "exercise",

          name,

          duration,

          seconds,

          kind,

          description,

          section:
            sectionName,

          program:
            program.id ||
            program.name ||
            "",

          image:
            "../assets/exercises/" +
            String(result.length + 1)
              .padStart(2, "0") +
            ".jpg",

          default:
            true

        });

      });

    });

  });

  return result;
}


/* =========================================================
   CONVERSION DURÉE
   ========================================================= */

function parseDuration(value) {

  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  const text =
    String(value || "")
      .toLowerCase()
      .trim();

  /*
    Exemple :
    "2 min"
  */

  const minutes =
    text.match(
      /(\d+(?:[.,]\d+)?)\s*(?:min|minute|minutes)/
    );

  if (minutes) {

    return Math.round(
      parseFloat(
        minutes[1].replace(",", ".")
      ) * 60
    );

  }


  /*
    Exemple :
    "60 sec"
  */

  const seconds =
    text.match(
      /(\d+)\s*(?:s|sec|seconde|secondes)/
    );

  if (seconds) {

    return Number(seconds[1]);

  }


  /*
    Exemple :
    "01:30"
  */

  const clock =
    text.match(
      /^(\d+):(\d{1,2})$/
    );

  if (clock) {

    return (
      Number(clock[1]) * 60 +
      Number(clock[2])
    );

  }


  /*
    Si aucun format n'est reconnu,
    on donne 60 secondes.
  */

  return 60;
}


/* =========================================================
   LISTE DES EXERCICES
   ========================================================= */

function allExercises() {

  const defaults =
    defaultExercises();

  const custom =
    getCustomExercises();

  return [
    ...defaults,
    ...custom.map((exercise, index) => ({

      ...exercise,

      id:
        exercise.id ||
        "custom-" + index,

      type:
        "exercise",

      default:
        false,

      seconds:
        Number(exercise.seconds) ||
        Number(exercise.duration) ||
        parseDuration(exercise.duration)

    }))

  ];
}


/* =========================================================
   LISTE DES FIGURES
   ========================================================= */

function allFigures() {

  return getFigures().map((figure, index) => ({

    ...figure,

    id:
      figure.id ||
      "figure-" + index,

    type:
      "figure",

    default:
      false

  }));

}


/* =========================================================
   ÉLÉMENTS DISPONIBLES
   ========================================================= */

function getItems(type) {

  if (type === "figure") {
    return allFigures();
  }

  return allExercises();

}


/* =========================================================
   IMAGE
   ========================================================= */

function getImage(item) {

  if (!item) {
    return "";
  }

  /*
    Les photos personnalisées sont stockées
    directement en base64 dans localStorage.
  */

  if (item.image) {
    return item.image;
  }

  return "";
}


/* =========================================================
   NOM AFFICHÉ
   ========================================================= */

function itemName(item) {

  if (!item) {
    return "";
  }

  return (
    item.name ||
    item.title ||
    "Sans nom"
  );

}


/* =========================================================
   DESCRIPTION
   ========================================================= */

function itemDescription(item) {

  if (!item) {
    return "";
  }

  return (
    item.description ||
    item.instructions ||
    item.note ||
    ""
  );

}


/* =========================================================
   CHANGEMENT EXERCICES / FIGURES
   ========================================================= */

function setType(type) {

  currentType = type;

  const tabEx =
    document.getElementById("tabEx");

  const tabFig =
    document.getElementById("tabFig");


  if (tabEx) {

    tabEx.classList.toggle(
      "active",
      type === "exercise"
    );

  }


  if (tabFig) {

    tabFig.classList.toggle(
      "active",
      type === "figure"
    );

  }


  renderPicker();

  renderEditPicker();

}


/* =========================================================
   RENDU DU SÉLECTEUR
   ========================================================= */

function renderPicker() {

  const container =
    document.getElementById("picker");

  if (!container) {
    return;
  }

  const items =
    getItems(currentType);


  if (!items.length) {

    container.innerHTML = `
      <div class="empty">
        Aucun élément disponible.
      </div>
    `;

    return;
  }


  container.innerHTML =
    items.map(item => {

      const image =
        getImage(item);

      const imageHTML =
        image

          ? `
            <img
              src="${escapeAttribute(image)}"
              alt="">
          `

          : `
            <div>
              Photo à ajouter
            </div>
          `;


      const meta =
        currentType === "exercise"

          ? (
              item.duration ||
              formatSeconds(
                item.seconds || 60
              )
            )

          : (
              item.level ||
              ""
            );


      return `

        <label
          class="pick"
          data-item-id="${escapeAttribute(item.id)}">

          <input
            type="checkbox"
            value="${escapeAttribute(item.id)}">

          <div class="thumb">
            ${imageHTML}
          </div>

          <div>

            <div class="name">
              ${escapeHTML(itemName(item))}
            </div>

            <div class="meta">
              ${escapeHTML(meta)}
            </div>

          </div>

        </label>

      `;

    }).join("");

}


/* =========================================================
   CRÉATION PLAYLIST
   ========================================================= */

function createPlaylist() {

  const nameInput =
    document.getElementById("name");

  const descriptionInput =
    document.getElementById("description");


  const name =
    nameInput
      ? nameInput.value.trim()
      : "";


  const description =
    descriptionInput
      ? descriptionInput.value.trim()
      : "";


  if (!name) {

    alert(
      "Donne un nom à ta playlist."
    );

    return;
  }


  const selected =
    Array.from(
      document.querySelectorAll(
        "#picker input[type='checkbox']:checked"
      )
    ).map(
      checkbox => checkbox.value
    );


  if (!selected.length) {

    alert(
      "Sélectionne au moins un élément."
    );

    return;
  }


  const playlists =
    getPlaylists();


  playlists.push({

    id:
      "playlist-" +
      Date.now() +
      "-" +
      Math.random()
        .toString(36)
        .slice(2, 8),

    type:
      currentType,

    name,

    description,

    items:
      selected,

    createdAt:
      Date.now(),

    updatedAt:
      Date.now()

  });


  writeJSON(
    PLAYLISTS_KEY,
    playlists
  );


  if (nameInput) {
    nameInput.value = "";
  }

  if (descriptionInput) {
    descriptionInput.value = "";
  }


  renderPicker();

  renderPlaylists();

}


/* =========================================================
   RENDU DES PLAYLISTS
   ========================================================= */

function renderPlaylists() {

  const container =
    document.getElementById("playlists");

  if (!container) {
    return;
  }


  const playlists =
    getPlaylists()
      .filter(
        playlist =>
          playlist.type === currentType
      );


  if (!playlists.length) {

    container.innerHTML = `
      <div class="empty">
        Aucune playlist pour le moment.
      </div>
    `;

    return;
  }


  container.innerHTML =
    playlists.map(
      playlist =>
        renderPlaylistCard(playlist)
    ).join("");

}


/* =========================================================
   CARTE PLAYLIST
   ========================================================= */

function renderPlaylistCard(playlist) {

  const items =
    resolvePlaylistItems(
      playlist
    );


  const itemsHTML =
    items.length

      ? items.map(
          (item, index) => `

            <div class="item">

              <div>
                ${index + 1}
              </div>

              <div>

                <div class="name">
                  ${escapeHTML(
                    itemName(item)
                  )}
                </div>

                <div class="meta">

                  ${
                    currentType === "exercise"

                      ? escapeHTML(
                          item.duration ||
                          formatSeconds(
                            item.seconds || 60
                          )
                        )

                      : escapeHTML(
                          item.level || ""
                        )

                  }

                </div>

              </div>

            </div>

          `
        ).join("")

      : `
          <div class="empty">
            Aucun élément disponible.
          </div>
        `;


  return `

    <article class="playlist">

      <h3>
        ${escapeHTML(
          playlist.name
        )}
      </h3>

      ${
        playlist.description

          ? `
            <div class="sub">
              ${escapeHTML(
                playlist.description
              )}
            </div>
          `

          : ""
      }


      <div class="meta">
        ${items.length}
        élément${items.length > 1 ? "s" : ""}
      </div>


      <div class="list">
        ${itemsHTML}
      </div>


      <div class="actions">

        <button
          class="small"
          onclick="launchPlaylist('${escapeAttribute(playlist.id)}')">

          Démarrer

        </button>


        <button
          class="small"
          onclick="editPlaylist('${escapeAttribute(playlist.id)}')">

          Modifier

        </button>


        <button
          class="small danger"
          onclick="deletePlaylist('${escapeAttribute(playlist.id)}')">

          Supprimer

        </button>

      </div>

    </article>

  `;

}


/* =========================================================
   RÉSOLUTION DES ÉLÉMENTS D'UNE PLAYLIST
   ========================================================= */

function resolvePlaylistItems(playlist) {

  const available =
    getItems(
      playlist.type
    );


  if (!Array.isArray(playlist.items)) {
    return [];
  }


  return playlist.items
    .map(id =>
      available.find(
        item =>
          String(item.id) ===
          String(id)
      )
    )
    .filter(Boolean);

}


/* =========================================================
   MODIFICATION
   ========================================================= */

function editPlaylist(id) {

  const playlist =
    getPlaylists()
      .find(
        item =>
          String(item.id) ===
          String(id)
      );


  if (!playlist) {
    return;
  }


  editingId =
    playlist.id;


  const editor =
    document.getElementById("editor");


  const name =
    document.getElementById(
      "editName"
    );

  const description =
    document.getElementById(
      "editDescription"
    );


  if (!editor || !name || !description) {
    return;
  }


  name.value =
    playlist.name || "";


  description.value =
    playlist.description || "";


  /*
    Pour modifier une playlist,
    on utilise son propre type.
  */

  currentType =
    playlist.type || "exercise";


  const tabEx =
    document.getElementById("tabEx");

  const tabFig =
    document.getElementById("tabFig");


  if (tabEx) {

    tabEx.classList.toggle(
      "active",
      currentType === "exercise"
    );

  }


  if (tabFig) {

    tabFig.classList.toggle(
      "active",
      currentType === "figure"
    );

  }


  renderEditPicker(
    playlist.items || []
  );


  editor.classList.remove(
    "hidden"
  );


  editor.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

}


/* =========================================================
   SÉLECTEUR DE MODIFICATION
   ========================================================= */

function renderEditPicker(
  selectedIds = null
) {

  const container =
    document.getElementById(
      "editPicker"
    );


  if (!container) {
    return;
  }


  const playlist =
    editingId
      ? getPlaylists()
          .find(
            p =>
              String(p.id) ===
              String(editingId)
          )
      : null;


  if (
    selectedIds === null &&
    playlist
  ) {

    selectedIds =
      playlist.items || [];

  }


  if (!Array.isArray(selectedIds)) {
    selectedIds = [];
  }


  const items =
    getItems(currentType);


  if (!items.length) {

    container.innerHTML = `
      <div class="empty">
        Aucun élément disponible.
      </div>
    `;

    return;
  }


  container.innerHTML =
    items.map(item => {

      const checked =
        selectedIds.some(
          id =>
            String(id) ===
            String(item.id)
        );


      const image =
        getImage(item);


      return `

        <label
          class="pick">

          <input
            type="checkbox"
            value="${escapeAttribute(item.id)}"
            ${checked ? "checked" : ""}>

          <div class="thumb">

            ${
              image

                ? `
                  <img
                    src="${escapeAttribute(image)}"
                    alt="">
                `

                : `
                  <div>
                    Photo à ajouter
                  </div>
                `
            }

          </div>

          <div>

            <div class="name">
              ${escapeHTML(
                itemName(item)
              )}
            </div>

            <div class="meta">

              ${
                currentType === "exercise"

                  ? escapeHTML(
                      item.duration ||
                      formatSeconds(
                        item.seconds || 60
                      )
                    )

                  : escapeHTML(
                      item.level || ""
                    )

              }

            </div>

          </div>

        </label>

      `;

    }).join("");

}


/* =========================================================
   ENREGISTRER MODIFICATION
   ========================================================= */

function saveEdit() {

  if (!editingId) {
    return;
  }


  const playlists =
    getPlaylists();


  const playlist =
    playlists.find(
      p =>
        String(p.id) ===
        String(editingId)
    );


  if (!playlist) {
    return;
  }


  const nameInput =
    document.getElementById(
      "editName"
    );

  const descriptionInput =
    document.getElementById(
      "editDescription"
    );


  const name =
    nameInput
      ? nameInput.value.trim()
      : "";


  if (!name) {

    alert(
      "Donne un nom à la playlist."
    );

    return;
  }


  const selected =
    Array.from(
      document.querySelectorAll(
        "#editPicker input[type='checkbox']:checked"
      )
    ).map(
      checkbox =>
        checkbox.value
    );


  playlist.name =
    name;


  playlist.description =
    descriptionInput
      ? descriptionInput.value.trim()
      : "";


  playlist.items =
    selected;


  playlist.type =
    currentType;


  playlist.updatedAt =
    Date.now();


  writeJSON(
    PLAYLISTS_KEY,
    playlists
  );


  closeEdit();

  renderPlaylists();

}


/* =========================================================
   FERMER ÉDITION
   ========================================================= */

function closeEdit() {

  editingId = null;


  const editor =
    document.getElementById(
      "editor"
    );


  if (editor) {

    editor.classList.add(
      "hidden"
    );

  }

}


/* =========================================================
   SUPPRESSION
   ========================================================= */

function deletePlaylist(id) {

  const playlist =
    getPlaylists()
      .find(
        p =>
          String(p.id) ===
          String(id)
      );


  if (!playlist) {
    return;
  }


  const confirmed =
    confirm(
      `Supprimer la playlist « ${playlist.name} » ?`
    );


  if (!confirmed) {
    return;
  }


  const playlists =
    getPlaylists()
      .filter(
        p =>
          String(p.id) !==
          String(id)
      );


  writeJSON(
    PLAYLISTS_KEY,
    playlists
  );


  renderPlaylists();

}


/* =========================================================
   LANCEMENT D'UNE PLAYLIST
   ========================================================= */

function launchPlaylist(id) {

  const playlist =
    getPlaylists()
      .find(
        p =>
          String(p.id) ===
          String(id)
      );


  if (!playlist) {
    return;
  }


  const items =
    resolvePlaylistItems(
      playlist
    );


  if (!items.length) {

    alert(
      "Cette playlist ne contient plus d'éléments disponibles."
    );

    return;
  }


  launchPlaylistData = {
    ...playlist,
    resolvedItems: items
  };


  launchIndex = 0;


  const launch =
    document.getElementById(
      "launch"
    );


  if (!launch) {
    return;
  }


  launch.classList.add(
    "show"
  );


  loadLaunchItem();

}


/* =========================================================
   CHARGER ÉLÉMENT DE LA SÉANCE
   ========================================================= */

function loadLaunchItem() {

  if (
    !launchPlaylistData ||
    !launchPlaylistData.resolvedItems
  ) {
    return;
  }


  const items =
    launchPlaylistData.resolvedItems;


  if (
    launchIndex < 0
  ) {
    launchIndex = 0;
  }


  if (
    launchIndex >= items.length
  ) {
    launchIndex =
      items.length - 1;
  }


  const item =
    items[launchIndex];


  clearTimer();


  const image =
    getImage(item);


  const visual =
    document.getElementById(
      "visual"
    );


  const title =
    document.getElementById(
      "launchTitle"
    );


  const meta =
    document.getElementById(
      "launchMeta"
    );


  const count =
    document.getElementById(
      "count"
    );


  const timerElement =
    document.getElementById(
      "timer"
    );


  const note =
    document.getElementById(
      "note"
    );


  if (image) {

    visual.innerHTML = `
      <img
        src="${escapeAttribute(image)}"
        alt="">
    `;

  } else {

    visual.innerHTML = `
      <div class="placeholder">
        Photo à ajouter
      </div>
    `;

  }


  title.textContent =
    itemName(item);


  count.textContent =
    `${launchIndex + 1} / ${items.length}`;


  if (
    launchPlaylistData.type ===
    "exercise"
  ) {

    total =
      Number(item.seconds) ||
      parseDuration(
        item.duration
      ) ||
      60;


    remaining =
      total;


    timerElement.textContent =
      formatSeconds(
        remaining
      );


    meta.textContent =
      item.duration ||
      formatSeconds(total);


    note.textContent =
      itemDescription(item);


  } else {

    total = 0;
    remaining = 0;


    timerElement.textContent =
      "";


    meta.textContent =
      item.level ||
      "Figure pole";


    note.textContent =
      itemDescription(item) ||
      "Prends le temps de travailler la figure.";

  }


  updateMainButton();

}


/* =========================================================
   TIMER
   ========================================================= */

function toggleTimer() {

  if (
    !launchPlaylistData ||
    launchPlaylistData.type !==
    "exercise"
  ) {
    nextItem();
    return;
  }


  if (timer) {

    clearTimer();

    return;

  }


  timer =
    setInterval(
      () => {

        remaining--;

        const timerElement =
          document.getElementById(
            "timer"
          );


        if (timerElement) {

          timerElement.textContent =
            formatSeconds(
              Math.max(
                0,
                remaining
              )
            );

        }


        if (remaining <= 0) {

          clearTimer();

          /*
            Passage automatique à
            l'exercice suivant.
          */

          setTimeout(
            () => {

              nextItem();

            },
            350
          );

        }

      },
      1000
    );


  updateMainButton();

}


function clearTimer() {

  if (timer) {

    clearInterval(
      timer
    );

    timer = null;

  }


  updateMainButton();

}


function updateMainButton() {

  const button =
    document.getElementById(
      "mainBtn"
    );


  if (!button) {
    return;
  }


  if (
    !launchPlaylistData
  ) {
    button.textContent =
      "Démarrer";

    return;
  }


  if (
    launchPlaylistData.type ===
    "figure"
  ) {

    button.textContent =
      "Suivant";

    return;

  }


  button.textContent =
    timer
      ? "Pause"
      : "Démarrer";

}


/* =========================================================
   ÉLÉMENT PRÉCÉDENT
   ========================================================= */

function prevItem() {

  if (
    !launchPlaylistData
  ) {
    return;
  }


  if (
    launchIndex <= 0
  ) {
    return;
  }


  launchIndex--;

  loadLaunchItem();

}


/* =========================================================
   ÉLÉMENT SUIVANT
   ========================================================= */

function nextItem() {

  if (
    !launchPlaylistData
  ) {
    return;
  }


  const items =
    launchPlaylistData.resolvedItems;


  if (
    launchIndex <
    items.length - 1
  ) {

    launchIndex++;

    loadLaunchItem();

    return;

  }


  /*
    Fin de la playlist.
  */

  clearTimer();


  const title =
    document.getElementById(
      "launchTitle"
    );

  const meta =
    document.getElementById(
      "launchMeta"
    );

  const visual =
    document.getElementById(
      "visual"
    );

  const timerElement =
    document.getElementById(
      "timer"
    );

  const note =
    document.getElementById(
      "note"
    );

  const count =
    document.getElementById(
      "count"
    );

  const mainButton =
    document.getElementById(
      "mainBtn"
    );


  if (visual) {

    visual.innerHTML = `
      <div class="placeholder">
        Playlist terminée
      </div>
    `;

  }


  if (title) {

    title.textContent =
      "Séance terminée";

  }


  if (meta) {

    meta.textContent =
      "";

  }


  if (timerElement) {

    timerElement.textContent =
      "";

  }


  if (count) {

    count.textContent =
      "Terminé";

  }


  if (note) {

    note.textContent =
      "Tous les éléments de la playlist ont été parcourus.";

  }


  if (mainButton) {

    mainButton.textContent =
      "Terminé";

    mainButton.disabled =
      true;

  }

}


/* =========================================================
   FERMER LANCEMENT
   ========================================================= */

function closeLaunch() {

  clearTimer();


  launchPlaylistData =
    null;


  launchIndex =
    0;


  const launch =
    document.getElementById(
      "launch"
    );


  if (launch) {

    launch.classList.remove(
      "show"
    );

  }


  const mainButton =
    document.getElementById(
      "mainBtn"
    );


  if (mainButton) {

    mainButton.disabled =
      false;

  }

}


/* =========================================================
   FORMATAGE TIMER
   ========================================================= */

function formatSeconds(seconds) {

  seconds =
    Math.max(
      0,
      Number(seconds) || 0
    );


  const minutes =
    Math.floor(
      seconds / 60
    );


  const secs =
    seconds % 60;


  return (
    String(minutes).padStart(2, "0") +
    ":" +
    String(secs).padStart(2, "0")
  );

}


/* =========================================================
   SÉCURITÉ HTML
   ========================================================= */

function escapeHTML(value) {

  return String(
    value ?? ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );

}


function escapeAttribute(value) {

  return escapeHTML(
    value
  );

}


/* =========================================================
   INITIALISATION
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    /*
      Affiche les exercices par défaut
      dès l'ouverture.
    */

    setType(
      "exercise"
    );


    renderPlaylists();

  }
);