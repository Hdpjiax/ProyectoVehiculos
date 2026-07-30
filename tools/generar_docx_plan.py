from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from html import escape

ROOT = Path(__file__).resolve().parents[1]
CAPTURAS = ROOT / "docs" / "capturas"
OUT = ROOT / "output" / "Proyecto_integrador_MotorCasa_v3.docx"


def svg_capture(path, title, subtitle, blocks, accent="#a51f2b"):
    width, height = 1280, 760
    rows = []
    y = 150
    for block in blocks:
        rows.append(f"""
        <rect x="300" y="{y}" width="900" height="{block.get('h', 86)}" rx="10" fill="{block.get('fill', '#ffffff')}" stroke="#d8ddd7"/>
        <text x="330" y="{y + 32}" font-size="24" font-weight="700" fill="#15171a">{escape(block['title'])}</text>
        <text x="330" y="{y + 62}" font-size="18" fill="#687079">{escape(block['text'])}</text>
        """)
        y += block.get("h", 86) + 22

    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">
      <defs>
        <linearGradient id="side" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stop-color="#111418"/>
          <stop offset="1" stop-color="#252a30"/>
        </linearGradient>
      </defs>
      <rect width="1280" height="760" fill="#f3f4f1"/>
      <rect x="0" y="0" width="260" height="760" fill="url(#side)"/>
      <rect x="24" y="28" width="48" height="48" rx="8" fill="{accent}"/>
      <text x="39" y="60" font-size="18" font-weight="800" fill="#fff">MC</text>
      <text x="88" y="58" font-size="24" font-weight="800" fill="#fff">MotorCasa</text>
      <text x="32" y="130" font-size="18" fill="#fff">Tablero</text>
      <text x="32" y="178" font-size="18" fill="#cfd5d8">Clientes</text>
      <text x="32" y="226" font-size="18" fill="#cfd5d8">Vehiculos</text>
      <text x="32" y="274" font-size="18" fill="#cfd5d8">Ventas</text>
      <text x="32" y="322" font-size="18" fill="#cfd5d8">Reportes</text>
      <text x="300" y="58" font-size="18" font-weight="800" fill="{accent}">AGENCIA DE AUTOS USADOS</text>
      <text x="300" y="104" font-size="42" font-weight="800" fill="#15171a">{escape(title)}</text>
      <text x="300" y="134" font-size="20" fill="#687079">{escape(subtitle)}</text>
      {''.join(rows)}
    </svg>"""
    path.write_text(svg, encoding="utf-8")


def make_captures():
    CAPTURAS.mkdir(parents=True, exist_ok=True)
    data = [
        ("01-tablero.svg", "Tablero principal", "Metricas, ingresos y catalogo de ofertas activas", [
            {"title": "Ofertas activas: 6", "text": "Clientes: 6 | Vendidos: 0 | Utilidad estimada visible"},
            {"title": "Catalogo", "text": "Filtros por marca, linea, modelo, precio, transmision y fecha"},
            {"title": "Tarjetas de vehiculos", "text": "Imagen, precio, descripcion y boton Ver detalle"},
        ]),
        ("02-clientes.svg", "Clientes", "CRUD completo y busqueda de personas registradas", [
            {"title": "Formulario de cliente", "text": "Nombre completo, domicilio, correo electronico y telefono"},
            {"title": "Busqueda", "text": "Filtro por nombre, correo, telefono o domicilio"},
            {"title": "Lista", "text": "Editar, eliminar y nuevo registro"},
        ]),
        ("03-vehiculos.svg", "Vehiculos", "Alta de vehiculos vinculados a vendedor", [
            {"title": "Registro", "text": "Motor, serie, modelo, marca, linea, color y precios"},
            {"title": "Datos tecnicos", "text": "Transmision, cilindros, nacionalidad, descripcion e imagen"},
            {"title": "Inventario", "text": "Protege edicion y eliminacion cuando el vehiculo esta vendido"},
        ]),
        ("04-detalle-vehiculo.svg", "Detalle de vehiculo", "Vista completa de cada unidad", [
            {"title": "Datos generales", "text": "Marca, linea, modelo, vendedor y estado"},
            {"title": "Datos tecnicos", "text": "Motor, serie, color, transmision, cilindros y nacionalidad"},
            {"title": "Valores", "text": "Precio de compra, precio de venta, descripcion y observaciones"},
        ]),
        ("05-venta.svg", "Registro de venta", "Compraventa con validacion y estatus de pago", [
            {"title": "Seleccion de vehiculo", "text": "Solo aparecen vehiculos publicados"},
            {"title": "Comprador", "text": "Se bloquea comprador igual al vendedor"},
            {"title": "Acta", "text": "Se confirma venta y se genera acta formal con Java"},
        ]),
        ("06-acta.svg", "Acta de compraventa", "Documento formal listo para imprimir", [
            {"title": "Membrete", "text": "Folio, lugar y fecha"},
            {"title": "Datos completos", "text": "Vehiculo, vendedor, comprador y monto en letra"},
            {"title": "Firmas", "text": "Declaraciones, conformidad y espacios de firma"},
        ]),
        ("07-reportes.svg", "Reportes", "Ofertas activas y vehiculos vendidos", [
            {"title": "Ofertas activas", "text": "Ordenadas por fecha de publicacion"},
            {"title": "Vehiculos vendidos", "text": "Incluyen fecha de venta, precio, pago y acta"},
            {"title": "Acciones", "text": "Exportar CSV, imprimir, cancelar venta y regenerar acta"},
        ]),
    ]
    for name, title, subtitle, blocks in data:
        svg_capture(CAPTURAS / name, title, subtitle, blocks)


def make_gantt():
    weeks = ["Semana 1", "Semana 2", "Semana 3", "Semana 4", "Semana 5"]
    tasks = [
        ("Analisis", "Requisitos y modelo inicial", 0, 1.0, "#334155"),
        ("Diseno", "Modelo ER, relacional e interfaz", 1.0, 1.0, "#a51f2b"),
        ("Desarrollo", "Base de datos y API", 2.0, 1.4, "#2563eb"),
        ("Desarrollo", "Frontend, CRUD y catalogo", 3.0, 0.8, "#2563eb"),
        ("Desarrollo", "Acta Java y reportes", 3.6, 0.7, "#2563eb"),
        ("Pruebas", "Validacion y correcciones", 4.0, 0.6, "#1e7a52"),
        ("Entrega", "Documentacion y capturas", 4.45, 0.55, "#c98d2b"),
    ]
    left, top, col, row = 260, 130, 170, 58
    grid = []
    for i, w in enumerate(weeks):
        x = left + i * col
        grid.append(f'<rect x="{x}" y="82" width="{col}" height="430" fill="{ "#f8fafc" if i % 2 == 0 else "#eef2f4" }" stroke="#d7dde2"/>')
        grid.append(f'<text x="{x + 22}" y="112" font-size="18" font-weight="700" fill="#111418">{w}</text>')
    bars = []
    for i, (stage, label, start, dur, color) in enumerate(tasks):
        y = top + i * row
        x = left + start * col
        width = dur * col
        bars.append(f'<text x="48" y="{y + 26}" font-size="16" font-weight="700" fill="#111418">{stage}</text>')
        bars.append(f'<text x="48" y="{y + 48}" font-size="13" fill="#64707a">{label}</text>')
        bars.append(f'<rect x="{x}" y="{y}" width="{width}" height="34" rx="8" fill="{color}"/>')
        bars.append(f'<text x="{x + 14}" y="{y + 23}" font-size="14" font-weight="700" fill="#ffffff">{label}</text>')
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="650" viewBox="0 0 1200 650">
      <rect width="1200" height="650" rx="18" fill="#ffffff"/>
      <rect x="0" y="0" width="1200" height="70" fill="#111418"/>
      <text x="42" y="44" font-size="28" font-weight="800" fill="#ffffff">Diagrama de Gantt - MotorCasa</text>
      <text x="850" y="44" font-size="16" fill="#cfd5d8">Duracion total: 5 semanas</text>
      <rect x="32" y="82" width="1110" height="430" rx="10" fill="#f8fafc" stroke="#d7dde2"/>
      {''.join(grid)}
      {''.join(bars)}
      <rect x="48" y="548" width="18" height="18" rx="4" fill="#334155"/><text x="76" y="562" font-size="15" fill="#334155">Analisis</text>
      <rect x="180" y="548" width="18" height="18" rx="4" fill="#a51f2b"/><text x="208" y="562" font-size="15" fill="#334155">Diseno</text>
      <rect x="300" y="548" width="18" height="18" rx="4" fill="#2563eb"/><text x="328" y="562" font-size="15" fill="#334155">Desarrollo</text>
      <rect x="455" y="548" width="18" height="18" rx="4" fill="#1e7a52"/><text x="483" y="562" font-size="15" fill="#334155">Pruebas</text>
      <rect x="585" y="548" width="18" height="18" rx="4" fill="#c98d2b"/><text x="613" y="562" font-size="15" fill="#334155">Entrega</text>
    </svg>"""
    (CAPTURAS / "00-gantt-profesional.svg").write_text(svg, encoding="utf-8")


