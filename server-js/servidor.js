const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const mysql = require('mysql2/promise');

let config;
try {
  config = require('./database.local.js');
} catch {
  console.error('Falta server-js/database.local.js. Copie database.config.example.js y ajuste sus datos de MySQL.');
  process.exit(1);
}

const puerto = Number(process.env.PORT || 8080);
const raiz = path.join(__dirname, '..');
const pool = mysql.createPool({ ...config, waitForConnections: true, connectionLimit: 10 });

function responder(res, estado, datos) {
  res.writeHead(estado, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(datos));
  return true;
}

function cuerpo(req) {
  return new Promise((ok, error) => {
    let texto = '';
    req.on('data', parte => {
      texto += parte;
      if (texto.length > 1_000_000) req.destroy();
    });
    req.on('end', () => {
      try {
        ok(texto ? JSON.parse(texto) : {});
      } catch {
        error(new Error('JSON invalido.'));
      }
    });
  });
}

function requerido(datos, ...campos) {
  campos.forEach(campo => {
    if (datos[campo] === undefined || String(datos[campo]).trim() === '') {
      throw new Error(`Falta el campo: ${campo}`);
    }
  });
}

function positivo(valor, campo) {
  if (Number(valor) <= 0) throw new Error(`${campo} debe ser mayor a cero.`);
}

function enviarArchivo(res, archivo) {
  if (!fs.existsSync(archivo)) return responder(res, 404, { error: 'Archivo no encontrado.' });
  const extension = path.extname(archivo);
  const tipo = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript' }[extension] || 'text/plain';
  res.writeHead(200, { 'Content-Type': `${tipo}; charset=utf-8` });
  fs.createReadStream(archivo).pipe(res);
}

function resolverArchivoPublico(ruta) {
  const relativa = ruta === '/' ? 'frontend/index.html' : ruta.slice(1);
  const directa = path.normalize(path.join(raiz, relativa));
  if (directa.startsWith(raiz) && fs.existsSync(directa)) return directa;
  const frontend = path.normalize(path.join(raiz, 'frontend', relativa));
  if (frontend.startsWith(path.join(raiz, 'frontend')) && fs.existsSync(frontend)) return frontend;
  return directa;
}

function filtrosVehiculos(url, soloPublicados = false) {
  const q = url.searchParams;
  const valores = [];
  let sql = `SELECT v.*, c.nombre_completo AS vendedor
    FROM vehiculos v
    JOIN clientes c ON c.id_cliente = v.id_vendedor
    WHERE 1 = 1`;
  if (soloPublicados) sql += " AND v.estado = 'PUBLICADO'";
  if (q.get('modelo')) { sql += ' AND v.modelo = ?'; valores.push(q.get('modelo')); }
  if (q.get('marca')) { sql += ' AND v.marca LIKE ?'; valores.push(`%${q.get('marca')}%`); }
  if (q.get('linea')) { sql += ' AND v.linea LIKE ?'; valores.push(`%${q.get('linea')}%`); }
  if (q.get('color')) { sql += ' AND v.color LIKE ?'; valores.push(`%${q.get('color')}%`); }
  if (q.get('transmision')) { sql += ' AND v.transmision = ?'; valores.push(q.get('transmision')); }
  if (q.get('cilindros')) { sql += ' AND v.numero_cilindros = ?'; valores.push(q.get('cilindros')); }
  if (q.get('nacionalidad')) { sql += ' AND v.nacionalidad LIKE ?'; valores.push(`%${q.get('nacionalidad')}%`); }
  if (q.get('precio')) { sql += ' AND v.precio_venta = ?'; valores.push(q.get('precio')); }
  if (q.get('precioMin')) { sql += ' AND v.precio_venta >= ?'; valores.push(q.get('precioMin')); }
  if (q.get('precioMax')) { sql += ' AND v.precio_venta <= ?'; valores.push(q.get('precioMax')); }
  if (q.get('fecha')) { sql += ' AND DATE(v.fecha_publicacion) = ?'; valores.push(q.get('fecha')); }
  const ordenes = {
    precio_asc: 'v.precio_venta ASC',
    precio_desc: 'v.precio_venta DESC',
    modelo_asc: 'v.modelo ASC',
    modelo_desc: 'v.modelo DESC',
    fecha_asc: 'v.fecha_publicacion ASC',
    fecha_desc: 'v.fecha_publicacion DESC'
  };
  sql += ` ORDER BY ${ordenes[q.get('orden')] || 'v.fecha_publicacion DESC'}`;
  if (q.get('limite')) {
    const limite = Math.min(Math.max(parseInt(q.get('limite'), 10) || 20, 1), 100);
    sql += ` LIMIT ${limite}`;
  }
  return [sql, valores];
}

