// ─── SHARE ───────────────────────────────────────────────────────────────────

// ── Carrega imagem sem contaminar o canvas ────────────────────────────────────
// Estratégia em cascata:
// 1. base64 já salvo → sem restrição nenhuma
// 2. <img> do DOM já carregado → desenha num offscreen canvas e exporta como base64
// 3. URL com crossOrigin anonymous → funciona se o servidor permitir
// Nunca usa fetch direto (AniList bloqueia CORS em fetch).
function _loadImgSafe(src) {
  return new Promise((resolve, reject) => {
    if (!src) return reject(new Error('no src'));

    // 1. Base64 — carrega diretamente, sem CORS
    if (src.startsWith('data:')) {
      const img = new Image();
      img.onload  = () => resolve(img);
      img.onerror = () => reject(new Error('base64 load failed'));
      img.src = src;
      return;
    }

    // 2. Tenta roubar o pixel data da <img> do DOM que já está carregada.
    //    O browser carregou normalmente (sem CORS), então desenhamos ela num
    //    offscreen canvas e exportamos como base64 — isso funciona porque
    //    o offscreen nunca é exposto ao DOM com crossOrigin misto.
    const domImg = document.getElementById('scMainImg');
    if (domImg && domImg.complete && domImg.naturalWidth > 0) {
      try {
        const off = document.createElement('canvas');
        off.width  = domImg.naturalWidth;
        off.height = domImg.naturalHeight;
        off.getContext('2d').drawImage(domImg, 0, 0);
        const b64 = off.toDataURL('image/jpeg', 0.92);
        // Salva no objeto para próximas vezes
        const anime = mockAnimes.find(a => a.id === currentAnimeId);
        if (anime && !anime.imgBase64) { anime.imgBase64 = b64; saveAnimes(); }
        const img2 = new Image();
        img2.onload  = () => resolve(img2);
        img2.onerror = () => reject(new Error('b64 round-trip failed'));
        img2.src = b64;
        return;
      } catch (_) {
        // domImg veio de URL externa e contaminou — cai pro fallback
      }
    }

    // 3. Tenta crossOrigin anonymous (funciona só se o servidor mandar CORS headers)
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => resolve(img);
    img.onerror = () => reject(new Error('crossOrigin load failed'));
    img.src = src + (src.includes('?') ? '&' : '?') + '_t=' + Date.now();
  });
}

function _roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function _drawCover(ctx, img, x, y, w, h) {
  const iR = img.naturalWidth / img.naturalHeight;
  const bR = w / h;
  let sx, sy, sw, sh;
  if (iR > bR) {
    sh = img.naturalHeight; sw = sh * bR;
    sx = (img.naturalWidth - sw) / 2; sy = 0;
  } else {
    sw = img.naturalWidth; sh = sw / bR;
    sx = 0; sy = (img.naturalHeight - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function _fillTextSpaced(ctx, text, x, y, spacing) {
  let cx = x;
  for (const ch of text) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + spacing;
  }
}

function _wrapText(ctx, text, x, y, maxW, lineH, maxLines) {
  const words = text.split(' ');
  let line = '', count = 0;
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxW && line) {
      if (count >= maxLines - 1) { ctx.fillText(line + '…', x, y + count * lineH); return; }
      ctx.fillText(line, x, y + count * lineH);
      line = word; count++;
    } else { line = test; }
  }
  if (line && count < maxLines) ctx.fillText(line, x, y + count * lineH);
}

