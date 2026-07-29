# ProyectoVehiculos - Sistema de compra-venta de vehículos

Proyecto escolar para administrar clientes, vehículos publicados y ventas de una agencia de autos usados.

## Tecnologías

- Java 17 básico: clases, encapsulamiento, constructores, getters y setters.
- Java `HttpServer` y JDBC, sin Spring ni framework pesado.
- HTML, CSS y JavaScript puro (`fetch`) para la interfaz.
- MySQL 8 y scripts SQL versionados.

## Requisitos

- JDK 17.
- Apache Maven 3.9 o superior.
- MySQL 8.

## Puesta en marcha

1. Cree la base y las tablas ejecutando, en orden, los archivos de `database/migrations/`.
2. Opcionalmente cargue ejemplos con `database/seeds/001_datos_demo.sql`.
3. Copie `backend/src/main/resources/database.properties.example` a `database.properties` y ajuste usuario y contraseña. Este archivo no se versiona.
4. Desde `backend`, ejecute `mvn compile` y luego `mvn exec:java`.
5. Abra `http://localhost:8080`.

## Estructura

- `backend/`: API Java y acceso JDBC a MySQL.
- `frontend/`: interfaz HTML/CSS/JS servida por Java.
- `database/migrations/`: esquema portable para migrar a otra máquina.
- `database/seeds/`: datos de demostración.
- `docs/`: documentación y diagramas de la entrega.

## Funciones cubiertas

- CRUD de clientes y vehículos.
- Vehículo vinculado a quien lo ofrece.
- Búsqueda por modelo, marca, precio y fecha de publicación.
- Registro de venta, con comprador, vendedor y fecha.
- Reporte de ofertas activas y de vehículos vendidos.
- Acta de compraventa imprimible desde el navegador.

## Seguridad y buenas prácticas

Las consultas JDBC utilizan `PreparedStatement`; no se colocan contraseñas en el repositorio. JavaScript consulta únicamente la API Java, nunca MySQL directamente.
