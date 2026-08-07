import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.math.BigDecimal;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/*
 * Servidor sencillo para preparatoria.
 *
 * Java atiende las pantallas, se conecta a MySQL con JDBC y genera las actas.
 * JavaScript solamente usa fetch para pedir los datos y actualizar la interfaz.
 */
public class ServidorJava {
    private static final Path CARPETA_PROYECTO = Path.of("").toAbsolutePath().normalize();

    public static void main(String[] args) throws IOException {
        HttpServer servidor = HttpServer.create(new InetSocketAddress(8080), 0);
        servidor.createContext("/", ServidorJava::atenderPeticion);
        servidor.setExecutor(null);
        servidor.start();

        System.out.println("Sistema disponible en http://localhost:8080");
    }

    private static void atenderPeticion(HttpExchange intercambio) throws IOException {
        try {
            String ruta = intercambio.getRequestURI().getPath();

            if (ruta.startsWith("/api/")) {
                atenderApi(intercambio, ruta);
            } else {
                enviarArchivo(intercambio, ruta);
            }
        } catch (IllegalArgumentException error) {
            responderError(intercambio, 400, error.getMessage());
        } catch (SQLException error) {
            responderError(intercambio, 500, "Error de MySQL: " + error.getMessage());
        } catch (Exception error) {
            responderError(intercambio, 500, "Error interno: " + error.getMessage());
        }
    }

    private static void atenderApi(HttpExchange intercambio, String ruta) throws Exception {
        String metodo = intercambio.getRequestMethod();

        // CLIENTES
        if (ruta.equals("/api/clientes") && metodo.equals("GET")) {
            listarClientes(intercambio);
            return;
        }
        if (ruta.equals("/api/clientes") && metodo.equals("POST")) {
            registrarCliente(intercambio);
            return;
        }
        if (ruta.matches("/api/clientes/[0-9]+") && metodo.equals("PUT")) {
            actualizarCliente(intercambio, idFinal(ruta));
            return;
        }
        if (ruta.matches("/api/clientes/[0-9]+") && metodo.equals("DELETE")) {
            eliminarCliente(intercambio, idFinal(ruta));
            return;
        }
        if (ruta.matches("/api/clientes/[0-9]+/reactivar") && metodo.equals("POST")) {
            ejecutar("UPDATE clientes SET activo = 1 WHERE id_cliente = ?", idDelSegmento(ruta, 3));
            responderJson(intercambio, 200, mensaje("Cliente reactivado."));
            return;
        }

        // VEHICULOS
        if (ruta.equals("/api/vehiculos") && metodo.equals("GET")) {
            responderJson(intercambio, 200, buscarVehiculos(parametros(intercambio.getRequestURI()), false));
            return;
        }
        if (ruta.equals("/api/vehiculos") && metodo.equals("POST")) {
            int id = guardarVehiculo(leerCuerpo(intercambio), 0);
            responderJson(intercambio, 201, idCreado(id));
            return;
        }
        if (ruta.matches("/api/vehiculos/[0-9]+") && metodo.equals("GET")) {
            verVehiculo(intercambio, idFinal(ruta));
            return;
        }
        if (ruta.matches("/api/vehiculos/[0-9]+") && metodo.equals("PUT")) {
            editarVehiculo(intercambio, idFinal(ruta));
            return;
        }
        if (ruta.matches("/api/vehiculos/[0-9]+") && metodo.equals("DELETE")) {
            eliminarVehiculo(intercambio, idFinal(ruta));
            return;
        }
        if (ruta.matches("/api/vehiculos/[0-9]+/estado") && metodo.equals("PUT")) {
            cambiarEstadoVehiculo(intercambio, idDelSegmento(ruta, 3));
            return;
        }

        // VENTAS Y ABONOS
        if (ruta.equals("/api/ventas") && metodo.equals("POST")) {
            registrarVenta(intercambio);
            return;
        }
        if (ruta.matches("/api/ventas/[0-9]+/abonos") && metodo.equals("GET")) {
            listarAbonos(intercambio, idDelSegmento(ruta, 3));
            return;
        }
        if (ruta.matches("/api/ventas/[0-9]+/abonos") && metodo.equals("POST")) {
            registrarAbono(intercambio, idDelSegmento(ruta, 3));
            return;
        }
        if (ruta.matches("/api/ventas/[0-9]+/cancelar") && metodo.equals("POST")) {
            cancelarVenta(intercambio, idDelSegmento(ruta, 3));
            return;
        }
        if (ruta.matches("/api/ventas/[0-9]+/estatus") && metodo.equals("PUT")) {
            cambiarEstatusPago(intercambio, idDelSegmento(ruta, 3));
            return;
        }
        if (ruta.matches("/api/ventas/[0-9]+/acta") && metodo.equals("POST")) {
            String rutaActa = generarActa(idDelSegmento(ruta, 3));
            Map<String, Object> respuesta = mensaje("Acta generada.");
            respuesta.put("acta", rutaActa);
            responderJson(intercambio, 200, respuesta);
            return;
        }

        // REPORTES
        if (ruta.equals("/api/reportes/ofertas") && metodo.equals("GET")) {
            responderJson(intercambio, 200, buscarVehiculos(parametros(intercambio.getRequestURI()), true));
            return;
        }
        if (ruta.equals("/api/reportes/vendidos") && metodo.equals("GET")) {
            responderJson(intercambio, 200, reporteVendidos());
            return;
        }
        if (ruta.equals("/api/reportes/estadisticas") && metodo.equals("GET")) {
            responderJson(intercambio, 200, estadisticas());
            return;
        }

        responderError(intercambio, 404, "Ruta no encontrada.");
    }

