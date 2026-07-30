const $ = (selector) => document.querySelector(selector);
let clientes = [], vehiculos = [], vendidos = [], ofertas = [], estadisticas = {};
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

function limpiarFormulario(formulario) {
  if (!formulario) return;
  formulario.reset();
  if (formulario.id) formulario.id.value = '';
  const boton = formulario.querySelector('[data-texto-base]');
  if (boton) boton.textContent = boton.dataset.textoBase;
  formulario.querySelector('input:not([type="hidden"]), select, textarea')?.focus();
}

function estadoClase(estado) {
  return estado === 'VENDIDO' ? 'estado vendido' : 'estado';
}

function cambiarVista(id = 'tablero') {
  const vista = document.getElementById(id) ? id : 'tablero';
  document.querySelectorAll('.vista').forEach(panel => panel.classList.toggle('activa', panel.id === vista));
  document.querySelectorAll('[data-tab-link]').forEach(link => link.classList.toggle('activo', link.dataset.tabLink === vista));
}

function opcionesCliente(seleccion = '') {
  return `<option value="">Selecciona una persona</option>${clientes.map(c => `<option value="${c.id_cliente}" ${String(c.id_cliente) === String(seleccion) ? 'selected' : ''}>${escapar(c.nombre_completo)}</option>`).join('')}`;
}

function actualizarMetricas() {
  $('#totalClientes').textContent = clientes.length;
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

async function cargarClientes() {
  clientes = await api('/api/clientes');
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
        <p>${escapar(c.correo_electronico)} · ${escapar(c.telefono)}</p>
        <p class="meta">${escapar(c.domicilio)}</p>
      </div>
      <div class="acciones">
        <button class="enlace" data-editar-cliente="${c.id_cliente}">Editar</button>
        <button class="enlace" data-borrar-cliente="${c.id_cliente}">Eliminar</button>
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
  const publicados = vehiculos.filter(v => v.estado === 'PUBLICADO');
  $('#listaVehiculos').innerHTML = vehiculos.length ? vehiculos.map(v => `
    <article class="item">
      <div>
        <strong>${escapar(v.marca)} ${escapar(v.linea)} ${v.modelo}</strong>
        <p>${moneda.format(v.precio_venta)} · <span class="${estadoClase(v.estado)}">${escapar(v.estado)}</span></p>
        <p class="meta">Vendedor: ${escapar(v.vendedor || '')}</p>
      </div>
      <div class="acciones">
        <button class="enlace" data-detalle-vehiculo="${v.id_vehiculo}">Detalle</button>
        ${v.estado === 'PUBLICADO' ? `<button class="enlace" data-editar-vehiculo="${v.id_vehiculo}">Editar</button><button class="enlace" data-borrar-vehiculo="${v.id_vehiculo}">Eliminar</button>` : ''}
      </div>
    </article>`).join('') : '<p class="meta">No hay vehiculos registrados.</p>';
  $('select[name="idVehiculo"]').innerHTML = `<option value="">Selecciona un vehiculo</option>${publicados.map(v => `<option value="${v.id_vehiculo}" data-precio="${v.precio_venta}">${escapar(v.marca)} ${escapar(v.linea)} ${v.modelo} - ${moneda.format(v.precio_venta)}</option>`).join('')}`;
}

async function cargarVendidos() {
  vendidos = await api('/api/reportes/vendidos');
  const resumen = vendidos.slice(0, 5).map(v => `
    <article class="item">
      <div>
        <strong>${escapar(v.marca)} ${escapar(v.linea)} ${v.modelo}</strong>
        <p>${moneda.format(v.precio_final)} · ${fecha(v.fecha_venta)}</p>
        <p class="meta">${escapar(v.vendedor)} a ${escapar(v.comprador)}</p>
      </div>
    </article>`).join('');
  const reporte = vendidos.map(v => `
    <article class="fila-reporte">
      <div><strong>${escapar(v.marca)} ${escapar(v.linea)} ${v.modelo}</strong><p class="meta">Serie ${escapar(v.numero_serie || '')}</p></div>
      <div><span class="meta">Vendedor</span><strong>${escapar(v.vendedor)}</strong></div>
      <div><span class="meta">Comprador</span><strong>${escapar(v.comprador)}</strong></div>
      <div><span class="meta">Fecha</span><strong>${fecha(v.fecha_venta)}</strong></div>
      <div><span class="meta">Total</span><strong>${moneda.format(v.precio_final)}</strong><p><span class="${v.estatus_pago === 'APARTADO' ? 'estado apartado' : estadoClase(v.estatus_pago === 'PENDIENTE' ? 'VENDIDO' : 'PUBLICADO')}">${escapar(v.estatus_pago || '')}</span></p>${v.ruta_acta ? `<a class="enlace" target="_blank" href="${escapar(v.ruta_acta)}">Acta</a>` : ''}<button class="enlace" data-regenerar-acta="${v.id_venta}">Regenerar</button><button class="enlace" data-cancelar-venta="${v.id_venta}">Cancelar</button></div>
    </article>`).join('');
  $('#listaVendidosResumen').innerHTML = resumen || '<p class="meta">Aun no hay ventas registradas.</p>';
  $('#listaVendidos').innerHTML = reporte || '<p class="meta">Aun no hay ventas registradas.</p>';
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

document.addEventListener('click', async e => {
  const tab = e.target.closest('[data-tab-link]');
  if (tab) cambiarVista(tab.dataset.tabLink);

  const idCliente = e.target.dataset.editarCliente || e.target.dataset.borrarCliente;
  const idVehiculo = e.target.dataset.editarVehiculo || e.target.dataset.borrarVehiculo;
  if (e.target.dataset.editarCliente) editarCliente(Number(idCliente));
  if (e.target.dataset.editarVehiculo) editarVehiculo(Number(idVehiculo));
  if (e.target.dataset.detalleVehiculo) mostrarDetalleVehiculo(Number(e.target.dataset.detalleVehiculo));
  if (e.target.dataset.cerrarModal !== undefined) $('#modalDetalle').close();
  if (e.target.classList.contains('nuevo-registro')) limpiarFormulario(e.target.closest('form'));
  if (e.target.dataset.csv === 'ofertas') descargarCsv('ofertas-activas', ofertas);
  if (e.target.dataset.csv === 'vendidos') descargarCsv('vehiculos-vendidos', vendidos);
  if (e.target.dataset.print !== undefined) window.print();
  if (e.target.dataset.borrarCliente && confirm('Eliminar cliente?')) {
    try { await api(`/api/clientes/${idCliente}`, { method: 'DELETE' }); await cargarTodo(); } catch (x) { aviso(x.message); }
  }
  if (e.target.dataset.borrarVehiculo && confirm('Eliminar vehiculo?')) {
    try { await api(`/api/vehiculos/${idVehiculo}`, { method: 'DELETE' }); await cargarTodo(); } catch (x) { aviso(x.message); }
  }
  if (e.target.dataset.cancelarVenta && confirm('Cancelar esta venta y volver a publicar el vehiculo?')) {
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
  if (e.target.classList.contains('cancelar')) limpiarFormulario(e.target.closest('form'));
});

window.addEventListener('hashchange', () => cambiarVista(location.hash.replace('#', '') || 'tablero'));
$('select[name="idVehiculo"]').addEventListener('change', e => $('#formVenta').precioFinal.value = e.target.selectedOptions[0]?.dataset.precio || '');
$('#buscarClientes').addEventListener('input', renderClientes);

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
cargarTodo();