function normalizarVehiculo(d) {
  requerido(d, 'idVendedor', 'numeroMotor', 'numeroSerie', 'modelo', 'marca', 'linea', 'color', 'precioCompra', 'precioVenta', 'transmision', 'numeroCilindros', 'nacionalidad', 'descripcion');
  positivo(d.precioVenta, 'Precio de venta');
  return [
    d.idVendedor, d.numeroMotor, d.numeroSerie, d.modelo, d.marca, d.linea, d.color,
    d.precioCompra, d.precioVenta, d.transmision, d.numeroCilindros, d.nacionalidad,
    d.descripcion, d.observaciones || '', d.urlImagen || ''
  ];
}

function generarActa(datos) {
  const archivo = `acta-venta-${datos.idVehiculo}-${Date.now()}.html`;
  execFileSync('java', [
    '-cp', path.join('java', 'out'), 'GeneradorActa',
    String(datos.idVehiculo), datos.numeroMotor, datos.numeroSerie, String(datos.modelo),
    datos.marca, datos.linea, datos.color, String(datos.precioCompra), String(datos.precioFinal),
    datos.transmision, String(datos.numeroCilindros), datos.nacionalidad, datos.descripcion,
    datos.observaciones || '', datos.vendedor, datos.domicilioVendedor, datos.correoVendedor,
    datos.telefonoVendedor, datos.comprador, datos.domicilioComprador, datos.correoComprador,
    datos.telefonoComprador, datos.lugar, new Date().toLocaleDateString('es-MX'), archivo
  ], { cwd: raiz });
  return archivo;
}

function datosActaDesdeFila(fila) {
  return {
    idVehiculo: fila.id_vehiculo, numeroMotor: fila.numero_motor, numeroSerie: fila.numero_serie,
    modelo: fila.modelo, marca: fila.marca, linea: fila.linea, color: fila.color,
    precioCompra: fila.precio_compra, precioFinal: fila.precio_final, transmision: fila.transmision,
    numeroCilindros: fila.numero_cilindros, nacionalidad: fila.nacionalidad,
    descripcion: fila.descripcion, observaciones: fila.observaciones, vendedor: fila.vendedor,
    domicilioVendedor: fila.domicilio_vendedor, correoVendedor: fila.correo_vendedor,
    telefonoVendedor: fila.telefono_vendedor, comprador: fila.comprador,
    domicilioComprador: fila.domicilio_comprador, correoComprador: fila.correo_comprador,
    telefonoComprador: fila.telefono_comprador, lugar: 'Ciudad de Mexico'
  };
}

