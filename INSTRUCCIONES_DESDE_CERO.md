# Instrucciones desde cero para ejecutar ADDJ MOTORS en otra computadora

Este documento explica como instalar y ejecutar el proyecto `ProyectoVehiculos` en una computadora nueva, sin usar archivos `.bat`.

## 1. Programas necesarios

Instalar estos programas antes de abrir el proyecto:

- JDK 17
- Node.js 20 o superior
- MySQL Server 8
- Git, solo si se descargara el proyecto desde GitHub
- Un navegador, por ejemplo Chrome o Edge

## 2. Verificar instalaciones

Abrir PowerShell y ejecutar:

```powershell
java -version
javac -version
node -v
npm -v
```

Debe aparecer una version para cada comando.

Para revisar MySQL:

```powershell
mysql --version
```

Si aparece el error `mysql no se reconoce`, probar con la ruta completa:

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" --version
```

Si esa ruta funciona, usarla cada vez que este documento diga `mysql`.

## 3. Descargar o copiar el proyecto

### Opcion A: descargar desde GitHub

En PowerShell:

```powershell
cd "$env:USERPROFILE\Desktop"
git clone https://github.com/Hdpjiax/ProyectoVehiculos.git
cd ProyectoVehiculos
```

### Opcion B: copiar carpeta

Copiar completa la carpeta `ProyectoVehiculos` a la computadora nueva.

Ejemplo de ubicacion:

```text
C:\Users\TU_USUARIO\Desktop\ProyectoVehiculos
```

Despues abrir PowerShell en esa carpeta:

```powershell
cd "$env:USERPROFILE\Desktop\ProyectoVehiculos"
```

## 4. Configurar la conexion a MySQL

Entrar a la carpeta del servidor:

```powershell
cd server-js
```

Copiar el archivo de ejemplo:

```powershell
Copy-Item database.config.example.js database.local.js
```

Abrir `database.local.js` con Bloc de notas:

```powershell
notepad database.local.js
```

Debe quedar parecido a esto:

```js
module.exports = {
  host: 'localhost',
  user: 'root',
  password: 'TU_CONTRASENA_MYSQL',
  database: 'agencia_autos',
  port: 3306
};
```

Cambiar solamente `TU_CONTRASENA_MYSQL` por la contrasena real de MySQL.

Regresar a la raiz del proyecto:

```powershell
cd ..
```

## 5. Crear la base de datos

Importante: en Windows PowerShell el operador `<` puede fallar. Por eso se usa `cmd /c`.

Desde la raiz del proyecto:

```powershell
cd "$env:USERPROFILE\Desktop\ProyectoVehiculos"
```

Ejecutar la migracion principal:

```powershell
cmd /c "mysql -u root -p < database\migrations\001_crear_base.sql"
```

Escribir la contrasena de MySQL cuando la pida.

Ejecutar la migracion de mejoras:

```powershell
cmd /c "mysql -u root -p < database\migrations\002_mejoras_sistema.sql"
```

Escribir otra vez la contrasena de MySQL.

Cargar datos demo:

```powershell
cmd /c "mysql -u root -p < database\seeds\001_datos_demo.sql"
```

Escribir otra vez la contrasena de MySQL.

### Si `mysql` no se reconoce

Usar la ruta completa de `mysql.exe`:

```powershell
cmd /c "`"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe`" -u root -p < database\migrations\001_crear_base.sql"
cmd /c "`"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe`" -u root -p < database\migrations\002_mejoras_sistema.sql"
cmd /c "`"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe`" -u root -p < database\seeds\001_datos_demo.sql"
```

### Alternativa con MySQL Workbench

Si no se quiere usar consola:

1. Abrir MySQL Workbench.
2. Entrar a la conexion local de MySQL.
3. Abrir el archivo `database\migrations\001_crear_base.sql`.
4. Ejecutarlo con el boton del rayo.
5. Abrir `database\migrations\002_mejoras_sistema.sql`.
6. Ejecutarlo con el boton del rayo.
7. Abrir `database\seeds\001_datos_demo.sql`.
8. Ejecutarlo con el boton del rayo.

## 6. Compilar Java

Desde la raiz del proyecto:

