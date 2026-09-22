/* =========================================
   GESTION DES DONNÉES PERSONNELLES
   (les clés et helpers de stockage viennent de js/store.js,
   chargé avant ce fichier)
========================================= */

const POLE_FIGURES_KEY = "pole_figures";


/* =========================================
   ONGLET
========================================= */

function showTab(tab) {

  document
    .getElementById("exercisesSection")
    .classList.toggle("active", tab === "exercises");

  document
    .getElementById("figuresSection")
    .classList.toggle("active", tab === "figures");

  document
    .getElementById("tabExercises")
    .classList.toggle("active", tab === "exercises");

  document
    .getElementById("tabFigures")
    .classList.toggle("active", tab === "figures");

}


/* =========================================
   IMAGE → BASE64
========================================= */

function fileToDataURL(file) {

  return new Promise((resolve, reject) => {

    if (!file) {
      resolve("");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);

    reader.onerror = reject;

    reader.readAsDataURL(file);

  });

}


/* =========================================
   APERÇUS IMAGES
========================================= */

document
  .getElementById("exercisePhoto")
  ?.addEventListener("change", function () {

    const file = this.files[0];

    if (!file) return;

    const url = URL.createObjectURL(file);

    const preview = document.getElementById("exercisePreview");

    preview.src = url;
    preview.style.display = "block";

  });


document
  .getElementById("figurePhoto")
  ?.addEventListener("change", function () {

    const file = this.files[0];

    if (!file) return;

    const url = URL.createObjectURL(file);

    const preview = document.getElementById("figurePreview");

    preview.src = url;
    preview.style.display = "block";

  });


/* =========================================
   SÉLECTION D'UNE PHOTO DEPUIS LE TÉLÉPHONE
========================================= */

function pickImage(callback) {

  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/jpeg,image/png,image/webp";

  input.onchange = async () => {
    const file = input.files[0];
    if (!file) return;
    const dataURL = await fileToDataURL(file);
    callback(dataURL);
  };

  input.click();

}

/* =========================================
   EXERCICES — grille unique + fenêtre modale
   d'ajout / édition (défauts + persos confondus)
========================================= */

let editingId = null;
let editingType = null; // "new" | "custom" | "default"


function openExerciseForm(item) {

  document.getElementById("exerciseName").value =
    item ? item.name : "";

  document.getElementById("exerciseDescription").value =
    item ? (item.instructions || "") : "";

  document.getElementById("exerciseMuscles").value =
    item && item.muscles ? item.muscles : "";

  document.getElementById("exerciseDuration").value =
    item ? item.seconds : 60;

  document.getElementById("exercisePhoto").value = "";

  const preview = document.getElementById("exercisePreview");

  if (item && item.image) {
    preview.src = item.image;
    preview.style.display = "block";
  } else {
    preview.src = "";
    preview.style.display = "none";
  }

  const programField = document.getElementById("exerciseProgramField");
  const programSelect = document.getElementById("exerciseProgram");
  const musclesField = document.getElementById("exerciseMusclesField");
  const title = document.getElementById("exerciseModalTitle");

  if (!item) {

    editingId = null;
    editingType = "new";
    title.textContent = "Ajouter un exercice";
    programField.style.display = "";
    musclesField.style.display = "";
    programSelect.value = "renfo";

  } else if (item.custom) {

    editingId = item.id;
    editingType = "custom";
    title.textContent = "Modifier l'exercice";
    programField.style.display = "";
    musclesField.style.display = "";
    programSelect.value = item.program;

  } else {

    editingId = item.id;
    editingType = "default";
    title.textContent = "Modifier l'exercice";
    programField.style.display = "none";
    musclesField.style.display = "none";

  }

  renderExerciseModalActions(item);

  document.getElementById("exerciseModal").classList.add("show");

}


function openExerciseFormById(id, isCustom) {

  let item = null;

  if (isCustom) {

    const e = getCustomExercises().find(x => x.id === id);

    item = e && {
      id: e.id,
      name: e.name,
      image: e.image,
      program: e.program,
      custom: true,
      instructions: e.description,
      muscles: e.muscles,
      seconds: e.duration
    };

  } else {

    item = getAllDefaultExercises().find(x => x.id === id) || null;

  }

  if (item) openExerciseForm(item);

}


