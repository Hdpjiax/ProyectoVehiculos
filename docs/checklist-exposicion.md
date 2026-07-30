# Checklist final para exposicion

## Preparacion

- Ejecutar `database/migrations/001_crear_base.sql` si la base no existe.
- Ejecutar `database/migrations/002_mejoras_sistema.sql` para aplicar mejoras.
- Cargar `database/seeds/reset_demo_completo.sql`.
- Compilar Java con `javac -encoding UTF-8 -d out Cliente.java Vehiculo.java GeneradorActa.java`.
- Iniciar servidor desde `server-js` con `npm start`.
- Abrir `http://localhost:8080`.

## Flujo a demostrar

1. Mostrar tablero con metricas.
2. Mostrar clientes activos, inactivos y todos.
3. Reactivar un cliente inactivo.
4. Registrar un vehiculo nuevo.
5. Marcar un vehiculo como apartado y luego liberarlo.
6. Registrar una venta pagada.
7. Registrar una venta apartada con abono inicial.
8. Ver reporte de vehiculos vendidos.
9. Filtrar ventas por fecha, pago y busqueda.
10. Abrir detalle de venta.
11. Ver historial de abonos.
12. Agregar un abono a venta pendiente o apartada.
13. Regenerar o reimprimir acta.
14. Cancelar una venta con confirmacion fuerte.
15. Imprimir reporte de ofertas con imagenes.
16. Imprimir reporte de vendidos con imagenes.

## Reglas importantes

- Una venta pagada no permite nuevos abonos.
- Una venta cancelada conserva abonos, acta e historial.
- Un cliente con historial se desactiva, no se borra.
- Un vehiculo vendido no puede editarse ni eliminarse.
- Un apartado requiere monto pagado mayor a cero.
