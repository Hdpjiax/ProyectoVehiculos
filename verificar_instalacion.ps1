Write-Host "Verificando ADDJ MOTORS..." -ForegroundColor Cyan

$errores = 0

function Probar-Comando($nombre, $comando) {
  Write-Host "Revisando $nombre..." -NoNewline
  try {
    Invoke-Expression $comando | Out-Null
    Write-Host " OK" -ForegroundColor Green
  } catch {
    Write-Host " ERROR" -ForegroundColor Red
    $script:errores++
  }
}

Probar-Comando "Java" "java -version"
Probar-Comando "Javac" "javac -version"
Probar-Comando "Node" "node -v"
Probar-Comando "NPM" "npm -v"

if (!(Test-Path "server-js\database.local.js")) {
  Write-Host "Falta server-js\database.local.js" -ForegroundColor Red
  $errores++
}

if (!(Test-Path "java\out\GeneradorActa.class")) {
  Write-Host "Falta compilar Java: java\out\GeneradorActa.class" -ForegroundColor Yellow
}

if (!(Test-Path "database\seeds\reset_demo_completo.sql")) {
  Write-Host "Falta database\seeds\reset_demo_completo.sql" -ForegroundColor Red
  $errores++
}

if ($errores -eq 0) {
  Write-Host "Verificacion terminada sin errores criticos." -ForegroundColor Green
} else {
  Write-Host "Verificacion terminada con $errores error(es)." -ForegroundColor Red
}