async function clientes(req, res, ruta) {
  if (ruta === '/api/clientes' && req.method === 'GET') {
    const [filas] = await pool.query('SELECT * FROM clientes ORDER BY nombre_completo');
    return responder(res, 200, filas);
  }
  if (ruta === '/api/clientes' && req.method === 'POST') {
    const d = await cuerpo(req);
    requerido(d, 'nombreCompleto', 'domicilio', 'correoElectronico', 'telefono');
    const [r] = await pool.execute('INSERT INTO clientes(nombre_completo, domicilio, correo_electronico, telefono) VALUES(?, ?, ?, ?)', [d.nombreCompleto, d.domicilio, d.correoElectronico, d.telefono]);
    return responder(res, 201, { id: r.insertId });
  }
  if (/^\/api\/clientes\/\d+$/.test(ruta)) {
    const id = ruta.split('/').pop();
    if (req.method === 'PUT') {
      const d = await cuerpo(req);
      requerido(d, 'nombreCompleto', 'domicilio', 'correoElectronico', 'telefono');
      await pool.execute('UPDATE clientes SET nombre_completo = ?, domicilio = ?, correo_electronico = ?, telefono = ? WHERE id_cliente = ?', [d.nombreCompleto, d.domicilio, d.correoElectronico, d.telefono, id]);
      return responder(res, 200, { id });
    }
    if (req.method === 'DELETE') {
      await pool.execute('DELETE FROM clientes WHERE id_cliente = ?', [id]);
      return responder(res, 200, { mensaje: 'Cliente eliminado' });
    }
  }
}

async function vehiculos(req, res, ruta, url) {
  if (ruta === '/api/vehiculos' && req.method === 'GET') {
    const [sql, valores] = filtrosVehiculos(url);
    const [filas] = await pool.execute(sql, valores);
    return responder(res, 200, filas);
  }
  if (/^\/api\/vehiculos\/\d+$/.test(ruta) && req.method === 'GET') {
    const id = ruta.split('/').pop();
    const [filas] = await pool.execute('SELECT v.*, c.nombre_completo AS vendedor FROM vehiculos v JOIN clientes c ON c.id_cliente = v.id_vendedor WHERE v.id_vehiculo = ?', [id]);
    if (!filas.length) return responder(res, 404, { error: 'Vehiculo no encontrado.' });
    return responder(res, 200, filas[0]);
  }
  if (ruta === '/api/vehiculos' && req.method === 'POST') {
    const d = await cuerpo(req);
    const datos = normalizarVehiculo(d);
    const [r] = await pool.execute('INSERT INTO vehiculos(id_vendedor, numero_motor, numero_serie, modelo, marca, linea, color, precio_compra, precio_venta, transmision, numero_cilindros, nacionalidad, descripcion, observaciones, url_imagen) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', datos);
    return responder(res, 201, { id: r.insertId });
  }
  if (/^\/api\/vehiculos\/\d+$/.test(ruta)) {
    const id = ruta.split('/').pop();
    if (req.method === 'PUT') {
      const [[actual]] = await pool.execute('SELECT estado FROM vehiculos WHERE id_vehiculo = ?', [id]);
      if (!actual) throw new Error('El vehiculo no existe.');
      if (actual.estado === 'VENDIDO') throw new Error('No se puede editar un vehiculo vendido.');
      const d = await cuerpo(req);
      const datos = normalizarVehiculo(d);
      await pool.execute('UPDATE vehiculos SET id_vendedor = ?, numero_motor = ?, numero_serie = ?, modelo = ?, marca = ?, linea = ?, color = ?, precio_compra = ?, precio_venta = ?, transmision = ?, numero_cilindros = ?, nacionalidad = ?, descripcion = ?, observaciones = ?, url_imagen = ? WHERE id_vehiculo = ?', [...datos, id]);
      return responder(res, 200, { id });
    }
    if (req.method === 'DELETE') {
      const [[actual]] = await pool.execute('SELECT estado FROM vehiculos WHERE id_vehiculo = ?', [id]);
      if (actual?.estado === 'VENDIDO') throw new Error('No se puede eliminar un vehiculo vendido.');
      await pool.execute('DELETE FROM vehiculos WHERE id_vehiculo = ?', [id]);
      return responder(res, 200, { mensaje: 'Vehiculo eliminado' });
    }
  }
}

