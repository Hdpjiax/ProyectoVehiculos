import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

// Convertidor JSON pequeño para evitar dependencias externas en el proyecto escolar.
public final class JsonUtil {
    private JsonUtil() { }

    public static String texto(Object valor) {
        if (valor == null) return "null";
        if (valor instanceof String || valor instanceof Character) return '"' + escapar(String.valueOf(valor)) + '"';
        if (valor instanceof Number || valor instanceof Boolean) return String.valueOf(valor);
        if (valor instanceof Map<?, ?> mapa) {
            List<String> partes = new ArrayList<>();
            for (Map.Entry<?, ?> e : mapa.entrySet()) partes.add(texto(String.valueOf(e.getKey())) + ":" + texto(e.getValue()));
            return "{" + String.join(",", partes) + "}";
        }
        if (valor instanceof Iterable<?> lista) {
            List<String> partes = new ArrayList<>();
            for (Object item : lista) partes.add(texto(item));
            return "[" + String.join(",", partes) + "]";
        }
        return texto(String.valueOf(valor));
    }

    public static Map<String, Object> objeto(String json) {
        Object resultado = new Lector(json).valor();
        if (!(resultado instanceof Map<?, ?>)) throw new IllegalArgumentException("JSON debe ser un objeto.");
        @SuppressWarnings("unchecked") Map<String, Object> mapa = (Map<String, Object>) resultado;
        return mapa;
    }

    public static String cadena(Map<String, Object> datos, String nombre) {
        Object valor = datos.get(nombre);
        return valor == null ? "" : String.valueOf(valor).trim();
    }

    public static int entero(Map<String, Object> datos, String nombre) {
        String valor = cadena(datos, nombre);
        if (valor.isBlank()) throw new IllegalArgumentException("Falta el dato: " + nombre);
        return new BigDecimal(valor).intValueExact();
    }

    public static BigDecimal decimal(Map<String, Object> datos, String nombre) {
        String valor = cadena(datos, nombre);
        if (valor.isBlank()) throw new IllegalArgumentException("Falta el dato: " + nombre);
        return new BigDecimal(valor);
    }

    private static String escapar(String texto) {
        return texto.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r").replace("\t", "\\t");
    }

    private static final class Lector {
        private final String fuente; private int pos;
        Lector(String fuente) { this.fuente = fuente == null ? "" : fuente; }
        Object valor() {
            espacios(); if (pos >= fuente.length()) throw new IllegalArgumentException("JSON vacío.");
            char c = fuente.charAt(pos);
            Object r = c == '{' ? objeto() : c == '[' ? lista() : c == '"' ? cadena() : numeroOTexto();
            espacios(); if (pos != fuente.length()) throw new IllegalArgumentException("JSON inválido."); return r;
        }
        private Map<String,Object> objeto() {
            Map<String,Object> r = new LinkedHashMap<>(); esperar('{'); espacios();
            if (ver('}')) { pos++; return r; }
            while (true) { espacios(); String k = cadena(); espacios(); esperar(':'); espacios(); r.put(k, leerValor()); espacios(); if (ver('}')) { pos++; return r; } esperar(','); }
        }
        private List<Object> lista() {
            List<Object> r = new ArrayList<>(); esperar('['); espacios(); if (ver(']')) { pos++; return r; }
            while (true) { r.add(leerValor()); espacios(); if (ver(']')) { pos++; return r; } esperar(','); espacios(); }
        }
        private Object leerValor() { espacios(); char c = fuente.charAt(pos); return c == '{' ? objeto() : c == '[' ? lista() : c == '"' ? cadena() : numeroOTexto(); }
        private String cadena() { esperar('"'); StringBuilder r = new StringBuilder(); while (pos < fuente.length()) { char c=fuente.charAt(pos++); if(c=='"') return r.toString(); if(c=='\\' && pos<fuente.length()) { char e=fuente.charAt(pos++); r.append(e=='n'?'\n':e=='t'?'\t':e=='r'?'\r':e); } else r.append(c); } throw new IllegalArgumentException("Cadena JSON sin cerrar."); }
        private Object numeroOTexto() { int inicio=pos; while(pos<fuente.length() && " ,]}\r\n\t".indexOf(fuente.charAt(pos))<0) pos++; String t=fuente.substring(inicio,pos); if("null".equals(t))return null; if("true".equals(t))return true; if("false".equals(t))return false; try{return new BigDecimal(t);}catch(NumberFormatException e){throw new IllegalArgumentException("Valor JSON inválido.");} }
        private void espacios(){while(pos<fuente.length()&&Character.isWhitespace(fuente.charAt(pos)))pos++;}
        private boolean ver(char c){return pos<fuente.length()&&fuente.charAt(pos)==c;}
        private void esperar(char c){espacios();if(!ver(c))throw new IllegalArgumentException("JSON inválido.");pos++;}
    }
}
