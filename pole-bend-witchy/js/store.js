/* =========================================
   STORE PARTAGÉ DES EXERCICES — Pole et Moi
   Source unique utilisée par gestion.js (page de gestion)
   et par le script de programme.html (séance réelle).
========================================= */

const HIDDEN_EXERCISES_KEY = "pole_hidden_exercises";
const CUSTOM_EXERCISES_KEY = "pole_custom_exercises";
const IMAGE_OVERRIDES_KEY = "pole_exercise_image_overrides";

function pad2(n) {
  return String(n).padStart(2, "0");
}

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

function getHiddenIds() {
  return getJSON(HIDDEN_EXERCISES_KEY, []);
}

function setHiddenIds(list) {
  saveJSON(HIDDEN_EXERCISES_KEY, list);
}

function getCustomExercises() {
  return getJSON(CUSTOM_EXERCISES_KEY, []);
}

function saveCustomExercises(list) {
  saveJSON(CUSTOM_EXERCISES_KEY, list);
}

/* Photos qui remplacent, depuis l'appli, l'image d'un exercice par défaut
   (les 38 fournis avec le projet) sans toucher au code / à GitHub. */
function getImageOverrides() {
  return getJSON(IMAGE_OVERRIDES_KEY, {});
}

function setImageOverride(id, dataURL) {
  const overrides = getImageOverrides();
  overrides[id] = dataURL;
  saveJSON(IMAGE_OVERRIDES_KEY, overrides);
}

function removeImageOverride(id) {
  const overrides = getImageOverrides();
  delete overrides[id];
  saveJSON(IMAGE_OVERRIDES_KEY, overrides);
}

/* Nombre d'exercices dans un programme (toutes sections confondues) */
function countProgramExercises(program) {
  return program.sections.reduce((n, s) => n + s[1].length, 0);
}

/* Décalage global d'un programme dans la numérotation des 38 photos
   (renfo commence à 0, jambes à 20, bras à 29, dans l'ordre de "programs") */
function programOffset(programId) {
  let offset = 0;
  for (const p of programs) {
    if (p.id === programId) return offset;
    offset += countProgramExercises(p);
  }
  return offset;
}

/* Convertit une durée en secondes en libellé lisible pour un exercice perso */
function secondsToLabel(seconds) {
  seconds = Number(seconds) || 0;
  if (seconds < 60) return `${seconds} s`;
  const m = Math.floor(seconds / 60);
  const r = seconds % 60;
  return r ? `${m} min ${r}` : `${m} min`;
}

/* Liste des exercices "par défaut" (issus de data/programs.js) pour un
   programme donné, avec id stable, image numérotée globalement, et section. */
function getDefaultExerciseList(programId) {
  const program = programs.find(p => p.id === programId);
  if (!program) return [];
  const offset = programOffset(programId);
  const overrides = getImageOverrides();
  const list = [];
  let localIndex = 0;
  program.sections.forEach(section => {
    section[1].forEach(raw => {
      const id = `${programId}_${localIndex}`;
      list.push({
        id,
        name: raw[0],
        duration: raw[1],
        kind: raw[2],
        instructions: raw[3] || "",
        seconds: Number(raw[4]) || 60,
        section: section[0],
        image: overrides[id] || `assets/exercises/${pad2(offset + localIndex + 1)}.jpg`,
        custom: false
      });
      localIndex++;
    });
  });
  return list;
}

/* Tous les exercices par défaut, tous programmes confondus (pour la page
   de gestion, qui doit permettre de masquer n'importe lequel des 38). */
function getAllDefaultExercises() {
  return programs.flatMap(p => getDefaultExerciseList(p.id).map(e => ({ ...e, program: p.id })));
}

/* Exercices persos pour un programme donné, dans le même format que les
   exercices par défaut, pour pouvoir les mélanger sans distinction. */
function getCustomExerciseList(programId) {
  return getCustomExercises()
    .filter(e => e.program === programId)
    .map(e => ({
      id: e.id,
      name: e.name,
      duration: secondsToLabel(e.duration),
      kind: "custom",
      instructions: e.description || "",
      seconds: Number(e.duration) || 60,
      section: "Mes exercices ajoutés",
      image: e.image || "",
      custom: true
    }));
}

/* Liste finale utilisée par la séance réelle : exercices par défaut non
   masqués, suivis des exercices persos de ce programme. */
function getVisibleExercises(programId) {
  const hidden = getHiddenIds();
  const defaults = getDefaultExerciseList(programId).filter(e => !hidden.includes(e.id));
  const custom = getCustomExerciseList(programId);
  return [...defaults, ...custom];
}
