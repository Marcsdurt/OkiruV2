// ─── SHARE ───
function toggleShareDropdown(e) {
  e.stopPropagation();
  document.getElementById('shareDropdown').classList.toggle('open');
}

document.addEventListener('click', () => {
  document.getElementById('shareDropdown')?.classList.remove('open');
});

function openSharePage() {
  document.getElementById('shareDropdown').classList.remove('open');
  document.getElementById('page-detail').classList.remove('active');
  document.getElementById('page-share').classList.add('active');
  // Esconde bottom nav no mobile
  document.querySelector('.bottom-nav')?.classList.add('hidden-for-share');
  renderShareCard();
}

function closeSharePage() {
  document.getElementById('page-share').classList.remove('active');
  document.getElementById('page-detail').classList.add('active');
  // Restaura bottom nav
  document.querySelector('.bottom-nav')?.classList.remove('hidden-for-share');
}

function renderShareCard() {
  const anime = mockAnimes.find(a => a.id === currentAnimeId);
  if (!anime) return;

  const profileName   = localStorage.getItem('okiru_profile_name') || '';
  const profileAvatar = localStorage.getItem('okiru_profile_avatar') || '';

  const avatarEl = document.getElementById('scAvatar');
  avatarEl.innerHTML = profileAvatar
    ? `<img src="${profileAvatar}" />`
    : `<div style="width:100%;height:100%;background:#2a2a2a;display:flex;align-items:center;justify-content:center;color:#888;font-size:14px;font-weight:700;">${(profileName || '?')[0].toUpperCase()}</div>`;

  document.getElementById('scName').textContent = profileName;

  const coverEl = document.getElementById('scCover');
  const imgSrc = anime.imgBase64 || anime.img || '';
  coverEl.innerHTML = imgSrc
    ? `<img src="${imgSrc}" />`
    : `<div style="width:100%;height:100%;background:#1a1a1a;display:flex;align-items:center;justify-content:center;color:#444;font-size:40px;">🎌</div>`;

  document.getElementById('scTitle').textContent = anime.name;

  const rating = anime.rating || 0;
  document.getElementById('scStars').innerHTML = Array.from({length:5}, (_,i) =>
    `<span style="color:${i < rating ? '#FACC15' : '#333'}">★</span>`
  ).join('');
}

function downloadShareCard() {
  const card  = document.getElementById('shareCard');
  const anime = mockAnimes.find(a => a.id === currentAnimeId);
  const btn   = document.getElementById('shareDownloadBtn');
  const filename = `okiru-${(anime?.name || 'card').replace(/\s+/g,'-').toLowerCase()}.png`;

  btn.textContent = 'Gerando...';
  btn.disabled = true;

  html2canvas(card, {
    scale: 4,
    backgroundColor: '#0A0A0A',
    allowTaint: true,
    useCORS: false,
    logging: false,
  }).then(canvas => {
    canvas.toBlob(async blob => {
      // Opção A: Web Share API (funciona no mobile iOS/Android)
      if (navigator.canShare && navigator.canShare({ files: [new File([blob], filename, { type: 'image/png' })] })) {
        try {
          await navigator.share({
            files: [new File([blob], filename, { type: 'image/png' })],
            title: anime?.name || 'Okiru',
          });
          return;
        } catch (err) {
          // usuário cancelou o share — não faz nada
          if (err.name === 'AbortError') return;
          // outro erro — cai no fallback
        }
      }

      // Fallback B: abre em nova aba (usuário segura e salva no mobile)
      const url = URL.createObjectURL(blob);
      const tab = window.open(url, '_blank');
      if (!tab) {
        // Fallback C: se popup bloqueado, cria <img> inline na tela
        showInlineImage(url, filename);
      } else {
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      }
    }, 'image/png');
  }).finally(() => {
    btn.textContent = 'Salvar imagem';
    btn.disabled = false;
  });
}

// Fallback C: mostra a imagem gerada na própria tela com instrução de salvar
function showInlineImage(url, filename) {
  const existing = document.getElementById('shareInlineOverlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'shareInlineOverlay';
  overlay.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,0.92);
    z-index:9999;display:flex;flex-direction:column;
    align-items:center;justify-content:center;gap:16px;padding:24px;
  `;

  const hint = document.createElement('p');
  hint.textContent = 'Segure a imagem para salvar';
  hint.style.cssText = 'color:#aaa;font-size:14px;font-family:DM Sans,sans-serif;margin:0;';

  const img = document.createElement('img');
  img.src = url;
  img.style.cssText = 'max-width:100%;max-height:70dvh;border-radius:12px;display:block;';

  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Fechar';
  closeBtn.style.cssText = `
    background:none;border:1px solid #444;color:#aaa;
    padding:10px 28px;border-radius:8px;font-size:14px;
    font-family:DM Sans,sans-serif;cursor:pointer;
  `;
  closeBtn.onclick = () => {
    overlay.remove();
    URL.revokeObjectURL(url);
  };

  overlay.appendChild(hint);
  overlay.appendChild(img);
  overlay.appendChild(closeBtn);
  document.body.appendChild(overlay);
}