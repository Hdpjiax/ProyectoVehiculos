CREATE DATABASE IF NOT EXISTS agencia_autos
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE agencia_autos;

CREATE TABLE clientes (
  id_cliente INT AUTO_INCREMENT PRIMARY KEY,
  nombre_completo VARCHAR(150) NOT NULL,
  domicilio VARCHAR(255) NOT NULL,
  correo_electronico VARCHAR(120) NOT NULL UNIQUE,
  telefono VARCHAR(20) NOT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vehiculos (
  id_vehiculo INT AUTO_INCREMENT PRIMARY KEY,
  id_vendedor INT NOT NULL,
  numero_motor VARCHAR(60) NOT NULL UNIQUE,
  numero_serie VARCHAR(60) NOT NULL UNIQUE,
  modelo SMALLINT NOT NULL,
  marca VARCHAR(60) NOT NULL,
  linea VARCHAR(60) NOT NULL,
  color VARCHAR(40) NOT NULL,
  precio_compra DECIMAL(12,2) NOT NULL,
  precio_venta DECIMAL(12,2) NOT NULL,
  transmision ENUM('AUTOMATICA','ESTANDAR') NOT NULL,
  numero_cilindros TINYINT NOT NULL,
  nacionalidad VARCHAR(60) NOT NULL,
  descripcion TEXT NOT NULL,
  observaciones TEXT,
  fecha_publicacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado ENUM('PUBLICADO','VENDIDO') NOT NULL DEFAULT 'PUBLICADO',
  CONSTRAINT fk_vehiculo_vendedor FOREIGN KEY (id_vendedor) REFERENCES clientes(id_cliente),
  CONSTRAINT chk_precios CHECK (precio_compra >= 0 AND precio_venta > 0),
  CONSTRAINT chk_modelo CHECK (modelo BETWEEN 1900 AND 2100)
);

CREATE TABLE ventas (
  id_venta INT AUTO_INCREMENT PRIMARY KEY,
  id_vehiculo INT NOT NULL UNIQUE,
  id_comprador INT NOT NULL,
  fecha_venta DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  precio_final DECIMAL(12,2) NOT NULL,
  CONSTRAINT fk_venta_vehiculo FOREIGN KEY (id_vehiculo) REFERENCES vehiculos(id_vehiculo),
  CONSTRAINT fk_venta_comprador FOREIGN KEY (id_comprador) REFERENCES clientes(id_cliente),
  CONSTRAINT chk_precio_final CHECK (precio_final > 0)
);

CREATE INDEX idx_vehiculos_busqueda ON vehiculos (estado, marca, modelo, precio_venta, fecha_publicacion);
