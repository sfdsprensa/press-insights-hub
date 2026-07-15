// DataTable rendering
function renderTable(rows) {
  const esc = Dashboard.escapeHtml;
  const data = rows.map(r => [
    r.fechaEvento ? Dashboard.fmtDate(r.fechaEvento) : '',
    r.programa, r.solicitante, r.tipo, r.lugar, r.observaciones
  ]);
  if (AppState.dataTable) {
    AppState.dataTable.clear().rows.add(data).draw();
    return;
  }
  AppState.dataTable = $('#dataTable').DataTable({
    data,
    dom: 'Bfrtip',
    buttons: [
      { extend: 'csv', text: '<i class="fa-solid fa-file-csv"></i> CSV', className: 'btn btn-outline' },
      { extend: 'excel', text: '<i class="fa-solid fa-file-excel"></i> Excel', className: 'btn btn-outline' },
      { extend: 'copy', text: '<i class="fa-solid fa-copy"></i> Copiar', className: 'btn btn-outline' },
    ],
    language: {
      search: 'Buscar:', lengthMenu: 'Mostrar _MENU_', info: 'Mostrando _START_-_END_ de _TOTAL_',
      paginate: { previous: 'Anterior', next: 'Siguiente' }, emptyTable: 'Sin datos', zeroRecords: 'Sin coincidencias'
    },
    pageLength: 10,
    order: [[0, 'desc']]
  });
}

window.TableView = { renderTable };
