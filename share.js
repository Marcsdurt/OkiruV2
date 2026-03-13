// ─── SHARE ───────────────────────────────────────────────────────────────────

function openSharePage() {
  const anime = mockAnimes.find(a => a.id === currentAnimeId);
  if (!anime) return;

  document.querySelector('.bottom-nav')?.classList.add('hidden-for-share');

  // Perfil
  const profileName   = localStorage.getItem('okiru_profile_name') || '';
  const profileAvatar = localStorage.getItem('okiru_profile_avatar') || '';

  const avatarEl = document.getElementById('scAvatar');
  if (profileAvatar) {
    avatarEl.innerHTML = `<img src="${profileAvatar}" />`;
  } else if (profileName) {
    avatarEl.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#2a2a2a;color:#888;font-weight:700;font-size:15px;">${profileName[0].toUpperCase()}</div>`;
  } else {
    avatarEl.innerHTML = '';
  }
  document.getElementById('scName').textContent = profileName;

  // Capa
  const coverEl = document.getElementById('scCover');
  const imgSrc = anime.imgBase64 || anime.img || '';
  coverEl.innerHTML = imgSrc
    ? `<img src="${imgSrc}" />`
    : `<div style="width:100%;height:100%;background:#1a1a1a;display:flex;align-items:center;justify-content:center;color:#333;font-size:40px;">🎌</div>`;

  // Studio acima do título: "studio <strong>Nome</strong>"
  const studioEl = document.getElementById('scStudio');
  if (anime.studio && anime.studio !== '—') {
    studioEl.innerHTML = `studio <strong>${anime.studio}</strong>`;
    studioEl.style.display = '';
  } else {
    studioEl.style.display = 'none';
  }

  // Título (truncado via CSS com -webkit-line-clamp)
  document.getElementById('scTitle').textContent = anime.name;

  // Estrelas
  const rating = anime.rating || 0;
  document.getElementById('scStars').innerHTML = Array.from({ length: 5 }, (_, i) =>
    `<span style="color:${i < rating ? '#E8E8E8' : '#2a2a2a'}">★</span>`
  ).join('');

  // Ativa página
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-detail').classList.remove('active');
  document.getElementById('page-share').classList.add('active');
}

function closeSharePage() {
  document.querySelector('.bottom-nav')?.classList.remove('hidden-for-share');
  document.getElementById('page-share').classList.remove('active');
  document.getElementById('page-detail').classList.add('active');
}
