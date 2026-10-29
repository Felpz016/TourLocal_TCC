# Sobe o banco, a API e o app, e abre o simulador de celular no navegador do PC.
# Uso: .\iniciar.cmd  (ou dois cliques nele no Explorer)
# 'Continue': o Docker escreve progresso no stderr, e com 'Stop' o PowerShell 5 trataria isso como erro.
$ErrorActionPreference = 'Continue'
Set-Location $PSScriptRoot

docker info *> $null
if ($LASTEXITCODE -ne 0) {
  Write-Host 'O Docker Desktop não está aberto. Abra-o, espere ficar verde e rode de novo.' -ForegroundColor Red
  exit 1
}

Write-Host 'Subindo banco e API no Docker...' -ForegroundColor Cyan
docker compose up -d --build
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host 'Esperando a API responder...' -ForegroundColor Cyan
$pronta = $false
for ($i = 0; $i -lt 60; $i++) {
  try {
    Invoke-WebRequest http://localhost:8000/health -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop | Out-Null
    $pronta = $true
    break
  } catch {
    Start-Sleep -Seconds 2
  }
}
if (-not $pronta) {
  Write-Host 'A API não respondeu em 2 minutos. Veja o erro com: docker compose logs api' -ForegroundColor Red
  exit 1
}

Set-Location apps/mobile
if (-not (Test-Path node_modules)) {
  Write-Host 'Instalando as dependências do app (só na primeira vez)...' -ForegroundColor Cyan
  npm install
}

# Abre o simulador (o app numa moldura de celular) assim que o Expo estiver respondendo.
$simulador = 'http://localhost:8081/simulador.html'
Start-Job -ArgumentList $simulador {
  param($url)
  for ($i = 0; $i -lt 180; $i++) {
    try {
      Invoke-WebRequest $url -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop | Out-Null
      Start-Process $url
      break
    } catch {
      Start-Sleep -Seconds 1
    }
  }
} | Out-Null

Write-Host ''
Write-Host "O simulador vai abrir no navegador: $simulador" -ForegroundColor Green
Write-Host 'A primeira carga demora um pouco. Salvou um arquivo? O app atualiza sozinho.' -ForegroundColor Green
Write-Host 'Para parar: Ctrl+C. O banco e a API continuam no Docker (docker compose down para desligar).' -ForegroundColor Green
Write-Host ''
npx expo start
