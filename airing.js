// ─── AIRING / CALENDÁRIO DE LANÇAMENTO ───────────────────────────────────────

const WEEKDAY_SHORT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                     'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

let calYear  = new Date().getFullYear();
let calMonth = new Date().getMonth();

function isReadingMode() {
  const anime = mockAnimes.find(a => a.id === currentAnimeId);
  return anime && ['reading','read','toread'].includes(anime.status);
}

// ─── Carrega seção ao mudar de item ──────────────────────────────────────────
function loadAiringSection(anime) {
  const data = anime.airing || {};
  const enabled = !!data.enabled;
  const reading = ['reading','read','toread'].includes(anime.status);

  document.getElementById('airingToggle').checked = enabled;
  document.getElementById('airingBody').style.display = enabled ? '' : 'none';

  if (reading) {
    const pubDateEl = document.getElementById('airingPubDate');
    if (pubDateEl) pubDateEl.value = data.pubDate || '';
  } else {
    if (data.firstDate) document.getElementById('airingFirstDate').value = data.firstDate;
    else document.getElementById('airingFirstDate').value = '';
    const wd = data.weekday !== undefined ? String(data.weekday) : '';
    document.getElementById('airingWeekday').value = wd;
  }

  const today = new Date();
  calYear  = today.getFullYear();
  calMonth = today.getMonth();
  buildCalSelects();
  renderCal(anime);
  updateAiringNextTag(anime);
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
function onAiringToggle() {
  const anime = mockAnimes.find(a => a.id === currentAnimeId);
  if (!anime) return;
  if (!anime.airing) anime.airing = {};
  anime.airing.enabled = document.getElementById('airingToggle').checked;
  document.getElementById('airingBody').style.display = anime.airing.enabled ? '' : 'none';
  saveAnimes();
  updateAiringNextTag(anime);
}

// ─── Campos mudaram ───────────────────────────────────────────────────────────
function onAiringFieldChange() {
  const anime = mockAnimes.find(a => a.id === currentAnimeId);
  if (!anime) return;
  if (!anime.airing) anime.airing = {};
  const reading = ['reading','read','toread'].includes(anime.status);

  if (reading) {
    const pubDateEl = document.getElementById('airingPubDate');
    anime.airing.pubDate = pubDateEl ? pubDateEl.value : '';
  } else {
    const firstDate = document.getElementById('airingFirstDate').value;
    const weekday   = document.getElementById('airingWeekday').value;
    anime.airing.firstDate = firstDate;
    anime.airing.weekday   = weekday !== '' ? parseInt(weekday) : undefined;
    if (firstDate && weekday !== '' && anime.epTotal > 0) {
      autoGenerateEpDates(anime);
    }
  }

  saveAnimes();
  renderCal(anime);
  updateAiringNextTag(anime);
}

// ─── Auto-gera datas semanais ─────────────────────────────────────────────────
function autoGenerateEpDates(anime) {
  if (!anime.airing) return;
  const { firstDate, weekday } = anime.airing;
  if (!firstDate || weekday === undefined) return;
  if (anime.airing.epDates && Object.keys(anime.airing.epDates).length > 0) return;

  const total = anime.epTotal || 0;
  const start = new Date(firstDate + 'T12:00:00');
  const epDates = {};

  for (let i = 1; i <= total; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + (i - 1) * 7);
    const key = d.toISOString().split('T')[0];
    epDates[key] = { ep: i, label: `ep${i}` };
  }
  anime.airing.epDates = epDates;
}

// ─── Badge de próximo lançamento ──────────────────────────────────────────────
function updateAiringNextTag(anime) {
  const tag = document.getElementById('airingNextTag');
  if (!tag) return;

  const data = anime?.airing;
  if (!data?.enabled || !data?.epDates) { tag.style.display = 'none'; return; }

  const today = new Date();
  today.setHours(0,0,0,0);

  let nextKey = null, nextDate = null;
  for (const [dateStr, info] of Object.entries(data.epDates)) {
    const d = new Date(dateStr + 'T00:00:00');
    if (d >= today) {
      if (!nextDate || d < nextDate) { nextDate = d; nextKey = dateStr; }
    }
  }

  if (!nextKey) { tag.style.display = 'none'; return; }

  const info = data.epDates[nextKey];
  const wd   = WEEKDAY_SHORT[nextDate.getDay()];
  tag.textContent = `${info.label} — ${wd}`;
  tag.style.display = '';
}

