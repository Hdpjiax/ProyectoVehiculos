package mx.edu.prepa.autos;

public class Vehiculo {
    private int idVehiculo;
    private String numeroSerie;
    private int modelo;
    private String marca;
    private String linea;
    private String color;

    public Vehiculo() { }
    public Vehiculo(int idVehiculo, String numeroSerie, int modelo, String marca, String linea, String color) {
        this.idVehiculo=idVehiculo; this.numeroSerie=numeroSerie; this.modelo=modelo; this.marca=marca; this.linea=linea; this.color=color;
    }
    public int getIdVehiculo() { return idVehiculo; } public void setIdVehiculo(int idVehiculo) { this.idVehiculo=idVehiculo; }
    public String getNumeroSerie() { return numeroSerie; } public void setNumeroSerie(String numeroSerie) { this.numeroSerie=numeroSerie; }
    public int getModelo() { return modelo; } public void setModelo(int modelo) { this.modelo=modelo; }
    public String getMarca() { return marca; } public void setMarca(String marca) { this.marca=marca; }
    public String getLinea() { return linea; } public void setLinea(String linea) { this.linea=linea; }
    public String getColor() { return color; } public void setColor(String color) { this.color=color; }
}
