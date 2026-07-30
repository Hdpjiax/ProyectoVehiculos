# Pruebas manuales

Marque cada punto durante la entrega.

1. Crear un cliente con nombre, domicilio, correo y telefono.
2. Editar el cliente y confirmar que el boton cambia a Actualizar.
3. Buscar el cliente por nombre, correo y telefono.
4. Registrar un vehiculo vinculado a un cliente vendedor.
5. Usar el catalogo con filtros de marca, linea, modelo, color, transmision, cilindros, nacionalidad, precio y fecha.
6. Cambiar el orden del catalogo por precio, modelo y fecha.
7. Abrir el detalle de un vehiculo y verificar todos sus datos.
8. Registrar una venta con comprador diferente del vendedor.
9. Confirmar que el vehiculo vendido ya no aparece en ofertas activas.
10. Confirmar que el vehiculo vendido aparece en reportes con fecha de venta.
11. Abrir el acta y verificar datos de vehiculo, vendedor, comprador, lugar, fecha y firmas.
12. Exportar CSV de ofertas y vendidos.
13. Imprimir reportes.
14. Cancelar una venta y confirmar que queda como `CANCELADA`, conserva abonos y el vehiculo vuelve a estar publicado.
15. Intentar vender un vehiculo usando como comprador al mismo vendedor y confirmar que el sistema lo bloquea.
16. Intentar editar o eliminar un vehiculo vendido y confirmar que el sistema lo bloquea.
17. Registrar una venta con estatus `PENDIENTE`, `PAGADO` y `APARTADO`.
18. Regenerar el acta desde reportes y confirmar que se abre una nueva acta.
19. Confirmar que el dashboard actualiza ingresos totales y utilidad estimada.
20. Probar en pantalla pequena que las pestanas, formularios y reportes siguen siendo usables.
21. Reiniciar el servidor y confirmar que los datos siguen guardados en MySQL.
22. Probar busqueda de catalogo por linea, color, transmision, cilindros y nacionalidad.
23. Probar ordenamiento por precio mayor, precio menor, modelo y fecha.
24. Probar limite de resultados con valores 1, 3 y vacio.
25. Marcar un vehiculo como `APARTADO` antes de venderlo y despues liberarlo.
26. Registrar venta `APARTADO` con abono inicial mayor a cero.
27. Confirmar que el sistema bloquea apartado con abono inicial en cero.
28. Agregar abonos a una venta pendiente o apartada.
29. Confirmar que una venta cambia a `PAGADO` cuando los abonos completan el total.
30. Confirmar que no se pueden agregar abonos a ventas pagadas o canceladas.
31. Filtrar ventas por rango de fechas.
32. Filtrar ventas por estatus de pago y estado de venta.
33. Buscar ventas por comprador, vendedor, serie o folio.
34. Abrir detalle de venta y revisar vehiculo, comprador, vendedor, abonos y acta.
35. Cambiar estatus de pago de forma controlada y revisar que el sistema lo guarde.
