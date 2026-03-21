// ─── SHARE ───────────────────────────────────────────────────────────────────

function openSharePage() {
  const page   = document.getElementById('page-share');
  const detail = document.getElementById('page-detail');
  if (!page || !detail) return;
  detail.classList.remove('active');
  page.classList.add('active');
  document.querySelector('.bottom-nav')?.classList.add('hidden-for-share');
  renderShareCard();
}

function closeSharePage() {
  const page   = document.getElementById('page-share');
  const detail = document.getElementById('page-detail');
  if (!page || !detail) return;
  page.classList.remove('active');
  detail.classList.add('active');
  document.querySelector('.bottom-nav')?.classList.remove('hidden-for-share');
  document.getElementById('shareImgActions').style.display = 'none';
  // Reseta o input para permitir selecionar o mesmo arquivo novamente
  document.getElementById('shareImgInput').value = '';
}

// ─── TROCA DE IMAGEM MANUAL ───────────────────────────────────────────────────
function onShareImgChange(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const src = ev.target.result;
    document.getElementById('scMainImg').src = src;
    document.getElementById('scBg').style.backgroundImage = `url('${src}')`;
    // Re-extrai cores com a nova imagem
    const auxImg = new Image();
    auxImg.onload = () => {
      try {
        const { light, dark } = extractColors(auxImg);
        document.getElementById('scImgTitle').style.color = light;
        document.querySelectorAll('.sc-img-star').forEach(s => s.style.color = light);
        const badgeStatus = document.getElementById('scBadgeStatus');
        badgeStatus.style.color       = light;
        badgeStatus.style.borderColor = light;
        document.getElementById('scBadgeGenre').style.background = light;
        document.getElementById('scMediaTag').style.background   = dark;
      } catch { /* ignora erros de canvas */ }
    };
    auxImg.src = src;
  };
  reader.readAsDataURL(file);
}

// ─── BUSCA SINOPSE + ESTÚDIO NA JIKAN (MyAnimeList) ──────────────────────────
async function fetchJikanData(animeName, isManga) {
  const type = isManga ? 'manga' : 'anime';
  const url  = `https://api.jikan.moe/v4/${type}?q=${encodeURIComponent(animeName)}&limit=1`;
  const res  = await fetch(url);
  const data = await res.json();
  const item = data?.data?.[0];
  if (!item) return { synopsis: '', studio: '', year: '' };

  const synopsis = (item.synopsis || '')
    .replace(/\s*\[Written by MAL Rewrite\]/gi, '').trim();

  // Mangás têm "serializations", animes têm "studios"
  const studio = isManga
    ? (item.serializations?.[0]?.name || item.authors?.[0]?.name || '')
    : (item.studios?.[0]?.name || '');

  const year = isManga
    ? (item.published?.prop?.from?.year || '')
    : (item.aired?.prop?.from?.year || item.year || '');

  return { synopsis, studio, year };
}