    // -------------------- CLIENTES --------------------

    private static void listarClientes(HttpExchange intercambio) throws Exception {
        String estado = parametros(intercambio.getRequestURI()).getOrDefault("estado", "activos");
        String condicion = "activo = 1";

        if (estado.equals("inactivos")) {
            condicion = "activo = 0";
        }
        if (estado.equals("todos")) {
            condicion = "1 = 1";
        }

        responderJson(intercambio, 200,
                consultar("SELECT * FROM clientes WHERE " + condicion + " ORDER BY nombre_completo"));
    }

    private static void registrarCliente(HttpExchange intercambio) throws Exception {
        String cuerpo = leerCuerpo(intercambio);
        validarCliente(cuerpo);

        int id = insertar(
                "INSERT INTO clientes(nombre_completo, domicilio, correo_electronico, telefono) VALUES(?, ?, ?, ?)",
                JsonUtil.obtenerTexto(cuerpo, "nombreCompleto"),
                JsonUtil.obtenerTexto(cuerpo, "domicilio"),
                JsonUtil.obtenerTexto(cuerpo, "correoElectronico"),
                JsonUtil.obtenerTexto(cuerpo, "telefono")
        );

        responderJson(intercambio, 201, idCreado(id));
    }

    private static void actualizarCliente(HttpExchange intercambio, int id) throws Exception {
        String cuerpo = leerCuerpo(intercambio);
        validarCliente(cuerpo);

        ejecutar("UPDATE clientes SET nombre_completo = ?, domicilio = ?, correo_electronico = ?, telefono = ?, activo = 1 WHERE id_cliente = ?",
                JsonUtil.obtenerTexto(cuerpo, "nombreCompleto"),
                JsonUtil.obtenerTexto(cuerpo, "domicilio"),
                JsonUtil.obtenerTexto(cuerpo, "correoElectronico"),
                JsonUtil.obtenerTexto(cuerpo, "telefono"),
                id);

        responderJson(intercambio, 200, idCreado(id));
    }

    private static void eliminarCliente(HttpExchange intercambio, int id) throws Exception {
        int relacionados = contar("SELECT COUNT(*) FROM vehiculos WHERE id_vendedor = ?", id)
                + contar("SELECT COUNT(*) FROM ventas WHERE id_comprador = ?", id);

        if (relacionados > 0) {
            ejecutar("UPDATE clientes SET activo = 0 WHERE id_cliente = ?", id);
            responderJson(intercambio, 200, mensaje("Cliente desactivado; se conserva su historial."));
        } else {
            ejecutar("DELETE FROM clientes WHERE id_cliente = ?", id);
            responderJson(intercambio, 200, mensaje("Cliente eliminado."));
        }
    }