// ─── Reset ────────────────────────────────────────────────────────────────────
function resetAiringData() {
  const anime = mockAnimes.find(a => a.id === currentAnimeId);
  if (!anime) return;
  const reading = ['reading','read','toread'].includes(anime.status);
  anime.airing = { enabled: true };
  if (!reading) {
    document.getElementById('airingFirstDate').value = '';
    document.getElementById('airingWeekday').value = '';
  } else {
    const pubDateEl = document.getElementById('airingPubDate');
    if (pubDateEl) pubDateEl.value = '';
  }
  saveAnimes();
  renderCal(anime);
  updateAiringNextTag(anime);
}

// ─── CALENDÁRIO: selects de mês/ano ──────────────────────────────────────────
function buildCalSelects() {
  const mSel = document.getElementById('calMonthSel');
  const ySel = document.getElementById('calYearSel');
  if (!mSel || !ySel) return;

  mSel.innerHTML = MONTH_NAMES.map((m, i) =>
    `<option value="${i}" ${i === calMonth ? 'selected' : ''}>${m}</option>`
  ).join('');

  ySel.innerHTML = '';
  for (let y = 2000; y <= 2030; y++) {
    const opt = document.createElement('option');
    opt.value = y; opt.textContent = y;
    if (y === calYear) opt.selected = true;
    ySel.appendChild(opt);
  }
}

function calGoToMonth() {
  calMonth = parseInt(document.getElementById('calMonthSel').value);
  calYear  = parseInt(document.getElementById('calYearSel').value);
  const anime = mockAnimes.find(a => a.id === currentAnimeId);
  renderCal(anime);
}

function calPrevMonth() {
  calMonth--;
  if (calMonth < 0) { calMonth = 11; calYear--; }
  buildCalSelects();
  renderCal(mockAnimes.find(a => a.id === currentAnimeId));
}

function calNextMonth() {
  calMonth++;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  buildCalSelects();
  renderCal(mockAnimes.find(a => a.id === currentAnimeId));
}

// ─── RENDERIZA CALENDÁRIO ─────────────────────────────────────────────────────
function renderCal(anime) {
  const grid = document.getElementById('calGrid');
  if (!grid) return;

  const epDates = anime?.airing?.epDates || {};
  const today = new Date();
  today.setHours(0,0,0,0);

  const firstDay    = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  let html = '';
  for (let i = 0; i < firstDay; i++) html += `<div class="cal-day cal-day-empty"></div>`;

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dayDate = new Date(dateStr + 'T00:00:00');
    const isToday = dayDate.getTime() === today.getTime();
    const epInfo  = epDates[dateStr];
    const isPast  = dayDate < today;

    let cls = 'cal-day';
    if (isToday) cls += ' cal-today';
    if (isPast)  cls += ' cal-past';
    if (epInfo)  cls += ' cal-has-ep';

    html += `<div class="${cls}" data-date="${dateStr}" onclick="calDayClick(event,'${dateStr}')">
      <span class="cal-day-num">${d}</span>
      ${epInfo ? `<div class="cal-ep-tag"></div>` : ''}
    </div>`;
  }

  grid.innerHTML = html;
}

// ─── CLIQUE NUM DIA ───────────────────────────────────────────────────────────
function calDayClick(event, dateStr) {
  event.stopPropagation();
  const anime = mockAnimes.find(a => a.id === currentAnimeId);
  if (!anime || !anime.airing?.enabled) return;

  closeCalDropdown();

  const reading = ['reading','read','toread'].includes(anime.status);
  if (reading) {
    calDayClickReading(event, dateStr, anime);
  } else {
    calDayClickAnime(event, dateStr, anime);
  }
}

// ─── CLIQUE DIA – LEITURA ─────────────────────────────────────────────────────
function calDayClickReading(event, dateStr, anime) {
  const epDates = anime.airing.epDates || {};

  const dropdown = document.createElement('div');
  dropdown.id = 'calEpDropdown';
  dropdown.className = 'cal-ep-dropdown cal-tag-editor';

  const existingEntry = epDates[dateStr] || null;

  dropdown.innerHTML = `
    <div class="cal-tag-editor-title">Tag para ${dateStr.split('-').reverse().join('/')}</div>
    <input class="cal-tag-input" id="calTagInput" type="text"
      value="${existingEntry ? existingEntry.label : ''}"
      placeholder="ex: cap. 134"
      maxlength="20"
      autocomplete="off" />
    <div class="cal-tag-actions">
      <button class="cal-tag-btn-save" onclick="saveCalTag('${dateStr}')">Salvar</button>
      ${existingEntry ? `<button class="cal-tag-btn-remove" onclick="removeCalTag('${dateStr}')">Remover</button>` : ''}
    </div>`;

  positionCalDropdown(dropdown, event.currentTarget);
  document.body.appendChild(dropdown);

  const inp = document.getElementById('calTagInput');
  if (inp) {
    inp.focus();
    inp.select();
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter') saveCalTag(dateStr);
      if (e.key === 'Escape') closeCalDropdown();
    });
  }

  setTimeout(() => {
    document.addEventListener('click', closeCalDropdown, { once: true });
  }, 0);
}

