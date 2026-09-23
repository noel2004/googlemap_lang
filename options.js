import { fillLanguages, localize, send, t } from './ui.js';

localize();
const $ = id => document.getElementById(id);
const slots = [];
fillLanguages($('default-language'));
for (let index = 0; index < 6; index++) {
  const label = document.createElement('label');
  label.textContent = t('shortcutSlot', String(index + 1));
  const select = document.createElement('select');
  select.id = `shortcut-${index + 1}`;
  fillLanguages(select, { empty: true });
  select.addEventListener('change', updateSlots);
  label.append(select);
  slots.push(select);
  $('shortcut-slots').append(label);
}

function updateSlots() {
  const selected = new Set(slots.map(select => select.value).filter(Boolean));
  for (const select of slots) {
    for (const option of select.options) option.disabled = Boolean(option.value && option.value !== select.value && selected.has(option.value));
  }
}

try {
  const { settings } = await send({ type: 'getState' });
  $('default-language').value = settings.defaultLanguage;
  slots.forEach((select, index) => { select.value = settings.shortcuts[index] || ''; });
  updateSlots();
  $('settings-fields').disabled = false;
} catch (error) {
  console.error(error);
  $('status').textContent = t('loadError');
  $('status').classList.add('error');
}

$('settings-form').addEventListener('input', () => { $('status').textContent = ''; });
$('settings-form').addEventListener('submit', async event => {
  event.preventDefault();
  const settings = {
    defaultLanguage: $('default-language').value,
    shortcuts: slots.map(select => select.value).filter(Boolean),
  };
  $('settings-fields').disabled = true;
  $('status').textContent = '';
  try {
    await send({ type: 'saveSettings', settings });
    $('status').textContent = t('settingsSaved');
    $('status').classList.remove('error');
  } catch (error) {
    console.error(error);
    $('status').textContent = t('saveError');
    $('status').classList.add('error');
  } finally {
    $('settings-fields').disabled = false;
  }
});