    // -------------------- VEHICULOS --------------------

    private static List<Object> buscarVehiculos(Map<String, String> filtros, boolean soloOfertas) throws Exception {
        StringBuilder sql = new StringBuilder(
                "SELECT v.*, c.nombre_completo AS vendedor "
                        + "FROM vehiculos v JOIN clientes c ON c.id_cliente = v.id_vendedor WHERE 1 = 1");
        List<Object> valores = new ArrayList<>();

        if (soloOfertas) {
            sql.append(" AND v.estado IN ('PUBLICADO', 'APARTADO')");
        }
        agregarFiltro(sql, valores, filtros, "modelo", "v.modelo = ?", false);
        agregarFiltro(sql, valores, filtros, "marca", "v.marca LIKE ?", true);
        agregarFiltro(sql, valores, filtros, "precio", "v.precio_venta = ?", false);
        agregarFiltro(sql, valores, filtros, "fecha", "DATE(v.fecha_publicacion) = ?", false);
        sql.append(" ORDER BY v.fecha_publicacion DESC");

        return consultar(sql.toString(), valores.toArray());
    }

    private static void agregarFiltro(StringBuilder sql, List<Object> valores, Map<String, String> filtros,
                                      String nombre, String condicion, boolean contiene) {
        String valor = filtros.get(nombre);
        if (valor != null && !valor.isBlank()) {
            sql.append(" AND ").append(condicion);
            valores.add(contiene ? "%" + valor + "%" : valor);
        }
    }

    private static void verVehiculo(HttpExchange intercambio, int id) throws Exception {
        List<Object> resultados = consultar(
                "SELECT v.*, c.nombre_completo AS vendedor FROM vehiculos v "
                        + "JOIN clientes c ON c.id_cliente = v.id_vendedor WHERE v.id_vehiculo = ?", id);

        if (resultados.isEmpty()) {
            throw new IllegalArgumentException("Vehículo no encontrado.");
        }

        responderJson(intercambio, 200, resultados.get(0));
    }

    private static void editarVehiculo(HttpExchange intercambio, int id) throws Exception {
        String estado = obtenerTextoUnico("SELECT estado FROM vehiculos WHERE id_vehiculo = ?", id);
        if (estado == null || estado.equals("VENDIDO")) {
            throw new IllegalArgumentException("No se puede editar un vehículo vendido o inexistente.");
        }

        guardarVehiculo(leerCuerpo(intercambio), id);
        responderJson(intercambio, 200, idCreado(id));
    }

    private static void eliminarVehiculo(HttpExchange intercambio, int id) throws Exception {
        String estado = obtenerTextoUnico("SELECT estado FROM vehiculos WHERE id_vehiculo = ?", id);
        if ("VENDIDO".equals(estado)) {
            throw new IllegalArgumentException("No se puede eliminar un vehículo vendido.");
        }

        ejecutar("DELETE FROM vehiculos WHERE id_vehiculo = ?", id);
        responderJson(intercambio, 200, mensaje("Vehículo eliminado."));
    }

    private static void cambiarEstadoVehiculo(HttpExchange intercambio, int id) throws Exception {
        String cuerpo = leerCuerpo(intercambio);
        String nuevoEstado = JsonUtil.obtenerTexto(cuerpo, "estado");
        String estadoAnterior = obtenerTextoUnico("SELECT estado FROM vehiculos WHERE id_vehiculo = ?", id);

        if (!nuevoEstado.equals("PUBLICADO") && !nuevoEstado.equals("APARTADO")) {
            throw new IllegalArgumentException("Estado inválido.");
        }
        if (estadoAnterior == null || estadoAnterior.equals("VENDIDO")) {
            throw new IllegalArgumentException("No se puede cambiar el estado de este vehículo.");
        }

        ejecutar("UPDATE vehiculos SET estado = ? WHERE id_vehiculo = ?", nuevoEstado, id);
        guardarHistorial("VEHICULO", id, estadoAnterior, nuevoEstado, JsonUtil.obtenerTexto(cuerpo, "motivo"));
        responderJson(intercambio, 200, mensaje("Estado actualizado."));
    }

