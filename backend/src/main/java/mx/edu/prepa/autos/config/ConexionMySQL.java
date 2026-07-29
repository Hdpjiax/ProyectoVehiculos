package mx.edu.prepa.autos.config;

import java.io.IOException;
import java.io.InputStream;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Properties;

/** Centraliza la conexión; las credenciales quedan fuera del código. */
public class ConexionMySQL {
    private static final Properties PROPIEDADES = new Properties();

    static {
        try (InputStream archivo = ConexionMySQL.class.getClassLoader().getResourceAsStream("database.properties")) {
            if (archivo == null) throw new IllegalStateException("Falta database.properties. Copie database.properties.example.");
            PROPIEDADES.load(archivo);
            Class.forName("com.mysql.cj.jdbc.Driver");
        } catch (IOException | ClassNotFoundException e) {
            throw new ExceptionInInitializerError(e);
        }
    }

    private ConexionMySQL() { }

    public static Connection obtenerConexion() throws SQLException {
        return DriverManager.getConnection(PROPIEDADES.getProperty("db.url"), PROPIEDADES.getProperty("db.user"), PROPIEDADES.getProperty("db.password"));
    }
}
