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
      document.querySelectorAll('.mobile-tab').forEach(b => b.classList.remove('active'));
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
    if (id) el.onclick = () => openDetail(Number(id));
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

function applyMobileVisibility() {
  const isMobile = window.innerWidth <= 640;
  const tabs = document.getElementById('mobileTabs');
  const panel = document.getElementById('mobileListPanel');
  if (tabs)  tabs.style.display  = isMobile ? 'flex'  : 'none';
  if (panel) panel.style.display = isMobile ? 'block' : 'none';
}
applyMobileVisibility();
window.addEventListener('resize', applyMobileVisibility);

document.addEventListener('okiru:listsUpdated', renderMobileList);

// ─── PWA SERVICE WORKER ───
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
