const $ = (selector) => document.querySelector(selector);
let clientes = [], clientesActivos = [], vehiculos = [], vendidos = [], ofertas = [], estadisticas = {};
const moneda = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

async function api(ruta, opciones = {}) {
  const respuesta = await fetch(ruta, { headers: { 'Content-Type': 'application/json' }, ...opciones });
  const datos = await respuesta.json();
  if (!respuesta.ok) throw new Error(datos.error || 'No fue posible completar la operacion.');
  return datos;
}

function aviso(texto) {
  const caja = $('#mensaje');
  caja.textContent = texto;
  caja.classList.add('visible');
  setTimeout(() => caja.classList.remove('visible'), 3500);
}

function valor(formulario) {
  return Object.fromEntries(new FormData(formulario).entries());
}

function escapar(valor = '') {
  const d = document.createElement('div');
  d.textContent = valor;
  return d.innerHTML;
}

function fecha(valor) {
  return valor ? new Date(valor.replace(' ', 'T')).toLocaleDateString('es-MX') : '';
}

function actualizarCamposAbono() {
  const estado = $('#formVenta').estatusPago.value;
  const grupo = $('#camposAbonoInicial');
  grupo.hidden = estado === 'PAGADO';
  $('#formVenta').montoAbono.required = estado === 'PENDIENTE' || estado === 'APARTADO';
  actualizarSaldoVenta();
}

function actualizarSaldoVenta() {
  const precio = Number($('#formVenta').precioFinal.value || 0);
  const abono = Number($('#formVenta').montoAbono.value || 0);
  const saldo = Math.max(precio - abono, 0);
  let salida = $('#saldoVentaVivo');
  if (!salida) {
    salida = document.createElement('p');
    salida.id = 'saldoVentaVivo';
    salida.className = 'meta';
    $('#camposAbonoInicial').appendChild(salida);
  }
  salida.textContent = `Saldo pendiente estimado: ${moneda.format(saldo)}`;
}

function badge(textoEstado) {
  const clase = {
    PUBLICADO: 'estado',
    VENDIDO: 'estado vendido',
    PAGADO: 'estado',
    PENDIENTE: 'estado vendido',
    APARTADO: 'estado apartado',
    ACTIVA: 'estado',
    CANCELADA: 'estado vendido'
  }[textoEstado] || 'estado';
  return `<span class="${clase}">${escapar(textoEstado || '')}</span>`;
}

function limpiarFormulario(formulario) {
  if (!formulario) return;
  formulario.reset();
  if (formulario.id) formulario.id.value = '';
  const boton = formulario.querySelector('[data-texto-base]');
  if (boton) boton.textContent = boton.dataset.textoBase;
  formulario.querySelector('input:not([type="hidden"]), select, textarea')?.focus();
}

function estadoClase(estado) {
  if (estado === 'APARTADO') return 'estado apartado';
  return estado === 'VENDIDO' ? 'estado vendido' : 'estado';
}

function cambiarVista(id = 'tablero') {
  const vista = document.getElementById(id) ? id : 'tablero';
  document.querySelectorAll('.vista').forEach(panel => panel.classList.toggle('activa', panel.id === vista));
  document.querySelectorAll('[data-tab-link]').forEach(link => link.classList.toggle('activo', link.dataset.tabLink === vista));
}

function opcionesCliente(seleccion = '') {
  return `<option value="">Selecciona una persona</option>${clientesActivos.map(c => `<option value="${c.id_cliente}" ${String(c.id_cliente) === String(seleccion) ? 'selected' : ''}>${escapar(c.nombre_completo)}</option>`).join('')}`;
}

function actualizarMetricas() {
  $('#totalClientes').textContent = clientesActivos.length;
  $('#totalVendidos').textContent = estadisticas.vehiculos_vendidos ?? vendidos.length;
  $('#ingresosTotales').textContent = moneda.format(estadisticas.ingresos_totales || 0);
  $('#utilidadEstimada').textContent = moneda.format(estadisticas.utilidad_estimada || 0);
  $('#contadorClientes').textContent = clientes.length;
  $('#contadorVehiculos').textContent = vehiculos.length;
  $('#estadoConexion').textContent = 'Activo';
}

function descargarCsv(nombre, filas) {
  if (!filas.length) return aviso('No hay datos para exportar.');
  const columnas = Object.keys(filas[0]);
  const celda = valor => `"${String(valor ?? '').replaceAll('"', '""')}"`;
  const contenido = [columnas.join(','), ...filas.map(fila => columnas.map(c => celda(fila[c])).join(','))].join('\n');
  const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8' });
  const enlace = document.createElement('a');
  enlace.href = URL.createObjectURL(blob);
  enlace.download = `${nombre}.csv`;
  enlace.click();
  URL.revokeObjectURL(enlace.href);
}