def make_model_diagrams():
    er_svg = """<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="720" viewBox="0 0 1200 720">
      <rect width="1200" height="720" fill="#f6f7f4"/>
      <text x="48" y="58" font-size="30" font-weight="800" fill="#111418">Modelo Entidad-Relacion</text>
      <text x="48" y="88" font-size="18" fill="#66707a">Agencia de autos usados MotorCasa</text>
      <g font-family="Arial">
        <rect x="70" y="150" width="290" height="310" rx="10" fill="#ffffff" stroke="#111418" stroke-width="2"/>
        <rect x="70" y="150" width="290" height="54" rx="10" fill="#111418"/>
        <text x="92" y="185" font-size="22" font-weight="800" fill="#ffffff">CLIENTES</text>
        <text x="92" y="238" font-size="17" fill="#111418">PK id_cliente</text>
        <text x="92" y="272" font-size="17" fill="#111418">nombre_completo</text>
        <text x="92" y="306" font-size="17" fill="#111418">domicilio</text>
        <text x="92" y="340" font-size="17" fill="#111418">correo_electronico</text>
        <text x="92" y="374" font-size="17" fill="#111418">telefono</text>
        <text x="92" y="408" font-size="17" fill="#111418">creado_en</text>

        <rect x="455" y="125" width="330" height="370" rx="10" fill="#ffffff" stroke="#a51f2b" stroke-width="2"/>
        <rect x="455" y="125" width="330" height="54" rx="10" fill="#a51f2b"/>
        <text x="477" y="160" font-size="22" font-weight="800" fill="#ffffff">VEHICULOS</text>
        <text x="477" y="213" font-size="17" fill="#111418">PK id_vehiculo</text>
        <text x="477" y="247" font-size="17" fill="#111418">FK id_vendedor</text>
        <text x="477" y="281" font-size="17" fill="#111418">numero_motor, numero_serie</text>
        <text x="477" y="315" font-size="17" fill="#111418">marca, linea, modelo, color</text>
        <text x="477" y="349" font-size="17" fill="#111418">precio_compra, precio_venta</text>
        <text x="477" y="383" font-size="17" fill="#111418">transmision, cilindros</text>
        <text x="477" y="417" font-size="17" fill="#111418">nacionalidad, estado</text>
        <text x="477" y="451" font-size="17" fill="#111418">fecha_publicacion</text>

        <rect x="870" y="170" width="280" height="270" rx="10" fill="#ffffff" stroke="#2563eb" stroke-width="2"/>
        <rect x="870" y="170" width="280" height="54" rx="10" fill="#2563eb"/>
        <text x="892" y="205" font-size="22" font-weight="800" fill="#ffffff">VENTAS</text>
        <text x="892" y="258" font-size="17" fill="#111418">PK id_venta</text>
        <text x="892" y="292" font-size="17" fill="#111418">FK id_vehiculo</text>
        <text x="892" y="326" font-size="17" fill="#111418">FK id_comprador</text>
        <text x="892" y="360" font-size="17" fill="#111418">fecha_venta</text>
        <text x="892" y="394" font-size="17" fill="#111418">precio_final</text>

        <line x1="360" y1="260" x2="455" y2="260" stroke="#111418" stroke-width="3"/>
        <text x="378" y="244" font-size="16" fill="#111418">1 oferta 0..*</text>
        <line x1="785" y1="290" x2="870" y2="290" stroke="#111418" stroke-width="3"/>
        <text x="797" y="273" font-size="16" fill="#111418">1 venta 0..1</text>
        <path d="M215 460 C350 610 820 610 1010 440" fill="none" stroke="#111418" stroke-width="3"/>
        <text x="520" y="610" font-size="16" fill="#111418">cliente compra 0..* ventas</text>
      </g>
    </svg>"""
    class_svg = """<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="720" viewBox="0 0 1200 720">
      <rect width="1200" height="720" fill="#f6f7f4"/>
      <text x="48" y="58" font-size="30" font-weight="800" fill="#111418">Modelo de Clases</text>
      <text x="48" y="88" font-size="18" fill="#66707a">Programacion Orientada a Objetos en Java</text>
      <g font-family="Arial">
        <rect x="70" y="145" width="320" height="335" rx="10" fill="#ffffff" stroke="#111418" stroke-width="2"/>
        <rect x="70" y="145" width="320" height="54" rx="10" fill="#111418"/>
        <text x="92" y="180" font-size="22" font-weight="800" fill="#ffffff">Cliente</text>
        <text x="92" y="232" font-size="17" fill="#111418">- int idCliente</text>
        <text x="92" y="266" font-size="17" fill="#111418">- String nombreCompleto</text>
        <text x="92" y="300" font-size="17" fill="#111418">- String domicilio</text>
        <text x="92" y="334" font-size="17" fill="#111418">- String correoElectronico</text>
        <text x="92" y="368" font-size="17" fill="#111418">- String telefono</text>
        <line x1="90" y1="393" x2="370" y2="393" stroke="#d7dde2"/>
        <text x="92" y="426" font-size="17" fill="#111418">+ getters y setters</text>

        <rect x="455" y="125" width="345" height="390" rx="10" fill="#ffffff" stroke="#a51f2b" stroke-width="2"/>
        <rect x="455" y="125" width="345" height="54" rx="10" fill="#a51f2b"/>
        <text x="477" y="160" font-size="22" font-weight="800" fill="#ffffff">Vehiculo</text>
        <text x="477" y="213" font-size="17" fill="#111418">- int idVehiculo</text>
        <text x="477" y="247" font-size="17" fill="#111418">- int idVendedor</text>
        <text x="477" y="281" font-size="17" fill="#111418">- String marca, linea, color</text>
        <text x="477" y="315" font-size="17" fill="#111418">- int modelo, cilindros</text>
        <text x="477" y="349" font-size="17" fill="#111418">- BigDecimal precioVenta</text>
        <text x="477" y="383" font-size="17" fill="#111418">- String estado</text>
        <line x1="475" y1="408" x2="775" y2="408" stroke="#d7dde2"/>
        <text x="477" y="441" font-size="17" fill="#111418">+ getters y setters</text>

        <rect x="865" y="185" width="285" height="250" rx="10" fill="#ffffff" stroke="#2563eb" stroke-width="2"/>
        <rect x="865" y="185" width="285" height="54" rx="10" fill="#2563eb"/>
        <text x="887" y="220" font-size="22" font-weight="800" fill="#ffffff">GeneradorActa</text>
        <text x="887" y="273" font-size="17" fill="#111418">+ main(String[]) void</text>
        <text x="887" y="307" font-size="17" fill="#111418">+ limpiar(String)</text>
        <text x="887" y="341" font-size="17" fill="#111418">+ montoEnLetra()</text>
        <text x="887" y="375" font-size="17" fill="#111418">+ construirHTML()</text>

        <line x1="390" y1="300" x2="455" y2="300" stroke="#111418" stroke-width="3"/>
        <text x="400" y="282" font-size="16" fill="#111418">1 a 0..*</text>
        <line x1="800" y1="310" x2="865" y2="310" stroke="#111418" stroke-width="3"/>
        <text x="808" y="292" font-size="16" fill="#111418">usa datos</text>
      </g>
    </svg>"""
    (CAPTURAS / "08-er-modelo.svg").write_text(er_svg, encoding="utf-8")
    (CAPTURAS / "09-clases.svg").write_text(class_svg, encoding="utf-8")