    private static int guardarVehiculo(String cuerpo, int id) throws Exception {
        validarVehiculo(cuerpo);

        Object[] datos = {
                JsonUtil.obtenerEntero(cuerpo, "idVendedor"),
                JsonUtil.obtenerTexto(cuerpo, "numeroMotor"),
                JsonUtil.obtenerTexto(cuerpo, "numeroSerie"),
                JsonUtil.obtenerEntero(cuerpo, "modelo"),
                JsonUtil.obtenerTexto(cuerpo, "marca"),
                JsonUtil.obtenerTexto(cuerpo, "linea"),
                JsonUtil.obtenerTexto(cuerpo, "color"),
                JsonUtil.obtenerDecimal(cuerpo, "precioCompra"),
                JsonUtil.obtenerDecimal(cuerpo, "precioVenta"),
                JsonUtil.obtenerTexto(cuerpo, "transmision"),
                JsonUtil.obtenerEntero(cuerpo, "numeroCilindros"),
                JsonUtil.obtenerTexto(cuerpo, "nacionalidad"),
                JsonUtil.obtenerTexto(cuerpo, "descripcion"),
                JsonUtil.obtenerTexto(cuerpo, "observaciones"),
                JsonUtil.obtenerTexto(cuerpo, "urlImagen")
        };

        if (id == 0) {
            return insertar("INSERT INTO vehiculos(id_vendedor, numero_motor, numero_serie, modelo, marca, linea, color, "
                            + "precio_compra, precio_venta, transmision, numero_cilindros, nacionalidad, descripcion, observaciones, url_imagen) "
                            + "VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", datos);
        }

        Object[] datosActualizados = new Object[16];
        System.arraycopy(datos, 0, datosActualizados, 0, 15);
        datosActualizados[15] = id;
        ejecutar("UPDATE vehiculos SET id_vendedor = ?, numero_motor = ?, numero_serie = ?, modelo = ?, marca = ?, "
                        + "linea = ?, color = ?, precio_compra = ?, precio_venta = ?, transmision = ?, numero_cilindros = ?, "
                        + "nacionalidad = ?, descripcion = ?, observaciones = ?, url_imagen = ? WHERE id_vehiculo = ?", datosActualizados);
        return id;
    }

    // -------------------- VENTAS Y ABONOS --------------------

    private static void registrarVenta(HttpExchange intercambio) throws Exception {
        String cuerpo = leerCuerpo(intercambio);
        int idVehiculo = JsonUtil.obtenerEntero(cuerpo, "idVehiculo");
        int idComprador = JsonUtil.obtenerEntero(cuerpo, "idComprador");
        BigDecimal precioFinal = JsonUtil.obtenerDecimal(cuerpo, "precioFinal");
        String estatusPago = textoOValor(JsonUtil.obtenerTexto(cuerpo, "estatusPago"), "PAGADO");

        try (Connection conexion = ConfiguracionBD.abrir()) {
            conexion.setAutoCommit(false);
            try {
                List<Object> vehiculos = consultar(conexion,
                        "SELECT id_vendedor, estado FROM vehiculos WHERE id_vehiculo = ? FOR UPDATE", idVehiculo);

                if (vehiculos.isEmpty()) {
                    throw new IllegalArgumentException("Vehículo no encontrado.");
                }

                Map<String, Object> vehiculo = (Map<String, Object>) vehiculos.get(0);
                if ("VENDIDO".equals(vehiculo.get("estado"))) {
                    throw new IllegalArgumentException("El vehículo ya fue vendido.");
                }
                if (((Number) vehiculo.get("id_vendedor")).intValue() == idComprador) {
                    throw new IllegalArgumentException("El comprador y vendedor deben ser diferentes.");
                }

                int idVenta = insertar(conexion,
                        "INSERT INTO ventas(id_vehiculo, id_comprador, precio_final, estatus_pago, estado_venta) VALUES(?, ?, ?, ?, 'ACTIVA')",
                        idVehiculo, idComprador, precioFinal, estatusPago);

                ejecutar(conexion, "UPDATE ventas SET folio_venta = ? WHERE id_venta = ?",
                        "VTA-" + String.format("%05d", idVenta), idVenta);
                ejecutar(conexion, "UPDATE vehiculos SET estado = 'VENDIDO' WHERE id_vehiculo = ?", idVehiculo);
                guardarHistorial(conexion, "VENTA", idVenta, null, "ACTIVA", "Registro de venta");
                conexion.commit();

                String acta = generarActa(idVenta);
                Map<String, Object> respuesta = mensaje("Venta registrada.");
                respuesta.put("acta", acta);
                responderJson(intercambio, 201, respuesta);
            } catch (Exception error) {
                conexion.rollback();
                throw error;
            }
        }
    }