function imprimirReporte(tipo) {
  const esVentas = tipo === 'vendidos';
  const titulo = esVentas ? 'Reporte de vehiculos vendidos' : 'Reporte de ofertas activas';
  const origen = esVentas ? $('#listaVendidos') : $('#listaOfertasReporte');
  if (esVentas && (!origen || !origen.textContent.trim())) return aviso('No hay datos para imprimir.');
  if (!esVentas && !ofertas.length) return aviso('No hay ofertas para imprimir.');
  const filas = esVentas ? vendidos : ofertas;
  const contenido = filas.map(v => `
    <article class="oferta-print">
      <div class="imagen-wrap">
        ${v.url_imagen ? `<img src="${escapar(v.url_imagen)}" alt="${escapar(v.marca)} ${escapar(v.linea)}">` : '<div class="sin-imagen">Sin imagen</div>'}
      </div>
      <div>
        <h2>${escapar(v.marca)} ${escapar(v.linea)} ${v.modelo}</h2>
        <p class="precio">${moneda.format(esVentas ? v.precio_final : v.precio_venta)}</p>
        <p><strong>Vendedor:</strong> ${escapar(v.vendedor || '')}</p>
        ${esVentas ? `<p><strong>Comprador:</strong> ${escapar(v.comprador || '')}</p>` : ''}
        <p><strong>Serie:</strong> ${escapar(v.numero_serie || '')}</p>
        <p><strong>Color:</strong> ${escapar(v.color || '')} · <strong>Transmision:</strong> ${escapar(v.transmision || '')} · <strong>Cilindros:</strong> ${escapar(v.numero_cilindros || '')}</p>
        <p><strong>${esVentas ? 'Venta' : 'Publicado'}:</strong> ${fecha(esVentas ? v.fecha_venta : v.fecha_publicacion)}${esVentas ? ` · <strong>Pago:</strong> ${escapar(v.estatus_pago || '')}` : ''}</p>
        ${esVentas ? `<p><strong>Pagado:</strong> ${moneda.format(v.monto_pagado || 0)} · <strong>Saldo:</strong> ${moneda.format(v.saldo_pendiente || 0)}</p>` : ''}
        <p>${escapar(v.descripcion || '')}</p>
      </div>
    </article>`).join('');
  const ventana = window.open('', '_blank', 'width=1000,height=700');
  if (!ventana) return aviso('El navegador bloqueo la ventana de impresion.');
  ventana.document.write(`<!doctype html>
    <html lang="es-MX">
    <head>
      <meta charset="utf-8">
      <title>${escapar(titulo)}</title>
      <style>
        body { font-family: Arial, sans-serif; color: #111418; margin: 28px; }
        h1 { font-size: 24px; margin: 0 0 6px; color: #a51f2b; }
        .subtitulo { color: #66707a; margin: 0 0 22px; }
        .fila-reporte { display: grid; grid-template-columns: 1.5fr 1fr 1fr 1fr 1fr; gap: 12px; padding: 12px 0; border-bottom: 1px solid #d8ddde; break-inside: avoid; }
        .oferta-print { display: grid; grid-template-columns: 180px 1fr; gap: 18px; padding: 16px 0; border-bottom: 1px solid #d8ddde; break-inside: avoid; page-break-inside: avoid; }
        .oferta-print img, .sin-imagen { width: 180px; height: 120px; object-fit: cover; border: 1px solid #cfd5d8; background: #f3f4f1; }
        .sin-imagen { display: grid; place-items: center; color: #66707a; font-size: 12px; }
        .oferta-print h2 { margin: 0 0 6px; font-size: 18px; }
        .oferta-print p { margin: 3px 0; font-size: 12px; }
        .precio { color: #a51f2b; font-weight: 800; font-size: 15px !important; }
        strong { display: block; font-size: 13px; }
        .oferta-print strong { display: inline; }
        .meta { display: block; color: #66707a; font-size: 11px; margin: 0 0 3px; }
        a, button { display: none !important; }
        @page { margin: 16mm; }
      </style>
    </head>
    <body>
      <h1>${escapar(titulo)}</h1>
      <p class="subtitulo">ADDJ MOTORS - generado el ${new Date().toLocaleDateString('es-MX')}</p>
      ${contenido}
      <script>
        let impresionIniciada = false;
        function imprimirCuandoEsteListo() {
          if (impresionIniciada) return;
          impresionIniciada = true;
          const imgs = Array.from(document.images);
          const espera = imgs.map(img => img.complete ? Promise.resolve() : new Promise(resolve => {
            img.onload = resolve;
            img.onerror = resolve;
          }));
          const limite = new Promise(resolve => setTimeout(resolve, 1800));
          Promise.race([Promise.all(espera), limite]).then(() => {
            setTimeout(() => {
              window.focus();
              window.print();
            }, 250);
          });
        }
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
          imprimirCuandoEsteListo();
        } else {
          document.addEventListener('DOMContentLoaded', imprimirCuandoEsteListo, { once: true });
          window.addEventListener('load', imprimirCuandoEsteListo, { once: true });
        }
      </script>
    </body>
    </html>`);
  ventana.document.close();
}

