import { bindSettingsControls, formatTarget } from './exercise-settings.js';

export function createExerciseProgress({
  exerciseId,
  app,
  count,
  progressLabel,
  status,
  announcement,
  toggle,
  resetButton,
  repsSelect,
  setsSelect,
  onSetAdvance,
  onReset,
  onRunningChange
}) {
  let settings;
  let currentSet = 1;
  let reps = 0;
  let running = false;
  let started = false;
  let complete = false;

  function updateDisplay() {
    count.textContent = String(reps);
    progressLabel.textContent = `Set ${currentSet} of ${settings.sets} · completed reps`;
  }

  function resetProgress(message = 'Workout reset') {
    currentSet = 1;
    reps = 0;
    running = false;
    started = false;
    complete = false;
    app.classList.remove('has-started');
    toggle.textContent = 'Start';
    status.textContent = 'Ready — select Start';
    announcement.textContent = message;
    updateDisplay();
    onReset?.();
    onRunningChange?.(false);
  }

  settings = bindSettingsControls({
    exerciseId,
    repsSelect,
    setsSelect,
    onChange: next => {
      settings = next;
      resetProgress(`Targets saved: ${formatTarget(settings)}`);
    }
  });
  updateDisplay();

  function setRunning(next) {
    if (complete && next) resetProgress('New workout ready');
    if (!started) {
      started = true;
      app.classList.add('has-started');
    }
    running = next;
    toggle.textContent = running ? 'Pause' : 'Resume';
    status.textContent = running ? 'Exercise in progress' : 'Paused';
    announcement.textContent = running ? 'Exercise started' : 'Exercise paused';
    onRunningChange?.(running);
  }

  function recordRep() {
    if (!running) return;
    reps += 1;
    updateDisplay();
    if (reps < settings.reps) {
      announcement.textContent = `Repetition ${reps} of ${settings.reps}`;
      return;
    }
    if (currentSet < settings.sets) {
      currentSet += 1;
      reps = 0;
      onSetAdvance?.(currentSet);
      updateDisplay();
      announcement.textContent = `Set ${currentSet - 1} complete. Starting set ${currentSet}.`;
      return;
    }
    running = false;
    complete = true;
    toggle.textContent = 'Restart';
    status.textContent = 'Workout complete';
    announcement.textContent = `Workout complete: ${formatTarget(settings)}`;
    onRunningChange?.(false);
  }

  toggle.addEventListener('click', () => setRunning(!running));
  resetButton.addEventListener('click', () => resetProgress());

  return {
    get running() { return running; },
    get settings() { return { ...settings }; },
    recordRep,
    reset: resetProgress,
    state: () => ({ running, started, complete, reps, currentSet, settings: { ...settings } })
  };
}
