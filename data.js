// ─── DEFAULT DATA ───
const defaultAnimes = [
  { id: 1, name: 'Demon Slayer', status: 'watching', epWatched: 18, epTotal: 26, img: '', rating: 4, genres: ['Ação', 'Fantasia', 'Sobrenatural'], dateAdded: '2024-03-10' },
  { id: 2, name: 'Jujutsu Kaisen', status: 'watching', epWatched: 6, epTotal: 24, img: '', rating: 3, genres: ['Ação', 'Fantasia Sombria'], dateAdded: '2024-05-01' },
  { id: 3, name: 'Fullmetal Alchemist', status: 'watched', epWatched: 64, epTotal: 64, img: '', rating: 5, genres: ['Ação', 'Aventura', 'Drama'], dateAdded: '2023-11-20' },
  { id: 4, name: 'Cowboy Bebop', status: 'watched', epWatched: 26, epTotal: 26, img: '', rating: 5, genres: ['Ficção Científica', 'Ação'], dateAdded: '2023-08-15' },
  { id: 5, name: 'Vinland Saga', status: 'plan', epWatched: 0, epTotal: 24, img: '', rating: 0, genres: ['Ação', 'Aventura', 'Histórico'], dateAdded: '' },
  { id: 6, name: 'Mushishi', status: 'plan', epWatched: 0, epTotal: 26, img: '', rating: 0, genres: ['Aventura', 'Fantasia', 'Mistério'], dateAdded: '' },
];

function loadAnimes() {
  try {
    const saved = localStorage.getItem('okiru_animes');
    return saved ? JSON.parse(saved) : defaultAnimes;
  } catch { return defaultAnimes; }
}

function saveAnimes() {
  localStorage.setItem('okiru_animes', JSON.stringify(mockAnimes));
}

const mockAnimes = loadAnimes();

function epLabel(a) {
  if (a.status === 'watching') return `Ep ${a.epWatched}`;
  if (a.status === 'watched')  return `${a.epTotal} eps`;
  return '—';
}

function starsHTML(rating, small = true) {
  return Array.from({ length: 5 }, (_, i) =>
    `<span class="${small ? 'star' : 'detail-star'}${i < rating ? ' filled' : ''}"
      ${!small ? `onclick="setRating(${i + 1})"` : ''}
    >★</span>`
  ).join('');
}

function renderLists() {
  const watching = mockAnimes.filter(a => a.status === 'watching');
  const watched  = mockAnimes.filter(a => a.status === 'watched');
  const plan     = mockAnimes.filter(a => a.status === 'plan');
  renderList('watching', watching);
  renderList('watched',  watched);
  renderList('plan',     plan);
  if (typeof renderMobileList === 'function') renderMobileList();
}

function renderList(key, items) {
  const el = document.getElementById('list-' + key);
  const countEl = document.getElementById('count-' + key);
  countEl.textContent = items.length;

  if (!items.length) return;

  el.innerHTML = items.map(a => {
    const seasonCount = a.seasonCount !== undefined ? a.seasonCount : (a.seasons?.length || 0);
    const seasonBadge = seasonCount > 0
      ? `<span class="anime-seasons-badge">${seasonCount} temp.</span>`
      : '';
    return `
      <div class="anime-item" data-name="${a.name.toLowerCase()}" onclick="openDetail(${a.id})">
        <div class="anime-thumb">
          ${a.img ? `<img src="${a.img}" />` : ''}
        </div>
        <div class="anime-info">
          <div class="anime-name">${a.name}</div>
          <div class="anime-stars">${starsHTML(a.rating, true)}${seasonBadge}</div>
        </div>
        <span class="anime-ep">${epLabel(a)}</span>
      </div>`;
  }).join('');

  // Re-aplica filtro ativo se houver
  const input = document.getElementById('search-input-' + key);
  if (input && input.value) filterList(key, input.value);
}

function toggleListSearch(key) {
  const bar = document.getElementById('search-bar-' + key);
  const btn = bar?.previousElementSibling?.querySelector('.list-search-btn');
  const input = document.getElementById('search-input-' + key);
  const isOpen = bar.classList.contains('open');

  if (isOpen) {
    bar.classList.remove('open');
    btn?.classList.remove('active');
    input.value = '';
    filterList(key, ''); // restaura lista completa
  } else {
    bar.classList.add('open');
    btn?.classList.add('active');
    input.focus();
  }
}

function filterList(key, query) {
  const el = document.getElementById('list-' + key);
  if (!el) return;
  const q = query.trim().toLowerCase();
  el.querySelectorAll('.anime-item').forEach(item => {
    const name = item.dataset.name || '';
    item.style.display = (!q || name.includes(q)) ? '' : 'none';
  });
}