async function cargarClientes() {
  const estado = $('#filtroEstadoClientes')?.value || 'activos';
  [clientesActivos, clientes] = await Promise.all([
    api('/api/clientes?estado=activos'),
    api(`/api/clientes?estado=${encodeURIComponent(estado)}`)
  ]);
  renderClientes();
  document.querySelectorAll('select[name="idVendedor"],select[name="idComprador"]').forEach(s => s.innerHTML = opcionesCliente(s.value));
}

function renderClientes() {
  const texto = ($('#buscarClientes')?.value || '').toLowerCase();
  const filtrados = clientes.filter(c => [c.nombre_completo, c.correo_electronico, c.telefono, c.domicilio].some(v => String(v || '').toLowerCase().includes(texto)));
  $('#listaClientes').innerHTML = filtrados.length ? filtrados.map(c => `
    <article class="item">
      <div>
        <strong>${escapar(c.nombre_completo)}</strong>
        <p>${escapar(c.correo_electronico)} · ${escapar(c.telefono)} · <span class="${Number(c.activo) ? 'estado' : 'estado vendido'}">${Number(c.activo) ? 'ACTIVO' : 'INACTIVO'}</span></p>
        <p class="meta">${escapar(c.domicilio)}</p>
      </div>
      <div class="acciones">
        ${Number(c.activo) ? `<button class="enlace" data-editar-cliente="${c.id_cliente}">Editar</button><button class="enlace" data-borrar-cliente="${c.id_cliente}">Eliminar / desactivar</button>` : `<button class="enlace" data-reactivar-cliente="${c.id_cliente}">Reactivar</button>`}
      </div>
    </article>`).join('') : '<p class="meta">No hay clientes registrados.</p>';
}

async function cargarOfertas(filtros = '') {
  ofertas = await api(`/api/reportes/ofertas${filtros}`);
  const filasReporte = ofertas.map(v => `
    <article class="fila-reporte">
      <div><strong>${escapar(v.marca)} ${escapar(v.linea)} ${v.modelo}</strong><p class="meta">Serie ${escapar(v.numero_serie || '')}</p></div>
      <div><span class="meta">Vendedor</span><strong>${escapar(v.vendedor || '')}</strong></div>
      <div><span class="meta">Precio</span><strong>${moneda.format(v.precio_venta)}</strong></div>
      <div><span class="meta">Fecha</span><strong>${fecha(v.fecha_publicacion)}</strong></div>
      <div><span class="meta">Estado</span><strong>${escapar(v.estado)}</strong></div>
    </article>`).join('');
  $('#listaOfertas').innerHTML = ofertas.length ? ofertas.map(v => `
    <article class="tarjeta">
      ${v.url_imagen ? `<img class="tarjeta-imagen" src="${escapar(v.url_imagen)}" alt="${escapar(v.marca)} ${escapar(v.linea)}">` : ''}
      <p class="etiqueta">${escapar(v.marca)}</p>
      <h3>${escapar(v.linea)} ${v.modelo}</h3>
      <p class="precio">${moneda.format(v.precio_venta)}</p>
      <p class="meta">${escapar(v.color)} · ${escapar(v.transmision)} · ${v.numero_cilindros} cilindros</p>
      <p>${escapar(v.descripcion)}</p>
      <p class="meta">Publicado: ${fecha(v.fecha_publicacion)}</p>
      <button class="enlace" data-detalle-vehiculo="${v.id_vehiculo}">Ver detalle</button>
    </article>`).join('') : '<p class="meta">No se encontraron ofertas.</p>';
  $('#listaOfertasReporte').innerHTML = filasReporte || '<p class="meta">No hay ofertas activas.</p>';
  $('#totalOfertas').textContent = ofertas.length;
}

