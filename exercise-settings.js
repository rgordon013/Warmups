const STORAGE_KEY = 'shipbuilder-warmup.exercise-settings.v1';

export const EXERCISE_DEFAULTS = Object.freeze({
  'big-arm-circles': Object.freeze({ reps: 10, sets: 2 }),
  'y-to-w-raise': Object.freeze({ reps: 10, sets: 2 }),
  squat: Object.freeze({ reps: 10, sets: 2 }),
  'back-extension': Object.freeze({ reps: 10, sets: 2 }),
  'active-chest-stretch': Object.freeze({ reps: 10, sets: 2 }),
  'high-knees': Object.freeze({ reps: 10, sets: 2 }),
  'heel-raises': Object.freeze({ reps: 10, sets: 2 }),
  'standing-trunk-rotation': Object.freeze({ reps: 10, sets: 1 }),
  'neck-retraction': Object.freeze({ reps: 10, sets: 2 }),
  'chin-to-chest-neck-stretch': Object.freeze({ reps: 20, sets: 2 }),
  'wrist-extensor-stretch': Object.freeze({ reps: 20, sets: 2 }),
  'wrist-flexor-stretch': Object.freeze({ reps: 20, sets: 2 })
});

const LIMITS = Object.freeze({ reps: [1, 50], sets: [1, 10] });

function clampInteger(value, [minimum, maximum], fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.min(maximum, Math.max(minimum, parsed)) : fallback;
}

function readAll() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return stored && typeof stored === 'object' ? stored : {};
  } catch {
    return {};
  }
}

export function getExerciseSettings(exerciseId) {
  const defaults = EXERCISE_DEFAULTS[exerciseId];
  if (!defaults) throw new Error(`Unknown exercise: ${exerciseId}`);
  const stored = readAll()[exerciseId] || {};
  return {
    reps: clampInteger(stored.reps, LIMITS.reps, defaults.reps),
    sets: clampInteger(stored.sets, LIMITS.sets, defaults.sets)
  };
}

export function saveExerciseSettings(exerciseId, next) {
  const current = getExerciseSettings(exerciseId);
  const settings = {
    reps: clampInteger(next.reps, LIMITS.reps, current.reps),
    sets: clampInteger(next.sets, LIMITS.sets, current.sets)
  };
  const all = readAll();
  all[exerciseId] = settings;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  window.dispatchEvent(new CustomEvent('warmup-settings-change', {
    detail: { exerciseId, settings }
  }));
  return settings;
}

function populateSelect(select, [minimum, maximum]) {
  if (select.options.length) return;
  for (let value = minimum; value <= maximum; value++) {
    select.add(new Option(String(value), String(value)));
  }
}

export function formatTarget(settings, exerciseId) {
  const repWord = settings.reps === 1 ? 'rep' : 'reps';
  const setWord = settings.sets === 1 ? 'set' : 'sets';
  if (['chin-to-chest-neck-stretch', 'wrist-extensor-stretch', 'wrist-flexor-stretch'].includes(exerciseId)) {
    return `${settings.reps}-second hold · ${settings.sets} ${setWord} per side`;
  }
  return `${settings.reps} ${repWord} · ${settings.sets} ${setWord}`;
}

export function bindSettingsControls({ exerciseId, repsSelect, setsSelect, onChange }) {
  populateSelect(repsSelect, LIMITS.reps);
  populateSelect(setsSelect, LIMITS.sets);

  const apply = (settings, notify = true) => {
    repsSelect.value = String(settings.reps);
    setsSelect.value = String(settings.sets);
    if (notify) onChange?.(settings);
  };
  apply(getExerciseSettings(exerciseId), false);

  const save = () => apply(saveExerciseSettings(exerciseId, {
    reps: repsSelect.value,
    sets: setsSelect.value
  }));
  repsSelect.addEventListener('change', save);
  setsSelect.addEventListener('change', save);

  window.addEventListener('storage', event => {
    if (event.key === STORAGE_KEY) apply(getExerciseSettings(exerciseId));
  });
  window.addEventListener('warmup-settings-change', event => {
    if (event.detail?.exerciseId === exerciseId) apply(event.detail.settings, false);
  });

  return getExerciseSettings(exerciseId);
}