async function ventas(req, res, ruta) {
  if (ruta === '/api/ventas' && req.method === 'POST') {
    const d = await cuerpo(req);
    requerido(d, 'idVehiculo', 'idComprador', 'precioFinal');
    const conexion = await pool.getConnection();
    let datosActa;
    let idVenta;
    try {
      await conexion.beginTransaction();
      const [filas] = await conexion.execute("SELECT v.*, c.nombre_completo vendedor, c.domicilio domicilio_vendedor, c.correo_electronico correo_vendedor, c.telefono telefono_vendedor FROM vehiculos v JOIN clientes c ON c.id_cliente = v.id_vendedor WHERE v.id_vehiculo = ? AND v.estado = 'PUBLICADO' FOR UPDATE", [d.idVehiculo]);
      if (!filas.length) throw new Error('El vehiculo no existe o ya fue vendido.');
      const v = filas[0];
      if (Number(v.id_vendedor) === Number(d.idComprador)) throw new Error('Comprador y vendedor deben ser diferentes.');
      const [[comprador]] = await conexion.execute('SELECT * FROM clientes WHERE id_cliente = ?', [d.idComprador]);
      if (!comprador) throw new Error('El comprador no existe.');
      const [r] = await conexion.execute('INSERT INTO ventas(id_vehiculo, id_comprador, precio_final, estatus_pago) VALUES(?, ?, ?, ?)', [d.idVehiculo, d.idComprador, d.precioFinal, d.estatusPago || 'PAGADO']);
      idVenta = r.insertId;
      await conexion.execute("UPDATE vehiculos SET estado = 'VENDIDO' WHERE id_vehiculo = ?", [d.idVehiculo]);
      datosActa = {
        idVehiculo: v.id_vehiculo, numeroMotor: v.numero_motor, numeroSerie: v.numero_serie, modelo: v.modelo,
        marca: v.marca, linea: v.linea, color: v.color, precioCompra: v.precio_compra, precioFinal: d.precioFinal,
        transmision: v.transmision, numeroCilindros: v.numero_cilindros, nacionalidad: v.nacionalidad,
        descripcion: v.descripcion, observaciones: v.observaciones, vendedor: v.vendedor,
        domicilioVendedor: v.domicilio_vendedor, correoVendedor: v.correo_vendedor, telefonoVendedor: v.telefono_vendedor,
        comprador: comprador.nombre_completo, domicilioComprador: comprador.domicilio,
        correoComprador: comprador.correo_electronico, telefonoComprador: comprador.telefono,
        lugar: d.lugar || 'Ciudad de Mexico'
      };
      await conexion.commit();
    } catch (error) {
      await conexion.rollback();
      throw error;
    } finally {
      conexion.release();
    }
    try {
      const archivo = generarActa(datosActa);
      await pool.execute('UPDATE ventas SET ruta_acta = ? WHERE id_venta = ?', [`/actas/${archivo}`, idVenta]);
      return responder(res, 201, { mensaje: 'Venta registrada', acta: `/actas/${archivo}` });
    } catch (error) {
      console.error(error);
      return responder(res, 201, { mensaje: 'Venta registrada, pero no se pudo generar el acta. Compile Java e intentelo de nuevo.', acta: null });
    }
  }
  if (/^\/api\/ventas\/\d+\/cancelar$/.test(ruta) && req.method === 'POST') {
    const id = ruta.split('/')[3];
    const conexion = await pool.getConnection();
    try {
      await conexion.beginTransaction();
      const [[venta]] = await conexion.execute('SELECT * FROM ventas WHERE id_venta = ?', [id]);
      if (!venta) throw new Error('La venta no existe.');
      await conexion.execute("UPDATE vehiculos SET estado = 'PUBLICADO' WHERE id_vehiculo = ?", [venta.id_vehiculo]);
      await conexion.execute('DELETE FROM ventas WHERE id_venta = ?', [id]);
      await conexion.commit();
      return responder(res, 200, { mensaje: 'Venta cancelada' });
    } catch (error) {
      await conexion.rollback();
      throw error;
    } finally {
      conexion.release();
    }
  }
  if (/^\/api\/ventas\/\d+\/acta$/.test(ruta) && req.method === 'POST') {
    const id = ruta.split('/')[3];
    const [filas] = await pool.execute(`SELECT ven.*, v.*,
      cv.nombre_completo AS vendedor, cv.domicilio AS domicilio_vendedor, cv.correo_electronico AS correo_vendedor, cv.telefono AS telefono_vendedor,
      cc.nombre_completo AS comprador, cc.domicilio AS domicilio_comprador, cc.correo_electronico AS correo_comprador, cc.telefono AS telefono_comprador
      FROM ventas ven
      JOIN vehiculos v ON v.id_vehiculo = ven.id_vehiculo
      JOIN clientes cv ON cv.id_cliente = v.id_vendedor
      JOIN clientes cc ON cc.id_cliente = ven.id_comprador
      WHERE ven.id_venta = ?`, [id]);
    if (!filas.length) throw new Error('La venta no existe.');
    const archivo = generarActa(datosActaDesdeFila(filas[0]));
    const rutaActa = `/actas/${archivo}`;
    await pool.execute('UPDATE ventas SET ruta_acta = ? WHERE id_venta = ?', [rutaActa, id]);
    return responder(res, 200, { mensaje: 'Acta regenerada', acta: rutaActa });
  }
}

