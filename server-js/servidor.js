const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const mysql = require('mysql2/promise');

let config;
try {
  config = require('./database.local.js');
} catch (err) {
  console.error('Falta el archivo server-js/database.local.js. Copie database.config.example.js y configure sus credenciales.');
  process.exit(1);
}

const puerto = Number(process.env.PORT || 8080);
const raiz = path.join(__dirname, '..');
const pool = mysql.createPool({ 
  ...config, 
  charset: 'utf8mb4', 
  waitForConnections: true, 
  connectionLimit: 10 
});

function responder(res, estado, datos) {
  res.writeHead(estado, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(datos));
  return true;
}

function cuerpo(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(new Error('JSON no valido'));
      }
    });
  });
}

function folioVenta(id) {
  return 'VTA-' + String(id).padStart(5, '0');
}

function validarNombre(nombre) {
  if (!nombre || nombre.trim().length < 2) {
    throw new Error('El nombre es demasiado corto.');
  }
  return nombre.trim();
}

function normalizarCliente(d) {
  if (!d.nombreCompleto || !d.domicilio || !d.correoElectronico || !d.telefono) {
    throw new Error('Faltan campos obligatorios para el cliente.');
  }
  return [
    validarNombre(d.nombreCompleto),
    String(d.domicilio).trim(),
    String(d.correoElectronico).trim().toLowerCase(),
    String(d.telefono).trim()
  ];
}

function normalizarVehiculo(d) {
  if (!d.idVendedor || !d.numeroMotor || !d.numeroSerie || !d.modelo || !d.marca || !d.linea || !d.color || !d.precioCompra || !d.precioVenta || !d.transmision || !d.numeroCilindros || !d.nacionalidad || !d.descripcion) {
    throw new Error('Faltan campos obligatorios para el vehiculo.');
  }
  if (Number(d.precioVenta) <= 0) {
    throw new Error('El precio de venta debe ser mayor a cero.');
  }
  return [
    d.idVendedor,
    d.numeroMotor,
    d.numeroSerie,
    d.modelo,
    d.marca,
    d.linea,
    d.color,
    d.precioCompra,
    d.precioVenta,
    d.transmision,
    d.numeroCilindros,
    d.nacionalidad,
    d.descripcion,
    d.observaciones || '',
    d.urlImagen || ''
  ];
}

function enviarArchivo(res, rutaArchivo) {
  fs.readFile(rutaArchivo, (err, contenido) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Archivo no encontrado' }));
      return;
    }
    
    let ext = path.extname(rutaArchivo);
    let tipo = 'text/plain; charset=utf-8';
    if (ext === '.html') tipo = 'text/html; charset=utf-8';
    else if (ext === '.css') tipo = 'text/css; charset=utf-8';
    else if (ext === '.js') tipo = 'application/javascript; charset=utf-8';
    else if (ext === '.png') tipo = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') tipo = 'image/jpeg';
    else if (ext === '.ico') tipo = 'image/x-icon';
    else if (ext === '.svg') tipo = 'image/svg+xml; charset=utf-8';
    
    res.writeHead(200, { 'Content-Type': tipo });
    res.end(contenido);
  });
}

function resolverArchivoPublico(ruta) {
  let archivoRelativo = ruta;
  if (ruta === '/') {
    archivoRelativo = '/frontend/index.html';
  } else {
    // Quitar el primer caracter '/' para hacer la ruta relativa
    archivoRelativo = ruta.slice(1);
  }
  
  // Buscar en la carpeta raiz del proyecto
  let rutaCompleta = path.join(raiz, archivoRelativo);
  if (fs.existsSync(rutaCompleta)) {
    return rutaCompleta;
  }
  
  // Buscar dentro de frontend
  let rutaFrontend = path.join(raiz, 'frontend', archivoRelativo);
  if (fs.existsSync(rutaFrontend)) {
    return rutaFrontend;
  }
  
  return rutaCompleta;
}

