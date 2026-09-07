$ErrorActionPreference = 'Stop'

$caddyFile = Join-Path $PSScriptRoot '..\dev\caddy\Caddyfile'
$caddyRootCert = Join-Path $env:APPDATA 'Caddy\pki\authorities\local\root.crt'

function Get-CaddyPath {
  $command = Get-Command caddy -ErrorAction SilentlyContinue

  if ($command) {
    return $command.Source
  }

  $downloadPath = Join-Path $env:USERPROFILE 'Downloads\caddy_windows_amd64.exe'

  if (Test-Path -LiteralPath $downloadPath) {
    return $downloadPath
  }

  return $null
}

function Test-CaddyAdmin {
  try {
    Invoke-WebRequest -Uri 'http://127.0.0.1:2019/config/' -UseBasicParsing -TimeoutSec 2 | Out-Null
    return $true
  }
  catch {
    return $false
  }
}

if (Test-Path -LiteralPath $caddyFile) {
  $caddyPath = Get-CaddyPath

  if ($caddyPath) {
    if (Test-CaddyAdmin) {
      & $caddyPath reload --config $caddyFile
    }
    else {
      & $caddyPath start --config $caddyFile
    }
  }
  else {
    Write-Warning "Caddy was not found in PATH or Downloads. HTTPS proxy will not be started automatically."
  }
}

if (Test-Path -LiteralPath $caddyRootCert) {
  $env:NODE_EXTRA_CA_CERTS = $caddyRootCert
  Write-Host "Using Caddy local CA for Node HTTPS: $caddyRootCert"
}
elseif ($env:NODE_EXTRA_CA_CERTS) {
  Write-Host "Using existing NODE_EXTRA_CA_CERTS: $env:NODE_EXTRA_CA_CERTS"
}
else {
  Write-Warning "Caddy root certificate was not found at $caddyRootCert. Server-side Next.js fetches to https://api.ecommerce.localhost:4443 may fail until Caddy has been started once."
}

turbo run dev
exit $LASTEXITCODE
