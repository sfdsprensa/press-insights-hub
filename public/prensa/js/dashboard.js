// KPIs and filtering

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const DAYS = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

function unique(arr) { return [...new Set(arr.filter(Boolean))]; }
function counter(arr) {
  const m = new Map();
  arr.forEach(v => { if (v == null || v === '') return; m.set(v, (m.get(v) || 0) + 1); });
  return m;
}
function topN(map, n = 10) {
  return [...map.entries()].sort((a,b) => b[1]-a[1]).slice(0, n);
}
function mostFrequent(arr) {
  const c = counter(arr);
  const top = topN(c, 1);
  return top.length ? top[0][0] : '—';
}
function fmtDate(d) {
  if (!d) return '';
  return d.toLocaleDateString('es-CO', { day:'2-digit', month:'short', year:'numeric' });
}

function populateFilters(rows) {
  const set = (id, values) => {
    const el = document.getElementById(id);
    const current = el.value;
    el.innerHTML = '<option value="">Todos</option>' +
      unique(values).sort().map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('');
    el.value = current;
  };
  set('filterPrograma', rows.map(r => r.programa));
  set('filterTipo', rows.map(r => r.tipo));
  set('filterSolicitante', rows.map(r => r.solicitante));
  set('filterLugar', rows.map(r => r.lugar));
  const meses = unique(rows.map(r => r.fechaEvento).filter(Boolean)
    .map(d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`));
  meses.sort();
  document.getElementById('filterMes').innerHTML =
    '<option value="">Todos</option>' +
    meses.map(m => {
      const [y, mo] = m.split('-');
      return `<option value="${m}">${MONTHS[+mo-1]} ${y}</option>`;
    }).join('');
}

function applyFilters(rows) {
  const f = {
    programa: document.getElementById('filterPrograma').value,
    tipo: document.getElementById('filterTipo').value,
    mes: document.getElementById('filterMes').value,
    solicitante: document.getElementById('filterSolicitante').value,
    lugar: document.getElementById('filterLugar').value,
  };
  return rows.filter(r => {
    if (f.programa && r.programa !== f.programa) return false;
    if (f.tipo && r.tipo !== f.tipo) return false;
    if (f.solicitante && r.solicitante !== f.solicitante) return false;
    if (f.lugar && r.lugar !== f.lugar) return false;
    if (f.mes && r.fechaEvento) {
      const k = `${r.fechaEvento.getFullYear()}-${String(r.fechaEvento.getMonth()+1).padStart(2,'0')}`;
      if (k !== f.mes) return false;
    } else if (f.mes && !r.fechaEvento) return false;
    return true;
  });
}

function renderKPIs(rows) {
  const now = new Date();
  const thisMonth = rows.filter(r => r.fechaEvento &&
    r.fechaEvento.getMonth() === now.getMonth() &&
    r.fechaEvento.getFullYear() === now.getFullYear());
  const in7 = rows.filter(r => {
    if (!r.fechaEvento) return false;
    const diff = (r.fechaEvento - now) / (1000*60*60*24);
    return diff >= 0 && diff <= 7;
  });
  const realizadosMes = thisMonth.filter(r => r.fechaEvento < now);
  const programas = unique(rows.map(r => r.programa));
  const solicitantes = unique(rows.map(r => r.solicitante));
  const tipoTop = mostFrequent(rows.map(r => r.tipo));
  const progTop = mostFrequent(rows.map(r => r.programa));
  let avgAntic = null;
  const anticVals = rows.filter(r => r.fechaEvento && r.fechaCreacion)
    .map(r => (r.fechaEvento - r.fechaCreacion)/(1000*60*60*24));
  if (anticVals.length) avgAntic = (anticVals.reduce((a,b)=>a+b,0)/anticVals.length).toFixed(1);

  const kpis = [
    { icon:'fa-list-check', label:'Total solicitudes', value: rows.length },
    { icon:'fa-calendar-day', label:'Solicitudes del mes', value: thisMonth.length, cls:'success' },
    { icon:'fa-diagram-project', label:'Programas únicos', value: programas.length },
    { icon:'fa-user-group', label:'Solicitantes únicos', value: solicitantes.length },
    { icon:'fa-tag', label:'Tipo más frecuente', value: tipoTop, cls:'warn' },
    { icon:'fa-star', label:'Programa top', value: progTop, cls:'warn' },
    { icon:'fa-hourglass-half', label:'Prom. días anticipación', value: avgAntic ?? '—' },
    { icon:'fa-clock', label:'Próximos 7 días', value: in7.length, cls: in7.length ? 'danger':'' },
    { icon:'fa-check-double', label:'Realizados este mes', value: realizadosMes.length, cls:'success' },
  ];
  document.getElementById('kpis').innerHTML = kpis.map(k => `
    <div class="kpi-card">
      <div class="kpi-icon ${k.cls||''}"><i class="fa-solid ${k.icon}"></i></div>
      <div class="kpi-info">
        <span class="value">${escapeHtml(String(k.value))}</span>
        <span class="label">${k.label}</span>
      </div>
    </div>`).join('');
}

function renderStats(rows) {
  const prog = topN(counter(rows.map(r => r.programa)), 10);
  const soli = topN(counter(rows.map(r => r.solicitante)), 10);
  const lug = topN(counter(rows.map(r => r.lugar)), 10);
  const list = (arr) => arr.map(([k,v]) => `<li>${escapeHtml(k)} <span>${v}</span></li>`).join('') || '<li>Sin datos</li>';
  document.getElementById('topProgramas').innerHTML = list(prog);
  document.getElementById('topSolicitantes').innerHTML = list(soli);
  document.getElementById('topLugares').innerHTML = list(lug);

  const dates = rows.map(r => r.fechaEvento).filter(Boolean).sort((a,b)=>a-b);
  let avgSem='-', avgMes='-', avgDia='-';
  if (dates.length) {
    const spanDays = Math.max(1, (dates[dates.length-1] - dates[0])/(1000*60*60*24));
    avgDia = (rows.length / spanDays).toFixed(2);
    avgSem = (rows.length / (spanDays/7)).toFixed(2);
    avgMes = (rows.length / (spanDays/30)).toFixed(2);
  }
  document.getElementById('avgSemana').textContent = avgSem;
  document.getElementById('avgMes').textContent = avgMes;
  document.getElementById('avgDia').textContent = avgDia;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

window.Dashboard = { populateFilters, applyFilters, renderKPIs, renderStats, counter, topN, unique, escapeHtml, MONTHS, DAYS, fmtDate };