def p(text="", style=None):
    ppr = f"<w:pPr><w:pStyle w:val=\"{style}\"/></w:pPr>" if style else ""
    return f"<w:p>{ppr}<w:r><w:t xml:space=\"preserve\">{escape(text)}</w:t></w:r></w:p>"


def heading(text, level=1):
    return p(text, f"Heading{level}")


def table(headers, rows):
    def cell(text, bold=False):
        b = "<w:b/>" if bold else ""
        color = "<w:color w:val=\"FFFFFF\"/>" if bold else ""
        fill = "111418" if bold else "FFFFFF"
        return f"<w:tc><w:tcPr><w:tcW w:w=\"2400\" w:type=\"dxa\"/><w:shd w:fill=\"{fill}\"/><w:tcMar><w:top w:w=\"120\" w:type=\"dxa\"/><w:left w:w=\"140\" w:type=\"dxa\"/><w:bottom w:w=\"120\" w:type=\"dxa\"/><w:right w:w=\"140\" w:type=\"dxa\"/></w:tcMar></w:tcPr><w:p><w:pPr><w:spacing w:after=\"40\"/></w:pPr><w:r><w:rPr>{b}{color}<w:sz w:val=\"19\"/></w:rPr><w:t>{escape(str(text))}</w:t></w:r></w:p></w:tc>"
    def row_xml(values, header=False, shaded=False):
        cells = "".join(cell(v, header) for v in values)
        if shaded and not header:
            cells = cells.replace('w:fill="FFFFFF"', 'w:fill="F5F7F8"')
        return "<w:tr>" + cells + "</w:tr>"
    out = ["<w:tbl><w:tblPr><w:tblW w:w=\"9360\" w:type=\"dxa\"/><w:tblLook w:firstRow=\"1\" w:noHBand=\"0\"/><w:tblBorders><w:top w:val=\"single\" w:sz=\"6\" w:color=\"111418\"/><w:left w:val=\"single\" w:sz=\"4\" w:color=\"BFC5C8\"/><w:bottom w:val=\"single\" w:sz=\"4\" w:color=\"BFC5C8\"/><w:right w:val=\"single\" w:sz=\"4\" w:color=\"BFC5C8\"/><w:insideH w:val=\"single\" w:sz=\"4\" w:color=\"D8DDDE\"/><w:insideV w:val=\"single\" w:sz=\"4\" w:color=\"D8DDDE\"/></w:tblBorders></w:tblPr>"]
    out.append(row_xml(headers, True))
    for idx, row in enumerate(rows):
        out.append(row_xml(row, shaded=idx % 2 == 1))
    out.append("</w:tbl>")
    return "".join(out)


