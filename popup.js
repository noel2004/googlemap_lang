import { languageName, localize, nativeName, send, sortedLanguages, t, uiLocale } from './ui.js';

localize();
const $ = id => document.getElementById(id);
let tabId;
let state;
let busy = false;
const codes = sortedLanguages();
$('persistent').checked = false;

function persistenceHint() {
  $('persistence-hint').textContent = t($('persistent').checked ? 'persistentHint' : 'temporaryHint');
}
persistenceHint();
$('persistent').addEventListener('change', persistenceHint);

function renderList(container, languages) {
  container.replaceChildren();
  for (const code of languages) {
    const button = document.createElement('button');
    button.className = 'language-button';
    button.dataset.language = code;
    button.disabled = busy || !state?.canApply;
    button.setAttribute('aria-pressed', String(code === state?.language));
    const names = document.createElement('span');
    const label = document.createElement('span');
    label.textContent = languageName(code);
    names.append(label);
    const native = nativeName(code);
    if (native.toLocaleLowerCase(uiLocale) !== label.textContent.toLocaleLowerCase(uiLocale)) {
      const detail = document.createElement('small');
      detail.textContent = native;
      detail.lang = code === 'iw' ? 'he' : code;
      detail.dir = 'auto';
      names.append(detail);
    }
    button.append(names);
    button.addEventListener('click', () => apply({ type: 'selectLanguage', language: code, persistent: $('persistent').checked }));
    container.append(button);
  }
}

function filterLanguages() {
  const query = $('language-search').value.trim().normalize('NFKC').toLocaleLowerCase(uiLocale);
  const matches = codes.filter(code => `${code} ${languageName(code)} ${nativeName(code)}`.normalize('NFKC').toLocaleLowerCase(uiLocale).includes(query));
  renderList($('all-languages'), matches);
  $('no-results').hidden = matches.length > 0;
}

function render() {
  $('current').textContent = t(state.temporary ? 'currentTemporary' : 'currentDefault', languageName(state.language));
  $('not-maps').hidden = state.canApply;
  $('use-default').hidden = !state.temporary || !state.canApply;
  $('use-default').disabled = busy;
  $('persistent').disabled = busy || !state.canApply;
  renderList($('shortcuts'), state.settings.shortcuts);
  filterLanguages();
}

async function apply(message) {
  if (busy) return;
  busy = true;
  $('status').textContent = '';
  render();
  try {
    state = await send({ ...message, tabId });
    $('status').textContent = t(message.persistent ? 'savedDefault' : 'applied');
    $('status').classList.remove('error');
  } catch (error) {
    console.error(error);
    $('status').textContent = t('applyError');
    $('status').classList.add('error');
  } finally {
    busy = false;
    render();
  }
}

function showAll(value) {
  $('shortcuts-view').hidden = value;
  $('all-view').hidden = !value;
  $('more').setAttribute('aria-expanded', String(value));
  if (value) $('language-search').focus();
  else $('more').focus();
}
$('more').addEventListener('click', () => showAll(true));
$('back').addEventListener('click', () => showAll(false));
$('language-search').addEventListener('input', filterLanguages);
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !$('all-view').hidden) {
    event.preventDefault();
    showAll(false);
  }
});
$('use-default').addEventListener('click', () => apply({ type: 'useDefault' }));
$('settings').addEventListener('click', () => chrome.runtime.openOptionsPage());
$('open-maps').addEventListener('click', () => chrome.tabs.create({ url: 'https://www.google.com/maps' }));

async function refresh() {
  state = await send({ type: 'getState', tabId });
  render();
}
try {
  [tabId] = (await chrome.tabs.query({ active: true, currentWindow: true })).map(tab => tab.id);
  await refresh();
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.settings && !busy) refresh().catch(console.error);
  });
} catch (error) {
  console.error(error);
  $('status').textContent = t('loadError');
  $('status').classList.add('error');
}
