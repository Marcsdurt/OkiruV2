// ─── DETAIL PAGE ───
let currentAnimeId = null;
let detailHistory = [];

const genreMap = {
  'Action': 'Ação', 'Adventure': 'Aventura', 'Comedy': 'Comédia',
  'Drama': 'Drama', 'Fantasy': 'Fantasia', 'Horror': 'Terror',
  'Mystery': 'Mistério', 'Romance': 'Romance', 'Sci-Fi': 'Ficção Científica',
  'Slice of Life': 'Cotidiano', 'Sports': 'Esportes', 'Supernatural': 'Sobrenatural',
  'Thriller': 'Suspense', 'Historical': 'Histórico', 'Psychological': 'Psicológico',
  'Mecha': 'Mecha', 'Music': 'Música', 'School': 'Escola', 'Military': 'Militar',
  'Magic': 'Magia', 'Demons': 'Demônios', 'Samurai': 'Samurai', 'Vampire': 'Vampiro',
  'Martial Arts': 'Artes Marciais', 'Game': 'Jogos', 'Ecchi': 'Ecchi',
};

function translateGenre(g) { return genreMap[g] || g; }

function openDetail(id, fromSeason = false) {
  if (currentAnimeId) {
    const current = mockAnimes.find(a => a.id === currentAnimeId);
    if (current) {
      current.name      = document.getElementById('detailName').value.trim() || current.name;
      current.epWatched = parseInt(document.getElementById('detailEpWatched').value) || 0;
      current.epTotal   = parseInt(document.getElementById('detailEpTotal').value) || 0;
      current.dateAdded = document.getElementById('detailDateAdded').value || '';
      saveAnimes();
    }
    if (fromSeason) detailHistory.push(currentAnimeId);
    else detailHistory = [];
  }

  const anime = mockAnimes.find(a => a.id === id);
  if (!anime) return;
  currentAnimeId = id;

  document.getElementById('detailName').value = anime.name;
  document.getElementById('detailStars').innerHTML = starsHTML(anime.rating, false);
  document.getElementById('detailGenres').innerHTML = (anime.genres || [])
    .map(g => `<span class="genre-tag">${g}</span>`).join('');
  document.getElementById('detailEpWatched').value = anime.epWatched;
  document.getElementById('detailEpTotal').value = anime.epTotal;
  document.getElementById('detailDateAdded').value = anime.dateAdded || '';
  document.getElementById('seasonsInput').value = '';
  document.getElementById('seasonsDropdown').classList.remove('open');
  document.getElementById('seasonsDropdown').innerHTML = '';
  updateProgress();
  updateStatusSelector(anime.status);
  updateFavoriteIcon(anime.favorite || false);
  renderSeasonsList();

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-detail').classList.add('active');
}

function updateStatusSelector(status) {
  document.querySelectorAll('.list-selector-opt').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.status === status);
  });
}

function setAnimeStatus(status) {
  const anime = mockAnimes.find(a => a.id === currentAnimeId);
  if (!anime) return;
  anime.status = status;
  saveAnimes();
  updateStatusSelector(status);
  renderLists();
}

function closeDetail() {
  const anime = mockAnimes.find(a => a.id === currentAnimeId);
  if (anime) {
    anime.name      = document.getElementById('detailName').value.trim() || anime.name;
    anime.epWatched = parseInt(document.getElementById('detailEpWatched').value) || 0;
    anime.epTotal   = parseInt(document.getElementById('detailEpTotal').value) || 0;
    anime.dateAdded = document.getElementById('detailDateAdded').value || '';
    saveAnimes();
  }

  if (detailHistory.length > 0) {
    const parentId = detailHistory.pop();
    currentAnimeId = null;
    openDetail(parentId);
    return;
  }

  document.getElementById('page-detail').classList.remove('active');
  document.getElementById('page-inicio').classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelector('[data-page="inicio"]').classList.add('active');
  renderLists();
}

function showDeletePopup() {
  document.getElementById('deleteOverlay').style.display = 'block';
  document.getElementById('deletePopup').style.display = 'block';
}

function hideDeletePopup() {
  document.getElementById('deleteOverlay').style.display = 'none';
  document.getElementById('deletePopup').style.display = 'none';
}

function confirmDelete() {
  const idx = mockAnimes.findIndex(a => a.id === currentAnimeId);
  if (idx !== -1) mockAnimes.splice(idx, 1);
  saveAnimes();
  currentAnimeId = null;
  detailHistory = [];
  hideDeletePopup();
  document.getElementById('page-detail').classList.remove('active');
  document.getElementById('page-inicio').classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelector('[data-page="inicio"]').classList.add('active');
  renderLists();
}

