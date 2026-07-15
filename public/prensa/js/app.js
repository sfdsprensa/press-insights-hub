// App bootstrap and navigation
document.addEventListener('DOMContentLoaded', () => {
  // Nav
  const links = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('.section');
  const titles = { dashboard:'Dashboard Ejecutivo', charts:'Gráficos', calendar:'Calendario', table:'Tabla de Solicitudes', stats:'Estadísticas' };
  links.forEach(l => l.addEventListener('click', (e) => {
    e.preventDefault();
    const sec = l.dataset.section;
    links.forEach(x => x.classList.remove('active'));
    l.classList.add('active');
    sections.forEach(s => s.classList.toggle('active', s.id === `section-${sec}`));
    document.getElementById('pageTitle').textContent = titles[sec] || '';
    document.getElementById('sidebar').classList.remove('open');
    if (sec === 'calendar' && AppState.calendar) setTimeout(() => AppState.calendar.updateSize(), 60);
  }));

  // Menu (mobile)
  document.getElementById('menuBtn').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });

  // File input
  document.getElementById('excelInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const rows = await Excel.readExcelFile(file);
      AppState.raw = rows;
      document.getElementById('fileStatus').textContent = `${file.name} · ${rows.length} registros`;
      Dashboard.populateFilters(rows);
      refresh();
    } catch (err) {
      alert('Error al leer el archivo: ' + err.message);
    }
  });

  // Filters
  ['filterPrograma','filterTipo','filterMes','filterSolicitante','filterLugar'].forEach(id => {
    document.getElementById(id).addEventListener('change', refresh);
  });
  document.getElementById('clearFilters').addEventListener('click', () => {
    ['filterPrograma','filterTipo','filterMes','filterSolicitante','filterLugar'].forEach(id => {
      document.getElementById(id).value = '';
    });
    refresh();
  });

  // PDF download
  document.getElementById('downloadPdf').addEventListener('click', () => {
    try { PDFReport.generatePDF(); }
    catch (e) { alert('Error al generar PDF: ' + e.message); }
  });

  // Modal
  document.getElementById('modalClose').addEventListener('click', () => {
    document.getElementById('eventModal').classList.remove('open');
  });
  document.getElementById('eventModal').addEventListener('click', (e) => {
    if (e.target.id === 'eventModal') e.currentTarget.classList.remove('open');
  });

  // Initial empty render
  refresh();
});

function refresh() {
  const rows = Dashboard.applyFilters(AppState.raw);
  AppState.filtered = rows;
  Dashboard.renderKPIs(rows);
  Charts.renderCharts(rows);
  CalendarView.renderCalendar(rows);
  TableView.renderTable(rows);
  Dashboard.renderStats(rows);
}
