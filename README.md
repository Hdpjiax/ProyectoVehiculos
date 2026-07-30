# MotorCasa - Sistema de compra-venta de vehiculos

Proyecto escolar para administrar clientes, vehiculos publicados, ventas, reportes y actas de compraventa.

## Requisitos

- JDK 17 con `java` y `javac` disponibles.
- Node.js 20 o superior.
- MySQL 8.

## Configuracion

1. Cree la base de datos con instrucciones manuales:

Consulte `docs/entrega-release.md`.

2. Configure la conexion privada:

Copie `server-js/database.config.example.js` como `server-js/database.local.js` y ajuste usuario, contrasena, base y puerto.

3. Compile e inicie todo manualmente:

```powershell
cd "C:\Users\Antonio Garcia\Desktop\dany\ProyectoVehiculos\java"
javac -encoding UTF-8 -d out Cliente.java Vehiculo.java GeneradorActa.java

cd "C:\Users\Antonio Garcia\Desktop\dany\ProyectoVehiculos\server-js"
npm install
npm start
```

4. Abra:

```text
http://localhost:8080
```

## Funciones

- CRUD completo de clientes.
- CRUD completo de vehiculos vinculados a vendedor.
- Bloqueo de edicion/eliminacion para vehiculos vendidos.
- Catalogo de ofertas activas, excluyendo vendidos.
- Busqueda avanzada por modelo, marca, linea, color, transmision, cilindros, nacionalidad, precio y fecha.
- Ordenamiento por precio, modelo y fecha.
- Registro de venta con validacion de comprador distinto al vendedor.
- Cancelacion de venta para republicar el vehiculo.
- Reportes de ofertas activas y vehiculos vendidos.
- Exportacion CSV e impresion de reportes.
- Dashboard con ingresos totales, utilidad estimada, clientes, activos y vendidos.
- Acta formal HTML con datos del vehiculo, vendedor y comprador.

## Estructura

- `frontend/`: interfaz HTML, CSS y JavaScript.
- `server-js/`: API Node.js y conexion MySQL.
- `java/`: clases POO y generador de acta.
- `database/migrations/`: scripts SQL para crear o actualizar la base.
- `database/seeds/`: datos demo.
- `docs/pruebas-manuales.md`: checklist de pruebas para entrega.
- `docs/guia-visual.md`: recorrido de pantallas y flujos.
- `docs/entrega-release.md`: instrucciones para ejecutar en otra computadora sin usar `.bat`.
- `docs/plan-integrador.md`: costos, Gantt, riesgos, precio de venta y evidencias.