    private static void listarAbonos(HttpExchange intercambio, int idVenta) throws Exception {
        responderJson(intercambio, 200,
                consultar("SELECT * FROM abonos_venta WHERE id_venta = ? ORDER BY fecha_abono DESC", idVenta));
    }

    private static void registrarAbono(HttpExchange intercambio, int idVenta) throws Exception {
        String cuerpo = leerCuerpo(intercambio);
        BigDecimal monto = JsonUtil.obtenerDecimal(cuerpo, "monto");
        List<Object> ventas = consultar("SELECT precio_final, estado_venta FROM ventas WHERE id_venta = ?", idVenta);

        if (ventas.isEmpty()) {
            throw new IllegalArgumentException("Venta no encontrada.");
        }

        Map<String, Object> venta = (Map<String, Object>) ventas.get(0);
        if ("CANCELADA".equals(venta.get("estado_venta"))) {
            throw new IllegalArgumentException("No se pueden registrar abonos a una venta cancelada.");
        }

        BigDecimal totalAbonado = obtenerDecimalUnico(
                "SELECT COALESCE(SUM(monto), 0) FROM abonos_venta WHERE id_venta = ?", idVenta);
        BigDecimal precioFinal = (BigDecimal) venta.get("precio_final");

        if (totalAbonado.add(monto).compareTo(precioFinal) > 0) {
            throw new IllegalArgumentException("El abono supera el precio final.");
        }

        ejecutar("INSERT INTO abonos_venta(id_venta, monto, metodo_pago, referencia_pago, observaciones) VALUES(?, ?, ?, ?, ?)",
                idVenta, monto,
                textoOValor(JsonUtil.obtenerTexto(cuerpo, "metodoPago"), "EFECTIVO"),
                JsonUtil.obtenerTexto(cuerpo, "referenciaPago"),
                JsonUtil.obtenerTexto(cuerpo, "observaciones"));

        if (totalAbonado.add(monto).compareTo(precioFinal) == 0) {
            ejecutar("UPDATE ventas SET estatus_pago = 'PAGADO' WHERE id_venta = ?", idVenta);
        }

        responderJson(intercambio, 201, mensaje("Abono registrado."));
    }

    private static void cancelarVenta(HttpExchange intercambio, int idVenta) throws Exception {
        List<Object> ventas = consultar("SELECT id_vehiculo FROM ventas WHERE id_venta = ?", idVenta);
        if (ventas.isEmpty()) {
            throw new IllegalArgumentException("Venta no encontrada.");
        }

        Map<String, Object> venta = (Map<String, Object>) ventas.get(0);
        ejecutar("UPDATE ventas SET estado_venta = 'CANCELADA' WHERE id_venta = ?", idVenta);
        ejecutar("UPDATE vehiculos SET estado = 'PUBLICADO' WHERE id_vehiculo = ?", venta.get("id_vehiculo"));
        guardarHistorial("VENTA", idVenta, "ACTIVA", "CANCELADA", "Cancelación de venta");
        responderJson(intercambio, 200, mensaje("Venta cancelada."));
    }

