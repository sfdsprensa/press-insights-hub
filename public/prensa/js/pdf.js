// PDF report generation from currently filtered data
async function generatePDF() {
  const rows = AppState.filtered || [];
  if (!rows.length) { alert('No hay datos filtrados para exportar.'); return; }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const now = new Date();

  // Header
  doc.setFillColor(24, 87, 182);
  doc.rect(0, 0, pageW, 70, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(18);
  doc.text('Informe de Gestión de Prensa', 40, 35);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  doc.text(`Generado: ${now.toLocaleString('es-CO')}`, 40, 55);

  // Filtros aplicados
  const filtros = {
    Programa: document.getElementById('filterPrograma').value,
    Tipo: document.getElementById('filterTipo').value,
    Mes: document.getElementById('filterMes').selectedOptions[0]?.text !== 'Todos'
      ? document.getElementById('filterMes').selectedOptions[0]?.text : '',
    Solicitante: document.getElementById('filterSolicitante').value,
    Lugar: document.getElementById('filterLugar').value,
  };
  const activos = Object.entries(filtros).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`);
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(11); doc.setFont('helvetica', 'bold');
  doc.text('Filtros aplicados:', 40, 95);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  doc.text(activos.length ? activos.join('  |  ') : 'Ninguno (todos los registros)', 40, 112, { maxWidth: pageW - 80 });

  // KPIs
  const { counter, topN, unique } = Dashboard;
  const programas = unique(rows.map(r => r.programa));
  const solicitantes = unique(rows.map(r => r.solicitante));
  const lugares = unique(rows.map(r => r.lugar));
  const tipoTop = topN(counter(rows.map(r => r.tipo)), 1)[0]?.[0] || '—';
  const progTop = topN(counter(rows.map(r => r.programa)), 1)[0]?.[0] || '—';

  const kpis = [
    ['Total solicitudes', rows.length],
    ['Programas únicos', programas.length],
    ['Solicitantes únicos', solicitantes.length],
    ['Lugares únicos', lugares.length],
    ['Tipo más frecuente', tipoTop],
    ['Programa top', progTop],
  ];

  doc.autoTable({
    startY: 135,
    head: [['Indicador', 'Valor']],
    body: kpis,
    theme: 'grid',
    headStyles: { fillColor: [24, 87, 182], textColor: 255, font: 'helvetica', fontStyle: 'bold' },
    styles: { font: 'helvetica', fontSize: 10, cellPadding: 6 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 200 } },
    margin: { left: 40, right: 40 },
  });

  // Top listas
  const top = (arr, n = 5) => topN(counter(arr), n).map(([k, v]) => [k, v]);
  const yAfterKPIs = doc.lastAutoTable.finalY + 20;

  doc.autoTable({
    startY: yAfterKPIs,
    head: [['Top Programas', 'N°']],
    body: top(rows.map(r => r.programa)),
    theme: 'striped',
    headStyles: { fillColor: [22, 163, 74], textColor: 255 },
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 5 },
    margin: { left: 40, right: pageW / 2 + 10 },
    tableWidth: pageW / 2 - 50,
  });
  doc.autoTable({
    startY: yAfterKPIs,
    head: [['Top Solicitantes', 'N°']],
    body: top(rows.map(r => r.solicitante)),
    theme: 'striped',
    headStyles: { fillColor: [124, 58, 237], textColor: 255 },
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 5 },
    margin: { left: pageW / 2 + 10, right: 40 },
    tableWidth: pageW / 2 - 50,
  });

  // Gráficos (capturar canvas)
  const charts = ['chartPrograma', 'chartTipo', 'chartMes'];
  doc.addPage();
  doc.setTextColor(24, 87, 182); doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
  doc.text('Gráficos', 40, 40);
  let y = 60;
  const imgW = pageW - 80;
  const imgH = 220;
  for (const id of charts) {
    const c = document.getElementById(id);
    if (!c) continue;
    try {
      const img = c.toDataURL('image/png', 1.0);
      if (y + imgH > pageH - 40) { doc.addPage(); y = 40; }
      doc.setDrawColor(230); doc.rect(40, y, imgW, imgH);
      doc.addImage(img, 'PNG', 45, y + 5, imgW - 10, imgH - 10);
      y += imgH + 20;
    } catch (e) { /* ignore */ }
  }

  // Tabla completa de registros
  doc.addPage();
  doc.setTextColor(24, 87, 182); doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
  doc.text(`Detalle de solicitudes (${rows.length})`, 40, 40);

  const body = rows.map(r => [
    r.fechaEvento ? Dashboard.fmtDate(r.fechaEvento) : '',
    r.programa || '', r.solicitante || '', r.tipo || '', r.lugar || '',
    (r.observaciones || '').toString().slice(0, 120),
  ]);

  doc.autoTable({
    startY: 55,
    head: [['Fecha', 'Programa', 'Solicitante', 'Tipo', 'Lugar', 'Observaciones']],
    body,
    theme: 'grid',
    headStyles: { fillColor: [24, 87, 182], textColor: 255 },
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 4, overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 70 }, 1: { cellWidth: 110 }, 2: { cellWidth: 110 },
      3: { cellWidth: 80 }, 4: { cellWidth: 110 }, 5: { cellWidth: 'auto' },
    },
    margin: { left: 40, right: 40 },
    didDrawPage: () => {
      const str = `Página ${doc.internal.getNumberOfPages()}`;
      doc.setFontSize(9); doc.setTextColor(120);
      doc.text(str, pageW - 60, pageH - 20);
    },
  });

  const stamp = now.toISOString().slice(0, 10);
  doc.save(`informe-prensa-${stamp}.pdf`);
}

window.PDFReport = { generatePDF };
