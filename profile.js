// ─── PROFILE ───
function loadProfileData() {
  const name = localStorage.getItem('okiru_profile_name') || '';
  const avatar = localStorage.getItem('okiru_profile_avatar') || '';
  if (name) document.getElementById('profileName').value = name;
  if (avatar) {
    document.getElementById('profileAvatar').src = avatar;
    document.getElementById('profileAvatar').style.display = 'block';
    document.getElementById('profileAvatarPlaceholder').style.display = 'none';
  }
}

function updateSidebarProfile() {
  const name = localStorage.getItem('okiru_profile_name') || '';
  const avatar = localStorage.getItem('okiru_profile_avatar') || '';
  const bar = document.getElementById('sidebarProfile');
  if (name.length >= 3 && avatar) {
    document.getElementById('sidebarName').textContent = name;
    document.getElementById('sidebarAvatar').innerHTML = `<img src="${avatar}" />`;
    bar.style.display = 'flex';
  } else {
    bar.style.display = 'none';
  }
}

function loadAvatar(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const data = ev.target.result;
    localStorage.setItem('okiru_profile_avatar', data);
    document.getElementById('profileAvatar').src = data;
    document.getElementById('profileAvatar').style.display = 'block';
    document.getElementById('profileAvatarPlaceholder').style.display = 'none';
    updateSidebarProfile();
  };
  reader.readAsDataURL(file);
}

function validateProfileName(input) {
  const hint = document.getElementById('profileNameHint');
  const v = input.value;
  if (v.length === 0) { hint.textContent = 'Min. 3 caracteres, máx. 15'; hint.className = 'profile-name-hint'; }
  else if (v.length < 3) { hint.textContent = 'Mínimo 3 caracteres'; hint.className = 'profile-name-hint error'; }
  else { hint.textContent = '✓'; hint.className = 'profile-name-hint'; }
}

function saveProfileName() {
  const val = document.getElementById('profileName').value.trim();
  if (val.length >= 3) {
    localStorage.setItem('okiru_profile_name', val);
    updateSidebarProfile();
  }
}

// ─── PROFILE FAVORITES SLOTS ───
let favAdjustMode = false;
let favSlots = JSON.parse(localStorage.getItem('okiru_fav_slots') || 'null') || [null,null,null,null,null,null];

function saveFavSlots() {
  localStorage.setItem('okiru_fav_slots', JSON.stringify(favSlots));
}

function toggleFavAdjust() {
  favAdjustMode = !favAdjustMode;
  renderProfileFavorites();
  const btn = document.querySelector('.profile-fav-btn[data-adjust]');
  if (btn) btn.style.background = favAdjustMode ? 'var(--hover)' : '';
}

function openFavSlotPicker(slotIdx, event) {
  event.stopPropagation();
  if (!favAdjustMode) return;

  const occupiedIds = favSlots.filter((id, i) => id !== null && i !== slotIdx);
  const available = mockAnimes.filter(a => a.favorite && !occupiedIds.includes(a.id));

  const existing = document.getElementById('favPickerPopup');
  if (existing) existing.remove();

  const picker = document.createElement('div');
  picker.id = 'favPickerPopup';
  picker.className = 'fav-slot-picker';

  picker.innerHTML =
    (!available.length ? `<div class="fav-picker-empty">Nenhum favorito disponível</div>` :
      available.map(a => `
        <div class="fav-picker-item" onclick="assignFavSlot(${slotIdx},${a.id},event)">
          <div class="fav-picker-thumb">${a.img ? `<img src="${a.img}"/>` : '—'}</div>
          <span class="fav-picker-name">${a.name}</span>
        </div>`).join('')) +
    `<div class="fav-picker-item fav-picker-clear" onclick="clearFavSlot(${slotIdx},event)">— Limpar slot</div>`;

  const grid = document.getElementById('profileFavorites');
  const card = grid.children[slotIdx];
  const rect = card.getBoundingClientRect();
  picker.style.position = 'fixed';
  picker.style.top = rect.top + 'px';
  picker.style.left = (rect.right + 8) + 'px';
  picker.style.zIndex = '500';

  document.body.appendChild(picker);

  setTimeout(() => {
    document.addEventListener('click', closeFavPickerOutside);
  }, 0);
}

function closeFavPickerOutside(e) {
  const picker = document.getElementById('favPickerPopup');
  if (picker && !picker.contains(e.target)) {
    picker.remove();
    document.removeEventListener('click', closeFavPickerOutside);
  }
}

function assignFavSlot(slotIdx, animeId, event) {
  if (event) event.stopPropagation();
  favSlots[slotIdx] = animeId;
  saveFavSlots();
  const picker = document.getElementById('favPickerPopup');
  if (picker) picker.remove();
  document.removeEventListener('click', closeFavPickerOutside);
  renderProfileFavorites();
}

function clearFavSlot(slotIdx, event) {
  if (event) event.stopPropagation();
  favSlots[slotIdx] = null;
  saveFavSlots();
  const picker = document.getElementById('favPickerPopup');
  if (picker) picker.remove();
  document.removeEventListener('click', closeFavPickerOutside);
  renderProfileFavorites();
}

function renderProfileFavorites() {
  const grid = document.getElementById('profileFavorites');
  if (!grid) return;

  grid.innerHTML = favSlots.map((id, i) => {
    const a = id !== null ? mockAnimes.find(x => x.id === id) : null;
    const adjustOverlay = favAdjustMode
      ? `<div class="fav-adjust-overlay" onclick="openFavSlotPicker(${i},event)">ajustar</div>`
      : '';

    if (a) return `
      <div class="fav-card" style="position:relative;">
        ${adjustOverlay}
        <div class="fav-card-thumb">${a.img ? `<img src="${a.img}" />` : '—'}</div>
        <div class="fav-card-info">
          <div class="fav-card-name" title="${a.name}">${a.name}</div>
          <div class="fav-card-stars">
            ${Array.from({length:5},(_,j)=>`<span class="fav-card-star${j<a.rating?' filled':''}">★</span>`).join('')}
          </div>
        </div>
      </div>`;

    return `
      <div class="fav-empty-slot" style="position:relative;">
        ${adjustOverlay}
        ♡
      </div>`;
  }).join('');
}