    private static void cambiarEstatusPago(HttpExchange intercambio, int idVenta) throws Exception {
        String cuerpo = leerCuerpo(intercambio);
        String nuevoEstatus = JsonUtil.obtenerTexto(cuerpo, "estatusPago");
        String anterior = obtenerTextoUnico("SELECT estatus_pago FROM ventas WHERE id_venta = ?", idVenta);

        ejecutar("UPDATE ventas SET estatus_pago = ? WHERE id_venta = ?", nuevoEstatus, idVenta);
        guardarHistorial("PAGO", idVenta, anterior, nuevoEstatus, "Cambio manual de pago");
        responderJson(intercambio, 200, mensaje("Estatus actualizado."));
    }

    // -------------------- REPORTES Y ACTA --------------------

    private static List<Object> reporteVendidos() throws Exception {
        return consultar("SELECT ven.*, v.*, cv.nombre_completo AS vendedor, cc.nombre_completo AS comprador, "
                + "COALESCE((SELECT SUM(a.monto) FROM abonos_venta a WHERE a.id_venta = ven.id_venta), 0) AS monto_pagado "
                + "FROM ventas ven JOIN vehiculos v ON v.id_vehiculo = ven.id_vehiculo "
                + "JOIN clientes cv ON cv.id_cliente = v.id_vendedor "
                + "JOIN clientes cc ON cc.id_cliente = ven.id_comprador "
                + "ORDER BY ven.fecha_venta DESC");
    }

    private static Object estadisticas() throws Exception {
        List<Object> resultados = consultar("SELECT COUNT(*) AS total_vehiculos, "
                + "SUM(estado = 'PUBLICADO') AS vehiculos_activos, "
                + "SUM(estado = 'VENDIDO') AS vehiculos_vendidos, "
                + "COALESCE((SELECT SUM(precio_final) FROM ventas WHERE estado_venta = 'ACTIVA'), 0) AS ingresos_totales "
                + "FROM vehiculos");
        return resultados.get(0);
    }

    private static String generarActa(int idVenta) throws Exception {
        List<Object> resultados = consultar("SELECT ven.*, v.*, "
                + "cv.nombre_completo AS vendedor, cv.domicilio AS domicilio_vendedor, "
                + "cv.correo_electronico AS correo_vendedor, cv.telefono AS telefono_vendedor, "
                + "cc.nombre_completo AS comprador, cc.domicilio AS domicilio_comprador, "
                + "cc.correo_electronico AS correo_comprador, cc.telefono AS telefono_comprador "
                + "FROM ventas ven JOIN vehiculos v ON v.id_vehiculo = ven.id_vehiculo "
                + "JOIN clientes cv ON cv.id_cliente = v.id_vendedor "
                + "JOIN clientes cc ON cc.id_cliente = ven.id_comprador WHERE ven.id_venta = ?", idVenta);

        if (resultados.isEmpty()) {
            throw new IllegalArgumentException("Venta no encontrada.");
        }

        Map<String, Object> venta = (Map<String, Object>) resultados.get(0);
        String nombreArchivo = "acta-venta-" + idVenta + "-" + System.currentTimeMillis() + ".html";

        String[] datos = {
                valor(venta, "id_vehiculo"), valor(venta, "numero_motor"), valor(venta, "numero_serie"),
                valor(venta, "modelo"), valor(venta, "marca"), valor(venta, "linea"), valor(venta, "color"),
                valor(venta, "precio_compra"), valor(venta, "precio_final"), valor(venta, "transmision"),
                valor(venta, "numero_cilindros"), valor(venta, "nacionalidad"), valor(venta, "descripcion"),
                valor(venta, "observaciones"), valor(venta, "vendedor"), valor(venta, "domicilio_vendedor"),
                valor(venta, "correo_vendedor"), valor(venta, "telefono_vendedor"), valor(venta, "comprador"),
                valor(venta, "domicilio_comprador"), valor(venta, "correo_comprador"), valor(venta, "telefono_comprador"),
                "Morelia, Michoacán.", LocalDate.now().toString(), nombreArchivo
        };

        GeneradorActa.main(datos);
        String rutaActa = "/actas/" + nombreArchivo;
        ejecutar("UPDATE ventas SET ruta_acta = ? WHERE id_venta = ?", rutaActa, idVenta);
        return rutaActa;
    }

