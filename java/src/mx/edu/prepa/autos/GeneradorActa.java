package mx.edu.prepa.autos;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

/** Genera el acta usando objetos de las clases Cliente y Vehiculo. */
public class GeneradorActa {
    public static void main(String[] datos) throws IOException {
        if (datos.length != 24)
            throw new IllegalArgumentException("Se esperaban 24 datos para el acta.");
        int idVehiculo = Integer.parseInt(datos[0]);
        Vehiculo vehiculo = new Vehiculo(idVehiculo, datos[2], Integer.parseInt(datos[3]), datos[4], datos[5],
                datos[6]);
        BigDecimal precioCompra = new BigDecimal(datos[7]);
        BigDecimal precioFinal = new BigDecimal(datos[8]);
        Cliente vendedor = new Cliente(0, datos[14], datos[15], datos[16], datos[17]);
        Cliente comprador = new Cliente(0, datos[18], datos[19], datos[20], datos[21]);
        String fecha = limpiar(datos[22]);
        String archivo = datos[23];
        String vehiculoTexto = limpiar(vehiculo.getMarca()) + " " + limpiar(vehiculo.getLinea()) + " modelo "
                + vehiculo.getModelo();
        String html = "<!doctype html><html lang='es'><head><meta charset='utf-8'><title>Acta de compraventa</title>"
                + "<style>"
                + "body{font-family:Arial,Helvetica,sans-serif;color:#171717;background:#f4f4f0;margin:0;padding:38px}"
                + ".hoja{max-width:820px;margin:auto;background:white;padding:48px 56px;border:1px solid #d8d8d0;box-shadow:0 18px 45px rgba(0,0,0,.08)}"
                + ".membrete{display:flex;justify-content:space-between;gap:24px;border-bottom:3px solid #111;padding-bottom:18px;margin-bottom:28px}"
                + ".marca{font-size:24px;font-weight:800;letter-spacing:.08em}.folio{text-align:right;font-size:12px;color:#555}"
                + "h1{text-align:center;font-size:22px;letter-spacing:.12em;margin:28px 0}h2{font-size:14px;letter-spacing:.08em;margin:26px 0 10px;border-bottom:1px solid #ddd;padding-bottom:6px}"
                + "p{font-size:14px;line-height:1.75;text-align:justify}.datos{width:100%;border-collapse:collapse;margin:14px 0 18px}.datos th,.datos td{border:1px solid #ccc;padding:10px;text-align:left;font-size:13px}.datos th{background:#f1f1ed;width:32%}"
                + ".firmas{display:grid;grid-template-columns:1fr 1fr;gap:54px;margin-top:64px;text-align:center}.firma{border-top:1px solid #111;padding-top:10px;font-size:13px}.nota{font-size:12px;color:#555;margin-top:30px;text-align:left}"
                + "@media print{body{background:white;padding:0}.hoja{box-shadow:none;border:0}.no-print{display:none}}"
                + "</style></head><body><main class='hoja'>"
                + "<section class='membrete'><div><div class='marca'>MOTORCASA</div><div>Agencia de autos usados</div></div><div class='folio'><b>Folio:</b> ACTA-"
                + idVehiculo + "-" + System.currentTimeMillis() + "<br><b>Fecha:</b> " + fecha + "</div></section>"
                + "<h1>ACTA DE COMPRAVENTA DE VEHÍCULO</h1>"
                + "<p>En la fecha indicada, comparecen por una parte <b>" + limpiar(vendedor.getNombreCompleto())
                + "</b>, en lo sucesivo <b>EL VENDEDOR</b>, y por la otra <b>"
                + limpiar(comprador.getNombreCompleto())
                + "</b>, en lo sucesivo <b>EL COMPRADOR</b>, quienes manifiestan su voluntad de celebrar la presente compraventa de vehículo.</p>"
                + "<h2>DATOS DEL VEHÍCULO</h2><table class='datos'>"
                + "<tr><th>Vehículo</th><td>" + vehiculoTexto + "</td></tr>"
                + "<tr><th>Color</th><td>" + limpiar(vehiculo.getColor()) + "</td></tr>"
                + "<tr><th>Número de motor</th><td>" + limpiar(datos[1]) + "</td></tr>"
                + "<tr><th>Número de serie</th><td>" + limpiar(vehiculo.getNumeroSerie()) + "</td></tr>"
                + "<tr><th>Transmisión</th><td>" + limpiar(datos[9]) + "</td></tr>"
                + "<tr><th>Número de cilindros</th><td>" + limpiar(datos[10]) + "</td></tr>"
                + "<tr><th>Nacionalidad</th><td>" + limpiar(datos[11]) + "</td></tr>"
                + "<tr><th>Descripción</th><td>" + limpiar(datos[12]) + "</td></tr>"
                + "<tr><th>Observaciones</th><td>" + limpiar(datos[13]) + "</td></tr>"
                + "<tr><th>Precio de compra registrado</th><td>$" + precioCompra + " MXN</td></tr>"
                + "<tr><th>Precio final</th><td>$" + precioFinal + " MXN</td></tr>"
                + "</table>"
                + "<h2>DATOS DEL VENDEDOR</h2><table class='datos'>"
                + "<tr><th>Nombre completo</th><td>" + limpiar(vendedor.getNombreCompleto()) + "</td></tr>"
                + "<tr><th>Domicilio</th><td>" + limpiar(vendedor.getDomicilio()) + "</td></tr>"
                + "<tr><th>Correo electrónico</th><td>" + limpiar(vendedor.getCorreoElectronico()) + "</td></tr>"
                + "<tr><th>Teléfono</th><td>" + limpiar(vendedor.getTelefono()) + "</td></tr>"
                + "</table>"
                + "<h2>DATOS DEL COMPRADOR</h2><table class='datos'>"
                + "<tr><th>Nombre completo</th><td>" + limpiar(comprador.getNombreCompleto()) + "</td></tr>"
                + "<tr><th>Domicilio</th><td>" + limpiar(comprador.getDomicilio()) + "</td></tr>"
                + "<tr><th>Correo electrónico</th><td>" + limpiar(comprador.getCorreoElectronico()) + "</td></tr>"
                + "<tr><th>Teléfono</th><td>" + limpiar(comprador.getTelefono()) + "</td></tr>"
                + "</table>"
                + "<h2>DECLARACIONES</h2>"
                + "<p>EL VENDEDOR declara que el vehículo descrito se entrega en las condiciones acordadas entre las partes. EL COMPRADOR declara haber revisado la información del vehículo y aceptar el precio final señalado.</p>"
                + "<p>Ambas partes reconocen que el pago y la entrega del vehículo quedan registrados en el sistema MotorCasa para efectos de control administrativo y generación de evidencia documental.</p>"
                + "<h2>CONFORMIDAD</h2>"
                + "<p>Leída la presente acta y enteradas las partes de su contenido, alcance y efectos, la firman de conformidad para constancia.</p>"
                + "<section class='firmas'><div class='firma'>"
                + limpiar(vendedor.getNombreCompleto()) + "<br>EL VENDEDOR</div><div class='firma'>"
                + limpiar(comprador.getNombreCompleto()) + "<br>EL COMPRADOR</div></section>"
                + "<p class='nota'>Documento generado automáticamente por MotorCasa. Imprima esta acta y conserve una copia para cada parte.</p>"
                + "</main></body></html>";
        Files.createDirectories(Path.of("actas"));
        Files.writeString(Path.of("actas", archivo), html, StandardCharsets.UTF_8);
        System.out.println(archivo);
    }

    private static String limpiar(String texto) {
        return texto.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