async function cargarVehiculos() {
  vehiculos = await api('/api/vehiculos');
  const publicados = vehiculos.filter(v => v.estado === 'PUBLICADO' || v.estado === 'APARTADO');
  $('#listaVehiculos').innerHTML = vehiculos.length ? vehiculos.map(v => `
    <article class="item">
      <div>
        <strong>${escapar(v.marca)} ${escapar(v.linea)} ${v.modelo}</strong>
        <p>${moneda.format(v.precio_venta)} · <span class="${estadoClase(v.estado)}">${escapar(v.estado)}</span></p>
        <p class="meta">Vendedor: ${escapar(v.vendedor || '')}</p>
      </div>
      <div class="acciones">
        <button class="enlace" data-detalle-vehiculo="${v.id_vehiculo}">Detalle</button>
        ${v.estado === 'PUBLICADO' ? `<button class="enlace" data-apartar-vehiculo="${v.id_vehiculo}">Apartar</button><button class="enlace" data-editar-vehiculo="${v.id_vehiculo}">Editar</button><button class="enlace" data-borrar-vehiculo="${v.id_vehiculo}">Eliminar</button>` : ''}
        ${v.estado === 'APARTADO' ? `<button class="enlace" data-liberar-vehiculo="${v.id_vehiculo}">Liberar</button>` : ''}
      </div>
    </article>`).join('') : '<p class="meta">No hay vehiculos registrados.</p>';
  $('select[name="idVehiculo"]').innerHTML = `<option value="">Selecciona un vehiculo</option>${publicados.map(v => `<option value="${v.id_vehiculo}" data-precio="${v.precio_venta}">${escapar(v.marca)} ${escapar(v.linea)} ${v.modelo} (${v.estado}) - ${moneda.format(v.precio_venta)}</option>`).join('')}`;
}

async function cargarVendidos(filtros = '') {
  vendidos = await api(`/api/reportes/vendidos${filtros}`);
  const resumen = vendidos.slice(0, 5).map(v => `
    <article class="item">
      <div>
        <strong>${escapar(v.marca)} ${escapar(v.linea)} ${v.modelo}</strong>
        <p>${moneda.format(v.precio_final)} · ${fecha(v.fecha_venta)}</p>
        <p class="meta">${escapar(v.vendedor)} a ${escapar(v.comprador)}</p>
      </div>
    </article>`).join('');
  const reporte = vendidos.length ? `
    <div class="tabla-reporte ventas-tabla">
      <div class="tabla-encabezado"><span>Venta</span><span>Cliente</span><span>Fecha</span><span>Pago</span><span>Estado</span><span>Acciones</span></div>
      ${vendidos.map(v => `
        <article class="tabla-fila">
          <div><strong>${escapar(v.folio_venta || `VTA-${v.id_venta}`)}</strong><p class="meta">${escapar(v.marca)} ${escapar(v.linea)} ${v.modelo}<br>Serie ${escapar(v.numero_serie || '')}</p></div>
          <div><span class="meta">Vendedor</span><strong>${escapar(v.vendedor)}</strong><span class="meta">Comprador</span><strong>${escapar(v.comprador)}</strong></div>
          <div><strong>${fecha(v.fecha_venta)}</strong></div>
          <div><strong>${moneda.format(v.monto_pagado || 0)} / ${moneda.format(v.precio_final)}</strong><p class="meta">Saldo: ${moneda.format(v.saldo_pendiente || 0)}</p>${badge(v.estatus_pago)}</div>
          <div>${badge(v.estado_venta || 'ACTIVA')}</div>
          <div class="acciones-menu">
            <button class="enlace" data-detalle-venta="${v.id_venta}">Detalle</button>
            ${v.ruta_acta ? `<a class="enlace" target="_blank" href="${escapar(v.ruta_acta)}">Acta</a>` : `<button class="enlace" data-regenerar-acta="${v.id_venta}">Regenerar acta</button>`}
            <button class="enlace" data-ver-abonos="${v.id_venta}">Abonos</button>
            <button class="enlace" data-cambiar-estatus="${v.id_venta}">Cambiar pago</button>
            ${v.estado_venta !== 'CANCELADA' ? `<button class="enlace" data-cancelar-venta="${v.id_venta}">Cancelar</button>` : ''}
          </div>
        </article>`).join('')}
    </div>` : '<p class="meta empty-state">No hay ventas con esos filtros. Registra una venta o limpia los filtros.</p>';
  $('#listaVendidosResumen').innerHTML = resumen || '<p class="meta">Aun no hay ventas registradas.</p>';
  $('#listaVendidos').innerHTML = reporte || '<p class="meta">Aun no hay ventas registradas.</p>';
}

