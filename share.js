// ─── SHARE ───────────────────────────────────────────────────────────────────

function openSharePage() {
  const page = document.getElementById('page-share');
  const detail = document.getElementById('page-detail');
  if (!page || !detail) return;

  detail.classList.remove('active');
  page.classList.add('active');
  document.querySelector('.bottom-nav')?.classList.add('hidden-for-share');

  renderShareCard();
}

function closeSharePage() {
  const page = document.getElementById('page-share');
  const detail = document.getElementById('page-detail');
  if (!page || !detail) return;

  page.classList.remove('active');
  detail.classList.add('active');
  document.querySelector('.bottom-nav')?.classList.remove('hidden-for-share');
}

function renderShareCard() {
  const anime = mockAnimes.find(a => a.id === currentAnimeId);
  if (!anime) return;

  const profileName   = localStorage.getItem('okiru_profile_name') || '';
  const profileAvatar = localStorage.getItem('okiru_profile_avatar') || '';

  const avatarEl = document.getElementById('scAvatar');
  if (avatarEl) {
    avatarEl.innerHTML = profileAvatar
      ? `<img src="${profileAvatar}" />`
      : `<div style="width:100%;height:100%;background:#2a2a2a;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#888;font-size:14px;font-weight:700;">${(profileName || '?')[0].toUpperCase()}</div>`;
  }

  const nameEl = document.getElementById('scName');
  if (nameEl) nameEl.textContent = profileName;

  const coverEl = document.getElementById('scCover');
  if (coverEl) {
    const imgSrc = anime.imgBase64 || anime.img || '';
    coverEl.innerHTML = imgSrc
      ? `<img src="${imgSrc}" />`
      : `<div style="width:100%;height:100%;background:#1a1a1a;display:flex;align-items:center;justify-content:center;color:#444;font-size:40px;">🎌</div>`;
  }

  const titleEl = document.getElementById('scTitle');
  if (titleEl) titleEl.textContent = anime.name;

  const studioEl = document.getElementById('scStudio');
  if (studioEl) {
    studioEl.style.display = anime.studio ? '' : 'none';
    studioEl.innerHTML = `studio <strong>${anime.studio || ''}</strong>`;
  }

  const starsEl = document.getElementById('scStars');
  if (starsEl) {
    const rating = anime.rating || 0;
    starsEl.innerHTML = Array.from({length: 5}, (_, i) =>
      `<span style="color:${i < rating ? '#FACC15' : '#333'}">★</span>`
    ).join('');
  }
}
