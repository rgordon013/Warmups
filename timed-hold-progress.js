import { bindSettingsControls, formatTarget } from './exercise-settings.js?v=4';

export function createTimedHoldProgress({ exerciseId, app, count, progressLabel, status, announcement,
  toggle, resetButton, repsSelect, setsSelect, onSideChange, onRunningChange }) {
  let settings;
  let currentSet = 1;
  let side = 0;
  let remaining = 0;
  let running = false;
  let started = false;
  let complete = false;
  const sideName = () => side === 0 ? 'Left' : 'Right';

  function updateDisplay() {
    count.textContent = String(Math.ceil(remaining));
    progressLabel.textContent = `${sideName()} side · set ${currentSet} of ${settings.sets} · seconds left`;
  }

  function reset(message = 'Workout reset') {
    currentSet = 1; side = 0; remaining = settings.reps;
    running = false; started = false; complete = false;
    app.classList.remove('has-started');
    toggle.textContent = 'Start';
    status.textContent = 'Ready — select Start';
    announcement.textContent = message;
    onSideChange?.(side);
    onRunningChange?.(false);
    updateDisplay();
  }

  settings = bindSettingsControls({ exerciseId, repsSelect, setsSelect,
    onChange: next => { settings = next; reset(`Targets saved: ${formatTarget(next, exerciseId)}`); }
  });
  reset('Ready');

  function setRunning(next) {
    if (complete && next) reset('New workout ready');
    if (!started) { started = true; app.classList.add('has-started'); }
    running = next;
    toggle.textContent = running ? 'Pause' : 'Resume';
    status.textContent = running ? `Holding ${sideName().toLowerCase()} side` : 'Paused';
    announcement.textContent = running ? `${sideName()} side hold started` : 'Hold paused';
    onRunningChange?.(running);
  }

  function tick(seconds) {
    if (!running) return;
    remaining = Math.max(0, remaining - seconds);
    if (remaining > 0) { updateDisplay(); return; }
    if (side === 0) side = 1;
    else if (currentSet < settings.sets) { currentSet++; side = 0; }
    else {
      running = false; complete = true;
      toggle.textContent = 'Restart';
      status.textContent = 'Workout complete';
      announcement.textContent = `Workout complete: ${formatTarget(settings, exerciseId)}`;
      onRunningChange?.(false);
      updateDisplay();
      return;
    }
    remaining = settings.reps;
    onSideChange?.(side);
    status.textContent = `Holding ${sideName().toLowerCase()} side`;
    announcement.textContent = `${sideName()} side, set ${currentSet}`;
    updateDisplay();
  }

  toggle.addEventListener('click', () => setRunning(!running));
  resetButton.addEventListener('click', () => reset());
  return { get running() { return running; }, tick, reset,
    state: () => ({ running, started, complete, remaining, currentSet, side, settings: { ...settings } }) };
}
