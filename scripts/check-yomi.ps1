param(
  [int]$Port = 17331
)

$ErrorActionPreference = "Stop"

$url = "http://127.0.0.1:$Port"

function Status-Line([string]$Name, [string]$Value) {
  Write-Host ("{0}: {1}" -f $Name, $Value)
}

$listener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($listener) {
  Status-Line "process" "listening on $Port, pid $($listener.OwningProcess)"
} else {
  Status-Line "process" "not listening on $Port"
  exit 1
}

try {
  $health = Invoke-RestMethod -Uri "$url/api/health" -Method Get -TimeoutSec 8
  Status-Line "health" ($(if ($health.ok) { "ok" } else { "unexpected" }))
} catch {
  Status-Line "health" "failed: $($_.Exception.Message)"
  exit 1
}

try {
  $state = Invoke-RestMethod -Uri "$url/api/office-state" -Method Get -TimeoutSec 12
  Status-Line "url" $url
  Status-Line "vault" ($(if ($state.vault.connected) { "connected: $($state.vault.path)" } else { "not connected" }))
  Status-Line "rag" ("{0}, docs {1}, chunks {2}, provider {3}" -f $state.rag.embeddingMode, $state.rag.documentCount, $state.rag.chunkCount, $state.rag.provider)
  Status-Line "codex" ($(if ($state.codex.available) { "available" } else { "not available" }))
  Status-Line "claude" ($(if ($state.claude.available) { "available" } else { "not available" }))

  $tools = @($state.skills.tools | Where-Object { $_.provider -in @("exa", "firecrawl", "tavily") })
  foreach ($tool in $tools) {
    Status-Line $tool.provider ("{0} ({1})" -f $tool.statusLabel, $tool.status)
  }
} catch {
  Status-Line "office-state" "failed: $($_.Exception.Message)"
  exit 1
}
