package mx.edu.prepa.autos;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import mx.edu.prepa.autos.config.ConexionMySQL;
import mx.edu.prepa.autos.util.JsonSimple;
import java.io.File;
import java.io.IOException;
import java.math.BigDecimal;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.sql.*;
import java.time.LocalDateTime;
import java.util.*;

/** API escolar con Java básico, HttpServer y JDBC. */
public class Servidor {
    public static void main(String[] args) throws IOException {
        HttpServer servidor = HttpServer.create(new InetSocketAddress(8080), 0);
        servidor.createContext("/api/clientes", Servidor::clientes);
        servidor.createContext("/api/vehiculos", Servidor::vehiculos);
        servidor.createContext("/api/ventas", Servidor::ventas);
        servidor.createContext("/api/reportes/ofertas", Servidor::ofertas);
        servidor.createContext("/api/reportes/vendidos", Servidor::vendidos);
        servidor.createContext("/", Servidor::archivosEstaticos);
        servidor.setExecutor(null);
        servidor.start();
        System.out.println("Sistema disponible en http://localhost:8080");
    }

    private static void clientes(HttpExchange e) throws IOException {
        String id = ultimoSegmento(e.getRequestURI().getPath(), "/api/clientes");
        try (Connection c = ConexionMySQL.obtenerConexion()) {
            if ("GET".equals(e.getRequestMethod())) {
                String sql = "SELECT * FROM clientes"
                        + (id == null ? " ORDER BY nombre_completo" : " WHERE id_cliente=?");
                try (PreparedStatement p = c.prepareStatement(sql)) {
                    if (id != null)
                        p.setInt(1, entero(id));
                    enviarFilas(e, p);
                }
            } else if ("POST".equals(e.getRequestMethod()) || "PUT".equals(e.getRequestMethod())) {
                Map<String, String> d = datos(e);
                validar(d, "nombreCompleto", "domicilio", "correoElectronico", "telefono");
                boolean nuevo = "POST".equals(e.getRequestMethod());
                String sql = nuevo
                        ? "INSERT INTO clientes(nombre_completo,domicilio,correo_electronico,telefono) VALUES(?,?,?,?)"
                        : "UPDATE clientes SET nombre_completo=?,domicilio=?,correo_electronico=?,telefono=? WHERE id_cliente=?";
                try (PreparedStatement p = c.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
                    clienteParametros(p, d);
                    if (!nuevo)
                        p.setInt(5, enteroObligatorio(id));
                    p.executeUpdate();
                    enviar(e, nuevo ? 201 : 200, "{\"id\":" + (nuevo ? idGenerado(p) : id) + "}");
                }
            } else if ("DELETE".equals(e.getRequestMethod())) {
                try (PreparedStatement p = c.prepareStatement("DELETE FROM clientes WHERE id_cliente=?")) {
                    p.setInt(1, enteroObligatorio(id));
                    p.executeUpdate();
                    enviar(e, 200, "{\"mensaje\":\"Cliente eliminado\"}");
                }
            } else
                noPermitido(e);
        } catch (Exception x) {
            error(e, x);
        }
    }

    private static void vehiculos(HttpExchange e) throws IOException {
        String id = ultimoSegmento(e.getRequestURI().getPath(), "/api/vehiculos");
        try (Connection c = ConexionMySQL.obtenerConexion()) {
            if ("GET".equals(e.getRequestMethod())) {
                Map<String, String> q = parametros(e.getRequestURI());
                StringBuilder sql = new StringBuilder(
                        "SELECT v.*, c.nombre_completo AS vendedor FROM vehiculos v JOIN clientes c ON c.id_cliente=v.id_vendedor WHERE 1=1");
                List<Object> valores = new ArrayList<>();
                if (id != null) {
                    sql.append(" AND v.id_vehiculo=?");
                    valores.add(entero(id));
                }
                agregarFiltro(sql, valores, q, "modelo", "v.modelo=?", true);
                agregarFiltro(sql, valores, q, "marca", "v.marca LIKE ?", false);
                agregarFiltro(sql, valores, q, "precioMax", "v.precio_venta<=?", true);
                agregarFiltro(sql, valores, q, "fecha", "DATE(v.fecha_publicacion)=?", false);
                sql.append(" ORDER BY v.fecha_publicacion DESC");
                try (PreparedStatement p = c.prepareStatement(sql.toString())) {
                    parametros(p, valores);
                    enviarFilas(e, p);
                }
            } else if ("POST".equals(e.getRequestMethod()) || "PUT".equals(e.getRequestMethod())) {
                Map<String, String> d = datos(e);
                validar(d, "idVendedor", "numeroMotor", "numeroSerie", "modelo", "marca", "linea", "color",
                        "precioCompra", "precioVenta", "transmision", "numeroCilindros", "nacionalidad", "descripcion");
                boolean nuevo = "POST".equals(e.getRequestMethod());
                String sql = nuevo
                        ? "INSERT INTO vehiculos(id_vendedor,numero_motor,numero_serie,modelo,marca,linea,color,precio_compra,precio_venta,transmision,numero_cilindros,nacionalidad,descripcion,observaciones) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)"
                        : "UPDATE vehiculos SET id_vendedor=?,numero_motor=?,numero_serie=?,modelo=?,marca=?,linea=?,color=?,precio_compra=?,precio_venta=?,transmision=?,numero_cilindros=?,nacionalidad=?,descripcion=?,observaciones=? WHERE id_vehiculo=?";
                try (PreparedStatement p = c.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
                    vehiculoParametros(p, d);
                    if (!nuevo)
                        p.setInt(15, enteroObligatorio(id));
                    p.executeUpdate();
                    enviar(e, nuevo ? 201 : 200, "{\"id\":" + (nuevo ? idGenerado(p) : id) + "}");
                }
            } else if ("DELETE".equals(e.getRequestMethod())) {
                try (PreparedStatement p = c.prepareStatement("DELETE FROM vehiculos WHERE id_vehiculo=?")) {
                    p.setInt(1, enteroObligatorio(id));
                    p.executeUpdate();
                    enviar(e, 200, "{\"mensaje\":\"Vehículo eliminado\"}");
                }
            } else
                noPermitido(e);
        } catch (Exception x) {
            error(e, x);
        }
    }

