let clientes = [];
let clientesActivos = [];
let vehiculos = [];
let vendidos = [];
let ofertas = [];
let estadisticas = {};

const moneda = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

async function realizarPeticion(url, opciones = {}) {
  if (opciones.body) {
    if (!opciones.headers) opciones.headers = {};
    opciones.headers['Content-Type'] = 'application/json';
  }
  const respuesta = await fetch(url, opciones);
  const datos = await respuesta.json();
  if (!respuesta.ok) {
    throw new Error(datos.error || 'Ocurrio un error al completar la operacion.');
  }
  return datos;
}

function aviso(texto) {
  const caja = document.getElementById('mensaje');
  caja.textContent = texto;
  caja.classList.add('visible');
  setTimeout(function() {
    caja.classList.remove('visible');
  }, 3500);
}

function obtenerDatosFormulario(formulario) {
  const formData = new FormData(formulario);
  const datos = {};
  formData.forEach(function(valor, llave) {
    datos[llave] = valor;
  });
  return datos;
}

function escapar(valor = '') {
  const div = document.createElement('div');
  div.textContent = valor;
  return div.innerHTML;
}

function fecha(valor) {
  if (!valor) return '';
  // Convertir formato de base de datos a formato local de fecha
  return new Date(valor.replace(' ', 'T')).toLocaleDateString('es-MX');
}

function actualizarCamposAbono() {
  const form = document.getElementById('formVenta');
  const estado = form.estatusPago.value;
  const grupo = document.getElementById('camposAbonoInicial');
  
  if (estado === 'PAGADO') {
    grupo.hidden = true;
    form.montoAbono.required = false;
  } else {
    grupo.hidden = false;
    form.montoAbono.required = true;
  }
  actualizarSaldoVenta();
}

function actualizarSaldoVenta() {
  const form = document.getElementById('formVenta');
  const precio = Number(form.precioFinal.value || 0);
  const abono = Number(form.montoAbono.value || 0);
  let saldo = precio - abono;
  if (saldo < 0) saldo = 0;
  
  let salida = document.getElementById('saldoVentaVivo');
  if (!salida) {
    salida = document.createElement('p');
    salida.id = 'saldoVentaVivo';
    salida.className = 'meta';
    document.getElementById('camposAbonoInicial').appendChild(salida);
  }
  salida.textContent = 'Saldo pendiente estimado: ' + moneda.format(saldo);
}

function badge(textoEstado) {
  let clase = 'estado';
  if (textoEstado === 'VENDIDO' || textoEstado === 'CANCELADA' || textoEstado === 'PENDIENTE') {
    clase = 'estado vendido';
  } else if (textoEstado === 'APARTADO') {
    clase = 'estado apartado';
  }
  return '<span class="' + clase + '">' + escapar(textoEstado || '') + '</span>';
}

function limpiarFormulario(formulario) {
  if (!formulario) return;
  formulario.reset();
  if (formulario.id) {
    formulario.id.value = '';
  }
  const boton = formulario.querySelector('[data-texto-base]');
  if (boton) {
    boton.textContent = boton.dataset.textoBase;
  }
}

function estadoClase(estado) {
  if (estado === 'APARTADO') return 'estado apartado';
  if (estado === 'VENDIDO') return 'estado vendido';
  return 'estado';
}

function cambiarVista(idVista = 'tablero') {
  let vistaValida = idVista;
  if (!document.getElementById(idVista)) {
    vistaValida = 'tablero';
  }
  
  const vistas = document.querySelectorAll('.vista');
  for (let i = 0; i < vistas.length; i++) {
    let panel = vistas[i];
    if (panel.id === vistaValida) {
      panel.classList.add('activa');
    } else {
      panel.classList.remove('activa');
    }
  }
  
  const links = document.querySelectorAll('[data-tab-link]');
  for (let i = 0; i < links.length; i++) {
    let link = links[i];
    if (link.dataset.tabLink === vistaValida) {
      link.classList.add('activo');
    } else {
      link.classList.remove('activo');
    }
  }
}

function opcionesCliente(seleccion = '') {
  let options = '<option value="">Selecciona una persona</option>';
  for (let i = 0; i < clientesActivos.length; i++) {
    let c = clientesActivos[i];
    let selectedText = String(c.id_cliente) === String(seleccion) ? 'selected' : '';
    options += '<option value="' + c.id_cliente + '" ' + selectedText + '>' + escapar(c.nombre_completo) + '</option>';
  }
  return options;
}

function actualizarMetricas() {
  document.getElementById('totalClientes').textContent = clientesActivos.length;
  document.getElementById('totalVendidos').textContent = estadisticas.vehiculos_vendidos ?? vendidos.length;
  document.getElementById('ingresosTotales').textContent = moneda.format(estadisticas.ingresos_totales || 0);
  document.getElementById('utilidadEstimada').textContent = moneda.format(estadisticas.utilidad_estimada || 0);
  document.getElementById('contadorClientes').textContent = clientes.length;
  document.getElementById('contadorVehiculos').textContent = vehiculos.length;
  document.getElementById('estadoConexion').textContent = 'Activo';
}

