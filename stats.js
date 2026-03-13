// ─── ESTATÍSTICAS ───
let genreChartInstance = null;

function renderStatsMonth() {
  const list = document.getElementById('statsMonthList');
  if (!list) return;
  const now = new Date();
  const currentMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  const monthName = now.toLocaleDateString('pt-BR', { month: 'long' });
  const monthLabel = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  const titleEl = document.getElementById('statsCardTitle');
  if (titleEl) titleEl.textContent = `Animes do mês - ${monthLabel}`;

  const thisMonth = mockAnimes.filter(a =>
    a.dateAdded && a.dateAdded.startsWith(currentMonth)
  );

  if (!thisMonth.length) {
    list.innerHTML = '<div class="stats-empty">Nenhum anime assistido este mês.</div>';
  } else {
    list.innerHTML = thisMonth.map(a => `
      <div class="stats-month-item">
        <div class="stats-month-thumb">
          ${a.img ? `<img src="${a.img}" />` : ''}
        </div>
        <div class="stats-month-info">
          <div class="stats-month-name">${a.name}</div>
          <div class="stats-month-stars">${starsHTML(a.rating, true)}</div>
        </div>
      </div>
    `).join('');
  }

  renderGenreChart();
}

function renderGenreChart() {
  const canvas = document.getElementById('genreChart');
  const emptyEl = document.getElementById('genreEmpty');
  if (!canvas) return;

  const counts = {};
  mockAnimes.forEach(a => {
    if (!a.genres?.length) return;
    a.genres.forEach(g => { counts[g] = (counts[g] || 0) + 1; });
  });

  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 4);

  if (!entries.length) {
    canvas.style.display = 'none';
    emptyEl.style.display = 'block';
    return;
  }

  canvas.style.display = 'block';
  emptyEl.style.display = 'none';

  const labels = entries.map(e => e[0]);
  const values = entries.map(e => e[1]);

  const grays = entries.map((_, i) => {
    const lightness = Math.round(10 + (i / (entries.length - 1 || 1)) * 70);
    return `hsl(0,0%,${lightness}%)`;
  });

  if (genreChartInstance) {
    genreChartInstance.destroy();
    genreChartInstance = null;
  }

  genreChartInstance = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: grays,
        borderColor: grays,
        borderWidth: 0,
        borderRadius: 4,
        borderSkipped: false,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.parsed.x} anime${ctx.parsed.x !== 1 ? 's' : ''}`
          },
          backgroundColor: '#0A0A0A',
          titleColor: '#fff',
          bodyColor: '#ccc',
          padding: 8,
          cornerRadius: 4,
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(0,0,0,0.06)', drawBorder: false },
          ticks: {
            color: '#6B6B6B',
            font: { size: 11, family: 'DM Sans' },
            stepSize: 1,
            precision: 0,
          },
          border: { display: false },
        },
        y: {
          grid: { display: false },
          ticks: {
            color: '#0A0A0A',
            font: { size: 12, family: 'DM Sans', weight: '500' },
          },
          border: { display: false },
        }
      }
    }
  });

  canvas.parentElement.style.minHeight = (entries.length * 44 + 20) + 'px';
}