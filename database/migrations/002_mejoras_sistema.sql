USE agencia_autos;

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
