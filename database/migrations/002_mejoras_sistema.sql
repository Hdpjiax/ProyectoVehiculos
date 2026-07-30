USE agencia_autos;

ALTER DATABASE agencia_autos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE clientes CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE vehiculos CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE ventas CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  observaciones VARCHAR(255),
  CONSTRAINT fk_abono_venta FOREIGN KEY (id_venta) REFERENCES ventas(id_venta) ON DELETE CASCADE,
  CONSTRAINT chk_abono_monto CHECK (monto > 0)
);

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
