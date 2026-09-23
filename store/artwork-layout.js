const mode = new URLSearchParams(location.search).get('mode') || 'menu';
document.body.dataset.mode = mode;
if (mode === 'more') {
  document.getElementById('headline').textContent = 'Find your language.';
  document.getElementById('description').textContent = 'Search the full list by name or language code. Keep your favorites one click away.';
  document.getElementById('feature-one').textContent = 'A searchable language catalogue';
  document.getElementById('feature-two').textContent = 'Temporary choices or a saved default';
}