    // -------------------- CONEXION A MYSQL --------------------

    private static List<Object> consultar(String sql, Object... valores) throws Exception {
        try (Connection conexion = ConfiguracionBD.abrir()) {
            return consultar(conexion, sql, valores);
        }
    }

    private static List<Object> consultar(Connection conexion, String sql, Object... valores) throws SQLException {
        List<Object> filas = new ArrayList<>();

        try (PreparedStatement consulta = conexion.prepareStatement(sql)) {
            colocarValores(consulta, valores);
            try (ResultSet resultado = consulta.executeQuery()) {
                ResultSetMetaData columnas = resultado.getMetaData();

                while (resultado.next()) {
                    Map<String, Object> fila = new LinkedHashMap<>();
                    for (int i = 1; i <= columnas.getColumnCount(); i++) {
                        fila.put(columnas.getColumnLabel(i), resultado.getObject(i));
                    }
                    filas.add(fila);
                }
            }
        }

        return filas;
    }

    private static void ejecutar(String sql, Object... valores) throws Exception {
        try (Connection conexion = ConfiguracionBD.abrir()) {
            ejecutar(conexion, sql, valores);
        }
    }

    private static void ejecutar(Connection conexion, String sql, Object... valores) throws SQLException {
        try (PreparedStatement consulta = conexion.prepareStatement(sql)) {
            colocarValores(consulta, valores);
            consulta.executeUpdate();
        }
    }

    private static int insertar(String sql, Object... valores) throws Exception {
        try (Connection conexion = ConfiguracionBD.abrir()) {
            return insertar(conexion, sql, valores);
        }
    }

    private static int insertar(Connection conexion, String sql, Object... valores) throws SQLException {
        try (PreparedStatement consulta = conexion.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            colocarValores(consulta, valores);
            consulta.executeUpdate();

            try (ResultSet llaves = consulta.getGeneratedKeys()) {
                llaves.next();
                return llaves.getInt(1);
            }
        }
    }

    private static void colocarValores(PreparedStatement consulta, Object... valores) throws SQLException {
        for (int i = 0; i < valores.length; i++) {
            consulta.setObject(i + 1, valores[i]);
        }
    }

    private static int contar(String sql, Object... valores) throws Exception {
        Map<String, Object> fila = (Map<String, Object>) consultar(sql, valores).get(0);
        return ((Number) fila.values().iterator().next()).intValue();
    }

    private static String obtenerTextoUnico(String sql, Object... valores) throws Exception {
        List<Object> filas = consultar(sql, valores);
        if (filas.isEmpty()) {
            return null;
        }

        Map<String, Object> fila = (Map<String, Object>) filas.get(0);
        Object valor = fila.values().iterator().next();
        return valor == null ? null : String.valueOf(valor);
    }

    private static BigDecimal obtenerDecimalUnico(String sql, Object... valores) throws Exception {
        Map<String, Object> fila = (Map<String, Object>) consultar(sql, valores).get(0);
        return (BigDecimal) fila.values().iterator().next();
    }

    private static void guardarHistorial(String entidad, int id, String anterior, String nuevo, String motivo) throws Exception {
        try (Connection conexion = ConfiguracionBD.abrir()) {
            guardarHistorial(conexion, entidad, id, anterior, nuevo, motivo);
        }
    }

    private static void guardarHistorial(Connection conexion, String entidad, int id, String anterior,
                                         String nuevo, String motivo) throws SQLException {
        ejecutar(conexion, "INSERT INTO historial_estados(entidad, id_entidad, estado_anterior, estado_nuevo, motivo) "
                        + "VALUES(?, ?, ?, ?, ?)", entidad, id, anterior, nuevo, motivo);
    }

    // -------------------- ARCHIVOS Y RESPUESTAS --------------------

