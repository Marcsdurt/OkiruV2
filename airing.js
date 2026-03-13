// ─── AIRING / CALENDÁRIO DE LANÇAMENTO ───────────────────────────────────────

const WEEKDAY_SHORT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                     'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

let calYear  = new Date().getFullYear();
let calMonth = new Date().getMonth(); // 0-based

// ─── Abre / fecha a seção ao mudar de anime ───────────────────────────────────
function loadAiringSection(anime) {
  const data = anime.airing || {};
  const enabled = !!data.enabled;

  document.getElementById('airingToggle').checked = enabled;
  document.getElementById('airingBody').style.display = enabled ? '' : 'none';

  if (data.firstDate) document.getElementById('airingFirstDate').value = data.firstDate;
  else document.getElementById('airingFirstDate').value = '';

  const wd = data.weekday !== undefined ? String(data.weekday) : '';
  document.getElementById('airingWeekday').value = wd;

  // Calendário: vai para o mês do próximo ep ou mês atual
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

// ─── Campos de configuração mudaram ──────────────────────────────────────────
function onAiringFieldChange() {
  const anime = mockAnimes.find(a => a.id === currentAnimeId);
  if (!anime) return;
  if (!anime.airing) anime.airing = {};

  const firstDate = document.getElementById('airingFirstDate').value;
  const weekday   = document.getElementById('airingWeekday').value;

  anime.airing.firstDate = firstDate;
  anime.airing.weekday   = weekday !== '' ? parseInt(weekday) : undefined;

  // Auto-gera datas se tiver firstDate + weekday + epTotal
  if (firstDate && weekday !== '' && anime.epTotal > 0) {
    autoGenerateEpDates(anime);
  }

  saveAnimes();
  renderCal(anime);
  updateAiringNextTag(anime);
}

// ─── Auto-gera datas semanais a partir do 1º episódio ────────────────────────
function autoGenerateEpDates(anime) {
  if (!anime.airing) return;
  const { firstDate, weekday } = anime.airing;
  if (!firstDate || weekday === undefined) return;

  // Só gera se não houver datas já existentes (não sobrescreve edições manuais)
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

// ─── Tag de próximo episódio ──────────────────────────────────────────────────
function updateAiringNextTag(anime) {
  const tag = document.getElementById('airingNextTag');
  if (!tag) return;

  const data = anime?.airing;
  if (!data?.enabled || !data?.epDates) { tag.style.display = 'none'; return; }

  const today = new Date();
  today.setHours(0,0,0,0);

  // Encontra o ep com a data mais próxima no futuro (ou hoje)
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
  anime.airing = { enabled: true };
  document.getElementById('airingFirstDate').value = '';
  document.getElementById('airingWeekday').value = '';
  saveAnimes();
  renderCal(anime);
  updateAiringNextTag(anime);
}

// ─── CALENDÁRIO ───────────────────────────────────────────────────────────────
function buildCalSelects() {
  const mSel = document.getElementById('calMonthSel');
  const ySel = document.getElementById('calYearSel');
  if (!mSel || !ySel) return;

  mSel.innerHTML = MONTH_NAMES.map((m, i) =>
    `<option value="${i}" ${i === calMonth ? 'selected' : ''}>${m}</option>`
  ).join('');

  const curY = new Date().getFullYear();
  ySel.innerHTML = '';
  for (let y = curY - 3; y <= curY + 5; y++) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
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
  const anime = mockAnimes.find(a => a.id === currentAnimeId);
  renderCal(anime);
}

function calNextMonth() {
  calMonth++;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  buildCalSelects();
  const anime = mockAnimes.find(a => a.id === currentAnimeId);
  renderCal(anime);
}

function renderCal(anime) {
  const grid = document.getElementById('calGrid');
  if (!grid) return;

  const epDates = anime?.airing?.epDates || {};
  const today = new Date();
  today.setHours(0,0,0,0);

  const firstDay = new Date(calYear, calMonth, 1).getDay(); // 0=Dom
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  let html = '';

  // Espaços vazios antes do dia 1
  for (let i = 0; i < firstDay; i++) {
    html += `<div class="cal-day cal-day-empty"></div>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dayDate = new Date(dateStr + 'T00:00:00');
    const isToday = dayDate.getTime() === today.getTime();
    const epInfo  = epDates[dateStr];
    const isPast  = dayDate < today;

    let cls = 'cal-day';
    if (isToday)  cls += ' cal-today';
    if (isPast)   cls += ' cal-past';
    if (epInfo)   cls += ' cal-has-ep';

    html += `<div class="${cls}" data-date="${dateStr}" onclick="calDayClick(event,'${dateStr}')">
      <span class="cal-day-num">${d}</span>
      ${epInfo ? `<span class="cal-ep-tag">${epInfo.label}</span>` : ''}
    </div>`;
  }

  grid.innerHTML = html;
}

// ─── Clique num dia: abre dropdown de episódios ──────────────────────────────
function calDayClick(event, dateStr) {
  event.stopPropagation();
  const anime = mockAnimes.find(a => a.id === currentAnimeId);
  if (!anime || !anime.airing?.enabled) return;

  closeCalDropdown();

  const epDates = anime.airing.epDates || {};
  const currentEp = epDates[dateStr] || null;
  const totalEps  = anime.epTotal || 0;

  // Episódios já alocados em outros dias
  const usedEps = new Set(
    Object.entries(epDates)
      .filter(([d]) => d !== dateStr)
      .map(([, info]) => info.ep)
  );

  // Lista de opções: todos os eps do anime, mais um campo custom
  const options = [];
  const maxEp = totalEps > 0 ? totalEps : Math.max(...usedEps, currentEp?.ep || 0, 1);
  for (let i = 1; i <= maxEp; i++) {
    options.push({ ep: i, label: `ep${i}`, used: usedEps.has(i) });
  }

  const dropdown = document.createElement('div');
  dropdown.id = 'calEpDropdown';
  dropdown.className = 'cal-ep-dropdown';

  // Opção: remover (se já tem ep no dia)
  if (currentEp) {
    const removeOpt = document.createElement('div');
    removeOpt.className = 'cal-ep-option cal-ep-remove';
    removeOpt.textContent = '✕ Remover';
    removeOpt.onclick = (e) => {
      e.stopPropagation();
      delete anime.airing.epDates[dateStr];
      saveAnimes();
      renderCal(anime);
      updateAiringNextTag(anime);
      closeCalDropdown();
    };
    dropdown.appendChild(removeOpt);

    const divider = document.createElement('div');
    divider.className = 'cal-ep-divider';
    dropdown.appendChild(divider);
  }

  // Opções de episódios
  options.forEach(({ ep, label, used }) => {
    const opt = document.createElement('div');
    opt.className = 'cal-ep-option' + (currentEp?.ep === ep ? ' cal-ep-active' : '') + (used ? ' cal-ep-used' : '');
    opt.innerHTML = `<span class="cal-ep-opt-label">${label}</span>${used ? '<span class="cal-ep-opt-used">outro dia</span>' : ''}`;
    opt.onclick = (e) => {
      e.stopPropagation();
      if (!anime.airing.epDates) anime.airing.epDates = {};
      // Se esse ep estava em outro dia, remove de lá
      for (const [d, info] of Object.entries(anime.airing.epDates)) {
        if (info.ep === ep && d !== dateStr) delete anime.airing.epDates[d];
      }
      anime.airing.epDates[dateStr] = { ep, label };
      saveAnimes();
      renderCal(anime);
      updateAiringNextTag(anime);
      closeCalDropdown();
    };
    dropdown.appendChild(opt);
  });

  // Posiciona o dropdown próximo ao dia clicado
  const dayEl = event.currentTarget;
  const calEl = document.getElementById('calGrid');
  const calWrap = document.querySelector('.airing-calendar');
  const dayRect = dayEl.getBoundingClientRect();
  const wrapRect = calWrap.getBoundingClientRect();

  const dropH = 220; // max-height do dropdown
  const spaceBelow = wrapRect.bottom - dayRect.bottom;
  const spaceAbove = dayRect.top - wrapRect.top;

  dropdown.style.position = 'fixed';
  dropdown.style.zIndex = '9999';

  // Horizontal: não sair pela direita
  const leftPos = Math.min(dayRect.left, window.innerWidth - 160);
  dropdown.style.left = leftPos + 'px';

  // Vertical: abre pra cima se não tiver espaço abaixo
  if (spaceBelow < dropH && spaceAbove > spaceBelow) {
    dropdown.style.bottom = (window.innerHeight - dayRect.top + 4) + 'px';
    dropdown.style.top = 'auto';
  } else {
    dropdown.style.top  = (dayRect.bottom + 4) + 'px';
    dropdown.style.bottom = 'auto';
  }

  document.body.appendChild(dropdown);

  // Fecha ao clicar fora
  setTimeout(() => {
    document.addEventListener('click', closeCalDropdown, { once: true });
  }, 0);
}

function closeCalDropdown() {
  const el = document.getElementById('calEpDropdown');
  if (el) el.remove();
}