async function mostrarAbonos(idVenta) {
  const venta = vendidos.find(v => Number(v.id_venta) === Number(idVenta));
  const abonos = await api(`/api/ventas/${idVenta}/abonos`);
  $('#detalleAbonos').innerHTML = `
    <p class="etiqueta">CONTROL DE PAGOS</p>
    <h2>${escapar(venta?.marca || '')} ${escapar(venta?.linea || '')} ${venta?.modelo || ''}</h2>
    <p class="meta">Total: ${moneda.format(venta?.precio_final || 0)} · Pagado: ${moneda.format(venta?.monto_pagado || 0)} · Saldo: ${moneda.format(venta?.saldo_pendiente || 0)}</p>
    <form id="formAbono" class="formulario" ${(venta?.estatus_pago === 'PAGADO' || venta?.estado_venta === 'CANCELADA') ? 'hidden' : ''}>
      <input type="hidden" name="idVenta" value="${idVenta}">
      <label>Monto<input name="monto" type="number" min="0.01" step="0.01" max="${venta?.saldo_pendiente || ''}" required></label>
      <label>Metodo de pago<select name="metodoPago">
        <option value="EFECTIVO">Efectivo</option>
        <option value="TRANSFERENCIA">Transferencia</option>
        <option value="TARJETA">Tarjeta</option>
        <option value="CHEQUE">Cheque</option>
      </select></label>
      <label>Observaciones<input name="observaciones" placeholder="Referencia, comentario o folio"></label>
      <label>Referencia<input name="referenciaPago" placeholder="Folio bancario o referencia"></label>
      <button class="boton primario" type="submit">Agregar abono</button>
    </form>
    <div class="lista">
      ${abonos.length ? abonos.map(a => `<article class="item"><div><strong>${moneda.format(a.monto)}</strong><p>${escapar(a.metodo_pago)} · ${fecha(a.fecha_abono)}</p><p class="meta">${escapar(a.referencia_pago || '')} ${escapar(a.observaciones || '')}</p></div></article>`).join('') : '<p class="meta">No hay abonos registrados.</p>'}
    </div>`;
  if (!$('#modalAbonos').open) $('#modalAbonos').showModal();
}

async function mostrarDetalleVenta(idVenta) {
  const venta = vendidos.find(v => Number(v.id_venta) === Number(idVenta));
  if (!venta) return;
  const abonos = await api(`/api/ventas/${idVenta}/abonos`);
  $('#detalleVenta').innerHTML = `
    <p class="etiqueta">DETALLE DE VENTA</p>
    <h2>${escapar(venta.folio_venta || `Venta ${venta.id_venta}`)}</h2>
    <div class="detalle-grid">
      <div><span>Vehiculo</span>${escapar(venta.marca)} ${escapar(venta.linea)} ${venta.modelo}</div>
      <div><span>Serie</span>${escapar(venta.numero_serie || '')}</div>
      <div><span>Vendedor</span>${escapar(venta.vendedor)}</div>
      <div><span>Comprador</span>${escapar(venta.comprador)}</div>
      <div><span>Precio final</span>${moneda.format(venta.precio_final)}</div>
      <div><span>Pagado</span>${moneda.format(venta.monto_pagado || 0)}</div>
      <div><span>Saldo</span>${moneda.format(venta.saldo_pendiente || 0)}</div>
      <div><span>Estatus</span>${badge(venta.estatus_pago)} ${badge(venta.estado_venta || 'ACTIVA')}</div>
    </div>
    <h3>Abonos</h3>
    <div class="lista">${abonos.length ? abonos.map(a => `<article class="item"><div><strong>${moneda.format(a.monto)}</strong><p>${escapar(a.metodo_pago)} · ${fecha(a.fecha_abono)}</p><p class="meta">${escapar(a.referencia_pago || '')} ${escapar(a.observaciones || '')}</p></div></article>`).join('') : '<p class="meta">No hay abonos registrados.</p>'}</div>
    ${venta.ruta_acta ? `<a class="boton primario" target="_blank" href="${escapar(venta.ruta_acta)}">Reimprimir acta</a>` : `<button class="boton primario" data-regenerar-acta="${venta.id_venta}">Regenerar acta</button>`}`;
  $('#modalVenta').showModal();
}

async function cambiarEstatusPago(idVenta) {
  const venta = vendidos.find(v => Number(v.id_venta) === Number(idVenta));
  if (!venta) return;
  const nuevo = prompt('Nuevo estatus de pago: PAGADO, PENDIENTE o APARTADO', venta.estatus_pago);
  if (!nuevo) return;
  const estatusPago = nuevo.trim().toUpperCase();
  if (!['PAGADO', 'PENDIENTE', 'APARTADO'].includes(estatusPago)) return aviso('Estatus invalido.');
  const motivo = prompt('Motivo del cambio', 'Ajuste administrativo') || 'Ajuste administrativo';
  const r = await api(`/api/ventas/${idVenta}/estatus`, { method: 'PUT', body: JSON.stringify({ estatusPago, motivo }) });
  await cargarVendidos();
  aviso(r.mensaje || 'Estatus actualizado.');
}