function obtenerFiltrosVehiculos(url, soloPublicados) {
  let queryParams = url.searchParams;
  let valores = [];
  let sql = 'SELECT v.*, c.nombre_completo AS vendedor FROM vehiculos v JOIN clientes c ON c.id_cliente = v.id_vendedor WHERE 1 = 1';
  
  if (soloPublicados) {
    sql += " AND v.estado IN ('PUBLICADO', 'APARTADO')";
  }
  
  if (queryParams.get('modelo')) {
    sql += ' AND v.modelo = ?';
    valores.push(queryParams.get('modelo'));
  }
  if (queryParams.get('marca')) {
    sql += ' AND v.marca LIKE ?';
    valores.push('%' + queryParams.get('marca') + '%');
  }
  if (queryParams.get('linea')) {
    sql += ' AND v.linea LIKE ?';
    valores.push('%' + queryParams.get('linea') + '%');
  }
  if (queryParams.get('color')) {
    sql += ' AND v.color LIKE ?';
    valores.push('%' + queryParams.get('color') + '%');
  }
  if (queryParams.get('transmision')) {
    sql += ' AND v.transmision = ?';
    valores.push(queryParams.get('transmision'));
  }
  if (queryParams.get('cilindros')) {
    sql += ' AND v.numero_cilindros = ?';
    valores.push(queryParams.get('cilindros'));
  }
  if (queryParams.get('nacionalidad')) {
    sql += ' AND v.nacionalidad LIKE ?';
    valores.push('%' + queryParams.get('nacionalidad') + '%');
  }
  if (queryParams.get('precio')) {
    sql += ' AND v.precio_venta = ?';
    valores.push(queryParams.get('precio'));
  }
  if (queryParams.get('precioMin')) {
    sql += ' AND v.precio_venta >= ?';
    valores.push(queryParams.get('precioMin'));
  }
  if (queryParams.get('precioMax')) {
    sql += ' AND v.precio_venta <= ?';
    valores.push(queryParams.get('precioMax'));
  }
  if (queryParams.get('fecha')) {
    sql += ' AND DATE(v.fecha_publicacion) = ?';
    valores.push(queryParams.get('fecha'));
  }

  let orden = queryParams.get('orden');
  if (orden === 'precio_asc') sql += ' ORDER BY v.precio_venta ASC';
  else if (orden === 'precio_desc') sql += ' ORDER BY v.precio_venta DESC';
  else if (orden === 'modelo_asc') sql += ' ORDER BY v.modelo ASC';
  else if (orden === 'modelo_desc') sql += ' ORDER BY v.modelo DESC';
  else if (orden === 'fecha_asc') sql += ' ORDER BY v.fecha_publicacion ASC';
  else sql += ' ORDER BY v.fecha_publicacion DESC';

  let limite = queryParams.get('limite');
  if (limite) {
    let num = parseInt(limite) || 20;
    if (num < 1) num = 1;
    if (num > 100) num = 100;
    sql += ' LIMIT ' + num;
  }
  
  return [sql, valores];
}

function ejecutarGeneradorActa(datos) {
  let archivo = 'acta-venta-' + datos.idVehiculo + '-' + Date.now() + '.html';
  let argumentos = [
    '-cp', path.join('java', 'out'), 'GeneradorActa',
    String(datos.idVehiculo),
    datos.numeroMotor,
    datos.numeroSerie,
    String(datos.modelo),
    datos.marca,
    datos.linea,
    datos.color,
    String(datos.precioCompra),
    String(datos.precioFinal),
    datos.transmision,
    String(datos.numeroCilindros),
    datos.nacionalidad,
    datos.descripcion,
    datos.observaciones || '',
    datos.vendedor,
    datos.domicilioVendedor,
    datos.correoVendedor,
    datos.telefonoVendedor,
    datos.comprador,
    datos.domicilioComprador,
    datos.correoComprador,
    datos.telefonoComprador,
    datos.lugar,
    new Date().toLocaleDateString('es-MX'),
    archivo
  ];
  execFileSync('java', argumentos, { cwd: raiz });
  return archivo;
}

