// ─── SEARCH ───
function setState(msg) {
  const el = document.getElementById('searchState');
  el.style.display = msg ? 'block' : 'none';
  el.textContent = msg;
}

async function malSearch() {
  const q = document.getElementById('searchInput').value.trim();
  const container = document.getElementById('searchResults');
  if (!q) return;

  setState('Buscando...');
  container.innerHTML = '';

  try {
    const query = `
      query ($search: String) {
        Page(perPage: 18) {
          media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
            id
            title { romaji english native }
            coverImage { large extraLarge }
            startDate { year }
            episodes
            studios(isMain: true) { nodes { name } }
            genres
            status
          }
        }
      }
    `;
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ query, variables: { search: q } })
    });

    if (!res.ok) {
      setState(`❌ Erro ${res.status} ao buscar. Tente novamente.`);
      return;
    }

    const data = await res.json();
    setState('');

    const results = data?.data?.Page?.media || [];
    if (!results.length) {
      setState('Nenhum resultado encontrado.');
      return;
    }

    const genreMap = {
      'Action':'Ação','Adventure':'Aventura','Comedy':'Comédia','Drama':'Drama',
      'Ecchi':'Ecchi','Fantasy':'Fantasia','Horror':'Terror','Mahou Shoujo':'Mahou Shoujo',
      'Mecha':'Mecha','Music':'Música','Mystery':'Mistério','Psychological':'Psicológico',
      'Romance':'Romance','Sci-Fi':'Sci-Fi','Slice of Life':'Cotidiano','Sports':'Esportes',
      'Supernatural':'Sobrenatural','Thriller':'Thriller','Hentai':'Hentai',
      'Shounen':'Shounen','Shoujo':'Shoujo','Seinen':'Seinen','Josei':'Josei',
    };
    const translateAL = g => genreMap[g] || g;

    container.innerHTML = results.map(a => {
      const img   = a.coverImage?.large || '';
      const title = a.title?.romaji || a.title?.english || '';
      const year  = a.startDate?.year || '—';
      const eps   = a.episodes ? `${a.episodes} eps` : '—';
      const dataAttr = encodeURIComponent(JSON.stringify({
        anilistId: a.id,
        title,
        img,
        studio:   a.studios?.nodes?.[0]?.name || '—',
        genres:   (a.genres || []).map(translateAL),
        epTotal:  a.episodes || 0,
      }));
      return `
        <div class="result-card" onclick="openSmodal('${dataAttr}')">
          <div class="result-thumb">
            ${img ? `<img src="${img}" style="width:100%;height:100%;object-fit:cover;" />` : '🎌'}
          </div>
          <div class="result-info">
            <div class="result-title" title="${title}">${title}</div>
            <div class="result-year">${year} · ${eps}</div>
          </div>
        </div>`;
    }).join('');

  } catch (e) {
    setState('❌ Erro de conexão. Verifique sua rede.');
  }
}

document.getElementById('searchInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') malSearch();
});

// ─── SEARCH DETAIL MODAL ───
let smodalData = null;
let smodalRating = 0;
let smodalStatus = null;

