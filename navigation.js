// ─── NAVIGATION ───
const navItems = document.querySelectorAll('.nav-item[data-page]');
const pages = document.querySelectorAll('.page');

navItems.forEach(item => {
  item.addEventListener('click', () => {
    // auto-save if leaving detail page
    if (document.getElementById('page-detail').classList.contains('active')) {
      const anime = mockAnimes.find(a => a.id === currentAnimeId);
      if (anime) {
        anime.name      = document.getElementById('detailName').value.trim() || anime.name;
        anime.epWatched = parseInt(document.getElementById('detailEpWatched').value) || 0;
        anime.epTotal   = parseInt(document.getElementById('detailEpTotal').value) || 0;
        anime.dateAdded = document.getElementById('detailDateAdded').value || '';
        saveAnimes();
      }
    }
    navItems.forEach(n => n.classList.remove('active'));
    item.classList.add('active');
    const target = item.dataset.page;
    pages.forEach(p => p.classList.remove('active'));
    document.getElementById('page-detail').classList.remove('active');
    document.getElementById('page-' + target).classList.add('active');
    renderLists();
    if (target === 'perfil') renderProfileFavorites();
    if (target === 'estatisticas') renderStatsMonth();
  });
});

function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-detail')?.classList.remove('active');
  document.getElementById('page-' + page)?.classList.add('active');
  if (page === 'estatisticas') renderStatsMonth();
}

function openConfigPage(key) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-detail').classList.remove('active');
  document.getElementById('page-config-' + key).classList.add('active');
}

function closeConfigPage() {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-detail').classList.remove('active');
  document.getElementById('page-config').classList.add('active');
  document.querySelectorAll('.bottom-nav-item').forEach(b => {
    b.classList.toggle('active', b.dataset.page === 'config');
  });
}

function mobileNav(target, btn) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-detail').classList.remove('active');
  document.getElementById('page-' + target).classList.add('active');
  renderLists();
  if (target === 'perfil') renderProfileFavorites();
  if (target === 'estatisticas') renderStatsMonth();
  document.querySelectorAll('.bottom-nav-item').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.page === target);
  });
}