    private static void ventas(HttpExchange e) throws IOException {
        if (!"POST".equals(e.getRequestMethod())) {
            noPermitido(e);
            return;
        }
        try (Connection c = ConexionMySQL.obtenerConexion()) {
            Map<String, String> d = datos(e);
            validar(d, "idVehiculo", "idComprador", "precioFinal");
            c.setAutoCommit(false);
            try (PreparedStatement disponible = c.prepareStatement(
                    "SELECT id_vendedor FROM vehiculos WHERE id_vehiculo=? AND estado='PUBLICADO' FOR UPDATE")) {
                disponible.setInt(1, entero(d.get("idVehiculo")));
                ResultSet r = disponible.executeQuery();
                if (!r.next())
                    throw new IllegalArgumentException("El vehículo no existe o ya fue vendido.");
                if (r.getInt(1) == entero(d.get("idComprador")))
                    throw new IllegalArgumentException("Comprador y vendedor deben ser personas diferentes.");
            }
            try (PreparedStatement p = c
                    .prepareStatement("INSERT INTO ventas(id_vehiculo,id_comprador,precio_final) VALUES(?,?,?)")) {
                p.setInt(1, entero(d.get("idVehiculo")));
                p.setInt(2, entero(d.get("idComprador")));
                p.setBigDecimal(3, new BigDecimal(d.get("precioFinal")));
                p.executeUpdate();
            }
            try (PreparedStatement p = c
                    .prepareStatement("UPDATE vehiculos SET estado='VENDIDO' WHERE id_vehiculo=?")) {
                p.setInt(1, entero(d.get("idVehiculo")));
                p.executeUpdate();
            }
            c.commit();
            enviar(e, 201, "{\"mensaje\":\"Venta registrada\"}");
        } catch (Exception x) {
            error(e, x);
        }
    }

    private static void ofertas(HttpExchange e) throws IOException {
        consultarReporte(e,
                "SELECT v.*,c.nombre_completo AS vendedor FROM vehiculos v JOIN clientes c ON c.id_cliente=v.id_vendedor WHERE v.estado='PUBLICADO' ORDER BY v.fecha_publicacion DESC");
    }

    private static void vendidos(HttpExchange e) throws IOException {
        consultarReporte(e,
                "SELECT v.*,ven.fecha_venta,ven.precio_final,cv.nombre_completo AS vendedor,cc.nombre_completo AS comprador FROM ventas ven JOIN vehiculos v ON v.id_vehiculo=ven.id_vehiculo JOIN clientes cv ON cv.id_cliente=v.id_vendedor JOIN clientes cc ON cc.id_cliente=ven.id_comprador ORDER BY ven.fecha_venta DESC");
    }

    private static void consultarReporte(HttpExchange e, String sql) throws IOException {
        if (!"GET".equals(e.getRequestMethod())) {
            noPermitido(e);
            return;
        }
        try (Connection c = ConexionMySQL.obtenerConexion(); PreparedStatement p = c.prepareStatement(sql)) {
            enviarFilas(e, p);
        } catch (Exception x) {
            error(e, x);
        }
    }

    private static void archivosEstaticos(HttpExchange e) throws IOException {
        if (!"GET".equals(e.getRequestMethod())) {
            noPermitido(e);
            return;
        }
        String ruta = e.getRequestURI().getPath();
        if ("/".equals(ruta))
            ruta = "/index.html";
        File archivo = new File("../frontend" + ruta).getCanonicalFile();
        File base = new File("../frontend").getCanonicalFile();
        if (!archivo.getPath().startsWith(base.getPath()) || !archivo.isFile()) {
            enviar(e, 404, "Archivo no encontrado");
            return;
        }
        String tipo = ruta.endsWith(".css") ? "text/css"
                : ruta.endsWith(".js") ? "application/javascript" : "text/html";
        byte[] b = Files.readAllBytes(archivo.toPath());
        e.getResponseHeaders().set("Content-Type", tipo + "; charset=utf-8");
        e.sendResponseHeaders(200, b.length);
        e.getResponseBody().write(b);
        e.close();
    }

