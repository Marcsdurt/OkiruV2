// ─── DETAIL PAGE ───
let currentAnimeId = null;
let detailHistory = [];

const READING_STATUSES = ['reading', 'read', 'toread'];

function isReading(anime) {
  return anime && READING_STATUSES.includes(anime.status);
}

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

// ─── ADAPTA UI CONFORME TIPO ──────────────────────────────────────────────────
function adaptDetailUI(anime) {
  const reading = isReading(anime);

  // Selector de lista
  const sel = document.getElementById('detailListSelector');
  if (reading) {
    sel.innerHTML = `
      <div class="list-selector-opt" data-status="reading"  onclick="setAnimeStatus('reading')">Lendo</div>
      <div class="list-selector-opt" data-status="read"     onclick="setAnimeStatus('read')">Lido</div>
      <div class="list-selector-opt" data-status="toread"   onclick="setAnimeStatus('toread')">Para ler</div>`;
  } else {
    sel.innerHTML = `
      <div class="list-selector-opt" data-status="watching" onclick="setAnimeStatus('watching')">Assistindo</div>
      <div class="list-selector-opt" data-status="watched"  onclick="setAnimeStatus('watched')">Assistidos</div>
      <div class="list-selector-opt" data-status="plan"     onclick="setAnimeStatus('plan')">Para assistir</div>`;
  }

  // Unidade de progresso
  const unitEl = document.getElementById('detailProgressUnit');
  if (unitEl) unitEl.textContent = reading ? 'caps' : 'eps';
  const titleEl = document.getElementById('detailProgressTitle');
  if (titleEl) titleEl.textContent = reading ? 'Capítulos' : 'Progresso';

  // Volumes (só leitura)
  const volSec = document.getElementById('detailVolumesSection');
  if (volSec) volSec.style.display = reading ? '' : 'none';

  // Formato e status publicação (só leitura)
  const fmtGrp = document.getElementById('detailFormatGroup');
  const pubGrp = document.getElementById('detailPubStatusGroup');
  if (fmtGrp) fmtGrp.style.display = reading ? '' : 'none';
  if (pubGrp) pubGrp.style.display = reading ? '' : 'none';

  // Temporadas (só anime)
  const seaSec = document.getElementById('detailSeasonsSection');
  if (seaSec) seaSec.style.display = reading ? 'none' : '';

  // Label do toggle de lançamento
  const toggleLabel = document.getElementById('airingToggleLabel');
  if (toggleLabel) toggleLabel.textContent = reading ? 'Em publicação' : 'Em lançamento';

  // Campos do painel direito
  const animeFields = document.getElementById('airingAnimeFields');
  const readFields  = document.getElementById('airingReadFields');
  if (animeFields) animeFields.style.display = reading ? 'none' : '';
  if (readFields)  readFields.style.display  = reading ? '' : 'none';
}

// ─── ABRE DETALHE ─────────────────────────────────────────────────────────────
function openDetail(id, fromSeason = false) {
  if (currentAnimeId) {
    const current = mockAnimes.find(a => a.id === currentAnimeId);
    if (current) {
      current.name      = document.getElementById('detailName').value.trim() || current.name;
      current.epWatched = parseInt(document.getElementById('detailEpWatched').value) || 0;
      current.epTotal   = parseInt(document.getElementById('detailEpTotal').value) || 0;
      current.dateAdded = document.getElementById('detailDateAdded').value || '';
      if (isReading(current)) {
        current.volRead  = parseInt(document.getElementById('detailVolRead').value) || 0;
        current.volTotal = parseInt(document.getElementById('detailVolTotal').value) || 0;
      }
      saveAnimes();
    }
    if (fromSeason) detailHistory.push(currentAnimeId);
    else detailHistory = [];
  }

  const anime = mockAnimes.find(a => a.id === id);
  if (!anime) return;
  currentAnimeId = id;

  adaptDetailUI(anime);

  document.getElementById('detailName').value = anime.name;
  document.getElementById('detailStars').innerHTML = starsHTML(anime.rating, false);
  document.getElementById('detailGenres').innerHTML = (anime.genres || [])
    .map(g => `<span class="genre-tag">${g}</span>`).join('');
  document.getElementById('detailEpWatched').value = anime.epWatched;
  document.getElementById('detailEpTotal').value = anime.epTotal;
  document.getElementById('detailDateAdded').value = anime.dateAdded || '';

  document.getElementById('detailVolRead').value  = anime.volRead  || 0;
  document.getElementById('detailVolTotal').value = anime.volTotal || 0;

  const fmtEl = document.getElementById('detailFormat');
  if (fmtEl) fmtEl.value = anime.format || '';

  updatePubStatus(anime.pubStatus || null);

  document.getElementById('seasonsInput').value = '';
  document.getElementById('seasonsDropdown').classList.remove('open');
  document.getElementById('seasonsDropdown').innerHTML = '';

  updateProgress();
  updateVolumesProgress();
  updateStatusSelector(anime.status);
  updateFavoriteIcon(anime.favorite || false);

  if (!isReading(anime)) renderSeasonsList();

  loadAiringSection(anime);

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-detail').classList.add('active');
  document.getElementById('detailRightSidebar').style.display = 'flex';
  initDetailSidebar();
}