function datosActaDesdeFila(fila) {
  return {
    idVehiculo: fila.id_vehiculo,
    numeroMotor: fila.numero_motor,
    numeroSerie: fila.numero_serie,
    modelo: fila.modelo,
    marca: fila.marca,
    linea: fila.linea,
    color: fila.color,
    precioCompra: fila.precio_compra,
    precioFinal: fila.precio_final,
    transmision: fila.transmision,
    numeroCilindros: fila.numero_cilindros,
    nacionalidad: fila.nacionalidad,
    descripcion: fila.descripcion,
    observaciones: fila.observaciones,
    vendedor: fila.vendedor,
    domicilioVendedor: fila.domicilio_vendedor,
    correoVendedor: fila.correo_vendedor,
    telefonoVendedor: fila.telefono_vendedor,
    comprador: fila.comprador,
    domicilioComprador: fila.domicilio_comprador,
    correoComprador: fila.correo_comprador,
    telefonoComprador: fila.telefono_comprador,
    lugar: 'Morelia, Michoacan.'
  };
}

async function procesarApi(req, res, ruta, url) {
  // --- CLIENTES ---
  if (ruta === '/api/clientes' && req.method === 'GET') {
    let estado = url.searchParams.get('estado') || 'activos';
    let sql = 'SELECT * FROM clientes WHERE activo = 1 ORDER BY nombre_completo';
    if (estado === 'inactivos') {
      sql = 'SELECT * FROM clientes WHERE activo = 0 ORDER BY nombre_completo';
    } else if (estado === 'todos') {
      sql = 'SELECT * FROM clientes ORDER BY activo DESC, nombre_completo';
    }
    const [filas] = await pool.query(sql);
    return responder(res, 200, filas);
  }
  
  if (ruta === '/api/clientes' && req.method === 'POST') {
    const d = await cuerpo(req);
    const datos = normalizarCliente(d);
    const [resultado] = await pool.execute('INSERT INTO clientes(nombre_completo, domicilio, correo_electronico, telefono) VALUES(?, ?, ?, ?)', datos);
    return responder(res, 201, { id: resultado.insertId });
  }
  
  if (ruta.startsWith('/api/clientes/') && !ruta.endsWith('/reactivar')) {
    const partes = ruta.split('/');
    const id = partes[partes.length - 1];
    
    if (req.method === 'PUT') {
      const d = await cuerpo(req);
      const datos = normalizarCliente(d);
      await pool.execute('UPDATE clientes SET nombre_completo = ?, domicilio = ?, correo_electronico = ?, telefono = ?, activo = 1 WHERE id_cliente = ?', [...datos, id]);
      return responder(res, 200, { id: id });
    }
    
    if (req.method === 'DELETE') {
      const [vehiculos] = await pool.execute('SELECT COUNT(*) AS total FROM vehiculos WHERE id_vendedor = ?', [id]);
      const [ventas] = await pool.execute('SELECT COUNT(*) AS total FROM ventas WHERE id_comprador = ?', [id]);
      let totalVehiculos = vehiculos[0].total;
      let totalVentas = ventas[0].total;
      
      if (totalVehiculos > 0 || totalVentas > 0) {
        await pool.execute('UPDATE clientes SET activo = 0 WHERE id_cliente = ?', [id]);
        return responder(res, 200, { mensaje: 'Cliente desactivado; sus vehiculos y ventas historicas se conservan.' });
      } else {
        await pool.execute('DELETE FROM clientes WHERE id_cliente = ?', [id]);
        return responder(res, 200, { mensaje: 'Cliente eliminado definitivamente porque no tenia historial.' });
      }
    }
  }
  
  if (ruta.startsWith('/api/clientes/') && ruta.endsWith('/reactivar') && req.method === 'POST') {
    const partes = ruta.split('/');
    const id = partes[3];
    await pool.execute('UPDATE clientes SET activo = 1 WHERE id_cliente = ?', [id]);
    return responder(res, 200, { mensaje: 'Cliente reactivado.' });
  }
  
  // --- VEHICULOS ---
  if (ruta === '/api/vehiculos' && req.method === 'GET') {
    const [sql, valores] = obtenerFiltrosVehiculos(url, false);
    const [filas] = await pool.execute(sql, valores);
    return responder(res, 200, filas);
  }
  
  if (ruta === '/api/vehiculos' && req.method === 'POST') {
    const d = await cuerpo(req);
    const datos = normalizarVehiculo(d);
    const [resultado] = await pool.execute('INSERT INTO vehiculos(id_vendedor, numero_motor, numero_serie, modelo, marca, linea, color, precio_compra, precio_venta, transmision, numero_cilindros, nacionalidad, descripcion, observaciones, url_imagen) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', datos);
    return responder(res, 201, { id: resultado.insertId });
  }
  
  if (ruta.startsWith('/api/vehiculos/') && !ruta.endsWith('/estado')) {
    const partes = ruta.split('/');
    const id = partes[partes.length - 1];
    
    if (req.method === 'GET') {
      const [filas] = await pool.execute('SELECT v.*, c.nombre_completo AS vendedor FROM vehiculos v JOIN clientes c ON c.id_cliente = v.id_vendedor WHERE v.id_vehiculo = ?', [id]);
      if (filas.length === 0) {
        return responder(res, 404, { error: 'Vehiculo no encontrado.' });
      }
      return responder(res, 200, filas[0]);
    }
    
    if (req.method === 'PUT') {
      const [filas] = await pool.execute('SELECT estado FROM vehiculos WHERE id_vehiculo = ?', [id]);
      if (filas.length === 0) throw new Error('El vehiculo no existe.');
      if (filas[0].estado === 'VENDIDO') throw new Error('No se puede editar un vehiculo vendido.');
      
      const d = await cuerpo(req);
      const datos = normalizarVehiculo(d);
      await pool.execute('UPDATE vehiculos SET id_vendedor = ?, numero_motor = ?, numero_serie = ?, modelo = ?, marca = ?, linea = ?, color = ?, precio_compra = ?, precio_venta = ?, transmision = ?, numero_cilindros = ?, nacionalidad = ?, descripcion = ?, observaciones = ?, url_imagen = ? WHERE id_vehiculo = ?', [...datos, id]);
      return responder(res, 200, { id: id });
    }
    
    if (req.method === 'DELETE') {
      const [filas] = await pool.execute('SELECT estado FROM vehiculos WHERE id_vehiculo = ?', [id]);
      if (filas.length > 0 && filas[0].estado === 'VENDIDO') {
        throw new Error('No se puede eliminar un vehiculo vendido.');
      }
      await pool.execute('DELETE FROM vehiculos WHERE id_vehiculo = ?', [id]);
      return responder(res, 200, { mensaje: 'Vehiculo eliminado' });
    }
  }
  
  if (ruta.startsWith('/api/vehiculos/') && ruta.endsWith('/estado') && req.method === 'PUT') {
    const partes = ruta.split('/');
    const id = partes[3];
    const d = await cuerpo(req);
    
    if (d.estado !== 'PUBLICADO' && d.estado !== 'APARTADO') {
      throw new Error('Estado de vehiculo invalido.');
    }
    
    const [filas] = await pool.execute('SELECT estado FROM vehiculos WHERE id_vehiculo = ?', [id]);
    if (filas.length === 0) throw new Error('El vehiculo no existe.');
    if (filas[0].estado === 'VENDIDO') throw new Error('No se puede cambiar el estado de un vehiculo vendido.');
    
    await pool.execute('UPDATE vehiculos SET estado = ? WHERE id_vehiculo = ?', [d.estado, id]);
    await pool.execute('INSERT INTO historial_estados(entidad, id_entidad, estado_anterior, estado_nuevo, motivo) VALUES(?, ?, ?, ?, ?)', ['VEHICULO', id, filas[0].estado, d.estado, d.motivo || 'Cambio manual de estado']);
    return responder(res, 200, { mensaje: 'Estado de vehiculo actualizado.' });
  }
  
  // --- VENTAS ---
  if (ruta === '/api/ventas' && req.method === 'POST') {
    const d = await cuerpo(req);
    if (!d.idVehiculo || !d.idComprador || !d.precioFinal) {
      throw new Error('Faltan campos obligatorios para registrar la venta.');
    }
    
    const conexion = await pool.getConnection();
    let datosActa;
    let idVenta;
    try {
      await conexion.beginTransaction();
      
      const [filasVehiculo] = await conexion.execute("SELECT v.*, c.nombre_completo vendedor, c.domicilio domicilio_vendedor, c.correo_electronico correo_vendedor, c.telefono telefono_vendedor FROM vehiculos v JOIN clientes c ON c.id_cliente = v.id_vendedor WHERE v.id_vehiculo = ? AND v.estado IN ('PUBLICADO','APARTADO') FOR UPDATE", [d.idVehiculo]);
      if (filasVehiculo.length === 0) {
        throw new Error('El vehiculo no existe o ya fue vendido.');
      }
      
      const v = filasVehiculo[0];
      if (Number(v.id_vendedor) === Number(d.idComprador)) {
        throw new Error('Comprador y vendedor deben ser diferentes.');
      }
      
      const [filasComprador] = await conexion.execute('SELECT * FROM clientes WHERE id_cliente = ?', [d.idComprador]);
      if (filasComprador.length === 0) {
        throw new Error('El comprador no existe.');
      }
      const compradorObj = filasComprador[0];
      
      let estatusPago = d.estatusPago || 'PAGADO';
      let abono = Number(d.montoAbono || 0);
      let precioFinalVal = Number(d.precioFinal);
      
      if (estatusPago === 'APARTADO' && abono <= 0) {
        throw new Error('El apartado requiere un monto pagado mayor a cero.');
      }
      
      const [resultadoVenta] = await conexion.execute('INSERT INTO ventas(id_vehiculo, id_comprador, precio_final, estatus_pago, estado_venta) VALUES(?, ?, ?, ?, ?)', [d.idVehiculo, d.idComprador, precioFinalVal, estatusPago, 'ACTIVA']);
      idVenta = resultadoVenta.insertId;
      
      let folio = folioVenta(idVenta);
      await conexion.execute('UPDATE ventas SET folio_venta = ? WHERE id_venta = ?', [folio, idVenta]);
      await conexion.execute('INSERT INTO historial_estados(entidad, id_entidad, estado_anterior, estado_nuevo, motivo) VALUES(?, ?, ?, ?, ?)', ['VENTA', idVenta, null, 'ACTIVA', 'Registro inicial de venta']);
      
      if ((estatusPago === 'PENDIENTE' || estatusPago === 'APARTADO') && abono > 0) {
        if (abono > precioFinalVal) {
          throw new Error('El abono no puede ser mayor al precio final.');
        }
        await conexion.execute('INSERT INTO abonos_venta(id_venta, monto, metodo_pago, referencia_pago, observaciones) VALUES(?, ?, ?, ?, ?)', [idVenta, abono, d.metodoPago || 'EFECTIVO', d.referenciaPago || '', d.observacionAbono || 'Abono inicial']);
      }
      
      if (estatusPago === 'PAGADO') {
        await conexion.execute('INSERT INTO abonos_venta(id_venta, monto, metodo_pago, referencia_pago, observaciones) VALUES(?, ?, ?, ?, ?)', [idVenta, precioFinalVal, d.metodoPago || 'EFECTIVO', d.referenciaPago || '', 'Pago total al registrar la venta']);
      }
      
      await conexion.execute("UPDATE vehiculos SET estado = 'VENDIDO' WHERE id_vehiculo = ?", [d.idVehiculo]);
      
      datosActa = {
        idVehiculo: v.id_vehiculo,
        numeroMotor: v.numero_motor,
        numeroSerie: v.numero_serie,
        modelo: v.modelo,
        marca: v.marca,
        linea: v.linea,
        color: v.color,
        precioCompra: v.precio_compra,
        precioFinal: precioFinalVal,
        transmision: v.transmision,
        numeroCilindros: v.numero_cilindros,
        nacionalidad: v.nacionalidad,
        descripcion: v.descripcion,
        observaciones: v.observaciones,
        vendedor: v.vendedor,
        domicilioVendedor: v.domicilio_vendedor,
        correoVendedor: v.correo_vendedor,
        telefonoVendedor: v.telefono_vendedor,
        comprador: compradorObj.nombre_completo,
        domicilioComprador: compradorObj.domicilio,
        correoComprador: compradorObj.correo_electronico,
        telefonoComprador: compradorObj.telefono,
        lugar: d.lugar || 'Morelia, Michoacan.'
      };
      
      await conexion.commit();
    } catch (err) {
      await conexion.rollback();
      throw err;
    } finally {
      conexion.release();
    }
    
    try {
      const archivoActa = ejecutarGeneradorActa(datosActa);
      await pool.execute('UPDATE ventas SET ruta_acta = ? WHERE id_venta = ?', ['/actas/' + archivoActa, idVenta]);
      return responder(res, 201, { mensaje: 'Venta registrada', acta: '/actas/' + archivoActa });
    } catch (actaError) {
      console.error(actaError);
      return responder(res, 201, { mensaje: 'Venta registrada, pero no se pudo generar el acta. Compile Java e intentelo de nuevo.', acta: null });
    }
  }
  
  if (ruta.startsWith('/api/ventas/') && ruta.endsWith('/cancelar') && req.method === 'POST') {
    const partes = ruta.split('/');
    const id = partes[3];
    const conexion = await pool.getConnection();
    try {
      await conexion.beginTransaction();
      
      const [filasVenta] = await conexion.execute('SELECT * FROM ventas WHERE id_venta = ?', [id]);
      if (filasVenta.length === 0) throw new Error('La venta no existe.');
      const ventaObj = filasVenta[0];
      if (ventaObj.estado_venta === 'CANCELADA') throw new Error('La venta ya esta cancelada.');
      
      await conexion.execute("UPDATE vehiculos SET estado = 'PUBLICADO' WHERE id_vehiculo = ?", [ventaObj.id_vehiculo]);
      await conexion.execute("UPDATE ventas SET estado_venta = 'CANCELADA' WHERE id_venta = ?", [id]);
      await conexion.execute('INSERT INTO historial_estados(entidad, id_entidad, estado_anterior, estado_nuevo, motivo) VALUES(?, ?, ?, ?, ?)', ['VENTA', id, 'ACTIVA', 'CANCELADA', 'Cancelacion conservando historial']);
      
      await conexion.commit();
      return responder(res, 200, { mensaje: 'Venta cancelada' });
    } catch (err) {
      await conexion.rollback();
      throw err;
    } finally {
      conexion.release();
    }
  }
  
  if (ruta.startsWith('/api/ventas/') && ruta.endsWith('/abonos')) {
    const partes = ruta.split('/');
    const id = partes[3];
    
    if (req.method === 'GET') {
      const [filas] = await pool.execute('SELECT * FROM abonos_venta WHERE id_venta = ? ORDER BY fecha_abono DESC, id_abono DESC', [id]);
      return responder(res, 200, filas);
    }
    
    if (req.method === 'POST') {
      const d = await cuerpo(req);
      let montoAbono = Number(d.monto);
      if (montoAbono <= 0) throw new Error('El monto del abono debe ser mayor a cero.');
      
      const [filasVenta] = await pool.execute(`SELECT ven.*, COALESCE(a.abonado, 0) AS abonado FROM ventas ven LEFT JOIN (SELECT id_venta, SUM(monto) AS abonado FROM abonos_venta GROUP BY id_venta) a ON a.id_venta = ven.id_venta WHERE ven.id_venta = ?`, [id]);
      if (filasVenta.length === 0) throw new Error('La venta no existe.');
      const ventaObj = filasVenta[0];
      
      if (ventaObj.estado_venta === 'CANCELADA') throw new Error('No se pueden agregar abonos a una venta cancelada.');
      if (ventaObj.estatus_pago === 'PAGADO') throw new Error('No se pueden agregar abonos a una venta ya pagada.');
      
      let nuevoTotal = Number(ventaObj.abonado) + montoAbono;
      if (nuevoTotal > Number(ventaObj.precio_final)) {
        throw new Error('El total abonado no puede superar el precio final.');
      }
      
      await pool.execute('INSERT INTO abonos_venta(id_venta, monto, metodo_pago, referencia_pago, observaciones) VALUES(?, ?, ?, ?, ?)', [id, montoAbono, d.metodoPago || 'EFECTIVO', d.referenciaPago || '', d.observaciones || '']);
      if (nuevoTotal >= Number(ventaObj.precio_final)) {
        await pool.execute("UPDATE ventas SET estatus_pago = 'PAGADO' WHERE id_venta = ?", [id]);
      }
      return responder(res, 201, { mensaje: 'Abono registrado.', abonado: nuevoTotal, saldo: Number(ventaObj.precio_final) - nuevoTotal });
    }
  }
  
  if (ruta.startsWith('/api/ventas/') && ruta.endsWith('/estatus') && req.method === 'PUT') {
    const partes = ruta.split('/');
    const id = partes[3];
    const d = await cuerpo(req);
    
    if (d.estatusPago !== 'PENDIENTE' && d.estatusPago !== 'PAGADO' && d.estatusPago !== 'APARTADO') {
      throw new Error('Estatus de pago invalido.');
    }
    
    const [filasVenta] = await pool.execute('SELECT * FROM ventas WHERE id_venta = ?', [id]);
    if (filasVenta.length === 0) throw new Error('La venta no existe.');
    if (filasVenta[0].estado_venta === 'CANCELADA') throw new Error('No se puede cambiar el pago de una venta cancelada.');
    
    await pool.execute('UPDATE ventas SET estatus_pago = ? WHERE id_venta = ?', [d.estatusPago, id]);
    await pool.execute('INSERT INTO historial_estados(entidad, id_entidad, estado_anterior, estado_nuevo, motivo) VALUES(?, ?, ?, ?, ?)', ['PAGO', id, filasVenta[0].estatus_pago, d.estatusPago, d.motivo || 'Cambio manual de estatus']);
    return responder(res, 200, { mensaje: 'Estatus actualizado.' });
  }
  
  if (ruta.startsWith('/api/ventas/') && ruta.endsWith('/acta') && req.method === 'POST') {
    const partes = ruta.split('/');
    const id = partes[3];
    
    const [filasVenta] = await pool.execute(`SELECT ven.*, v.*, cv.nombre_completo AS vendedor, cv.domicilio AS domicilio_vendedor, cv.correo_electronico AS correo_vendedor, cv.telefono AS telefono_vendedor, cc.nombre_completo AS comprador, cc.domicilio AS domicilio_comprador, cc.correo_electronico AS correo_comprador, cc.telefono AS telefono_comprador FROM ventas ven JOIN vehiculos v ON v.id_vehiculo = ven.id_vehiculo JOIN clientes cv ON cv.id_cliente = v.id_vendedor JOIN clientes cc ON cc.id_cliente = ven.id_comprador WHERE ven.id_venta = ?`, [id]);
    if (filasVenta.length === 0) throw new Error('La venta no existe.');
    
    const archivo = ejecutarGeneradorActa(datosActaDesdeFila(filasVenta[0]));
    const rutaActa = '/actas/' + archivo;
    await pool.execute('UPDATE ventas SET ruta_acta = ? WHERE id_venta = ?', [rutaActa, id]);
    return responder(res, 200, { mensaje: 'Acta regenerada', acta: rutaActa });
  }
  
  // --- REPORTES ---
  if (ruta === '/api/reportes/ofertas' && req.method === 'GET') {
    const [sql, valores] = obtenerFiltrosVehiculos(url, true);
    const [filas] = await pool.execute(sql, valores);
    return responder(res, 200, filas);
  }
  
  if (ruta === '/api/reportes/vendidos' && req.method === 'GET') {
    let queryParams = url.searchParams;
    let valores = [];
    let sql = `SELECT ven.id_venta, ven.folio_venta, v.*, ven.fecha_venta, ven.precio_final, ven.estatus_pago, ven.estado_venta, ven.ruta_acta, COALESCE(a.monto_pagado, 0) AS monto_pagado, ven.precio_final - COALESCE(a.monto_pagado, 0) AS saldo_pendiente, cv.nombre_completo AS vendedor, cc.nombre_completo AS comprador FROM ventas ven JOIN vehiculos v ON v.id_vehiculo = ven.id_vehiculo JOIN clientes cv ON cv.id_cliente = v.id_vendedor JOIN clientes cc ON cc.id_cliente = ven.id_comprador LEFT JOIN (SELECT id_venta, SUM(monto) AS monto_pagado FROM abonos_venta GROUP BY id_venta) a ON a.id_venta = ven.id_venta WHERE 1 = 1`;
    
    if (queryParams.get('fechaInicio')) {
      sql += ' AND DATE(ven.fecha_venta) >= ?';
      valores.push(queryParams.get('fechaInicio'));
    }
    if (queryParams.get('fechaFin')) {
      sql += ' AND DATE(ven.fecha_venta) <= ?';
      valores.push(queryParams.get('fechaFin'));
    }
    if (queryParams.get('estatusPago')) {
      sql += ' AND ven.estatus_pago = ?';
      valores.push(queryParams.get('estatusPago'));
    }
    if (queryParams.get('estadoVenta')) {
      sql += ' AND ven.estado_venta = ?';
      valores.push(queryParams.get('estadoVenta'));
    }
    if (queryParams.get('buscar')) {
      sql += ' AND (cc.nombre_completo LIKE ? OR cv.nombre_completo LIKE ? OR v.marca LIKE ? OR v.linea LIKE ? OR v.numero_serie LIKE ? OR ven.folio_venta LIKE ?)';
      let buscarStr = '%' + queryParams.get('buscar') + '%';
      valores.push(buscarStr, buscarStr, buscarStr, buscarStr, buscarStr, buscarStr);
    }
    sql += ' ORDER BY ven.fecha_venta DESC';
    
    if (queryParams.get('limite')) {
      let num = parseInt(queryParams.get('limite')) || 20;
      if (num < 1) num = 1;
      if (num > 100) num = 100;
      sql += ' LIMIT ' + num;
    }
    
    const [filas] = await pool.execute(sql, valores);
    return responder(res, 200, filas);
  }
  
  if (ruta === '/api/reportes/estadisticas' && req.method === 'GET') {
    const [filas] = await pool.query(`SELECT COUNT(*) AS total_vehiculos, SUM(estado = 'PUBLICADO') AS vehiculos_activos, SUM(estado = 'VENDIDO') AS vehiculos_vendidos, COALESCE((SELECT SUM(precio_final) FROM ventas WHERE estado_venta = 'ACTIVA'), 0) AS ingresos_totales, COALESCE((SELECT SUM(ven.precio_final - v.precio_compra) FROM ventas ven JOIN vehiculos v ON v.id_vehiculo = ven.id_vehiculo WHERE ven.estado_venta = 'ACTIVA'), 0) AS utilidad_estimada FROM vehiculos`);
    return responder(res, 200, filas[0]);
  }
  
  return false;
}