function editarCliente(id) {
  const c = clientes.find(x => x.id_cliente === id);
  if (!c) return;
  const f = $('#formCliente');
  f.id.value = c.id_cliente;
  f.nombreCompleto.value = c.nombre_completo;
  f.domicilio.value = c.domicilio;
  f.correoElectronico.value = c.correo_electronico;
  f.telefono.value = c.telefono;
  f.querySelector('[data-texto-base]').textContent = 'Actualizar cliente';
  location.hash = 'clientes';
  cambiarVista('clientes');
}

function editarVehiculo(id) {
  const v = vehiculos.find(x => x.id_vehiculo === id);
  if (!v) return;
  const f = $('#formVehiculo');
  f.id.value = v.id_vehiculo;
  ['idVendedor', 'numeroMotor', 'numeroSerie', 'modelo', 'marca', 'linea', 'color', 'precioCompra', 'precioVenta', 'transmision', 'numeroCilindros', 'nacionalidad', 'descripcion', 'observaciones', 'urlImagen'].forEach(nombre => {
    const llave = { idVendedor: 'id_vendedor', numeroMotor: 'numero_motor', numeroSerie: 'numero_serie', numeroCilindros: 'numero_cilindros', precioCompra: 'precio_compra', precioVenta: 'precio_venta', urlImagen: 'url_imagen' }[nombre] || nombre;
    f[nombre].value = v[llave] || '';
  });
  f.querySelector('[data-texto-base]').textContent = 'Actualizar vehiculo';
  location.hash = 'vehiculos';
  cambiarVista('vehiculos');
}

function mostrarDetalleVehiculo(id) {
  const v = vehiculos.find(x => Number(x.id_vehiculo) === Number(id)) || ofertas.find(x => Number(x.id_vehiculo) === Number(id));
  if (!v) return;
  $('#detalleVehiculo').innerHTML = `
    <p class="etiqueta">DETALLE</p>
    <h2>${escapar(v.marca)} ${escapar(v.linea)} ${v.modelo}</h2>
    ${v.url_imagen ? `<img class="tarjeta-imagen" src="${escapar(v.url_imagen)}" alt="${escapar(v.marca)} ${escapar(v.linea)}">` : ''}
    <div class="detalle-grid">
      <div><span>Vendedor</span>${escapar(v.vendedor || '')}</div>
      <div><span>Estado</span>${escapar(v.estado)}</div>
      <div><span>Motor</span>${escapar(v.numero_motor)}</div>
      <div><span>Serie</span>${escapar(v.numero_serie)}</div>
      <div><span>Color</span>${escapar(v.color)}</div>
      <div><span>Transmision</span>${escapar(v.transmision)}</div>
      <div><span>Cilindros</span>${v.numero_cilindros}</div>
      <div><span>Nacionalidad</span>${escapar(v.nacionalidad)}</div>
      <div><span>Compra</span>${moneda.format(v.precio_compra)}</div>
      <div><span>Venta</span>${moneda.format(v.precio_venta)}</div>
      <div><span>Descripcion</span>${escapar(v.descripcion)}</div>
      <div><span>Observaciones</span>${escapar(v.observaciones || '')}</div>
    </div>`;
  $('#modalDetalle').showModal();
}

$('#formCliente').addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.currentTarget, d = valor(f), id = String(d.id || '').trim();
  delete d.id;
  try {
    await api(`/api/clientes${id ? '/' + id : ''}`, { method: id ? 'PUT' : 'POST', body: JSON.stringify(d) });
    limpiarFormulario(f);
    await cargarTodo();
    aviso('Cliente guardado correctamente.');
  } catch (x) {
    aviso(x.message);
  }
});

$('#formVehiculo').addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.currentTarget, d = valor(f), id = String(d.id || '').trim();
  delete d.id;
  try {
    await api(`/api/vehiculos${id ? '/' + id : ''}`, { method: id ? 'PUT' : 'POST', body: JSON.stringify(d) });
    limpiarFormulario(f);
    await cargarTodo();
    aviso('Vehiculo guardado correctamente.');
  } catch (x) {
    aviso(x.message);
  }
});

