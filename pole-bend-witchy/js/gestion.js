/* =========================================
   GESTION DES DONNÉES PERSONNELLES
========================================= */

const CUSTOM_EXERCISES_KEY = "pole_custom_exercises";
const HIDDEN_EXERCISES_KEY = "pole_hidden_exercises";
const POLE_FIGURES_KEY = "pole_figures";


function getJSON(key, fallback = []) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}


function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}


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
   AJOUT EXERCICE
========================================= */

async function addExercise() {

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

  const image =
    await fileToDataURL(file);


  const exercises =
    getJSON(CUSTOM_EXERCISES_KEY);


  exercises.push({

    id:
      "custom_" +
      Date.now(),

    name,

    description,

    muscles,

    duration,

    program,

    image,

    custom: true

  });


  saveJSON(
    CUSTOM_EXERCISES_KEY,
    exercises
  );


  document.getElementById("exerciseName").value = "";

  document.getElementById("exerciseDescription").value = "";

  document.getElementById("exerciseMuscles").value = "";

  document.getElementById("exercisePhoto").value = "";

  document.getElementById("exercisePreview").style.display = "none";


  renderCustomExercises();

  alert("Exercice ajouté ✨");

}


/* =========================================
   SUPPRESSION EXERCICE
========================================= */

function deleteExercise(id) {

  if (!confirm("Supprimer cet exercice ?")) {
    return;
  }

  const exercises =
    getJSON(CUSTOM_EXERCISES_KEY)
      .filter(e => e.id !== id);

  saveJSON(
    CUSTOM_EXERCISES_KEY,
    exercises
  );

  renderCustomExercises();

}


/* =========================================
   EXERCICES PERSONNELS
========================================= */

function renderCustomExercises() {

  const container =
    document.getElementById("customExercisesList");

  const exercises =
    getJSON(CUSTOM_EXERCISES_KEY);


  if (!exercises.length) {

    container.innerHTML =
      `<div class="empty">
        Aucun exercice personnel pour le moment.
      </div>`;

    return;
  }


  container.innerHTML =
    exercises.map(exercise => `

      <div class="manage-item">

        ${
          exercise.image
          ? `<img src="${exercise.image}">`
          : `<img alt="">`
        }

        <div class="manage-item-info">

          <strong>${escapeHTML(exercise.name)}</strong>

          <span>
            ${escapeHTML(exercise.muscles || "Muscles non précisés")}
          </span>

        </div>

        <div class="manage-item-actions">

          <button
            class="small-btn danger"
            onclick="deleteExercise('${exercise.id}')">

            Supprimer

          </button>

        </div>

      </div>

    `).join("");

}


/* =========================================
   MASQUER EXERCICES EXISTANTS
========================================= */

function toggleDefaultExercise(id) {

  const hidden =
    getJSON(HIDDEN_EXERCISES_KEY);

  const index =
    hidden.indexOf(id);


  if (index >= 0) {

    hidden.splice(index, 1);

  } else {

    hidden.push(id);

  }


  saveJSON(
    HIDDEN_EXERCISES_KEY,
    hidden
  );


  renderDefaultExercises();

}


/*
   Cette fonction lit les programmes
   présents dans programs.js.
*/

function getDefaultExercises() {

  if (typeof PROGRAMS === "undefined") {
    return [];
  }


  const result = [];


  Object.entries(PROGRAMS).forEach(
    ([programId, program]) => {

      (program.exercises || []).forEach(
        (exercise, index) => {

          result.push({

            id:
              exercise.id ||
              `${programId}_${index}`,

            name:
              exercise.name,

            program:
              programId

          });

        }
      );

    }
  );


  return result;

}


function renderDefaultExercises() {

  const container =
    document.getElementById("defaultExercisesList");

  const hidden =
    getJSON(HIDDEN_EXERCISES_KEY);

  const exercises =
    getDefaultExercises();


  if (!exercises.length) {

    container.innerHTML =
      `<div class="empty">
        Les exercices existants seront affichés ici.
      </div>`;

    return;

  }


  container.innerHTML =
    exercises.map(exercise => {

      const isHidden =
        hidden.includes(exercise.id);


      return `

        <div class="manage-item">

          <div class="manage-item-info">

            <strong>
              ${escapeHTML(exercise.name)}
            </strong>

            <span>
              ${exercise.program}
            </span>

          </div>


          <button
            class="small-btn"
            onclick="toggleDefaultExercise('${exercise.id}')">

            ${
              isHidden
              ? "Réactiver"
              : "Masquer"
            }

          </button>

        </div>

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

renderCustomExercises();

renderDefaultExercises();

renderFigures();