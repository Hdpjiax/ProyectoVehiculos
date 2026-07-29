USE agencia_autos;

-- LMD: CREATE / INSERT
INSERT INTO clientes (nombre_completo, domicilio, correo_electronico, telefono)
VALUES ('Nombre del cliente', 'Domicilio del cliente', 'correo@ejemplo.com', '5550000000');

-- LMD: READ / SELECT. Búsqueda por modelo, marca, precio o fecha de publicación.
SELECT v.*, c.nombre_completo AS vendedor
FROM vehiculos v
JOIN clientes c ON c.id_cliente = v.id_vendedor
WHERE v.estado = 'PUBLICADO'
  AND (v.modelo = 2020 OR 2020 IS NULL)
  AND (v.marca LIKE '%Nissan%' OR 'Nissan' = '')
  AND (v.precio_venta <= 250000 OR 250000 IS NULL)
  AND (DATE(v.fecha_publicacion) = '2026-08-01' OR '2026-08-01' IS NULL)
ORDER BY v.fecha_publicacion DESC;

-- LMD: UPDATE
UPDATE vehiculos
SET precio_venta = 215000.00,
    observaciones = 'Precio actualizado'
WHERE id_vehiculo = 1;

-- LMD: DELETE
DELETE FROM vehiculos WHERE id_vehiculo = 1;

-- Reporte de ofertas (sin vehículos vendidos)
SELECT v.id_vehiculo, v.marca, v.linea, v.modelo, v.precio_venta, v.fecha_publicacion, c.nombre_completo AS vendedor
FROM vehiculos v JOIN clientes c ON c.id_cliente = v.id_vendedor
WHERE v.estado = 'PUBLICADO'
ORDER BY v.fecha_publicacion DESC;

-- Reporte de ventas
SELECT v.marca, v.linea, v.modelo, ven.fecha_venta, ven.precio_final,
       vendedor.nombre_completo AS vendedor, comprador.nombre_completo AS comprador
FROM ventas ven
JOIN vehiculos v ON v.id_vehiculo = ven.id_vehiculo
JOIN clientes vendedor ON vendedor.id_cliente = v.id_vendedor
JOIN clientes comprador ON comprador.id_cliente = ven.id_comprador
ORDER BY ven.fecha_venta DESC;