function descargarCSV(nombreArchivo, listaObjetos) {
  if (listaObjetos.length === 0) {
    aviso('No hay datos para exportar.');
    return;
  }
  let columnas = Object.keys(listaObjetos[0]);
  let lineas = [];
  lineas.push(columnas.join(','));
  
  for (let i = 0; i < listaObjetos.length; i++) {
    let fila = listaObjetos[i];
    let valoresCelda = [];
    for (let j = 0; j < columnas.length; j++) {
      let col = columnas[j];
      let val = fila[col];
      if (val === null || val === undefined) {
        val = '';
      }
      let textoCelda = String(val).replace(/"/g, '""');
      valoresCelda.push('"' + textoCelda + '"');
    }
    lineas.push(valoresCelda.join(','));
  }
  
  let contenido = lineas.join('\n');
  let blob = new Blob([contenido], { type: 'text/csv;charset=utf-8' });
  let enlace = document.createElement('a');
  enlace.href = URL.createObjectURL(blob);
  enlace.download = nombreArchivo + '.csv';
  enlace.click();
}

function imprimirReporte(tipo) {
  const esVentas = (tipo === 'vendidos');
  const titulo = esVentas ? 'Reporte de vehiculos vendidos' : 'Reporte de ofertas activas';
  const filas = esVentas ? vendidos : ofertas;
  
  if (filas.length === 0) {
    aviso('No hay datos para imprimir.');
    return;
  }
  
  let contenidoHtml = '';
  for (let i = 0; i < filas.length; i++) {
    let v = filas[i];
    let imgTag = '<div class="sin-imagen">Sin imagen</div>';
    if (v.url_imagen) {
      imgTag = '<img src="' + escapar(v.url_imagen) + '" alt="' + escapar(v.marca) + ' ' + escapar(v.linea) + '">';
    }
    
    let compradorTexto = '';
    let pagoTexto = '';
    if (esVentas) {
      compradorTexto = '<p><strong>Comprador:</strong> ' + escapar(v.comprador || '') + '</p>';
      pagoTexto = ' · <strong>Pago:</strong> ' + escapar(v.estatus_pago || '') +
                  '<p><strong>Pagado:</strong> ' + moneda.format(v.monto_pagado || 0) + ' · <strong>Saldo:</strong> ' + moneda.format(v.saldo_pendiente || 0) + '</p>';
    }
    
    contenidoHtml += '<article class="oferta-print">' +
                     '  <div class="imagen-wrap">' + imgTag + '</div>' +
                     '  <div>' +
                     '    <h2>' + escapar(v.marca) + ' ' + escapar(v.linea) + ' ' + v.modelo + '</h2>' +
                     '    <p class="precio">' + moneda.format(esVentas ? v.precio_final : v.precio_venta) + '</p>' +
                     '    <p><strong>Vendedor:</strong> ' + escapar(v.vendedor || '') + '</p>' +
                     compradorTexto +
                     '    <p><strong>Serie:</strong> ' + escapar(v.numero_serie || '') + '</p>' +
                     '    <p><strong>Color:</strong> ' + escapar(v.color || '') + ' · <strong>Transmision:</strong> ' + escapar(v.transmision || '') + ' · <strong>Cilindros:</strong> ' + escapar(v.numero_cilindros || '') + '</p>' +
                     '    <p><strong>' + (esVentas ? 'Venta' : 'Publicado') + ':</strong> ' + fecha(esVentas ? v.fecha_venta : v.fecha_publicacion) + pagoTexto + '</p>' +
                     '    <p>' + escapar(v.descripcion || '') + '</p>' +
                     '  </div>' +
                     '</article>';
  }
  
  const ventana = window.open('', '_blank', 'width=1000,height=700');
  if (!ventana) {
    aviso('El navegador bloqueo la ventana de impresion.');
    return;
  }
  
  ventana.document.write('<!doctype html>' +
    '<html lang="es-MX">' +
    '<head>' +
    '  <meta charset="utf-8">' +
    '  <title>' + escapar(titulo) + '</title>' +
    '  <style>' +
    '    body { font-family: Arial, sans-serif; color: #111418; margin: 28px; }' +
    '    h1 { font-size: 24px; margin: 0 0 6px; color: #a51f2b; }' +
    '    .subtitulo { color: #66707a; margin: 0 0 22px; }' +
    '    .oferta-print { display: grid; grid-template-columns: 180px 1fr; gap: 18px; padding: 16px 0; border-bottom: 1px solid #d8ddde; break-inside: avoid; page-break-inside: avoid; }' +
    '    .oferta-print img, .sin-imagen { width: 180px; height: 120px; object-fit: cover; border: 1px solid #cfd5d8; background: #f3f4f1; }' +
    '    .sin-imagen { display: grid; place-items: center; color: #66707a; font-size: 12px; }' +
    '    .oferta-print h2 { margin: 0 0 6px; font-size: 18px; }' +
    '    .oferta-print p { margin: 3px 0; font-size: 12px; }' +
    '    .precio { color: #a51f2b; font-weight: 800; font-size: 15px !important; }' +
    '    strong { display: inline; }' +
    '  </style>' +
    '</head>' +
    '<body>' +
    '  <h1>' + escapar(titulo) + '</h1>' +
    '  <p class="subtitulo">ADDJ MOTORS - generado el ' + new Date().toLocaleDateString('es-MX') + '</p>' +
    contenidoHtml +
    '  <script>' +
    '    window.onload = function() { setTimeout(function() { window.print(); }, 500); };' +
    '  </script>' +
    '</body>' +
    '</html>');
  ventana.document.close();
}

async function cargarClientes() {
  const selectEstado = document.getElementById('filtroEstadoClientes');
  const estado = selectEstado ? selectEstado.value : 'activos';
  
  const respuestas = await Promise.all([
    realizarPeticion('/api/clientes?estado=activos'),
    realizarPeticion('/api/clientes?estado=' + encodeURIComponent(estado))
  ]);
  
  clientesActivos = respuestas[0];
  clientes = respuestas[1];
  
  renderClientes();
  
  document.querySelectorAll('select[name="idVendedor"], select[name="idComprador"]').forEach(function(s) {
    s.innerHTML = opcionesCliente(s.value);
  });
}

function renderClientes() {
  const inputBuscar = document.getElementById('buscarClientes');
  const texto = inputBuscar ? inputBuscar.value.toLowerCase() : '';
  
  const filtrados = [];
  for (let i = 0; i < clientes.length; i++) {
    let c = clientes[i];
    let nombre = String(c.nombre_completo || '').toLowerCase();
    let correo = String(c.correo_electronico || '').toLowerCase();
    let tel = String(c.telefono || '').toLowerCase();
    let dom = String(c.domicilio || '').toLowerCase();
    
    if (nombre.includes(texto) || correo.includes(texto) || tel.includes(texto) || dom.includes(texto)) {
      filtrados.push(c);
    }
  }
  
  let html = '';
  if (filtrados.length > 0) {
    for (let i = 0; i < filtrados.length; i++) {
      let c = filtrados[i];
      let claseActivo = Number(c.activo) ? 'estado' : 'estado vendido';
      let textoActivo = Number(c.activo) ? 'ACTIVO' : 'INACTIVO';
      
      let botones = '';
      if (Number(c.activo)) {
        botones = '<button class="enlace" data-editar-cliente="' + c.id_cliente + '">Editar</button>' +
                  '<button class="enlace" data-borrar-cliente="' + c.id_cliente + '">Eliminar / desactivar</button>';
      } else {
        botones = '<button class="enlace" data-reactivar-cliente="' + c.id_cliente + '">Reactivar</button>';
      }
      
      html += '<article class="item">' +
              '  <div>' +
              '    <strong>' + escapar(c.nombre_completo) + '</strong>' +
              '    <p>' + escapar(c.correo_electronico) + ' · ' + escapar(c.telefono) + ' · <span class="' + claseActivo + '">' + textoActivo + '</span></p>' +
              '    <p class="meta">' + escapar(c.domicilio) + '</p>' +
              '  </div>' +
              '  <div class="acciones">' +
              botones +
              '  </div>' +
              '</article>';
    }
  } else {
    html = '<p class="meta">No hay clientes registrados.</p>';
  }
  
  document.getElementById('listaClientes').innerHTML = html;
}

async function cargarOfertas(filtros = '') {
  ofertas = await realizarPeticion('/api/reportes/ofertas' + filtros);
  
  let htmlOfertas = '';
  let htmlReporte = '';
  
  for (let i = 0; i < ofertas.length; i++) {
    let v = ofertas[i];
    
    let imgTag = '';
    if (v.url_imagen) {
      imgTag = '<img class="tarjeta-imagen" src="' + escapar(v.url_imagen) + '" alt="' + escapar(v.marca) + ' ' + escapar(v.linea) + '">';
    }
    
    htmlOfertas += '<article class="tarjeta">' +
                   imgTag +
                   '  <p class="etiqueta">' + escapar(v.marca) + '</p>' +
                   '  <h3>' + escapar(v.linea) + ' ' + v.modelo + '</h3>' +
                   '  <p class="precio">' + moneda.format(v.precio_venta) + '</p>' +
                   '  <p class="meta">' + escapar(v.color) + ' · ' + escapar(v.transmision) + ' · ' + v.numero_cilindros + ' cilindros</p>' +
                   '  <p>' + escapar(v.descripcion) + '</p>' +
                   '  <p class="meta">Publicado: ' + fecha(v.fecha_publicacion) + '</p>' +
                   '  <button class="enlace" data-detalle-vehiculo="' + v.id_vehiculo + '">Ver detalle</button>' +
                   '</article>';
                   
    htmlReporte += '<article class="fila-reporte">' +
                   '  <div><strong>' + escapar(v.marca) + ' ' + escapar(v.linea) + ' ' + v.modelo + '</strong><p class="meta">Serie ' + escapar(v.numero_serie || '') + '</p></div>' +
                   '  <div><span class="meta">Vendedor</span><strong>' + escapar(v.vendedor || '') + '</strong></div>' +
                   '  <div><span class="meta">Precio</span><strong>' + moneda.format(v.precio_venta) + '</strong></div>' +
                   '  <div><span class="meta">Fecha</span><strong>' + fecha(v.fecha_publicacion) + '</strong></div>' +
                   '  <div><span class="meta">Estado</span><strong>' + escapar(v.estado) + '</strong></div>' +
                   '</article>';
  }
  
  if (ofertas.length === 0) {
    htmlOfertas = '<p class="meta">No se encontraron ofertas.</p>';
    htmlReporte = '<p class="meta">No hay ofertas activas.</p>';
  }
  
  document.getElementById('listaOfertas').innerHTML = htmlOfertas;
  document.getElementById('listaOfertasReporte').innerHTML = htmlReporte;
  document.getElementById('totalOfertas').textContent = ofertas.length;
}

async function cargarVehiculos() {
  vehiculos = await realizarPeticion('/api/vehiculos');
  
  let htmlVehiculos = '';
  let publicados = [];
  
  for (let i = 0; i < vehiculos.length; i++) {
    let v = vehiculos[i];
    if (v.estado === 'PUBLICADO' || v.estado === 'APARTADO') {
      publicados.push(v);
    }
    
    let botones = '<button class="enlace" data-detalle-vehiculo="' + v.id_vehiculo + '">Detalle</button>';
    if (v.estado === 'PUBLICADO') {
      botones += '<button class="enlace" data-apartar-vehiculo="' + v.id_vehiculo + '">Apartar</button>' +
                 '<button class="enlace" data-editar-vehiculo="' + v.id_vehiculo + '">Editar</button>' +
                 '<button class="enlace" data-borrar-vehiculo="' + v.id_vehiculo + '">Eliminar</button>';
    } else if (v.estado === 'APARTADO') {
      botones += '<button class="enlace" data-liberar-vehiculo="' + v.id_vehiculo + '">Liberar</button>';
    }
    
    htmlVehiculos += '<article class="item">' +
                     '  <div>' +
                     '    <strong>' + escapar(v.marca) + ' ' + escapar(v.linea) + ' ' + v.modelo + '</strong>' +
                     '    <p>' + moneda.format(v.precio_venta) + ' · <span class="' + estadoClase(v.estado) + '">' + escapar(v.estado) + '</span></p>' +
                     '    <p class="meta">Vendedor: ' + escapar(v.vendedor || '') + '</p>' +
                     '  </div>' +
                     '  <div class="acciones">' +
                     botones +
                     '  </div>' +
                     '</article>';
  }
  
  if (vehiculos.length === 0) {
    htmlVehiculos = '<p class="meta">No hay vehiculos registrados.</p>';
  }
  
  document.getElementById('listaVehiculos').innerHTML = htmlVehiculos;
  
  let selectVehiculo = document.querySelector('select[name="idVehiculo"]');
  if (selectVehiculo) {
    let options = '<option value="">Selecciona un vehiculo</option>';
    for (let i = 0; i < publicados.length; i++) {
      let v = publicados[i];
      options += '<option value="' + v.id_vehiculo + '" data-precio="' + v.precio_venta + '">' +
                 escapar(v.marca) + ' ' + escapar(v.linea) + ' ' + v.modelo + ' (' + v.estado + ') - ' + moneda.format(v.precio_venta) +
                 '</option>';
    }
    selectVehiculo.innerHTML = options;
  }
}

async function cargarVendidos(filtros = '') {
  vendidos = await realizarPeticion('/api/reportes/vendidos' + filtros);
  
  let htmlResumen = '';
  let htmlReporte = '';
  
  let maxResumen = vendidos.length < 5 ? vendidos.length : 5;
  for (let i = 0; i < maxResumen; i++) {
    let v = vendidos[i];
    htmlResumen += '<article class="item">' +
                   '  <div>' +
                   '    <strong>' + escapar(v.marca) + ' ' + escapar(v.linea) + ' ' + v.modelo + '</strong>' +
                   '    <p>' + moneda.format(v.precio_final) + ' · ' + fecha(v.fecha_venta) + '</p>' +
                   '    <p class="meta">' + escapar(v.vendedor) + ' a ' + escapar(v.comprador) + '</p>' +
                   '  </div>' +
                   '</article>';
  }
  
  if (vendidos.length > 0) {
    let filasReporte = '';
    for (let i = 0; i < vendidos.length; i++) {
      let v = vendidos[i];
      
      let botonActa = '';
      if (v.ruta_acta) {
        botonActa = '<a class="enlace" target="_blank" href="' + escapar(v.ruta_acta) + '">Acta</a>';
      } else {
        botonActa = '<button class="enlace" data-regenerar-acta="' + v.id_venta + '">Regenerar acta</button>';
      }
      
      let botonCancelar = '';
      if (v.estado_venta !== 'CANCELADA') {
        botonCancelar = '<button class="enlace" data-cancelar-venta="' + v.id_venta + '">Cancelar</button>';
      }
      
      filasReporte += '<article class="tabla-fila">' +
                      '  <div><strong>' + escapar(v.folio_venta || ('VTA-' + v.id_venta)) + '</strong><p class="meta">' + escapar(v.marca) + ' ' + escapar(v.linea) + ' ' + v.modelo + '<br>Serie ' + escapar(v.numero_serie || '') + '</p></div>' +
                      '  <div><span class="meta">Vendedor</span><strong>' + escapar(v.vendedor) + '</strong><span class="meta">Comprador</span><strong>' + escapar(v.comprador) + '</strong></div>' +
                      '  <div><strong>' + fecha(v.fecha_venta) + '</strong></div>' +
                      '  <div><strong>' + moneda.format(v.monto_pagado || 0) + ' / ' + moneda.format(v.precio_final) + '</strong><p class="meta">Saldo: ' + moneda.format(v.saldo_pendiente || 0) + '</p>' + badge(v.estatus_pago) + '</div>' +
                      '  <div>' + badge(v.estado_venta || 'ACTIVA') + '</div>' +
                      '  <div class="acciones-menu">' +
                      '    <button class="enlace" data-detalle-venta="' + v.id_venta + '">Detalle</button>' +
                      '    ' + botonActa +
                      '    <button class="enlace" data-ver-abonos="' + v.id_venta + '">Abonos</button>' +
                      '    <button class="enlace" data-cambiar-estatus="' + v.id_venta + '">Cambiar pago</button>' +
                      '    ' + botonCancelar +
                      '  </div>' +
                      '</article>';
    }
    
    htmlReporte = '<div class="tabla-reporte ventas-tabla">' +
                  '  <div class="tabla-encabezado"><span>Venta</span><span>Cliente</span><span>Fecha</span><span>Pago</span><span>Estado</span><span>Acciones</span></div>' +
                  filasReporte +
                  '</div>';
  } else {
    htmlReporte = '<p class="meta empty-state">No hay ventas con esos filtros. Registra una venta o limpia los filtros.</p>';
  }
  
  if (vendidos.length === 0) {
    htmlResumen = '<p class="meta">Aun no hay ventas registradas.</p>';
  }
  
  document.getElementById('listaVendidosResumen').innerHTML = htmlResumen;
  document.getElementById('listaVendidos').innerHTML = htmlReporte;
}

async function mostrarAbonos(idVenta) {
  const venta = vendidos.find(function(v) { return Number(v.id_venta) === Number(idVenta); });
  const abonos = await realizarPeticion('/api/ventas/' + idVenta + '/abonos');
  
  let formHidden = '';
  if (venta?.estatus_pago === 'PAGADO' || venta?.estado_venta === 'CANCELADA') {
    formHidden = 'hidden';
  }
  
  let listHtml = '';
  if (abonos.length > 0) {
    for (let i = 0; i < abonos.length; i++) {
      let a = abonos[i];
      listHtml += '<article class="item">' +
                  '  <div>' +
                  '    <strong>' + moneda.format(a.monto) + '</strong>' +
                  '    <p>' + escapar(a.metodo_pago) + ' · ' + fecha(a.fecha_abono) + '</p>' +
                  '    <p class="meta">' + escapar(a.referencia_pago || '') + ' ' + escapar(a.observaciones || '') + '</p>' +
                  '  </div>' +
                  '</article>';
    }
  } else {
    listHtml = '<p class="meta">No hay abonos registrados.</p>';
  }
  
  document.getElementById('detalleAbonos').innerHTML = `
    <p class="etiqueta">CONTROL DE PAGOS</p>
    <h2>${escapar(venta?.marca || '')} ${escapar(venta?.linea || '')} ${venta?.modelo || ''}</h2>
    <p class="meta">Total: ${moneda.format(venta?.precio_final || 0)} · Pagado: ${moneda.format(venta?.monto_pagado || 0)} · Saldo: ${moneda.format(venta?.saldo_pendiente || 0)}</p>
    <form id="formAbono" class="formulario" ${formHidden}>
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
    <div class="lista">${listHtml}</div>`;
    
  if (!document.getElementById('modalAbonos').open) {
    document.getElementById('modalAbonos').showModal();
  }
}

async function mostrarDetalleVenta(idVenta) {
  const venta = vendidos.find(function(v) { return Number(v.id_venta) === Number(idVenta); });
  if (!venta) return;
  const abonos = await realizarPeticion('/api/ventas/' + idVenta + '/abonos');
  
  let listHtml = '';
  if (abonos.length > 0) {
    for (let i = 0; i < abonos.length; i++) {
      let a = abonos[i];
      listHtml += '<article class="item">' +
                  '  <div>' +
                  '    <strong>' + moneda.format(a.monto) + '</strong>' +
                  '    <p>' + escapar(a.metodo_pago) + ' · ' + fecha(a.fecha_abono) + '</p>' +
                  '    <p class="meta">' + escapar(a.referencia_pago || '') + ' ' + escapar(a.observaciones || '') + '</p>' +
                  '  </div>' +
                  '</article>';
    }
  } else {
    listHtml = '<p class="meta">No hay abonos registrados.</p>';
  }
  
  let botonActa = '';
  if (venta.ruta_acta) {
    botonActa = '<a class="boton primario" target="_blank" href="' + escapar(venta.ruta_acta) + '">Reimprimir acta</a>';
  } else {
    botonActa = '<button class="boton primario" data-regenerar-acta="' + venta.id_venta + '">Regenerar acta</button>';
  }
  
  document.getElementById('detalleVenta').innerHTML = `
    <p class="etiqueta">DETALLE DE VENTA</p>
    <h2>${escapar(venta.folio_venta || ('Venta ' + venta.id_venta))}</h2>
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
    <div class="lista">${listHtml}</div>
    ${botonActa}`;
    
  document.getElementById('modalVenta').showModal();
}

async function cambiarEstatusPago(idVenta) {
  const venta = vendidos.find(function(v) { return Number(v.id_venta) === Number(idVenta); });
  if (!venta) return;
  const nuevo = prompt('Nuevo estatus de pago: PAGADO, PENDIENTE o APARTADO', venta.estatus_pago);
  if (!nuevo) return;
  
  const estatusPago = nuevo.trim().toUpperCase();
  if (estatusPago !== 'PAGADO' && estatusPago !== 'PENDIENTE' && estatusPago !== 'APARTADO') {
    aviso('Estatus invalido.');
    return;
  }
  const motivo = prompt('Motivo del cambio', 'Ajuste administrativo') || 'Ajuste administrativo';
  const r = await realizarPeticion('/api/ventas/' + idVenta + '/estatus', { 
    method: 'PUT', 
    body: JSON.stringify({ estatusPago: estatusPago, motivo: motivo }) 
  });
  await cargarVendidos();
  aviso(r.mensaje || 'Estatus actualizado.');
}

function editarCliente(id) {
  const c = clientes.find(function(x) { return x.id_cliente === id; });
  if (!c) return;
  const f = document.getElementById('formCliente');
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
  const v = vehiculos.find(function(x) { return x.id_vehiculo === id; });
  if (!v) return;
  const f = document.getElementById('formVehiculo');
  f.id.value = v.id_vehiculo;
  
  const campos = ['idVendedor', 'numeroMotor', 'numeroSerie', 'modelo', 'marca', 'linea', 'color', 'precioCompra', 'precioVenta', 'transmision', 'numeroCilindros', 'nacionalidad', 'descripcion', 'observaciones', 'urlImagen'];
  for (let i = 0; i < campos.length; i++) {
    let nombre = campos[i];
    let llave = nombre;
    if (nombre === 'idVendedor') llave = 'id_vendedor';
    else if (nombre === 'numeroMotor') llave = 'numero_motor';
    else if (nombre === 'numeroSerie') llave = 'numero_serie';
    else if (nombre === 'numeroCilindros') llave = 'numero_cilindros';
    else if (nombre === 'precioCompra') llave = 'precio_compra';
    else if (nombre === 'precioVenta') llave = 'precio_venta';
    else if (nombre === 'urlImagen') llave = 'url_imagen';
    
    f[nombre].value = v[llave] || '';
  }
  f.querySelector('[data-texto-base]').textContent = 'Actualizar vehiculo';
  location.hash = 'vehiculos';
  cambiarVista('vehiculos');
}

function mostrarDetalleVehiculo(id) {
  const findFunc = function(x) { return Number(x.id_vehiculo) === Number(id); };
  const v = vehiculos.find(findFunc) || ofertas.find(findFunc);
  if (!v) return;
  
  let imgHtml = '';
  if (v.url_imagen) {
    imgHtml = '<img class="tarjeta-imagen" src="' + escapar(v.url_imagen) + '" alt="' + escapar(v.marca) + ' ' + escapar(v.linea) + '">';
  }
  
  document.getElementById('detalleVehiculo').innerHTML = `
    <p class="etiqueta">DETALLE</p>
    <h2>${escapar(v.marca)} ${escapar(v.linea)} ${v.modelo}</h2>
    ${imgHtml}
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
  document.getElementById('modalDetalle').showModal();
}

document.getElementById('formCliente').addEventListener('submit', async function(e) {
  e.preventDefault();
  const f = e.currentTarget;
  const d = obtenerDatosFormulario(f);
  const id = String(d.id || '').trim();
  delete d.id;
  
  try {
    let url = '/api/clientes';
    let metodo = 'POST';
    if (id) {
      url = '/api/clientes/' + id;
      metodo = 'PUT';
    }
    await realizarPeticion(url, { method: metodo, body: JSON.stringify(d) });
    limpiarFormulario(f);
    await cargarTodo();
    aviso('Cliente guardado correctamente.');
  } catch (x) {
    aviso(x.message);
  }
});

document.getElementById('formVehiculo').addEventListener('submit', async function(e) {
  e.preventDefault();
  const f = e.currentTarget;
  const d = obtenerDatosFormulario(f);
  const id = String(d.id || '').trim();
  delete d.id;
  
  try {
    let url = '/api/vehiculos';
    let metodo = 'POST';
    if (id) {
      url = '/api/vehiculos/' + id;
      metodo = 'PUT';
    }
    await realizarPeticion(url, { method: metodo, body: JSON.stringify(d) });
    limpiarFormulario(f);
    await cargarTodo();
    aviso('Vehiculo guardado correctamente.');
  } catch (x) {
    aviso(x.message);
  }
});

document.getElementById('formVenta').addEventListener('submit', async function(e) {
  e.preventDefault();
  const f = e.currentTarget;
  const d = obtenerDatosFormulario(f);
  
  const vehiculo = vehiculos.find(function(v) { return String(v.id_vehiculo) === String(d.idVehiculo); });
  if (vehiculo && String(vehiculo.id_vendedor) === String(d.idComprador)) {
    aviso('Comprador y vendedor deben ser diferentes.');
    return;
  }
  
  let abono = Number(d.montoAbono || 0);
  let precioFinal = Number(d.precioFinal || 0);
  
  if ((d.estatusPago === 'PENDIENTE' || d.estatusPago === 'APARTADO') && abono > precioFinal) {
    aviso('El monto pagado no puede ser mayor al precio final.');
    return;
  }
  if (d.estatusPago === 'APARTADO' && abono <= 0) {
    aviso('Un apartado requiere un monto pagado mayor a cero.');
    return;
  }
  
  if (!confirm('¿Confirmar registro de venta? El vehiculo pasara a vendido.')) {
    return;
  }
  
  try {
    const resultado = await realizarPeticion('/api/ventas', { method: 'POST', body: JSON.stringify(d) });
    const actaDiv = document.getElementById('acta');
    actaDiv.hidden = false;
    if (resultado.acta) {
      actaDiv.innerHTML = '<h3>Acta generada con Java</h3>' +
                         '<p>La venta quedo registrada y Java creo el documento formal de compraventa.</p>' +
                         '<a class="boton primario" target="_blank" rel="noopener" href="' + resultado.acta + '">Abrir e imprimir acta</a>';
    } else {
      actaDiv.innerHTML = '<h3>Venta registrada</h3><p>' + escapar(resultado.mensaje || 'La venta quedo guardada, pero el acta no se genero.') + '</p>';
    }
    limpiarFormulario(f);
    await cargarTodo();
    aviso('Venta registrada.');
  } catch (x) {
    aviso(x.message);
  }
});

document.getElementById('filtroVehiculos').addEventListener('submit', function(e) {
  e.preventDefault();
  const d = obtenerDatosFormulario(e.currentTarget);
  const p = new URLSearchParams();
  
  Object.keys(d).forEach(function(k) {
    if (d[k]) p.append(k, d[k]);
  });
  
  let query = p.toString();
  cargarOfertas(query ? '?' + query : '').then(actualizarMetricas).catch(function(x) {
    aviso(x.message);
  });
});

document.getElementById('filtroVehiculos').addEventListener('reset', function() {
  setTimeout(function() {
    cargarOfertas().then(actualizarMetricas);
  }, 0);
});

document.getElementById('filtroVentas').addEventListener('submit', function(e) {
  e.preventDefault();
  const d = obtenerDatosFormulario(e.currentTarget);
  const p = new URLSearchParams();
  
  Object.keys(d).forEach(function(k) {
    if (d[k]) p.append(k, d[k]);
  });
  
  let query = p.toString();
  cargarVendidos(query ? '?' + query : '').catch(function(x) {
    aviso(x.message);
  });
});

document.getElementById('filtroVentas').addEventListener('reset', function() {
  setTimeout(function() {
    cargarVendidos();
  }, 0);
});

document.addEventListener('click', async function(e) {
  const tab = e.target.closest('[data-tab-link]');
  if (tab) {
    cambiarVista(tab.dataset.tabLink);
  }
  
  const idCliente = e.target.dataset.editarCliente || e.target.dataset.borrarCliente || e.target.dataset.reactivarCliente;
  const idVehiculo = e.target.dataset.editarVehiculo || e.target.dataset.borrarVehiculo || e.target.dataset.apartarVehiculo || e.target.dataset.liberarVehiculo;
  
  if (e.target.dataset.editarCliente) {
    editarCliente(Number(idCliente));
  }
  if (e.target.dataset.editarVehiculo) {
    editarVehiculo(Number(idVehiculo));
  }
  if (e.target.dataset.detalleVehiculo) {
    mostrarDetalleVehiculo(Number(e.target.dataset.detalleVehiculo));
  }
  
  if (e.target.dataset.cerrarModal !== undefined) {
    document.getElementById('modalDetalle').close();
  }
  if (e.target.dataset.cerrarAbonos !== undefined) {
    document.getElementById('modalAbonos').close();
  }
  if (e.target.dataset.cerrarVenta !== undefined) {
    document.getElementById('modalVenta').close();
  }
  
  if (e.target.classList.contains('nuevo-registro')) {
    limpiarFormulario(e.target.closest('form'));
  }
  
  if (e.target.dataset.csv === 'ofertas') {
    descargarCSV('ofertas-activas', ofertas);
  }
  if (e.target.dataset.csv === 'vendidos') {
    descargarCSV('vehiculos-vendidos', vendidos);
  }
  if (e.target.dataset.print) {
    imprimirReporte(e.target.dataset.print);
  }
  
  if (e.target.dataset.borrarCliente && confirm('¿Eliminar cliente? Si tiene vehiculos o ventas, solo se desactivara para conservar el historial.')) {
    try {
      const r = await realizarPeticion('/api/clientes/' + idCliente, { method: 'DELETE' });
      await cargarTodo();
      aviso(r.mensaje || 'Cliente actualizado.');
    } catch (x) {
      aviso(x.message);
    }
  }
  
  if (e.target.dataset.reactivarCliente && confirm('¿Reactivar este cliente para nuevos registros?')) {
    try {
      const r = await realizarPeticion('/api/clientes/' + idCliente + '/reactivar', { method: 'POST' });
      await cargarTodo();
      aviso(r.mensaje || 'Cliente reactivado.');
    } catch (x) {
      aviso(x.message);
    }
  }
  
  if (e.target.dataset.borrarVehiculo && confirm('¿Eliminar vehiculo?')) {
    try {
      await realizarPeticion('/api/vehiculos/' + idVehiculo, { method: 'DELETE' });
      await cargarTodo();
    } catch (x) {
      aviso(x.message);
    }
  }
  
  if (e.target.dataset.apartarVehiculo && confirm('¿Marcar este vehiculo como apartado?')) {
    try {
      await realizarPeticion('/api/vehiculos/' + idVehiculo + '/estado', { 
        method: 'PUT', 
        body: JSON.stringify({ estado: 'APARTADO', motivo: 'Apartado antes de venta' }) 
      });
      await cargarTodo();
      aviso('Vehiculo apartado.');
    } catch (x) {
      aviso(x.message);
    }
  }
  
  if (e.target.dataset.liberarVehiculo && confirm('¿Liberar este vehiculo para venta?')) {
    try {
      await realizarPeticion('/api/vehiculos/' + idVehiculo + '/estado', { 
        method: 'PUT', 
        body: JSON.stringify({ estado: 'PUBLICADO', motivo: 'Liberacion de apartado' }) 
      });
      await cargarTodo();
      aviso('Vehiculo publicado.');
    } catch (x) {
      aviso(x.message);
    }
  }
  
  if (e.target.dataset.detalleVenta) {
    try {
      await mostrarDetalleVenta(e.target.dataset.detalleVenta);
    } catch (x) {
      aviso(x.message);
    }
  }
  
  if (e.target.dataset.cambiarEstatus) {
    try {
      await cambiarEstatusPago(e.target.dataset.cambiarEstatus);
    } catch (x) {
      aviso(x.message);
    }
  }
  
  if (e.target.dataset.cancelarVenta) {
    const venta = vendidos.find(function(v) { return Number(v.id_venta) === Number(e.target.dataset.cancelarVenta); });
    const texto = (venta?.estatus_pago === 'PAGADO') ? 'CANCELAR PAGADA' : 'CANCELAR';
    if (prompt('Esta accion conservara acta y abonos, y marcara la venta como CANCELADA. Escribe "' + texto + '" para confirmar.') !== texto) {
      return;
    }
    try {
      await realizarPeticion('/api/ventas/' + e.target.dataset.cancelarVenta + '/cancelar', { method: 'POST' });
      await cargarTodo();
      aviso('Venta cancelada.');
    } catch (x) {
      aviso(x.message);
    }
  }
  
  if (e.target.dataset.regenerarActa) {
    try {
      const resultado = await realizarPeticion('/api/ventas/' + e.target.dataset.regenerarActa + '/acta', { method: 'POST' });
      await cargarTodo();
      aviso('Acta regenerada.');
      if (resultado.acta) {
        window.open(resultado.acta, '_blank');
      }
    } catch (x) {
      aviso(x.message);
    }
  }
  
  if (e.target.dataset.verAbonos) {
    try {
      await mostrarAbonos(e.target.dataset.verAbonos);
    } catch (x) {
      aviso(x.message);
    }
  }
  
  if (e.target.classList.contains('cancelar')) {
    limpiarFormulario(e.target.closest('form'));
  }
});

document.addEventListener('submit', async function(e) {
  if (e.target.id !== 'formAbono') return;
  e.preventDefault();
  const d = obtenerDatosFormulario(e.target);
  try {
    const r = await realizarPeticion('/api/ventas/' + d.idVenta + '/abonos', { method: 'POST', body: JSON.stringify(d) });
    await cargarTodo();
    await mostrarAbonos(d.idVenta);
    aviso(r.mensaje || 'Abono registrado.');
  } catch (x) {
    aviso(x.message);
  }
});

window.addEventListener('hashchange', function() {
  cambiarVista(location.hash.replace('#', '') || 'tablero');
});

const selectVehiculoVenta = document.querySelector('select[name="idVehiculo"]');
if (selectVehiculoVenta) {
  selectVehiculoVenta.addEventListener('change', function(e) {
    const option = e.target.selectedOptions[0];
    document.getElementById('formVenta').precioFinal.value = option?.dataset.precio || '';
  });
}

const selectEstatusPagoVenta = document.querySelector('select[name="estatusPago"]');
if (selectEstatusPagoVenta) {
  selectEstatusPagoVenta.addEventListener('change', actualizarCamposAbono);
}

document.getElementById('formVenta').precioFinal.addEventListener('input', actualizarSaldoVenta);
document.getElementById('formVenta').montoAbono.addEventListener('input', actualizarSaldoVenta);
document.getElementById('buscarClientes').addEventListener('input', renderClientes);

document.getElementById('filtroEstadoClientes').addEventListener('change', function() {
  cargarClientes().then(actualizarMetricas).catch(function(x) {
    aviso(x.message);
  });
});

async function cargarTodo() {
  try {
    await cargarClientes();
    await cargarVehiculos();
    await cargarOfertas();
    await cargarVendidos();
    estadisticas = await realizarPeticion('/api/reportes/estadisticas');
    actualizarMetricas();
  } catch (x) {
    document.getElementById('estadoConexion').textContent = 'Sin conexion';
    aviso('No se pudo conectar: ' + x.message);
  }
}

cambiarVista(location.hash.replace('#', '') || 'tablero');
actualizarCamposAbono();
cargarTodo();
