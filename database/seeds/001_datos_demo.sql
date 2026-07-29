USE agencia_autos;
INSERT INTO clientes (nombre_completo, domicilio, correo_electronico, telefono) VALUES
('Ana Martínez López', 'Av. Juárez 120, Centro', 'ana.martinez@ejemplo.com', '5551234567'),
('Carlos Hernández Ruiz', 'Calle Morelos 45, Centro', 'carlos.hernandez@ejemplo.com', '5557654321');

INSERT INTO vehiculos (id_vendedor, numero_motor, numero_serie, modelo, marca, linea, color, precio_compra, precio_venta, transmision, numero_cilindros, nacionalidad, descripcion, observaciones) VALUES
(1, 'MOTOR-DEMO-001', 'SERIE-DEMO-001', 2020, 'Nissan', 'Versa', 'Blanco', 180000.00, 215000.00, 'ESTANDAR', 4, 'Mexicana', 'Sedán en buen estado.', 'Documentación en revisión.');