function validateEpWatched(input) {
  const total = parseInt(document.getElementById('detailEpTotal').value) || 0;
  let val = parseInt(input.value);
  const warningEl = document.getElementById('epWarning');

  if (isNaN(val) || val < 0) val = 0;

  if (total > 0 && val > total) {
    input.value = total;
    val = total;
    warningEl.textContent = 'Digite um valor menor ou igual ao número total de episódios.';
    warningEl.className = 'ep-warning error';
    clearTimeout(input._warnTimer);
    input._warnTimer = setTimeout(() => {
      warningEl.textContent = '';
      warningEl.className = 'ep-warning';
    }, 3000);
  } else if (total > 0 && val === total) {
    warningEl.textContent = 'Este é o último episódio.';
    warningEl.className = 'ep-warning info';
    clearTimeout(input._warnTimer);
    input._warnTimer = setTimeout(() => {
      warningEl.textContent = '';
      warningEl.className = 'ep-warning';
    }, 3000);
  } else {
    warningEl.textContent = '';
    warningEl.className = 'ep-warning';
  }

  updateProgress();
}

function updateProgress() {
  const watched = parseInt(document.getElementById('detailEpWatched').value) || 0;
  const total   = parseInt(document.getElementById('detailEpTotal').value) || 0;
  const pct = total > 0 ? Math.min(100, Math.round((watched / total) * 100)) : 0;
  document.getElementById('detailProgressFill').style.width = pct + '%';
}

function setRating(value) {
  const anime = mockAnimes.find(a => a.id === currentAnimeId);
  if (!anime) return;
  anime.rating = value;
  saveAnimes();
  document.getElementById('detailStars').innerHTML = starsHTML(value, false);
  renderLists();
}

// ─── SEASONS ───
function searchSeasons() {
  const q = document.getElementById('seasonsInput').value.trim().toLowerCase();
  const dropdown = document.getElementById('seasonsDropdown');
  const anime = mockAnimes.find(a => a.id === currentAnimeId);
  const linkedIds = (anime?.seasons || []).map(s => s.id);

  if (!q) { dropdown.classList.remove('open'); dropdown.innerHTML = ''; return; }

  const results = mockAnimes.filter(a =>
    a.id !== currentAnimeId &&
    !linkedIds.includes(a.id) &&
    a.name.toLowerCase().includes(q)
  );

  if (!results.length) {
    dropdown.innerHTML = `<div class="seasons-drop-item" style="color:var(--secondary);cursor:default;">Nenhum resultado</div>`;
    dropdown.classList.add('open');
    return;
  }

  dropdown.innerHTML = results.map(a => `
    <div class="seasons-drop-item" onclick="linkSeason(${a.id})">
      <div class="seasons-drop-thumb">
        ${a.img ? `<img src="${a.img}" />` : ''}
      </div>
      <span class="seasons-drop-name">${a.name}</span>
    </div>
  `).join('');
  dropdown.classList.add('open');
}

function linkSeason(linkedId) {
  const anime = mockAnimes.find(a => a.id === currentAnimeId);
  const linked = mockAnimes.find(a => a.id === linkedId);
  if (!anime || !linked) return;

  if (!anime.seasons) anime.seasons = [];
  linked._prevStatus = linked.status;
  linked.status = '_linked';
  anime.seasons.push({ id: linkedId, tag: 'T' + (anime.seasons.length + 1) });

  saveAnimes();
  renderSeasonsList();
  renderLists();

  document.getElementById('seasonsInput').value = '';
  document.getElementById('seasonsDropdown').classList.remove('open');
  document.getElementById('seasonsDropdown').innerHTML = '';
}

function unlinkSeason(linkedId) {
  const anime = mockAnimes.find(a => a.id === currentAnimeId);
  const linked = mockAnimes.find(a => a.id === linkedId);
  if (!anime || !linked) return;

  anime.seasons = (anime.seasons || []).filter(s => s.id !== linkedId);
  linked.status = linked._prevStatus || 'plan';
  delete linked._prevStatus;

  saveAnimes();
  renderSeasonsList();
  renderLists();
}

function updateSeasonTag(linkedId, value) {
  const anime = mockAnimes.find(a => a.id === currentAnimeId);
  if (!anime) return;
  const season = (anime.seasons || []).find(s => s.id === linkedId);
  if (season) { season.tag = value; saveAnimes(); }
}

function renderSeasonsList() {
  const anime = mockAnimes.find(a => a.id === currentAnimeId);
  const list = document.getElementById('seasonsList');
  const countInput = document.getElementById('seasonsCountInput');

  if (!anime) return;

  const linkedCount = anime.seasons?.length || 0;
  const savedCount = anime.seasonCount !== undefined ? anime.seasonCount : linkedCount;
  if (countInput) countInput.value = savedCount;

  if (!anime.seasons?.length) { list.innerHTML = ''; return; }

  list.innerHTML = anime.seasons.map(s => {
    const linked = mockAnimes.find(a => a.id === s.id);
    if (!linked) return '';
    return `
      <div class="seasons-linked">
        <div class="seasons-linked-thumb">
          ${linked.img ? `<img src="${linked.img}" />` : ''}
        </div>
        <span class="seasons-linked-name" style="cursor:pointer;" onclick="openDetail(${linked.id}, true)">${linked.name}</span>
        <input class="seasons-linked-tag" type="text" value="${s.tag}" maxlength="4"
          onchange="updateSeasonTag(${s.id}, this.value)" />
        <div class="seasons-linked-remove" onclick="unlinkSeason(${s.id})" title="Desanexar">
          <img src="./icons/circle-xmark.svg" />
        </div>
      </div>`;
  }).join('');
}

