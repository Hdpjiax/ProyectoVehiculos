# ADDJ MOTORS — versión Java + MySQL (sin Node.js)

Proyecto de preparatoria para compra y venta de vehículos usados. Esta rama usa una estructura sencilla:

- **Java:** servidor web, conexión JDBC a MySQL, consultas SQL, validaciones, transacciones, POO y generación del acta.
- **MySQL:** base de datos y scripts de migración.
- **HTML/CSS:** pantallas del sistema.
- **JavaScript:** solamente eventos de la interfaz, filtros y llamadas `fetch` al servidor Java. No requiere Node.js, npm ni Maven.

## Requisitos

1. JDK 17 o superior.
2. MySQL 8 o XAMPP con MySQL.
3. El archivo **MySQL Connector/J** (un solo `.jar`). Descárgalo desde la página oficial de MySQL y colócalo en `java/lib/`, por ejemplo:

```text
java/lib/mysql-connector-j-8.4.0.jar
```

> El `.jar` no se sube al repositorio porque es una dependencia externa. No se usa Maven.

## Primer inicio en Windows

1. Ejecuta las migraciones desde MySQL Workbench o consola:

```text
database/migrations/001_crear_base.sql
database/migrations/002_mejoras_sistema.sql
database/seeds/reset_demo_completo.sql   (opcional: datos de prueba)
```

2. Copia `java/database.properties.example` como `java/database.properties`.
3. Escribe tu contraseña de MySQL en `java/database.properties`.
4. Coloca el Connector/J en `java/lib/`.
5. Ejecuta `start.bat`.
6. Abre `http://localhost:8080`.

## Inicio manual

```bat
cd java
compilar.bat
ejecutar.bat
```

En Linux/macOS usa `./start.sh`.

## Estructura importante

```text
java/
  Cliente.java, Vehiculo.java       Clases POO básicas
  ConfiguracionBD.java              Conexión JDBC a MySQL
  ServidorJava.java                 API y servidor web en Java
  GeneradorActa.java                Acta formal de compraventa
  JsonUtil.java                     Lectura/escritura JSON sin librerías
frontend/                           HTML, CSS y JavaScript de interfaz
database/                           Esquema, migraciones, consultas y datos demo
server-js/                          Versión anterior; no se usa en esta rama
```

## Funciones incluidas

- Clientes: alta, edición, desactivación y reactivación.
- Vehículos: alta, edición, eliminación, publicación y apartado.
- Búsqueda de ofertas por modelo, marca, precio y fecha.
- Registro de venta, abonos, cancelación y estatus de pago.
- Reportes de ofertas, vehículos vendidos y estadísticas.
- Generación de acta de compraventa con Java.

## Nota para exposición

La conexión se realiza en `ConfiguracionBD.java` con JDBC. El archivo `frontend/js/app.js` no realiza SQL ni se conecta directamente a MySQL: solamente envía solicitudes al servidor Java. Esto mantiene las credenciales protegidas y hace el proyecto más sencillo de explicar.