    private static Map<String, String> datos(HttpExchange e) throws IOException {
        return JsonSimple.objeto(JsonSimple.leer(e.getRequestBody()));
    }

    private static void clienteParametros(PreparedStatement p, Map<String, String> d) throws SQLException {
        p.setString(1, d.get("nombreCompleto"));
        p.setString(2, d.get("domicilio"));
        p.setString(3, d.get("correoElectronico"));
        p.setString(4, d.get("telefono"));
    }

    private static void vehiculoParametros(PreparedStatement p, Map<String, String> d) throws SQLException {
        p.setInt(1, entero(d.get("idVendedor")));
        p.setString(2, d.get("numeroMotor"));
        p.setString(3, d.get("numeroSerie"));
        p.setInt(4, entero(d.get("modelo")));
        p.setString(5, d.get("marca"));
        p.setString(6, d.get("linea"));
        p.setString(7, d.get("color"));
        p.setBigDecimal(8, new BigDecimal(d.get("precioCompra")));
        p.setBigDecimal(9, new BigDecimal(d.get("precioVenta")));
        p.setString(10, d.get("transmision").toUpperCase());
        p.setInt(11, entero(d.get("numeroCilindros")));
        p.setString(12, d.get("nacionalidad"));
        p.setString(13, d.get("descripcion"));
        p.setString(14, d.getOrDefault("observaciones", ""));
    }

    private static void enviarFilas(HttpExchange e, PreparedStatement p) throws SQLException, IOException {
        try (ResultSet r = p.executeQuery()) {
            StringBuilder j = new StringBuilder("[");
            ResultSetMetaData m = r.getMetaData();
            while (r.next()) {
                if (j.length() > 1)
                    j.append(',');
                j.append('{');
                for (int i = 1; i <= m.getColumnCount(); i++) {
                    if (i > 1)
                        j.append(',');
                    Object v = r.getObject(i);
                    j.append('\"').append(m.getColumnLabel(i)).append("\":");
                    if (v == null)
                        j.append("null");
                    else if (v instanceof Number)
                        j.append(v);
                    else
                        j.append('\"').append(JsonSimple.escapar(String.valueOf(v))).append('\"');
                }
                j.append('}');
            }
            enviar(e, 200, j.append(']').toString());
        }
    }

    private static void enviar(HttpExchange e, int estado, String cuerpo) throws IOException {
        byte[] b = cuerpo.getBytes(StandardCharsets.UTF_8);
        e.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        e.sendResponseHeaders(estado, b.length);
        e.getResponseBody().write(b);
        e.close();
    }

    private static void error(HttpExchange e, Exception x) throws IOException {
        System.err.println(x.getMessage());
        enviar(e, x instanceof IllegalArgumentException ? 400 : 500,
                "{\"error\":\"" + JsonSimple.escapar(x.getMessage()) + "\"}");
    }

    private static void noPermitido(HttpExchange e) throws IOException {
        enviar(e, 405, "{\"error\":\"Método no permitido\"}");
    }

    private static int idGenerado(PreparedStatement p) throws SQLException {
        try (ResultSet r = p.getGeneratedKeys()) {
            return r.next() ? r.getInt(1) : 0;
        }
    }

    private static int entero(String s) {
        return Integer.parseInt(s);
    }

    private static int enteroObligatorio(String s) {
        if (s == null)
            throw new IllegalArgumentException("Falta el identificador.");
        return entero(s);
    }

    private static void validar(Map<String, String> d, String... campos) {
        for (String c : campos)
            if (d.get(c) == null || d.get(c).isBlank())
                throw new IllegalArgumentException("Falta el campo: " + c);
    }

    private static String ultimoSegmento(String ruta, String base) {
        String v = ruta.substring(base.length());
        return v.isBlank() || "/".equals(v) ? null : v.startsWith("/") ? v.substring(1) : null;
    }

    private static Map<String, String> parametros(URI uri) {
        Map<String, String> r = new HashMap<>();
        if (uri.getRawQuery() == null)
            return r;
        for (String par : uri.getRawQuery().split("&")) {
            String[] x = par.split("=", 2);
            r.put(URLDecoder.decode(x[0], StandardCharsets.UTF_8),
                    x.length > 1 ? URLDecoder.decode(x[1], StandardCharsets.UTF_8) : "");
        }
        return r;
    }

    private static void agregarFiltro(StringBuilder s, List<Object> v, Map<String, String> q, String k,
            String condicion, boolean numero) {
        if (q.containsKey(k) && !q.get(k).isBlank()) {
            s.append(" AND ").append(condicion);
            v.add(numero ? new BigDecimal(q.get(k)) : k.equals("marca") ? "%" + q.get(k) + "%" : q.get(k));
        }
    }

    private static void parametros(PreparedStatement p, List<Object> v) throws SQLException {
        for (int i = 0; i < v.size(); i++)
            p.setObject(i + 1, v.get(i));
    }
}
