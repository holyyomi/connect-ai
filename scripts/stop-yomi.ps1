param(
  [int]$Port = 17331
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$runtimeDir = Join-Path $repoRoot "web/personal-office/runtime"
$pidPath = Join-Path $runtimeDir "server.pid"

$targets = @()

$listener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($listener) {
  $targets += [int]$listener.OwningProcess
}

if (Test-Path -LiteralPath $pidPath) {
  $storedPid = (Get-Content -LiteralPath $pidPath -ErrorAction SilentlyContinue | Select-Object -First 1)
  if ($storedPid -match '^\d+$') {
    $targets += [int]$storedPid
  }
}

$targets = $targets | Select-Object -Unique

if (!$targets.Count) {
  Write-Host "YOMI is not listening on port $Port."
  exit 0
}

foreach ($pid in $targets) {
  $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
  if ($process) {
    Stop-Process -Id $pid -ErrorAction SilentlyContinue
    Write-Host "Stopped YOMI process $pid."
  }
}

if (Test-Path -LiteralPath $pidPath) {
  Remove-Item -LiteralPath $pidPath -Force -ErrorAction SilentlyContinue
}
