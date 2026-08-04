USE agencia_autos;
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE historial_estados;
TRUNCATE TABLE abonos_venta;
TRUNCATE TABLE ventas;
TRUNCATE TABLE vehiculos;
TRUNCATE TABLE clientes;
SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO clientes (id_cliente, nombre_completo, domicilio, correo_electronico, telefono, activo) VALUES
(1, 'José Ángel Ramírez Torres', 'Av. Camelinas 1840, Morelia, Michoacán', 'jose.ramirez@example.com', '4431234567', 1),
(2, 'María Fernanda López García', 'Calle Valladolid 221, Morelia, Michoacán', 'maria.lopez@example.com', '4437654321', 1),
(3, 'Raúl Hernández Méndez', 'Blvd. García de León 900, Morelia, Michoacán', 'raul.hernandez@example.com', '4435558811', 1),
(4, 'Ana Sofía Martínez Pérez', 'Calle Oaxaca 45, Uruapan, Michoacán', 'ana.martinez@example.com', '4521102233', 1),
(5, 'Carlos Eduardo Núñez Silva', 'Av. Universidad 300, Pátzcuaro, Michoacán', 'carlos.nunez@example.com', '4349988776', 1),
(6, 'Lucía Gómez Chávez', 'Calle Morelos 77, Zamora, Michoacán', 'lucia.gomez@example.com', '3516677889', 1),
(7, 'Miguel Ángel Peña Ortiz', 'Col. Chapultepec Sur 18, Morelia, Michoacán', 'miguel.pena@example.com', '4432223344', 0),
(8, 'Paola Jiménez Ríos', 'Av. Madero 1500, Morelia, Michoacán', 'paola.jimenez@example.com', '4439090909', 1),
(9, 'Sofía Hernández Ávila', 'Calle Galeana 330, Morelia, Michoacán', 'sofia.avila@example.com', '4438181818', 1),
(10, 'Andrés Íñiguez Morales', 'Av. Periodismo 120, Morelia, Michoacán', 'andres.iniguez@example.com', '4437272727', 1);