function saveCalTag(dateStr) {
  const anime = mockAnimes.find(a => a.id === currentAnimeId);
  if (!anime) return;
  const inp = document.getElementById('calTagInput');
  const label = inp ? inp.value.trim() : '';
  if (!label) { removeCalTag(dateStr); return; }
  if (!anime.airing.epDates) anime.airing.epDates = {};
  anime.airing.epDates[dateStr] = { label };
  saveAnimes();
  renderCal(anime);
  updateAiringNextTag(anime);
  closeCalDropdown();
}

function removeCalTag(dateStr) {
  const anime = mockAnimes.find(a => a.id === currentAnimeId);
  if (!anime || !anime.airing?.epDates) return;
  delete anime.airing.epDates[dateStr];
  saveAnimes();
  renderCal(anime);
  updateAiringNextTag(anime);
  closeCalDropdown();
}

// ─── CLIQUE DIA – ANIME ───────────────────────────────────────────────────────
function calDayClickAnime(event, dateStr, anime) {
  const epDates   = anime.airing.epDates || {};
  const currentEp = epDates[dateStr] || null;
  const totalEps  = anime.epTotal || 0;

  const usedEps = new Set(
    Object.entries(epDates)
      .filter(([d]) => d !== dateStr)
      .map(([, info]) => info.ep)
  );

  const options = [];
  const maxEp = totalEps > 0 ? totalEps : Math.max(...usedEps, currentEp?.ep || 0, 1);
  for (let i = 1; i <= maxEp; i++) {
    options.push({ ep: i, label: `ep${i}`, used: usedEps.has(i) });
  }

  const dropdown = document.createElement('div');
  dropdown.id = 'calEpDropdown';
  dropdown.className = 'cal-ep-dropdown';

  if (currentEp) {
    const removeOpt = document.createElement('div');
    removeOpt.className = 'cal-ep-option cal-ep-remove';
    removeOpt.textContent = '✕ Remover';
    removeOpt.onclick = (e) => {
      e.stopPropagation();
      delete anime.airing.epDates[dateStr];
      saveAnimes(); renderCal(anime); updateAiringNextTag(anime); closeCalDropdown();
    };
    dropdown.appendChild(removeOpt);
    const divider = document.createElement('div');
    divider.className = 'cal-ep-divider';
    dropdown.appendChild(divider);
  }

  options.forEach(({ ep, label, used }) => {
    const opt = document.createElement('div');
    opt.className = 'cal-ep-option' + (currentEp?.ep === ep ? ' cal-ep-active' : '') + (used ? ' cal-ep-used' : '');
    opt.innerHTML = `<span class="cal-ep-opt-label">${label}</span>${used ? '<span class="cal-ep-opt-used">outro dia</span>' : ''}`;
    opt.onclick = (e) => {
      e.stopPropagation();
      if (!anime.airing.epDates) anime.airing.epDates = {};
      for (const [d, info] of Object.entries(anime.airing.epDates)) {
        if (info.ep === ep && d !== dateStr) delete anime.airing.epDates[d];
      }
      anime.airing.epDates[dateStr] = { ep, label };
      saveAnimes(); renderCal(anime); updateAiringNextTag(anime); closeCalDropdown();
    };
    dropdown.appendChild(opt);
  });

  positionCalDropdown(dropdown, event.currentTarget);
  document.body.appendChild(dropdown);

  setTimeout(() => {
    document.addEventListener('click', closeCalDropdown, { once: true });
  }, 0);
}

// ─── Posiciona dropdown junto ao dia clicado ──────────────────────────────────
function positionCalDropdown(dropdown, dayEl) {
  const calWrap = document.querySelector('.airing-calendar');
  const dayRect = dayEl.getBoundingClientRect();
  const wrapRect = calWrap ? calWrap.getBoundingClientRect() : { bottom: window.innerHeight, top: 0 };

  const dropH = 220;
  const spaceBelow = wrapRect.bottom - dayRect.bottom;
  const spaceAbove = dayRect.top - wrapRect.top;

  dropdown.style.position = 'fixed';
  dropdown.style.zIndex   = '9999';

  const leftPos = Math.min(dayRect.left, window.innerWidth - 170);
  dropdown.style.left = leftPos + 'px';

  if (spaceBelow < dropH && spaceAbove > spaceBelow) {
    dropdown.style.bottom = (window.innerHeight - dayRect.top + 4) + 'px';
    dropdown.style.top = 'auto';
  } else {
    dropdown.style.top    = (dayRect.bottom + 4) + 'px';
    dropdown.style.bottom = 'auto';
  }
}

