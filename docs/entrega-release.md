# Release de entrega

## Contenido del proyecto

- `frontend/`: interfaz del sistema.
- `server-js/`: servidor Node.js y API.
- `java/`: clases Java y generador de actas.
- `database/`: scripts SQL para crear y actualizar MySQL.
- `docs/`: pruebas manuales y guia visual.

## Instalacion en otra computadora sin usar .bat

### 1. Instalar programas requeridos

La computadora debe tener:

- JDK 17.
- Node.js 20 o superior.
- MySQL Server 8.
- Git, si se descargara desde GitHub.

Verificar en PowerShell:

```powershell
java -version
javac -version
node -v
npm -v
```

Para MySQL, si `mysql` no se reconoce, usar la ruta completa:

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" --version
```

### 2. Descargar o copiar el proyecto

Opcion con Git:

```powershell
cd "C:\Users\TU_USUARIO\Desktop"
git clone https://github.com/Hdpjiax/ProyectoVehiculos.git
cd ProyectoVehiculos
```

Opcion sin Git:

Copiar la carpeta `ProyectoVehiculos` completa a la computadora destino.

### 3. Crear archivo de conexion

Crear el archivo:

```text
server-js\database.local.js
```

Con este contenido, ajustando la contrasena si es diferente:

```js
module.exports = {
  host: 'localhost',
  user: 'root',
  password: 'TU_CONTRASENA_MYSQL',
  database: 'agencia_autos',
  port: 3306
};
```

### 4. Crear o actualizar la base de datos

Desde la raiz del proyecto:

```powershell
cd "C:\RUTA\A\ProyectoVehiculos"
```

Si `mysql` esta en PATH:

```powershell
mysql -u root -p < database\migrations\001_crear_base.sql
mysql -u root -p < database\migrations\002_mejoras_sistema.sql
mysql -u root -p < database\seeds\001_datos_demo.sql
```

Si `mysql` no esta en PATH:

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p < database\migrations\001_crear_base.sql
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p < database\migrations\002_mejoras_sistema.sql
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p < database\seeds\001_datos_demo.sql
```

### 5. Compilar Java

```powershell
cd java
javac -encoding UTF-8 -d out Cliente.java Vehiculo.java GeneradorActa.java
cd ..
```

### 6. Instalar dependencias de Node

```powershell
cd server-js
npm install
```

### 7. Iniciar sistema

```powershell
npm start
```

Abrir en el navegador:

```text
http://localhost:8080
```

## Validacion rapida

1. Crear un cliente.
2. Registrar un vehiculo.
3. Buscar el vehiculo en catalogo.
4. Registrar una venta.
5. Abrir reportes.
6. Abrir o regenerar el acta.

## Problemas comunes

- `mysql no se reconoce`: usar la ruta completa de `mysql.exe`.
- `javac no se reconoce`: instalar JDK 17 o agregarlo al PATH.
- `Cannot find module mysql2`: ejecutar `npm install` dentro de `server-js`.
- `Falta database.local.js`: crear el archivo de conexion.
- El navegador no actualiza estilos: recargar con `Ctrl + F5`.
