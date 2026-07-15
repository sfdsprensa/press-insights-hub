// FullCalendar rendering
function renderCalendar(rows) {
  const el = document.getElementById('calendar');
  if (!el) return;
  const events = rows.filter(r => r.fechaEvento).map((r, i) => ({
    id: String(i),
    title: `${r.programa} — ${r.tipo}`,
    start: r.fechaEvento.toISOString().slice(0,10),
    extendedProps: r,
  }));
  if (AppState.calendar) {
    AppState.calendar.removeAllEvents();
    AppState.calendar.addEventSource(events);
    setTimeout(() => AppState.calendar.updateSize(), 50);
    return;
  }
  AppState.calendar = new FullCalendar.Calendar(el, {
    initialView: 'dayGridMonth',
    locale: 'es',
    height: 680,
    headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,listWeek' },
    buttonText: { today: 'Hoy', month: 'Mes', list: 'Lista' },
    events,
    eventClick(info) {
      const r = info.event.extendedProps;
      showEventModal(r);
    }
  });
  AppState.calendar.render();
}

function showEventModal(r) {
  const modal = document.getElementById('eventModal');
  const body = document.getElementById('modalBody');
  const esc = Dashboard.escapeHtml;
  body.innerHTML = `
    <div class="field"><b>Fecha</b>${esc(Dashboard.fmtDate(r.fechaEvento))}</div>
    <div class="field"><b>Programa</b>${esc(r.programa)}</div>
    <div class="field"><b>Solicitante</b>${esc(r.solicitante)}</div>
    <div class="field"><b>Lugar</b>${esc(r.lugar)}</div>
    <div class="field"><b>Tipo</b>${esc(r.tipo)}</div>
    <div class="field"><b>Observaciones</b>${esc(r.observaciones || '—')}</div>
  `;
  modal.classList.add('open');
}

window.CalendarView = { renderCalendar, showEventModal };