INSERT INTO vehiculos (
  id_vehiculo, id_vendedor, numero_motor, numero_serie, modelo, marca, linea, color,
  precio_compra, precio_venta, transmision, numero_cilindros, nacionalidad,
  descripcion, observaciones, url_imagen, estado
) VALUES
(1, 1, 'MR20-NSN-2020-001', '3N1CN7AD9LK000001', 2020, 'Nissan', 'Versa', 'Blanco', 145000, 189000, 'AUTOMATICA', 4, 'Mexicana', 'Sedán compacto en buen estado, ideal para ciudad y uso familiar.', 'Servicios al corriente, factura original.', 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=900&q=80', 'PUBLICADO'),
(2, 2, 'K20-HND-2019-002', '19XFC2F59KE000002', 2019, 'Honda', 'Civic', 'Gris', 220000, 279000, 'AUTOMATICA', 4, 'Importada', 'Vehículo cómodo, económico y con excelente manejo.', 'Detalles mínimos de uso en pintura.', 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=900&q=80', 'PUBLICADO'),
(3, 3, 'MZR-MAZ-2021-003', 'JM1BPACLXM1000003', 2021, 'Mazda', 'Mazda 3', 'Rojo', 255000, 329000, 'AUTOMATICA', 4, 'Mexicana', 'Hatchback deportivo con interiores cuidados y buen rendimiento.', 'Un solo dueño.', 'https://images.unsplash.com/photo-1619405399517-d7fce0f13302?auto=format&fit=crop&w=900&q=80', 'APARTADO'),
(4, 4, 'CVT-TOY-2018-004', '2T1BURHE8JC000004', 2018, 'Toyota', 'Corolla', 'Plata', 175000, 229000, 'AUTOMATICA', 4, 'Importada', 'Sedán confiable, bajo consumo y mantenimiento económico.', 'Llantas nuevas.', 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=900&q=80', 'VENDIDO'),
(5, 5, 'ECO-FRD-2022-005', '3FADP4EJ2NM000005', 2022, 'Ford', 'Fiesta', 'Azul', 165000, 215000, 'ESTANDAR', 4, 'Mexicana', 'Auto compacto, práctico y económico para uso diario.', 'Afinación reciente.', 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=900&q=80', 'PUBLICADO'),
(6, 6, 'TSI-VW-2020-006', '3VW267AJXLM000006', 2020, 'Volkswagen', 'Jetta', 'Negro', 235000, 299000, 'AUTOMATICA', 4, 'Mexicana', 'Sedán amplio, elegante y cómodo para carretera.', 'Factura de agencia.', 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=900&q=80', 'VENDIDO'),
(7, 8, 'MPI-KIA-2021-007', '3KPA24AD9ME000007', 2021, 'Kia', 'Rio', 'Blanco', 185000, 239000, 'AUTOMATICA', 4, 'Mexicana', 'Compacto moderno con excelente consumo de combustible.', 'Seguro vigente.', 'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=900&q=80', 'PUBLICADO'),
(8, 1, 'HRV-HND-2020-008', '3CZRU6H5XLM000008', 2020, 'Honda', 'HR-V', 'Gris Oxford', 265000, 339000, 'AUTOMATICA', 4, 'Importada', 'SUV compacta, espaciosa y con buen desempeño.', 'Interiores limpios.', 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=900&q=80', 'PUBLICADO'),
(9, 9, 'REN-CHEV-2023-009', 'KL8CB6SA9NC000009', 2023, 'Chevrolet', 'Aveo', 'Rojo', 190000, 248000, 'ESTANDAR', 4, 'Mexicana', 'Vehículo reciente, económico y con bajo kilometraje.', 'Garantía vigente por agencia.', 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80', 'VENDIDO'),
(10, 10, 'TGDI-HYU-2022-010', 'KM8K12AA7NU000010', 2022, 'Hyundai', 'Creta', 'Blanco Perla', 285000, 369000, 'AUTOMATICA', 4, 'Importada', 'SUV equipada, cómoda y lista para carretera.', 'Pantalla, cámara de reversa y sensores.', 'https://images.unsplash.com/photo-1549924231-f129b911e442?auto=format&fit=crop&w=900&q=80', 'PUBLICADO');

INSERT INTO ventas (id_venta, id_vehiculo, id_comprador, folio_venta, fecha_venta, precio_final, estatus_pago, estado_venta, ruta_acta) VALUES
(1, 4, 6, 'VTA-00001', '2026-07-20 11:30:00', 224000, 'PAGADO', 'ACTIVA', NULL),
(2, 6, 3, 'VTA-00002', '2026-07-25 16:15:00', 292000, 'APARTADO', 'ACTIVA', NULL),
(3, 9, 2, 'VTA-00003', '2026-07-28 10:20:00', 242000, 'PENDIENTE', 'ACTIVA', NULL),
(4, 10, 1, 'VTA-00004', '2026-07-29 13:45:00', 360000, 'PAGADO', 'CANCELADA', NULL);

INSERT INTO abonos_venta (id_abono, id_venta, fecha_abono, monto, metodo_pago, referencia_pago, observaciones) VALUES
(1, 1, '2026-07-20 11:30:00', 224000, 'TRANSFERENCIA', 'SPEI-224-A', 'Pago total al registrar la venta'),
(2, 2, '2026-07-25 16:15:00', 50000, 'EFECTIVO', 'REC-050', 'Apartado inicial'),
(3, 2, '2026-07-27 12:10:00', 25000, 'TRANSFERENCIA', 'SPEI-025-B', 'Segundo abono del apartado'),
(4, 3, '2026-07-28 10:20:00', 80000, 'TARJETA', 'TAR-080-C', 'Anticipo al registrar venta pendiente'),
(5, 3, '2026-07-29 09:00:00', 40000, 'TRANSFERENCIA', 'SPEI-040-D', 'Abono parcial'),
(6, 4, '2026-07-29 13:45:00', 360000, 'TRANSFERENCIA', 'SPEI-360-E', 'Pago total antes de cancelacion administrativa');

INSERT INTO historial_estados (entidad, id_entidad, estado_anterior, estado_nuevo, motivo, creado_en) VALUES
('VEHICULO', 3, 'PUBLICADO', 'APARTADO', 'Apartado demo antes de venta', '2026-07-24 12:00:00'),
('VENTA', 1, NULL, 'ACTIVA', 'Registro demo', '2026-07-20 11:30:00'),
('VENTA', 2, NULL, 'ACTIVA', 'Registro demo', '2026-07-25 16:15:00'),
('VENTA', 3, NULL, 'ACTIVA', 'Registro demo', '2026-07-28 10:20:00'),
('VENTA', 4, NULL, 'ACTIVA', 'Registro demo', '2026-07-29 13:45:00'),
('VENTA', 4, 'ACTIVA', 'CANCELADA', 'Cancelacion demo conservando historial', '2026-07-29 15:00:00'),
('VEHICULO', 10, 'VENDIDO', 'PUBLICADO', 'Venta cancelada; vehiculo regresado al catalogo', '2026-07-29 15:00:00');