async function downloadShareCard() {
  const anime = mockAnimes.find(a => a.id === currentAnimeId);
  if (!anime) return;

  const btn = document.getElementById('shareDownloadBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Gerando...'; }

  try {
    // ── Dimensões espelhando o CSS ────────────────────────────────────────────
    // CSS: --cw = W, --ch = H (card 9:16, mas W é a base de todos os cálculos)
    const W = 540, H = Math.round(W * 16 / 9), SC = 4;
    const canvas = document.createElement('canvas');
    canvas.width  = W * SC;
    canvas.height = H * SC;
    const ctx = canvas.getContext('2d');
    ctx.scale(SC, SC);

    const imgSrc = anime.imgBase64 || anime.img || '';
    const cover  = await _loadImgSafe(imgSrc).catch(() => null);

    // ── Fundo desfocado (.sc-bg) ─────────────────────────────────────────────
    ctx.save();
    _roundRect(ctx, 0, 0, W, H, 18);
    ctx.clip();
    if (cover) {
      const off = document.createElement('canvas');
      off.width = W; off.height = H;
      _drawCover(off.getContext('2d'), cover, 0, 0, W, H);
      ctx.filter = 'blur(20px) brightness(0.45)';
      ctx.drawImage(off, -W * 0.025, -H * 0.025, W * 1.05, H * 1.05);
      ctx.filter = 'none';
    } else {
      ctx.fillStyle = '#111'; ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();

    // ── Layout: sc-content tem padding-top = W * 0.098 ───────────────────────
    // sc-img-wrapper: width = W*0.786, height = W*1.186, align-self: center
    const IW = W * 0.786;
    const IH = W * 1.186;   // CSS: height = calc(var(--cw) * 1.186) onde --cw = W
    const IX = (W - IW) / 2;
    const IY = W * 0.098;   // padding-top do sc-content

    // ── Capa (.sc-img-wrapper) ───────────────────────────────────────────────
    ctx.save();
    _roundRect(ctx, IX, IY, IW, IH, IW * 0.069);
    ctx.clip();
    if (cover) {
      _drawCover(ctx, cover, IX, IY, IW, IH);
    } else {
      ctx.fillStyle = '#333'; ctx.fillRect(IX, IY, IW, IH);
    }
    // Sombra interna inferior (::after: inset-shadow via gradiente)
    const grad = ctx.createLinearGradient(0, IY + IH * 0.42, 0, IY + IH);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.92)');
    ctx.fillStyle = grad; ctx.fillRect(IX, IY, IW, IH);
    ctx.restore();

    // ── Textos sobre a capa (posições absolutas relativas a IY+IH = fundo da capa)
    const statusColor = document.getElementById('scBadgeStatus')?.style.color || '#fff';
    const accentColor = document.getElementById('scBadgeGenre')?.style.background || '#c8b99a';
    const mediaColor  = document.getElementById('scMediaTag')?.style.background || '#333';

    // Estrelas: bottom = W*0.195, left = W*0.044, font = W*0.036, gap = W*0.012
    const starSz  = W * 0.036;
    const starY   = IY + IH - W * 0.195;
    const starX0  = IX + W * 0.044;
    ctx.font = `${starSz}px sans-serif`;
    ctx.textBaseline = 'middle';
    const rating = anime.rating || 0;
    for (let i = 0; i < 5; i++) {
      const starX = starX0 + i * (starSz + W * 0.012);
      if (rating >= i + 1) {
        // Full star
        ctx.fillStyle = statusColor;
        ctx.fillText('★', starX, starY);
      } else if (rating >= i + 0.5) {
        // Half star: draw empty then clip left half filled
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillText('★', starX, starY);
        ctx.save();
        ctx.beginPath();
        ctx.rect(starX, starY - starSz, starSz * 0.55, starSz * 1.2);
        ctx.clip();
        ctx.fillStyle = statusColor;
        ctx.fillText('★', starX, starY);
        ctx.restore();
      } else {
        // Empty star
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillText('★', starX, starY);
      }
    }

    // Título: bottom = W*0.137, left = W*0.048, font = W*0.056, letter-spacing = W*0.011
    ctx.font = `${W * 0.056}px monospace`;
    ctx.fillStyle = statusColor; ctx.textBaseline = 'middle';
    const titleTxt = ((anime.name || '').length > 13 ? anime.name.slice(0, 13) + '…' : anime.name).toUpperCase();
    _fillTextSpaced(ctx, titleTxt, IX + W * 0.048, IY + IH - W * 0.137, W * 0.011);

    // Estúdio: bottom = W*0.082, left = W*0.048, font = W*0.031
    ctx.font = `${W * 0.031}px monospace`;
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.textBaseline = 'middle';
    const studioTxt = [anime._studioDisplay || anime.studio || '', anime._yearDisplay || ''].filter(Boolean).join(' · ');
    ctx.fillText(studioTxt, IX + W * 0.048, IY + IH - W * 0.082);

    // ── Badges (.sc-badges-row): margin-left = W*0.106, margin-top = W*0.046 ─
    // Posição Y: imediatamente após a capa
    const badgeSz  = W * 0.025;
    const badgePX  = W * 0.039, badgePY = W * 0.014;
    const badgeH   = badgeSz + badgePY * 2;
    const badgeX   = W * 0.106;                  // margin-left do sc-badges-row
    const badgeY   = IY + IH + W * 0.046;        // margin-top após a capa

    const statusTxt = document.getElementById('scBadgeStatus')?.textContent?.trim() || '';
    const genreTxt  = document.getElementById('scBadgeGenre')?.textContent?.trim() || '';

    ctx.font = `${badgeSz}px monospace`; ctx.textBaseline = 'middle';

    // Badge status (borda)
    const stW = ctx.measureText(statusTxt).width + badgePX * 2;
    _roundRect(ctx, badgeX, badgeY, stW, badgeH, badgeH / 2);
    ctx.strokeStyle = statusColor; ctx.lineWidth = 0.8; ctx.stroke();
    ctx.fillStyle = statusColor;
    ctx.fillText(statusTxt, badgeX + badgePX, badgeY + badgeH / 2);

    // Badge gênero (fundo), gap = W*0.035
    const gnX = badgeX + stW + W * 0.035;
    const gnW = ctx.measureText(genreTxt).width + badgePX * 2;
    _roundRect(ctx, gnX, badgeY, gnW, badgeH, badgeH / 2);
    ctx.fillStyle = accentColor; ctx.fill();
    ctx.fillStyle = '#000';
    ctx.fillText(genreTxt, gnX + badgePX, badgeY + badgeH / 2);

    // ── Sinopse (.sc-synopsis-wrap): width = W*0.786, align-self: center,
    //    margin-top = W*0.05, font = W*0.025, line-height = 1.6 ──────────────
    const synTxt = (document.getElementById('scSynopsisText')?.textContent || '').replace(/mais$/i, '').trim();
    const synX   = IX;                              // align-self: center → mesmo IX da capa
    const synY   = badgeY + badgeH + W * 0.05;
    const synW   = IW;                              // width = W*0.786 = IW
    if (synTxt) {
      const synSz = W * 0.025;
      ctx.font = `${synSz}px monospace`;
      ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.textBaseline = 'top';
      _wrapText(ctx, synTxt, synX, synY, synW, synSz * 1.6, 3);
    }

    // ── Tag de mídia (.sc-media-tag): margin-left = W*0.106, margin-top = W*0.033
    //    Vem depois da sinopse no fluxo flex ──────────────────────────────────
    const mediaTxt = document.getElementById('scMediaTag')?.textContent?.trim() || '';
    const mediaSz  = W * 0.017;
    const mediaPX  = W * 0.028, mediaPY = W * 0.011;
    ctx.font = `bold ${mediaSz}px monospace`; ctx.textBaseline = 'middle';
    const mW  = ctx.measureText(mediaTxt).width + mediaPX * 2;
    const mH  = mediaSz + mediaPY * 2;
    // Y = após sinopse (3 linhas) + margin-top
    const synLineH = W * 0.025 * 1.6;
    const mediaY   = synY + synLineH * 3 + W * 0.033;
    _roundRect(ctx, badgeX, mediaY, mW, mH, 2);
    ctx.fillStyle = mediaColor; ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText(mediaTxt, badgeX + mediaPX, mediaY + mH / 2);

    // ── Download ──────────────────────────────────────────────────────────────
    const link = document.createElement('a');
    link.download = `okiru-${(anime.name || 'okiru').replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

  } catch (err) {
    console.error('Erro ao gerar card:', err);
    alert('Não foi possível gerar a imagem. Tente tirar um print manual.');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '↓ Baixar card'; }
  }
}


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
  starsEl.innerHTML = Array.from({ length: 5 }, (_, i) => {
    let cls = '';
    if (rating >= i + 1) cls = ' filled';
    else if (rating >= i + 0.5) cls = ' half';
    return `<span class="sc-img-star${cls}">★</span>`;
  }).join('');

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
