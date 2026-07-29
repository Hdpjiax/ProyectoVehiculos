# ProyectoVehiculos - Sistema de compra-venta de vehículos

Proyecto escolar para administrar clientes, vehículos publicados y ventas de una agencia de autos usados.

## Tecnologías

- Java 17 básico: clases, encapsulamiento, constructores, getters y setters. Solo genera el acta de compraventa.
- HTML, CSS y JavaScript puro (`fetch`) para la interfaz.
- Node.js (JavaScript) y MySQL 8 para el CRUD, consultas y reportes.

## Requisitos

- JDK 17.
- Node.js 20 o superior.
- MySQL 8.

## Puesta en marcha

1. Cree la base y las tablas ejecutando, en orden, los archivos de `database/migrations/`.
2. Opcionalmente cargue ejemplos con `database/seeds/001_datos_demo.sql`.
3. Copie `server-js/database.config.example.js` como `server-js/database.local.js` y ajuste usuario y contraseña. Este archivo no se versiona.
4. Compile Java: en Windows ejecute `java\\compilar.bat`; en macOS/Linux ejecute `bash java/compilar.sh`.
5. Desde `server-js`, ejecute `npm install` y después `npm start`.
6. Abra `http://localhost:8080`.

## Estructura

- `server-js/`: API JavaScript y acceso a MySQL.
- `java/`: POO básica y generador de actas. No usa Maven.
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
- Acta de compraventa HTML generada por Java e imprimible desde el navegador.

## Seguridad y buenas prácticas

Las consultas MySQL usan parámetros; no se colocan contraseñas en el repositorio. El navegador consulta la API JavaScript y Java se dedica a la generación del acta.