// ─── STATUS ───────────────────────────────────────────────────────────────────
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

// ─── FECHA DETALHE ────────────────────────────────────────────────────────────
function closeDetail() {
  const anime = mockAnimes.find(a => a.id === currentAnimeId);
  if (anime) {
    anime.name      = document.getElementById('detailName').value.trim() || anime.name;
    anime.epWatched = parseInt(document.getElementById('detailEpWatched').value) || 0;
    anime.epTotal   = parseInt(document.getElementById('detailEpTotal').value) || 0;
    anime.dateAdded = document.getElementById('detailDateAdded').value || '';
    if (isReading(anime)) {
      anime.volRead  = parseInt(document.getElementById('detailVolRead').value) || 0;
      anime.volTotal = parseInt(document.getElementById('detailVolTotal').value) || 0;
    }
    saveAnimes();
  }

  if (detailHistory.length > 0) {
    const parentId = detailHistory.pop();
    currentAnimeId = null;
    openDetail(parentId);
    return;
  }

  const targetPage = (anime && isReading(anime)) ? 'leituras' : 'inicio';
  document.getElementById('page-detail').classList.remove('active');
  document.getElementById('detailRightSidebar').style.display = 'none';
  document.getElementById('page-' + targetPage).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navTarget = document.querySelector(`[data-page="${targetPage}"]`);
  if (navTarget) navTarget.classList.add('active');
  renderLists();
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
function showDeletePopup() {
  const anime = mockAnimes.find(a => a.id === currentAnimeId);
  const label = anime && isReading(anime) ? 'esta leitura' : 'este anime';
  const txt = document.getElementById('deletePopupText');
  if (txt) txt.textContent = `Tem certeza que deseja apagar ${label}?`;
  document.getElementById('deleteOverlay').style.display = 'block';
  document.getElementById('deletePopup').style.display = 'block';
}

function hideDeletePopup() {
  document.getElementById('deleteOverlay').style.display = 'none';
  document.getElementById('deletePopup').style.display = 'none';
}

function confirmDelete() {
  const anime = mockAnimes.find(a => a.id === currentAnimeId);
  const targetPage = (anime && isReading(anime)) ? 'leituras' : 'inicio';
  const idx = mockAnimes.findIndex(a => a.id === currentAnimeId);
  if (idx !== -1) mockAnimes.splice(idx, 1);
  saveAnimes();
  currentAnimeId = null;
  detailHistory = [];
  hideDeletePopup();
  document.getElementById('page-detail').classList.remove('active');
  document.getElementById('page-' + targetPage).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navTarget = document.querySelector(`[data-page="${targetPage}"]`);
  if (navTarget) navTarget.classList.add('active');
  renderLists();
}

// ─── PROGRESSO ────────────────────────────────────────────────────────────────
function validateEpWatched(input) {
  const total = parseInt(document.getElementById('detailEpTotal').value) || 0;
  let val = parseInt(input.value);
  const warningEl = document.getElementById('epWarning');
  const anime = mockAnimes.find(a => a.id === currentAnimeId);
  const unit = (anime && isReading(anime)) ? 'capítulos' : 'episódios';

  if (isNaN(val) || val < 0) val = 0;

  if (total > 0 && val > total) {
    input.value = total;
    warningEl.textContent = `Digite um valor menor ou igual ao número total de ${unit}.`;
    warningEl.className = 'ep-warning error';
    clearTimeout(input._warnTimer);
    input._warnTimer = setTimeout(() => { warningEl.textContent = ''; warningEl.className = 'ep-warning'; }, 3000);
  } else if (total > 0 && val === total) {
    warningEl.textContent = anime && isReading(anime) ? 'Último capítulo.' : 'Este é o último episódio.';
    warningEl.className = 'ep-warning info';
    clearTimeout(input._warnTimer);
    input._warnTimer = setTimeout(() => { warningEl.textContent = ''; warningEl.className = 'ep-warning'; }, 3000);
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

function updateVolumesProgress() {
  const read  = parseInt(document.getElementById('detailVolRead').value) || 0;
  const total = parseInt(document.getElementById('detailVolTotal').value) || 0;
  const pct = total > 0 ? Math.min(100, Math.round((read / total) * 100)) : 0;
  const fill = document.getElementById('detailVolProgressFill');
  if (fill) fill.style.width = pct + '%';
}

// ─── FORMATO ──────────────────────────────────────────────────────────────────
function saveDetailFormat() {
  const anime = mockAnimes.find(a => a.id === currentAnimeId);
  if (!anime) return;
  anime.format = document.getElementById('detailFormat').value;
  saveAnimes();
}

// ─── STATUS DE PUBLICAÇÃO ─────────────────────────────────────────────────────
function setPubStatus(val) {
  const anime = mockAnimes.find(a => a.id === currentAnimeId);
  if (!anime) return;
  anime.pubStatus = val;
  saveAnimes();
  updatePubStatus(val);
}

function updatePubStatus(val) {
  document.querySelectorAll('.pub-status-opt').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.val === val);
  });
}