$('#formVenta').addEventListener('submit', async e => {
  e.preventDefault();
  const d = valor(e.currentTarget);
  const vehiculo = vehiculos.find(v => String(v.id_vehiculo) === String(d.idVehiculo));
  if (vehiculo && String(vehiculo.id_vendedor) === String(d.idComprador)) return aviso('Comprador y vendedor deben ser diferentes.');
  if ((d.estatusPago === 'PENDIENTE' || d.estatusPago === 'APARTADO') && Number(d.montoAbono || 0) > Number(d.precioFinal)) return aviso('El monto pagado no puede ser mayor al precio final.');
  if (d.estatusPago === 'APARTADO' && Number(d.montoAbono || 0) <= 0) return aviso('Un apartado requiere un monto pagado mayor a cero.');
  if (!confirm('Confirmar registro de venta? El vehiculo pasara a vendido.')) return;
  try {
    const resultado = await api('/api/ventas', { method: 'POST', body: JSON.stringify(d) });
    $('#acta').hidden = false;
    $('#acta').innerHTML = resultado.acta
      ? `<h3>Acta generada con Java</h3><p>La venta quedo registrada y Java creo el documento formal de compraventa.</p><a class="boton primario" target="_blank" rel="noopener" href="${resultado.acta}">Abrir e imprimir acta</a>`
      : `<h3>Venta registrada</h3><p>${escapar(resultado.mensaje || 'La venta quedo guardada, pero el acta no se genero.')}</p>`;
    limpiarFormulario(e.currentTarget);
    await cargarTodo();
    aviso('Venta registrada.');
  } catch (x) {
    aviso(x.message);
  }
});

$('#filtroVehiculos').addEventListener('submit', e => {
  e.preventDefault();
  const p = new URLSearchParams(valor(e.currentTarget));
  [...p.entries()].forEach(([k, v]) => !v && p.delete(k));
  cargarOfertas(p.toString() ? `?${p}` : '').then(actualizarMetricas).catch(x => aviso(x.message));
});

$('#filtroVehiculos').addEventListener('reset', () => setTimeout(() => cargarOfertas().then(actualizarMetricas), 0));

$('#filtroVentas').addEventListener('submit', e => {
  e.preventDefault();
  const p = new URLSearchParams(valor(e.currentTarget));
  [...p.entries()].forEach(([k, v]) => !v && p.delete(k));
  cargarVendidos(p.toString() ? `?${p}` : '').catch(x => aviso(x.message));
});

$('#filtroVentas').addEventListener('reset', () => setTimeout(() => cargarVendidos(), 0));

