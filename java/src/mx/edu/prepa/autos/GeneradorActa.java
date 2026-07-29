package mx.edu.prepa.autos;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

/** Genera el acta usando objetos de las clases Cliente y Vehiculo. */
public class GeneradorActa {
    public static void main(String[] datos) throws IOException {
        if (datos.length != 11) throw new IllegalArgumentException("Se esperaban 11 datos para el acta.");
        Vehiculo vehiculo = new Vehiculo(Integer.parseInt(datos[0]), datos[1], Integer.parseInt(datos[2]), datos[3], datos[4], datos[5]);
        Cliente vendedor = new Cliente(0, datos[6], "", "", "");
        Cliente comprador = new Cliente(0, datos[7], "", "", "");
        BigDecimal precioFinal = new BigDecimal(datos[8]);
        String archivo = datos[10];
        String html = "<!doctype html><html lang='es'><meta charset='utf-8'><title>Acta de compraventa</title>"
                + "<style>body{font-family:Arial;max-width:720px;margin:50px auto;line-height:1.6}h1{text-align:center}hr{margin:28px 0}</style>"
                + "<h1>ACTA DE COMPRAVENTA DE VEHÍCULO</h1><p>Fecha: " + limpiar(datos[9]) + "</p><hr>"
                + "<p><b>Vendedor:</b> " + limpiar(vendedor.getNombreCompleto()) + "</p>"
                + "<p><b>Comprador:</b> " + limpiar(comprador.getNombreCompleto()) + "</p>"
                + "<p><b>Vehículo:</b> " + limpiar(vehiculo.getMarca()) + " " + limpiar(vehiculo.getLinea()) + " " + vehiculo.getModelo() + ", color " + limpiar(vehiculo.getColor()) + ".</p>"
                + "<p><b>Número de serie:</b> " + limpiar(vehiculo.getNumeroSerie()) + "</p>"
                + "<p><b>Precio final:</b> $" + precioFinal + " MXN</p><br><br><p>__________________________ &nbsp;&nbsp;&nbsp;&nbsp; __________________________</p><p>Firma del vendedor &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Firma del comprador</p></html>";
        Files.createDirectories(Path.of("actas"));
        Files.writeString(Path.of("actas", archivo), html, StandardCharsets.UTF_8);
        System.out.println(archivo);
    }
    private static String limpiar(String texto) { return texto.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"); }
}
