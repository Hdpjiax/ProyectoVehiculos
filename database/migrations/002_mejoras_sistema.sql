USE agencia_autos;
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER DATABASE agencia_autos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE clientes CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE vehiculos CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE ventas CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE vehiculos MODIFY estado ENUM('PUBLICADO','APARTADO','VENDIDO') NOT NULL DEFAULT 'PUBLICADO';

SET @fk_venta_vehiculo := (
  SELECT CONSTRAINT_NAME
  FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'ventas'
    AND COLUMN_NAME = 'id_vehiculo'
    AND REFERENCED_TABLE_NAME = 'vehiculos'
  LIMIT 1
);

SET @sql := IF(@fk_venta_vehiculo IS NULL, 'SELECT 1', CONCAT('ALTER TABLE ventas DROP FOREIGN KEY ', @fk_venta_vehiculo));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT COALESCE(
    (SELECT CONCAT('ALTER TABLE ventas DROP INDEX ', INDEX_NAME)
     FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'ventas'
       AND COLUMN_NAME = 'id_vehiculo'
       AND NON_UNIQUE = 0
       AND INDEX_NAME <> 'PRIMARY'
     LIMIT 1),
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    COUNT(*) = 0,
    'CREATE INDEX idx_ventas_vehiculo ON ventas(id_vehiculo)',
    'SELECT 1'
  )
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'ventas'
    AND INDEX_NAME = 'idx_ventas_vehiculo'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE ventas ADD CONSTRAINT fk_venta_vehiculo FOREIGN KEY (id_vehiculo) REFERENCES vehiculos(id_vehiculo)',
    'SELECT 1'
  )
  FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'ventas'
    AND COLUMN_NAME = 'id_vehiculo'
    AND REFERENCED_TABLE_NAME = 'vehiculos'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE clientes ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1 AFTER telefono',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'clientes'
    AND COLUMN_NAME = 'activo'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS abonos_venta (
  id_abono INT AUTO_INCREMENT PRIMARY KEY,
  id_venta INT NOT NULL,
  fecha_abono DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  monto DECIMAL(12,2) NOT NULL,
  metodo_pago VARCHAR(40) NOT NULL DEFAULT 'EFECTIVO',
  referencia_pago VARCHAR(80),
  observaciones VARCHAR(255),
  CONSTRAINT fk_abono_venta FOREIGN KEY (id_venta) REFERENCES ventas(id_venta) ON DELETE CASCADE,
  CONSTRAINT chk_abono_monto CHECK (monto > 0)
);

CREATE TABLE IF NOT EXISTS historial_estados (
  id_historial INT AUTO_INCREMENT PRIMARY KEY,
  entidad VARCHAR(40) NOT NULL,
  id_entidad INT NOT NULL,
  estado_anterior VARCHAR(40),
  estado_nuevo VARCHAR(40) NOT NULL,
  motivo VARCHAR(255),
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

SET @sql := (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE ventas ADD COLUMN folio_venta VARCHAR(40) UNIQUE AFTER id_comprador', 'SELECT 1')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ventas' AND COLUMN_NAME = 'folio_venta'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE ventas ADD COLUMN estado_venta ENUM(''ACTIVA'',''CANCELADA'') NOT NULL DEFAULT ''ACTIVA'' AFTER precio_final', 'SELECT 1')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ventas' AND COLUMN_NAME = 'estado_venta'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE abonos_venta ADD COLUMN referencia_pago VARCHAR(80) AFTER metodo_pago', 'SELECT 1')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'abonos_venta' AND COLUMN_NAME = 'referencia_pago'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE vehiculos ADD COLUMN url_imagen VARCHAR(500) AFTER observaciones',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'vehiculos'
    AND COLUMN_NAME = 'url_imagen'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE ventas ADD COLUMN estatus_pago ENUM(''PENDIENTE'',''PAGADO'',''APARTADO'') NOT NULL DEFAULT ''PAGADO'' AFTER precio_final',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'ventas'
    AND COLUMN_NAME = 'estatus_pago'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE ventas ADD COLUMN ruta_acta VARCHAR(500) AFTER estatus_pago',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'ventas'
    AND COLUMN_NAME = 'ruta_acta'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