document.addEventListener('click', async e => {
  const tab = e.target.closest('[data-tab-link]');
  if (tab) cambiarVista(tab.dataset.tabLink);

  const idCliente = e.target.dataset.editarCliente || e.target.dataset.borrarCliente || e.target.dataset.reactivarCliente;
  const idVehiculo = e.target.dataset.editarVehiculo || e.target.dataset.borrarVehiculo || e.target.dataset.apartarVehiculo || e.target.dataset.liberarVehiculo;
  if (e.target.dataset.editarCliente) editarCliente(Number(idCliente));
  if (e.target.dataset.editarVehiculo) editarVehiculo(Number(idVehiculo));
  if (e.target.dataset.detalleVehiculo) mostrarDetalleVehiculo(Number(e.target.dataset.detalleVehiculo));
  if (e.target.dataset.cerrarModal !== undefined) $('#modalDetalle').close();
  if (e.target.dataset.cerrarAbonos !== undefined) $('#modalAbonos').close();
  if (e.target.dataset.cerrarVenta !== undefined) $('#modalVenta').close();
  if (e.target.classList.contains('nuevo-registro')) limpiarFormulario(e.target.closest('form'));
  if (e.target.dataset.csv === 'ofertas') descargarCsv('ofertas-activas', ofertas);
  if (e.target.dataset.csv === 'vendidos') descargarCsv('vehiculos-vendidos', vendidos);
  if (e.target.dataset.print) imprimirReporte(e.target.dataset.print);
  if (e.target.dataset.borrarCliente && confirm('Eliminar cliente? Si tiene vehiculos o ventas, solo se desactivara para conservar el historial.')) {
    try {
      const r = await api(`/api/clientes/${idCliente}`, { method: 'DELETE' });
      await cargarTodo();
      aviso(r.mensaje || 'Cliente actualizado.');
    } catch (x) { aviso(x.message); }
  }
  if (e.target.dataset.reactivarCliente && confirm('Reactivar este cliente para nuevos registros?')) {
    try {
      const r = await api(`/api/clientes/${idCliente}/reactivar`, { method: 'POST' });
      await cargarTodo();
      aviso(r.mensaje || 'Cliente reactivado.');
    } catch (x) { aviso(x.message); }
  }
  if (e.target.dataset.borrarVehiculo && confirm('Eliminar vehiculo?')) {
    try { await api(`/api/vehiculos/${idVehiculo}`, { method: 'DELETE' }); await cargarTodo(); } catch (x) { aviso(x.message); }
  }
  if (e.target.dataset.apartarVehiculo && confirm('Marcar este vehiculo como apartado?')) {
    try { await api(`/api/vehiculos/${idVehiculo}/estado`, { method: 'PUT', body: JSON.stringify({ estado: 'APARTADO', motivo: 'Apartado antes de venta' }) }); await cargarTodo(); aviso('Vehiculo apartado.'); } catch (x) { aviso(x.message); }
  }
  if (e.target.dataset.liberarVehiculo && confirm('Liberar este vehiculo para venta?')) {
    try { await api(`/api/vehiculos/${idVehiculo}/estado`, { method: 'PUT', body: JSON.stringify({ estado: 'PUBLICADO', motivo: 'Liberacion de apartado' }) }); await cargarTodo(); aviso('Vehiculo publicado.'); } catch (x) { aviso(x.message); }
  }
  if (e.target.dataset.detalleVenta) {
    try { await mostrarDetalleVenta(e.target.dataset.detalleVenta); } catch (x) { aviso(x.message); }
  }
  if (e.target.dataset.cambiarEstatus) {
    try { await cambiarEstatusPago(e.target.dataset.cambiarEstatus); } catch (x) { aviso(x.message); }
  }
  if (e.target.dataset.cancelarVenta) {
    const venta = vendidos.find(v => Number(v.id_venta) === Number(e.target.dataset.cancelarVenta));
    const texto = venta?.estatus_pago === 'PAGADO' ? 'CANCELAR PAGADA' : 'CANCELAR';
    if (prompt(`Esta accion conservara acta y abonos, y marcara la venta como CANCELADA. Escribe "${texto}" para confirmar.`) !== texto) return;
    try { await api(`/api/ventas/${e.target.dataset.cancelarVenta}/cancelar`, { method: 'POST' }); await cargarTodo(); aviso('Venta cancelada.'); } catch (x) { aviso(x.message); }
  }
  if (e.target.dataset.regenerarActa) {
    try {
      const resultado = await api(`/api/ventas/${e.target.dataset.regenerarActa}/acta`, { method: 'POST' });
      await cargarTodo();
      aviso('Acta regenerada.');
      if (resultado.acta) window.open(resultado.acta, '_blank');
    } catch (x) { aviso(x.message); }
  }
  if (e.target.dataset.verAbonos) {
    try { await mostrarAbonos(e.target.dataset.verAbonos); } catch (x) { aviso(x.message); }
  }
  if (e.target.classList.contains('cancelar')) limpiarFormulario(e.target.closest('form'));
});

document.addEventListener('submit', async e => {
  if (e.target.id !== 'formAbono') return;
  e.preventDefault();
  const d = valor(e.target);
  try {
    const r = await api(`/api/ventas/${d.idVenta}/abonos`, { method: 'POST', body: JSON.stringify(d) });
    await cargarTodo();
    await mostrarAbonos(d.idVenta);
    aviso(r.mensaje || 'Abono registrado.');
  } catch (x) { aviso(x.message); }
});

window.addEventListener('hashchange', () => cambiarVista(location.hash.replace('#', '') || 'tablero'));
$('select[name="idVehiculo"]').addEventListener('change', e => $('#formVenta').precioFinal.value = e.target.selectedOptions[0]?.dataset.precio || '');
$('select[name="estatusPago"]').addEventListener('change', actualizarCamposAbono);
$('#formVenta').precioFinal.addEventListener('input', actualizarSaldoVenta);
$('#formVenta').montoAbono.addEventListener('input', actualizarSaldoVenta);
$('#buscarClientes').addEventListener('input', renderClientes);
$('#filtroEstadoClientes').addEventListener('change', () => cargarClientes().then(actualizarMetricas).catch(x => aviso(x.message)));

async function cargarTodo() {
  try {
    await cargarClientes();
    await cargarVehiculos();
    await cargarOfertas();
    await cargarVendidos();
    estadisticas = await api('/api/reportes/estadisticas');
    actualizarMetricas();
  } catch (x) {
    $('#estadoConexion').textContent = 'Sin conexion';
    aviso('No se pudo conectar: ' + x.message);
  }
}

cambiarVista(location.hash.replace('#', '') || 'tablero');
actualizarCamposAbono();
cargarTodo();
