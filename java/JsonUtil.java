import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

// Utilidades muy pequeñas para leer los formularios y responder JSON.
// El formulario siempre manda valores de texto, por eso esta clase es suficiente para el proyecto.
public class JsonUtil {

    public static String obtenerTexto(String json, String campo) {
        String buscar = "\"" + campo + "\"";
        int posicionCampo = json.indexOf(buscar);

        if (posicionCampo == -1) {
            return "";
        }

        int dosPuntos = json.indexOf(':', posicionCampo + buscar.length());
        int inicio = json.indexOf('"', dosPuntos + 1);

        if (dosPuntos == -1 || inicio == -1) {
            return "";
        }

        int fin = json.indexOf('"', inicio + 1);
        if (fin == -1) {
            return "";
        }

        return json.substring(inicio + 1, fin)
                .replace("\\\"", "\"")
                .replace("\\n", " ")
                .trim();
    }

    public static int obtenerEntero(String json, String campo) {
        String texto = obtenerTexto(json, campo);
        if (texto.isEmpty()) {
            throw new IllegalArgumentException("Falta el campo: " + campo);
        }
        return Integer.parseInt(texto);
    }

    public static BigDecimal obtenerDecimal(String json, String campo) {
        String texto = obtenerTexto(json, campo);
        if (texto.isEmpty()) {
            throw new IllegalArgumentException("Falta el campo: " + campo);
        }
        return new BigDecimal(texto);
    }

    public static String convertir(Object dato) {
        if (dato == null) {
            return "null";
        }
        if (dato instanceof String || dato instanceof Character) {
            return "\"" + escapar(String.valueOf(dato)) + "\"";
        }
        if (dato instanceof Number || dato instanceof Boolean) {
            return String.valueOf(dato);
        }
        if (dato instanceof Map) {
            return convertirMapa((Map<String, Object>) dato);
        }
        if (dato instanceof List) {
            return convertirLista((List<Object>) dato);
        }
        return "\"" + escapar(String.valueOf(dato)) + "\"";
    }

    private static String convertirMapa(Map<String, Object> mapa) {
        StringBuilder resultado = new StringBuilder("{");
        boolean primero = true;

        for (String llave : mapa.keySet()) {
            if (!primero) {
                resultado.append(',');
            }
            resultado.append(convertir(llave));
            resultado.append(':');
            resultado.append(convertir(mapa.get(llave)));
            primero = false;
        }

        resultado.append('}');
        return resultado.toString();
    }

    private static String convertirLista(List<Object> lista) {
        StringBuilder resultado = new StringBuilder("[");

        for (int i = 0; i < lista.size(); i++) {
            if (i > 0) {
                resultado.append(',');
            }
            resultado.append(convertir(lista.get(i)));
        }

        resultado.append(']');
        return resultado.toString();
    }

    private static String escapar(String texto) {
        return texto.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "");
    }
}
