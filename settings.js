// ─── IMPORT / EXPORT ───
function exportData() {
  const payload = {
    version: 2,
    exportedAt: new Date().toISOString(),
    animes: mockAnimes,
    favSlots: favSlots,
    profile: {
      name: localStorage.getItem('okiru_profile_name') || '',
      avatar: localStorage.getItem('okiru_profile_avatar') || '',
    },
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `okiru-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importData(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const feedback = document.getElementById('importFeedback');
    try {
      const data = JSON.parse(ev.target.result);

      if (!data.animes || !Array.isArray(data.animes)) {
        feedback.textContent = '❌ Arquivo inválido — estrutura não reconhecida.';
        feedback.style.color = '#e55';
        feedback.style.display = 'block';
        return;
      }

      mockAnimes.length = 0;
      data.animes.forEach(a => mockAnimes.push(a));
      saveAnimes();

      if (data.favSlots && Array.isArray(data.favSlots)) {
        data.favSlots.forEach((v, i) => { favSlots[i] = v; });
        saveFavSlots();
      }

      if (data.profile) {
        if (data.profile.name) localStorage.setItem('okiru_profile_name', data.profile.name);
        if (data.profile.avatar) localStorage.setItem('okiru_profile_avatar', data.profile.avatar);
      }

      renderLists();
      loadProfileData();
      updateSidebarProfile();

      feedback.textContent = '✓ Dados importados com sucesso!';
      feedback.style.color = '#4ade80';
      feedback.style.display = 'block';

    } catch {
      feedback.textContent = '❌ Erro ao ler o arquivo. Verifique se é um JSON válido.';
      feedback.style.color = '#e55';
      feedback.style.display = 'block';
    }
    e.target.value = '';
  };
  reader.readAsText(file);
}

// ─── ACESSIBILIDADE — FONT SIZE ───
function applyFontSize(val) {
  val = parseInt(val);
  const size = 14 + (val / 100) * 6;
  document.documentElement.style.fontSize = size + 'px';
  localStorage.setItem('okiru_font_size', val);
  const valueEl   = document.getElementById('fontSizeValue');
  const previewEl = document.getElementById('fontSizePreview');
  if (valueEl) valueEl.textContent = val + '%';
  if (previewEl) previewEl.style.fontSize = (size / 14).toFixed(4).replace(/\.?0+$/, '') + 'rem';
  const slider = document.getElementById('fontSizeSlider');
  if (slider && parseInt(slider.value) !== val) slider.value = val;
}

// ─── TEMA ───
function setTheme(mode) {
  localStorage.setItem('okiru_theme', mode);
  applyTheme(mode);
  document.getElementById('radio-dark').classList.toggle('active', mode === 'dark');
  document.getElementById('radio-light').classList.toggle('active', mode === 'light');
  document.getElementById('tema-dark').classList.toggle('selected', mode === 'dark');
  document.getElementById('tema-light').classList.toggle('selected', mode === 'light');
}

function applyTheme(mode) {
  if (mode === 'dark') {
    document.documentElement.style.setProperty('--bg', '#0A0A0A');
    document.documentElement.style.setProperty('--text', '#F5F5F5');
    document.documentElement.style.setProperty('--secondary', '#888');
    document.documentElement.style.setProperty('--border', '#2a2a2a');
    document.documentElement.style.setProperty('--hover', '#1a1a1a');
  } else {
    document.documentElement.style.setProperty('--bg', '#FFFFFF');
    document.documentElement.style.setProperty('--text', '#0A0A0A');
    document.documentElement.style.setProperty('--secondary', '#6B6B6B');
    document.documentElement.style.setProperty('--border', '#E5E5E5');
    document.documentElement.style.setProperty('--hover', '#F5F5F5');
  }
  const logo = document.getElementById('sidebarLogomarca');
  if (logo) logo.src = mode === 'dark'
    ? './favicons/okiruv2-logomarca-black.png'
    : './favicons/okiruv2-logomarca-white.png';
}
