package mx.edu.prepa.autos.util;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Lector pequeño para objetos JSON planos enviados por este formulario escolar. */
public class JsonSimple {
    private JsonSimple() { }
    public static String leer(InputStream entrada) throws IOException { return new String(entrada.readAllBytes(), StandardCharsets.UTF_8); }
    public static Map<String, String> objeto(String json) {
        Map<String, String> datos = new LinkedHashMap<>();
        Matcher m = Pattern.compile("\\\"([^\\\"]+)\\\"\\s*:\\s*(?:\\\"((?:\\\\.|[^\\\"])*)\\\"|(-?\\d+(?:\\.\\d+)?)|null)").matcher(json);
        while (m.find()) datos.put(m.group(1), m.group(2) != null ? m.group(2).replace("\\\\\"", "\"") : m.group(3));
        return datos;
    }
    public static String escapar(String valor) { return valor == null ? "" : valor.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", ""); }
}
