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

  const genreMap = {
    'Action':'Ação','Adventure':'Aventura','Comedy':'Comédia','Drama':'Drama',
    'Ecchi':'Ecchi','Fantasy':'Fantasia','Horror':'Terror','Mahou Shoujo':'Mahou Shoujo',
    'Mecha':'Mecha','Music':'Música','Mystery':'Mistério','Psychological':'Psicológico',
    'Romance':'Romance','Sci-Fi':'Sci-Fi','Slice of Life':'Cotidiano','Sports':'Esportes',
    'Supernatural':'Sobrenatural','Thriller':'Thriller','Hentai':'Hentai',
    'Shounen':'Shounen','Shoujo':'Shoujo','Seinen':'Seinen','Josei':'Josei',
  };
  const translateAL = g => genreMap[g] || g;

  const gqlQuery = `
    query ($search: String, $type: MediaType) {
      Page(perPage: 12) {
        media(search: $search, type: $type, sort: SEARCH_MATCH) {
          id
          type
          format
          title { romaji english native }
          coverImage { extraLarge large }
          startDate { year }
          episodes
          chapters
          studios(isMain: true) { nodes { name } }
          genres
        }
      }
    }
  `;

  try {
    // Faz as duas buscas em paralelo
    const [animeRes, mangaRes] = await Promise.all([
      fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ query: gqlQuery, variables: { search: q, type: 'ANIME' } })
      }),
      fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ query: gqlQuery, variables: { search: q, type: 'MANGA' } })
      })
    ]);

    if (!animeRes.ok || !mangaRes.ok) {
      setState('❌ Erro ao buscar. Tente novamente.');
      return;
    }

    const [animeData, mangaData] = await Promise.all([animeRes.json(), mangaRes.json()]);
    setState('');

    const animes = animeData?.data?.Page?.media || [];
    const mangas = mangaData?.data?.Page?.media || [];

    // Intercala resultados: anime, manga, anime, manga...
    const results = [];
    const max = Math.max(animes.length, mangas.length);
    for (let i = 0; i < max; i++) {
      if (animes[i]) results.push(animes[i]);
      if (mangas[i]) results.push(mangas[i]);
    }

    if (!results.length) {
      setState('Nenhum resultado encontrado.');
      return;
    }

    const MANGA_FORMATS = ['MANGA', 'ONE_SHOT', 'NOVEL'];

    container.innerHTML = results.map(a => {
      const isManga = a.type === 'MANGA' || MANGA_FORMATS.includes(a.format);
      const img     = a.coverImage?.extraLarge || a.coverImage?.large || '';
      const title   = a.title?.romaji || a.title?.english || '';
      const year    = a.startDate?.year || '—';
      const count   = isManga
        ? (a.chapters ? `${a.chapters} caps` : '—')
        : (a.episodes ? `${a.episodes} eps` : '—');

      const dataAttr = encodeURIComponent(JSON.stringify({
        anilistId: a.id,
        title,
        img,
        isManga,
        studio:   a.studios?.nodes?.[0]?.name || '',
        genres:   (a.genres || []).map(translateAL),
        epTotal:  isManga ? (a.chapters || 0) : (a.episodes || 0),
      }));

      const leituraTag = isManga
        ? `<span class="result-leitura-tag">leitura</span>`
        : '';

      return `
        <div class="result-card" onclick="openSmodal('${dataAttr}')">
          <div class="result-thumb">
            ${img ? `<img src="${img}" style="width:100%;height:100%;object-fit:cover;" />` : '🎌'}
          </div>
          <div class="result-info">
            <div class="result-title-row">
              <span class="result-title" title="${title}">${title}</span>
              ${leituraTag}
            </div>
            <div class="result-year">${year} · ${count}</div>
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

  // Adapta campos para leitura vs anime
  const isManga = !!smodalData.isManga;
  const listSel = document.getElementById('smodalListSelector');
  const epsLabel = document.getElementById('smodalEpsLabel');
  const seasonSection = document.getElementById('smodalSeasonSection');

  if (isManga) {
    listSel.innerHTML = `
      <div class="smodal-list-opt" data-status="reading" onclick="setSmodalStatus('reading')">Lendo</div>
      <div class="smodal-list-opt" data-status="read"    onclick="setSmodalStatus('read')">Lido</div>
      <div class="smodal-list-opt" data-status="toread"  onclick="setSmodalStatus('toread')">Para ler</div>`;
    if (epsLabel) epsLabel.textContent = 'caps';
    if (seasonSection) seasonSection.style.display = 'none';
  } else {
    listSel.innerHTML = `
      <div class="smodal-list-opt" data-status="watching" onclick="setSmodalStatus('watching')">Assistindo</div>
      <div class="smodal-list-opt" data-status="watched"  onclick="setSmodalStatus('watched')">Assistidos</div>
      <div class="smodal-list-opt" data-status="plan"     onclick="setSmodalStatus('plan')">Para assistir</div>`;
    if (epsLabel) epsLabel.textContent = 'eps';
    if (seasonSection) seasonSection.style.display = '';
  }

  document.getElementById('smodalOverlay').classList.add('open');
}

function closeSmodal() {
  document.getElementById('smodalOverlay').classList.remove('open');
  document.getElementById('smodalDuplicateWarning').style.display = 'none';
}

function renderSmodalStars() {
  document.getElementById('smodalStars').innerHTML = Array.from({ length: 5 }, (_, i) => {
    let fillCls = '';
    if (smodalRating >= i + 1) fillCls = ' filled';
    else if (smodalRating >= i + 0.5) fillCls = ' half';
    return `<span class="smodal-star${fillCls}" data-star="${i + 1}"
      onmouseenter="hoverSmodalRating(${i + 1}, event)"
      onmouseleave="unhoverSmodalRating()"
      onclick="setSmodalRating(${i + 1}, event)">★</span>`;
  }).join('');
}

function setSmodalRating(fullValue, event) {
  let value = fullValue;
  if (event) {
    const rect = event.target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    if (x < rect.width / 2) value = fullValue - 0.5;
  }
  if (smodalRating === value) value = 0;
  smodalRating = value;
  renderSmodalStars();
}

function hoverSmodalRating(fullValue, event) {
  const rect = event.target.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const hoverVal = x < rect.width / 2 ? fullValue - 0.5 : fullValue;
  document.querySelectorAll('#smodalStars .smodal-star').forEach((s, i) => {
    s.classList.remove('filled', 'half', 'hover-filled', 'hover-half');
    if (hoverVal >= i + 1) s.classList.add('hover-filled');
    else if (hoverVal >= i + 0.5) s.classList.add('hover-half');
  });
}

function unhoverSmodalRating() {
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

  const listLabels = {
    watching: 'Assistindo', watched: 'Assistidos', plan: 'Para assistir',
    reading: 'Lendo', read: 'Lido', toread: 'Para ler'
  };
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
    studio: smodalData.studio || '',
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

  // Navega para a página correta conforme o tipo
  const isMangaStatus = ['reading', 'read', 'toread'].includes(smodalStatus);
  if (isMangaStatus) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-leituras')?.classList.add('active');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector('[data-page="leituras"]')?.classList.add('active');
    document.querySelectorAll('.bottom-nav-item').forEach(b => {
      b.classList.toggle('active', b.dataset.page === 'leituras');
    });
  } else {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-inicio')?.classList.add('active');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector('[data-page="inicio"]')?.classList.add('active');
    document.querySelectorAll('.bottom-nav-item').forEach(b => {
      b.classList.toggle('active', b.dataset.page === 'inicio');
    });
  }

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
