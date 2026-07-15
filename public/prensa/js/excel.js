// Excel loading and normalization
window.AppState = {
  raw: [],       // normalized rows
  filtered: [],  // after filters
  charts: {},    // chart instances
  calendar: null,
  dataTable: null,
};

const COLUMN_ALIASES = {
  fechaEvento: ['fecha del evento', 'fecha evento', 'fecha_evento', 'fecha'],
  fechaCreacion: ['fecha de creación', 'fecha de creacion', 'fecha_creacion', 'creación', 'creacion'],
  programa: ['programa', 'programas'],
  solicitante: ['solicitante', 'solicitantes', 'quien solicita'],
  tipo: ['tipo de requerimiento', 'tipo', 'requerimiento'],
  lugar: ['lugar', 'sitio', 'ubicación', 'ubicacion'],
  observaciones: ['observaciones', 'observación', 'observacion', 'descripción', 'descripcion', 'notas'],
  estado: ['estado', 'status'],
  responsable: ['responsable', 'encargado'],
};

function normalizeKey(k) {
  return String(k || '').toLowerCase().trim();
}

function buildColMap(headerRow) {
  const map = {};
  const headers = headerRow.map(normalizeKey);
  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    const idx = headers.findIndex(h => aliases.includes(h));
    if (idx >= 0) map[field] = idx;
  }
  return map;
}

function parseExcelDate(v) {
  if (v == null || v === '') return null;
  if (v instanceof Date) return v;
  if (typeof v === 'number') {
    // Excel serial date
    const d = XLSX.SSF.parse_date_code(v);
    if (d) return new Date(Date.UTC(d.y, d.m - 1, d.d, d.H || 0, d.M || 0, d.S || 0));
  }
  const s = String(v).trim();
  // dd/mm/yyyy or dd-mm-yyyy
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (m) {
    let [_, d, mo, y] = m;
    if (y.length === 2) y = '20' + y;
    return new Date(+y, +mo - 1, +d);
  }
  const dt = new Date(s);
  return isNaN(dt.getTime()) ? null : dt;
}

function normalizeRows(rows) {
  if (!rows.length) return [];
  const header = rows[0];
  const colMap = buildColMap(header);
  const out = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.every(c => c == null || c === '')) continue;
    const get = (f) => colMap[f] != null ? r[colMap[f]] : null;
    out.push({
      fechaEvento: parseExcelDate(get('fechaEvento')),
      fechaCreacion: parseExcelDate(get('fechaCreacion')),
      programa: get('programa') || '—',
      solicitante: get('solicitante') || '—',
      tipo: get('tipo') || '—',
      lugar: get('lugar') || '—',
      observaciones: get('observaciones') || '',
      estado: get('estado') || '',
      responsable: get('responsable') || '',
    });
  }
  return out;
}

function readExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array', cellDates: true });
        const first = wb.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[first], { header: 1, raw: true, defval: '' });
        resolve(normalizeRows(rows));
      } catch (err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

window.Excel = { readExcelFile };
