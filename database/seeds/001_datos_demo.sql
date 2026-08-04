USE agencia_autos;
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
INSERT IGNORE INTO clientes (nombre_completo, domicilio, correo_electronico, telefono) VALUES
('Ana Martínez López', 'Av. Juárez 120, Centro', 'ana.martinez@ejemplo.com', '5551234567'),
('Carlos Hernández Ruiz', 'Calle Morelos 45, Centro', 'carlos.hernandez@ejemplo.com', '5557654321'),
('María Fernanda Soto', 'Av. Reforma 822, Norte', 'maria.soto@ejemplo.com', '5558881122'),
('Luis Alberto Vega', 'Calle Hidalgo 56, Sur', 'luis.vega@ejemplo.com', '5554447788'),
('Paola Jimenez Castro', 'Privada Roble 18, Poniente', 'paola.jimenez@ejemplo.com', '5551012020'),
('Ricardo Medina Torres', 'Calzada Central 340, Oriente', 'ricardo.medina@ejemplo.com', '5553034040');

INSERT IGNORE INTO vehiculos (id_vendedor, numero_motor, numero_serie, modelo, marca, linea, color, precio_compra, precio_venta, transmision, numero_cilindros, nacionalidad, descripcion, observaciones, url_imagen) VALUES
(1, 'MOTOR-DEMO-001', 'SERIE-DEMO-001', 2020, 'Nissan', 'Versa', 'Blanco', 180000.00, 215000.00, 'ESTANDAR', 4, 'Mexicana', 'Sedan en buen estado.', 'Documentacion en revision.', 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=900&q=80'),
(2, 'MOTOR-DEMO-002', 'SERIE-DEMO-002', 2021, 'Toyota', 'Corolla', 'Gris', 230000.00, 275000.00, 'AUTOMATICA', 4, 'Japonesa', 'Unidad familiar con servicios al dia.', 'Llantas seminuevas.', 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=900&q=80'),
(3, 'MOTOR-DEMO-003', 'SERIE-DEMO-003', 2019, 'Chevrolet', 'Aveo', 'Rojo', 130000.00, 168000.00, 'ESTANDAR', 4, 'Mexicana', 'Compacto economico para ciudad.', 'Factura original.', 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=900&q=80'),
(4, 'MOTOR-DEMO-004', 'SERIE-DEMO-004', 2022, 'Honda', 'Civic', 'Azul', 285000.00, 342000.00, 'AUTOMATICA', 4, 'Japonesa', 'Sedan deportivo con interiores cuidados.', 'Servicio reciente.', 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80'),
(5, 'MOTOR-DEMO-005', 'SERIE-DEMO-005', 2018, 'Volkswagen', 'Jetta', 'Negro', 175000.00, 226000.00, 'ESTANDAR', 4, 'Alemana', 'Vehiculo amplio para uso familiar.', 'Detalles esteticos menores.', 'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=900&q=80'),
(6, 'MOTOR-DEMO-006', 'SERIE-DEMO-006', 2023, 'Mazda', 'CX-5', 'Gris Oxford', 410000.00, 498000.00, 'AUTOMATICA', 4, 'Japonesa', 'SUV equipada con camara de reversa y pantalla.', 'Unico dueno.', 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=900&q=80');