async function servirActa(res, rutaActa) {
  const archivo = resolverArchivoPublico(rutaActa);
  if (fs.existsSync(archivo)) {
    enviarArchivo(res, archivo);
    return;
  }
  
  const [filas] = await pool.execute(`SELECT ven.*, v.*, cv.nombre_completo AS vendedor, cv.domicilio AS domicilio_vendedor, cv.correo_electronico AS correo_vendedor, cv.telefono AS telefono_vendedor, cc.nombre_completo AS comprador, cc.domicilio AS domicilio_comprador, cc.correo_electronico AS correo_comprador, cc.telefono AS telefono_comprador FROM ventas ven JOIN vehiculos v ON v.id_vehiculo = ven.id_vehiculo JOIN clientes cv ON cv.id_cliente = v.id_vendedor JOIN clientes cc ON cc.id_cliente = ven.id_comprador WHERE ven.ruta_acta = ?`, [rutaActa]);
  
  if (filas.length === 0) {
    return responder(res, 404, { error: 'Archivo no encontrado.' });
  }
  
  const nuevoArchivo = ejecutarGeneradorActa(datosActaDesdeFila(filas[0]));
  const nuevaRuta = '/actas/' + nuevoArchivo;
  await pool.execute('UPDATE ventas SET ruta_acta = ? WHERE id_venta = ?', [nuevaRuta, filas[0].id_venta]);
  
  enviarArchivo(res, path.join(raiz, nuevaRuta));
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const ruta = url.pathname;
  try {
    if (ruta.startsWith('/api/')) {
      const procesado = await procesarApi(req, res, ruta, url);
      if (!procesado) {
        responder(res, 404, { error: 'Ruta no encontrada.' });
      }
      return;
    }
    
    if (ruta.startsWith('/actas/')) {
      return await servirActa(res, ruta);
    }
    
    const archivo = resolverArchivoPublico(ruta);
    if (!archivo.startsWith(raiz)) {
      return responder(res, 403, { error: 'Acceso denegado' });
    }
    enviarArchivo(res, archivo);
  } catch (error) {
    console.error(error);
    responder(res, 500, { error: error.message || 'Error interno del servidor.' });
  }
}).listen(puerto, () => console.log(`Sistema disponible en http://localhost:${puerto}`));
