import { bindSettingsControls, formatTarget } from './exercise-settings.js';

document.querySelectorAll('[data-exercise-id]').forEach(card => {
  const exerciseId = card.dataset.exerciseId;
  const repsSelect = card.querySelector('[data-setting="reps"]');
  const setsSelect = card.querySelector('[data-setting="sets"]');
  const summary = card.querySelector('[data-target-summary]');
  const update = settings => { summary.textContent = formatTarget(settings); };
  const settings = bindSettingsControls({ exerciseId, repsSelect, setsSelect, onChange: update });
  update(settings);
});
