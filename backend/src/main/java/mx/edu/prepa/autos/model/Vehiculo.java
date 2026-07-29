package mx.edu.prepa.autos.model;

import java.math.BigDecimal;

public class Vehiculo {
    private int idVehiculo, idVendedor, modelo, numeroCilindros;
    private String numeroMotor, numeroSerie, marca, linea, color, transmision, nacionalidad, descripcion, observaciones;
    private BigDecimal precioCompra, precioVenta;
    public Vehiculo() { }
    public Vehiculo(int idVehiculo, int idVendedor, String numeroMotor, String numeroSerie, int modelo, String marca, String linea, String color, BigDecimal precioCompra, BigDecimal precioVenta, String transmision, int numeroCilindros, String nacionalidad, String descripcion, String observaciones) {
        this.idVehiculo=idVehiculo; this.idVendedor=idVendedor; this.numeroMotor=numeroMotor; this.numeroSerie=numeroSerie; this.modelo=modelo; this.marca=marca; this.linea=linea; this.color=color; this.precioCompra=precioCompra; this.precioVenta=precioVenta; this.transmision=transmision; this.numeroCilindros=numeroCilindros; this.nacionalidad=nacionalidad; this.descripcion=descripcion; this.observaciones=observaciones;
    }
    public int getIdVehiculo() { return idVehiculo; } public void setIdVehiculo(int v) { idVehiculo=v; }
    public int getIdVendedor() { return idVendedor; } public void setIdVendedor(int v) { idVendedor=v; }
    public String getNumeroMotor() { return numeroMotor; } public void setNumeroMotor(String v) { numeroMotor=v; }
    public String getNumeroSerie() { return numeroSerie; } public void setNumeroSerie(String v) { numeroSerie=v; }
    public int getModelo() { return modelo; } public void setModelo(int v) { modelo=v; }
    public String getMarca() { return marca; } public void setMarca(String v) { marca=v; }
    public String getLinea() { return linea; } public void setLinea(String v) { linea=v; }
    public String getColor() { return color; } public void setColor(String v) { color=v; }
    public BigDecimal getPrecioCompra() { return precioCompra; } public void setPrecioCompra(BigDecimal v) { precioCompra=v; }
    public BigDecimal getPrecioVenta() { return precioVenta; } public void setPrecioVenta(BigDecimal v) { precioVenta=v; }
    public String getTransmision() { return transmision; } public void setTransmision(String v) { transmision=v; }
    public int getNumeroCilindros() { return numeroCilindros; } public void setNumeroCilindros(int v) { numeroCilindros=v; }
    public String getNacionalidad() { return nacionalidad; } public void setNacionalidad(String v) { nacionalidad=v; }
    public String getDescripcion() { return descripcion; } public void setDescripcion(String v) { descripcion=v; }
    public String getObservaciones() { return observaciones; } public void setObservaciones(String v) { observaciones=v; }
}