function openSmodal(dataAttr) {
  smodalData = JSON.parse(decodeURIComponent(dataAttr));
  smodalRating = 0;
  smodalStatus = null;

  const cover = document.getElementById('smodalCover');
  cover.innerHTML = smodalData.img
    ? `<img src="${smodalData.img}" />`
    : '🎌';

  document.getElementById('smodalTitle').textContent = smodalData.title;
  document.getElementById('smodalStudio').textContent = smodalData.studio;
  document.getElementById('smodalGenres').innerHTML = (smodalData.genres || [])
    .map(g => `<span class="genre-tag">${g}</span>`).join('');

  document.querySelectorAll('.smodal-list-opt').forEach(o => o.classList.remove('active'));
  document.getElementById('smodalRequiredHint').style.display = 'none';
  document.getElementById('smodalDuplicateWarning').style.display = 'none';
  const smodalEpWarn = document.getElementById('smodalEpWarning');
  if (smodalEpWarn) { smodalEpWarn.textContent = ''; smodalEpWarn.className = 'ep-warning'; }
  document.getElementById('smodalEpWatched').value = 0;
  document.getElementById('smodalEpTotal').value = smodalData.epTotal || 0;
  document.getElementById('smodalDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('smodalProgressFill').style.width = '0%';
  renderSmodalStars();

  document.getElementById('smodalOverlay').classList.add('open');
}

function closeSmodal() {
  document.getElementById('smodalOverlay').classList.remove('open');
  document.getElementById('smodalDuplicateWarning').style.display = 'none';
}

function renderSmodalStars() {
  document.getElementById('smodalStars').innerHTML = Array.from({ length: 5 }, (_, i) =>
    `<span class="smodal-star${i < smodalRating ? ' filled' : ''}" onclick="setSmodalRating(${i + 1})">★</span>`
  ).join('');
}

function setSmodalRating(value) {
  smodalRating = value;
  renderSmodalStars();
}

function setSmodalStatus(status) {
  smodalStatus = status;
  document.querySelectorAll('.smodal-list-opt').forEach(o =>
    o.classList.toggle('active', o.dataset.status === status)
  );
  document.getElementById('smodalRequiredHint').style.display = 'none';
}

function validateSmodalEpWatched(input) {
  const total = parseInt(document.getElementById('smodalEpTotal').value) || 0;
  let val = parseInt(input.value);
  const warningEl = document.getElementById('smodalEpWarning');

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

  updateSmodalProgress();
}

function updateSmodalProgress() {
  const watched = parseInt(document.getElementById('smodalEpWatched').value) || 0;
  const total   = parseInt(document.getElementById('smodalEpTotal').value) || 0;
  const pct = total > 0 ? Math.min(100, Math.round((watched / total) * 100)) : 0;
  document.getElementById('smodalProgressFill').style.width = pct + '%';
}

function saveSmodalAnime() {
  const dupWarning = document.getElementById('smodalDuplicateWarning');
  dupWarning.style.display = 'none';

  if (!smodalStatus) {
    document.getElementById('smodalRequiredHint').style.display = 'block';
    return;
  }

  const listLabels = { watching: 'Assistindo', watched: 'Assistidos', plan: 'Para assistir' };
  const existing = mockAnimes.find(a =>
    (smodalData.anilistId && a.anilistId === smodalData.anilistId) ||
    a.name.trim().toLowerCase() === smodalData.title.trim().toLowerCase()
  );

  if (existing) {
    const listName = listLabels[existing.status] || existing.status;
    dupWarning.innerHTML = `⚠ <strong>${existing.name}</strong> já está na lista <strong>${listName}</strong>.<br>Para alterar, acesse os detalhes do anime por lá.`;
    dupWarning.style.display = 'block';
    return;
  }

  const newAnime = {
    id: Date.now(),
    anilistId: smodalData.anilistId || null,
    name: smodalData.title,
    status: smodalStatus,
    epWatched: parseInt(document.getElementById('smodalEpWatched').value) || 0,
    epTotal:   parseInt(document.getElementById('smodalEpTotal').value) || 0,
    img: smodalData.img || '',
    imgBase64: '',
    rating: smodalRating,
    genres: smodalData.genres || [],
    dateAdded: document.getElementById('smodalDate').value || '',
  };
  mockAnimes.push(newAnime);
  saveAnimes();
  renderLists();
  closeSmodal();

  // Salva a capa como base64 em background
  if (smodalData.img) {
    fetch(smodalData.img)
      .then(r => r.blob())
      .then(blob => new Promise(res => {
        const rd = new FileReader();
        rd.onload = e => res(e.target.result);
        rd.readAsDataURL(blob);
      }))
      .then(b64 => {
        const a = mockAnimes.find(x => x.id === newAnime.id);
        if (a) { a.imgBase64 = b64; saveAnimes(); }
      })
      .catch(() => {});
  }
}