function closeExerciseModal() {

  document.getElementById("exerciseModal").classList.remove("show");

}


function renderExerciseModalActions(item) {

  const container =
    document.getElementById("exerciseModalExtraActions");

  if (!item) {
    container.innerHTML = "";
    return;
  }

  if (item.custom) {

    container.innerHTML = `
      <button class="danger" onclick="handleDeleteFromModal('${item.id}')">
        Supprimer
      </button>
    `;

  } else {

    const hidden = getHiddenIds().includes(item.id);
    const hasOverride = Boolean(getOverrides()[item.id]);

    container.innerHTML = `
      <button onclick="handleToggleHideFromModal('${item.id}')">
        ${hidden ? "Réactiver" : "Masquer"}
      </button>
      ${
        hasOverride
        ? `<button onclick="handleResetFromModal('${item.id}')">
            ↺ Réinitialiser
          </button>`
        : ""
      }
    `;

  }

}


async function saveExerciseForm() {

  const name =
    document.getElementById("exerciseName").value.trim();

  if (!name) {
    alert("Donne un nom à l'exercice.");
    return;
  }

  const description =
    document.getElementById("exerciseDescription").value.trim();

  const muscles =
    document.getElementById("exerciseMuscles").value.trim();

  const duration =
    Number(document.getElementById("exerciseDuration").value) || 60;

  const program =
    document.getElementById("exerciseProgram").value;

  const file =
    document.getElementById("exercisePhoto").files[0];

  const newImage =
    file ? await fileToDataURL(file) : null;


  if (editingType === "new") {

    const exercises = getCustomExercises();

    exercises.push({
      id: "custom_" + Date.now(),
      name,
      description,
      muscles,
      duration,
      program,
      image: newImage || "",
      custom: true
    });

    saveCustomExercises(exercises);

  } else if (editingType === "custom") {

    const exercises = getCustomExercises();
    const exercise = exercises.find(e => e.id === editingId);

    if (exercise) {
      exercise.name = name;
      exercise.description = description;
      exercise.muscles = muscles;
      exercise.duration = duration;
      exercise.program = program;
      if (newImage) exercise.image = newImage;
      saveCustomExercises(exercises);
    }

  } else if (editingType === "default") {

    const partial = {
      name,
      instructions: description,
      seconds: duration,
      duration: secondsToLabel(duration)
    };

    if (newImage) partial.image = newImage;

    setOverride(editingId, partial);

  }

  closeExerciseModal();
  renderExercisesGrid();

}


function handleDeleteFromModal(id) {

  if (!confirm("Supprimer cet exercice ?")) return;

  const exercises =
    getCustomExercises().filter(e => e.id !== id);

  saveCustomExercises(exercises);

  closeExerciseModal();
  renderExercisesGrid();

}


function handleToggleHideFromModal(id) {

  const hidden = getHiddenIds();
  const index = hidden.indexOf(id);

  if (index >= 0) hidden.splice(index, 1);
  else hidden.push(id);

  setHiddenIds(hidden);

  closeExerciseModal();
  renderExercisesGrid();

}


function handleResetFromModal(id) {

  clearOverride(id);

  closeExerciseModal();
  renderExercisesGrid();

}


function renderExercisesGrid() {

  const container =
    document.getElementById("exercisesGrid");

  const hidden = getHiddenIds();

  const defaults =
    getAllDefaultExercises();

  const customs =
    getCustomExercises().map(e => ({
      id: e.id,
      name: e.name,
      image: e.image,
      program: e.program,
      custom: true
    }));

  const all = [...defaults, ...customs];

  if (!all.length) {
    container.innerHTML =
      `<div class="empty">Aucun exercice pour le moment.</div>`;
    return;
  }

  container.innerHTML =
    all.map(exercise => {

      const isHidden =
        !exercise.custom && hidden.includes(exercise.id);

      return `
        <button
          type="button"
          class="exCard ${isHidden ? "isHidden" : ""}"
          onclick="openExerciseFormById('${exercise.id}', ${exercise.custom ? "true" : "false"})">

          <img
            src="${exercise.image || ""}"
            alt=""
            onerror="this.style.visibility='hidden'">

          <div class="exCardName">
            ${escapeHTML(exercise.name)}
          </div>

          ${isHidden ? `<div class="exCardBadge">Masqué</div>` : ""}

        </button>
      `;

    }).join("");

}


