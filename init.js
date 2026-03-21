// ─── MOBILE TABS (Início) ───
let activeMobileTab = 'watching';

function initMobileTabs() {
  const page = document.getElementById('page-inicio');
  if (!page || page.querySelector('.mobile-tabs')) return;

  const tabs = [
    { key: 'watching', label: 'Assistindo' },
    { key: 'watched',  label: 'Assistidos'  },
    { key: 'plan',     label: 'Para assistir' },
  ];

  const tabBar = document.createElement('div');
  tabBar.className = 'mobile-tabs';
  tabBar.id = 'mobileTabs';

  const panel = document.createElement('div');
  panel.id = 'mobileListPanel';
  panel.style.cssText = 'border:1px solid var(--border);border-radius:4px;overflow:hidden;';

  tabs.forEach((t, i) => {
    const btn = document.createElement('div');
    btn.className = 'mobile-tab' + (i === 0 ? ' active' : '');
    btn.textContent = t.label;
    btn.dataset.key = t.key;
    btn.addEventListener('click', () => {
      document.querySelectorAll('#mobileTabs .mobile-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeMobileTab = t.key;
      renderMobileList();
    });
    tabBar.appendChild(btn);
  });

  page.appendChild(tabBar);
  page.appendChild(panel);
}

function renderMobileList() {
  const panel = document.getElementById('mobileListPanel');
  if (!panel) return;
  const src = document.getElementById('list-' + activeMobileTab);
  if (!src) return;
  panel.innerHTML = src.innerHTML || '<div style="padding:24px;text-align:center;color:var(--secondary);font-size:13px;">Nenhum anime aqui</div>';
  panel.querySelectorAll('.anime-item').forEach(el => {
    const id = el.dataset.id;
    if (id) el.addEventListener('click', () => openDetail(Number(id)));
  });
}

// ─── MOBILE TABS (Leituras) ───
let activeMobileTabLeituras = 'reading';

function initMobileTabsLeituras() {
  const page = document.getElementById('page-leituras');
  if (!page || page.querySelector('.mobile-tabs-leituras')) return;

  const tabs = [
    { key: 'reading', label: 'Lendo' },
    { key: 'read',    label: 'Lidos' },
    { key: 'toread',  label: 'Para ler' },
  ];

  const tabBar = document.createElement('div');
  tabBar.className = 'mobile-tabs mobile-tabs-leituras';
  tabBar.id = 'mobileTabsLeituras';

  const panel = document.createElement('div');
  panel.id = 'mobileListPanelLeituras';
  panel.style.cssText = 'border:1px solid var(--border);border-radius:4px;overflow:hidden;';

  tabs.forEach((t, i) => {
    const btn = document.createElement('div');
    btn.className = 'mobile-tab' + (i === 0 ? ' active' : '');
    btn.textContent = t.label;
    btn.dataset.key = t.key;
    btn.addEventListener('click', () => {
      document.querySelectorAll('#mobileTabsLeituras .mobile-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeMobileTabLeituras = t.key;
      renderMobileListLeituras();
    });
    tabBar.appendChild(btn);
  });

  page.appendChild(tabBar);
  page.appendChild(panel);
}

function renderMobileListLeituras() {
  const panel = document.getElementById('mobileListPanelLeituras');
  if (!panel) return;
  const src = document.getElementById('list-' + activeMobileTabLeituras);
  if (!src) return;
  panel.innerHTML = src.innerHTML || '<div style="padding:24px;text-align:center;color:var(--secondary);font-size:13px;">Nenhuma leitura aqui</div>';
  panel.querySelectorAll('.anime-item').forEach(el => {
    const id = el.dataset.id;
    if (id) el.addEventListener('click', () => openDetail(Number(id)));
  });
}

// ─── INIT ───
const savedTheme = localStorage.getItem('okiru_theme') || 'light';
applyTheme(savedTheme);
setTimeout(() => setTheme(savedTheme), 0);

const savedFontSize = parseInt(localStorage.getItem('okiru_font_size') || '0');
applyFontSize(savedFontSize);

renderLists();
loadProfileData();
updateSidebarProfile();
initMobileTabs();
renderMobileList();
initMobileTabsLeituras();
renderMobileListLeituras();

function applyMobileVisibility() {
  const isMobile = window.innerWidth <= 640;
  const tabs        = document.getElementById('mobileTabs');
  const panel       = document.getElementById('mobileListPanel');
  const tabsL       = document.getElementById('mobileTabsLeituras');
  const panelL      = document.getElementById('mobileListPanelLeituras');
  if (tabs)   tabs.style.display   = isMobile ? 'flex'  : 'none';
  if (panel)  panel.style.display  = isMobile ? 'block' : 'none';
  if (tabsL)  tabsL.style.display  = isMobile ? 'flex'  : 'none';
  if (panelL) panelL.style.display = isMobile ? 'block' : 'none';
}
applyMobileVisibility();
window.addEventListener('resize', applyMobileVisibility);

document.addEventListener('okiru:listsUpdated', () => {
  renderMobileList();
  renderMobileListLeituras();
});

// ─── PWA SERVICE WORKER ───
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
