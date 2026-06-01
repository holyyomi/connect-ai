param(
  [int]$Port = 17331,
  [switch]$Restart,
  [switch]$Open
)

$ErrorActionPreference = "Stop"

function Quote-Single([string]$Value) {
  return "'" + ($Value -replace "'", "''") + "'"
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$serverPath = Join-Path $repoRoot "web/personal-office/server.mjs"
$runtimeDir = Join-Path $repoRoot "web/personal-office/runtime"
$logPath = Join-Path $runtimeDir "server.log"
$pidPath = Join-Path $runtimeDir "server.pid"
$url = "http://127.0.0.1:$Port"

if (!(Test-Path -LiteralPath $serverPath)) {
  throw "YOMI server not found: $serverPath"
}

$node = Get-Command node -ErrorAction SilentlyContinue
if (!$node) {
  throw "Node.js was not found in PATH."
}

New-Item -ItemType Directory -Force -Path $runtimeDir | Out-Null

$existing = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($existing) {
  if (!$Restart) {
    Write-Host "YOMI is already listening on $url (pid $($existing.OwningProcess))."
    Write-Host "Use -Restart to replace the running process."
    exit 0
  }
  Stop-Process -Id $existing.OwningProcess -ErrorAction SilentlyContinue
  Start-Sleep -Milliseconds 700
}

$rootQ = Quote-Single $repoRoot
$serverQ = Quote-Single $serverPath
$logQ = Quote-Single $logPath
$command = "Set-Location -LiteralPath $rootQ; `$env:PORT='$Port'; node $serverQ *>> $logQ"

$process = Start-Process -FilePath "powershell.exe" `
  -ArgumentList @("-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", $command) `
  -WorkingDirectory $repoRoot `
  -WindowStyle Hidden `
  -PassThru

Set-Content -LiteralPath $pidPath -Value ([string]$process.Id) -Encoding ASCII
Start-Sleep -Seconds 2

try {
  $health = Invoke-RestMethod -Uri "$url/api/health" -Method Get -TimeoutSec 8
  if ($health.ok -ne $true) {
    throw "Health endpoint returned unexpected response."
  }
  Write-Host "YOMI started: $url"
  Write-Host "PID: $($process.Id)"
  Write-Host "Log: $logPath"
  if ($Open) {
    Start-Process $url | Out-Null
  }
} catch {
  Write-Host "YOMI process started but health check failed."
  Write-Host "PID: $($process.Id)"
  Write-Host "Log: $logPath"
  throw
}