/* =========================================
   FIGURES DE POLE
========================================= */

async function addFigure() {

  const name =
    document.getElementById("figureName").value.trim();

  if (!name) {

    alert("Donne un nom à la figure.");

    return;

  }


  const level =
    document.getElementById("figureLevel").value;


  const file =
    document.getElementById("figurePhoto").files[0];


  const image =
    await fileToDataURL(file);


  const figures =
    getJSON(POLE_FIGURES_KEY);


  figures.push({

    id:
      "figure_" +
      Date.now(),

    name,

    level,

    image,

    mastered: false,

    favorite: false

  });


  saveJSON(
    POLE_FIGURES_KEY,
    figures
  );


  document.getElementById("figureName").value = "";

  document.getElementById("figurePhoto").value = "";

  document.getElementById("figurePreview").style.display = "none";


  renderFigures();

}


/* =========================================
   FAVORIS
========================================= */

function toggleFavorite(id) {

  const figures =
    getJSON(POLE_FIGURES_KEY);


  const figure =
    figures.find(f => f.id === id);


  if (!figure) return;


  figure.favorite =
    !figure.favorite;


  saveJSON(
    POLE_FIGURES_KEY,
    figures
  );


  renderFigures();

}


/* =========================================
   MAÎTRISE
========================================= */

function toggleMastered(id) {

  const figures =
    getJSON(POLE_FIGURES_KEY);


  const figure =
    figures.find(f => f.id === id);


  if (!figure) return;


  figure.mastered =
    !figure.mastered;


  saveJSON(
    POLE_FIGURES_KEY,
    figures
  );


  renderFigures();

}


/* =========================================
   SUPPRESSION FIGURE
========================================= */

function deleteFigure(id) {

  if (!confirm("Supprimer cette figure ?")) {
    return;
  }


  const figures =
    getJSON(POLE_FIGURES_KEY)
      .filter(f => f.id !== id);


  saveJSON(
    POLE_FIGURES_KEY,
    figures
  );


  renderFigures();

}


function changeFigurePhoto(id) {

  pickImage(dataURL => {
    const figures = getJSON(POLE_FIGURES_KEY);
    const figure = figures.find(f => f.id === id);
    if (!figure) return;
    figure.image = dataURL;
    saveJSON(POLE_FIGURES_KEY, figures);
    renderFigures();
  });

}


/* =========================================
   GALERIE FIGURES
========================================= */

function renderFigures() {

  const container =
    document.getElementById("figuresList");


  const figures =
    getJSON(POLE_FIGURES_KEY);


  if (!figures.length) {

    container.innerHTML =
      `<div class="empty">
        Ta galerie de figures est encore vide.
      </div>`;

    return;

  }


  const sorted =
    [...figures].sort(
      (a, b) =>
        Number(b.favorite) -
        Number(a.favorite)
    );


  container.innerHTML =
    sorted.map(figure => `

      <div class="manage-item">

        ${
          figure.image
          ? `<img src="${figure.image}">`
          : `<img alt="">`
        }


        <div class="manage-item-info">

          <strong>

            ${escapeHTML(figure.name)}

            <span
              class="star"
              onclick="toggleFavorite('${figure.id}')">

              ${figure.favorite ? "★" : "☆"}

            </span>

          </strong>


          <span>

            ${escapeHTML(figure.level)}

            ·

            ${
              figure.mastered
              ? "✓ Maîtrisée"
              : "À travailler"
            }

          </span>

        </div>


        <div class="manage-item-actions">

          <button
            class="small-btn"
            onclick="changeFigurePhoto('${figure.id}')">

            📷 Photo

          </button>

          <button
            class="small-btn"
            onclick="toggleMastered('${figure.id}')">

            ${
              figure.mastered
              ? "À retravailler"
              : "Maîtrisée"
            }

          </button>


          <button
            class="small-btn danger"
            onclick="deleteFigure('${figure.id}')">

            Supprimer

          </button>

        </div>

      </div>

    `).join("");

}


/* =========================================
   SÉCURITÉ HTML
========================================= */

function escapeHTML(value) {

  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


/* =========================================
   INITIALISATION
========================================= */

renderExercisesGrid();

renderFigures();