function saveSeasonCount(val) {
  const anime = mockAnimes.find(a => a.id === currentAnimeId);
  if (!anime) return;
  anime.seasonCount = parseInt(val) || 0;
  saveAnimes();
}

document.addEventListener('click', e => {
  if (!e.target.closest('.detail-seasons-section')) {
    document.getElementById('seasonsDropdown')?.classList.remove('open');
  }
});

// ─── FAVORITE ───
function toggleFavorite() {
  const anime = mockAnimes.find(a => a.id === currentAnimeId);
  if (!anime) return;
  anime.favorite = !anime.favorite;
  saveAnimes();
  updateFavoriteIcon(anime.favorite);
  renderProfileFavorites();
}

function updateFavoriteIcon(isFav) {
  document.getElementById('detailFavoriteIcon').src = isFav
    ? './icons/heart-solid-full.svg'
    : './icons/heart-regular.svg';
}

// ─── TUTORIAL ───
const tutorialSteps = [
  {
    target: '.detail-list-selector',
    text: 'Aqui você escolhe em qual lista o anime está: Assistindo, Assistidos ou Para Assistir.',
    pos: 'below'
  },
  {
    target: '#detailStars',
    text: 'Clique nas estrelas para avaliar o anime de 1 a 5.',
    pos: 'below'
  },
  {
    target: '.detail-progress-section',
    text: 'Acompanhe seu progresso. Edite os episódios assistidos e o total diretamente aqui.',
    pos: 'above'
  },
  {
    target: '.detail-seasons-header',
    text: 'Associe temporadas ao anime. O contador ao lado mostra o total de temporadas.',
    pos: 'above'
  },
  {
    target: '.detail-actions-group',
    text: 'Esses botões permitem compartilhar, apagar o anime ou favoritá-lo.',
    pos: 'below'
  },
  {
    target: null,
    text: 'Fim do tutorial! Você sempre pode ver novamente clicando no botão ?.',
    pos: 'center'
  }
];

let tutorialStep = 0;

function startTutorial() {
  tutorialStep = 0;
  document.getElementById('tutorialOverlay').style.display = 'block';
  showTutorialStep();
}

function tutorialNext() {
  tutorialStep++;
  if (tutorialStep >= tutorialSteps.length) {
    document.getElementById('tutorialOverlay').style.display = 'none';
    return;
  }
  showTutorialStep();
}

function showTutorialStep() {
  const step     = tutorialSteps[tutorialStep];
  const balloon  = document.getElementById('tutorialBalloon');
  const textEl   = document.getElementById('tutorialText');
  const hintEl   = balloon.querySelector('.tutorial-hint');
  const arrowEl  = document.getElementById('tutorialArrow');
  const isMobile = window.innerWidth <= 640;
  const margin   = 10;
  balloon.style.maxWidth = isMobile ? '180px' : '230px';

  textEl.textContent = step.text;
  const isLast = tutorialStep === tutorialSteps.length - 1;
  hintEl.style.display = isLast ? 'none' : 'block';

  balloon.style.animation = 'none';
  balloon.offsetHeight;
  balloon.style.animation = '';

  if (step.pos === 'center' || !step.target) {
    balloon.style.top       = '50%';
    balloon.style.left      = '50%';
    balloon.style.transform = 'translate(-50%, -50%)';
    arrowEl.style.display   = 'none';
    return;
  }

  const el = document.querySelector(step.target);
  if (!el) { tutorialNext(); return; }

  balloon.style.top       = '-9999px';
  balloon.style.left      = '-9999px';
  balloon.style.transform = '';

  requestAnimationFrame(() => {
    const rect  = el.getBoundingClientRect();
    const bw    = balloon.offsetWidth  || 200;
    const bh    = balloon.offsetHeight || 80;
    const vw    = window.innerWidth;
    const vh    = window.innerHeight;

    arrowEl.style.display = 'block';

    let dir = step.pos;
    if (dir === 'below' && rect.bottom + bh + 20 > vh) dir = 'above';
    if (dir === 'above' && rect.top   - bh - 20 < 0)  dir = 'below';

    let left = rect.left + rect.width / 2 - bw / 2;
    left = Math.max(margin, Math.min(left, vw - bw - margin));

    let top;
    if (dir === 'below') {
      top = rect.bottom + 12;
      arrowEl.style.top    = '-5px';
      arrowEl.style.bottom = 'auto';
    } else {
      top = rect.top - bh - 12;
      arrowEl.style.bottom = '-5px';
      arrowEl.style.top    = 'auto';
    }

    top = Math.max(margin, Math.min(top, vh - bh - margin));

    const arrowLeft = Math.max(8, Math.min(rect.left + rect.width / 2 - left - 5, bw - 18));
    arrowEl.style.left = arrowLeft + 'px';

    balloon.style.top  = top  + 'px';
    balloon.style.left = left + 'px';
  });
}