async function reportes(req, res, ruta, url) {
  if (ruta === '/api/reportes/ofertas' && req.method === 'GET') {
    const [sql, valores] = filtrosVehiculos(url, true);
    const [filas] = await pool.execute(sql, valores);
    return responder(res, 200, filas);
  }
  if (ruta === '/api/reportes/vendidos' && req.method === 'GET') {
    const [filas] = await pool.query('SELECT ven.id_venta, v.*, ven.fecha_venta, ven.precio_final, ven.estatus_pago, ven.ruta_acta, cv.nombre_completo AS vendedor, cc.nombre_completo AS comprador FROM ventas ven JOIN vehiculos v ON v.id_vehiculo = ven.id_vehiculo JOIN clientes cv ON cv.id_cliente = v.id_vendedor JOIN clientes cc ON cc.id_cliente = ven.id_comprador ORDER BY ven.fecha_venta DESC');
    return responder(res, 200, filas);
  }
  if (ruta === '/api/reportes/estadisticas' && req.method === 'GET') {
    const [[datos]] = await pool.query(`SELECT
      COUNT(*) AS total_vehiculos,
      SUM(estado = 'PUBLICADO') AS vehiculos_activos,
      SUM(estado = 'VENDIDO') AS vehiculos_vendidos,
      COALESCE((SELECT SUM(precio_final) FROM ventas), 0) AS ingresos_totales,
      COALESCE((SELECT SUM(ven.precio_final - v.precio_compra) FROM ventas ven JOIN vehiculos v ON v.id_vehiculo = ven.id_vehiculo), 0) AS utilidad_estimada
      FROM vehiculos`);
    return responder(res, 200, datos);
  }
}

async function api(req, res, url) {
  const ruta = url.pathname;
  const manejadores = [clientes, vehiculos, ventas, reportes];
  for (const manejar of manejadores) {
    const respondio = await manejar(req, res, ruta, url);
    if (respondio) return;
  }
  responder(res, 404, { error: 'Ruta no encontrada.' });
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (url.pathname.startsWith('/api/')) return await api(req, res, url);
    const archivo = resolverArchivoPublico(url.pathname);
    if (!archivo.startsWith(raiz)) return responder(res, 403, { error: 'Acceso denegado' });
    enviarArchivo(res, archivo);
  } catch (error) {
    console.error(error);
    const cliente = error.message?.startsWith('Falta') || error.message?.includes('no existe') || error.message?.includes('vendido') || error.message?.includes('mayor a cero') || error.code?.startsWith('ER_DUP');
    responder(res, cliente ? 400 : 500, { error: error.code === 'ER_DUP_ENTRY' ? 'Ya existe un registro con datos unicos repetidos.' : error.message || 'Error interno' });
  }
}).listen(puerto, () => console.log(`Sistema disponible en http://localhost:${puerto}`));