def image(rid, cx=5486400, cy=3254400):
    return f"""
    <w:p><w:pPr><w:spacing w:before="160" w:after="160"/></w:pPr><w:r><w:drawing>
      <wp:inline xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" distT="0" distB="0" distL="0" distR="0">
        <wp:extent cx="{cx}" cy="{cy}"/>
        <wp:docPr id="{rid}" name="Captura {rid}"/>
        <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
          <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
            <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
              <pic:nvPicPr><pic:cNvPr id="{rid}" name="captura.svg"/><pic:cNvPicPr/></pic:nvPicPr>
              <pic:blipFill><a:blip r:embed="rId{rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>
              <pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="{cx}" cy="{cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>
            </pic:pic>
          </a:graphicData>
        </a:graphic>
      </wp:inline>
    </w:drawing></w:r></w:p>
    """


def make_docx():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    body = []
    body += [p("MotorCasa", "Title"), p("Proyecto integrador - Sistema de compra-venta de vehiculos usados", "Subtitle")]
    body += [heading("Base de datos y Programacion Orientada a Objetos")]
    body += [p("Esta seccion integra los elementos que se evaluan durante la presentacion: funcionamiento de la aplicacion, interfaz grafica alineada al giro de agencia de autos, validacion del CRUD conectado a MySQL y uso de clases Java para generar el acta de compraventa.")]
    body += [heading("Planteamiento del problema", 2)]
    body += [p("Una agencia de autos usados necesita centralizar el registro de personas que ofertan o compran vehiculos, publicar los autos disponibles y conservar evidencia formal de cada venta. Sin un sistema, la busqueda de ofertas es lenta, se puede vender dos veces el mismo vehiculo y el acta de compraventa se elabora de forma manual.")]
    body += [heading("Requerimientos funcionales", 2)]
    body += [table(["No.", "Requerimiento"], [
        ["1", "Registrar, consultar, editar y eliminar clientes."],
        ["2", "Registrar, consultar, editar y eliminar vehiculos vinculados a un vendedor."],
        ["3", "Buscar vehiculos por marca, linea, modelo, color, precio, transmision, cilindros, nacionalidad y fecha."],
        ["4", "Registrar una venta vinculando vehiculo, comprador, vendedor, precio final y estatus de pago."],
        ["5", "Cambiar el estado del vehiculo a vendido al concluir una venta."],
        ["6", "Listar ofertas activas de la mas reciente a la mas antigua."],
        ["7", "Listar vehiculos vendidos con fecha, comprador, vendedor, pago y ruta del acta."],
        ["8", "Generar, guardar y regenerar un acta imprimible de compraventa mediante Java."],
    ])]
    body += [heading("Requerimientos no funcionales", 2)]
    body += [table(["Categoria", "Requerimiento"], [
        ["Usabilidad", "Interfaz responsiva, organizada por pestanas y adecuada al giro de agencia automotriz."],
        ["Validacion", "Campos obligatorios, precios positivos, comprador distinto del vendedor y bloqueo de vehiculos vendidos."],
        ["Persistencia", "Base de datos MySQL con llaves primarias, foraneas, restricciones e integridad referencial."],
        ["Seguridad", "Consultas parametrizadas desde Node.js para reducir errores de ejecucion SQL."],
        ["Mantenibilidad", "Codigo separado en frontend, backend, SQL y clases Java."],
        ["Portabilidad", "Instrucciones manuales para instalar el sistema en otra computadora sin depender de archivos .bat."],
    ])]
    body += [heading("Modelo Entidad-Relacion", 2)]
    body += [image(1, cx=6400800, cy=3840480)]
    body += [p("El modelo relaciona clientes con vehiculos publicados y ventas. Un cliente puede ofertar varios vehiculos y tambien puede participar como comprador en varias ventas. Cada vehiculo se vende una sola vez.")]
    body += [heading("Modelo Relacional", 2)]
    body += [table(["Tabla", "Campos principales", "Relaciones"], [
        ["clientes", "id_cliente, nombre_completo, domicilio, correo_electronico, telefono, creado_en", "Llave primaria id_cliente."],
        ["vehiculos", "id_vehiculo, id_vendedor, numero_motor, numero_serie, modelo, marca, linea, color, precio_compra, precio_venta, estado", "id_vendedor referencia clientes(id_cliente)."],
        ["ventas", "id_venta, id_vehiculo, id_comprador, fecha_venta, precio_final, estatus_pago, ruta_acta", "id_vehiculo referencia vehiculos; id_comprador referencia clientes."],
    ])]
    body += [heading("Modelo de Clases", 2)]
    body += [image(2, cx=6400800, cy=3840480)]
    body += [p("Las clases Cliente y Vehiculo representan los datos principales del dominio. La clase GeneradorActa recibe los datos de una venta desde Node.js y construye el documento formal de compraventa.")]
    body += [heading("Consultas SQL de LDD", 2)]
    body += [p("El Lenguaje de Definicion de Datos crea la base agencia_autos, sus tablas, llaves primarias, llaves foraneas, restricciones unicas y campos necesarios para ventas y actas.")]
    body += [table(["Objeto", "SQL aplicado", "Proposito"], [
        ["Base de datos", "CREATE DATABASE IF NOT EXISTS agencia_autos;", "Crear el esquema principal del sistema."],
        ["clientes", "CREATE TABLE clientes (... PRIMARY KEY id_cliente, UNIQUE correo_electronico);", "Guardar compradores y vendedores."],
        ["vehiculos", "CREATE TABLE vehiculos (... FOREIGN KEY id_vendedor, UNIQUE numero_motor, UNIQUE numero_serie);", "Guardar inventario y ofertas activas."],
        ["ventas", "CREATE TABLE ventas (... UNIQUE id_vehiculo, FOREIGN KEY id_comprador);", "Registrar operaciones de compraventa sin duplicar vehiculos vendidos."],
        ["Mejoras", "ALTER TABLE ventas ADD estatus_pago, ADD ruta_acta;", "Agregar control de pago y evidencia del acta."],
    ])]
    body += [heading("Consultas SQL de LMD utilizadas: CRUD", 2)]
    body += [p("El Lenguaje de Manipulacion de Datos se utiliza desde la aplicacion para crear, consultar, actualizar y eliminar registros, ademas de obtener reportes.")]
    body += [table(["Operacion", "Consulta utilizada", "Uso en el sistema"], [
        ["CREATE", "INSERT INTO clientes (...) VALUES (...); INSERT INTO vehiculos (...) VALUES (...);", "Alta de clientes y vehiculos."],
        ["READ", "SELECT v.*, c.nombre_completo AS vendedor FROM vehiculos v JOIN clientes c ... WHERE v.estado = 'PUBLICADO';", "Busqueda del catalogo de ofertas activas."],
        ["UPDATE", "UPDATE vehiculos SET precio_venta = ?, observaciones = ? WHERE id_vehiculo = ?;", "Edicion de vehiculos y cambios de estado."],
        ["DELETE", "DELETE FROM vehiculos WHERE id_vehiculo = ?;", "Eliminacion controlada cuando no esta vendido."],
        ["Reportes", "SELECT ... FROM ventas JOIN vehiculos JOIN clientes ... ORDER BY fecha_venta DESC;", "Listado de vehiculos vendidos."],
    ])]
    body += [heading("Capturas de pantalla del sistema", 2)]
    body += [p("Las capturas integradas al final del documento muestran tablero, clientes, vehiculos, detalle, venta, acta y reportes.")]
    body += [heading("1. Nombre y objetivo del proyecto")]
    body += [p("Nombre: MotorCasa - Sistema de compra-venta de vehiculos usados.")]
    body += [p("Objetivo general: desarrollar un sistema web para una agencia de autos usados que permita registrar clientes, publicar vehiculos, consultar ofertas activas, registrar ventas, generar actas de compraventa y obtener reportes administrativos.")]
    body += [heading("2. Diagrama tiempo/esfuerzo")]
    body += [table(["Etapa", "Actividades", "Semana", "Esfuerzo"], [
        ["Analisis", "Requisitos, entidades y reglas de negocio", "1", "12 h"],
        ["Diseno", "Modelo ER, relacional, clases Java y pantallas", "2", "16 h"],
        ["Desarrollo", "Base de datos, API, frontend, CRUD, ventas y actas", "3-4", "38 h"],
        ["Pruebas", "CRUD, busquedas, reportes, actas y correcciones", "5", "14 h"],
        ["Entrega", "Documentacion, evidencias, capturas y release", "5", "10 h"],
    ])]
    body += [heading("3. Diagrama de Gantt")]
    body += [image(3, cx=6400800, cy=3467100)]
    body += [table(["Actividad", "Inicio", "Duracion", "Dependencia"], [
        ["Requisitos del sistema", "03/08/2026", "2 dias", "Inicio"],
        ["Modelo de datos inicial", "05/08/2026", "3 dias", "Requisitos"],
        ["Modelo ER y relacional", "10/08/2026", "2 dias", "Analisis"],
        ["Diseno de interfaz y flujos", "12/08/2026", "3 dias", "Modelo"],
        ["Base de datos MySQL", "17/08/2026", "3 dias", "Diseno"],
        ["API Node.js", "20/08/2026", "4 dias", "Base de datos"],
        ["Frontend CRUD y catalogo", "24/08/2026", "4 dias", "API"],
        ["Acta Java y reportes", "28/08/2026", "3 dias", "Frontend"],
        ["Pruebas y documentacion", "31/08/2026", "5 dias", "Sistema completo"],
    ])]
    body += [heading("4. Determinacion de costos y gastos")]
    body += [table(["Concepto", "Clasificacion", "Calculo", "Monto"], [
        ["Analisis y documentacion", "Costo", "12 h x $100", "$1,200.00"],
        ["Diseno de base e interfaz", "Costo", "16 h x $100", "$1,600.00"],
        ["Desarrollo backend/frontend", "Costo", "38 h x $100", "$3,800.00"],
        ["Pruebas y correcciones", "Costo", "14 h x $100", "$1,400.00"],
        ["Documentacion y entrega", "Costo", "10 h x $100", "$1,000.00"],
        ["Internet y energia", "Gasto", "Estimado", "$450.00"],
        ["Equipo y depreciacion", "Gasto", "Estimado", "$600.00"],
        ["Material de entrega", "Gasto", "Estimado", "$300.00"],
        ["Contingencia por riesgos", "Gasto", "8 riesgos", "$2,050.00"],
        ["Costo total CT", "", "", "$9,000.00"],
        ["Gasto total GT", "", "", "$3,400.00"],
    ])]
    body += [heading("5. Calculo del precio de venta")]
    body += [p("Formula: PV = CT + GT + utilidad (25%) + impuestos (16%).")]
    body += [table(["Concepto", "Monto"], [
        ["Costo total (CT)", "$9,000.00"],
        ["Gasto total (GT)", "$3,400.00"],
        ["Subtotal CT + GT", "$12,400.00"],
        ["Utilidad 25%", "$3,100.00"],
        ["Base antes de impuestos", "$15,500.00"],
        ["Impuestos 16%", "$2,480.00"],
        ["Precio de venta (PV)", "$17,980.00 MXN"],
    ])]
    body += [heading("6. Riesgos del proyecto")]
    body += [table(["Etapa", "Riesgo", "Impacto", "Valor"], [
        ["Analisis", "Requisitos incompletos", "Rehacer pantallas o campos", "$250.00"],
        ["Analisis", "Cambios tardios en reglas", "Ajustar base y API", "$250.00"],
        ["Diseno", "Modelo relacional incorrecto", "Fallas en consultas", "$300.00"],
        ["Diseno", "Interfaz confusa", "Mayor tiempo de correccion", "$200.00"],
        ["Desarrollo", "Error de conexion MySQL", "Sistema no inicia", "$300.00"],
        ["Desarrollo", "Fallos en venta o acta", "Perdida de evidencia", "$350.00"],
        ["Pruebas", "Datos duplicados", "Errores CRUD", "$200.00"],
        ["Entrega", "Problemas en otra PC", "Retraso en presentacion", "$200.00"],
    ])]
    body += [heading("7. Plan de accion para cada riesgo")]
    body += [table(["Riesgo", "Plan de accion"], [
        ["Requisitos incompletos", "Comparar el sistema contra el documento de requerimientos y checklist."],
        ["Cambios tardios", "Usar migraciones SQL y separar frontend, backend y Java."],
        ["Modelo incorrecto", "Revisar llaves primarias, foraneas y restricciones."],
        ["Interfaz confusa", "Separar el sistema por pestanas y flujos."],
        ["Conexion MySQL", "Crear database.local.js y probar antes de la entrega."],
        ["Fallos en venta o acta", "Guardar venta primero y permitir regenerar acta."],
        ["Datos duplicados", "Usar campos unicos y validaciones."],
        ["Problemas en otra PC", "Documentar instalacion manual sin .bat."],
    ])]
    body += [heading("Capturas de pantalla del sistema")]
    names = [
        ("01-tablero.svg", "Tablero principal"),
        ("02-clientes.svg", "Clientes"),
        ("03-vehiculos.svg", "Vehiculos"),
        ("04-detalle-vehiculo.svg", "Detalle de vehiculo"),
        ("05-venta.svg", "Registro de venta"),
        ("06-acta.svg", "Acta de compraventa"),
        ("07-reportes.svg", "Reportes"),
    ]
    rid = 4
    for filename, caption in names:
        body += [heading(caption, 2), image(rid)]
        rid += 1
    document_xml = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
      xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
      xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
      <w:body>{''.join(body)}
        <w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080"/></w:sectPr>
      </w:body>
    </w:document>"""
    rels = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">']
    rels.append('<Relationship Id="rIdDoc" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>')
    rels.append('</Relationships>')
    doc_rels = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">']
    doc_rels.append('<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/08-er-modelo.svg"/>')
    doc_rels.append('<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/09-clases.svg"/>')
    doc_rels.append('<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/00-gantt-profesional.svg"/>')
    for i, (filename, _) in enumerate(names, 4):
        doc_rels.append(f'<Relationship Id="rId{i}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/{filename}"/>')
    doc_rels.append('</Relationships>')
    styles = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="22"/></w:rPr><w:pPr><w:spacing w:after="120"/></w:pPr></w:style>
      <w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:b/><w:color w:val="A51F2B"/><w:sz w:val="44"/></w:rPr><w:pPr><w:spacing w:after="160"/></w:pPr></w:style>
      <w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:color w:val="555555"/><w:sz w:val="24"/></w:rPr><w:pPr><w:spacing w:after="240"/></w:pPr></w:style>
      <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:b/><w:color w:val="111418"/><w:sz w:val="30"/></w:rPr><w:pPr><w:spacing w:before="260" w:after="120"/></w:pPr></w:style>
      <w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:b/><w:color w:val="A51F2B"/><w:sz w:val="24"/></w:rPr><w:pPr><w:spacing w:before="180" w:after="100"/></w:pPr></w:style>
    </w:styles>"""
    content_types = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">']
    content_types.append('<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>')
    content_types.append('<Default Extension="xml" ContentType="application/xml"/>')
    content_types.append('<Default Extension="svg" ContentType="image/svg+xml"/>')
    content_types.append('<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>')
    content_types.append('<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>')
    content_types.append('</Types>')
    with ZipFile(OUT, "w", ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", "".join(content_types))
        z.writestr("_rels/.rels", "".join(rels))
        z.writestr("word/document.xml", document_xml)
        z.writestr("word/styles.xml", styles)
        z.writestr("word/_rels/document.xml.rels", "".join(doc_rels))
        z.write(CAPTURAS / "08-er-modelo.svg", "word/media/08-er-modelo.svg")
        z.write(CAPTURAS / "09-clases.svg", "word/media/09-clases.svg")
        z.write(CAPTURAS / "00-gantt-profesional.svg", "word/media/00-gantt-profesional.svg")
        for filename, _ in names:
            z.write(CAPTURAS / filename, f"word/media/{filename}")


if __name__ == "__main__":
    make_captures()
    make_gantt()
    make_model_diagrams()
    make_docx()
    print(OUT)
