// Chart rendering
const CHART_COLORS = ['#1857b6','#16a34a','#f59e0b','#dc2626','#7c3aed','#0891b2','#db2777','#65a30d','#ea580c','#4f46e5'];

function destroyChart(id) {
  if (AppState.charts[id]) { AppState.charts[id].destroy(); delete AppState.charts[id]; }
}

function makeChart(id, config) {
  destroyChart(id);
  const ctx = document.getElementById(id);
  if (!ctx) return;
  AppState.charts[id] = new Chart(ctx, config);
}

function renderCharts(rows) {
  const { counter, topN, MONTHS, DAYS } = Dashboard;

  // 1. Por Programa (barras)
  const prog = topN(counter(rows.map(r => r.programa)), 15);
  makeChart('chartPrograma', {
    type: 'bar',
    data: {
      labels: prog.map(x => x[0]),
      datasets: [{ label: 'Solicitudes', data: prog.map(x => x[1]), backgroundColor: '#1857b6', borderRadius: 6 }]
    },
    options: baseOpts({ legend: false })
  });

  // 2. Por Tipo (pie)
  const tipo = topN(counter(rows.map(r => r.tipo)), 10);
  makeChart('chartTipo', {
    type: 'doughnut',
    data: {
      labels: tipo.map(x => x[0]),
      datasets: [{ data: tipo.map(x => x[1]), backgroundColor: CHART_COLORS, borderWidth: 2, borderColor: '#fff' }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { family: 'Poppins' } } } } }
  });

  // 3. Por Mes (líneas)
  const byMonth = new Map();
  rows.forEach(r => {
    if (!r.fechaEvento) return;
    const k = `${r.fechaEvento.getFullYear()}-${String(r.fechaEvento.getMonth()+1).padStart(2,'0')}`;
    byMonth.set(k, (byMonth.get(k)||0)+1);
  });
  const monthKeys = [...byMonth.keys()].sort();
  makeChart('chartMes', {
    type: 'line',
    data: {
      labels: monthKeys.map(k => { const [y,m]=k.split('-'); return `${MONTHS[+m-1]} ${y}`; }),
      datasets: [{
        label: 'Solicitudes', data: monthKeys.map(k => byMonth.get(k)),
        borderColor: '#1857b6', backgroundColor: 'rgba(24,87,182,.12)',
        tension: 0.35, fill: true, pointRadius: 4, pointBackgroundColor: '#1857b6'
      }]
    },
    options: baseOpts({ legend: false })
  });

  // 4. Por Día de semana
  const dayCounts = [0,0,0,0,0,0,0];
  rows.forEach(r => { if (r.fechaEvento) dayCounts[r.fechaEvento.getDay()]++; });
  makeChart('chartDia', {
    type: 'bar',
    data: {
      labels: DAYS,
      datasets: [{ label: 'Solicitudes', data: dayCounts, backgroundColor: '#16a34a', borderRadius: 6 }]
    },
    options: baseOpts({ legend: false })
  });

  // 5. Top 10 solicitantes
  const soli = topN(counter(rows.map(r => r.solicitante)), 10);
  makeChart('chartSolicitantes', {
    type: 'bar',
    data: {
      labels: soli.map(x => x[0]),
      datasets: [{ label: 'Solicitudes', data: soli.map(x => x[1]), backgroundColor: '#7c3aed', borderRadius: 6 }]
    },
    options: { ...baseOpts({ legend: false }), indexAxis: 'y' }
  });

  // 6. Top lugares
  const lug = topN(counter(rows.map(r => r.lugar)), 10);
  makeChart('chartLugares', {
    type: 'bar',
    data: {
      labels: lug.map(x => x[0]),
      datasets: [{ label: 'Solicitudes', data: lug.map(x => x[1]), backgroundColor: '#0891b2', borderRadius: 6 }]
    },
    options: { ...baseOpts({ legend: false }), indexAxis: 'y' }
  });
}

function baseOpts({ legend = true } = {}) {
  return {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: legend, labels: { font: { family: 'Poppins' } } },
      tooltip: { titleFont: { family: 'Poppins' }, bodyFont: { family: 'Poppins' } }
    },
    scales: {
      x: { ticks: { font: { family: 'Poppins' } }, grid: { display: false } },
      y: { beginAtZero: true, ticks: { font: { family: 'Poppins' }, precision: 0 }, grid: { color: '#eef1f6' } }
    }
  };
}

window.Charts = { renderCharts };