```powershell
cd java
javac -encoding UTF-8 -d out Cliente.java Vehiculo.java GeneradorActa.java
cd ..
```

Verificar que se creo la carpeta:

```powershell
dir java\out
```

Debe mostrar archivos `.class`.

## 7. Instalar dependencias de Node.js

Desde la raiz del proyecto:

```powershell
cd server-js
npm install
```

Esperar a que termine sin errores.

## 8. Iniciar el sistema

Desde la carpeta `server-js`:

```powershell
npm start
```

Debe aparecer un mensaje indicando que el servidor esta iniciado.

Abrir en el navegador:

```text
http://localhost:8080
```

No cerrar la ventana de PowerShell mientras se use el sistema.

## 9. Probar que todo funciona

Hacer estas pruebas en orden:

1. Entrar a `http://localhost:8080`.
2. Revisar que carguen los estilos y las pestanas.
3. Entrar a la pestana `Clientes`.
4. Crear un cliente nuevo.
5. Editar el cliente.
6. Buscar el cliente.
7. Entrar a la pestana `Vehiculos`.
8. Registrar un vehiculo y seleccionar un vendedor.
9. Revisar que el vehiculo aparezca en el catalogo de ofertas activas.
10. Usar la busqueda del catalogo por marca, linea, modelo o color.
11. Entrar a la pestana `Ventas`.
12. Registrar una venta con comprador distinto al vendedor.
13. Confirmar que el vehiculo ya no aparezca como oferta activa.
14. Entrar a `Reportes`.
15. Revisar que la venta aparezca en vehiculos vendidos.
16. Abrir o regenerar el acta de compraventa.

## 10. Problemas comunes

### `mysql no se reconoce`

MySQL no esta agregado al PATH.

Solucion: usar la ruta completa:

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" --version
```

Y para importar SQL:

```powershell
cmd /c "`"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe`" -u root -p < database\migrations\001_crear_base.sql"
```

### PowerShell dice que `<` esta reservado

Eso pasa porque Windows PowerShell no acepta esa redireccion.

Usar:

```powershell
cmd /c "mysql -u root -p < database\migrations\001_crear_base.sql"
```

### `javac no se reconoce`

No esta instalado el JDK o no esta en el PATH.

Solucion:

1. Instalar JDK 17.
2. Cerrar PowerShell.
3. Abrir PowerShell otra vez.
4. Ejecutar:

```powershell
javac -version
```

### `Cannot find module mysql2`

Faltan las dependencias de Node.

Solucion:

```powershell
cd server-js
npm install
```

### `Falta database.local.js`

No se creo el archivo privado de conexion.

Solucion:

```powershell
cd server-js
Copy-Item database.config.example.js database.local.js
notepad database.local.js
```

Cambiar la contrasena de MySQL y guardar.

### No cargan los estilos

Probar:

```text
Ctrl + F5
```

Tambien revisar que se este abriendo:

```text
http://localhost:8080
```

No abrir directamente el archivo `frontend\index.html`.

### El acta no se genera

Revisar que Java este compilado:

```powershell
dir java\out
```

Si no hay archivos `.class`, ejecutar:

```powershell
cd java
javac -encoding UTF-8 -d out Cliente.java Vehiculo.java GeneradorActa.java
cd ..
```

### Error de contrasena de MySQL

Abrir:

```text
server-js\database.local.js
```

Verificar que `password` tenga la contrasena correcta de MySQL.

## 11. Comandos resumidos

Estos son los comandos principales, suponiendo que el proyecto esta en el Escritorio:

```powershell
cd "$env:USERPROFILE\Desktop\ProyectoVehiculos"

cd server-js
Copy-Item database.config.example.js database.local.js
notepad database.local.js
cd ..

cmd /c "mysql -u root -p < database\migrations\001_crear_base.sql"
cmd /c "mysql -u root -p < database\migrations\002_mejoras_sistema.sql"
cmd /c "mysql -u root -p < database\seeds\001_datos_demo.sql"

cd java
javac -encoding UTF-8 -d out Cliente.java Vehiculo.java GeneradorActa.java
cd ..

cd server-js
npm install
npm start
```

Despues abrir:

```text
http://localhost:8080
```
