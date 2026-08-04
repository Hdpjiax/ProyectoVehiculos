#!/usr/bin/env bash
set -e

# Change to script directory
cd "$(dirname "$0")"

# 1. Dependency checks
echo "Buscando dependencias del sistema..."

detect_and_install() {
  local PKG=$1
  echo "[WARNING] Falta la dependencia: $PKG"
  read -p "¿Desea intentar instalarla automaticamente? (s/n): " CONFIRM
  if [[ "$CONFIRM" =~ ^[Ss]$ ]]; then
    if command -v pacman >/dev/null 2>&1; then
      if [ "$PKG" = "node" ]; then
        sudo pacman -S --noconfirm nodejs npm
      elif [ "$PKG" = "java" ]; then
        sudo pacman -S --noconfirm jdk17-openjdk
      elif [ "$PKG" = "mysql" ]; then
        sudo pacman -S --noconfirm mariadb mariadb-clients
        sudo mysql_install_db --user=mysql --basedir=/usr --datadir=/var/lib/mysql
        sudo systemctl start mariadb
      fi
    elif command -v apt-get >/dev/null 2>&1; then
      sudo apt-get update
      if [ "$PKG" = "node" ]; then
        sudo apt-get install -y nodejs npm
      elif [ "$PKG" = "java" ]; then
        sudo apt-get install -y default-jdk
      elif [ "$PKG" = "mysql" ]; then
        sudo apt-get install -y mysql-server
        sudo systemctl start mysql
      fi
    elif command -v dnf >/dev/null 2>&1; then
      if [ "$PKG" = "node" ]; then
        sudo dnf install -y nodejs npm
      elif [ "$PKG" = "java" ]; then
        sudo dnf install -y java-17-openjdk-devel
      elif [ "$PKG" = "mysql" ]; then
        sudo dnf install -y mariadb-server
        sudo systemctl start mariadb
      fi
    elif command -v brew >/dev/null 2>&1; then
      if [ "$PKG" = "node" ]; then
        brew install node
      elif [ "$PKG" = "java" ]; then
        brew install openjdk
      elif [ "$PKG" = "mysql" ]; then
        brew install mysql
        brew services start mysql
      fi
    else
      echo "[ERROR] No se pudo encontrar un gestor de paquetes conocido (pacman, apt, dnf, brew). Por favor instale $PKG manualmente."
      exit 1
    fi
  else
    echo "[ERROR] Se requiere $PKG para continuar."
    exit 1
  fi
}

if ! command -v node >/dev/null 2>&1; then
  detect_and_install "node"
fi

if ! command -v java >/dev/null 2>&1 || ! command -v javac >/dev/null 2>&1; then
  detect_and_install "java"
fi

if ! command -v mysql >/dev/null 2>&1; then
  detect_and_install "mysql"
fi

# Ensure MySQL/MariaDB service is running
echo "[INFO] Verificando servicio de base de datos..."
if ! systemctl is-active --quiet mariadb && ! systemctl is-active --quiet mysqld; then
  echo "[INFO] Iniciando el servicio de base de datos..."
  sudo systemctl start mariadb 2>/dev/null || sudo systemctl start mysqld 2>/dev/null
fi

# 2. Prompt for MySQL password
read -s -p "Ingrese su contrasena de MySQL root (deje vacio si no tiene contrasena): " DB_PASS
echo ""

if [ -z "$DB_PASS" ]; then
  CONNECT_OK=$(mysql -u root -e "SELECT 1;" >/dev/null 2>&1 && echo "ok" || echo "fail")
else
  CONNECT_OK=$(mysql -u root -p"${DB_PASS}" -e "SELECT 1;" >/dev/null 2>&1 && echo "ok" || echo "fail")
fi

if [ "$CONNECT_OK" = "ok" ]; then
  echo "[SUCCESS] Conectado exitosamente a MySQL."
else
  echo "[ERROR] La contrasena ingresada es incorrecta o no se pudo conectar a MySQL."
  exit 1
fi

# 3. Configure connection in database.local.js
echo "========================================================="
echo "PREPARANDO CONFIGURACION Y MIGRANDO BASE DE DATOS"
echo "========================================================="

if [ ! -f "server-js/database.local.js" ]; then
  echo "[INFO] Creando server-js/database.local.js..."
  cp "server-js/database.config.example.js" "server-js/database.local.js"
fi

# Write password in database.local.js using node
echo "[INFO] Asegurando contrasena en database.local.js..."
export DB_PASS
node -e "const fs = require('fs'); const f = 'server-js/database.local.js'; fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace(/password:\s*'[^']*'/, 'password: \'' + (process.env.DB_PASS || '').replace(/\\\\/g, '\\\\\\\\').replace(/'/g, '\\\'') + '\''), 'utf8');"

# Run migrations
echo "[INFO] Ejecutando 001_crear_base.sql..."
if [ -z "$DB_PASS" ]; then
  mysql -u root < database/migrations/001_crear_base.sql
  mysql -u root < database/migrations/002_mejoras_sistema.sql
  mysql -u root < database/seeds/001_datos_demo.sql
else
  mysql -u root -p"${DB_PASS}" < database/migrations/001_crear_base.sql
  mysql -u root -p"${DB_PASS}" < database/migrations/002_mejoras_sistema.sql
  mysql -u root -p"${DB_PASS}" < database/seeds/001_datos_demo.sql
fi

echo "[SUCCESS] Migraciones y datos semilla aplicados correctamente."

# 4. Compile Java
echo "========================================================="
echo "COMPILANDO COMPONENTES DE JAVA"
echo "========================================================="
chmod +x java/compilar.sh 2>/dev/null || true
pushd java >/dev/null
./compilar.sh || echo "[WARNING] Fallo la compilacion de Java."
popd >/dev/null

# 5. Install Node dependencies
echo "========================================================="
echo "INSTALANDO DEPENDENCIAS DE NODE.JS"
echo "========================================================="
cd server-js
if [ ! -d "node_modules" ]; then
  echo "[INFO] Instalando dependencias por primera vez..."
  npm install
else
  echo "[INFO] Las dependencias de Node.js ya estan instaladas."
fi

# 6. Start server and open browser
echo "========================================================="
echo "INICIANDO EL SERVIDOR DE ADDJ MOTORS"
echo "========================================================="
echo "[INFO] El sistema estara disponible en http://localhost:8080"

# Open browser depending on OS utility
if command -v xdg-open >/dev/null 2>&1; then
  xdg-open "http://localhost:8080" &
elif command -v open >/dev/null 2>&1; then
  open "http://localhost:8080" &
fi

npm start
cd ..
