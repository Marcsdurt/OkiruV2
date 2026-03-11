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

  btn.textContent = 'Gerando...';
  btn.disabled = true;

  html2canvas(card, {
    scale: 4,
    backgroundColor: '#0A0A0A',
    allowTaint: true,
    useCORS: false,
    logging: false,
  }).then(canvas => {
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `okiru-${(anime?.name || 'card').replace(/\s+/g,'-').toLowerCase()}.png`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, 'image/png');
  }).finally(() => {
    btn.textContent = 'Download da imagem';
    btn.disabled = false;
  });
}