    private static String leerCuerpo(HttpExchange intercambio) throws IOException {
        return new String(intercambio.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
    }

    private static Map<String, String> parametros(URI direccion) {
        Map<String, String> parametros = new LinkedHashMap<>();
        String consulta = direccion.getRawQuery();

        if (consulta == null) {
            return parametros;
        }

        for (String parte : consulta.split("&")) {
            String[] dato = parte.split("=", 2);
            String llave = URLDecoder.decode(dato[0], StandardCharsets.UTF_8);
            String valor = dato.length > 1 ? URLDecoder.decode(dato[1], StandardCharsets.UTF_8) : "";
            parametros.put(llave, valor);
        }

        return parametros;
    }

    private static void enviarArchivo(HttpExchange intercambio, String ruta) throws IOException {
        if (ruta.equals("/")) {
            ruta = "/frontend/index.html";
        } else if (!ruta.startsWith("/frontend/") && !ruta.startsWith("/actas/")) {
            ruta = "/frontend" + ruta;
        }

        Path archivo = CARPETA_PROYECTO.resolve(ruta.substring(1)).normalize();
        if (!archivo.startsWith(CARPETA_PROYECTO) || !Files.exists(archivo)) {
            responderError(intercambio, 404, "Archivo no encontrado.");
            return;
        }

        String tipo = "application/octet-stream";
        if (ruta.endsWith(".html")) tipo = "text/html";
        if (ruta.endsWith(".css")) tipo = "text/css";
        if (ruta.endsWith(".js")) tipo = "application/javascript";
        if (ruta.endsWith(".svg")) tipo = "image/svg+xml";

        byte[] contenido = Files.readAllBytes(archivo);
        intercambio.getResponseHeaders().set("Content-Type", tipo + "; charset=utf-8");
        intercambio.sendResponseHeaders(200, contenido.length);
        intercambio.getResponseBody().write(contenido);
        intercambio.close();
    }

    private static void responderJson(HttpExchange intercambio, int estado, Object datos) throws IOException {
        byte[] contenido = JsonUtil.convertir(datos).getBytes(StandardCharsets.UTF_8);
        intercambio.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        intercambio.sendResponseHeaders(estado, contenido.length);
        intercambio.getResponseBody().write(contenido);
        intercambio.close();
    }

    private static void responderError(HttpExchange intercambio, int estado, String texto) throws IOException {
        responderJson(intercambio, estado, Map.of("error", texto));
    }

    // -------------------- METODOS PEQUEÑOS --------------------

    private static void validarCliente(String cuerpo) {
        revisarCampo(cuerpo, "nombreCompleto");
        revisarCampo(cuerpo, "domicilio");
        revisarCampo(cuerpo, "correoElectronico");
        revisarCampo(cuerpo, "telefono");
    }

    private static void validarVehiculo(String cuerpo) {
        String[] campos = {"idVendedor", "numeroMotor", "numeroSerie", "modelo", "marca", "linea", "color",
                "precioCompra", "precioVenta", "transmision", "numeroCilindros", "nacionalidad", "descripcion"};
        for (String campo : campos) {
            revisarCampo(cuerpo, campo);
        }
    }

    private static void revisarCampo(String cuerpo, String campo) {
        if (JsonUtil.obtenerTexto(cuerpo, campo).isEmpty()) {
            throw new IllegalArgumentException("Falta el campo: " + campo);
        }
    }

    private static Map<String, Object> mensaje(String texto) {
        Map<String, Object> respuesta = new LinkedHashMap<>();
        respuesta.put("mensaje", texto);
        return respuesta;
    }

    private static Map<String, Object> idCreado(int id) {
        Map<String, Object> respuesta = new LinkedHashMap<>();
        respuesta.put("id", id);
        return respuesta;
    }

    private static int idFinal(String ruta) {
        return Integer.parseInt(ruta.substring(ruta.lastIndexOf('/') + 1));
    }

    private static int idDelSegmento(String ruta, int numero) {
        return Integer.parseInt(ruta.split("/")[numero]);
    }

    private static String textoOValor(String texto, String valorAlterno) {
        return texto.isEmpty() ? valorAlterno : texto;
    }

    private static String valor(Map<String, Object> datos, String campo) {
        Object valor = datos.get(campo);
        return valor == null ? "" : String.valueOf(valor);
    }
}
