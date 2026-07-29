package mx.edu.prepa.autos.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class Venta {
    private int idVenta;
    private int idVehiculo;
    private int idComprador;
    private LocalDateTime fechaVenta;
    private BigDecimal precioFinal;

    public Venta() { }
    public Venta(int idVenta, int idVehiculo, int idComprador, LocalDateTime fechaVenta, BigDecimal precioFinal) {
        this.idVenta = idVenta;
        this.idVehiculo = idVehiculo;
        this.idComprador = idComprador;
        this.fechaVenta = fechaVenta;
        this.precioFinal = precioFinal;
    }
    public int getIdVenta() { return idVenta; }
    public void setIdVenta(int idVenta) { this.idVenta = idVenta; }
    public int getIdVehiculo() { return idVehiculo; }
    public void setIdVehiculo(int idVehiculo) { this.idVehiculo = idVehiculo; }
    public int getIdComprador() { return idComprador; }
    public void setIdComprador(int idComprador) { this.idComprador = idComprador; }
    public LocalDateTime getFechaVenta() { return fechaVenta; }
    public void setFechaVenta(LocalDateTime fechaVenta) { this.fechaVenta = fechaVenta; }
    public BigDecimal getPrecioFinal() { return precioFinal; }
    public void setPrecioFinal(BigDecimal precioFinal) { this.precioFinal = precioFinal; }
}
