package mx.edu.prepa.autos;

public class Cliente {
    private int idCliente;
    private String nombreCompleto;
    private String domicilio;
    private String correoElectronico;
    private String telefono;

    public Cliente() { }
    public Cliente(int idCliente, String nombreCompleto, String domicilio, String correoElectronico, String telefono) {
        this.idCliente = idCliente; this.nombreCompleto = nombreCompleto; this.domicilio = domicilio;
        this.correoElectronico = correoElectronico; this.telefono = telefono;
    }
    public int getIdCliente() { return idCliente; } public void setIdCliente(int idCliente) { this.idCliente = idCliente; }
    public String getNombreCompleto() { return nombreCompleto; } public void setNombreCompleto(String nombreCompleto) { this.nombreCompleto = nombreCompleto; }
    public String getDomicilio() { return domicilio; } public void setDomicilio(String domicilio) { this.domicilio = domicilio; }
    public String getCorreoElectronico() { return correoElectronico; } public void setCorreoElectronico(String correoElectronico) { this.correoElectronico = correoElectronico; }
    public String getTelefono() { return telefono; } public void setTelefono(String telefono) { this.telefono = telefono; }
}