// ─── RATING ───────────────────────────────────────────────────────────────────
function setRating(value) {
  const anime = mockAnimes.find(a => a.id === currentAnimeId);
  if (!anime) return;
  anime.rating = value;
  saveAnimes();
  document.getElementById('detailStars').innerHTML = starsHTML(value, false);
  renderLists();
}

// ─── SEASONS ──────────────────────────────────────────────────────────────────
function searchSeasons() {
  const q = document.getElementById('seasonsInput').value.trim().toLowerCase();
  const dropdown = document.getElementById('seasonsDropdown');
  const anime = mockAnimes.find(a => a.id === currentAnimeId);
  const linkedIds = (anime?.seasons || []).map(s => s.id);

  if (!q) { dropdown.classList.remove('open'); dropdown.innerHTML = ''; return; }

  const results = mockAnimes.filter(a =>
    a.id !== currentAnimeId && !linkedIds.includes(a.id) && a.name.toLowerCase().includes(q)
  );

  if (!results.length) {
    dropdown.innerHTML = `<div class="seasons-drop-item" style="color:var(--secondary);cursor:default;">Nenhum resultado</div>`;
    dropdown.classList.add('open');
    return;
  }

  dropdown.innerHTML = results.map(a => `
    <div class="seasons-drop-item" onclick="linkSeason(${a.id})">
      <div class="seasons-drop-thumb">${a.img ? `<img src="${a.img}" />` : ''}</div>
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
  saveAnimes(); renderSeasonsList(); renderLists();
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
  saveAnimes(); renderSeasonsList(); renderLists();
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
        <div class="seasons-linked-thumb">${linked.img ? `<img src="${linked.img}" />` : ''}</div>
        <span class="seasons-linked-name" style="cursor:pointer;" onclick="openDetail(${linked.id}, true)">${linked.name}</span>
        <input class="seasons-linked-tag" type="text" value="${s.tag}" maxlength="4" onchange="updateSeasonTag(${s.id}, this.value)" />
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

// ─── FAVORITE ─────────────────────────────────────────────────────────────────
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


// ─── SIDEBAR DIREITA ─────────────────────────────────────────────────────────
let sidebarExpanded = localStorage.getItem('okiru_sidebar_expanded') !== 'false';

function initDetailSidebar() {
  const sidebar = document.getElementById('detailRightSidebar');
  if (!sidebar) return;
  if (!sidebarExpanded) {
    sidebar.classList.add('collapsed');
    document.getElementById('page-detail').classList.add('sidebar-collapsed');
  }
}

function toggleDetailSidebar() {
  sidebarExpanded = !sidebarExpanded;
  localStorage.setItem('okiru_sidebar_expanded', sidebarExpanded);
  const sidebar = document.getElementById('detailRightSidebar');
  const page    = document.getElementById('page-detail');
  sidebar.classList.toggle('collapsed', !sidebarExpanded);
  page.classList.toggle('sidebar-collapsed', !sidebarExpanded);
}

// ─── TUTORIAL ─────────────────────────────────────────────────────────────────
const tutorialSteps = [
  { target: '.detail-list-selector', text: 'Escolha em qual lista este item está.', pos: 'below' },
  { target: '#detailStars', text: 'Clique nas estrelas para avaliar de 1 a 5.', pos: 'below' },
  { target: '.detail-progress-section', text: 'Acompanhe e edite seu progresso diretamente aqui.', pos: 'above' },
  { target: '.detail-seasons-header', text: 'Associe temporadas ao anime.', pos: 'above' },
  { target: '.detail-actions-group', text: 'Compartilhar, apagar ou favoritar este item.', pos: 'below' },
  { target: null, text: 'Fim do tutorial! Clique em ? para ver novamente.', pos: 'center' }
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
  const step    = tutorialSteps[tutorialStep];
  const balloon = document.getElementById('tutorialBalloon');
  const textEl  = document.getElementById('tutorialText');
  const hintEl  = balloon.querySelector('.tutorial-hint');
  const arrowEl = document.getElementById('tutorialArrow');
  const isMobile = window.innerWidth <= 640;
  const margin   = 10;
  balloon.style.maxWidth = isMobile ? '180px' : '230px';
  textEl.textContent = step.text;
  const isLast = tutorialStep === tutorialSteps.length - 1;
  hintEl.style.display = isLast ? 'none' : 'block';
  balloon.style.animation = 'none'; balloon.offsetHeight; balloon.style.animation = '';

  if (step.pos === 'center' || !step.target) {
    balloon.style.top = '50%'; balloon.style.left = '50%';
    balloon.style.transform = 'translate(-50%, -50%)';
    arrowEl.style.display = 'none'; return;
  }
  const el = document.querySelector(step.target);
  if (!el) { tutorialNext(); return; }
  balloon.style.top = '-9999px'; balloon.style.left = '-9999px'; balloon.style.transform = '';
  requestAnimationFrame(() => {
    const rect = el.getBoundingClientRect();
    const bw = balloon.offsetWidth || 200, bh = balloon.offsetHeight || 80;
    const vw = window.innerWidth, vh = window.innerHeight;
    arrowEl.style.display = 'block';
    let dir = step.pos;
    if (dir === 'below' && rect.bottom + bh + 20 > vh) dir = 'above';
    if (dir === 'above' && rect.top - bh - 20 < 0) dir = 'below';
    let left = rect.left + rect.width / 2 - bw / 2;
    left = Math.max(margin, Math.min(left, vw - bw - margin));
    let top;
    if (dir === 'below') { top = rect.bottom + 12; arrowEl.style.top = '-5px'; arrowEl.style.bottom = 'auto'; }
    else { top = rect.top - bh - 12; arrowEl.style.bottom = '-5px'; arrowEl.style.top = 'auto'; }
    top = Math.max(margin, Math.min(top, vh - bh - margin));
    const arrowLeft = Math.max(8, Math.min(rect.left + rect.width / 2 - left - 5, bw - 18));
    arrowEl.style.left = arrowLeft + 'px';
    balloon.style.top = top + 'px'; balloon.style.left = left + 'px';
  });
}