function closeCalDropdown() {
  const el = document.getElementById('calEpDropdown');
  if (el) el.remove();
}

// ─── PAINEL "ADICIONAR TAG" (ícone de +) ─────────────────────────────────────
function openCalAddPanel(event) {
  if (event) event.stopPropagation();

  const anime = mockAnimes.find(a => a.id === currentAnimeId);
  if (!anime || !anime.airing?.enabled) return;

  closeCalAddPanel();
  closeCalDropdown();

  const reading = ['reading','read','toread'].includes(anime.status);
  const panel   = document.getElementById('calAddPanel');
  if (!panel) return;

  const today = new Date().toISOString().split('T')[0];
  document.getElementById('calAddDate').value = today;

  const epWrap  = document.getElementById('calAddEpWrap');
  const tagWrap = document.getElementById('calAddTagWrap');

  if (reading) {
    epWrap.style.display  = 'none';
    tagWrap.style.display = '';
    document.getElementById('calAddTagInput').value = '';
  } else {
    epWrap.style.display  = '';
    tagWrap.style.display = 'none';
    buildCalAddEpSelect(anime, today);
  }

  // Posiciona fixed sobre o calendário
  const calWrap = document.querySelector('.airing-calendar');
  if (calWrap) {
    const rect = calWrap.getBoundingClientRect();
    panel.style.position = 'fixed';
    panel.style.zIndex   = '9999';
    panel.style.width    = rect.width + 'px';
    panel.style.left     = rect.left + 'px';
    panel.style.top      = rect.top + 'px';
  }

  panel.style.display = '';
  requestAnimationFrame(() => panel.classList.add('open'));

  document.addEventListener('click', _calAddOutsideClick);
}

function _calAddOutsideClick(e) {
  const panel = document.getElementById('calAddPanel');
  if (panel && !panel.contains(e.target)) {
    closeCalAddPanel();
    document.removeEventListener('click', _calAddOutsideClick);
  }
}

function buildCalAddEpSelect(anime, dateStr) {
  const sel      = document.getElementById('calAddEpSelect');
  const epDates  = anime?.airing?.epDates || {};
  const totalEps = anime?.epTotal || 0;

  const usedEps = new Set(
    Object.entries(epDates)
      .filter(([d]) => d !== dateStr)
      .map(([, info]) => info.ep)
  );

  const maxEp = totalEps > 0 ? totalEps : Math.max(...[...usedEps], 0, 12);
  sel.innerHTML = '<option value="">— escolher episódio —</option>';
  for (let i = 1; i <= maxEp; i++) {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = `ep${i}` + (usedEps.has(i) ? ' (outro dia)' : '');
    sel.appendChild(opt);
  }

  const existing = epDates[dateStr];
  if (existing?.ep) sel.value = existing.ep;
}

function onCalAddDateChange() {
  const anime = mockAnimes.find(a => a.id === currentAnimeId);
  if (!anime) return;
  const reading = ['reading','read','toread'].includes(anime.status);
  if (!reading) {
    const dateStr = document.getElementById('calAddDate').value;
    buildCalAddEpSelect(anime, dateStr);
  }
}

function saveCalAddPanel() {
  const anime = mockAnimes.find(a => a.id === currentAnimeId);
  if (!anime) return;

  const dateStr = document.getElementById('calAddDate').value;
  if (!dateStr) return;

  const reading = ['reading','read','toread'].includes(anime.status);
  if (!anime.airing.epDates) anime.airing.epDates = {};

  if (reading) {
    const label = document.getElementById('calAddTagInput').value.trim();
    if (!label) return;
    anime.airing.epDates[dateStr] = { label };
  } else {
    const epVal = parseInt(document.getElementById('calAddEpSelect').value);
    if (!epVal) return;
    const label = `ep${epVal}`;
    for (const [d, info] of Object.entries(anime.airing.epDates)) {
      if (info.ep === epVal && d !== dateStr) delete anime.airing.epDates[d];
    }
    anime.airing.epDates[dateStr] = { ep: epVal, label };
  }

  saveAnimes();

  const [y, m] = dateStr.split('-').map(Number);
  calYear  = y;
  calMonth = m - 1;
  buildCalSelects();
  renderCal(anime);
  updateAiringNextTag(anime);

  closeCalAddPanel();
}

function closeCalAddPanel() {
  const panel = document.getElementById('calAddPanel');
  if (!panel) return;
  panel.classList.remove('open');
  document.removeEventListener('click', _calAddOutsideClick);
  setTimeout(() => { panel.style.display = 'none'; }, 180);
}
