import java.io.FileInputStream;
import java.io.IOException;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Properties;

// Clase sencilla para abrir conexiones JDBC a MySQL. No usa Maven ni frameworks.
public final class ConfiguracionBD {
    private static final Properties PROPIEDADES = new Properties();

    static {
        try (FileInputStream archivo = new FileInputStream("java/database.properties")) {
            PROPIEDADES.load(archivo);
            Class.forName("com.mysql.cj.jdbc.Driver");
        } catch (IOException e) {
            throw new RuntimeException("Falta java/database.properties. Copie database.properties.example y configure MySQL.", e);
        } catch (ClassNotFoundException e) {
            throw new RuntimeException("Falta el driver JDBC de MySQL en java/lib/. Consulte el README.", e);
        }
    }

    private ConfiguracionBD() { }

    public static Connection abrir() throws SQLException {
        return DriverManager.getConnection(
            PROPIEDADES.getProperty("url"),
            PROPIEDADES.getProperty("user"),
            PROPIEDADES.getProperty("password")
        );
    }
}
