const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const mysql = require('mysql2/promise');
const config = require('./database.local.js');
const pool = mysql.createPool({ ...config, waitForConnections: true, connectionLimit: 10 });
const raiz = path.join(__dirname, '..');

function responder(res, estado, datos) { const cuerpo = JSON.stringify(datos); res.writeHead(estado, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(cuerpo); }
function cuerpo(req) { return new Promise((ok, error) => { let texto = ''; req.on('data', p => texto += p); req.on('end', () => { try { ok(texto ? JSON.parse(texto) : {}); } catch { error(new Error('JSON inválido.')); } }); }); }
function requerido(datos, ...campos) { campos.forEach(c => { if (datos[c] === undefined || datos[c] === '') throw new Error(`Falta el campo: ${c}`); }); }
function enviarArchivo(res, archivo) { if (!fs.existsSync(archivo)) return responder(res, 404, { error: 'Archivo no encontrado.' }); const extension = path.extname(archivo); const tipo = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript' }[extension] || 'text/plain'; res.writeHead(200, { 'Content-Type': `${tipo}; charset=utf-8` }); fs.createReadStream(archivo).pipe(res); }
function resolverArchivoPublico(ruta) {
  const relativa = ruta === '/' ? 'frontend/index.html' : ruta.slice(1);
  const directa = path.normalize(path.join(raiz, relativa));
  if (directa.startsWith(raiz) && fs.existsSync(directa)) return directa;
  const frontend = path.normalize(path.join(raiz, 'frontend', relativa));
  if (frontend.startsWith(path.join(raiz, 'frontend')) && fs.existsSync(frontend)) return frontend;
  return directa;
}
function generarActa(datos) {
  const archivo = `acta-venta-${datos.idVehiculo}-${Date.now()}.html`;
  execFileSync('java', [
    '-cp',
    path.join('java', 'out'),
    'mx.edu.prepa.autos.GeneradorActa',
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
    new Date().toLocaleDateString('es-MX'),
    archivo
  ], { cwd: raiz });
  return archivo;
}
function filtros(url, soloPublicados = false) {
  const q = url.searchParams;
  const valores = [];
  let sql = `SELECT v.*, c.nombre_completo AS vendedor
    FROM vehiculos v
    JOIN clientes c ON c.id_cliente = v.id_vendedor
    WHERE 1 = 1`;
  if (soloPublicados) sql += " AND v.estado = 'PUBLICADO'";
  if (q.get('modelo')) { sql += ' AND v.modelo = ?'; valores.push(q.get('modelo')); }
  if (q.get('marca')) { sql += ' AND v.marca LIKE ?'; valores.push(`%${q.get('marca')}%`); }
  if (q.get('precio')) { sql += ' AND v.precio_venta = ?'; valores.push(q.get('precio')); }
  if (q.get('precioMin')) { sql += ' AND v.precio_venta >= ?'; valores.push(q.get('precioMin')); }
  if (q.get('precioMax')) { sql += ' AND v.precio_venta <= ?'; valores.push(q.get('precioMax')); }
  if (q.get('fecha')) { sql += ' AND DATE(v.fecha_publicacion) = ?'; valores.push(q.get('fecha')); }
  return [sql + ' ORDER BY v.fecha_publicacion DESC', valores];
}
async function api(req, res, url) {
  const ruta = url.pathname, metodo = req.method;
  if (ruta === '/api/clientes' && metodo === 'GET') { const [filas] = await pool.query('SELECT * FROM clientes ORDER BY nombre_completo'); return responder(res, 200, filas); }
  if (ruta === '/api/clientes' && metodo === 'POST') { const d = await cuerpo(req); requerido(d, 'nombreCompleto', 'domicilio', 'correoElectronico', 'telefono'); const [r] = await pool.execute('INSERT INTO clientes(nombre_completo,domicilio,correo_electronico,telefono) VALUES(?,?,?,?)', [d.nombreCompleto, d.domicilio, d.correoElectronico, d.telefono]); return responder(res, 201, { id: r.insertId }); }
  if (/^\/api\/clientes\/\d+$/.test(ruta)) { const id = ruta.split('/').pop(); if (metodo === 'PUT') { const d = await cuerpo(req); requerido(d, 'nombreCompleto', 'domicilio', 'correoElectronico', 'telefono'); await pool.execute('UPDATE clientes SET nombre_completo=?,domicilio=?,correo_electronico=?,telefono=? WHERE id_cliente=?', [d.nombreCompleto, d.domicilio, d.correoElectronico, d.telefono, id]); return responder(res, 200, { id }); } if (metodo === 'DELETE') { await pool.execute('DELETE FROM clientes WHERE id_cliente=?', [id]); return responder(res, 200, { mensaje: 'Cliente eliminado' }); } }
  if (ruta === '/api/vehiculos' && metodo === 'GET') { const [sql, valores] = filtros(url); const [filas] = await pool.execute(sql, valores); return responder(res, 200, filas); }
  if (ruta === '/api/vehiculos' && metodo === 'POST') { const d = await cuerpo(req); requerido(d, 'idVendedor', 'numeroMotor', 'numeroSerie', 'modelo', 'marca', 'linea', 'color', 'precioCompra', 'precioVenta', 'transmision', 'numeroCilindros', 'nacionalidad', 'descripcion'); const [r] = await pool.execute('INSERT INTO vehiculos(id_vendedor,numero_motor,numero_serie,modelo,marca,linea,color,precio_compra,precio_venta,transmision,numero_cilindros,nacionalidad,descripcion,observaciones) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [d.idVendedor, d.numeroMotor, d.numeroSerie, d.modelo, d.marca, d.linea, d.color, d.precioCompra, d.precioVenta, d.transmision, d.numeroCilindros, d.nacionalidad, d.descripcion, d.observaciones || '']); return responder(res, 201, { id: r.insertId }); }
  if (/^\/api\/vehiculos\/\d+$/.test(ruta)) { const id = ruta.split('/').pop(); if (metodo === 'PUT') { const d = await cuerpo(req); requerido(d, 'idVendedor', 'numeroMotor', 'numeroSerie', 'modelo', 'marca', 'linea', 'color', 'precioCompra', 'precioVenta', 'transmision', 'numeroCilindros', 'nacionalidad', 'descripcion'); await pool.execute('UPDATE vehiculos SET id_vendedor=?,numero_motor=?,numero_serie=?,modelo=?,marca=?,linea=?,color=?,precio_compra=?,precio_venta=?,transmision=?,numero_cilindros=?,nacionalidad=?,descripcion=?,observaciones=? WHERE id_vehiculo=?', [d.idVendedor, d.numeroMotor, d.numeroSerie, d.modelo, d.marca, d.linea, d.color, d.precioCompra, d.precioVenta, d.transmision, d.numeroCilindros, d.nacionalidad, d.descripcion, d.observaciones || '', id]); return responder(res, 200, { id }); } if (metodo === 'DELETE') { await pool.execute('DELETE FROM vehiculos WHERE id_vehiculo=?', [id]); return responder(res, 200, { mensaje: 'Vehículo eliminado' }); } }
  if (ruta === '/api/reportes/ofertas' && metodo === 'GET') { const [sql, valores] = filtros(url, true); const [filas] = await pool.execute(sql, valores); return responder(res, 200, filas); }
  if (ruta === '/api/reportes/vendidos' && metodo === 'GET') { const [filas] = await pool.query('SELECT v.*,ven.fecha_venta,ven.precio_final,cv.nombre_completo AS vendedor,cc.nombre_completo AS comprador FROM ventas ven JOIN vehiculos v ON v.id_vehiculo=ven.id_vehiculo JOIN clientes cv ON cv.id_cliente=v.id_vendedor JOIN clientes cc ON cc.id_cliente=ven.id_comprador ORDER BY ven.fecha_venta DESC'); return responder(res, 200, filas); }
  if (ruta === '/api/ventas' && metodo === 'POST') {
    const d = await cuerpo(req);
    requerido(d, 'idVehiculo', 'idComprador', 'precioFinal');
    const conexion = await pool.getConnection();
    let datosActa;
    try {
      await conexion.beginTransaction();
      const [filas] = await conexion.execute("SELECT v.*, c.nombre_completo vendedor, c.domicilio domicilio_vendedor, c.correo_electronico correo_vendedor, c.telefono telefono_vendedor FROM vehiculos v JOIN clientes c ON c.id_cliente = v.id_vendedor WHERE v.id_vehiculo = ? AND v.estado = 'PUBLICADO' FOR UPDATE", [d.idVehiculo]);
      if (!filas.length) throw new Error('El vehiculo no existe o ya fue vendido.');
      const v = filas[0];
      if (Number(v.id_vendedor) === Number(d.idComprador)) throw new Error('Comprador y vendedor deben ser diferentes.');
      const [[comprador]] = await conexion.execute('SELECT * FROM clientes WHERE id_cliente = ?', [d.idComprador]);
      if (!comprador) throw new Error('El comprador no existe.');
      await conexion.execute('INSERT INTO ventas(id_vehiculo, id_comprador, precio_final) VALUES(?, ?, ?)', [d.idVehiculo, d.idComprador, d.precioFinal]);
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
        precioFinal: d.precioFinal,
        transmision: v.transmision,
        numeroCilindros: v.numero_cilindros,
        nacionalidad: v.nacionalidad,
        descripcion: v.descripcion,
        observaciones: v.observaciones,
        vendedor: v.vendedor,
        domicilioVendedor: v.domicilio_vendedor,
        correoVendedor: v.correo_vendedor,
        telefonoVendedor: v.telefono_vendedor,
        comprador: comprador.nombre_completo,
        domicilioComprador: comprador.domicilio,
        correoComprador: comprador.correo_electronico,
        telefonoComprador: comprador.telefono
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
      return responder(res, 201, { mensaje: 'Venta registrada', acta: `/actas/${archivo}` });
    } catch (error) {
      console.error(error);
      return responder(res, 201, { mensaje: 'Venta registrada, pero no se pudo generar el acta. Compile Java e intentelo de nuevo.', acta: null });
    }
  }
  responder(res, 404, { error: 'Ruta no encontrada.' });
}
http.createServer(async (req, res) => { const url = new URL(req.url, 'http://localhost'); try { if (url.pathname.startsWith('/api/')) return await api(req, res, url); const archivo = resolverArchivoPublico(url.pathname); if (!archivo.startsWith(raiz)) return responder(res, 403, { error: 'Acceso denegado' }); enviarArchivo(res, archivo); } catch (error) { console.error(error); responder(res, error.message?.startsWith('Falta') || error.message?.includes('no existe') || error.message?.includes('ya fue') ? 400 : 500, { error: error.message || 'Error interno' }); } }).listen(8080, () => console.log('Sistema disponible en http://localhost:8080'));