// ─── TRADUÇÃO VIA MYMEMORY ────────────────────────────────────────────────────
async function translateSynopsis(text) {
  const clean   = text.replace(/<[^>]+>/g, '').replace(/\n/g, ' ').trim();
  const snippet = clean.length > 500 ? clean.slice(0, 497) + '...' : clean;
  try {
    const url  = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(snippet)}&langpair=en|pt-BR`;
    const res  = await fetch(url);
    const data = await res.json();
    return data?.responseData?.translatedText || snippet;
  } catch {
    return snippet;
  }
}

// ─── EXTRAÇÃO DE COR DA IMAGEM ────────────────────────────────────────────────
function isColorful(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max === 0 ? 0 : (max - min) / max;
  const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
  return sat > 0.2 && lum > 0.15 && lum < 0.95;
}

function extractColors(imgEl) {
  const canvas = document.getElementById('scCanvas');
  if (!canvas) return { light: '#fff', dark: '#333' };
  const ctx = canvas.getContext('2d');
  const MAX    = 200;
  let w = imgEl.naturalWidth, h = imgEl.naturalHeight;
  const ratio = Math.min(MAX / w, MAX / h);
  w = Math.floor(w * ratio);
  h = Math.floor(h * ratio);
  canvas.width  = w;
  canvas.height = h;
  ctx.drawImage(imgEl, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;

  let lightL = -1, lightRGB = [255, 255, 255];
  let darkL  = 999, darkRGB  = [60,  20,  80 ];

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (!isColorful(r, g, b)) continue;
    const l = r * 0.299 + g * 0.587 + b * 0.114;
    if (l > lightL) { lightL = l; lightRGB = [r, g, b]; }
    if (l < darkL)  { darkL  = l; darkRGB  = [r, g, b]; }
  }

  return {
    light: `rgb(${lightRGB[0]},${lightRGB[1]},${lightRGB[2]})`,
    dark:  `rgb(${Math.floor(darkRGB[0] * 0.5)},${Math.floor(darkRGB[1] * 0.5)},${Math.floor(darkRGB[2] * 0.5)})`
  };
}

// ─── TRUNCA SINOPSE A 3 LINHAS ────────────────────────────────────────────────
function truncateSynopsis(fullText, accentColor) {
  const el         = document.getElementById('scSynopsisText');
  const lineHeight = parseFloat(getComputedStyle(el).fontSize) * 1.6;
  const maxHeight  = lineHeight * 3;

  el.textContent = fullText;
  if (el.scrollHeight <= maxHeight + 2) return;

  const words = fullText.split(' ');
  let lo = 0, hi = words.length;

  while (lo < hi - 1) {
    const mid = Math.floor((lo + hi) / 2);
    el.innerHTML = words.slice(0, mid).join(' ') + '… ' +
      `<span style="font-weight:bold;color:${accentColor}">mais</span>`;
    if (el.scrollHeight <= maxHeight + 2) lo = mid;
    else hi = mid;
  }

  el.innerHTML = words.slice(0, lo).join(' ') + '… ' +
    `<span style="font-weight:bold;color:${accentColor}">mais</span>`;
}

function statusLabel(status) {
  const map = {
    watching: '🎬 Assistindo',
    watched:  '🎬 Assistido',
    plan:     '📋 Para assistir',
    reading:  '📖 Lendo',
    read:     '📖 Lido',
    toread:   '📋 Para ler',
  };
  return map[status] || status;
}

function mediaTypeLabel(anime) {
  if (isReading(anime)) return 'Leitura';
  return 'Anime Série';
}

// ─── RENDER PRINCIPAL ─────────────────────────────────────────────────────────
async function renderShareCard() {
  const anime = mockAnimes.find(a => a.id === currentAnimeId);
  if (!anime) return;

  // Jikan busca pelo nome — não precisa de anilistId.
  // O aviso só aparece se não houver nem nome.
  const noAnilist = document.getElementById('shareNoAnilist');
  const cardWrap  = document.getElementById('shareCardWrap');

  if (!anime.name) {
    noAnilist.style.display = 'flex';
    cardWrap.style.display  = 'none';
    return;
  }

  noAnilist.style.display = 'none';
  cardWrap.style.display  = 'flex';
  document.getElementById('shareImgActions').style.display = 'flex';
  document.getElementById('shareImgActions').style.flexDirection = 'column';
  document.getElementById('shareImgActions').style.alignItems = 'center';

  // ── Busca dados em paralelo: imagem hi-res (AniList) + sinopse (Jikan/MAL) ──
  const synEl = document.getElementById('scSynopsisText');
  synEl.textContent = 'Carregando sinopse...';

  let synopsis = '';
  let hiResUrl = '';

  await Promise.allSettled([
    // Imagem hi-res via AniList (só a imagem, sem sinopse)
    (async () => {
      if (!anime.anilistId) return;
      const query = `query($id:Int){Media(id:$id){coverImage{extraLarge large}}}`;
      const res   = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: { id: anime.anilistId } })
      });
      const data = await res.json();
      hiResUrl = data?.data?.Media?.coverImage?.extraLarge
              || data?.data?.Media?.coverImage?.large
              || '';
    })(),
    // Sinopse + estúdio via Jikan (MAL)
    (async () => {
      const jikan  = await fetchJikanData(anime.name, isReading(anime));
      synopsis     = jikan.synopsis ? await translateSynopsis(jikan.synopsis) : '';
      // Sobrescreve o estúdio salvo com o da Jikan (mais confiável)
      if (jikan.studio) anime._studioDisplay = jikan.studio;
      anime._yearDisplay = jikan.year || '';
    })(),
  ]);

  // ── Imagem de exibição — prioriza hi-res da AniList, cai pro salvo ──────────
  const displaySrc = hiResUrl || anime.img || anime.imgBase64 || '';
  const mainImg    = document.getElementById('scMainImg');
  const bgEl       = document.getElementById('scBg');

  mainImg.removeAttribute('crossorigin');
  mainImg.src = displaySrc;
  bgEl.style.backgroundImage = `url('${displaySrc}')`;

  // Título e estúdio sobre a capa
  const rawName = anime.name || '';
  const titleText = rawName.length > 13 ? rawName.slice(0, 13) + '…' : rawName;
  document.getElementById('scImgTitle').textContent = titleText;
  const studioName = anime._studioDisplay || anime.studio || '';
  const year  = anime._yearDisplay || '';
  const parts = [];
  if (studioName) parts.push(studioName);
  if (year) parts.push(year);
  document.getElementById('scImgStudio').innerHTML = parts.map((p, i) =>
    i === 0
      ? `<span>${p}</span>`
      : `<span style="opacity:0.5">•</span><span>${p}</span>`
  ).join('');

  // Estrelas de avaliação
  const rating  = anime.rating || 0;
  const starsEl = document.getElementById('scImgStars');
  starsEl.innerHTML = Array.from({ length: 5 }, (_, i) =>
    `<span class="sc-img-star${i < rating ? ' filled' : ''}">${i < rating ? '★' : '☆'}</span>`
  ).join('');

  // Badge de status
  document.getElementById('scBadgeStatus').textContent = statusLabel(anime.status);
  const genre = anime.genres?.[0] || '';
  document.getElementById('scBadgeGenre').textContent  = genre.toUpperCase();

  // Tag de mídia
  document.getElementById('scMediaTag').textContent = mediaTypeLabel(anime);

  // ── Extração de cor via imagem separada com crossorigin ──────────────────────
  // Cria um Image() auxiliar com crossorigin para uso exclusivo no canvas,
  // sem interferir na exibição da tag <img> do card.
  function extractColorsFromUrl(src) {
    return new Promise(resolve => {
      // Tenta primeiro com o base64 (sem restrição CORS)
      if (anime.imgBase64) {
        const auxImg = new Image();
        auxImg.onload = () => {
          try { resolve(extractColors(auxImg)); }
          catch { resolve(null); }
        };
        auxImg.onerror = () => resolve(null);
        auxImg.src = anime.imgBase64;
        return;
      }
      // Sem base64: tenta URL com crossorigin
      const auxImg = new Image();
      auxImg.crossOrigin = 'anonymous';
      auxImg.onload = () => {
        try { resolve(extractColors(auxImg)); }
        catch { resolve(null); }
      };
      auxImg.onerror = () => resolve(null);
      // Adiciona cache-bust mínimo para forçar re-fetch com CORS headers
      auxImg.src = src + (src.includes('?') ? '&' : '?') + '_c=1';
    });
  }

  function applyColors(light, dark) {
    document.getElementById('scImgTitle').style.color = light;
    document.querySelectorAll('.sc-img-star').forEach(s => s.style.color = light);
    const badgeStatus = document.getElementById('scBadgeStatus');
    badgeStatus.style.color       = light;
    badgeStatus.style.borderColor = light;
    document.getElementById('scBadgeGenre').style.background = light;
    document.getElementById('scMediaTag').style.background   = dark;
    if (synopsis) truncateSynopsis(synopsis, light);
    else synEl.textContent = '';
  }

  // Garante que a imagem de exibição está carregada antes de tentar as cores
  const waitForDisplay = new Promise(res => {
    if (mainImg.complete && mainImg.naturalWidth) res();
    else { mainImg.onload = res; mainImg.onerror = res; }
  });

  await waitForDisplay;

  const colors = await extractColorsFromUrl(displaySrc);
  if (colors) {
    applyColors(colors.light, colors.dark);
  } else {
    // Fallback: aplica cores neutras e ainda renderiza sinopse
    applyColors('#ffffff', '#333333');
  }
}
