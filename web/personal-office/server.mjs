import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createReadStream, existsSync, mkdirSync, readFileSync, watch, writeFileSync } from "node:fs";
import { access, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..", "..");
const webRoot = scriptDir;
const assetsRoot = path.join(projectRoot, "assets");
const workflowConfigPath = path.join(webRoot, "workflow.json");
const skillsConfigPath = path.join(webRoot, "skills.json");
const connectionsConfigPath = path.join(webRoot, "connections.json");
const automationTriggersConfigPath = path.join(webRoot, "automation-triggers.json");
const styleProfilePath = path.join(webRoot, "style-profile.json");
const runtimeRoot = path.join(webRoot, "runtime");
const chatSessionsPath = path.join(runtimeRoot, "chat-sessions.json");
const skillCandidatesPath = path.join(runtimeRoot, "skill-candidates.json");
const ragIndexPath = path.join(runtimeRoot, "rag-index.json");
const taskQueueHistoryPath = path.join(runtimeRoot, "task-queue.json");
const automationTriggerStatePath = path.join(runtimeRoot, "automation-trigger-state.json");
const performanceLogPath = path.join(runtimeRoot, "performance-log.json");
const reviewDecisionsPath = path.join(runtimeRoot, "review-decisions.json");
const economicsAdjustmentsPath = path.join(runtimeRoot, "economics-adjustments.json");

function loadDotEnv(filePath) {
  if (!existsSync(filePath)) return;
  const rows = readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const row of rows) {
    const line = row.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match || process.env[match[1]] !== undefined) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}

loadDotEnv(path.join(projectRoot, ".env"));

const defaultVaultPath = "C:\\Users\\a0104\\Desktop\\MY\\obsidian";
const explicitVaultPath = process.env.YOMI_AI_PERSONAL_VAULT || process.argv[2] || defaultVaultPath;
const port = Number(process.env.PORT || 17331);
const maxBodyBytes = 96 * 1024;
const codexTimeoutMs = Number(process.env.YOMI_AI_CODEX_TIMEOUT_MS || 10 * 60 * 1000);
const codexPromptTimeoutMs = Number(process.env.YOMI_AI_CODEX_PROMPT_TIMEOUT_MS || 2 * 60 * 1000);
const claudePromptTimeoutMs = Number(process.env.YOMI_AI_CLAUDE_PROMPT_TIMEOUT_MS || 3 * 60 * 1000);
const claudeMaxBudgetUsd = String(process.env.YOMI_AI_CLAUDE_MAX_BUDGET_USD || "0.25");
const maxCodexOutputBytes = 256 * 1024;
const primaryReportFolder = "YOMI Office";
const legacyReportFolders = ["YOMI AI", "Web Office"];
const reportFolderNames = [primaryReportFolder, ...legacyReportFolders];

const specialistRoles = [
  { id: "ceo", name: "총괄 요미", role: "총괄 매니저", work: "목표와 완료 기준을 정하고 직원 작업을 지휘합니다." },
  { id: "secretary", name: "운영 나래", role: "운영 비서", work: "업무 티켓, 체크리스트, 검토 기준을 챙깁니다." },
  { id: "youtube", name: "영상 유진", role: "영상 기획", work: "영상 훅, 제목, 구성을 설계합니다." },
  { id: "instagram", name: "SNS 리아", role: "SNS 운영", work: "SNS 캡션, 해시태그, 재활용 포맷을 만듭니다." },
  { id: "designer", name: "디자인 이안", role: "디자인", work: "화면 구조와 정보 위계를 점검합니다." },
  { id: "developer", name: "개발 태오", role: "개발", work: "파일, API, 자동화, 검증을 맡습니다." },
  { id: "business", name: "전략 도윤", role: "전략", work: "우선순위, KPI, 실행 효과를 판단합니다." },
  { id: "editor", name: "편집 하루", role: "편집", work: "리듬, 압축, 강조 지점을 잡습니다." },
  { id: "writer", name: "문서 문채", role: "문서", work: "보고서, 카피, 문장 구조를 완성합니다." },
  { id: "researcher", name: "리서치 서아", role: "리서치", work: "근거, 사례, 리스크를 모읍니다." },
  { id: "archivist", name: "자산화 아카", role: "자산화", work: "Vault 저장 위치, 태그, RAG 후보를 분류합니다." }
];

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".svg", "image/svg+xml"]
]);

const workflowRuntime = {
  runCount: 0,
  agentTaskCounts: Object.fromEntries(specialistRoles.map((agent) => [agent.id, 0])),
  statusCounts: { success: 0, rework: 0, failed: 0 },
  recentErrors: [],
  current: null
};

const defaultAutomationRules = {
  chatAssetCapture: true,
  vaultModeCapture: true,
  reportSave: true,
  codexReportSave: true,
  keywords: ["자산", "저장", "정리", "계획", "결정", "절차", "아이디어", "자동화", "프롬프트", "RAG", "옵시디언"]
};
let automationRules = { ...defaultAutomationRules, keywords: [...defaultAutomationRules.keywords] };
const automationTriggerRuntime = {
  initialized: false,
  schedulerTimer: null,
  watchers: new Map(),
  pendingWatchTimers: new Map(),
  running: new Set()
};
const ragRuntime = {
  indexingPromise: null,
  watcher: null,
  watcherRoot: "",
  dirty: false,
  lastAutoRefresh: 0,
  watchTimer: null
};

const defaultStyleProfile = {
  label: "YOMI 기본 개인 톤",
  enabled: true,
  voice: [
    "한국어로 바로 실행 가능한 답을 먼저 제시한다.",
    "과한 설명보다 판단, 이유, 다음 행동을 짧고 명확하게 쓴다.",
    "사용자를 사장님처럼 존중하되 과장된 칭찬이나 장식적 표현은 줄인다."
  ],
  format: [
    "긴 글은 짧은 제목과 불릿으로 나눈다.",
    "중요한 결과물은 목표, 핵심 판단, 실행 순서, 남은 리스크 순서로 정리한다.",
    "Vault에 재사용될 수 있는 산출물은 나중에 검색하기 쉬운 키워드를 자연스럽게 포함한다."
  ],
  avoid: [
    "고정 안내문, 사용법 반복, 불필요한 모드 설명",
    "근거 없는 확정 표현",
    "실행하지 않은 일을 완료한 것처럼 쓰기"
  ],
  memory: [
    "사소한 요청에는 필요한 담당자만 투입하고, 중요한 업무만 깊게 진행한다."
  ]
};
const codexJobs = new Map();
const orchestrationJobs = new Map();
const finalJobStatuses = new Set(["completed", "completed_with_errors", "failed", "waiting_question", "cancelled"]);

const cliEngines = {
  codex: {
    id: "codex",
    provider: "codex-cli",
    label: "Codex CLI",
    bestFor: "code/files/git/terminal/default"
  },
  claude: {
    id: "claude",
    provider: "claude-code",
    label: "Claude Code CLI",
    bestFor: "long-reasoning/writing/research-review"
  }
};

const defaultAgentEngines = {
  ceo: "codex",
  secretary: "codex",
  developer: "codex",
  archivist: "codex",
  researcher: "claude",
  business: "claude",
  writer: "claude",
  editor: "claude",
  designer: "claude",
  youtube: "claude",
  instagram: "claude"
};

const claudePreferredWorkTypes = new Set(["research", "strategy", "writing", "video", "social", "design"]);

function normalizeEngineId(value, fallback = "codex") {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "claude" || normalized === "claude-code" || normalized === "claude_code") return "claude";
  if (normalized === "codex" || normalized === "codex-cli" || normalized === "codex_cli") return "codex";
  return fallback;
}

function engineMeta(engineId) {
  return cliEngines[normalizeEngineId(engineId)] || cliEngines.codex;
}

function requestedEngineFromText(text) {
  const value = String(text || "");
  if (/^\s*\/(?:cc|claude)(?:\s+|$)/i.test(value) || /(?:engine|엔진)\s*[:=]\s*(?:claude|claude code)/i.test(value)) return "claude";
  if (/^\s*\/codex(?:\s+|$)/i.test(value) || /(?:engine|엔진)\s*[:=]\s*codex/i.test(value)) return "codex";
  return "";
}

function defaultEngineForWorkType(workType, staffing = {}) {
  if (workType === "code") return "codex";
  if (claudePreferredWorkTypes.has(workType) && staffing.level !== "quick") return "claude";
  return "codex";
}

function defaultEngineForAgent(agentId, capsule = {}) {
  if (capsule.engine?.selection === "user-requested") return normalizeEngineId(capsule.engine.id);
  if (capsule.workType === "code" || agentId === "developer") return "codex";
  return normalizeEngineId(defaultAgentEngines[agentId], "codex");
}

function appendJobLog(job, message, actor = "system", level = "info") {
  if (!job) return;
  if (!Array.isArray(job.logs)) job.logs = [];
  job.logs.push({ createdAt: new Date().toISOString(), actor, level, message: String(message || "") });
  job.logs = job.logs.slice(-80);
}

function publicJobLogs(job, limit = 40) {
  return Array.isArray(job?.logs) ? job.logs.slice(-limit) : [];
}

function serverJobStatusLabel(status = "") {
  return ({
    queued: "대기",
    running: "실행 중",
    retrying: "재시도",
    finalizing: "취합 중",
    completed: "완료",
    completed_with_errors: "일부 실패",
    failed: "실패",
    waiting_question: "확인 필요",
    cancelled: "취소",
    planned: "계획"
  })[status] || status || "대기";
}

function jobTimeValue(value) {
  const time = new Date(value || 0).getTime();
  return Number.isFinite(time) ? time : 0;
}

const taskQueueActiveStatuses = new Set(["queued", "running", "retrying", "finalizing"]);
const taskQueueAttentionStatuses = new Set(["waiting_question", "failed", "cancelled", "completed_with_errors"]);

function taskQueueStatusRank(status = "") {
  if (status === "waiting_question") return 0;
  if (taskQueueActiveStatuses.has(status)) return 1;
  if (["failed", "completed_with_errors"].includes(status)) return 2;
  if (status === "cancelled") return 3;
  if (status === "completed") return 4;
  return 5;
}

function taskQueueElapsedMs(row = {}) {
  const start = jobTimeValue(row.startedAt || row.createdAt);
  if (!start) return 0;
  const end = finalJobStatuses.has(row.status)
    ? jobTimeValue(row.completedAt || row.updatedAt || row.createdAt)
    : Date.now();
  return Math.max(0, (end || Date.now()) - start);
}

function taskQueueLastLogText(row = {}) {
  const logs = Array.isArray(row.logs) ? row.logs : [];
  const latest = logs[logs.length - 1];
  return String(latest?.message || row.progress || "").trim().slice(0, 180);
}

function enrichTaskQueueRow(row = {}) {
  const status = String(row.status || "");
  const isActive = taskQueueActiveStatuses.has(status);
  const needsAttention = taskQueueAttentionStatuses.has(status);
  return {
    ...row,
    isActive,
    needsAttention,
    durationMs: taskQueueElapsedMs(row),
    lastLog: taskQueueLastLogText(row),
    sortRank: taskQueueStatusRank(status)
  };
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  response.end(JSON.stringify(payload, null, 2));
}

function sendText(response, statusCode, message) {
  response.writeHead(statusCode, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" });
  response.end(message);
}

function applyLocalCorsHeaders(request, response) {
  const origin = String(request.headers.origin || "");
  if (!origin) return;
  let allowedOrigin = "";
  if (origin === "null") {
    allowedOrigin = "null";
  } else {
    try {
      const parsed = new URL(origin);
      if (["127.0.0.1", "localhost", "::1"].includes(parsed.hostname)) allowedOrigin = origin;
    } catch {
      allowedOrigin = "";
    }
  }
  if (!allowedOrigin) return;
  response.setHeader("access-control-allow-origin", allowedOrigin);
  response.setHeader("vary", "Origin");
  response.setHeader("access-control-allow-methods", "GET,POST,PUT,OPTIONS");
  response.setHeader("access-control-allow-headers", "content-type");
}

function resolveInside(root, requestPath) {
  const clean = decodeURIComponent(requestPath).replace(/^\/+/, "");
  const resolved = path.resolve(root, clean);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) return "";
  return resolved;
}

async function exists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    return { ...fallback, error: error instanceof Error ? error.message : String(error) };
  }
}

async function writeJsonFile(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function defaultConnectionsConfig() {
  return {
    connections: [
      { id: "codex_cli", name: "Codex CLI", kind: "model", provider: "codex", enabled: true, envKeys: ["YOMI_AI_CODEX_COMMAND"], notes: "기존 codex-cli 인증 상태를 사용합니다." },
      { id: "claude_cli", name: "Claude Code CLI", kind: "model", provider: "claude-code", enabled: true, envKeys: ["YOMI_AI_CLAUDE_COMMAND", "YOMI_AI_CLAUDE_MODEL"], safeMode: true, allowedActions: ["manual_chat", "auto_route", "plan", "synthesis", "review"], blockedActions: ["file_write", "git_write", "external_send"], notes: "긴 추론, 글쓰기, 리서치 종합, 검토 업무에 자동 라우팅될 수 있습니다. 실패 시 Codex CLI로 엔진 폴백합니다." },
      { id: "obsidian_vault", name: "Obsidian Vault", kind: "storage", provider: "filesystem", enabled: true, envKeys: ["YOMI_AI_PERSONAL_VAULT"], notes: "마크다운 저장소 경로입니다." },
      { id: "context7_mcp", name: "Context7 MCP", kind: "mcp", provider: "context7", enabled: true, envKeys: [], mcpServer: "context7", install: "npx -y @upstash/context7-mcp@latest", safeMode: true, allowedActions: ["resolve-library-id", "get-library-docs"], blockedActions: ["write", "external_send"], notes: "태오용 최신 라이브러리 문서 조회입니다. API 키 없이 제한적으로 사용합니다." },
      { id: "playwright_mcp", name: "Playwright MCP", kind: "mcp", provider: "playwright", enabled: true, envKeys: [], mcpServer: "playwright", install: "npx -y @playwright/mcp@latest --isolated", safeMode: true, allowedActions: ["browser_snapshot", "browser_click", "browser_type", "browser_screenshot"], blockedActions: ["external_send", "file_write"], notes: "브라우저 자동화 후보입니다. 화면 제어 권한이 있어 실제 실행은 사용자 확인 후 진행합니다." },
      { id: "exa_mcp", name: "Exa MCP", kind: "api", provider: "exa", enabled: true, envKeys: ["EXA_API_KEY"], mcpServer: "exa", install: "npx -y exa-mcp-server", safeMode: true, allowedActions: ["semantic_search"], blockedActions: ["write", "external_send"], notes: "시맨틱 검색 후보입니다. EXA_API_KEY를 .env에 넣으면 정상 연결됩니다." },
      { id: "firecrawl_mcp", name: "Firecrawl MCP", kind: "api", provider: "firecrawl", enabled: true, envKeys: ["FIRECRAWL_API_KEY"], mcpServer: "firecrawl", install: "npx -y firecrawl-mcp", safeMode: true, allowedActions: ["scrape", "extract"], blockedActions: ["write", "external_send"], notes: "웹 본문 추출/크롤링 후보입니다. FIRECRAWL_API_KEY를 .env에 넣으면 정상 연결됩니다." },
      { id: "fetch_mcp", name: "Fetch MCP", kind: "mcp", provider: "fetch", enabled: true, envKeys: [], mcpServer: "fetch", install: "uvx mcp-server-fetch", safeMode: true, notes: "웹페이지 본문 읽기 후보입니다. uvx 설치 상태를 확인해 연결 가능 여부를 표시합니다." },
      { id: "git_mcp", name: "Git MCP", kind: "mcp", provider: "git", enabled: true, envKeys: [], mcpServer: "git", install: "uvx mcp-server-git", safeMode: true, allowedActions: ["status", "diff", "log"], blockedActions: ["add", "commit", "push", "reset", "checkout", "rebase", "clean"], notes: "태오용 Git 읽기 전용 후보입니다. 쓰기 작업은 확인 없이 허용하지 않습니다." },
      { id: "tavily_search", name: "Tavily Search", kind: "api", provider: "tavily", enabled: true, envKeys: ["TAVILY_API_KEY"], mcpServer: "tavily", install: "npx -y tavily-mcp", safeMode: true, notes: "검색 백업 후보입니다. TAVILY_API_KEY를 .env에 넣으면 정상 연결됩니다." },
      { id: "filesystem", name: "파일시스템", kind: "mcp", provider: "internal", enabled: true, envKeys: [], notes: "프로젝트 파일 읽기 도구입니다." }
    ],
    candidates: [
      { name: "Tavily 검색 대안", kind: "api", provider: "tavily", envKeys: ["TAVILY_API_KEY"], mcpServer: "tavily" },
      { name: "Context7 MCP", kind: "mcp", provider: "context7", envKeys: [], mcpServer: "context7" },
      { name: "Playwright MCP", kind: "mcp", provider: "playwright", envKeys: [], mcpServer: "playwright" },
      { name: "Exa 검색", kind: "api", provider: "exa", envKeys: ["EXA_API_KEY"], mcpServer: "exa" },
      { name: "Firecrawl 본문추출", kind: "api", provider: "firecrawl", envKeys: ["FIRECRAWL_API_KEY"], mcpServer: "firecrawl" },
      { name: "Fetch MCP", kind: "mcp", provider: "fetch", envKeys: [], mcpServer: "fetch" },
      { name: "Git MCP", kind: "mcp", provider: "git", envKeys: [], mcpServer: "git" },
      { name: "옵시디언", kind: "storage", provider: "filesystem", envKeys: ["YOMI_AI_PERSONAL_VAULT"] },
      { name: "파일시스템 MCP", kind: "mcp", provider: "filesystem", envKeys: [] }
    ],
    harnessScopes: defaultHarnessScopes()
  };
}

function defaultHarnessScopes() {
  return {
    mode: "safe_metadata_only",
    policy: "직원은 자신에게 배정된 스킬에 해당하는 MCP/도구만 호출할 수 있습니다. 파일 쓰기, Git 쓰기, 외부 전송, 비용 발생 작업은 사용자 확인 없이는 실행하지 않습니다.",
    agents: {
      ceo: { allowedConnections: ["obsidian_vault", "filesystem"], allowedTools: ["planner", "vault_search", "file_read"], deniedActions: ["file_write", "git_write", "external_send"] },
      secretary: { allowedConnections: ["obsidian_vault"], allowedTools: ["checklist_ticket", "vault_search"], deniedActions: ["file_write", "git_write", "external_send"] },
      researcher: { allowedConnections: ["fetch_mcp", "obsidian_vault", "exa_mcp", "firecrawl_mcp", "tavily_search"], allowedTools: ["codex_research", "web_fetch", "pdf_research", "screenshot_evidence", "vault_search", "exa_search", "firecrawl_extract", "tavily_search"], deniedActions: ["file_write", "git_write", "external_send"] },
      business: { allowedConnections: ["obsidian_vault"], allowedTools: ["codex_research", "data_analysis", "notebook_analysis", "planner"], deniedActions: ["file_write", "git_write", "external_send"] },
      developer: { allowedConnections: ["filesystem", "git_mcp", "context7_mcp", "playwright_mcp"], allowedTools: ["file_read", "context7_docs", "browser_check", "playwright_mcp_skill", "tdd_testing", "security_review", "file_write", "git"], deniedActions: ["git_commit", "git_push", "git_reset", "external_send"], requiresConfirmation: ["file_write", "git", "playwright_mcp_skill"] },
      writer: { allowedConnections: ["obsidian_vault"], allowedTools: ["vault_search", "drafting", "copywriting", "storytelling"], deniedActions: ["file_write", "git_write", "external_send"] },
      editor: { allowedConnections: ["obsidian_vault"], allowedTools: ["vault_search", "content_edit", "tone_check"], deniedActions: ["file_write", "git_write", "external_send"] },
      designer: { allowedConnections: ["fetch_mcp", "playwright_mcp"], allowedTools: ["source_synthesis", "web_fetch", "screenshot_evidence", "browser_check", "design_template"], deniedActions: ["file_write", "git_write", "external_send"], requiresConfirmation: ["playwright_mcp_skill"] },
      youtube: { allowedConnections: ["fetch_mcp"], allowedTools: ["source_synthesis", "web_fetch", "video_template", "seo_geo"], deniedActions: ["file_write", "git_write", "external_send"] },
      instagram: { allowedConnections: ["fetch_mcp"], allowedTools: ["source_synthesis", "web_fetch", "sns_template", "seo_geo", "copywriting"], deniedActions: ["file_write", "git_write", "external_send"] },
      archivist: { allowedConnections: ["obsidian_vault", "filesystem"], allowedTools: ["vault_search", "file_write", "tagging_rag"], deniedActions: ["git_write", "external_send"], requiresConfirmation: ["file_write"] }
    }
  };
}

function slugId(value) {
  return String(value || "connection").normalize("NFKC").toLowerCase().replace(/[^a-z0-9가-힣_-]+/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 44) || "connection";
}

function normalizeEnvKeys(value) {
  const rows = Array.isArray(value) ? value : String(value || "").split(/[,\n]+/);
  return [...new Set(rows.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 8))];
}

function normalizeStringList(value, maxItems = 20) {
  const rows = Array.isArray(value) ? value : String(value || "").split(/[,\n]+/);
  return [...new Set(rows.map((item) => String(item || "").trim()).filter(Boolean).slice(0, maxItems))];
}

function normalizeConnection(input = {}) {
  const name = String(input.name || "").trim() || "새 연결";
  return {
    id: slugId(input.id || name),
    name,
    kind: String(input.kind || "api").trim() || "api",
    provider: String(input.provider || "").trim(),
    enabled: input.enabled !== false,
    envKeys: normalizeEnvKeys(input.envKeys),
    mcpServer: String(input.mcpServer || "").trim(),
    install: String(input.install || "").trim(),
    safeMode: input.safeMode === true,
    allowedActions: normalizeStringList(input.allowedActions),
    blockedActions: normalizeStringList(input.blockedActions),
    scope: input.scope && typeof input.scope === "object" ? input.scope : null,
    notes: String(input.notes || "").trim()
  };
}

function normalizeCandidate(item = {}) {
  return {
    name: String(item.name || ""),
    kind: String(item.kind || ""),
    provider: String(item.provider || ""),
    envKeys: normalizeEnvKeys(item.envKeys),
    mcpServer: String(item.mcpServer || "").trim(),
    notes: String(item.notes || "").trim()
  };
}

function normalizeHarnessScopes(value = {}) {
  const fallback = defaultHarnessScopes();
  const source = value && typeof value === "object" ? value : {};
  const sourceAgents = source.agents && typeof source.agents === "object" ? source.agents : {};
  const agents = {};
  for (const agent of specialistRoles) {
    const current = sourceAgents[agent.id] && typeof sourceAgents[agent.id] === "object" ? sourceAgents[agent.id] : fallback.agents[agent.id] || {};
    agents[agent.id] = {
      allowedConnections: normalizeStringList(current.allowedConnections),
      allowedTools: normalizeStringList(current.allowedTools),
      deniedActions: normalizeStringList(current.deniedActions),
      requiresConfirmation: normalizeStringList(current.requiresConfirmation)
    };
  }
  return {
    mode: String(source.mode || fallback.mode),
    policy: String(source.policy || fallback.policy),
    agents
  };
}

function normalizeConnectionsConfig(config = defaultConnectionsConfig()) {
  const fallback = defaultConnectionsConfig();
  const connections = Array.isArray(config.connections) ? config.connections : fallback.connections;
  const candidates = Array.isArray(config.candidates) ? config.candidates : fallback.candidates;
  return {
    connections: connections.map(normalizeConnection),
    candidates: candidates.map(normalizeCandidate),
    harnessScopes: normalizeHarnessScopes(config.harnessScopes || fallback.harnessScopes)
  };
}

async function readConnectionsConfig() {
  if (!(await exists(connectionsConfigPath))) return normalizeConnectionsConfig(defaultConnectionsConfig());
  return normalizeConnectionsConfig(await readJson(connectionsConfigPath, defaultConnectionsConfig()));
}

function containsSecretPayload(input) {
  const blocked = /^(api[_-]?key|secret|token|password|credential|keyvalue|secretvalue|value)$/i;
  const stack = [input];
  while (stack.length) {
    const current = stack.pop();
    if (!current || typeof current !== "object") continue;
    for (const [key, value] of Object.entries(current)) {
      if (blocked.test(key)) return true;
      if (value && typeof value === "object") stack.push(value);
    }
  }
  return false;
}

const commandAvailabilityCache = new Map();
const commandProbeCache = new Map();

function commandExists(command) {
  const name = String(command || "").trim();
  if (!name) return false;
  if (commandAvailabilityCache.has(name)) return commandAvailabilityCache.get(name);
  if (path.isAbsolute(name) || /[\\/]/.test(name)) {
    const ok = existsSync(name);
    commandAvailabilityCache.set(name, ok);
    return ok;
  }
  const result = process.platform === "win32"
    ? spawnSync("where.exe", [name], { stdio: "ignore", windowsHide: true })
    : spawnSync("sh", ["-lc", `command -v ${JSON.stringify(name)}`], { stdio: "ignore" });
  const ok = result.status === 0;
  commandAvailabilityCache.set(name, ok);
  return ok;
}

function commandSpecExists(spec = {}) {
  const commandOk = commandExists(spec.command || spec.label);
  if (!commandOk) return false;
  const requiredFiles = (spec.argsPrefix || []).filter((arg) => path.isAbsolute(String(arg || "")) && /\.(ps1|cmd|bat|exe)$/i.test(String(arg || "")));
  return requiredFiles.every((filePath) => existsSync(filePath));
}

function commandProbeCacheKey(spec = {}, args = []) {
  return JSON.stringify([spec.command || "", spec.argsPrefix || [], args]);
}

function commandProbeDetail(result = {}) {
  const error = result.error ? result.error.message || String(result.error) : "";
  const text = stripAnsi(`${result.stdout || ""}\n${result.stderr || ""}`);
  const firstLine = text.split(/\n+/).map((line) => line.trim()).filter(Boolean)[0] || "";
  return compactLine(firstLine || error || `종료 코드 ${result.status ?? "unknown"}`, 160);
}

function probeCommandSpec(spec = {}, args = ["--version"], timeoutMs = 8000) {
  const key = commandProbeCacheKey(spec, args);
  const cached = commandProbeCache.get(key);
  if (cached && Date.now() - cached.checkedAt < 60_000) return cached;
  if (!commandSpecExists(spec)) {
    const missing = { ok: false, detail: "실행 파일을 찾지 못했습니다.", checkedAt: Date.now() };
    commandProbeCache.set(key, missing);
    return missing;
  }
  const result = spawnSync(spec.command, [...(spec.argsPrefix || []), ...args], {
    cwd: projectRoot,
    encoding: "utf8",
    shell: false,
    timeout: timeoutMs,
    windowsHide: true
  });
  const probe = {
    ok: result.status === 0 && !result.error,
    detail: commandProbeDetail(result),
    exitCode: result.status,
    checkedAt: Date.now()
  };
  commandProbeCache.set(key, probe);
  return probe;
}

function installCommandName(install) {
  return String(install || "").trim().split(/\s+/)[0] || "";
}

function connectionStatusMeta(status) {
  return {
    normal: { label: "정상", tone: "ok" },
    key_required: { label: "키 필요", tone: "warn" },
    disconnected: { label: "미연결", tone: "bad" },
    optional_missing: { label: "선택", tone: "muted" },
    disabled: { label: "비활성", tone: "muted" }
  }[status] || { label: "확인 필요", tone: "warn" };
}

function optionalMcpMissing(connection = {}, command = "") {
  return ["fetch_mcp", "git_mcp"].includes(connection.id) && !commandExists(command);
}

function connectionsSummary(connections = []) {
  const count = (status) => connections.filter((connection) => connection.status === status).length;
  const researchIds = new Set(["exa_mcp", "firecrawl_mcp", "tavily_search"]);
  const research = connections.filter((connection) => researchIds.has(connection.id));
  const modelIds = new Set(["codex_cli", "claude_cli"]);
  const models = connections.filter((connection) => modelIds.has(connection.id));
  const keyRequired = count("key_required");
  const disconnected = count("disconnected");
  return {
    total: connections.length,
    normal: count("normal"),
    keyRequired,
    disconnected,
    disabled: count("disabled"),
    optional: count("optional_missing"),
    attention: keyRequired + disconnected,
    modelReady: models.filter((connection) => connection.status === "normal").length,
    modelTotal: models.length,
    researchReady: research.filter((connection) => connection.status === "normal").length,
    researchTotal: research.length
  };
}

const researchProbeDefinitions = [
  { id: "exa", label: "Exa", envKey: "EXA_API_KEY" },
  { id: "firecrawl", label: "Firecrawl", envKey: "FIRECRAWL_API_KEY" },
  { id: "tavily", label: "Tavily", envKey: "TAVILY_API_KEY" }
];

function researchProbeProviders(input = {}) {
  const requested = new Set(normalizeStringList(input.providers || input.provider || []));
  const providers = requested.size
    ? researchProbeDefinitions.filter((provider) => requested.has(provider.id))
    : researchProbeDefinitions;
  return providers.length ? providers : researchProbeDefinitions;
}

function publicResearchProbe(provider, patch = {}) {
  const status = String(patch.status || "pending");
  const tone = ({ ok: "ok", key_required: "warn", skipped: "muted", failed: "bad", pending: "muted" })[status] || "warn";
  const statusLabel = ({ ok: "정상", key_required: "키 필요", skipped: "대기", failed: "실패", pending: "대기" })[status] || "확인 필요";
  return {
    id: provider.id,
    label: provider.label,
    status,
    statusLabel,
    tone,
    detail: compactLine(patch.detail || "", 260),
    latencyMs: Number(patch.latencyMs || 0),
    resultCount: Number(patch.resultCount || 0)
  };
}

async function runResearchProbe(provider = {}, options = {}) {
  const apiKey = process.env[provider.envKey];
  if (!apiKey) return publicResearchProbe(provider, { status: "key_required", detail: `${provider.envKey} 환경변수가 필요합니다.` });
  if (options.dryRun === true) return publicResearchProbe(provider, { status: "skipped", detail: `${provider.envKey} 확인됨 · 라이브 호출 미수행` });
  const startedAt = Date.now();
  try {
    if (provider.id === "exa") {
      const body = await fetchJson("https://api.exa.ai/search", {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": apiKey },
        body: JSON.stringify({ query: "YOMI Office connectivity probe", numResults: 1, type: "fast" })
      }, 15000);
      const count = Array.isArray(body.results) ? body.results.length : 0;
      const cost = Number(body.costDollars?.total || 0);
      return publicResearchProbe(provider, { status: "ok", latencyMs: Date.now() - startedAt, resultCount: count, detail: `${count}개 결과${cost ? ` · 응답 비용 $${cost}` : ""}` });
    }
    if (provider.id === "firecrawl") {
      const body = await fetchJson("https://api.firecrawl.dev/v2/scrape", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ url: "https://example.com", formats: ["markdown"], onlyMainContent: true })
      }, 15000);
      if (body.success === false) throw new Error(body.error || body.message || "Firecrawl success=false");
      const markdownLength = String(body.data?.markdown || body.markdown || "").length;
      return publicResearchProbe(provider, { status: "ok", latencyMs: Date.now() - startedAt, resultCount: markdownLength ? 1 : 0, detail: `example.com scrape 응답 · markdown ${markdownLength}자` });
    }
    if (provider.id === "tavily") {
      const body = await fetchJson("https://api.tavily.com/search", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ query: "YOMI Office connectivity probe", search_depth: "basic", max_results: 1, include_answer: false, include_raw_content: false, include_images: false, include_usage: true })
      }, 15000);
      const count = Array.isArray(body.results) ? body.results.length : 0;
      const credits = Number(body.usage?.credits || 0);
      return publicResearchProbe(provider, { status: "ok", latencyMs: Date.now() - startedAt, resultCount: count, detail: `${count}개 결과${credits ? ` · 크레딧 ${credits}` : ""}` });
    }
    return publicResearchProbe(provider, { status: "failed", detail: "지원하지 않는 리서치 제공자입니다." });
  } catch (error) {
    return publicResearchProbe(provider, { status: "failed", latencyMs: Date.now() - startedAt, detail: error instanceof Error ? error.message : String(error) });
  }
}

async function buildResearchProbeState(input = {}) {
  const probes = await Promise.all(researchProbeProviders(input).map((provider) => runResearchProbe(provider, { dryRun: input.dryRun === true })));
  const failed = probes.filter((probe) => probe.status === "failed").length;
  const keyRequired = probes.filter((probe) => probe.status === "key_required").length;
  const skipped = probes.filter((probe) => probe.status === "skipped").length;
  return {
    ok: failed === 0,
    generatedAt: new Date().toISOString(),
    mode: input.dryRun === true ? "dry_run" : "live",
    costNotice: "라이브 모드는 외부 API 쿼터 또는 비용을 사용할 수 있습니다. 키 값은 응답에 포함하지 않습니다.",
    summary: {
      total: probes.length,
      ok: probes.filter((probe) => probe.status === "ok").length,
      failed,
      keyRequired,
      skipped,
      attention: failed + keyRequired
    },
    probes
  };
}

async function buildConnectionsState() {
  const config = await readConnectionsConfig();
  const vaultRoot = await findVaultRoot();
  const connections = config.connections.map((connection) => {
    let status = "normal";
    let detail = "사용 가능";
    const requiresEnv = connection.kind === "api";
    const envState = connection.envKeys.map((name) => ({ name, present: Boolean(process.env[name]), required: requiresEnv, masked: process.env[name] ? "••••••••" : "" }));
    if (!connection.enabled) {
      status = "disabled";
      detail = "설정에서 비활성화됨";
    } else if (connection.id === "obsidian_vault" || connection.kind === "storage") {
      status = vaultRoot ? "normal" : "disconnected";
      detail = vaultRoot ? `연결됨: ${vaultRoot}` : "Vault 경로를 찾지 못했습니다.";
    } else if (connection.id === "codex_cli") {
      const command = codexCommand();
      const probe = probeCommandSpec({ command, argsPrefix: [], label: command });
      status = probe.ok ? "normal" : "disconnected";
      detail = probe.ok ? `실행 확인: ${probe.detail || command}` : `codex-cli 확인 실패: ${probe.detail}`;
    } else if (connection.id === "claude_cli") {
      const spec = claudeCommandSpec();
      const probe = probeCommandSpec(spec);
      status = probe.ok ? "normal" : "disconnected";
      detail = probe.ok
        ? `실행 확인: ${probe.detail || spec.label} · plan 권한 · 예산상한 ${claudeMaxBudgetUsd} USD`
        : `Claude Code 확인 실패: ${probe.detail}`;
    } else if (connection.kind === "mcp" && connection.install) {
      const command = installCommandName(connection.install);
      const optionalMissing = optionalMcpMissing(connection, command);
      status = commandExists(command) ? "normal" : optionalMissing ? "optional_missing" : "disconnected";
      detail = status === "normal"
        ? `MCP 등록됨: ${connection.mcpServer || connection.provider}`
        : status === "optional_missing"
          ? `선택 후보입니다. 필요하면 ${command} 설치 후 사용합니다. 설치 명령: ${connection.install}`
        : `${command} 명령이 필요합니다. 설치 명령: ${connection.install}`;
    } else if (requiresEnv && connection.envKeys.length && envState.some((item) => !item.present)) {
      status = "key_required";
      detail = `${envState.filter((item) => !item.present).map((item) => item.name).join(", ")} 환경변수가 필요합니다.`;
    } else if (requiresEnv && connection.envKeys.length) {
      detail = `${connection.envKeys.join(", ")} 환경변수 확인됨 · 키 값 미표시`;
    }
    const meta = connectionStatusMeta(status);
    return { ...connection, status, statusLabel: meta.label, tone: meta.tone, detail, envState };
  });
  const summary = connectionsSummary(connections);
  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    secretsStored: false,
    secretPolicy: "실제 API 키/토큰은 저장하지 않습니다. 환경변수 또는 .env를 사용하고 화면에는 존재 여부만 표시합니다.",
    summary,
    connections,
    candidates: config.candidates,
    harnessScopes: config.harnessScopes
  };
}

async function updateConnectionsConfig(input = {}) {
  if (containsSecretPayload(input)) throw new Error("API 키, 토큰, 비밀번호 값은 저장하지 않습니다. 환경변수 이름만 등록하세요.");
  const config = await readConnectionsConfig();
  const action = String(input.action || "save");
  if (action === "save") {
    const next = normalizeConnection(input.connection || input);
    const ids = new Set(config.connections.map((item) => item.id));
    if (ids.has(next.id)) config.connections = config.connections.map((item) => item.id === next.id ? next : item);
    else config.connections.push(next);
  } else if (action === "delete") {
    const id = String(input.id || "");
    config.connections = config.connections.filter((item) => item.id !== id);
  } else if (action === "toggle") {
    const id = String(input.id || "");
    config.connections = config.connections.map((item) => item.id === id ? { ...item, enabled: input.enabled !== false } : item);
  } else {
    throw new Error("Unknown connection action");
  }
  await writeFile(connectionsConfigPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
  return await buildConnectionsState();
}

async function findVaultRoot() {
  const defaultCompanyRoot = path.join(projectRoot, "_company");
  const candidates = [explicitVaultPath, defaultCompanyRoot, path.join(projectRoot, ".secondbrain")].filter(Boolean);
  for (const candidate of candidates) {
    const resolved = path.resolve(candidate);
    if (!(await exists(resolved))) continue;
    const marker = path.join(resolved, "50_Outputs");
    if ((await exists(marker)) || resolved === path.resolve(defaultCompanyRoot) || resolved === path.resolve(explicitVaultPath || "")) return resolved;
  }
  return "";
}

async function countMarkdownFiles(target) {
  if (!(await exists(target))) return 0;
  let total = 0;
  for (const entry of await readdir(target, { withFileTypes: true })) {
    const next = path.join(target, entry.name);
    if (entry.isDirectory()) total += await countMarkdownFiles(next);
    if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) total += 1;
  }
  return total;
}

async function latestMarkdownFile(target) {
  if (!(await exists(target))) return null;
  let latest = null;
  for (const entry of await readdir(target, { withFileTypes: true })) {
    const fullPath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      const nested = await latestMarkdownFile(fullPath);
      if (nested && (!latest || nested.mtimeMs > latest.mtimeMs)) latest = nested;
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      const info = await stat(fullPath);
      if (!latest || info.mtimeMs > latest.mtimeMs) latest = { fullPath, mtimeMs: info.mtimeMs };
    }
  }
  return latest;
}

async function collectMarkdownFiles(target, root = target) {
  if (!(await exists(target))) return [];
  const rows = [];
  for (const entry of await readdir(target, { withFileTypes: true })) {
    const fullPath = path.join(target, entry.name);
    if (entry.isDirectory()) rows.push(...await collectMarkdownFiles(fullPath, root));
    else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      const info = await stat(fullPath);
      rows.push({ fullPath, relPath: path.relative(root, fullPath).replace(/\\/g, "/"), mtimeMs: info.mtimeMs });
    }
  }
  return rows;
}

function isSensitiveVaultPath(relPath) {
  return /(^|[\\/_. -])(secret|secrets|credential|credentials|token|tokens|password|passwords|api[-_ ]?key|\.env)([\\/_. -]|$)/i.test(String(relPath || ""));
}

function displayReportPath(relPath) {
  return String(relPath || "").replace(/^50_Outputs\/Web Office\//, "50_Outputs/기존 업무 보고서/");
}

function reportTitleFromPath(relPath) {
  return path.basename(relPath, ".md").replace(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-?/, "").replace(/-/g, " ").trim() || "YOMI Office 보고서";
}

function vaultCategoryFromPath(relPath) {
  return String(relPath || "").split("/").filter(Boolean)[0] || "루트";
}

function normalizeNoteKey(value) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/\\/g, "/")
    .replace(/\.md$/i, "")
    .trim()
    .toLowerCase();
}

function extractObsidianLinks(content) {
  const links = new Set();
  const pattern = /\[\[([^\]]+)\]\]/g;
  let match;
  while ((match = pattern.exec(String(content || "")))) {
    const target = String(match[1] || "").split("|")[0].split("#")[0].trim();
    if (target) links.add(target);
  }
  return [...links].slice(0, 60);
}

function extractMarkdownTags(content) {
  const tags = new Set();
  const text = String(content || "");
  const frontmatter = text.match(/^---\s*\n([\s\S]*?)\n---/);
  if (frontmatter) {
    const tagLine = frontmatter[1].split(/\r?\n/).find((line) => /^\s*tags\s*:/i.test(line));
    if (tagLine) {
      const raw = tagLine.replace(/^\s*tags\s*:\s*/i, "").replace(/[\[\]'"]/g, "");
      raw.split(/[,\s]+/).map((tag) => tag.replace(/^#/, "").trim()).filter(Boolean).forEach((tag) => tags.add(tag));
    }
    for (const match of frontmatter[1].matchAll(/^\s*-\s*#?([\p{L}\p{N}/_-]+)/gmu)) tags.add(match[1]);
  }
  for (const match of text.matchAll(/(^|[\s([{])#([\p{L}\p{N}/_-]{2,})/gu)) tags.add(match[2]);
  return [...tags].filter((tag) => !/^\d+$/.test(tag)).slice(0, 30);
}

function parseMarkdownFrontmatter(content) {
  const match = String(content || "").match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return {};
  const meta = {};
  for (const row of match[1].split(/\r?\n/)) {
    const item = row.match(/^\s*([A-Za-z0-9_-]+)\s*:\s*(.*?)\s*$/);
    if (!item) continue;
    const key = item[1].trim().toLowerCase();
    const raw = item[2].trim();
    if (/^\[(.*)\]$/.test(raw)) {
      meta[key] = raw.replace(/^\[|\]$/g, "").split(",").map((value) => value.trim().replace(/^['"]|['"]$/g, "")).filter(Boolean);
    } else if (/^(true|false)$/i.test(raw)) {
      meta[key] = /^true$/i.test(raw);
    } else {
      meta[key] = raw.replace(/^['"]|['"]$/g, "");
    }
  }
  return meta;
}

function falseLike(value) {
  return value === false || /^(false|no|off|0)$/i.test(String(value || "").trim());
}

function trueLike(value) {
  return value === true || /^(true|yes|on|1)$/i.test(String(value || "").trim());
}

function isCommandLikeAssetTitle(value = "") {
  const text = String(value || "").normalize("NFKC").trim();
  if (!text) return false;
  const commandTail = /(해줘|해 줘|줘|해봐|해 봐|바꿔줘|수정해줘|정리해줘|만들어줘|알려줘|설명해봐|확인만|진행해|적용해|덮어써|삭제해|추천해줘|list up|check only)$/i;
  const commandVerb = /(README|ARCHITECTURE|AGENTS|코덱스|codex|claude|파일|문서|설정).{0,40}(바꿔|수정|확인|정리|덮어|설명|진행)/i;
  return text.length <= 160 && (commandTail.test(text) || commandVerb.test(text));
}

function encodingNoiseScore(value = "") {
  return (String(value || "").match(/[�]|媛|덈|뺤|吏|留|吏|蹂|臾/g) || []).length;
}

function ragQualityGate(relPath, content) {
  const meta = parseMarkdownFrontmatter(content);
  const tags = new Set([...(Array.isArray(meta.tags) ? meta.tags : []), ...extractMarkdownTags(content)].map((tag) => normalizeGraphToken(tag)));
  const title = markdownTitle(content, reportTitleFromPath(relPath));
  const pathTitle = reportTitleFromPath(relPath);
  const autoGenerated = /(^|\/)50_Outputs\/(YOMI Office|YOMI AI|Web Office)\//i.test(String(relPath || ""))
    || [...tags].some((tag) => ["auto-asset", "personal-office", "yomi-office", "yomi-ai", "conversation-memory"].includes(tag));
  const quality = normalizeGraphToken(meta.quality || meta.status || "");
  if (falseLike(meta.rag) || falseLike(meta.index)) return { include: false, reason: "frontmatter rag/index false", meta, title, quality: quality || "excluded" };
  if (trueLike(meta.rag) && ["verified", "approved", "rag-ready"].includes(quality)) return { include: true, reason: "manual verified", meta, title, quality };
  if (trueLike(meta.verified) && ["verified", "approved", "rag-ready"].includes(quality)) return { include: true, reason: "manual verified", meta, title, quality };
  if (["test", "draft-test", "quarantine", "trash", "scratch"].includes(quality)) return { include: false, reason: `quality ${quality}`, meta, title, quality };
  if ([...tags].some((tag) => ["test", "quarantine", "scratch", "junk", "no-rag"].includes(tag))) return { include: false, reason: "tagged as non-rag", meta, title, quality: quality || "tagged" };
  if (autoGenerated && (isTrivialAutoSaveInput(title) || isTrivialAutoSaveInput(pathTitle) || isCommandLikeAssetTitle(title) || isCommandLikeAssetTitle(pathTitle))) return { include: false, reason: "auto-generated command/test title", meta, title, quality: "quarantine" };
  if (autoGenerated && (encodingNoiseScore(title) >= 3 || encodingNoiseScore(pathTitle) >= 3)) return { include: false, reason: "encoding-noisy title", meta, title, quality: "quarantine" };
  return { include: true, reason: "", meta, title, quality: quality || (trueLike(meta.verified) ? "verified" : "indexed") };
}

const graphStopWords = new Set([
  "yomi", "ai", "web", "office", "output", "outputs", "auto", "capture", "draft",
  "50", "개인", "사무실", "보고서", "작업", "최종", "진행", "정리", "요약",
  "업무", "문서", "오늘", "내일", "최근", "결과", "저장", "생성", "관리",
  "yomi-ai", "yomi-office", "personal-office", "auto-asset", "conversation-memory"
]);

function normalizeGraphToken(value) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/\.md$/i, "")
    .replace(/^#+/, "")
    .trim()
    .toLowerCase();
}

function graphRelationTokens(doc, content = "") {
  const tokens = new Set();
  for (const tag of doc.tags || []) {
    const normalized = normalizeGraphToken(tag);
    if (normalized && !graphStopWords.has(normalized)) tokens.add(`tag:${normalized}`);
  }
  const folder = normalizeGraphToken(doc.folder);
  if (folder && folder !== "루트" && !graphStopWords.has(folder)) tokens.add(`folder:${folder}`);

  const headings = [...String(content || "").matchAll(/^#{1,3}\s+(.+)$/gm)]
    .slice(0, 10)
    .map((match) => match[1])
    .join(" ");
  const source = `${doc.title || ""} ${headings}`;
  for (const raw of source.split(/[^\p{L}\p{N}_-]+/gu)) {
    const token = normalizeGraphToken(raw);
    if (token.length < 2 || /^\d+$/.test(token) || graphStopWords.has(token)) continue;
    tokens.add(`kw:${token}`);
    if (tokens.size >= 24) break;
  }
  return [...tokens];
}

function pushGraphBucket(buckets, token, relPath) {
  if (!token || !relPath) return;
  if (!buckets.has(token)) buckets.set(token, []);
  const bucket = buckets.get(token);
  if (!bucket.includes(relPath) && bucket.length < 24) bucket.push(relPath);
}

function addVaultGraphEdge(edgeMap, degree, source, target, reason, weight = 1) {
  if (!source || !target || source === target) return;
  const [a, b] = [source, target].sort((left, right) => left.localeCompare(right, "ko"));
  const key = `${a}<->${b}`;
  const existing = edgeMap.get(key);
  if (existing) {
    existing.weight = Math.min(10, (existing.weight || 1) + weight);
    if (reason && !existing.reasons.includes(reason)) existing.reasons.push(reason);
  } else {
    edgeMap.set(key, { source: a, target: b, weight, reasons: reason ? [reason] : [] });
  }
  degree.set(source, (degree.get(source) || 0) + weight);
  degree.set(target, (degree.get(target) || 0) + weight);
}

function vaultGraphReasonLabel(reason = "") {
  const value = String(reason || "");
  if (value === "link") return "문서 링크";
  if (value.startsWith("tag:")) return `#${value.slice(4)}`;
  if (value.startsWith("folder:")) return `폴더: ${value.slice(7)}`;
  if (value.startsWith("kw:")) return `키워드: ${value.slice(3)}`;
  return value || "연관";
}

function relatedVaultDocs(relPath, edgeMap, docsByRelPath, limit = 3) {
  const rows = [];
  for (const edge of edgeMap.values()) {
    if (edge.source !== relPath && edge.target !== relPath) continue;
    const otherRelPath = edge.source === relPath ? edge.target : edge.source;
    const doc = docsByRelPath.get(otherRelPath);
    if (!doc) continue;
    rows.push({
      title: doc.title,
      relPath: doc.relPath,
      displayPath: displayReportPath(doc.relPath),
      folder: doc.folder,
      weight: edge.weight || 1,
      reasons: (edge.reasons || []).map(vaultGraphReasonLabel).slice(0, 3)
    });
  }
  return rows
    .sort((a, b) => b.weight - a.weight || (docsByRelPath.get(b.relPath)?.mtimeMs || 0) - (docsByRelPath.get(a.relPath)?.mtimeMs || 0))
    .slice(0, Math.max(0, Math.min(8, Number(limit) || 3)));
}

function isLowValueVaultOverviewDoc(doc) {
  const relPath = String(doc?.relPath || "");
  const title = `${doc?.title || ""} ${path.basename(relPath, ".md")}`;
  const autoGenerated = /(^|\/)50_Outputs\/(YOMI Office|YOMI AI|Web Office)\//i.test(relPath)
    || (doc?.tags || []).some((tag) => ["auto-asset", "personal-office", "yomi-office", "yomi-ai"].includes(normalizeGraphToken(tag)));
  return autoGenerated && isTrivialAutoSaveInput(title);
}

function topEntries(map, limit = 12) {
  return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko")).slice(0, limit).map(([label, count]) => ({ label, count }));
}

function normalizeForSearch(text) {
  return String(text || "").normalize("NFKC").toLowerCase();
}

function tokenizeSearchQuery(query) {
  return [...new Set(normalizeForSearch(query).split(/[^\p{L}\p{N}#_-]+/gu).map((part) => part.trim()).filter((part) => part.length >= 2))].slice(0, 12);
}

function makeVaultExcerpt(content, terms, maxLength = 320) {
  const source = String(content || "").replace(/\s+/g, " ").trim();
  const lower = normalizeForSearch(source);
  let index = terms.map((term) => lower.indexOf(term)).find((value) => value >= 0);
  if (index == null || index < 0) index = 0;
  const start = Math.max(0, index - Math.floor(maxLength / 3));
  return `${start > 0 ? "..." : ""}${source.slice(start, start + maxLength).trim()}${start + maxLength < source.length ? "..." : ""}`;
}

function scoreVaultDocument(relPath, content, terms) {
  const rel = normalizeForSearch(relPath);
  const body = normalizeForSearch(content);
  let score = 0;
  for (const term of terms) {
    if (rel.includes(term)) score += 12;
    if (body.includes(term)) score += 4;
  }
  return score;
}

async function searchVaultMarkdown(query, limit = 6) {
  const vaultRoot = await findVaultRoot();
  const cleanQuery = String(query || "").trim();
  if (!vaultRoot) return { connected: false, query: cleanQuery, results: [] };
  const terms = tokenizeSearchQuery(cleanQuery);
  if (!terms.length) return { connected: true, query: cleanQuery, results: [] };
  const files = (await collectMarkdownFiles(vaultRoot, vaultRoot)).filter((file) => !isSensitiveVaultPath(file.relPath)).sort((a, b) => b.mtimeMs - a.mtimeMs);
  const results = [];
  for (const file of files.slice(0, 600)) {
    let content = "";
    try {
      content = (await readFile(file.fullPath, "utf8")).slice(0, 100000);
    } catch {
      continue;
    }
    const score = scoreVaultDocument(file.relPath, content, terms);
    if (score <= 0) continue;
    results.push({
      title: reportTitleFromPath(file.relPath),
      relPath: file.relPath,
      displayPath: displayReportPath(file.relPath),
      excerpt: makeVaultExcerpt(content, terms),
      score
    });
  }
  results.sort((a, b) => b.score - a.score);
  return { connected: true, query: cleanQuery, results: results.slice(0, Math.max(1, Math.min(12, limit))) };
}

const ragIndexVersion = 2;
const ragChunkTargetTokens = 650;
const ragChunkOverlapTokens = 80;
const ragAutoRefreshIntervalMs = 45 * 1000;
const ragMaxEmbeddingBatch = 64;

const ragStopWords = new Set([
  "the", "and", "for", "with", "from", "this", "that", "are", "was", "were", "you", "your",
  "그리고", "또는", "있는", "없는", "합니다", "하는", "으로", "에서", "에게", "부터", "까지",
  "요미", "yomi", "ai", "vault", "문서", "작업", "보고서", "정리", "내용", "결과"
]);

function defaultRagIndex(vaultRoot = "") {
  return {
    version: ragIndexVersion,
    vaultRoot,
    generatedAt: "",
    lastIndexedAt: "",
    embedding: { mode: "bm25_keyword", provider: "", model: "", dimension: 0, fallbackReason: "" },
    stats: { documentCount: 0, chunkCount: 0, changedDocumentCount: 0, removedDocumentCount: 0, excludedDocumentCount: 0 },
    documents: [],
    chunks: []
  };
}

async function readRagIndex() {
  if (!(await exists(ragIndexPath))) return defaultRagIndex();
  const index = await readJson(ragIndexPath, defaultRagIndex());
  if (!index || typeof index !== "object" || index.version !== ragIndexVersion) return defaultRagIndex();
  return {
    ...defaultRagIndex(index.vaultRoot || ""),
    ...index,
    embedding: { ...defaultRagIndex().embedding, ...(index.embedding || {}) },
    stats: { ...defaultRagIndex().stats, ...(index.stats || {}) },
    documents: Array.isArray(index.documents) ? index.documents : [],
    chunks: Array.isArray(index.chunks) ? index.chunks : []
  };
}

async function writeRagIndex(index) {
  await writeJsonFile(ragIndexPath, index);
}

function estimateTokenCount(text) {
  const value = String(text || "");
  const words = value.split(/\s+/).filter(Boolean).length;
  return Math.max(words, Math.ceil(value.length / 3.2));
}

function hashText(text) {
  return createHash("sha256").update(String(text || ""), "utf8").digest("hex");
}

function cleanRagText(content) {
  return stripMarkdownFrontmatter(content)
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/[#>*_`|]+/g, " ")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function chunkMarkdownForRag(content) {
  const text = cleanRagText(content);
  if (!text) return [];
  const paragraphs = text.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean);
  const chunks = [];
  let current = [];
  let currentTokens = 0;
  const flush = () => {
    if (!current.length) return;
    const chunk = current.join("\n\n").trim();
    if (chunk) chunks.push(chunk);
    const overlapChars = Math.max(240, Math.floor(ragChunkOverlapTokens * 3.2));
    const tail = chunk.slice(-overlapChars).trim();
    current = tail ? [tail] : [];
    currentTokens = tail ? estimateTokenCount(tail) : 0;
  };
  for (const paragraph of paragraphs) {
    const tokens = estimateTokenCount(paragraph);
    if (tokens > ragChunkTargetTokens) {
      flush();
      const stepChars = Math.max(1200, Math.floor((ragChunkTargetTokens - ragChunkOverlapTokens) * 3.2));
      const windowChars = Math.max(stepChars + 240, Math.floor(ragChunkTargetTokens * 3.2));
      for (let start = 0; start < paragraph.length; start += stepChars) {
        const piece = paragraph.slice(start, start + windowChars).trim();
        if (piece) chunks.push(piece);
      }
      current = [];
      currentTokens = 0;
      continue;
    }
    if (currentTokens + tokens > ragChunkTargetTokens && current.length) flush();
    current.push(paragraph);
    currentTokens += tokens;
  }
  flush();
  return chunks.filter((chunk) => chunk.length >= 80).slice(0, 200);
}

function tokenizeRagText(text, maxTerms = 2400) {
  const tokens = normalizeForSearch(text)
    .split(/[^\p{L}\p{N}_#/-]+/gu)
    .map((item) => item.replace(/^#/, "").trim())
    .filter((item) => item.length >= 2 && !/^\d+$/.test(item) && !ragStopWords.has(item));
  return tokens.slice(0, maxTerms);
}

function termFrequency(tokens) {
  const freq = {};
  for (const token of tokens) freq[token] = (freq[token] || 0) + 1;
  return freq;
}

function embeddingConfigFromEnv() {
  if (process.env.OPENAI_EMBEDDING_API_KEY) {
    return { provider: "openai", model: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small", key: process.env.OPENAI_EMBEDDING_API_KEY };
  }
  if (process.env.VOYAGE_API_KEY) {
    return { provider: "voyage", model: process.env.VOYAGE_EMBEDDING_MODEL || "voyage-3-lite", key: process.env.VOYAGE_API_KEY };
  }
  if (process.env.COHERE_API_KEY) {
    return { provider: "cohere", model: process.env.COHERE_EMBEDDING_MODEL || "embed-multilingual-v3.0", key: process.env.COHERE_API_KEY };
  }
  return null;
}

async function fetchJson(url, options = {}, timeoutMs = 60000) {
  if (typeof fetch !== "function") throw new Error("현재 Node 런타임에서 fetch를 사용할 수 없습니다.");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const text = await response.text();
    let body = {};
    try {
      body = text ? JSON.parse(text) : {};
    } catch {
      body = { raw: text.slice(0, 500) };
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${body.error?.message || body.message || body.raw || "request failed"}`);
    return body;
  } finally {
    clearTimeout(timer);
  }
}

async function embedTextsWithProvider(texts, config, inputType = "document") {
  const rows = texts.map((text) => String(text || "").slice(0, 8000));
  if (!rows.length) return [];
  if (config.provider === "openai") {
    const body = await fetchJson("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${config.key}` },
      body: JSON.stringify({ model: config.model, input: rows })
    });
    return (body.data || []).sort((a, b) => a.index - b.index).map((item) => item.embedding);
  }
  if (config.provider === "voyage") {
    const body = await fetchJson("https://api.voyageai.com/v1/embeddings", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${config.key}` },
      body: JSON.stringify({ model: config.model, input: rows, input_type: inputType === "query" ? "query" : "document" })
    });
    return (body.data || []).map((item) => item.embedding);
  }
  if (config.provider === "cohere") {
    const body = await fetchJson("https://api.cohere.com/v1/embed", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${config.key}` },
      body: JSON.stringify({ model: config.model, texts: rows, input_type: inputType === "query" ? "search_query" : "search_document" })
    });
    return body.embeddings || [];
  }
  throw new Error(`지원하지 않는 임베딩 제공자: ${config.provider}`);
}

async function embedChunkBatch(chunks, config, options = {}) {
  const maxChunks = Math.max(1, Number(options.maxChunks || process.env.YOMI_AI_RAG_MAX_EMBED_CHUNKS || 600));
  const targets = chunks.slice(0, maxChunks);
  for (let offset = 0; offset < targets.length; offset += ragMaxEmbeddingBatch) {
    const batch = targets.slice(offset, offset + ragMaxEmbeddingBatch);
    const embeddings = await embedTextsWithProvider(batch.map((chunk) => chunk.text), config, "document");
    embeddings.forEach((embedding, index) => {
      if (!Array.isArray(embedding)) return;
      batch[index].embedding = embedding;
      batch[index].embeddingProvider = config.provider;
      batch[index].embeddingModel = config.model;
    });
  }
  return { embedded: targets.filter((chunk) => Array.isArray(chunk.embedding)).length, skippedByLimit: Math.max(0, chunks.length - targets.length) };
}

function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return 0;
  let dot = 0;
  let aMag = 0;
  let bMag = 0;
  for (let index = 0; index < a.length; index += 1) {
    const av = Number(a[index]) || 0;
    const bv = Number(b[index]) || 0;
    dot += av * bv;
    aMag += av * av;
    bMag += bv * bv;
  }
  return aMag && bMag ? dot / (Math.sqrt(aMag) * Math.sqrt(bMag)) : 0;
}

function buildDocumentFrequency(chunks) {
  const df = {};
  for (const chunk of chunks) {
    for (const term of Object.keys(chunk.termFreq || {})) df[term] = (df[term] || 0) + 1;
  }
  return df;
}

function bm25ScoreChunk(chunk, queryTerms, docFreq, totalChunks, avgLength) {
  const freq = chunk.termFreq || {};
  const length = Number(chunk.length || 1);
  const k1 = 1.4;
  const b = 0.72;
  let score = 0;
  for (const term of queryTerms) {
    const tf = Number(freq[term] || 0);
    if (!tf) continue;
    const df = Number(docFreq[term] || 0);
    const idf = Math.log(1 + (totalChunks - df + 0.5) / (df + 0.5));
    score += idf * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (length / Math.max(1, avgLength)))));
  }
  const rel = normalizeForSearch(`${chunk.relPath || ""} ${chunk.title || ""}`);
  for (const term of queryTerms) if (rel.includes(term)) score += 0.8;
  return score;
}

function publicRagResult(row, mode) {
  return {
    title: row.title,
    relPath: row.relPath,
    displayPath: displayReportPath(row.relPath),
    chunkIndex: row.chunkIndex,
    excerpt: row.excerpt,
    score: Number(row.score.toFixed(4)),
    keywordScore: Number((row.keywordScore || 0).toFixed(4)),
    semanticScore: Number((row.semanticScore || 0).toFixed(4)),
    mode
  };
}

async function buildRagIndex(options = {}) {
  if (ragRuntime.indexingPromise) return await ragRuntime.indexingPromise;
  ragRuntime.indexingPromise = (async () => {
    const startedAt = new Date().toISOString();
    const vaultRoot = await findVaultRoot();
    if (!vaultRoot) {
      const empty = defaultRagIndex();
      await writeRagIndex(empty);
      return { ok: false, connected: false, reason: "Vault 경로를 찾지 못했습니다.", index: empty };
    }
    const force = options.force === true;
    const allowEmbeddings = options.embeddings !== false && options.allowEmbeddings !== false;
    const provider = allowEmbeddings ? embeddingConfigFromEnv() : null;
    const previous = await readRagIndex();
    const previousDocs = previous.vaultRoot === vaultRoot ? new Map(previous.documents.map((doc) => [doc.relPath, doc])) : new Map();
    const previousChunks = previous.vaultRoot === vaultRoot ? new Map(previous.chunks.map((chunk) => [chunk.id, chunk])) : new Map();
    const files = (await collectMarkdownFiles(vaultRoot, vaultRoot)).filter((file) => !isSensitiveVaultPath(file.relPath));
    const currentRelPaths = new Set();
    const documents = [];
    const chunks = [];
    let changedDocumentCount = 0;
    let excludedDocumentCount = 0;

    for (const file of files) {
      const info = await stat(file.fullPath);
      let content = "";
      try {
        content = await readFile(file.fullPath, "utf8");
      } catch {
        continue;
      }
      const qualityGate = ragQualityGate(file.relPath, content);
      if (!qualityGate.include) {
        excludedDocumentCount += 1;
        continue;
      }
      currentRelPaths.add(file.relPath);
      const previousDoc = previousDocs.get(file.relPath);
      const previousDocChunks = previousDoc ? (previousDoc.chunkIds || []).map((id) => previousChunks.get(id)).filter(Boolean) : [];
      if (!force && previousDoc && previousDoc.mtimeMs === info.mtimeMs && previousDoc.size === info.size && previousDocChunks.length) {
        documents.push(previousDoc);
        chunks.push(...previousDocChunks);
        continue;
      }
      changedDocumentCount += 1;
      const title = qualityGate.title || markdownTitle(content, reportTitleFromPath(file.relPath));
      const tags = extractMarkdownTags(content);
      const textChunks = chunkMarkdownForRag(content);
      const chunkIds = [];
      textChunks.forEach((text, index) => {
        const id = `${hashText(file.relPath).slice(0, 12)}-${index}`;
        const terms = tokenizeRagText(`${title} ${file.relPath} ${text}`);
        const chunk = {
          id,
          relPath: file.relPath,
          title,
          chunkIndex: index,
          text,
          hash: hashText(text),
          length: terms.length || estimateTokenCount(text),
          termFreq: termFrequency(terms)
        };
        chunkIds.push(id);
        chunks.push(chunk);
      });
      documents.push({
        relPath: file.relPath,
        title,
        mtimeMs: info.mtimeMs,
        size: info.size,
        hash: hashText(content),
        tags,
        quality: qualityGate.quality,
        rag: true,
        chunkCount: chunkIds.length,
        chunkIds
      });
    }

    const removedDocumentCount = previous.vaultRoot === vaultRoot ? previous.documents.filter((doc) => !currentRelPaths.has(doc.relPath)).length : 0;
    const embedding = {
      mode: "bm25_keyword",
      provider: "",
      model: "",
      dimension: 0,
      fallbackReason: provider ? "" : (allowEmbeddings ? "임베딩 API 키가 없어 BM25+키워드 하이브리드로 인덱싱했습니다." : "요청에 따라 임베딩 호출 없이 BM25+키워드 하이브리드로 인덱싱했습니다.")
    };
    if (provider) {
      const needsEmbedding = chunks.filter((chunk) => chunk.embeddingProvider !== provider.provider || chunk.embeddingModel !== provider.model || !Array.isArray(chunk.embedding));
      try {
        const embedded = await embedChunkBatch(needsEmbedding, provider, options);
        const first = chunks.find((chunk) => Array.isArray(chunk.embedding));
        embedding.mode = "semantic_hybrid";
        embedding.provider = provider.provider;
        embedding.model = provider.model;
        embedding.dimension = first?.embedding?.length || 0;
        embedding.fallbackReason = embedded.skippedByLimit ? `임베딩 상한으로 ${embedded.skippedByLimit}개 청크는 BM25 검색만 사용합니다.` : "";
      } catch (error) {
        embedding.fallbackReason = `임베딩 실패로 BM25+키워드 검색으로 폴백했습니다: ${error instanceof Error ? error.message : String(error)}`;
      }
    }

    const index = {
      version: ragIndexVersion,
      vaultRoot,
      generatedAt: startedAt,
      lastIndexedAt: new Date().toISOString(),
      embedding,
      stats: { documentCount: documents.length, chunkCount: chunks.length, changedDocumentCount, removedDocumentCount, excludedDocumentCount },
      documents: documents.sort((a, b) => a.relPath.localeCompare(b.relPath, "ko")),
      chunks
    };
    await writeRagIndex(index);
    ragRuntime.dirty = false;
    ragRuntime.lastAutoRefresh = Date.now();
    return { ok: true, connected: true, index, stats: index.stats, embedding: index.embedding };
  })();
  try {
    return await ragRuntime.indexingPromise;
  } finally {
    ragRuntime.indexingPromise = null;
  }
}

async function ensureRagWatcher(vaultRoot = "") {
  const root = vaultRoot || await findVaultRoot();
  if (!root || ragRuntime.watcherRoot === root) return;
  if (ragRuntime.watcher) {
    try { ragRuntime.watcher.close(); } catch { /* ignore */ }
  }
  ragRuntime.watcher = null;
  ragRuntime.watcherRoot = root;
  try {
    ragRuntime.watcher = watch(root, { recursive: true }, (_eventType, filename) => {
      if (filename && !String(filename).toLowerCase().endsWith(".md")) return;
      ragRuntime.dirty = true;
      if (ragRuntime.watchTimer) clearTimeout(ragRuntime.watchTimer);
      ragRuntime.watchTimer = setTimeout(() => {
        buildRagIndex({ force: false, embeddings: true, reason: "watch" }).catch((error) => recordWorkflowError("RAG 증분 인덱싱", error instanceof Error ? error.message : String(error)));
      }, 1800);
    });
  } catch (error) {
    recordWorkflowError("RAG 파일 감시", error instanceof Error ? error.message : String(error));
  }
}

async function ensureRagIndexFresh(options = {}) {
  const vaultRoot = await findVaultRoot();
  if (!vaultRoot) return defaultRagIndex();
  await ensureRagWatcher(vaultRoot);
  const current = await readRagIndex();
  const stale = current.vaultRoot !== vaultRoot || !current.lastIndexedAt || ragRuntime.dirty || Date.now() - ragRuntime.lastAutoRefresh > ragAutoRefreshIntervalMs;
  if (stale) {
    const result = await buildRagIndex({ force: false, embeddings: options.embeddings !== false });
    return result.index || await readRagIndex();
  }
  return current;
}

async function searchRagIndex(query, limit = 6, options = {}) {
  const cleanQuery = String(query || "").trim();
  const vaultRoot = await findVaultRoot();
  if (!vaultRoot) return { ok: true, connected: false, query: cleanQuery, mode: "disconnected", results: [], index: defaultRagIndex() };
  const index = options.index || await ensureRagIndexFresh({ embeddings: options.embeddings !== false });
  const chunks = Array.isArray(index.chunks) ? index.chunks : [];
  const queryTerms = tokenizeRagText(cleanQuery, 40);
  if (!cleanQuery || !chunks.length || !queryTerms.length) return { ok: true, connected: true, query: cleanQuery, mode: index.embedding?.mode || "bm25_keyword", results: [], index };
  const docFreq = buildDocumentFrequency(chunks);
  const avgLength = chunks.reduce((sum, chunk) => sum + Number(chunk.length || 0), 0) / Math.max(1, chunks.length);
  let queryEmbedding = null;
  const provider = index.embedding?.mode === "semantic_hybrid" ? embeddingConfigFromEnv() : null;
  if (provider && provider.provider === index.embedding.provider && provider.model === index.embedding.model) {
    try {
      const embeddings = await embedTextsWithProvider([cleanQuery], provider, "query");
      queryEmbedding = embeddings[0] || null;
    } catch (error) {
      recordWorkflowError("RAG 쿼리 임베딩", error instanceof Error ? error.message : String(error));
    }
  }
  const mode = queryEmbedding ? "semantic_hybrid" : "bm25_keyword";
  const scored = chunks.map((chunk) => {
    const keywordScore = bm25ScoreChunk(chunk, queryTerms, docFreq, chunks.length, avgLength);
    const semanticScore = queryEmbedding && Array.isArray(chunk.embedding) ? Math.max(0, cosineSimilarity(queryEmbedding, chunk.embedding)) : 0;
    const score = keywordScore + (semanticScore ? semanticScore * 8 : 0);
    return {
      title: chunk.title || reportTitleFromPath(chunk.relPath),
      relPath: chunk.relPath,
      chunkIndex: chunk.chunkIndex,
      excerpt: makeVaultExcerpt(chunk.text, queryTerms, 420),
      score,
      keywordScore,
      semanticScore
    };
  }).filter((row) => row.score > 0);
  scored.sort((a, b) => b.score - a.score);
  const deduped = selectDiverseRagRows(scored, limit).map((row) => publicRagResult(row, mode));
  return { ok: true, connected: true, query: cleanQuery, mode, embedding: index.embedding, stats: index.stats, results: deduped, index };
}

function selectDiverseRagRows(rows = [], limit = 6) {
  const max = Math.max(1, Math.min(20, Number(limit || 6)));
  const selected = [];
  const selectedChunks = new Set();
  const selectedDocs = new Set();
  const addRow = (row) => {
    const chunkKey = `${row.relPath || ""}:${row.chunkIndex ?? ""}`;
    if (selectedChunks.has(chunkKey)) return false;
    selectedChunks.add(chunkKey);
    selectedDocs.add(String(row.relPath || chunkKey));
    selected.push(row);
    return selected.length >= max;
  };
  for (const row of rows) {
    const docKey = String(row.relPath || `${row.chunkIndex ?? ""}`);
    if (selectedDocs.has(docKey)) continue;
    if (addRow(row)) return selected;
  }
  return selected;
}

function publicRagSearchResponse(search = {}) {
  return {
    ok: search.ok !== false,
    connected: search.connected !== false,
    query: search.query || "",
    mode: search.mode || "",
    embedding: search.embedding || null,
    stats: search.stats || null,
    results: Array.isArray(search.results) ? search.results : []
  };
}

async function buildRagStatus() {
  const vaultRoot = await findVaultRoot();
  if (!vaultRoot) return { connected: false, documentCount: 0, chunkCount: 0, lastIndexedAt: "", embeddingMode: "disconnected", provider: "", model: "", dirty: false };
  const index = await ensureRagIndexFresh({ embeddings: true });
  const valid = index.vaultRoot === vaultRoot;
  return {
    connected: true,
    path: vaultRoot,
    documentCount: valid ? index.stats?.documentCount || 0 : 0,
    chunkCount: valid ? index.stats?.chunkCount || 0 : 0,
    changedDocumentCount: valid ? index.stats?.changedDocumentCount || 0 : 0,
    removedDocumentCount: valid ? index.stats?.removedDocumentCount || 0 : 0,
    excludedDocumentCount: valid ? index.stats?.excludedDocumentCount || 0 : 0,
    lastIndexedAt: valid ? index.lastIndexedAt || "" : "",
    embeddingMode: valid ? index.embedding?.mode || "bm25_keyword" : "not_indexed",
    provider: valid ? index.embedding?.provider || "" : "",
    model: valid ? index.embedding?.model || "" : "",
    fallbackReason: valid ? index.embedding?.fallbackReason || "" : "아직 인덱싱되지 않았습니다.",
    dirty: ragRuntime.dirty || !valid
  };
}

async function buildRagApiState() {
  const status = await buildRagStatus();
  const index = await readRagIndex();
  const valid = status.connected && index.vaultRoot === status.path;
  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    status,
    connected: status.connected,
    path: status.path || "",
    stats: valid ? index.stats || {} : {},
    embedding: valid ? index.embedding || {} : {},
    documentCount: status.documentCount || 0,
    chunkCount: status.chunkCount || 0,
    lastIndexedAt: status.lastIndexedAt || "",
    dirty: Boolean(status.dirty),
    endpoints: {
      status: "GET /api/rag",
      reindex: "POST /api/rag 또는 POST /api/rag/index",
      search: "GET /api/rag/search?q=&k="
    }
  };
}

async function buildRagExclusionsState(limit = 30) {
  const vaultRoot = await findVaultRoot();
  if (!vaultRoot) {
    return { ok: true, connected: false, path: "", totalMarkdown: 0, includedCount: 0, excludedCount: 0, exclusions: [] };
  }
  const files = (await collectMarkdownFiles(vaultRoot, vaultRoot))
    .filter((file) => !isSensitiveVaultPath(file.relPath))
    .sort((a, b) => b.mtimeMs - a.mtimeMs);
  const exclusions = [];
  let includedCount = 0;
  for (const file of files) {
    let content = "";
    try {
      content = await readFile(file.fullPath, "utf8");
    } catch {
      continue;
    }
    const gate = ragQualityGate(file.relPath, content);
    if (gate.include) {
      includedCount += 1;
      continue;
    }
    exclusions.push({
      title: gate.title || reportTitleFromPath(file.relPath),
      relPath: file.relPath,
      displayPath: displayReportPath(file.relPath),
      quality: gate.quality || "excluded",
      reason: gate.reason || "excluded",
      updatedAt: new Date(file.mtimeMs).toISOString()
    });
  }
  return {
    ok: true,
    connected: true,
    generatedAt: new Date().toISOString(),
    path: vaultRoot,
    totalMarkdown: files.length,
    includedCount,
    excludedCount: exclusions.length,
    exclusions: exclusions.slice(0, Math.max(1, Math.min(100, Number(limit) || 30)))
  };
}

function frontmatterArray(value = []) {
  return [...new Set((Array.isArray(value) ? value : []).map((item) => String(item || "").trim()).filter(Boolean))];
}

function cleanRagTags(tags = [], action = "promote") {
  const blocked = new Set(["no-rag", "quarantine", "test", "scratch", "junk"]);
  const rows = frontmatterArray(tags).filter((tag) => action === "quarantine" || !blocked.has(normalizeGraphToken(tag)));
  if (action === "promote") rows.push("verified", "rag-ready");
  if (action === "quarantine") rows.push("quarantine", "no-rag");
  return [...new Set(rows)].slice(0, 30);
}

function yamlFrontmatterLine(key, value) {
  if (Array.isArray(value)) return `${key}: [${frontmatterArray(value).map(yamlString).join(", ")}]`;
  if (typeof value === "boolean") return `${key}: ${value ? "true" : "false"}`;
  return `${key}: ${yamlString(value)}`;
}

function buildMarkdownWithFrontmatter(content, updates = {}) {
  const source = String(content || "");
  const match = source.match(/^---\s*\n([\s\S]*?)\n---\s*/);
  const body = match ? source.slice(match[0].length) : source;
  const current = parseMarkdownFrontmatter(source);
  const next = { ...current, ...updates };
  for (const [key, value] of Object.entries(next)) {
    if (value === "" || value == null || (Array.isArray(value) && !value.length)) delete next[key];
  }
  const preferred = ["type", "title", "created", "updated", "reviewed", "task", "quality", "rag", "verified", "quarantine_reason", "agents", "tags"];
  const keys = [...preferred, ...Object.keys(next).sort()].filter((key, index, arr) => Object.prototype.hasOwnProperty.call(next, key) && arr.indexOf(key) === index);
  return `---\n${keys.map((key) => yamlFrontmatterLine(key, next[key])).join("\n")}\n---\n\n${body.replace(/^\s+/, "")}`;
}

function updateRagQualityContent(relPath, content, action = "promote") {
  const now = new Date().toISOString();
  const meta = parseMarkdownFrontmatter(content);
  const tags = Array.isArray(meta.tags) ? meta.tags : extractMarkdownTags(content);
  if (action === "promote") {
    return buildMarkdownWithFrontmatter(content, {
      title: meta.title || markdownTitle(content, reportTitleFromPath(relPath)),
      updated: now,
      reviewed: now,
      quality: "verified",
      rag: true,
      verified: true,
      quarantine_reason: "",
      tags: cleanRagTags(tags, "promote")
    });
  }
  if (action === "quarantine") {
    return buildMarkdownWithFrontmatter(content, {
      title: meta.title || markdownTitle(content, reportTitleFromPath(relPath)),
      updated: now,
      reviewed: now,
      quality: "quarantine",
      rag: false,
      verified: false,
      quarantine_reason: "manual-review",
      tags: cleanRagTags(tags, "quarantine")
    });
  }
  throw new Error("Unknown RAG quality action");
}

async function updateRagExclusionState(input = {}) {
  const action = String(input.action || "").trim().toLowerCase();
  if (!["promote", "quarantine"].includes(action)) throw new Error("Unknown RAG quality action");
  const relPath = String(input.relPath || "").trim();
  if (!relPath) throw new Error("relPath is required");
  const doc = await resolveVaultMarkdownDocument(relPath);
  const before = ragQualityGate(doc.relPath, doc.content);
  const nextContent = updateRagQualityContent(doc.relPath, doc.content, action);
  const after = ragQualityGate(doc.relPath, nextContent);
  if (input.dryRun === true) {
    return { ok: true, dryRun: true, action, relPath: doc.relPath, before, after, needsReindex: action === "promote" || before.include !== after.include };
  }
  await writeFile(doc.fullPath, nextContent, "utf8");
  return {
    ok: true,
    action,
    relPath: doc.relPath,
    before: { include: before.include, reason: before.reason, quality: before.quality },
    after: { include: after.include, reason: after.reason, quality: after.quality },
    needsReindex: action === "promote" || before.include !== after.include,
    state: await buildRagExclusionsState(Number(input.limit || 30))
  };
}

function normalizeStyleProfile(input = {}) {
  const source = input && typeof input === "object" ? input : {};
  const list = (key) => {
    const value = Array.isArray(source[key]) ? source[key] : defaultStyleProfile[key];
    return value.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 12);
  };
  const memoryValue = Array.isArray(source.memory)
    ? source.memory
    : Array.isArray(source.longMemory)
      ? source.longMemory
      : defaultStyleProfile.memory;
  return {
    label: String(source.label || defaultStyleProfile.label),
    enabled: source.enabled !== false,
    voice: list("voice"),
    format: list("format"),
    avoid: list("avoid"),
    memory: memoryValue.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 20),
    updatedAt: String(source.updatedAt || "")
  };
}

async function readStyleProfile() {
  if (!(await exists(styleProfilePath))) return normalizeStyleProfile(defaultStyleProfile);
  return normalizeStyleProfile(await readJson(styleProfilePath, defaultStyleProfile));
}

async function writeStyleProfile(profile) {
  const normalized = normalizeStyleProfile({ ...profile, updatedAt: new Date().toISOString() });
  await writeJsonFile(styleProfilePath, normalized);
  return normalized;
}

function normalizeMemoryKey(value = "") {
  return String(value || "").normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
}

async function appendProfileMemory(items = []) {
  const incoming = normalizeStringList(items, 12).map((item) => compactLine(item, 180)).filter(Boolean);
  if (!incoming.length) return { ok: true, added: [], profile: await readStyleProfile() };
  const profile = await readStyleProfile();
  const seen = new Set((profile.memory || []).map(normalizeMemoryKey));
  const added = [];
  for (const item of incoming) {
    const key = normalizeMemoryKey(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    added.push(item);
  }
  if (!added.length) return { ok: true, added: [], profile };
  const profileNext = await writeStyleProfile({
    ...profile,
    memory: [...added, ...(profile.memory || [])].slice(0, 20)
  });
  return { ok: true, added, profile: profileNext };
}

function parseProfileList(value, fallback = []) {
  if (Array.isArray(value)) return value.map((item) => String(item || "").trim()).filter(Boolean);
  if (typeof value === "string") return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
  return fallback;
}

async function buildProfileState() {
  return { ok: true, generatedAt: new Date().toISOString(), profile: await readStyleProfile() };
}

async function updateProfileState(input = {}) {
  const action = String(input.action || "save").trim().toLowerCase();
  const current = await readStyleProfile();
  const next = action === "reset"
    ? normalizeStyleProfile(defaultStyleProfile)
    : normalizeStyleProfile({
      ...current,
      label: input.label ?? current.label,
      enabled: typeof input.enabled === "boolean" ? input.enabled : current.enabled,
      voice: parseProfileList(input.voice, current.voice),
      format: parseProfileList(input.format, current.format),
      avoid: parseProfileList(input.avoid, current.avoid),
      memory: parseProfileList(input.memory ?? input.longMemory, current.memory)
    });
  if (input.dryRun === true) return { ok: true, dryRun: true, profile: next };
  return { ok: true, profile: await writeStyleProfile(next) };
}

async function buildMemoryState() {
  const profile = await readStyleProfile();
  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    profile: { label: profile.label, enabled: profile.enabled, updatedAt: profile.updatedAt || "" },
    memory: profile.memory || [],
    count: (profile.memory || []).length,
    captureRules: publicAutomationRules()
  };
}

async function updateMemoryState(input = {}) {
  const action = String(input.action || "add").trim().toLowerCase();
  const current = await readStyleProfile();
  if (action === "add" || action === "append") {
    const items = input.items || input.memory || input.text || input.value || [];
    const result = await appendProfileMemory(Array.isArray(items) ? items : [items]);
    return { ok: true, added: result.added || [], memory: result.profile.memory || [], profile: result.profile };
  }
  if (action === "save" || action === "replace") {
    const memory = parseProfileList(input.memory || input.items || [], current.memory).slice(0, 20);
    const profile = await writeStyleProfile({ ...current, memory });
    return { ok: true, memory: profile.memory || [], profile };
  }
  if (action === "remove" || action === "delete") {
    const index = Number.isInteger(input.index) ? input.index : Number(input.index);
    const valueKey = normalizeMemoryKey(input.value || input.text || "");
    const memory = (current.memory || []).filter((item, itemIndex) => {
      if (Number.isInteger(index) && itemIndex === index) return false;
      if (valueKey && normalizeMemoryKey(item) === valueKey) return false;
      return true;
    });
    const profile = await writeStyleProfile({ ...current, memory });
    return { ok: true, memory: profile.memory || [], profile };
  }
  if (action === "clear") {
    const profile = await writeStyleProfile({ ...current, memory: [] });
    return { ok: true, memory: [], profile };
  }
  throw new Error("Unknown memory action");
}

function formatStyleProfilePrompt(profile) {
  if (!profile?.enabled) return "";
  return [
    "## 사용자 톤/스타일 프로필",
    `프로필: ${profile.label}`,
    "",
    "### 말투",
    ...profile.voice.map((item) => `- ${item}`),
    "",
    "### 형식",
    ...profile.format.map((item) => `- ${item}`),
    "",
    "### 피할 것",
    ...profile.avoid.map((item) => `- ${item}`),
    "",
    "### 장기 메모리",
    ...(profile.memory || []).map((item) => `- ${item}`)
  ].join("\n");
}

function contextTokenSet(text = "") {
  return new Set(String(text || "").normalize("NFKC").toLowerCase().split(/[^\p{L}\p{N}]+/u).map((item) => item.trim()).filter((item) => item.length >= 2));
}

function learnedSkillScore(skill, query = "") {
  const queryTokens = contextTokenSet(query);
  if (!queryTokens.size) return 1;
  const haystack = contextTokenSet([skill.label, skill.description, skill.instructions].join(" "));
  let score = 0;
  for (const token of queryTokens) if (haystack.has(token)) score += 2;
  const lowered = [skill.label, skill.description].join(" ").toLowerCase();
  for (const token of queryTokens) if (token.length >= 3 && lowered.includes(token)) score += 1;
  return score;
}

async function learnedSkillsForContext(query = "", limit = 4) {
  const config = normalizeSkillsConfig(await readJson(skillsConfigPath, { agentSkills: {}, tools: {} }));
  const assignedAgentsByTool = new Map();
  for (const [agentId, skillIds] of Object.entries(config.agentSkills || {})) {
    for (const toolId of Array.isArray(skillIds) ? skillIds : []) {
      if (!assignedAgentsByTool.has(toolId)) assignedAgentsByTool.set(toolId, []);
      assignedAgentsByTool.get(toolId).push(resolveAgent(agentId)?.name || agentId);
    }
  }
  return Object.entries(config.tools || {})
    .filter(([, tool]) => tool?.provider === "yomi-learning" && tool.enabled !== false && String(tool.instructions || "").trim())
    .map(([id, tool]) => ({
      id,
      label: tool.label || id,
      description: tool.description || "",
      instructions: tool.instructions || "",
      type: tool.type || "",
      agents: assignedAgentsByTool.get(id) || [],
      sourceCandidateId: tool.sourceCandidateId || "",
      score: learnedSkillScore({ label: tool.label || id, description: tool.description || "", instructions: tool.instructions || "" }, query)
    }))
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label, "ko"))
    .slice(0, Math.max(0, Math.min(8, Number(limit) || 4)));
}

function formatLearnedSkillsPrompt(skills = []) {
  if (!skills.length) return "";
  return [
    "## 자동 학습 스킬",
    "아래 스킬은 사용자가 대화에서 승인한 반복 업무 방식입니다. 현재 요청과 관련 있는 항목만 적용하고, 맞지 않으면 무시합니다.",
    "",
    ...skills.map((skill, index) => [
      `### 스킬 ${index + 1}. ${skill.label}`,
      skill.agents?.length ? `- 담당: ${skill.agents.join(", ")}` : "",
      skill.description ? `- 설명: ${skill.description}` : "",
      "",
      compactLine(skill.instructions, 900)
    ].filter(Boolean).join("\n"))
  ].join("\n\n");
}

function formatVaultContextPrompt(sources = []) {
  if (!sources.length) {
    return [
      "## 자동 Vault 참조",
      "관련 Vault 자산을 찾지 못했습니다. 사용자가 준 입력과 현재 역할에 근거해 진행합니다."
    ].join("\n");
  }
  return [
    "## 자동 Vault 참조",
    "아래 문서는 사용자의 기존 자산에서 자동으로 찾은 참고자료입니다. 직접 관련 있는 내용만 반영하고, 부족하면 부족하다고 밝힙니다.",
    "자료를 사용한 경우 산출물의 근거 출처에 제목과 Vault 경로를 남깁니다.",
    "",
    ...sources.map((item, index) => [
      `### 참고 ${index + 1}. ${item.title}`,
      `- 경로: ${item.displayPath || item.relPath}`,
      `- 점수: ${item.score}`,
      "",
      item.excerpt
    ].join("\n"))
  ].join("\n\n");
}

function publicContextSummary(context = {}) {
  const sources = context.sources || [];
  const learnedSkills = context.learnedSkills || [];
  return {
    profile: context.profile ? { label: context.profile.label, enabled: context.profile.enabled } : null,
    vaultConnected: Boolean(context.vaultConnected),
    rag: context.rag || null,
    sourceCount: sources.length,
    sources: sources.map((item) => ({
      title: item.title,
      relPath: item.relPath,
      displayPath: item.displayPath,
      score: item.score,
      excerpt: compactLine(item.excerpt || "", 260)
    })),
    learnedSkillCount: learnedSkills.length,
    learnedSkills: learnedSkills.map((skill) => ({ id: skill.id, label: skill.label, type: skill.type, agents: skill.agents, score: skill.score }))
  };
}

function compactContextSources(sources = [], limit = 5) {
  const items = selectUniqueSourceDocuments(sources, limit);
  return items.map((item, index) => ({
    rank: index + 1,
    title: String(item.title || "문서"),
    relPath: String(item.relPath || ""),
    displayPath: String(item.displayPath || item.relPath || ""),
    score: Number(item.score || 0),
    excerpt: compactLine(item.excerpt || "", 420)
  }));
}

function selectUniqueSourceDocuments(sources = [], limit = 5) {
  const items = Array.isArray(sources) ? sources : [];
  const max = Math.max(0, Math.min(8, Number(limit) || 5));
  const selected = [];
  const seenDocs = new Set();
  const seenChunks = new Set();
  const addItem = (item) => {
    const relPath = String(item.relPath || "");
    const chunkKey = `${relPath}:${item.chunkIndex ?? item.excerpt ?? ""}`;
    if (seenChunks.has(chunkKey)) return false;
    seenChunks.add(chunkKey);
    seenDocs.add(relPath || chunkKey);
    selected.push(item);
    return selected.length >= max;
  };
  for (const item of items) {
    const relPath = String(item.relPath || "");
    if (relPath && seenDocs.has(relPath)) continue;
    if (addItem(item)) break;
  }
  return selected;
}

function buildContextUsePlan(context = {}, query = "") {
  const sources = compactContextSources(context?.sources || [], 5);
  const embedding = context?.rag?.embedding || null;
  const embeddingLabel = embedding && typeof embedding === "object"
    ? [embedding.provider, embedding.model].filter(Boolean).join(":")
    : String(embedding || "");
  return {
    status: sources.length ? "ready" : "empty",
    query: compactLine(query || "", 180),
    mode: context?.rag?.mode || "unknown",
    embedding: embeddingLabel,
    sourceCount: sources.length,
    instructions: [
      "직접 관련 있는 Vault 근거만 사용한다.",
      "근거가 부족하면 부족하다고 밝히고 필요한 추가 자료를 질문한다.",
      "사용한 문서는 결과의 근거 출처에 제목과 경로를 남긴다.",
      "근거와 추정을 섞지 않는다."
    ],
    sources
  };
}

function formatContextUsePlan(contextUse = {}) {
  const sources = compactContextSources(contextUse.sources || [], 5);
  const header = [
    "## RAG 근거 사용 계획",
    `- 상태: ${contextUse.status || (sources.length ? "ready" : "empty")}`,
    contextUse.query ? `- 검색 기준: ${contextUse.query}` : "",
    `- 검색 모드: ${contextUse.mode || "unknown"}`,
    `- 연결 문서: ${sources.length}개`,
    "- 사용 규칙: 직접 관련 있는 근거만 쓰고, 사용한 문서는 근거 출처에 제목과 경로를 남긴다."
  ].filter(Boolean);
  if (!sources.length) {
    return [...header, "- 현재 연결된 Vault 근거가 없으므로 사용자 입력과 역할 기준으로 진행한다."].join("\n");
  }
  return [
    ...header,
    "",
    ...sources.map((item) => [
      `### 근거 ${item.rank}. ${item.title}`,
      `- 경로: ${item.displayPath || item.relPath}`,
      `- 점수: ${item.score}`
    ].filter(Boolean).join("\n"))
  ].join("\n");
}

function attachContextToOrchestrationJob(job, context, query = "") {
  const contextUse = buildContextUsePlan(context || {}, query);
  if (!job) return contextUse;
  job.context = context || job.context || null;
  job.contextUse = contextUse;
  job.capsule = {
    ...(job.capsule || {}),
    contextUse,
    materialBrief: {
      ...(job.capsule?.materialBrief || {}),
      ragQuery: contextUse.query || job.capsule?.materialBrief?.ragQuery || query || "",
      ragSources: contextUse.sources.map((item) => ({
        rank: item.rank,
        title: item.title,
        relPath: item.relPath,
        displayPath: item.displayPath,
        score: item.score
      }))
    }
  };
  job.plan = {
    ...(job.plan || {}),
    contextUse,
    subtasks: (job.plan?.subtasks || []).map((step) => ({
      ...step,
      contextUse: {
        status: contextUse.status,
        mode: contextUse.mode,
        sourceCount: contextUse.sourceCount,
        sources: contextUse.sources.slice(0, 3).map((item) => ({
          rank: item.rank,
          title: item.title,
          relPath: item.relPath,
          displayPath: item.displayPath,
          score: item.score
        }))
      }
    }))
  };
  job.subtasks = (job.subtasks || []).map((step) => ({
    ...step,
    contextUse: {
      status: contextUse.status,
      mode: contextUse.mode,
      sourceCount: contextUse.sourceCount,
      sources: contextUse.sources.slice(0, 3).map((item) => ({
        rank: item.rank,
        title: item.title,
        relPath: item.relPath,
        displayPath: item.displayPath,
        score: item.score
      }))
    }
  }));
  return contextUse;
}

async function buildPersonalContext(query, options = {}) {
  const profile = await readStyleProfile();
  const learnedSkills = await learnedSkillsForContext(query, options.skillLimit || 4);
  const rag = await searchRagIndex(query, options.limit || 4);
  const fallbackSearch = rag.results?.length ? null : await searchVaultMarkdown(query, options.limit || 4);
  const search = rag.results?.length ? rag : fallbackSearch;
  const sources = selectUniqueSourceDocuments(
    (search?.results || []).filter((item) => !isLowValueVaultOverviewDoc(item)),
    options.limit || 4
  );
  return {
    profile,
    vaultConnected: Boolean(search?.connected),
    rag: {
      mode: rag.mode,
      embedding: rag.embedding || null,
      stats: rag.stats || null
    },
    sources,
    learnedSkills,
    promptBlock: [
      formatStyleProfilePrompt(profile),
      formatLearnedSkillsPrompt(learnedSkills),
      formatVaultContextPrompt(sources)
    ].filter(Boolean).join("\n\n")
  };
}

async function listRecentReports(limit = 12) {
  const vaultRoot = await findVaultRoot();
  if (!vaultRoot) return { ok: true, reports: [] };
  const dirs = reportFolderNames.map((folderName) => path.join(vaultRoot, "50_Outputs", folderName));
  const files = (await Promise.all(dirs.map((dir) => collectMarkdownFiles(dir, vaultRoot)))).flat().filter((file) => !isSensitiveVaultPath(file.relPath));
  return {
    ok: true,
    reports: files.sort((a, b) => b.mtimeMs - a.mtimeMs).slice(0, limit).map((file) => ({
      title: reportTitleFromPath(file.relPath),
      relPath: file.relPath,
      displayPath: displayReportPath(file.relPath),
      created: new Date(file.mtimeMs).toLocaleString("ko-KR")
    }))
  };
}

async function buildVaultOverview(limit = 12) {
  const vaultRoot = await findVaultRoot();
  if (!vaultRoot) return { ok: true, connected: false, path: "", totalMarkdown: 0, recentDocs: [], categories: [], tags: [], graph: { nodes: [], edges: [] } };
  const files = (await collectMarkdownFiles(vaultRoot, vaultRoot)).filter((file) => !isSensitiveVaultPath(file.relPath)).sort((a, b) => b.mtimeMs - a.mtimeMs);
  const categories = new Map();
  const tags = new Map();
  const docs = [];
  const keyToRelPath = new Map();
  const relationBuckets = new Map();

  for (const file of files) {
    const title = reportTitleFromPath(file.relPath);
    const folder = vaultCategoryFromPath(file.relPath);
    categories.set(folder, (categories.get(folder) || 0) + 1);
    keyToRelPath.set(normalizeNoteKey(file.relPath), file.relPath);
    keyToRelPath.set(normalizeNoteKey(title), file.relPath);
    keyToRelPath.set(normalizeNoteKey(path.basename(file.relPath, ".md")), file.relPath);
    docs.push({ ...file, title, folder, links: [], tags: [], graphTokens: [] });
  }
  const docsByRelPath = new Map(docs.map((doc) => [doc.relPath, doc]));

  const scannedDocs = docs.slice(0, 700);
  for (const doc of scannedDocs) {
    let content = "";
    try {
      content = (await readFile(doc.fullPath, "utf8")).slice(0, 120000);
    } catch {
      continue;
    }
    doc.links = extractObsidianLinks(content);
    doc.tags = extractMarkdownTags(content);
    doc.graphTokens = graphRelationTokens(doc, content);
    for (const tag of doc.tags) tags.set(tag, (tags.get(tag) || 0) + 1);
    for (const token of doc.graphTokens) pushGraphBucket(relationBuckets, token, doc.relPath);
  }
  const overviewDocs = docs.filter((doc) => !isLowValueVaultOverviewDoc(doc));

  const edgeMap = new Map();
  const degree = new Map();
  for (const doc of scannedDocs) {
    for (const link of doc.links) {
      const targetKey = normalizeNoteKey(link);
      const targetRel = keyToRelPath.get(targetKey) || keyToRelPath.get(normalizeNoteKey(path.basename(targetKey)));
      if (!targetRel || targetRel === doc.relPath) continue;
      addVaultGraphEdge(edgeMap, degree, doc.relPath, targetRel, "link", 4);
    }
  }

  for (const [token, relPaths] of relationBuckets) {
    const uniqueRelPaths = [...new Set(relPaths)]
      .filter((relPath) => docsByRelPath.has(relPath))
      .sort((a, b) => (docsByRelPath.get(b)?.mtimeMs || 0) - (docsByRelPath.get(a)?.mtimeMs || 0))
      .slice(0, 8);
    if (uniqueRelPaths.length < 2) continue;
    const weight = token.startsWith("tag:") ? 3 : token.startsWith("folder:") ? 1 : 2;
    for (let index = 0; index < uniqueRelPaths.length - 1; index += 1) {
      const maxPairIndex = Math.min(uniqueRelPaths.length, index + 4);
      for (let pairIndex = index + 1; pairIndex < maxPairIndex; pairIndex += 1) {
        addVaultGraphEdge(edgeMap, degree, uniqueRelPaths[index], uniqueRelPaths[pairIndex], token, weight);
      }
    }
  }

  const graphDocs = overviewDocs
    .filter((doc) => (degree.get(doc.relPath) || 0) > 0)
    .sort((a, b) => (degree.get(b.relPath) || 0) - (degree.get(a.relPath) || 0) || b.mtimeMs - a.mtimeMs)
    .slice(0, 28);
  if (graphDocs.length < 10) {
    for (const doc of overviewDocs.slice(0, 10)) if (!graphDocs.some((item) => item.relPath === doc.relPath)) graphDocs.push(doc);
  }
  const graphIds = new Set(graphDocs.map((doc) => doc.relPath));
  const graphEdges = [...edgeMap.values()].filter((edge) => graphIds.has(edge.source) && graphIds.has(edge.target)).slice(0, 80);

  return {
    ok: true,
    connected: true,
    path: vaultRoot,
    totalMarkdown: files.length,
    recentDocs: overviewDocs.slice(0, Math.max(1, Math.min(30, limit))).map((doc) => ({
      title: doc.title,
      relPath: doc.relPath,
      displayPath: displayReportPath(doc.relPath),
      folder: doc.folder,
      tags: doc.tags.slice(0, 6),
      relatedDocs: relatedVaultDocs(doc.relPath, edgeMap, docsByRelPath, 3),
      created: new Date(doc.mtimeMs).toLocaleString("ko-KR")
    })),
    categories: topEntries(categories, 12),
    tags: topEntries(tags, 16),
    graph: {
      nodes: graphDocs.map((doc) => ({ id: doc.relPath, title: doc.title, folder: doc.folder, size: degree.get(doc.relPath) || 1, tags: doc.tags.slice(0, 4) })),
      edges: graphEdges.map((edge) => ({ ...edge, reasonLabels: (edge.reasons || []).map(vaultGraphReasonLabel).slice(0, 3) }))
    }
  };
}

function toolDisplayName(toolId, toolConfig = {}) {
  const defaults = { web_search: "웹검색", vault_search: "저장소검색", file_read: "파일읽기" };
  return toolConfig.label || defaults[toolId] || toolId;
}

function statusMeta(status) {
  return {
    normal: { label: "정상", tone: "ok" },
    key_required: { label: "키 필요", tone: "warn" },
    disconnected: { label: "미연결", tone: "bad" },
    disabled: { label: "비활성", tone: "muted" },
    unknown: { label: "확인 필요", tone: "warn" }
  }[status] || { label: status, tone: "muted" };
}

async function buildSkillsState() {
  const skillsConfig = await readJson(skillsConfigPath, { agentSkills: {}, tools: {} });
  const vaultRoot = await findVaultRoot();
  const agentSkills = skillsConfig.agentSkills && typeof skillsConfig.agentSkills === "object" ? skillsConfig.agentSkills : {};
  const agentDisabledSkills = skillsConfig.agentDisabledSkills && typeof skillsConfig.agentDisabledSkills === "object" ? skillsConfig.agentDisabledSkills : {};
  const agentEngines = skillsConfig.agentEngines && typeof skillsConfig.agentEngines === "object" ? skillsConfig.agentEngines : {};
  const toolsConfig = skillsConfig.tools && typeof skillsConfig.tools === "object" ? skillsConfig.tools : {};
  const tools = {};

  for (const [toolId, toolConfig] of Object.entries(toolsConfig)) {
    let status = "normal";
    let detail = "사용 가능";
    const envKeys = Array.isArray(toolConfig?.mcp?.envKeys) ? toolConfig.mcp.envKeys : [];
    if (toolConfig?.enabled === false) {
      status = "disabled";
      detail = "skills.json에서 비활성화됨";
    } else if (envKeys.length && envKeys.some((key) => !process.env[key])) {
      status = "key_required";
      detail = `${envKeys.join(", ")} 환경 변수가 필요합니다`;
    } else if (toolConfig.type === "vault_search" && !vaultRoot) {
      status = "disconnected";
      detail = "Vault 경로를 찾지 못했습니다";
    } else if (toolConfig.type === "file_read" && !(await exists(projectRoot))) {
      status = "disconnected";
      detail = "프로젝트 루트를 찾지 못했습니다";
    } else if (toolConfig.type === "vault_search") {
      detail = `Vault 연결됨: ${vaultRoot}`;
    } else if (toolConfig.type === "file_read") {
      detail = "프로젝트 파일 읽기 가능";
    }
    if (toolConfig.type === "file_write" && toolConfig?.enabled !== false) {
      if (!vaultRoot) {
        status = "disconnected";
        detail = "Vault 경로를 찾지 못해 쓰기를 막았습니다.";
      } else {
        const allowedPaths = Array.isArray(toolConfig.allowedPaths) && toolConfig.allowedPaths.length
          ? toolConfig.allowedPaths.join(", ")
          : toolConfig.scope || "Vault scoped outputs only";
        detail = `제한 쓰기 · ${allowedPaths} · 덮어쓰기 금지`;
      }
    }
    const meta = statusMeta(status);
    tools[toolId] = {
      id: toolId,
      label: toolDisplayName(toolId, toolConfig),
      type: toolConfig.type || toolId,
      provider: toolConfig.provider || "",
      mode: toolConfig.mode || "",
      mcp: toolConfig.mcp || null,
      scope: toolConfig.scope || "",
      allowedPaths: Array.isArray(toolConfig.allowedPaths) ? toolConfig.allowedPaths : [],
      blockedPaths: Array.isArray(toolConfig.blockedPaths) ? toolConfig.blockedPaths : [],
      requiresConfirmation: Boolean(toolConfig.requiresConfirmation),
      enabled: toolConfig?.enabled !== false,
      status,
      statusLabel: meta.label,
      tone: meta.tone,
      detail
    };
  }

  const agents = specialistRoles.map((agent) => {
    const skillIds = Array.isArray(agentSkills[agent.id]) ? agentSkills[agent.id] : [];
    const disabledIds = new Set(Array.isArray(agentDisabledSkills[agent.id]) ? agentDisabledSkills[agent.id].map(String) : []);
    return {
      id: agent.id,
      name: agent.name,
      role: agent.role,
      engine: engineMeta(agentEngines[agent.id] || defaultEngineForAgent(agent.id)),
      skills: skillIds.map((toolId) => {
        const skill = tools[toolId] || { id: toolId, label: toolId, enabled: true, status: "unknown", statusLabel: "확인 필요", tone: "warn" };
        if (!disabledIds.has(toolId)) return skill;
        const meta = statusMeta("disabled");
        return { ...skill, enabled: false, status: "disabled", statusLabel: meta.label, tone: meta.tone, disabledByAgent: true };
      })
    };
  });

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    engineOptions: Object.values(cliEngines),
    agents,
    tools: Object.values(tools),
    raw: { agentSkills, agentDisabledSkills, agentEngines, tools: toolsConfig }
  };
}

function normalizeSkillsConfig(config = {}) {
  const agentSkills = config.agentSkills && typeof config.agentSkills === "object" ? config.agentSkills : {};
  const agentDisabledSkills = config.agentDisabledSkills && typeof config.agentDisabledSkills === "object" ? config.agentDisabledSkills : {};
  const agentEngines = config.agentEngines && typeof config.agentEngines === "object" ? config.agentEngines : {};
  const tools = config.tools && typeof config.tools === "object" ? config.tools : {};
  return {
    ...config,
    agentSkills: Object.fromEntries(Object.entries(agentSkills).map(([agentId, skills]) => [agentId, Array.isArray(skills) ? [...skills] : []])),
    agentDisabledSkills: Object.fromEntries(Object.entries(agentDisabledSkills).map(([agentId, skills]) => [agentId, Array.isArray(skills) ? [...skills] : []])),
    agentEngines: Object.fromEntries(Object.entries(agentEngines).map(([agentId, engine]) => [agentId, normalizeEngineId(engine)])),
    tools: Object.fromEntries(Object.entries(tools).map(([toolId, toolConfig]) => [toolId, toolConfig && typeof toolConfig === "object" ? { ...toolConfig } : {}]))
  };
}

function removeAgentSkillMarker(map, agentId, toolId) {
  const current = Array.isArray(map[agentId]) ? map[agentId].map(String) : [];
  const next = current.filter((item) => item !== toolId);
  if (next.length) map[agentId] = next;
  else delete map[agentId];
}

function pruneSkillsConfig(config) {
  for (const [agentId, skills] of Object.entries(config.agentSkills)) {
    if (!Array.isArray(skills) || !skills.length) delete config.agentSkills[agentId];
  }
  for (const [agentId, skills] of Object.entries(config.agentDisabledSkills || {})) {
    if (!Array.isArray(skills) || !skills.length) delete config.agentDisabledSkills[agentId];
  }
  if (!Object.keys(config.agentDisabledSkills || {}).length) delete config.agentDisabledSkills;
  for (const [agentId, engine] of Object.entries(config.agentEngines || {})) {
    if (!specialistRoles.some((agent) => agent.id === agentId) || !cliEngines[normalizeEngineId(engine)]) delete config.agentEngines[agentId];
  }
  if (!Object.keys(config.agentEngines || {}).length) delete config.agentEngines;
}

function validateSkillEdit(config, agentId, toolId, needsAgent = true) {
  if (needsAgent && !specialistRoles.some((agent) => agent.id === agentId)) throw new Error("Unknown agent");
  if (!toolId || !Object.prototype.hasOwnProperty.call(config.tools, toolId)) throw new Error("Unknown tool");
}

async function updateSkillsConfig(input = {}) {
  const config = normalizeSkillsConfig(await readJson(skillsConfigPath, { agentSkills: {}, tools: {} }));
  const action = String(input.action || "");
  const agentId = String(input.agentId || "");
  const toolId = String(input.toolId || "");

  if (action === "add-agent-skill") {
    validateSkillEdit(config, agentId, toolId);
    const current = Array.isArray(config.agentSkills[agentId]) ? config.agentSkills[agentId].map(String) : [];
    config.agentSkills[agentId] = [...new Set([...current, toolId])];
    removeAgentSkillMarker(config.agentDisabledSkills, agentId, toolId);
  } else if (action === "remove-agent-skill") {
    validateSkillEdit(config, agentId, toolId);
    removeAgentSkillMarker(config.agentSkills, agentId, toolId);
    removeAgentSkillMarker(config.agentDisabledSkills, agentId, toolId);
  } else if (action === "set-agent-skill-enabled") {
    validateSkillEdit(config, agentId, toolId);
    const current = Array.isArray(config.agentSkills[agentId]) ? config.agentSkills[agentId].map(String) : [];
    if (!current.includes(toolId)) throw new Error("Agent does not have this skill");
    if (input.enabled === false) {
      const disabled = Array.isArray(config.agentDisabledSkills[agentId]) ? config.agentDisabledSkills[agentId].map(String) : [];
      config.agentDisabledSkills[agentId] = [...new Set([...disabled, toolId])];
    } else {
      removeAgentSkillMarker(config.agentDisabledSkills, agentId, toolId);
    }
  } else if (action === "set-tool-enabled") {
    validateSkillEdit(config, agentId, toolId, false);
    config.tools[toolId].enabled = input.enabled !== false;
  } else if (action === "set-agent-engine") {
    if (!specialistRoles.some((agent) => agent.id === agentId)) throw new Error("Unknown agent");
    config.agentEngines[agentId] = normalizeEngineId(input.engine, defaultEngineForAgent(agentId));
  } else {
    throw new Error("Unknown skill action");
  }

  pruneSkillsConfig(config);
  await writeFile(skillsConfigPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
  return await buildSkillsState();
}

async function detectLocalLlm() {
  return { available: true, provider: "codex-cli", model: codexCommand() };
}

function publicWorkflowRuntime() {
  const performance = readPerformanceLogSync();
  return {
    runCount: workflowRuntime.runCount,
    agentCounts: specialistRoles.map((agent) => ({ id: agent.id, name: agent.name, role: agent.role, count: workflowRuntime.agentTaskCounts[agent.id] || 0 })),
    statusCounts: { ...workflowRuntime.statusCounts },
    recentErrors: workflowRuntime.recentErrors.slice(0, 6),
    current: workflowRuntime.current,
    performance: performanceSummary(performance.records)
  };
}

async function buildOfficeState() {
  const vaultRoot = await findVaultRoot();
  const styleProfile = await readStyleProfile();
  const rag = await buildRagStatus();
  const reportDirs = vaultRoot ? reportFolderNames.map((folderName) => path.join(vaultRoot, "50_Outputs", folderName)) : [];
  const latest = (vaultRoot ? await Promise.all(reportDirs.map((dir) => latestMarkdownFile(dir))) : []).filter(Boolean).sort((a, b) => b.mtimeMs - a.mtimeMs)[0] || null;
  const counts = { autoCaptures: 0, knowledgeDrafts: 0, autoDigests: 0, dailyReviews: 0, webOfficeReports: 0 };
  const todayKey = new Date().toISOString().slice(0, 10);
  const statusCounts = workflowRuntime.statusCounts;
  const evaluatedTotal = (statusCounts.success || 0) + (statusCounts.rework || 0) + (statusCounts.failed || 0);
  const today = {
    date: todayKey,
    processed: workflowRuntime.runCount,
    reviewPassRate: evaluatedTotal ? Math.round(((statusCounts.success || 0) / evaluatedTotal) * 100) : null
  };
  if (vaultRoot) {
    counts.autoCaptures = await countMarkdownFiles(path.join(vaultRoot, "50_Outputs", "Auto Captures"));
    counts.knowledgeDrafts = await countMarkdownFiles(path.join(vaultRoot, "20_Knowledge", "Drafts"));
    counts.autoDigests = await countMarkdownFiles(path.join(vaultRoot, "20_Knowledge", "Auto Digest"));
    counts.dailyReviews = await countMarkdownFiles(path.join(vaultRoot, "00_Inbox", "Daily Reviews"));
    for (const dir of reportDirs) counts.webOfficeReports += await countMarkdownFiles(dir);
    today.processed = await countMarkdownFiles(path.join(vaultRoot, "50_Outputs", primaryReportFolder, todayKey));
  }
  return {
    generatedAt: new Date().toISOString(),
    mode: "cli-dual",
    llm: await detectLocalLlm(),
    codex: { available: true, command: codexCommand() },
    claude: { available: true, command: claudeCommand(), directCall: true, autoRoute: true },
    engines: {
      default: "codex",
      policy: "Codex CLI is the default. Claude Code CLI is used for long reasoning, writing, research synthesis, and review. Claude failures fall back to Codex as an engine fallback.",
      options: Object.values(cliEngines)
    },
    workflow: publicWorkflowRuntime(),
    skills: await buildSkillsState(),
    context: {
      autoRag: true,
      styleProfile: { label: styleProfile.label, enabled: styleProfile.enabled, memoryCount: Array.isArray(styleProfile.memory) ? styleProfile.memory.length : 0 },
      vaultContextLimit: 4,
      rag
    },
    vault: { connected: Boolean(vaultRoot), path: vaultRoot },
    rag,
    counts,
    today,
    lastReport: latest && vaultRoot ? (() => {
      const relPath = path.relative(vaultRoot, latest.fullPath).replace(/\\/g, "/");
      return { relPath, displayPath: displayReportPath(relPath) };
    })() : null
  };
}

function slugify(text) {
  return String(text || "office-report").normalize("NFKC").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 52).replace(/^-|-$/g, "") || "office-report";
}

function yamlString(value) {
  return JSON.stringify(String(value || ""));
}

function codexCommand() {
  const configured = process.env.YOMI_AI_CODEX_COMMAND || "codex";
  if (process.platform === "win32" && configured.toLowerCase() === "codex") {
    const nativeBinary = path.join(process.env.APPDATA || "", "npm", "node_modules", "@openai", "codex", "node_modules", "@openai", "codex-win32-x64", "vendor", "x86_64-pc-windows-msvc", "bin", "codex.exe");
    if (existsSync(nativeBinary)) return nativeBinary;
    return "codex.cmd";
  }
  return configured;
}

function claudeCommand() {
  return claudeCommandSpec().label;
}

function claudeCommandSpec() {
  const configured = process.env.YOMI_AI_CLAUDE_COMMAND || "claude";
  const normalized = configured.toLowerCase();
  if (process.platform === "win32" && (normalized === "claude" || normalized === "cc")) {
    const npmPs1 = path.join(process.env.APPDATA || "", "npm", "claude.ps1");
    if (existsSync(npmPs1)) {
      return {
        command: "powershell.exe",
        argsPrefix: ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", npmPs1],
        label: npmPs1
      };
    }
    const npmCmd = path.join(process.env.APPDATA || "", "npm", "claude.cmd");
    if (existsSync(npmCmd)) return { command: npmCmd, argsPrefix: [], label: npmCmd };
    return { command: "claude.cmd", argsPrefix: [], label: "claude.cmd" };
  }
  const command = normalized === "cc" ? "claude" : configured;
  return { command, argsPrefix: [], label: command };
}

function stripAnsi(text) {
  return String(text || "").replace(/\u001b\[[0-9;]*m/g, "").replace(/\r\n/g, "\n").trim();
}

function writePromptToChild(child, prompt, result) {
  if (!child?.stdin) return;
  child.stdin.on("error", (error) => {
    if (result && !result.error) result.error = error.message;
  });
  try {
    child.stdin.write(String(prompt || ""), "utf8");
    child.stdin.end();
  } catch (error) {
    if (result) result.error = error instanceof Error ? error.message : String(error);
    try { child.stdin.end(); } catch { /* ignore */ }
  }
}

function terminateChildProcess(child) {
  if (!child || child.killed) return;
  if (process.platform === "win32" && child.pid) {
    const result = spawnSync("taskkill.exe", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true });
    if (result.status === 0) return;
  }
  try { child.kill(); } catch { /* ignore */ }
}

function compactCliFailureDetail(text, maxLength = 320) {
  const raw = stripAnsi(text || "");
  if (!raw) return "";
  const lines = raw
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^(user|assistant|system)$|^--------$|^workdir:|^model:|^provider:|^approval:|^sandbox:|^reasoning|^session id:/i.test(line))
    .filter((line) => !/^너는 YOMI Office|^현재 단계는|^아래 작업캡슐|^사용자 톤|^## |^### |^\{|^\}|^\"/.test(line));
  const priority = lines.find((line) => /error|failed|auth|login|sandbox|permission|denied|timeout|unauthori[sz]ed|credential|not found|ENOENT/i.test(line))
    || lines.find((line) => line.length <= maxLength)
    || raw;
  return compactLine(priority, maxLength);
}

function codexFailureMessage(result, label = "Codex CLI 호출") {
  const stderr = stripAnsi(result?.stderr || "");
  const error = stripAnsi(result?.error || "");
  const rawDetail = stderr || error || `종료 코드 ${result?.exitCode ?? "unknown"}`;
  const detail = compactCliFailureDetail(rawDetail) || `종료 코드 ${result?.exitCode ?? "unknown"}`;
  if (/auth|login|sign.?in|unauthori[sz]ed|credential/i.test(rawDetail)) return `${label} 실패: 인증 상태를 확인해야 합니다. codex-cli 로그인 세션이 만료됐을 수 있습니다. (${detail})`;
  if (/timeout/i.test(detail)) return `${label} 실패: 응답 시간이 초과됐습니다. 작업을 더 작게 나눠 다시 시도하세요.`;
  if (/permission|sandbox|denied|access/i.test(rawDetail)) return `${label} 실패: 권한 또는 샌드박스 제한에 걸렸습니다. (${detail})`;
  if (/ENOENT|not found/i.test(rawDetail)) return `${label} 실패: codex-cli 실행 파일을 찾지 못했습니다. YOMI_AI_CODEX_COMMAND 설정을 확인하세요.`;
  return `${label} 실패: ${detail}`;
}

function claudeFailureMessage(result, label = "Claude Code CLI 호출") {
  const stderr = stripAnsi(result?.stderr || "");
  const stdout = stripAnsi(result?.output || "");
  const error = stripAnsi(result?.error || "");
  const rawDetail = stderr || stdout || error || `종료 코드 ${result?.exitCode ?? "unknown"}`;
  const detail = compactCliFailureDetail(rawDetail) || `종료 코드 ${result?.exitCode ?? "unknown"}`;
  if (/model/i.test(rawDetail) && /invalid|unknown|not found|not exist|not supported|unsupported|access/i.test(rawDetail)) return `${label} 실패: Claude 모델 설정을 확인해야 합니다. (${detail})`;
  if (/auth|login|sign.?in|unauthori[sz]ed|credential|api.?key/i.test(rawDetail)) return `${label} 실패: Claude Code 인증 상태를 확인해야 합니다. (${detail})`;
  if (/timeout/i.test(detail)) return `${label} 실패: 응답 시간이 초과됐습니다. 요청을 더 작게 나눠 다시 시도하세요.`;
  if (/permission|denied|access/i.test(rawDetail)) return `${label} 실패: Claude Code 권한 제한에 걸렸습니다. (${detail})`;
  if (/ENOENT|not found/i.test(rawDetail)) return `${label} 실패: claude 실행 파일을 찾지 못했습니다. YOMI_AI_CLAUDE_COMMAND 설정을 확인하세요.`;
  return `${label} 실패: ${detail}`;
}

async function runCodexPrompt(prompt, options = {}) {
  const command = codexCommand();
  const sandbox = options.sandbox || "read-only";
  const timeoutMs = Number(options.timeoutMs || codexPromptTimeoutMs);
  const outputDir = path.join(runtimeRoot, "cli");
  await mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `codex-last-${Date.now()}-${Math.random().toString(36).slice(2)}.md`);
  return await new Promise((resolve) => {
    const result = {
      ok: false,
      commandLabel: `${command} exec --sandbox ${sandbox} --output-last-message <runtime> - <stdin>`,
      output: "",
      stderr: "",
      exitCode: null,
      error: ""
    };
    const child = spawn(command, ["exec", "--sandbox", sandbox, "--output-last-message", outputPath, "-"], { cwd: projectRoot, shell: false, windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
    writePromptToChild(child, prompt, result);
    const timer = setTimeout(() => {
      result.error = `timeout after ${timeoutMs}ms`;
      terminateChildProcess(child);
    }, timeoutMs);
    child.stdout.on("data", (chunk) => { result.output = (result.output + chunk.toString()).slice(-maxCodexOutputBytes); });
    child.stderr.on("data", (chunk) => { result.stderr = (result.stderr + chunk.toString()).slice(-maxCodexOutputBytes); });
    child.on("error", (error) => {
      clearTimeout(timer);
      result.error = error.message;
      result.output = stripAnsi(result.output);
      result.stderr = stripAnsi(result.stderr);
      rm(outputPath, { force: true }).catch(() => {});
      resolve(result);
    });
    child.on("close", async (code) => {
      clearTimeout(timer);
      result.exitCode = code;
      result.output = stripAnsi(result.output);
      result.stderr = stripAnsi(result.stderr);
      try {
        const lastMessage = stripAnsi(await readFile(outputPath, "utf8"));
        if (lastMessage) result.output = lastMessage;
      } catch {
        // If the CLI did not create the file, keep stdout as the fallback output.
      }
      await rm(outputPath, { force: true }).catch(() => {});
      result.ok = code === 0 && !result.error;
      resolve(result);
    });
  });
}

async function runClaudePromptOnce(prompt, options = {}) {
  const commandSpec = claudeCommandSpec();
  const timeoutMs = Number(options.timeoutMs || claudePromptTimeoutMs);
  const args = [
    "--print",
    "--input-format",
    "text",
    "--output-format",
    "text",
    "--permission-mode",
    "plan",
    "--no-session-persistence",
    "--max-budget-usd",
    claudeMaxBudgetUsd
  ];
  const model = options.omitModel ? "" : String(process.env.YOMI_AI_CLAUDE_MODEL || "").trim();
  if (model) args.push("--model", model);
  return await new Promise((resolve) => {
    const result = {
      ok: false,
      commandLabel: `${commandSpec.label} --print --input-format text --permission-mode plan${model ? " --model <configured>" : ""} <stdin>`,
      output: "",
      stderr: "",
      exitCode: null,
      error: ""
    };
    const child = spawn(commandSpec.command, [...commandSpec.argsPrefix, ...args], { cwd: projectRoot, shell: false, windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
    writePromptToChild(child, prompt, result);
    const timer = setTimeout(() => {
      result.error = `timeout after ${timeoutMs}ms`;
      terminateChildProcess(child);
    }, timeoutMs);
    child.stdout.on("data", (chunk) => { result.output = (result.output + chunk.toString()).slice(-maxCodexOutputBytes); });
    child.stderr.on("data", (chunk) => { result.stderr = (result.stderr + chunk.toString()).slice(-maxCodexOutputBytes); });
    child.on("error", (error) => {
      clearTimeout(timer);
      result.error = error.message;
      result.output = stripAnsi(result.output);
      result.stderr = stripAnsi(result.stderr);
      resolve(result);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      result.exitCode = code;
      result.output = stripAnsi(result.output);
      result.stderr = stripAnsi(result.stderr);
      result.ok = code === 0 && !result.error;
      resolve(result);
    });
  });
}

async function runClaudePrompt(prompt, options = {}) {
  const result = await runClaudePromptOnce(prompt, options);
  const configuredModel = String(process.env.YOMI_AI_CLAUDE_MODEL || "").trim();
  const detail = `${result.stderr || ""}\n${result.output || ""}\n${result.error || ""}`;
  const modelLooksBad = configuredModel && !result.ok && /model/i.test(detail) && /invalid|unknown|not found|not exist|not supported|unsupported|access/i.test(detail);
  if (!modelLooksBad || options.omitModel) return result;
  const fallback = await runClaudePromptOnce(prompt, { ...options, omitModel: true });
  return {
    ...fallback,
    modelFallbackFrom: configuredModel,
    commandLabel: `${fallback.commandLabel} · model fallback`
  };
}

function parseJsonObject(text) {
  const source = String(text || "").trim();
  const fenced = source.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : source.slice(source.indexOf("{"), source.lastIndexOf("}") + 1);
  if (!candidate || !candidate.trim().startsWith("{")) throw new Error("Codex JSON 응답을 해석하지 못했습니다.");
  return JSON.parse(candidate);
}

function titleFromReport(task, report, options = {}) {
  const explicit = compactLine(options.title || "", 90);
  if (explicit && !isCommandLikeAssetTitle(explicit)) return explicit;
  const heading = compactLine(markdownTitle(report, ""), 90);
  if (heading && !/^(YOMI Office|요미|코덱스|Codex).{0,20}(보고서|최종 보고|개발자 보고서)$/i.test(heading) && !isCommandLikeAssetTitle(heading)) return heading;
  const taskTitle = compactLine(task, 90);
  if (taskTitle && !isCommandLikeAssetTitle(taskTitle)) return taskTitle;
  const secondary = stripMarkdownFrontmatter(report).match(/^##\s+(.+)$/m)?.[1] || "";
  return compactLine(secondary || "검토 필요 산출물", 90);
}

function classifyVaultSave(task, report, options = {}) {
  if (options.quality === "verified" || options.rag === true) {
    return { quality: "verified", rag: true, quarantine: false, reason: "", title: titleFromReport(task, report, options) };
  }
  const taskText = String(task || "");
  const reportText = stripMarkdownFrontmatter(report);
  const lowValue = isTrivialAutoSaveInput(taskText) || isCommandLikeAssetTitle(taskText) || reportText.length < 420;
  const noisy = encodingNoiseScore(taskText) >= 3;
  if (options.quarantine === true || lowValue || noisy) {
    return {
      quality: "quarantine",
      rag: false,
      quarantine: true,
      reason: noisy ? "encoding-noisy-title" : lowValue ? "command-or-low-value-autosave" : "requested-quarantine",
      title: titleFromReport(task, report, { ...options, title: "검토 필요 산출물" })
    };
  }
  return { quality: options.quality || "candidate", rag: options.rag === true, quarantine: false, reason: "", title: titleFromReport(task, report, options) };
}

async function saveReportToVault(task, report, assigned, options = {}) {
  if (!automationRules.reportSave) return { ok: false, skipped: true, reason: "자동화 규칙에서 업무 보고서 저장이 꺼져 있습니다" };
  const vaultRoot = await findVaultRoot();
  if (!vaultRoot) return { ok: false, reason: "저장소가 연결되지 않아 파일 저장은 건너뜀" };
  const now = new Date();
  const day = now.toISOString().slice(0, 10);
  const stamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const saveClass = classifyVaultSave(task, report, options);
  const outDir = saveClass.quarantine
    ? path.join(vaultRoot, "99_Inbox", "YOMI_Quarantine", day)
    : path.join(vaultRoot, "50_Outputs", primaryReportFolder, day);
  await mkdir(outDir, { recursive: true });
  const fullPath = path.join(outDir, `${stamp}-${slugify(saveClass.title || task)}.md`);
  const relPath = path.relative(vaultRoot, fullPath).replace(/\\/g, "/");
  const tags = Array.isArray(options.tags) && options.tags.length ? options.tags : ["yomi-office", "yomi-ai", "personal-office", "auto-asset"];
  const review = options.assetReview && typeof options.assetReview === "object" ? options.assetReview : null;
  const finalTags = [...new Set([
    ...tags,
    saveClass.quality,
    ...(saveClass.rag ? ["rag-ready", "verified"] : ["needs-review"]),
    ...(saveClass.quarantine ? ["quarantine", "no-rag"] : [])
  ])];
  const frontmatter = [
    "---",
    `type: ${yamlString(options.type || "yomi_office_report")}`,
    `title: ${yamlString(saveClass.title)}`,
    `created: ${now.toISOString()}`,
    `reviewed: ${now.toISOString()}`,
    `task: ${yamlString(task)}`,
    `quality: ${yamlString(saveClass.quality)}`,
    review ? `quality_score: ${Number(review.score || 0)}` : "",
    review ? `quality_grade: ${yamlString(review.grade || scoreGrade(review.score || 0))}` : "",
    review ? `quality_reason: ${yamlString(review.reason || saveClass.reason || "")}` : "",
    review?.issues?.length ? `quality_issues: [${review.issues.slice(0, 8).map(yamlString).join(", ")}]` : "",
    `rag: ${saveClass.rag ? "true" : "false"}`,
    `rag_ready: ${saveClass.rag ? "true" : "false"}`,
    saveClass.reason ? `quarantine_reason: ${yamlString(saveClass.reason)}` : "",
    `agents: [${assigned.map((agent) => yamlString(agent.id)).join(", ")}]`,
    `tags: [${finalTags.map(yamlString).join(", ")}]`,
    "---"
  ].filter(Boolean).join("\n");
  await writeFile(fullPath, `${frontmatter}\n\n${report}\n`, "utf8");
  return { ok: true, relPath, fullPath, quality: saveClass.quality, rag: saveClass.rag, quarantine: saveClass.quarantine, reason: saveClass.reason || "", assetReview: review };
}

async function resolveVaultMarkdownDocument(relPath) {
  const vaultRoot = await findVaultRoot();
  if (!vaultRoot) throw new Error("Vault 경로를 찾지 못했습니다");
  const cleanRelPath = String(relPath || "").replace(/\\/g, "/").replace(/^\/+/, "").trim();
  if (!cleanRelPath || cleanRelPath.includes("..") || path.isAbsolute(cleanRelPath)) throw new Error("Vault 내부 문서만 내보낼 수 있습니다");
  if (!cleanRelPath.toLowerCase().endsWith(".md")) throw new Error("마크다운 문서만 내보낼 수 있습니다");
  if (isSensitiveVaultPath(cleanRelPath)) throw new Error("비밀값이 포함될 수 있는 경로는 내보낼 수 없습니다");
  const vaultPath = path.resolve(vaultRoot);
  let finalRelPath = cleanRelPath;
  let fullPath = path.resolve(vaultRoot, cleanRelPath);
  if (fullPath !== vaultPath && !fullPath.startsWith(`${vaultPath}${path.sep}`)) throw new Error("Vault 밖의 파일은 내보낼 수 없습니다");
  if (!(await exists(fullPath))) {
    const normalizedTarget = cleanRelPath.normalize("NFKC").toLowerCase();
    const match = (await collectMarkdownFiles(vaultRoot, vaultRoot))
      .filter((file) => !isSensitiveVaultPath(file.relPath))
      .find((file) => file.relPath.normalize("NFKC").toLowerCase() === normalizedTarget);
    if (!match) throw new Error("문서를 찾을 수 없습니다");
    finalRelPath = match.relPath;
    fullPath = match.fullPath;
  }
  const content = await readFile(fullPath, "utf8");
  return { vaultRoot, relPath: finalRelPath, fullPath, content };
}

function stripMarkdownFrontmatter(content) {
  return String(content || "").replace(/^---\s*[\s\S]*?\s*---\s*/m, "").trim();
}

function markdownTitle(content, fallback = "YOMI Office 문서") {
  const body = stripMarkdownFrontmatter(content);
  const heading = body.match(/^#\s+(.+)$/m);
  return compactLine(heading?.[1] || fallback, 80);
}

function plainMarkdownText(content, maxLength = 1200) {
  return stripMarkdownFrontmatter(content)
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/\[[^\]]+]\([^)]+\)/g, (match) => match.replace(/^\[|\]\([^)]+\)$/g, ""))
    .replace(/[#>*_`|[\]-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function markdownExcerpt(content, maxLength = 420) {
  const source = plainMarkdownText(content, maxLength + 80);
  return source.length > maxLength ? `${source.slice(0, maxLength).trim()}...` : source;
}

function exportFormatMeta(format) {
  return {
    blog: { label: "블로그 초안", type: "yomi_office_blog_export", tags: ["blog", "draft"] },
    sns: { label: "SNS 패키지", type: "yomi_office_sns_export", tags: ["sns", "content-package"] },
    pdf: { label: "PDF용 마크다운", type: "yomi_office_pdf_markdown_export", tags: ["pdf", "markdown"] }
  }[format] || null;
}

function buildBlogExport({ title, relPath, content }) {
  const body = stripMarkdownFrontmatter(content);
  return [
    `# ${title}`,
    "",
    "## 도입",
    markdownExcerpt(content, 360) || "핵심 문제와 결론을 먼저 제시합니다.",
    "",
    "## 핵심 메시지",
    "- 독자가 바로 얻어갈 한 문장 결론",
    "- 실행에 옮길 수 있는 구체적 포인트",
    "- 다음 행동으로 연결되는 제안",
    "",
    "## 본문 초안",
    body || "원문 내용이 비어 있습니다.",
    "",
    "## 발행 전 체크",
    "- 제목이 독자의 문제를 직접 말하는가",
    "- 첫 문단에 결론이 있는가",
    "- 사례, 수치, 링크 등 근거를 보강할 위치가 보이는가",
    "- 마지막에 다음 행동이 있는가",
    "",
    "## 원본",
    `- ${relPath}`
  ].join("\n");
}

function buildSnsExport({ title, relPath, content }) {
  const excerpt = markdownExcerpt(content, 520);
  return [
    `# ${title} SNS 패키지`,
    "",
    "## 한 줄 훅",
    `${title}를 지금 다시 봐야 하는 이유.`,
    "",
    "## 인스타/스레드 캐러셀",
    "1. 문제 제기",
    "2. 왜 지금 중요한가",
    "3. 핵심 인사이트 1",
    "4. 핵심 인사이트 2",
    "5. 바로 적용할 행동",
    "6. 저장할 체크리스트",
    "7. 댓글 질문",
    "",
    "## 짧은 영상 스크립트",
    "- 0-3초: 훅",
    "- 3-15초: 핵심 상황 설명",
    "- 15-35초: 해결 관점 2개",
    "- 35-45초: 저장/공유 유도",
    "",
    "## X/Threads 초안",
    excerpt || "원문에서 핵심 메시지를 한 문단으로 압축합니다.",
    "",
    "## 해시태그 후보",
    "#YOMI_AI #개인AI #업무자동화 #AI자산화 #생산성",
    "",
    "## 원본",
    `- ${relPath}`
  ].join("\n");
}

function buildPdfMarkdownExport({ title, relPath, content }) {
  const body = stripMarkdownFrontmatter(content);
  return [
    `# ${title}`,
    "",
    "> PDF 변환용 마크다운",
    "",
    "## 요약",
    markdownExcerpt(content, 500) || "요약할 원문 내용이 비어 있습니다.",
    "",
    "## 목차",
    "1. 배경",
    "2. 핵심 내용",
    "3. 실행 체크리스트",
    "4. 부록",
    "",
    "## 배경",
    "- 이 문서가 다루는 문제",
    "- 읽는 사람이 얻어야 할 결과",
    "",
    "## 핵심 내용",
    body || "원문 내용이 비어 있습니다.",
    "",
    "## 실행 체크리스트",
    "- [ ] 핵심 결론 확인",
    "- [ ] 필요한 근거 보강",
    "- [ ] 발행/공유 대상 결정",
    "- [ ] 최종 문체 검수",
    "",
    "## 부록",
    `- 원본 문서: ${relPath}`
  ].join("\n");
}

function buildVaultExportContent(format, payload) {
  if (format === "blog") return buildBlogExport(payload);
  if (format === "sns") return buildSnsExport(payload);
  if (format === "pdf") return buildPdfMarkdownExport(payload);
  throw new Error("지원하지 않는 내보내기 형식입니다");
}

async function exportVaultDocument(input = {}) {
  const format = String(input.format || "blog").trim();
  const meta = exportFormatMeta(format);
  if (!meta) throw new Error("지원하지 않는 내보내기 형식입니다");
  const source = await resolveVaultMarkdownDocument(input.relPath || input.path);
  const title = markdownTitle(source.content, reportTitleFromPath(source.relPath));
  const content = buildVaultExportContent(format, { title, relPath: source.relPath, content: source.content });
  const now = new Date();
  const day = now.toISOString().slice(0, 10);
  const stamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const outDir = path.join(source.vaultRoot, "50_Outputs", primaryReportFolder, "Exports", day);
  const fullPath = path.join(outDir, `${stamp}-${slugify(title)}-${format}.md`);
  const relPath = path.relative(source.vaultRoot, fullPath).replace(/\\/g, "/");
  const frontmatter = [
    "---",
    `type: ${yamlString(meta.type)}`,
    `created: ${now.toISOString()}`,
    `source: ${yamlString(source.relPath)}`,
    `format: ${yamlString(format)}`,
    `tags: [${["yomi-office", "yomi-ai", "personal-office", "export", ...meta.tags].map(yamlString).join(", ")}]`,
    "---"
  ].join("\n");
  const output = `${frontmatter}\n\n${content}\n`;
  if (!input.dryRun) {
    await mkdir(outDir, { recursive: true });
    await writeFile(fullPath, output, "utf8");
  }
  return {
    ok: true,
    dryRun: Boolean(input.dryRun),
    format,
    formatLabel: meta.label,
    title,
    sourceRelPath: source.relPath,
    relPath,
    fullPath,
    preview: content.slice(0, 1600)
  };
}

function defaultChatSessionsState() {
  return { sessions: [] };
}

function normalizeChatSessionsState(input = {}) {
  const sessions = Array.isArray(input.sessions) ? input.sessions : [];
  return {
    sessions: sessions.map((session) => ({
      id: String(session.id || ""),
      title: String(session.title || "새 대화"),
      createdAt: String(session.createdAt || ""),
      updatedAt: String(session.updatedAt || ""),
      turns: Array.isArray(session.turns) ? session.turns.map((turn) => ({
        id: String(turn.id || ""),
        createdAt: String(turn.createdAt || ""),
        user: String(turn.user || ""),
        assistant: String(turn.assistant || ""),
        intent: String(turn.intent || ""),
        modeLabel: String(turn.modeLabel || ""),
        capture: turn.capture && typeof turn.capture === "object" ? turn.capture : null,
        skillCandidateIds: normalizeStringList(turn.skillCandidateIds || []),
        learning: turn.learning && typeof turn.learning === "object" ? turn.learning : null,
        sources: Array.isArray(turn.sources) ? turn.sources.slice(0, 6) : []
      })) : []
    })).filter((session) => session.id)
  };
}

async function readChatSessionsState() {
  if (!(await exists(chatSessionsPath))) return defaultChatSessionsState();
  return normalizeChatSessionsState(await readJson(chatSessionsPath, defaultChatSessionsState()));
}

async function writeChatSessionsState(state) {
  const normalized = normalizeChatSessionsState(state);
  normalized.sessions = normalized.sessions
    .sort((a, b) => jobTimeValue(b.updatedAt || b.createdAt) - jobTimeValue(a.updatedAt || a.createdAt))
    .slice(0, 80)
    .map((session) => ({ ...session, turns: session.turns.slice(-80) }));
  await writeJsonFile(chatSessionsPath, normalized);
  return normalized;
}

function chatSessionMetrics(session) {
  const turns = Array.isArray(session.turns) ? session.turns : [];
  return turns.reduce((acc, turn) => {
    if (turn.capture?.ok) acc.assetCount += 1;
    acc.skillCandidateCount += Array.isArray(turn.skillCandidateIds) ? turn.skillCandidateIds.length : 0;
    acc.sourceCount += Array.isArray(turn.sources) ? turn.sources.length : 0;
    acc.memoryCount += Array.isArray(turn.learning?.autoAppliedMemoryIds) ? turn.learning.autoAppliedMemoryIds.length : 0;
    return acc;
  }, { assetCount: 0, skillCandidateCount: 0, sourceCount: 0, memoryCount: 0 });
}

function publicChatSessionSummary(session) {
  const lastTurn = session.turns?.[session.turns.length - 1] || {};
  const metrics = chatSessionMetrics(session);
  return {
    id: session.id,
    title: session.title,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    turnCount: session.turns?.length || 0,
    lastUser: compactLine(lastTurn.user || "", 90),
    lastMode: lastTurn.modeLabel || "",
    ...metrics
  };
}

function publicChatSession(session) {
  return {
    ...publicChatSessionSummary(session),
    turns: (session.turns || []).map((turn) => ({
      ...turn,
      assistant: String(turn.assistant || "").slice(0, 12000)
    }))
  };
}

async function buildChatSessionsState(input = {}) {
  const state = await readChatSessionsState();
  const selected = input.id ? state.sessions.find((session) => session.id === String(input.id)) : null;
  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    sessions: state.sessions.map(publicChatSessionSummary),
    selected: selected ? publicChatSession(selected) : null
  };
}

async function updateChatSessionsState(input = {}) {
  const action = String(input.action || "list").trim().toLowerCase();
  if (!action || action === "list") return await buildChatSessionsState({ id: input.id || "" });
  const state = await readChatSessionsState();
  let selectedId = String(input.id || "");
  const now = new Date().toISOString();
  if (action === "create") {
    const title = compactLine(input.title || input.message || "새 대화", 44) || "새 대화";
    const session = {
      id: `chat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      title,
      createdAt: now,
      updatedAt: now,
      turns: []
    };
    state.sessions.unshift(session);
    selectedId = session.id;
  } else if (action === "rename") {
    const session = state.sessions.find((item) => item.id === selectedId);
    if (!session) throw new Error("대화 세션을 찾을 수 없습니다");
    session.title = compactLine(input.title || session.title, 60) || session.title;
    session.updatedAt = now;
  } else if (action === "delete") {
    const before = state.sessions.length;
    state.sessions = state.sessions.filter((item) => item.id !== selectedId);
    if (state.sessions.length === before) throw new Error("대화 세션을 찾을 수 없습니다");
    selectedId = "";
  } else if (action === "clear") {
    state.sessions = [];
    selectedId = "";
  } else {
    throw new Error("Unknown chat session action");
  }
  await writeChatSessionsState(state);
  return await buildChatSessionsState({ id: selectedId });
}

function getOrCreateChatSession(state, sessionId, firstMessage) {
  const existing = state.sessions.find((session) => session.id === sessionId);
  if (existing) return existing;
  const now = new Date().toISOString();
  const session = {
    id: `chat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    title: compactLine(firstMessage, 44) || "새 대화",
    createdAt: now,
    updatedAt: now,
    turns: []
  };
  state.sessions.unshift(session);
  return session;
}

function isLowValueConversation(message = "") {
  const value = String(message || "").trim();
  const compact = value.replace(/\s+/g, "");
  if (compact.length < 14) return true;
  if (/^(진행|다음|좋아|오케이|ㅇㅋ|링크|고마워|감사|수정해|계속|해줘)[.!?~]*$/i.test(compact)) return true;
  if (/(오늘\s*뭐\s*하면|뭐하지|뭘\s*해야|안녕|테스트|ㅋㅋ|ㅎㅎ)/i.test(value) && compact.length < 40) return true;
  return false;
}

function isEphemeralLearningInput(text = "") {
  const value = String(text || "").normalize("NFKC").trim();
  if (!value) return true;
  const temporal = /(오늘|이번|지금|당장|잠깐|임시|테스트|아무거나|뭐\s*하면|뭐\s*할까|뭘\s*할까|뭐하지|심심|가볍게)/i.test(value);
  const durable = /(기억해|메모해|저장해|앞으로|항상|기본으로|기본값|절대|원칙|규칙|기준|내\s*(방식|말투|스타일|선호)|자산화)/i.test(value);
  return temporal && !durable;
}

function learningSignals(userText = "", replyText = "") {
  const user = String(userText || "").normalize("NFKC");
  const reply = String(replyText || "");
  const joined = `${user}\n${reply}`;
  const ephemeral = isEphemeralLearningInput(user);
  const explicitSave = /(저장해|저장해줘|기록해|남겨|자산화|Vault|옵시디언|문서로\s*남|보고서로\s*남)/i.test(user);
  const explicitMemory = /(기억해|메모해|앞으로|항상|기본으로|기본값|절대|하지\s*마|하지\s*말|내\s*(규칙|원칙|기준|방식|말투|스타일|선호)|이렇게\s*해)/i.test(user);
  const stablePreference = !ephemeral && /(선호|싫어|좋아|원해|필요없|제외|물어봐|말투|스타일|방식|기준|원칙|규칙)/i.test(user);
  const durableWork = /(규칙|원칙|기준|정책|체크리스트|템플릿|프로세스|워크플로우|자동화|반복|매뉴얼|가이드|절차|포맷|프롬프트|운영\s*방식)/i.test(joined);
  const explicitSkill = /(스킬|skill|템플릿|프로세스|워크플로우|체크리스트|매뉴얼|가이드|프롬프트|자동화|반복\s*업무|작업\s*방식|평가\s*기준|검수\s*기준)/i.test(user);
  const reusableProcedure = !ephemeral
    && durableWork
    && /(단계|절차|흐름|루틴|파이프라인|평가|검수|인계|분배|저장|자산화|자동화|반복|체크리스트|템플릿|기준|원칙)/i.test(user)
    && user.trim().length >= 35;
  const shortMemoryOnly = (explicitMemory || stablePreference)
    && !explicitSave
    && !explicitSkill
    && !reusableProcedure
    && user.trim().length < 140;
  return { ephemeral, explicitSave, explicitMemory, stablePreference, durableWork, explicitSkill, reusableProcedure, shortMemoryOnly };
}

function assessConversationMemory(message, result = {}) {
  const userText = String(message || "");
  const replyText = String(result.reply || "");
  const signals = learningSignals(userText, replyText);
  if (!automationRules.chatAssetCapture) return { shouldSave: false, shouldSkill: false, reason: "대화 자동 자산화가 꺼져 있습니다." };
  if (isLowValueConversation(userText) && !signals.explicitMemory && !signals.explicitSave) return { shouldSave: false, shouldSkill: false, reason: "일회성 짧은 대화라 저장하지 않았습니다.", learningType: "skip" };

  if ((isTrivialAutoSaveInput(userText) || signals.ephemeral) && !signals.explicitMemory && !signals.explicitSave) {
    return { shouldSave: false, shouldSkill: false, reason: "가벼운 질문/잡담이라 자동 저장하지 않습니다." };
  }
  const workIntent = ["office", "codex"].includes(result.intent);
  const substantial = userText.length >= 70 && replyText.length >= 500;
  const meaningfulWorkIntent = workIntent
    && !isTrivialAutoSaveInput(userText)
    && (replyText.length >= 450 || Boolean(result.officeJob || result.codexJob) || (Array.isArray(result.sources) && result.sources.length > 0));
  const shouldSave = signals.explicitSave || (signals.durableWork && !signals.shortMemoryOnly) || meaningfulWorkIntent || substantial;
  const shouldSkill = (signals.explicitSkill || signals.reusableProcedure) && !signals.ephemeral && userText.length >= 20;
  const learningType = shouldSkill ? "skill" : (signals.explicitMemory || signals.stablePreference ? "memory" : shouldSave ? "asset" : "skip");
  return {
    shouldSave,
    shouldSkill,
    learningType,
    reason: shouldSave
      ? signals.explicitSave
        ? "사용자가 명시적으로 저장/자산화를 요청해 Vault에 저장했습니다."
        : signals.durableWork
          ? "반복 가능한 절차나 기준이 포함되어 저장했습니다."
          : meaningfulWorkIntent
            ? "업무 실행 맥락이라 세션 자산으로 기록했습니다."
            : "충분히 긴 대화 산출물이라 저장했습니다."
      : signals.shortMemoryOnly
        ? "짧은 선호/규칙은 Vault 문서 대신 장기 메모리만 갱신합니다."
        : "재사용 가치가 낮아 Vault 저장은 건너뛰었습니다."
  };
}

async function saveConversationMemoryToVault({ session, turn, assessment }) {
  const vaultRoot = await findVaultRoot();
  if (!vaultRoot) return { ok: false, skipped: true, reason: "Vault 경로를 찾지 못했습니다." };
  const now = new Date();
  const day = now.toISOString().slice(0, 10);
  const stamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const outDir = path.join(vaultRoot, "50_Outputs", primaryReportFolder, "Conversation Assets", day);
  await mkdir(outDir, { recursive: true });
  const title = compactLine(turn.user || session.title || "대화 자산", 52);
  const fullPath = path.join(outDir, `${stamp}-${slugify(title)}.md`);
  const relPath = path.relative(vaultRoot, fullPath).replace(/\\/g, "/");
  const frontmatter = [
    "---",
    `type: ${yamlString("yomi_office_conversation_asset")}`,
    `created: ${now.toISOString()}`,
    `session: ${yamlString(session.id)}`,
    `turn: ${yamlString(turn.id)}`,
    `intent: ${yamlString(turn.intent)}`,
    `tags: [${["yomi-office", "yomi-ai", "personal-office", "conversation-memory", "auto-asset"].map(yamlString).join(", ")}]`,
    "---"
  ].join("\n");
  const body = [
    `# ${title}`,
    "",
    `- 저장 이유: ${assessment.reason}`,
    `- 대화 모드: ${turn.modeLabel || turn.intent || "general"}`,
    "",
    "## 사용자 입력",
    turn.user,
    "",
    "## 요미 응답",
    turn.assistant,
    turn.sources?.length ? `\n## 참고 문서\n${turn.sources.map((item, index) => `${index + 1}. ${item.title || "문서"} · ${item.displayPath || item.relPath || ""}`).join("\n")}` : ""
  ].filter(Boolean).join("\n");
  await writeFile(fullPath, `${frontmatter}\n\n${body}\n`, "utf8");
  return { ok: true, relPath, fullPath, reason: assessment.reason };
}

function defaultSkillCandidatesState() {
  return { candidates: [] };
}

function normalizeSkillCandidate(input = {}) {
  const title = compactLine(input.title || input.label || "대화 기반 스킬", 42);
  const id = String(input.id || `skill-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`);
  const agentIds = normalizeStringList(input.agentIds || ["ceo", "writer", "archivist"]).filter((idValue) => specialistRoles.some((agent) => agent.id === idValue));
  const kind = ["skill", "memory", "workflow", "template"].includes(String(input.kind || "")) ? String(input.kind) : "skill";
  return {
    id,
    kind,
    title,
    description: String(input.description || "").trim() || `${title}에 맞춰 반복 업무를 처리합니다.`,
    instructions: String(input.instructions || "").trim(),
    evidence: String(input.evidence || "").trim(),
    confidence: clampScore(input.confidence || (kind === "memory" ? 90 : 72)),
    agentIds: agentIds.length ? agentIds : ["ceo", "writer", "archivist"],
    toolId: slugId(input.toolId || `memory-${title}`),
    status: String(input.status || "pending"),
    sourceSessionId: String(input.sourceSessionId || ""),
    sourceTurnId: String(input.sourceTurnId || ""),
    sourceJobId: String(input.sourceJobId || ""),
    sourceRelPath: String(input.sourceRelPath || ""),
    createdAt: String(input.createdAt || new Date().toISOString()),
    updatedAt: String(input.updatedAt || input.createdAt || new Date().toISOString()),
    appliedAt: String(input.appliedAt || ""),
    autoAppliedAt: String(input.autoAppliedAt || "")
  };
}

function normalizeSkillCandidatesState(input = {}) {
  const candidates = Array.isArray(input.candidates) ? input.candidates : [];
  return { candidates: candidates.map(normalizeSkillCandidate).filter((candidate) => candidate.id) };
}

async function readSkillCandidatesState() {
  if (!(await exists(skillCandidatesPath))) return defaultSkillCandidatesState();
  return normalizeSkillCandidatesState(await readJson(skillCandidatesPath, defaultSkillCandidatesState()));
}

async function writeSkillCandidatesState(state) {
  const normalized = normalizeSkillCandidatesState(state);
  normalized.candidates = normalized.candidates
    .sort((a, b) => jobTimeValue(b.updatedAt || b.createdAt) - jobTimeValue(a.updatedAt || a.createdAt))
    .slice(0, 120);
  await writeJsonFile(skillCandidatesPath, normalized);
  return normalized;
}

function candidateAgentsFromText(text = "") {
  const value = String(text || "");
  const ids = new Set(["ceo", "archivist"]);
  if (/(글|문서|블로그|카피|원고|스토리|콘텐츠)/i.test(value)) ids.add("writer");
  if (/(편집|검수|문법|톤|말투)/i.test(value)) ids.add("editor");
  if (/(개발|코드|테스트|git|배포|버그)/i.test(value)) ids.add("developer");
  if (/(조사|리서치|근거|자료|트렌드|검색)/i.test(value)) ids.add("researcher");
  if (/(전략|기획|시장|사업|분석)/i.test(value)) ids.add("business");
  if (/(디자인|화면|UI|이미지)/i.test(value)) ids.add("designer");
  if (/(영상|유튜브|릴스)/i.test(value)) ids.add("youtube");
  if (/(SNS|인스타|스레드|트위터|X)/i.test(value)) ids.add("instagram");
  return [...ids].filter((id) => specialistRoles.some((agent) => agent.id === id)).slice(0, 5);
}

function learningSentences(text = "") {
  return String(text || "")
    .split(/\r?\n|(?<=[.!?。！？])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function memoryItemDecision(text = "") {
  const value = String(text || "").normalize("NFKC").trim();
  if (!value || value.length < 12 || isEphemeralLearningInput(value)) return { keep: false, autoApply: false, confidence: 0, reason: "일회성 표현" };
  const explicitCommand = /(기억해|메모해|앞으로|항상|기본으로|기본값|절대|하지\s*마|하지\s*말|물어봐|제외해)/i.test(value);
  const personalRule = /(내\s*(규칙|원칙|기준|방식|말투|스타일|선호)|나는\s*.+(선호|싫어|좋아)|내가\s*.+(선호|싫어|좋아))/i.test(value);
  const stablePreference = /(선호|싫어|좋아|원해|필요없|제외|말투|스타일|방식|기준|원칙|규칙)/i.test(value);
  const keep = explicitCommand || personalRule || stablePreference;
  const autoApply = explicitCommand || personalRule;
  return {
    keep,
    autoApply,
    confidence: autoApply ? 96 : 84,
    reason: autoApply ? "명시적 장기 규칙/선호" : "검토가 필요한 선호 후보"
  };
}

function extractPreferenceMemoryItems(text = "") {
  const value = String(text || "").normalize("NFKC").trim();
  if (!value) return [];
  const rows = learningSentences(value).filter((item) => memoryItemDecision(item).keep);
  const selected = rows.length ? rows : (memoryItemDecision(value).keep && value.length <= 260 ? [value] : []);
  const seen = new Set();
  const result = [];
  for (const row of selected) {
    const cleaned = compactLine(row.replace(/^(기억해|메모해|저장해)\s*[:：-]?\s*/i, ""), 180);
    const key = normalizeMemoryKey(cleaned);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(cleaned);
    if (result.length >= 3) break;
  }
  return result;
}

function shouldAutoApplyMemoryItem(text = "") {
  return memoryItemDecision(text).autoApply;
}

async function createMemoryCandidatesFromTurn({ session, turn }) {
  const items = extractPreferenceMemoryItems(turn.user);
  if (!items.length) return [];
  const state = await readSkillCandidatesState();
  const created = [];
  for (const item of items) {
    const memoryKey = normalizeMemoryKey(item);
    const existing = state.candidates.find((candidate) => candidate.kind === "memory" && normalizeMemoryKey(candidate.instructions || candidate.evidence || candidate.title) === memoryKey);
    if (existing) {
      created.push(existing);
      continue;
    }
    const decision = memoryItemDecision(item);
    const autoApply = decision.autoApply;
    const applied = autoApply ? await appendProfileMemory([item]) : { added: [] };
    const now = new Date().toISOString();
    const candidate = normalizeSkillCandidate({
      kind: "memory",
      title: `메모리: ${compactLine(item, 32)}`,
      description: autoApply ? "명시적 장기 규칙/선호라 메모리에 자동 반영했습니다." : `${decision.reason}입니다.`,
      instructions: item,
      evidence: turn.user,
      confidence: decision.confidence || (autoApply ? 96 : 82),
      agentIds: ["ceo", "secretary", "archivist"],
      status: autoApply ? "approved" : "pending",
      sourceSessionId: session.id,
      sourceTurnId: turn.id,
      appliedAt: autoApply ? now : "",
      autoAppliedAt: autoApply && applied.added?.length ? now : ""
    });
    state.candidates.unshift(candidate);
    created.push(candidate);
  }
  await writeSkillCandidatesState(state);
  return created;
}

async function createSkillCandidateFromTurn({ session, turn, assessment }) {
  const state = await readSkillCandidatesState();
  const sourceKey = `${session.id}:${turn.id}`;
  const existing = state.candidates.find((candidate) => candidate.kind !== "memory" && `${candidate.sourceSessionId}:${candidate.sourceTurnId}` === sourceKey);
  if (existing) return existing;
  const title = compactLine(turn.user.replace(/스킬로|만들어|기억|저장/gi, " ").trim(), 38) || "대화 기반 스킬";
  const candidate = normalizeSkillCandidate({
    kind: "skill",
    title,
    description: assessment.reason,
    evidence: turn.user,
    confidence: 78,
    instructions: [
      "이 스킬은 사용자의 대화에서 추출한 반복 가능한 업무 방식이다.",
      "사용자 입력의 의도, 선호, 금지 조건을 먼저 확인하고 그 기준을 이후 산출물에 적용한다.",
      "사소한 요청에는 필요한 담당자만 투입하고, 중요한 업무에는 근거/검수/저장 단계를 포함한다.",
      "",
      "## 원본 사용자 입력",
      turn.user,
      "",
      "## 참고 응답",
      compactLine(turn.assistant, 1200)
    ].join("\n"),
    agentIds: candidateAgentsFromText(`${turn.user}\n${turn.assistant}`),
    sourceSessionId: session.id,
    sourceTurnId: turn.id
  });
  state.candidates.unshift(candidate);
  await writeSkillCandidatesState(state);
  return candidate;
}

function skillCandidateStatusLabel(status = "") {
  return {
    pending: "검토 대기",
    approved: "적용됨",
    dismissed: "숨김"
  }[status] || status || "검토 대기";
}

function publicSkillCandidate(candidate, sessionsById = new Map()) {
  const session = sessionsById.get(candidate.sourceSessionId);
  const turn = session?.turns?.find((item) => item.id === candidate.sourceTurnId) || null;
  return {
    ...candidate,
    statusLabel: skillCandidateStatusLabel(candidate.status),
    agentNames: (candidate.agentIds || []).map((id) => resolveAgent(id)?.name || id),
    evidencePreview: compactLine(candidate.evidence || turn?.user || "", 160),
    instructionsPreview: compactLine(candidate.instructions || "", 220),
    source: {
      sessionId: candidate.sourceSessionId || "",
      sessionTitle: session?.title || "",
      turnId: candidate.sourceTurnId || "",
      turnCreatedAt: turn?.createdAt || "",
      user: compactLine(turn?.user || candidate.evidence || "", 140),
      relPath: candidate.sourceRelPath || ""
    }
  };
}

async function buildSkillCandidatesState() {
  const state = await readSkillCandidatesState();
  const sessions = await readChatSessionsState();
  const sessionsById = new Map(sessions.sessions.map((session) => [session.id, session]));
  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    summary: {
      total: state.candidates.length,
      pending: state.candidates.filter((candidate) => candidate.status === "pending").length,
      approved: state.candidates.filter((candidate) => candidate.status === "approved").length,
      memory: state.candidates.filter((candidate) => candidate.kind === "memory").length
    },
    candidates: state.candidates.map((candidate) => publicSkillCandidate(candidate, sessionsById))
  };
}

async function applySkillCandidate(candidateId) {
  const state = await readSkillCandidatesState();
  const candidate = state.candidates.find((item) => item.id === String(candidateId));
  if (!candidate) throw new Error("스킬 후보를 찾을 수 없습니다");
  const config = normalizeSkillsConfig(await readJson(skillsConfigPath, { agentSkills: {}, tools: {} }));
  if (candidate.kind === "memory") {
    const applied = await appendProfileMemory([candidate.instructions || candidate.evidence || candidate.title]);
    candidate.status = "approved";
    candidate.appliedAt = new Date().toISOString();
    candidate.updatedAt = candidate.appliedAt;
    await writeSkillCandidatesState(state);
    return { ok: true, candidate, profile: { ok: true, profile: applied.profile } };
  }
  const baseToolId = slugId(candidate.toolId || candidate.title || "memory-skill");
  let toolId = baseToolId;
  let index = 2;
  while (config.tools[toolId] && config.tools[toolId].sourceCandidateId !== candidate.id) {
    toolId = `${baseToolId}-${index}`;
    index += 1;
  }
  config.tools[toolId] = {
    label: candidate.title,
    enabled: true,
    type: candidate.kind === "workflow" ? "workflow_skill" : candidate.kind === "template" ? "template_skill" : "memory_skill",
    provider: "yomi-learning",
    description: candidate.description,
    instructions: candidate.instructions,
    sourceCandidateId: candidate.id,
    sourceSessionId: candidate.sourceSessionId,
    sourceTurnId: candidate.sourceTurnId,
    sourceJobId: candidate.sourceJobId,
    sourceRelPath: candidate.sourceRelPath
  };
  for (const agentId of candidate.agentIds) {
    const current = Array.isArray(config.agentSkills[agentId]) ? config.agentSkills[agentId].map(String) : [];
    config.agentSkills[agentId] = [...new Set([...current, toolId])];
    removeAgentSkillMarker(config.agentDisabledSkills, agentId, toolId);
  }
  pruneSkillsConfig(config);
  await writeJsonFile(skillsConfigPath, config);
  candidate.status = "approved";
  candidate.toolId = toolId;
  candidate.appliedAt = new Date().toISOString();
  candidate.updatedAt = candidate.appliedAt;
  await writeSkillCandidatesState(state);
  return { ok: true, candidate, skills: await buildSkillsState() };
}

async function updateSkillCandidateDraft(input = {}) {
  const state = await readSkillCandidatesState();
  const candidate = state.candidates.find((item) => item.id === String(input.id || ""));
  if (!candidate) throw new Error("스킬 후보를 찾을 수 없습니다");
  if (candidate.status === "approved") throw new Error("이미 적용된 후보는 수정할 수 없습니다");
  const title = compactLine(input.title || candidate.title, 42);
  if (!title) throw new Error("스킬 후보 제목이 필요합니다");
  const agentIds = normalizeStringList(input.agentIds || candidate.agentIds, 8).filter((idValue) => specialistRoles.some((agent) => agent.id === idValue));
  if (!agentIds.length) throw new Error("담당 직원은 1명 이상 선택해야 합니다");
  candidate.title = title;
  candidate.description = typeof input.description === "undefined" ? candidate.description : compactLine(input.description, 180);
  candidate.instructions = String(input.instructions ?? candidate.instructions ?? "").trim();
  if (!candidate.instructions) throw new Error("스킬 지침이 필요합니다");
  candidate.agentIds = agentIds;
  if (typeof input.confidence !== "undefined") candidate.confidence = clampScore(input.confidence);
  if (input.toolId) candidate.toolId = slugId(input.toolId);
  candidate.updatedAt = new Date().toISOString();
  await writeSkillCandidatesState(state);
  return await buildSkillCandidatesState();
}

async function updateSkillCandidate(input = {}) {
  const action = String(input.action || "");
  if (!action || action === "list") return await buildSkillCandidatesState();
  if (action === "update") return await updateSkillCandidateDraft(input);
  if (action === "approve") return await applySkillCandidate(input.id);
  const state = await readSkillCandidatesState();
  const candidate = state.candidates.find((item) => item.id === String(input.id || ""));
  if (!candidate) throw new Error("스킬 후보를 찾을 수 없습니다");
  if (action === "dismiss") {
    candidate.status = "dismissed";
    candidate.updatedAt = new Date().toISOString();
  } else {
    throw new Error("Unknown skill candidate action");
  }
  await writeSkillCandidatesState(state);
  return await buildSkillCandidatesState();
}

async function recordConversationTurn({ message, result, sessionId = "" }) {
  const state = await readChatSessionsState();
  const session = getOrCreateChatSession(state, String(sessionId || ""), message);
  const assessment = assessConversationMemory(message, result);
  const turn = {
    id: `turn-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    user: String(message || ""),
    assistant: String(result.reply || ""),
    intent: String(result.intent || ""),
    modeLabel: String(result.modeLabel || ""),
    capture: { ok: false, skipped: true, reason: assessment.reason },
    skillCandidateIds: [],
    sources: Array.isArray(result.sources) ? result.sources.slice(0, 6).map((source) => ({
      title: source.title || "",
      relPath: source.relPath || "",
      displayPath: source.displayPath || ""
    })) : []
  };
  if (assessment.shouldSave) turn.capture = await saveConversationMemoryToVault({ session, turn, assessment });
  const memoryCandidates = await createMemoryCandidatesFromTurn({ session, turn });
  if (assessment.shouldSkill) {
    const candidate = await createSkillCandidateFromTurn({ session, turn, assessment });
    turn.skillCandidateIds = [candidate.id];
  }
  turn.skillCandidateIds = [...new Set([...turn.skillCandidateIds, ...memoryCandidates.map((candidate) => candidate.id)])];
  turn.learning = {
    assessment: {
      type: assessment.learningType || "skip",
      reason: assessment.reason,
      shouldSave: Boolean(assessment.shouldSave),
      shouldSkill: Boolean(assessment.shouldSkill)
    },
    memoryCandidateIds: memoryCandidates.map((candidate) => candidate.id),
    autoAppliedMemoryIds: memoryCandidates.filter((candidate) => candidate.autoAppliedAt).map((candidate) => candidate.id)
  };
  session.turns.push(turn);
  session.updatedAt = turn.createdAt;
  if (!session.title || session.title === "새 대화") session.title = compactLine(message, 44) || session.title;
  await writeChatSessionsState(state);
  return {
    session: publicChatSessionSummary(session),
    capture: turn.capture,
    skillCandidateIds: turn.skillCandidateIds,
    learning: turn.learning,
    saved: turn.capture?.ok ? turn.capture : null
  };
}

function resolveAgent(id) {
  return specialistRoles.find((agent) => agent.id === id);
}

function recordWorkflowError(stepLabel, error) {
  const message = error instanceof Error ? error.message : String(error);
  workflowRuntime.recentErrors.unshift({ stepLabel, message, createdAt: new Date().toISOString() });
  workflowRuntime.recentErrors = workflowRuntime.recentErrors.slice(0, 12);
}

async function runCodexText(prompt, label) {
  const result = await runCodexPrompt(prompt);
  if (!result.ok && result.exitCode === 0 && result.output) {
    return { text: result.output, commandLabel: result.commandLabel };
  }
  if (!result.ok) throw new Error(codexFailureMessage(result, label));
  if (!result.output) throw new Error(`${label} 실패: Codex CLI가 빈 응답을 반환했습니다.`);
  return { text: result.output, commandLabel: result.commandLabel };
}

async function runClaudeText(prompt, label, options = {}) {
  const result = await runClaudePrompt(prompt, options);
  if (!result.ok) throw new Error(claudeFailureMessage(result, label));
  if (!result.output) throw new Error(`${label} 실패: Claude Code CLI가 빈 응답을 반환했습니다.`);
  return { text: result.output, commandLabel: result.commandLabel };
}

async function runEngineText(engineId, prompt, label) {
  const engine = normalizeEngineId(engineId);
  if (engine === "claude") {
    try {
      const generated = await runClaudeText(prompt, label);
      return { ...generated, engine: "claude", engineLabel: cliEngines.claude.label, provider: cliEngines.claude.provider };
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      const generated = await runCodexText(prompt, `${label} Codex engine fallback`);
      return {
        ...generated,
        engine: "codex",
        engineLabel: cliEngines.codex.label,
        provider: cliEngines.codex.provider,
        engineFallbackFrom: "claude",
        engineFallbackReason: reason
      };
    }
  }
  const generated = await runCodexText(prompt, label);
  return { ...generated, engine: "codex", engineLabel: cliEngines.codex.label, provider: cliEngines.codex.provider };
}

async function runCodexWorkflowStep({ task, workflowName, step, agent, previousSteps = [], reworkNotes = "" }) {
  const previous = previousSteps.map((item, index) => `### 이전 단계 ${index + 1}: ${item.label} · ${item.agentName}\n${item.content}`).join("\n\n") || "이전 단계 없음";
  const context = await buildPersonalContext(`${task} ${workflowName} ${step.label || ""} ${agent?.role || ""}`, { limit: 4 });
  const prompt = [
    "너는 YOMI Office / 요미오피스의 직원 에이전트다.",
    "아래 역할에 맞춰 실제 산출물을 한국어 Markdown으로 작성한다.",
    "삭제, 이동, 외부 시스템 변경 같은 위험한 명령은 실행하지 말고 필요한 경우 제안만 한다.",
    "사용자 톤/스타일 프로필과 자동 Vault 참조를 우선 반영하되, 관련성이 낮은 자료는 억지로 쓰지 않는다.",
    "",
    context.promptBlock,
    "",
    `워크플로우: ${workflowName}`,
    `직원: ${agent?.name || step.agent}`,
    `역할: ${agent?.role || ""}`,
    `역할 설명: ${agent?.work || ""}`,
    `단계: ${step.label}`,
    `사용자 요청: ${task}`,
    reworkNotes ? `재작업 지시: ${reworkNotes}` : "",
    "",
    "이전 인계 내용:",
    previous,
    "",
    "출력 형식:",
    "## 입력 해석",
    "## 작업 결과",
    "## 다음 단계 인계",
    "",
    "고정 안내문이 아니라 이 요청에 맞춘 실제 결과만 작성한다."
  ].filter(Boolean).join("\n");
  return await runCodexText(prompt, `${step.label} Codex 생성`);
}

async function evaluateWorkflowDraft({ task, content, criteria }) {
  const prompt = [
    "너는 YOMI Office의 검토자 나래다.",
    "아래 초안이 기준을 통과하는지 평가하고 JSON만 반환한다.",
    "",
    `사용자 요청: ${task}`,
    `기준: ${JSON.stringify(criteria || {})}`,
    "",
    "초안:",
    content,
    "",
    "반환 형식:",
    "{\"passed\":true,\"issues\":[],\"summary\":\"검토 요약\"}"
  ].join("\n");
  const result = await runCodexPrompt(prompt);
  if (!result.ok) throw new Error(codexFailureMessage(result, "검토자 Codex 평가"));
  const parsed = parseJsonObject(result.output);
  return {
    passed: Boolean(parsed.passed),
    issues: Array.isArray(parsed.issues) ? parsed.issues.map(String).slice(0, 8) : [],
    summary: String(parsed.summary || "")
  };
}

async function runOfficeTask(task) {
  const assigned = ["ceo", "secretary", "researcher", "writer", "archivist"].map(resolveAgent).filter(Boolean);
  const workflow = await readJson(workflowConfigPath, { workflows: {} });
  const steps = workflow.workflows?.content_handoff?.steps || [];
  const workflowConfig = workflow.workflows?.content_handoff || {};
  const workflowName = workflowConfig.name || "리서치-초안-저장";
  const workflowRun = { ok: true, name: workflowName, steps: [] };
  workflowRuntime.current = { workflowName, stepLabel: "접수", status: "running", updatedAt: new Date().toISOString() };
  try {
    for (const step of steps) {
      const agent = resolveAgent(step.agent);
      if (agent) workflowRuntime.agentTaskCounts[agent.id] = (workflowRuntime.agentTaskCounts[agent.id] || 0) + 1;
      workflowRuntime.current = { workflowName, stepLabel: step.label, status: "running", updatedAt: new Date().toISOString() };
      const generated = await runCodexWorkflowStep({ task, workflowName, step, agent, previousSteps: workflowRun.steps });
      const row = {
        id: step.id,
        label: step.label,
        agentId: agent?.id || step.agent,
        agentName: agent?.name || step.agent,
        status: "completed",
        evaluations: [],
        toolsUsed: [{ id: "codex_cli", label: "Codex CLI", detail: generated.commandLabel }],
        content: generated.text
      };
      if (workflowConfig.evaluation?.enabled && step.id === workflowConfig.evaluation.afterStep) {
        workflowRuntime.current = { workflowName, stepLabel: "검토", status: "evaluating", updatedAt: new Date().toISOString() };
        const evaluator = resolveAgent(workflowConfig.evaluation.agent || "secretary") || resolveAgent("secretary");
        if (evaluator) workflowRuntime.agentTaskCounts[evaluator.id] = (workflowRuntime.agentTaskCounts[evaluator.id] || 0) + 1;
        let evaluation = await evaluateWorkflowDraft({ task, content: row.content, criteria: workflowConfig.evaluation.criteria });
        row.evaluations.push({ agentId: evaluator?.id || "secretary", agentName: evaluator?.name || "운영 나래", status: evaluation.passed ? "passed" : "failed", passed: evaluation.passed, issues: evaluation.issues, summary: evaluation.summary, attempt: 1 });
        if (!evaluation.passed && Number(workflowConfig.evaluation.maxRetries || 0) > 0) {
          workflowRuntime.statusCounts.rework += 1;
          const reworked = await runCodexWorkflowStep({ task, workflowName, step, agent, previousSteps: workflowRun.steps, reworkNotes: evaluation.issues.join("; ") || evaluation.summary });
          row.content = reworked.text;
          row.status = "reworked";
          row.toolsUsed.push({ id: "codex_cli", label: "Codex CLI 재작업", detail: reworked.commandLabel });
          evaluation = await evaluateWorkflowDraft({ task, content: row.content, criteria: workflowConfig.evaluation.criteria });
          row.evaluations.push({ agentId: evaluator?.id || "secretary", agentName: evaluator?.name || "운영 나래", status: evaluation.passed ? "passed" : "failed", passed: evaluation.passed, issues: evaluation.issues, summary: evaluation.summary, attempt: 2 });
        }
        if (!row.evaluations.at(-1)?.passed) workflowRun.ok = false;
      }
      workflowRun.steps.push(row);
    }
  } catch (error) {
    workflowRun.ok = false;
    workflowRuntime.statusCounts.failed += 1;
    workflowRuntime.current = { workflowName, stepLabel: "중단", status: "failed", updatedAt: new Date().toISOString() };
    recordWorkflowError(workflowRuntime.current.stepLabel, error);
    throw error;
  }
  workflowRuntime.runCount += 1;
  if (workflowRun.ok) workflowRuntime.statusCounts.success += 1;
  else workflowRuntime.statusCounts.failed += 1;
  workflowRuntime.current = { workflowName: workflowRun.name, stepLabel: workflowRun.ok ? "완료" : "검토 미통과", status: workflowRun.ok ? "completed" : "failed", updatedAt: new Date().toISOString() };
  const report = [
    "# YOMI Office 업무 보고서",
    "",
    "## 1. 의도 해석",
    `"${task}"를 직원 인계 workflow로 접수했습니다.`,
    "",
    "## 2. 직원 간 인계 로그",
    ...workflowRun.steps.map((step, index) => `### ${index + 1}. ${step.label} · ${step.agentName}\n- 상태: ${step.status}\n${step.evaluations.length ? "- 검토: 운영 나래 통과" : ""}\n\n${step.content}`),
    "",
    "## 3. 다음 행동",
    "- 필요한 산출물 형식을 정하고 이어서 실행합니다.",
    "- 저장 가치가 있는 결과는 Vault에 남깁니다."
  ].join("\n");
  const assessmentJob = {
    report,
    capsule: {
      originalInput: task,
      normalizedTask: task,
      staffing: { level: workflowRun.steps.length >= 3 ? "deep" : "quick" }
    },
    subtasks: workflowRun.steps.map((step) => ({
      status: ["completed", "reworked"].includes(step.status) ? "completed" : "failed"
    })),
    plan: {}
  };
  const assessment = assessReusableOrchestration(assessmentJob);
  let saved = { ok: false, skipped: true, reason: assessment.reason, quality: assessment.quality, rag: false, assetReview: assessment };
  if (assessment.shouldSave) {
    saved = await saveReportToVault(task, report, assigned, {
      quality: assessment.quality,
      rag: assessment.rag,
      assetReview: assessment,
      tags: ["yomi-office", "yomi-ai", "personal-office", "auto-asset", "legacy-workflow", assessment.ragReady ? "rag-ready" : "review-candidate"]
    });
    if (saved?.ok) {
      saved.reason = assessment.reason;
      saved.assetReview = assessment;
    }
  }
  return { report, assigned, workflowRun, saved, llm: { provider: "codex-cli", model: "exec", used: true } };
}

function publicCodexJob(job) {
  return {
    id: job.id,
    task: job.task,
    status: job.status,
    commandLabel: job.commandLabel,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    exitCode: job.exitCode,
    output: String(job.output || "").slice(-16000),
    stderr: String(job.stderr || "").slice(-8000),
    error: job.error || "",
    saved: job.saved || null,
    logs: publicJobLogs(job)
  };
}

function formatCodexJobReport(job) {
  return [
    "# 코덱스 개발자 보고서",
    "",
    `- 상태: ${job.status}`,
    `- 작업: ${job.task}`,
    `- 실행: ${job.commandLabel}`,
    `- 종료 코드: ${job.exitCode ?? ""}`,
    "",
    "## stdout",
    job.output?.trim() || "코덱스 CLI 표준 출력이 없습니다.",
    job.stderr?.trim() ? `\n## stderr\n\`\`\`text\n${String(job.stderr).slice(-16000)}\n\`\`\`` : "",
    job.error ? `\n## 오류\n${job.error}` : ""
  ].filter(Boolean).join("\n");
}

async function saveCodexJobReport(job) {
  if (!automationRules.codexReportSave) {
    job.saved = { ok: false, skipped: true, reason: "자동화 규칙에서 코덱스 보고서 저장이 꺼져 있습니다" };
    return;
  }
  const assigned = ["developer", "archivist"].map(resolveAgent).filter(Boolean);
  job.saved = await saveReportToVault(`[코덱스] ${job.task}`, formatCodexJobReport(job), assigned);
}

function createCodexJob(task) {
  const command = codexCommand();
  const job = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    task,
    status: "queued",
    commandLabel: `${command} exec --sandbox read-only`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    output: "",
    stderr: "",
    exitCode: null,
    error: "",
    saved: null,
    logs: []
  };
  appendJobLog(job, "코덱스 작업이 큐에 등록되었습니다.", "taeo");
  codexJobs.set(job.id, job);
  runCodexJob(job, command);
  return job;
}

function runCodexJob(job, command) {
  job.status = "running";
  job.updatedAt = new Date().toISOString();
  appendJobLog(job, "Codex CLI 실행을 시작했습니다.", "taeo");
  const child = spawn(command, ["exec", "--sandbox", "read-only", job.task], { cwd: projectRoot, shell: false, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
  job.child = child;
  const timer = setTimeout(() => {
    job.error = "timeout";
    appendJobLog(job, "제한 시간을 넘겨 작업을 중단합니다.", "taeo", "warn");
    child.kill();
  }, codexTimeoutMs);
  child.stdout.on("data", (chunk) => {
    job.output = (job.output + chunk.toString()).slice(-maxCodexOutputBytes);
    const now = Date.now();
    if (!job.lastStreamLogAt || now - job.lastStreamLogAt > 2200) {
      appendJobLog(job, `출력을 수신 중입니다. 현재 ${job.output.length.toLocaleString("ko-KR")}자`, "taeo");
      job.lastStreamLogAt = now;
    }
    job.updatedAt = new Date().toISOString();
  });
  child.stderr.on("data", (chunk) => {
    job.stderr = (job.stderr + chunk.toString()).slice(-maxCodexOutputBytes);
    appendJobLog(job, "오류 출력이 감지되었습니다.", "taeo", "warn");
    job.updatedAt = new Date().toISOString();
  });
  child.on("error", async (error) => {
    clearTimeout(timer);
    delete job.child;
    job.status = "failed";
    job.error = error.message;
    job.updatedAt = new Date().toISOString();
    appendJobLog(job, `실행 실패: ${job.error}`, "taeo", "error");
    await saveCodexJobReport(job);
  });
  child.on("close", async (code) => {
    clearTimeout(timer);
    delete job.child;
    job.exitCode = code;
    job.status = job.cancelRequested ? "cancelled" : code === 0 && !job.error ? "completed" : "failed";
    job.updatedAt = new Date().toISOString();
    appendJobLog(
      job,
      job.status === "cancelled"
        ? "코덱스 작업이 취소되었습니다."
        : job.status === "completed"
          ? "코덱스 작업이 완료되었습니다."
          : `코덱스 작업이 실패했습니다. 종료 코드: ${code}`,
      "taeo",
      job.status === "completed" ? "info" : job.status === "cancelled" ? "warn" : "error"
    );
    await saveCodexJobReport(job);
  });
}

function parseChatRoute(message) {
  const text = String(message || "").trim();
  const claudeMatch = text.match(/^\/(?:cc|claude)(?:\s+|$)([\s\S]*)/i);
  if (claudeMatch) return { intent: "claude", task: claudeMatch[1].trim() };
  const codexMatch = text.match(/^\/codex(?:\s+|$)([\s\S]*)/i);
  if (codexMatch) return { intent: "codex", task: codexMatch[1].trim() };
  const vaultSlash = text.match(/^\/(?:저장소|vault|rag)(?:\s+|$)([\s\S]*)/i);
  if (vaultSlash) return { intent: "vault", task: vaultSlash[1].trim() || text };
  const officeSlash = text.match(/^\/업무(?:\s+|$)([\s\S]*)/i);
  if (officeSlash) return { intent: "office", task: officeSlash[1].trim() };
  const officeKeyword = text.match(/^(업무|작업|실행|보고서|조사|분석|정리|기획|계획|작성|만들기)\s*[:：-]\s*([\s\S]+)/i);
  if (officeKeyword) return { intent: "office", task: officeKeyword[2].trim() };
  return { intent: "auto", task: text };
}

async function classifyChatRouteWithCodex(message) {
  const prompt = [
    "너는 YOMI Office / 요미오피스의 라우터다.",
    "사용자 입력을 보고 아래 intent 중 하나를 골라 JSON만 반환한다.",
    "",
    "intent 종류:",
    "- conversation: 짧은 질문, 잡담, 아이디어 추천, 간단한 목록 생성, 바로 답하면 되는 요청",
    "- workflow: 블로그 초안, 콘텐츠 작성, 조사 후 정리, 기획안, 보고서처럼 직원 체인 산출물이 필요한 요청",
    "- vault: 저장소, 옵시디언, 예전에 저장한 내용, 문서 검색, RAG 근거가 필요한 요청",
    "- codex: 코드, 파일, 서버, API, 버그, 시스템 점검, 개발 작업처럼 프로젝트를 읽고 분석해야 하는 요청",
    "",
    "주의:",
    "- '콘텐츠 주제 5개 추천'처럼 짧은 추천은 conversation이다.",
    "- '블로그 글 초안 써줘', '조사해서 글로 작성'은 workflow다.",
    "- 삭제/이동/위험 명령은 자동 실행하지 않고 codex 분석으로 분류한다.",
    "",
    "반환 형식:",
    "{\"intent\":\"conversation\",\"task\":\"정리된 작업 내용\",\"reason\":\"짧은 이유\"}",
    "",
    `사용자 입력: ${message}`
  ].join("\n");
  const result = await runCodexPrompt(prompt, { timeoutMs: Math.min(codexPromptTimeoutMs, 90000) });
  if (!result.ok) return { intent: "codex_error", task: message, error: codexFailureMessage(result, "의도 판단") };
  try {
    const parsed = parseJsonObject(result.output);
    const intentMap = { conversation: "general", workflow: "office", vault_search: "vault", vault: "vault", codex_task: "codex", codex: "codex", general: "general", office: "office" };
    const intent = intentMap[String(parsed.intent || "").toLowerCase()] || "general";
    return { intent, task: String(parsed.task || message).trim() || message, reason: String(parsed.reason || "") };
  } catch (error) {
    return { intent: "general", task: message, reason: "Codex 라우팅 JSON 해석 실패, 일반 대화로 처리" };
  }
}

const routeTypeLabels = {
  general: "단순대화",
  office: "업무",
  vault: "저장소검색",
  codex: "코드작업",
  claude: "Claude Code"
};

const humanLoopRules = [
  { id: "ambiguous_instruction", label: "지시 모호", askWhen: "목표, 대상, 완료 기준, 산출물 중 핵심 정보가 빠져 실행 기준을 확정하기 어려울 때" },
  { id: "overwrite", label: "파일 덮어쓰기", askWhen: "기존 파일을 덮어쓰거나 삭제, 이동, 이름 변경할 가능성이 있을 때" },
  { id: "external_send", label: "외부 전송", askWhen: "메일, 업로드, API 호출처럼 로컬 밖으로 내용을 보낼 때" },
  { id: "cost_or_quota", label: "비용 발생", askWhen: "유료 API, 크레딧, 대량 호출, 긴 실행처럼 비용이나 쿼터를 쓸 때" },
  { id: "secret_or_auth", label: "비밀키/인증", askWhen: ".env, 토큰, 세션, API 키, 로그인 정보가 필요한 작업일 때" },
  { id: "git_write", label: "Git 쓰기 작업", askWhen: "commit, push, reset, checkout, rebase, clean 등 저장소 상태를 바꾸는 작업일 때" },
  { id: "unclear_save_target", label: "저장 위치 애매", askWhen: "저장 위치, 파일명, 덮어쓰기 여부가 명확하지 않을 때" }
];

const agentSkillHints = {
  ceo: ["planner", "vault_search", "file_read"],
  secretary: ["checklist_ticket", "vault_search"],
  researcher: ["codex_research", "web_fetch", "pdf_research", "screenshot_evidence", "vault_search", "exa_search", "firecrawl_extract", "tavily_search"],
  business: ["codex_research", "data_analysis", "notebook_analysis", "planner"],
  developer: ["file_read", "context7_docs", "browser_check", "playwright_mcp_skill", "tdd_testing", "security_review", "file_write", "git"],
  writer: ["vault_search", "drafting", "copywriting", "storytelling"],
  editor: ["vault_search", "content_edit", "tone_check"],
  designer: ["source_synthesis", "web_fetch", "screenshot_evidence", "browser_check", "design_template"],
  youtube: ["source_synthesis", "web_fetch", "video_template", "seo_geo"],
  instagram: ["source_synthesis", "web_fetch", "sns_template", "seo_geo", "copywriting"],
  archivist: ["vault_search", "file_write", "tagging_rag"]
};

function compactLine(text, maxLength = 42) {
  const value = String(text || "").replace(/\s+/g, " ").trim();
  if (!value) return "";
  return value.length > maxLength ? `${value.slice(0, maxLength).trim()}...` : value;
}

function inferYomiWorkType(text, intent = "office") {
  const value = String(text || "").toLowerCase();
  if (intent === "codex" || /(코드|버그|api|서버|파일|css|dom|콘솔|빌드|테스트|수정|개발|git|npm|typescript|javascript|extension)/i.test(value)) return "code";
  if (intent === "vault" || /(저장소|vault|옵시디언|문서 검색|rag|기록|찾아|예전에)/i.test(value)) return "vault";
  if (/(영상|유튜브|쇼츠|릴스|썸네일|대본)/i.test(value)) return "video";
  if (/(인스타|sns|캡션|해시태그|카드뉴스|릴스)/i.test(value)) return "social";
  if (/(디자인|화면|ui|ux|레이아웃|피그마|시각|브랜딩)/i.test(value)) return "design";
  if (/(조사|리서치|근거|사례|자료|시장|경쟁사|최신)/i.test(value)) return "research";
  if (/(전략|사업|수익|kpi|우선순위|로드맵|방향|기획)/i.test(value)) return "strategy";
  if (/(체크리스트|할\s*일|업무\s*목록|티켓|일정|todo|task|진행\s*관리|운영)/i.test(value)) return "general_work";
  if (/(글|문서|보고서|카피|블로그|작성|초안|정리)/i.test(value)) return "writing";
  return "general_work";
}

function criteriaForWorkType(workType) {
  const common = ["요청의 목표와 완료 기준이 한 문장으로 확인된다.", "직원별 산출물이 최종 보고서로 합쳐질 수 있다."];
  const byType = {
    code: ["변경 대상 파일과 검증 방법이 분리되어 있다.", "쓰기 작업이 필요한 경우 사용자 확인을 먼저 받는다."],
    vault: ["검색 키워드와 근거 문서 기준이 명확하다.", "답변에 참조 문서 경로를 남길 수 있다."],
    video: ["후킹 문장, 구성, 플랫폼별 산출물이 구분된다."],
    social: ["캡션, 해시태그, 재활용 포맷이 분리된다."],
    design: ["현재 문제, 개선 방향, 화면 적용 기준이 구분된다."],
    research: ["근거, 리스크, 활용 포인트가 분리된다."],
    strategy: ["우선순위, 기대 효과, 다음 액션이 분리된다."],
    writing: ["초안, 편집 기준, 최종 문체가 구분된다."],
    general_work: ["체크리스트와 최종 산출물 형태가 확인된다."]
  };
  return [...common, ...(byType[workType] || byType.general_work)];
}

function deliverablesForWorkType(workType) {
  const byType = {
    code: ["작업 분석", "변경 계획", "검증 체크리스트"],
    vault: ["검색 질의", "근거 문서 목록", "요약 답변"],
    video: ["영상 훅", "구성안", "제목 후보"],
    social: ["SNS 캡션", "해시태그", "재활용 포맷"],
    design: ["문제 진단", "개선안", "화면 적용 체크리스트"],
    research: ["근거 요약", "리스크", "활용 제안"],
    strategy: ["우선순위", "실행 로드맵", "KPI 후보"],
    writing: ["문서 초안", "편집 메모", "최종 요약"],
    general_work: ["업무 체크리스트", "직원별 결과", "최종 보고서"]
  };
  return byType[workType] || byType.general_work;
}

function goalQuestionsForWorkType(workType, text = "") {
  const common = [
    "이 작업이 끝났을 때 어떤 결과를 보면 성공이라고 판단할지",
    "결과물을 어디에 바로 사용할지",
    "반드시 피해야 할 표현, 형식, 리스크가 있는지"
  ];
  const byType = {
    code: ["읽기 분석만 필요한지 실제 파일 수정까지 원하는지", "검증 기준과 허용되는 명령 범위가 무엇인지"],
    vault: ["기존 자료 중 우선 참고해야 할 폴더나 키워드가 있는지", "검색 결과를 요약, 비교, 재구성 중 어떤 방식으로 쓸지"],
    video: ["플랫폼, 길이, 첫 3초 훅의 방향이 무엇인지", "참고하고 싶은 채널이나 피하고 싶은 스타일이 있는지"],
    social: ["플랫폼, 타깃, 게시 목적이 무엇인지", "브랜드 톤과 금지 표현이 무엇인지"],
    design: ["사용자가 화면을 보고 어떤 감정을 느껴야 하는지", "예쁘게 보이는 것과 실제 사용성 중 무엇을 더 우선할지"],
    research: ["조사의 대상 범위와 제외 범위가 무엇인지", "최신성, 근거 신뢰도, 사례 수 중 무엇을 우선할지"],
    strategy: ["가장 중요한 KPI나 의사결정 기준이 무엇인지", "단기 실행과 장기 방향 중 어느 쪽을 우선할지"],
    writing: ["독자, 톤, 분량, 배포 채널이 무엇인지", "초안/완성본/요약본 중 필요한 산출물이 무엇인지"],
    general_work: ["우선순위, 마감, 산출물 형식이 무엇인지", "누가 이 결과를 보고 어떤 행동을 해야 하는지"]
  };
  const broadRequest = /(완성|알아서|제대로|좋게|최적|최선)/i.test(text)
    ? ["'완성'의 기준을 품질, 속도, 실사용 가능성 중 무엇에 둘지"]
    : [];
  return [...new Set([...common, ...(byType[workType] || byType.general_work), ...broadRequest])].slice(0, 6);
}

function materialNeedsForWorkType(workType) {
  const common = [
    "기존 Vault/RAG에서 관련 문서 top-k를 먼저 찾는다.",
    "사용자가 자료를 모르면 AI가 참고 키워드와 필요한 재료 목록을 먼저 제안한다.",
    "출처가 있는 자료와 사용자의 고정 선호를 분리해 반영한다."
  ];
  const byType = {
    code: ["대상 파일, 오류 로그, 재현 방법, 검증 명령", "변경 전후를 판단할 체크리스트"],
    vault: ["검색 키워드, 참고 폴더, 관련 태그, 예전 결정 기록", "답변에 명시할 파일 경로"],
    video: ["주제 근거, 타깃 반응, 레퍼런스 링크, 금지 스타일", "후킹/구성/제목 후보를 나눌 자료"],
    social: ["브랜드 톤, 타깃, 플랫폼 규격, 해시태그 근거", "게시 후 성과 기록 항목"],
    design: ["현재 화면 문제, 참고 스타일, 사용자 행동, 우선순위", "디자인 결정 기록으로 남길 기준"],
    research: ["최신 자료, 비교 사례, 리스크 근거, 반대 사례", "검색 키워드 후보와 신뢰도 기준"],
    strategy: ["목표 지표, 현재 제약, 경쟁/대안 사례, 실행 비용", "의사결정 표로 비교할 판단 기준"],
    writing: ["기존 말투 샘플, 독자 정보, 핵심 메시지, 참고 문서", "재사용 가능한 문장/구조 후보"],
    general_work: ["목표, 제약, 참고자료, 완료 기준"]
  };
  return [...common, ...(byType[workType] || byType.general_work)];
}

function detectHumanLoopReasons(text, workType) {
  const value = String(text || "");
  const reasons = [];
  const fileReference = /(?:\b(?:README|AGENTS|ARCHITECTURE)(?:\.md)?\b|[\w가-힣 ._\-/\\]+\.(?:md|js|ts|tsx|jsx|json|css|html|mjs|cjs|py|yml|yaml|txt|png|jpe?g|svg))/i;
  const fileMutationVerb = /(덮어쓰|덮어써|overwrite|삭제|지워|이동|rename|replace|교체|수정|바꿔|변경|편집|write|edit|modify|change)/i;
  const checks = [
    { id: "overwrite", pattern: /(덮어쓰|덮어써|overwrite|삭제|지워|이동|rename|replace|교체)/i, reason: "기존 파일 변경 가능성이 있어 확인이 필요합니다." },
    { id: "external_send", pattern: /(메일\s*보내|이메일\s*보내|업로드|전송|배포|publish|deploy|api\s*호출)/i, reason: "외부 전송 또는 배포 가능성이 있어 확인이 필요합니다." },
    { id: "cost_or_quota", pattern: /(결제|구매|유료|크레딧|대량\s*호출|비용|quota|billing)/i, reason: "비용이나 쿼터 사용 가능성이 있어 확인이 필요합니다." },
    { id: "secret_or_auth", pattern: /(\.env|토큰|세션|로그인|api\s*key|비밀키|인증|password|secret)/i, reason: "비밀키나 인증 정보가 필요할 수 있어 확인이 필요합니다." },
    { id: "git_write", pattern: /(git\s*(commit|push|reset|checkout|rebase|clean)|커밋|푸시|리셋)/i, reason: "Git 쓰기 작업 가능성이 있어 확인이 필요합니다." },
    { id: "unclear_save_target", pattern: /(어디에\s*저장|파일명|같은\s*파일|기존\s*파일|특정\s*폴더|원래\s*위치|그\s*파일|저장\s*위치)/i, reason: "저장 위치와 파일명 확정이 필요합니다." }
  ];
  for (const check of checks) {
    if (check.pattern.test(value)) reasons.push(check);
  }
  if (fileReference.test(value) && fileMutationVerb.test(value)) {
    reasons.push({ id: "overwrite", reason: "특정 파일을 변경하는 요청이라 실행 전 확인이 필요합니다." });
  }
  if (value.replace(/\s+/g, "").length < 12 || /(알아서|대충|좋게|멋지게|적당히|제대로)\s*(해줘|만들어줘|진행해)?\s*$/i.test(value)) {
    reasons.unshift({ id: "ambiguous_instruction", reason: "목표나 완료 기준이 모호해 한 번 확인하는 편이 안전합니다." });
  }
  if (workType === "code" && !/(읽|분석|점검|검토|수정|파일|오류|버그|테스트)/i.test(value)) {
    reasons.push({ id: "ambiguous_instruction", reason: "코드 작업 범위가 구체적이지 않습니다." });
  }
  return Array.from(new Map(reasons.map((item) => [item.id, item])).values()).map((item) => ({ id: item.id, reason: item.reason }));
}

function buildHumanLoopQuestion(reasons = []) {
  const riskyIds = new Set(["overwrite", "external_send", "cost_or_quota", "secret_or_auth", "git_write", "unclear_save_target"]);
  const risky = reasons.some((item) => riskyIds.has(item.id));
  const choices = risky
    ? [
        {
          id: "safe_plan",
          label: "안전 분석만 진행",
          description: "파일 쓰기, Git 쓰기, 외부 전송, 비용 발생 없이 계획과 산출물만 만듭니다.",
          recommended: true
        },
        {
          id: "cancel",
          label: "취소",
          description: "작업을 멈추고 큐에 취소 상태로 남깁니다.",
          recommended: false
        }
      ]
    : [
        {
          id: "continue_as_written",
          label: "현재 지시로 진행",
          description: "지금 입력을 기준으로 직원 실행을 재개합니다.",
          recommended: true
        },
        {
          id: "cancel",
          label: "취소",
          description: "작업을 멈추고 큐에 취소 상태로 남깁니다.",
          recommended: false
        }
      ];
  return {
    title: risky ? "안전모드로 진행할까요?" : "현재 지시로 진행할까요?",
    message: risky
      ? "위험하거나 되돌리기 어려운 작업 가능성이 있어 멈췄습니다. 안전 분석은 실제 변경 없이 진행합니다."
      : "지시가 모호해서 멈췄습니다. 현재 입력 그대로 진행하거나 취소할 수 있습니다.",
    reasons,
    choices
  };
}

function inferTaskEffort(text, workType) {
  const value = String(text || "");
  const compact = value.replace(/\s+/g, "");
  const deepPattern = /(중요|자세|상세|정밀|제대로|완성도|전체|전부|종합|보고서|전략|로드맵|출시|고객|매출|계약|장기|시스템|아키텍처|리팩토링|심층|deep|full)/i;
  const quickPattern = /(간단|짧게|빠르게|대략|초안만|아이디어만|한\s*줄|요약만|가볍게|quick|brief)/i;
  if (deepPattern.test(value) || compact.length > 120) {
    return { level: "deep", maxAgents: 5, reason: "중요도나 범위가 커서 관련 담당자를 넓게 투입합니다." };
  }
  if (quickPattern.test(value) || compact.length <= 42) {
    return { level: "quick", maxAgents: 1, reason: "짧거나 단순한 요청이라 핵심 담당자 1명만 배정합니다." };
  }
  if (["code", "research", "strategy"].includes(workType) && compact.length > 72) {
    return { level: "deep", maxAgents: 4, reason: "검증과 판단이 필요한 업무라 보조 담당자를 포함합니다." };
  }
  return { level: "standard", maxAgents: 2, reason: "일반 업무라 핵심 담당자와 보조 담당자만 배정합니다." };
}

const primaryAgentByWorkType = {
  code: "developer",
  vault: "archivist",
  video: "youtube",
  social: "instagram",
  design: "designer",
  research: "researcher",
  strategy: "business",
  writing: "writer",
  general_work: "secretary"
};

const standardAgentsByWorkType = {
  code: ["developer", "secretary"],
  vault: ["archivist", "writer"],
  video: ["youtube", "editor"],
  social: ["instagram", "editor"],
  design: ["designer", "business"],
  research: ["researcher", "business"],
  strategy: ["business", "secretary"],
  writing: ["writer", "editor"],
  general_work: ["secretary", "business"]
};

function subtaskTemplatesForWorkType(workType) {
  const templates = {
    code: [
      ["ceo", "작업 범위 확정", "요청을 읽기/수정/검증 범위로 나눈다.", "작업캡슐"],
      ["developer", "코드 영향 분석", "대상 파일과 위험도를 점검한다.", "변경 계획"],
      ["secretary", "검증 체크리스트", "실행 전 확인할 기준을 정리한다.", "검증 목록"],
      ["archivist", "저장/기록 후보", "재사용 가능한 결과와 태그 후보를 분류한다.", "자산화 메모"]
    ],
    vault: [
      ["ceo", "질문 재정의", "저장소 검색 목표를 명확히 한다.", "검색 목표"],
      ["archivist", "Vault 검색 설계", "키워드와 폴더 후보를 정한다.", "검색 쿼리"],
      ["writer", "근거 요약", "찾은 문서를 답변 구조로 묶는다.", "요약 초안"],
      ["secretary", "누락 확인", "근거 부족 여부와 다음 질문을 정리한다.", "검토 메모"]
    ],
    video: [
      ["ceo", "목표/시청자 정의", "영상 목적과 완료 기준을 정한다.", "기획 기준"],
      ["researcher", "레퍼런스 수집", "주제와 플랫폼 참고 포인트를 모은다.", "레퍼런스 메모"],
      ["youtube", "영상 구성", "훅, 제목, 장면 순서를 만든다.", "영상 구성안"],
      ["editor", "리듬 편집", "압축과 강조 지점을 잡는다.", "편집 메모"],
      ["archivist", "자산화", "저장 태그와 재사용 후보를 정리한다.", "태그 후보"]
    ],
    social: [
      ["ceo", "캠페인 목표 정의", "목표, 대상, 톤을 정한다.", "운영 기준"],
      ["researcher", "레퍼런스 수집", "트렌드와 근거를 모은다.", "레퍼런스 메모"],
      ["instagram", "SNS 포맷 설계", "캡션, 해시태그, 릴스 포맷을 만든다.", "SNS 패키지"],
      ["editor", "문장 압축", "짧고 선명한 표현으로 다듬는다.", "편집안"],
      ["archivist", "자산화", "재사용 태그를 정리한다.", "태그 후보"]
    ],
    design: [
      ["ceo", "개선 목표 정의", "사용자가 느껴야 할 변화와 완료 기준을 정한다.", "디자인 목표"],
      ["designer", "화면 구조안", "레이아웃, 정보 위계, 시각 톤을 제안한다.", "디자인 개선안"],
      ["business", "효과 판단", "사용자 반응과 우선순위를 판단한다.", "우선순위"],
      ["editor", "문구 정리", "화면 문구와 라벨을 다듬는다.", "UX 문구"],
      ["archivist", "자산화", "디자인 결정 기록과 태그를 정리한다.", "결정 기록"]
    ],
    research: [
      ["ceo", "조사 질문 확정", "핵심 질문과 완료 기준을 정한다.", "조사 기준"],
      ["researcher", "자료 수집", "근거, 사례, 리스크를 모은다.", "자료 메모"],
      ["business", "판단 프레임", "우선순위와 실행 의미를 분석한다.", "판단표"],
      ["writer", "보고서 초안", "근거를 읽기 쉬운 보고서로 묶는다.", "보고서 초안"],
      ["archivist", "자산화", "저장 태그와 RAG 후보를 분류한다.", "분류 메모"]
    ],
    strategy: [
      ["ceo", "목표 정렬", "목표와 의사결정 기준을 정한다.", "전략 기준"],
      ["business", "우선순위 판단", "기대 효과, 리스크, KPI를 분석한다.", "전략안"],
      ["researcher", "근거 보강", "판단에 필요한 자료를 모은다.", "근거 메모"],
      ["secretary", "실행 체크리스트", "다음 액션을 티켓처럼 나눈다.", "체크리스트"],
      ["archivist", "자산화", "결정 사항과 태그를 정리한다.", "결정 기록"]
    ],
    writing: [
      ["ceo", "문서 목표 정의", "독자, 목적, 완료 기준을 정한다.", "문서 기준"],
      ["researcher", "근거 확인", "필요한 자료와 맥락을 모은다.", "근거 메모"],
      ["writer", "초안 작성", "요청에 맞는 본문 초안을 작성한다.", "초안"],
      ["editor", "편집", "리듬, 압축, 강조를 다듬는다.", "편집본"],
      ["archivist", "자산화", "저장 태그와 재사용 후보를 정한다.", "자산화 메모"]
    ],
    general_work: [
      ["ceo", "목표/완료 기준 정의", "요청을 실행 가능한 업무로 정리한다.", "작업캡슐"],
      ["secretary", "체크리스트화", "일정, 확인점, 누락 질문을 정리한다.", "체크리스트"],
      ["business", "우선순위 판단", "효과와 리스크 기준으로 순서를 잡는다.", "우선순위"],
      ["writer", "결과 정리", "직원 산출물을 보고서로 묶는다.", "최종 초안"],
      ["archivist", "자산화", "저장 가치와 태그 후보를 정한다.", "분류 메모"]
    ]
  };
  return templates[workType] || templates.general_work;
}

function selectSubtaskTemplates(workType, staffing) {
  const templates = subtaskTemplatesForWorkType(workType).filter((item) => item[0] !== "ceo");
  const byAgent = new Map(templates.map((item) => [item[0], item]));
  const makeFallback = (agentId) => {
    const agent = resolveAgent(agentId) || resolveAgent("secretary") || { id: agentId, role: "" };
    return [agent.id, `${agent.role || "담당"} 처리`, "역할에 맞는 핵심 산출물을 만든다.", "핵심 산출물"];
  };
  if (staffing.level === "quick") {
    const agentId = primaryAgentByWorkType[workType] || "secretary";
    return [byAgent.get(agentId) || makeFallback(agentId)];
  }
  if (staffing.level === "standard") {
    const agentIds = standardAgentsByWorkType[workType] || ["secretary", primaryAgentByWorkType[workType] || "writer"];
    return agentIds.slice(0, staffing.maxAgents).map((agentId) => byAgent.get(agentId) || makeFallback(agentId));
  }
  return templates.slice(0, staffing.maxAgents || templates.length);
}

function createYomiTaskCapsule(message, route) {
  const workType = inferYomiWorkType(route.task || message, route.intent);
  const title = compactLine(route.task || message, 36) || "새 업무";
  const questionReasons = detectHumanLoopReasons(route.task || message, workType);
  const staffing = inferTaskEffort(route.task || message, workType);
  const humanLoopQuestion = questionReasons.length ? buildHumanLoopQuestion(questionReasons) : null;
  const requestedEngine = requestedEngineFromText(route.task || message);
  const selectedEngine = normalizeEngineId(requestedEngine || defaultEngineForWorkType(workType, staffing));
  return {
    id: `task-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
    source: "chat",
    orchestrator: { id: "ceo", name: "요미", role: "총괄 매니저" },
    route: {
      intent: route.intent,
      label: routeTypeLabels[route.intent] || "업무",
      reason: route.reason || "명시적 업무 지시",
      confidence: route.reason ? "codex-assisted" : "rule-based"
    },
    title,
    originalInput: message,
    normalizedTask: route.task || message,
    workType,
    engine: {
      ...engineMeta(selectedEngine),
      selection: requestedEngine ? "user-requested" : workType === "code" ? "code-route" : "worktype-route",
      fallback: selectedEngine === "claude" ? "codex" : ""
    },
    staffing,
    goal: `${title} 작업을 직원별 산출물로 나누고 최종 보고 가능한 형태로 정리한다.`,
    goalDefinitionQuestions: goalQuestionsForWorkType(workType, route.task || message),
    completionCriteria: criteriaForWorkType(workType),
    deliverables: deliverablesForWorkType(workType),
    materialBrief: {
      strategy: "사용자가 자료를 정확히 모르더라도 Vault/RAG 검색과 질문으로 좋은 재료를 찾는다.",
      needs: materialNeedsForWorkType(workType),
      ragQuery: [title, workType, route.task || message].filter(Boolean).join(" ")
    },
    constraints: [
      "사소한 일은 핵심 담당자만 처리하고, 중요한 일만 관련 직원을 확장 투입한다.",
      "직원은 자기 역할에 맞는 서브태스크만 맡는다.",
      "확실한 것은 계획까지 자동으로 만들고, 애매하거나 위험한 것은 사용자에게 질문한다."
    ],
    savePolicy: {
      target: "Vault/50_Outputs/YOMI Office/YYYY-MM-DD",
      format: "Markdown with frontmatter tags",
      overwrite: "never; timestamped filenames only",
      autoSaveWhen: [
        "작업 지시가 명확하고 사용자 확인 사유가 없다.",
        "최종 보고서 또는 중간 산출물이 재사용 가치 기준을 충족한다.",
        "저장 위치와 파일명이 기본 정책으로 확정 가능하다."
      ],
      askBeforeSaveWhen: humanLoopRules.map((rule) => `${rule.label}: ${rule.askWhen}`)
    },
    needsQuestion: questionReasons.length > 0,
    questionReasons,
    humanLoopQuestion,
    humanLoopRules
  };
}

function createYomiAssignmentPlan(capsule) {
  const templates = selectSubtaskTemplates(capsule.workType, capsule.staffing || { level: "standard", maxAgents: 2 });
  const subtasks = templates.map((item, index) => {
    const [agentId, label, objective, output] = item;
    const agent = resolveAgent(agentId) || { id: agentId, name: agentId, role: "" };
    const parallelGroup = templates.length <= 2 ? 0 : index <= 1 ? 0 : index === templates.length - 1 ? 2 : 1;
    const engine = engineMeta(defaultEngineForAgent(agent.id, capsule));
    return {
      id: `subtask-${index + 1}`,
      agentId: agent.id,
      agentName: agent.name,
      role: agent.role,
      label,
      objective,
      expectedOutput: output,
      status: "planned",
      engine,
      parallelGroup,
      retryPolicy: "2단계 실행 엔진에서 실패 시 1회 재시도",
      allowedSkills: agentSkillHints[agent.id] || []
    };
  });
  for (const step of subtasks) {
    const previousGroups = subtasks
      .filter((item) => Number(item.parallelGroup || 0) < Number(step.parallelGroup || 0))
      .map((item) => Number(item.parallelGroup || 0));
    const previousGroup = previousGroups.length ? Math.max(...previousGroups) : null;
    const dependencies = previousGroup == null ? [] : subtasks.filter((item) => Number(item.parallelGroup || 0) === previousGroup);
    step.dependsOn = dependencies.map((item) => item.id);
    step.handoffFrom = dependencies.map((item) => ({ id: item.id, agentId: item.agentId, agentName: item.agentName, label: item.label }));
    step.handoffPolicy = dependencies.length
      ? "이전 그룹 산출물을 검토한 뒤 자기 역할에 필요한 부분만 이어받는다."
      : "초기 실행 그룹으로 사용자 지시와 Vault/RAG 컨텍스트를 직접 해석한다.";
  }
  return {
    mode: "plan_only",
    staffing: capsule.staffing,
    workerPool: "parallelGroup별 Promise.all 기반 워커 풀. quick은 1명, standard는 핵심 2명, deep은 관련 직원을 확장 실행",
    activeAgentIds: Array.from(new Set(subtasks.map((step) => step.agentId))),
    subtasks,
    questionRequired: capsule.needsQuestion,
    questionReasons: capsule.questionReasons,
    humanLoopQuestion: capsule.humanLoopQuestion,
    nextAction: capsule.needsQuestion ? "사용자 확인 후 실행 계획 확정" : "2단계 병렬 직원 실행 대기"
  };
}

function createYomiOrchestration(message, route) {
  const capsule = createYomiTaskCapsule(message, route);
  const plan = createYomiAssignmentPlan(capsule);
  return { capsule, plan };
}

function workflowRunFromYomiPlan(plan) {
  return {
    ok: true,
    name: "요미 라우팅 계획",
    steps: (plan?.subtasks || []).map((step) => ({
      id: step.id,
      label: step.label,
      agentId: step.agentId,
      agentName: step.agentName,
      status: step.status,
      evaluations: [],
      toolsUsed: [{ id: step.engine?.id || "codex", label: step.engine?.label || "Codex CLI" }, ...(step.allowedSkills || []).map((skill) => ({ id: skill, label: skill }))],
      content: `${step.objective}\n\n예상 산출물: ${step.expectedOutput}`
    }))
  };
}

function formatYomiPlanReply(orchestration) {
  const { capsule, plan } = orchestration;
  const questionBlock = capsule.needsQuestion
    ? ["", "## 확인 필요", ...capsule.questionReasons.map((item) => `- ${item.reason}`)].join("\n")
    : "";
  const contextUseBlock = formatContextUsePlan(capsule.contextUse || plan.contextUse || {});
  return [
    "# 요미 라우팅 결과",
    "",
    `- 분류: ${capsule.route.label}`,
    `- 작업 유형: ${capsule.workType}`,
    `- 담당 엔진: ${capsule.engine?.label || "Codex CLI"}`,
    `- 배정 규모: ${capsule.staffing?.level || "standard"} · 최대 ${capsule.staffing?.maxAgents || plan.subtasks.length}명`,
    `- 배정 이유: ${capsule.staffing?.reason || "역할 기반 배정"}`,
    `- 목표: ${capsule.goal}`,
    `- 다음 상태: ${plan.nextAction}`,
    "",
    "## 목표 정의 질문",
    ...(capsule.goalDefinitionQuestions || []).map((question) => `- ${question}`),
    "",
    "## 필요한 재료",
    ...(capsule.materialBrief?.needs || []).slice(0, 6).map((item) => `- ${item}`),
    "",
    "## 직원 분배 계획",
    ...plan.subtasks.map((step) => `- ${step.agentName}(${step.role}): ${step.label} → ${step.expectedOutput} · ${step.engine?.label || "Codex CLI"}`),
    "",
    contextUseBlock,
    questionBlock,
    "",
    "## 작업캡슐 JSON",
    "```json",
    JSON.stringify({ taskCapsule: capsule, assignmentPlan: plan }, null, 2),
    "```"
  ].join("\n");
}

function publicOrchestrationJob(job) {
  if (!job) return null;
  return {
    id: job.id,
    status: job.status,
    mode: job.mode,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    capsule: job.capsule,
    plan: job.plan,
    humanLoopQuestion: job.humanLoopQuestion || job.plan?.humanLoopQuestion || job.capsule?.humanLoopQuestion || null,
    humanLoopAnswer: job.humanLoopAnswer || null,
    subtasks: job.subtasks,
    handoffs: buildHandoffLinks(job),
    reflections: job.reflections || [],
    performance: job.performance || null,
    learning: job.learning || null,
    assetReview: job.assetReview || job.saved?.assetReview || null,
    contextUse: job.contextUse || job.capsule?.contextUse || null,
    report: job.report || "",
    error: job.error || "",
    llm: job.llm,
    saved: job.saved || null,
    logs: publicJobLogs(job),
    context: publicContextSummary(job.context)
  };
}

function taskQueueCodexRow(job) {
  const latestOutput = String(job.output || job.stderr || job.error || "").trim().split(/\r?\n/).filter(Boolean).slice(-1)[0] || "";
  return {
    type: "codex",
    id: job.id,
    restored: false,
    title: job.task || "코덱스 작업",
    status: job.status,
    statusLabel: serverJobStatusLabel(job.status),
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    completedAt: finalJobStatuses.has(job.status) ? job.updatedAt : "",
    detail: job.commandLabel || "Codex CLI",
    progress: latestOutput.slice(0, 180),
    saved: job.saved || null,
    activeAgentIds: job.status === "running" ? ["developer"] : [],
    logs: publicJobLogs(job, 8)
  };
}

function taskQueueOrchestrationRow(job) {
  const subtasks = job.subtasks || [];
  const completed = subtasks.filter((step) => step.status === "completed").length;
  const sourceCount = Number(job.contextUse?.sourceCount || job.context?.sources?.length || 0);
  const current = subtasks.find((step) => ["running", "retrying"].includes(step.status))
    || subtasks.find((step) => step.status === "queued")
    || subtasks.find((step) => !["completed", "failed"].includes(step.status));
  return {
    type: "office",
    id: job.id,
    restored: false,
    title: job.capsule?.normalizedTask || job.capsule?.goal || job.message || "요미 직원 실행",
    status: job.status,
    statusLabel: serverJobStatusLabel(job.status),
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    completedAt: job.completedAt || (finalJobStatuses.has(job.status) ? job.updatedAt : ""),
    detail: `${completed}/${subtasks.length || 0}명 완료 · ${job.capsule?.staffing?.level || "standard"}${sourceCount ? ` · RAG ${sourceCount}` : ""}`,
    progress: current ? `${current.agentName || current.agentId} · ${current.label || "진행 중"} · ${serverJobStatusLabel(current.status)}` : (job.error || job.saved?.reason || ""),
    saved: job.saved || null,
    activeAgentIds: finalJobStatuses.has(job.status) ? [] : subtasks.filter((step) => ["running", "retrying", "queued"].includes(step.status)).map((step) => step.agentId).filter(Boolean),
    logs: publicJobLogs(job, 8)
  };
}

function defaultTaskQueueHistory() {
  return { jobs: [] };
}

function taskQueueRowKey(row) {
  return `${row?.type || "job"}:${row?.id || ""}`;
}

function normalizeTaskQueueHistoryRow(row = {}) {
  const status = ["queued", "running", "retrying", "finalizing"].includes(row.status) ? "cancelled" : String(row.status || "completed");
  return {
    type: String(row.type || "office"),
    id: String(row.id || ""),
    restored: true,
    title: String(row.title || row.task || "이전 작업"),
    status,
    statusLabel: serverJobStatusLabel(status),
    createdAt: String(row.createdAt || ""),
    startedAt: String(row.startedAt || row.createdAt || ""),
    updatedAt: String(row.updatedAt || row.completedAt || row.createdAt || ""),
    completedAt: String(row.completedAt || row.updatedAt || ""),
    detail: String(row.detail || ""),
    progress: ["queued", "running", "retrying", "finalizing"].includes(row.status) ? "서버 재시작으로 실행이 중단되었습니다. 필요하면 재시도하세요." : String(row.progress || ""),
    saved: row.saved || null,
    activeAgentIds: [],
    logs: Array.isArray(row.logs) ? row.logs.slice(-8) : []
  };
}

function readTaskQueueHistorySync() {
  try {
    const parsed = JSON.parse(readFileSync(taskQueueHistoryPath, "utf8"));
    return { jobs: (Array.isArray(parsed.jobs) ? parsed.jobs : []).map(normalizeTaskQueueHistoryRow).filter((row) => row.id) };
  } catch {
    return defaultTaskQueueHistory();
  }
}

function writeTaskQueueHistorySync(rows = []) {
  try {
    mkdirSync(runtimeRoot, { recursive: true });
    const normalized = rows
      .filter((row) => row?.id)
      .sort((a, b) => jobTimeValue(b.updatedAt || b.createdAt) - jobTimeValue(a.updatedAt || a.createdAt))
      .slice(0, 80)
      .map((row) => ({ ...normalizeTaskQueueHistoryRow(row), restored: false }));
    writeFileSync(taskQueueHistoryPath, `${JSON.stringify({ jobs: normalized }, null, 2)}\n`, "utf8");
  } catch {
    // Runtime history is best-effort. The live queue must keep working even if persistence fails.
  }
}

function mergeTaskQueueRows(currentRows = [], historyRows = []) {
  const rows = new Map();
  for (const row of historyRows.map(normalizeTaskQueueHistoryRow)) {
    if (row.id) rows.set(taskQueueRowKey(row), row);
  }
  for (const row of currentRows) {
    if (row?.id) rows.set(taskQueueRowKey(row), { ...row, restored: false });
  }
  return [...rows.values()]
    .map(enrichTaskQueueRow)
    .sort((a, b) => (a.sortRank - b.sortRank) || jobTimeValue(b.updatedAt || b.createdAt) - jobTimeValue(a.updatedAt || a.createdAt));
}

function buildTaskQueueState(limit = 20) {
  const currentRows = [
    ...[...orchestrationJobs.values()].map(taskQueueOrchestrationRow),
    ...[...codexJobs.values()].map(taskQueueCodexRow)
  ];
  const mergedRows = mergeTaskQueueRows(currentRows, readTaskQueueHistorySync().jobs);
  writeTaskQueueHistorySync(mergedRows);
  const reviewDecisionsByKey = taskQueueReviewDecisionMapSync();
  const jobs = mergedRows
    .slice(0, Math.max(1, Math.min(50, Number(limit) || 20)))
    .map((job) => attachTaskQueueReviewDecision(job, reviewDecisionsByKey));
  const running = jobs.filter((job) => taskQueueActiveStatuses.has(job.status));
  const completed = jobs.filter((job) => job.status === "completed");
  const failed = jobs.filter((job) => job.needsAttention && ["failed", "cancelled"].includes(job.status));
  const waiting = jobs.filter((job) => job.needsAttention && job.status === "waiting_question");
  const partial = jobs.filter((job) => job.needsAttention && job.status === "completed_with_errors");
  const restored = jobs.filter((job) => job.restored);
  const attention = jobs.filter((job) => job.needsAttention);
  const latestCompleted = [...completed, ...partial]
    .sort((a, b) => jobTimeValue(b.completedAt || b.updatedAt || b.createdAt) - jobTimeValue(a.completedAt || a.updatedAt || a.createdAt))[0] || null;
  const latestUpdated = jobs
    .slice()
    .sort((a, b) => jobTimeValue(b.updatedAt || b.createdAt) - jobTimeValue(a.updatedAt || a.createdAt))[0] || null;
  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    summary: {
      total: jobs.length,
      running: running.length,
      queued: jobs.filter((job) => job.status === "queued").length,
      completed: completed.length,
      partial: partial.length,
      failed: failed.length,
      waiting: waiting.length,
      attention: attention.length,
      restored: restored.length,
      active: running.length + waiting.length,
      latestCompletedAt: latestCompleted?.completedAt || latestCompleted?.updatedAt || "",
      latestCompletedTitle: latestCompleted?.title || "",
      latestUpdatedAt: latestUpdated?.updatedAt || latestUpdated?.createdAt || "",
      health: waiting.length ? "needs_input" : failed.length || partial.length ? "attention" : running.length ? "running" : "idle"
    },
    jobs
  };
}

function resolveTaskQueueJob(type, id) {
  const normalizedType = String(type || "").trim().toLowerCase();
  const jobId = String(id || "").trim();
  if (!jobId) return null;
  if (normalizedType === "codex") {
    const job = codexJobs.get(jobId);
    if (job) return { type: "codex", job };
  }
  if (normalizedType === "office") {
    const job = orchestrationJobs.get(jobId);
    if (job) return { type: "office", job };
  }
  const officeJob = orchestrationJobs.get(jobId);
  if (officeJob) return { type: "office", job: officeJob };
  const codexJob = codexJobs.get(jobId);
  if (codexJob) return { type: "codex", job: codexJob };
  const historyRow = readTaskQueueHistorySync().jobs.find((row) => row.id === jobId && (!normalizedType || row.type === normalizedType));
  if (historyRow) return { type: historyRow.type, row: historyRow, restored: true };
  return null;
}

function publicTaskQueueJob(type, job) {
  return type === "codex" ? taskQueueCodexRow(job) : taskQueueOrchestrationRow(job);
}

function publicResolvedTaskQueueJob(resolved) {
  if (!resolved) return null;
  if (resolved.restored) return attachTaskQueueReviewDecision(resolved.row);
  return attachTaskQueueReviewDecision(publicTaskQueueJob(resolved.type, resolved.job));
}

function cancelTaskQueueJob(input = {}) {
  const resolved = resolveTaskQueueJob(input.type, input.id);
  if (!resolved) throw new Error("작업을 찾을 수 없습니다");
  if (resolved.restored) throw new Error("복원된 작업 기록은 취소할 수 없습니다. 필요하면 재시도하세요.");
  const { type, job } = resolved;
  if (finalJobStatuses.has(job.status)) return { ok: true, action: "cancel", job: publicTaskQueueJob(type, job), queue: buildTaskQueueState() };
  job.cancelRequested = true;
  job.error = job.error || "사용자가 작업을 취소했습니다.";
  job.updatedAt = new Date().toISOString();
  if (type === "codex") {
    appendJobLog(job, "사용자가 작업 취소를 요청했습니다.", "taeo", "warn");
    if (job.child && !job.child.killed) job.child.kill();
    else job.status = "cancelled";
  } else {
    appendJobLog(job, "사용자가 작업 취소를 요청했습니다. 실행 중인 그룹이 끝나면 멈춥니다.", "ceo", "warn");
    if (["queued", "waiting_question"].includes(job.status)) {
      job.status = "cancelled";
      job.completedAt = job.updatedAt;
      job.saved = { ok: false, skipped: true, reason: "사용자가 작업을 취소했습니다." };
    }
  }
  return { ok: true, action: "cancel", job: publicTaskQueueJob(type, job), queue: buildTaskQueueState() };
}

async function markTaskQueueRetrySourceResolved(type, sourceId, nextId, title = "") {
  const state = await readReviewDecisionsState();
  const key = reviewDecisionKey(type, sourceId);
  const existing = state.decisions.find((decision) => decision.key === key);
  const now = new Date().toISOString();
  const note = compactLine(`재시도 작업 ${nextId} 등록으로 원본 확인 필요 항목을 닫았습니다.`, 300);
  const decisions = [normalizeReviewDecision({
    ...existing,
    type,
    id: sourceId,
    targetTitle: title || existing?.targetTitle || "",
    status: "resolved",
    note,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    decidedAt: now
  })];
  for (const automationId of await automationReviewIdsForJob(sourceId)) {
    const automationKey = reviewDecisionKey("automation", automationId);
    const existingAutomation = state.decisions.find((decision) => decision.key === automationKey);
    decisions.push(normalizeReviewDecision({
      ...existingAutomation,
      type: "automation",
      id: automationId,
      targetTitle: existingAutomation?.targetTitle || title || "",
      status: "resolved",
      note: compactLine(`재시도 작업 ${nextId} 등록으로 연결된 자동화 실행 기록을 닫았습니다.`, 300),
      createdAt: existingAutomation?.createdAt || now,
      updatedAt: now,
      decidedAt: now
    }));
  }
  const keys = new Set(decisions.map((decision) => decision.key));
  state.decisions = [...decisions, ...state.decisions.filter((item) => !keys.has(item.key))];
  await writeReviewDecisionsState(state);
  return decisions[0];
}

async function retryTaskQueueJob(input = {}) {
  const resolved = resolveTaskQueueJob(input.type, input.id);
  if (!resolved) throw new Error("작업을 찾을 수 없습니다");
  const { type, job, row } = resolved;
  const sourceId = resolved.restored ? row.id : job.id;
  const sourceTitle = resolved.restored ? row.title || "" : job.task || job.capsule?.normalizedTask || job.message || "";
  const status = resolved.restored ? row.status : job.status;
  if (!finalJobStatuses.has(status)) throw new Error("진행 중인 작업은 재시도할 수 없습니다");
  if (type === "codex") {
    const next = createCodexJob(resolved.restored ? row.title || "" : job.task || "");
    next.retryOf = { type, id: sourceId, title: sourceTitle };
    appendJobLog(next, `이전 작업 ${sourceId}에서 재시도했습니다.`, "taeo");
    await markTaskQueueRetrySourceResolved("codex", sourceId, next.id, sourceTitle);
    return { ok: true, action: "retry", job: publicTaskQueueJob("codex", next), queue: buildTaskQueueState() };
  }
  const message = resolved.restored ? row.title || "" : job.message || job.capsule?.originalInput || job.capsule?.normalizedTask || "";
  const route = resolved.restored ? { intent: "office", task: message, reason: "복원된 작업 큐 재시도" } : job.route || { intent: "office", task: job.capsule?.normalizedTask || message, reason: "작업 큐 재시도" };
  const next = createOrchestrationJob(message, route, createYomiOrchestration(message, route));
  next.retryOf = { type, id: sourceId, title: sourceTitle };
  appendJobLog(next, `이전 작업 ${sourceId}에서 재시도했습니다.`, "ceo");
  await markTaskQueueRetrySourceResolved("office", sourceId, next.id, sourceTitle);
  return { ok: true, action: "retry", job: publicTaskQueueJob("office", next), queue: buildTaskQueueState() };
}

function enqueueTaskQueueJob(input = {}) {
  const rawMessage = String(input.message || input.task || "").trim();
  if (!rawMessage) throw new Error("작업 내용이 필요합니다");
  const explicit = parseChatRoute(rawMessage);
  const requestedType = String(input.type || input.intent || "").trim().toLowerCase();
  if (requestedType === "codex" || explicit.intent === "codex") {
    const task = explicit.intent === "codex" ? explicit.task : rawMessage;
    const job = createCodexJob(task);
    return { ok: true, action: "enqueue", job: publicTaskQueueJob("codex", job), queue: buildTaskQueueState() };
  }
  const task = explicit.intent === "office" ? explicit.task : rawMessage;
  const route = { intent: "office", task, reason: input.reason || "작업 큐 직접 등록" };
  const job = createOrchestrationJob(rawMessage, route, createYomiOrchestration(rawMessage, route));
  return { ok: true, action: "enqueue", job: publicTaskQueueJob("office", job), queue: buildTaskQueueState() };
}

async function updateTaskQueue(input = {}) {
  const action = String(input.action || "list").trim().toLowerCase();
  if (!action || action === "list") return buildTaskQueueState(input.limit);
  if (action === "detail") {
    const resolved = resolveTaskQueueJob(input.type, input.id);
    if (!resolved) throw new Error("작업을 찾을 수 없습니다");
    return { ok: true, action, job: publicResolvedTaskQueueJob(resolved), queue: buildTaskQueueState(input.limit) };
  }
  if (action === "enqueue" || action === "create") return enqueueTaskQueueJob(input);
  if (action === "cancel") return cancelTaskQueueJob(input);
  if (action === "retry") return retryTaskQueueJob(input);
  throw new Error("Unknown task queue action");
}

function setOrchestrationRuntime(job, stepLabel, status = job.status) {
  workflowRuntime.current = {
    workflowName: "요미 병렬 직원 실행",
    stepLabel,
    status,
    updatedAt: new Date().toISOString(),
    jobId: job.id
  };
}

function orchestrationOutputSummary(subtasks = []) {
  return subtasks.map((step, index) => [
    `### ${index + 1}. ${step.agentName} · ${step.label}`,
    `- 상태: ${step.status}`,
    `- 시도: ${step.attempts || 0}`,
    step.handoffFrom?.length ? `- 인계: ${step.handoffFrom.map((item) => `${item.agentName}/${item.label}`).join(", ")}` : "",
    step.error ? `- 오류: ${step.error}` : "",
    step.selfCritique ? `- 자가교정: ${step.selfCritique}` : "",
    "",
    step.output || "아직 산출물이 없습니다."
  ].filter(Boolean).join("\n")).join("\n\n");
}

function buildHandoffLinks(job) {
  const subtasks = job?.subtasks || [];
  const byId = new Map(subtasks.map((step) => [step.id, step]));
  return subtasks.flatMap((step) => (step.dependsOn || []).map((sourceId) => {
    const source = byId.get(sourceId) || {};
    return {
      from: sourceId,
      fromAgentId: source.agentId || "",
      fromAgentName: source.agentName || "",
      fromLabel: source.label || "",
      to: step.id,
      toAgentId: step.agentId || "",
      toAgentName: step.agentName || "",
      toLabel: step.label || "",
      status: source.status === "completed" ? "ready" : source.status === "failed" ? "source_failed" : "pending"
    };
  }));
}

function formatHandoffLinks(job) {
  const links = buildHandoffLinks(job);
  if (!links.length) return "직원 간 선행 인계가 없는 단일/초기 실행입니다.";
  return links.map((link) => `- ${link.fromAgentName}/${link.fromLabel} -> ${link.toAgentName}/${link.toLabel} (${link.status})`).join("\n");
}

function formatOrchestrationReflections(reflections = []) {
  if (!reflections.length) return "아직 반성/재계획 기록이 없습니다.";
  return reflections.map((item) => [
    `### 그룹 ${Number(item.groupIndex || 0) + 1} · ${item.status}`,
    `- 완료: ${item.completedCount}`,
    `- 실패: ${item.failedCount}`,
    `- 다음 판단: ${item.nextAction}`,
    ...(item.notes || []).map((note) => `- 메모: ${note}`)
  ].join("\n")).join("\n\n");
}

function buildSubtaskSelfCritique(subtask, error) {
  const reason = error instanceof Error ? error.message : String(error || "unknown error");
  return [
    `첫 실행 실패 원인: ${compactLine(reason, 140)}`,
    "재시도에서는 산출물 범위를 더 좁히고, 이전 그룹 인계와 완료 기준을 먼저 확인한다.",
    "외부 실행/파일 쓰기/전송은 하지 않고 보고 가능한 Markdown 결과에 집중한다."
  ].join(" ");
}

function reflectOrchestrationGroup(job, groupIndex, groupResults = [], completedOutputs = []) {
  if (!Array.isArray(job.reflections)) job.reflections = [];
  const failed = groupResults.filter((step) => step.status === "failed");
  const completed = groupResults.filter((step) => step.status === "completed");
  const nextQueued = (job.subtasks || []).filter((step) => Number(step.parallelGroup || 0) > Number(groupIndex || 0) && !["completed", "failed"].includes(step.status));
  const reflection = {
    groupIndex,
    createdAt: new Date().toISOString(),
    status: failed.length ? "needs_adjustment" : "passed",
    completedCount: completed.length,
    failedCount: failed.length,
    nextAction: failed.length
      ? "실패한 산출물은 최종 취합에서 리스크로 남기고, 후속 직원은 사용 가능한 인계만 반영한다."
      : nextQueued.length
        ? "다음 직원 그룹이 완료 산출물을 이어받아 자기 역할 결과로 확장한다."
        : "최종 취합 단계로 이동한다.",
    notes: [
      completed.length ? `완료 산출물 ${completed.length}개를 인계 후보로 등록했습니다.` : "",
      failed.length ? `실패 산출물 ${failed.length}개는 재시도 후에도 실패로 표시했습니다.` : "",
      completedOutputs.length ? `누적 인계 산출물 ${completedOutputs.length}개를 유지합니다.` : ""
    ].filter(Boolean)
  };
  job.reflections.push(reflection);
  for (const step of nextQueued) {
    step.replanNotes = [
      ...(step.replanNotes || []),
      reflection.nextAction
    ].slice(-4);
  }
  appendJobLog(job, `요미 반성/재계획: 그룹 ${groupIndex + 1} · ${reflection.status}`, "ceo", failed.length ? "warn" : "info");
  return reflection;
}

async function runYomiSubtaskAttempt({ job, subtask, previousOutputs = [], critique = "" }) {
  const agent = resolveAgent(subtask.agentId) || { name: subtask.agentName, role: subtask.role, work: "" };
  const previous = previousOutputs.length ? orchestrationOutputSummary(previousOutputs) : "이전 그룹 산출물 없음";
  const contextBlock = job.context?.promptBlock || "";
  const contextUseBlock = formatContextUsePlan(job.contextUse || job.capsule?.contextUse || {});
  const handoffText = subtask.handoffFrom?.length
    ? subtask.handoffFrom.map((item) => `- ${item.agentName}/${item.label}`).join("\n")
    : "- 선행 인계 없음";
  const prompt = [
    "너는 YOMI Office / 요미오피스의 직원 에이전트다.",
    "현재 단계는 병렬 직원 실행 단계이며, 실제 파일 쓰기, Git 쓰기, 외부 전송은 하지 않는다.",
    "아래 작업캡슐과 네 역할에 맞춰 한국어 Markdown 산출물을 작성한다.",
    "사용자 톤/스타일 프로필과 자동 Vault 참조를 우선 반영하되, 직접 관련 있는 내용만 사용한다.",
    "",
    contextBlock,
    "",
    contextUseBlock,
    "",
    "## 작업캡슐",
    JSON.stringify(job.capsule, null, 2),
    "",
    "## 네 담당",
    `직원: ${agent.name}`,
    `역할: ${agent.role || ""}`,
    `역할 설명: ${agent.work || ""}`,
    `서브태스크: ${subtask.label}`,
    `목표: ${subtask.objective}`,
    `예상 산출물: ${subtask.expectedOutput}`,
    `허용 스킬: ${(subtask.allowedSkills || []).join(", ") || "없음"}`,
    `인계 정책: ${subtask.handoffPolicy || "역할에 맞게 필요한 정보만 반영한다."}`,
    "",
    "## 선행 인계",
    handoffText,
    "",
    "## 요미 재계획 메모",
    (subtask.replanNotes || []).join("\n") || "추가 재계획 메모 없음",
    "",
    "## 자가교정 메모",
    critique || "첫 실행",
    "",
    "## 이전 그룹 산출물",
    previous,
    "",
    "## 출력 형식",
    "### 담당 해석",
    "### 산출물",
    "### 근거 출처",
    "### 요미에게 인계할 메모",
    "",
    "고정 안내문이 아니라 이 요청에 맞춘 실제 결과만 작성한다."
  ].join("\n");
  return await runEngineText(subtask.engine?.id || subtask.engine || defaultEngineForAgent(subtask.agentId, job.capsule), prompt, `${agent.name} 서브태스크`);
}

async function executeOrchestrationSubtask(job, subtask, previousOutputs = []) {
  subtask.status = "running";
  subtask.startedAt = new Date().toISOString();
  subtask.updatedAt = subtask.startedAt;
  subtask.attempts = 1;
  appendJobLog(job, `${subtask.agentName || subtask.agentId} 실행 시작: ${subtask.label}`, subtask.agentId || "agent");
  if (subtask.agentId) workflowRuntime.agentTaskCounts[subtask.agentId] = (workflowRuntime.agentTaskCounts[subtask.agentId] || 0) + 1;
  try {
    const generated = await runYomiSubtaskAttempt({ job, subtask, previousOutputs });
    subtask.output = generated.text;
    subtask.commandLabel = generated.commandLabel;
    subtask.engineUsed = generated.engine;
    subtask.engineLabel = generated.engineLabel;
    if (generated.engineFallbackFrom) {
      subtask.engineFallbackFrom = generated.engineFallbackFrom;
      subtask.engineFallbackReason = generated.engineFallbackReason;
    }
    subtask.status = "completed";
    subtask.completedAt = new Date().toISOString();
    subtask.updatedAt = subtask.completedAt;
    appendJobLog(job, `${subtask.agentName || subtask.agentId} 완료: ${subtask.label}`, subtask.agentId || "agent");
    return subtask;
  } catch (firstError) {
    subtask.status = "retrying";
    subtask.error = firstError instanceof Error ? firstError.message : String(firstError);
    subtask.selfCritique = buildSubtaskSelfCritique(subtask, firstError);
    subtask.updatedAt = new Date().toISOString();
    subtask.attempts = 2;
    appendJobLog(job, `${subtask.agentName || subtask.agentId} 재시도: ${subtask.error}`, subtask.agentId || "agent", "warn");
    try {
      const generated = await runYomiSubtaskAttempt({ job, subtask, previousOutputs, critique: subtask.selfCritique });
      subtask.output = generated.text;
      subtask.commandLabel = generated.commandLabel;
      subtask.engineUsed = generated.engine;
      subtask.engineLabel = generated.engineLabel;
      if (generated.engineFallbackFrom) {
        subtask.engineFallbackFrom = generated.engineFallbackFrom;
        subtask.engineFallbackReason = generated.engineFallbackReason;
      }
      subtask.status = "completed";
      subtask.error = "";
      subtask.completedAt = new Date().toISOString();
      subtask.updatedAt = subtask.completedAt;
      appendJobLog(job, `${subtask.agentName || subtask.agentId} 재시도 후 완료: ${subtask.label}`, subtask.agentId || "agent");
      return subtask;
    } catch (secondError) {
      subtask.status = "failed";
      subtask.error = secondError instanceof Error ? secondError.message : String(secondError);
      subtask.completedAt = new Date().toISOString();
      subtask.updatedAt = subtask.completedAt;
      appendJobLog(job, `${subtask.agentName || subtask.agentId} 실패: ${subtask.error}`, subtask.agentId || "agent", "error");
      recordWorkflowError(`${subtask.agentName} · ${subtask.label}`, subtask.error);
      return subtask;
    }
  }
}

async function buildYomiFinalReport(job) {
  const contextBlock = job.context?.promptBlock || "";
  const contextUseBlock = formatContextUsePlan(job.contextUse || job.capsule?.contextUse || {});
  const prompt = [
    "너는 YOMI Office의 총괄 매니저 요미다.",
    "직원별 병렬 산출물을 하나의 최종 보고서로 취합한다.",
    "실패한 직원이 있으면 숨기지 말고 실패 사유와 대체 판단을 명시한다.",
    "파일 저장, Git 쓰기, 외부 전송은 하지 않는다.",
    "사용자 톤/스타일 프로필을 지키고, 자동 Vault 참조에서 직접 관련 있는 기존 자산만 녹여낸다.",
    "",
    contextBlock,
    "",
    contextUseBlock,
    "",
    "## 작업캡슐",
    JSON.stringify(job.capsule, null, 2),
    "",
    "## 목표 정의 질문",
    (job.capsule.goalDefinitionQuestions || []).map((item) => `- ${item}`).join("\n") || "목표 정의 질문 없음",
    "",
    "## 자료/재료 수집 기준",
    (job.capsule.materialBrief?.needs || []).map((item) => `- ${item}`).join("\n") || "자료 기준 없음",
    "",
    "## 직원 산출물",
    orchestrationOutputSummary(job.subtasks),
    "",
    "## 직원 간 인계 연결",
    formatHandoffLinks(job),
    "",
    "## 실행 반성/재계획 로그",
    formatOrchestrationReflections(job.reflections || []),
    "",
    "## 출력 형식",
    "# 요미 최종 보고서",
    "## 목표와 완료 기준",
    "## 직원별 핵심 산출물",
    "## 직원 간 인계와 재계획",
    "## 근거 출처",
    "사용한 Vault 문서만 제목과 경로로 명시한다. 사용하지 않은 문서는 넣지 않는다.",
    "## 통합 결과",
    "## 리스크와 확인 필요 사항",
    "## 다음 행동"
  ].join("\n");
  try {
    const generated = await runEngineText("claude", prompt, "요미 최종 취합");
    job.finalEngineUsed = generated.engine;
    job.finalEngineLabel = generated.engineLabel;
    if (generated.engineFallbackFrom) {
      job.finalEngineFallbackFrom = generated.engineFallbackFrom;
      job.finalEngineFallbackReason = generated.engineFallbackReason;
    }
    return generated.text;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return [
      "# 요미 최종 보고서",
      "",
      "## 목표와 완료 기준",
      job.capsule.goal || job.capsule.normalizedTask || "목표 정보 없음",
      "",
      "## 직원별 핵심 산출물",
      orchestrationOutputSummary(job.subtasks),
      "",
      "## 직원 간 인계와 재계획",
      formatHandoffLinks(job),
      "",
      formatOrchestrationReflections(job.reflections || []),
      "",
      "## 근거 출처",
      ...(compactContextSources(job.contextUse?.sources || job.context?.sources || [], 5).map((item) => `- ${item.title} · ${item.displayPath || item.relPath}`)),
      "",
      "## 리스크와 확인 필요 사항",
      `- 최종 취합 Codex 호출 실패: ${message}`,
      "",
      "## 다음 행동",
      "- 실패한 취합 단계만 다시 실행하거나, 직원 산출물을 기준으로 수동 검토합니다."
    ].join("\n");
  }
}

function isTrivialAutoSaveInput(input) {
  const text = String(input || "").normalize("NFKC").trim();
  if (!text) return true;
  const casualPattern = /(오늘\s*뭐\s*하면|뭐\s*하면\s*좋|뭐\s*할까|뭘\s*할까|할\s*일\s*추천|추천해\s*줘|잡담|가볍게|심심|아무거나|간단히)/i;
  const durableAssetPattern = /(보고서|전략|기획안|분석|조사|자료|초안|문서|콘텐츠|매뉴얼|가이드|템플릿|로드맵|프로세스|정책|자산화|저장)/i;
  return casualPattern.test(text) && !durableAssetPattern.test(text);
}

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}

function scoreGrade(score) {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

function assetSignal(condition, label, points, detail = "") {
  return {
    label,
    points: condition ? points : 0,
    max: points,
    passed: Boolean(condition),
    detail
  };
}

function buildAssetQualityReview(job) {
  const subtasks = job.subtasks || [];
  const completed = subtasks.filter((step) => step.status === "completed");
  const failed = subtasks.filter((step) => step.status === "failed");
  const reportText = String(job.report || "").trim();
  const reportLength = reportText.length;
  const input = `${job.capsule?.originalInput || ""} ${job.capsule?.normalizedTask || ""}`;
  const sourceCount = job.context?.sources?.length || 0;
  const criteriaCount = job.capsule?.completionCriteria?.length || 0;
  const staffingLevel = job.capsule?.staffing?.level || "";
  const durableAssetKeyword = /(보고서|전략|자료|초안|문서|콘텐츠|기획안|분석|조사|자산|저장|매뉴얼|가이드|템플릿|로드맵|프로세스|정책|포트폴리오|자동화)/i.test(input);
  const hasSourceSection = /근거\s*출처|RAG\s*근거|Vault\s*참조|참고\s*자료/i.test(reportText);
  const hasActionSection = /다음\s*(액션|단계)|실행\s*계획|우선순위|체크리스트|To-?do/i.test(reportText);
  const hasRetrospectiveSection = /회고|보완|리스크|한계|검수|평가/i.test(reportText);
  const hasConcreteOutput = /##\s*(산출물|최종|결론|초안|전략|계획|보고서)|#\s+.+/i.test(reportText);
  const completionRatio = subtasks.length ? completed.length / subtasks.length : 0;
  const signals = [
    assetSignal(reportLength >= 520, "충분한 산출물 분량", reportLength >= 1200 ? 18 : 14, `${reportLength}자`),
    assetSignal(completionRatio >= 1 && completed.length > 0 && failed.length === 0, "직원 실행 완료", 18, `${completed.length}/${subtasks.length || 0} 완료`),
    assetSignal(criteriaCount >= 2, "완료 기준 명확성", 12, `${criteriaCount}개 기준`),
    assetSignal(durableAssetKeyword || staffingLevel === "deep", "재사용 가능한 업무 유형", 16, job.capsule?.workType || "general_work"),
    assetSignal(hasConcreteOutput, "구체 산출물 포함", 12),
    assetSignal(sourceCount >= 2 && hasSourceSection, "근거 출처 연결", 14, `${sourceCount}개 Vault 근거`),
    assetSignal(hasActionSection, "다음 실행 액션 포함", 8),
    assetSignal(hasRetrospectiveSection || job.reflections?.length, "검수/회고 포함", 8, `${job.reflections?.length || 0}회 반성`)
  ];
  const earnedPoints = signals.reduce((sum, item) => sum + item.points, 0);
  const maxPoints = signals.reduce((sum, item) => sum + item.max, 0) || 1;
  const score = clampScore((earnedPoints / maxPoints) * 100);
  const issues = [];
  if (job.plan?.questionRequired || job.capsule?.needsQuestion) issues.push("사용자 확인이 필요한 상태입니다.");
  if (!reportText) issues.push("최종 보고서가 없습니다.");
  if (reportLength < 520) issues.push("재사용 자산으로 보기엔 보고서 분량이 부족합니다.");
  if (failed.length) issues.push(`실패한 직원 산출물 ${failed.length}개가 있습니다.`);
  if (isTrivialAutoSaveInput(input)) issues.push("단발성 추천/잡담으로 판단됩니다.");
  if (!durableAssetKeyword && staffingLevel !== "deep" && reportLength < 1200) issues.push("반복 활용할 업무 유형 신호가 약합니다.");
  if (!hasConcreteOutput) issues.push("구체 산출물 섹션이 부족합니다.");
  if (sourceCount && !hasSourceSection) issues.push("Vault 근거를 사용했지만 근거 출처 섹션이 명확하지 않습니다.");
  if (sourceCount < 2 && /조사|분석|전략|트렌드|자료|리서치/i.test(input)) issues.push("리서치/전략 업무인데 연결된 근거가 부족합니다.");
  if (!hasActionSection) issues.push("다음 실행 액션이 부족합니다.");
  const shouldSave = score >= 62 && !issues.some((issue) => /확인|보고서가 없습니다|실패한 직원|단발성/.test(issue));
  const ragReady = shouldSave && score >= 82 && !issues.some((issue) => /근거|출처|분량|구체 산출물/.test(issue));
  return {
    score,
    grade: scoreGrade(score),
    shouldSave,
    ragReady,
    quality: ragReady ? "verified" : shouldSave ? "candidate" : "quarantine",
    rag: ragReady,
    reason: ragReady
      ? "자산화 품질 기준과 RAG 포함 기준을 모두 통과했습니다."
      : shouldSave
        ? "재사용 후보로 저장하되 RAG에는 검토 후 포함합니다."
        : "자동 자산화 기준을 통과하지 못했습니다.",
    issues,
    signals
  };
}

function defaultPerformanceLog() {
  return { records: [] };
}

function normalizePerformanceRecord(record = {}) {
  return {
    id: String(record.id || ""),
    jobId: String(record.jobId || ""),
    createdAt: String(record.createdAt || ""),
    title: String(record.title || "성과 기록"),
    workType: String(record.workType || "general_work"),
    status: String(record.status || ""),
    score: clampScore(record.score || 0),
    grade: String(record.grade || scoreGrade(record.score || 0)),
    passed: Boolean(record.passed),
    portfolioCandidate: Boolean(record.portfolioCandidate),
    metrics: record.metrics && typeof record.metrics === "object" ? record.metrics : {},
    rubric: Array.isArray(record.rubric) ? record.rubric : [],
    retrospective: record.retrospective && typeof record.retrospective === "object" ? record.retrospective : {},
    assetReview: record.assetReview && typeof record.assetReview === "object" ? record.assetReview : null,
    savedRelPath: String(record.savedRelPath || ""),
    portfolioRelPath: String(record.portfolioRelPath || ""),
    sources: Array.isArray(record.sources) ? record.sources.slice(0, 8) : []
  };
}

function readPerformanceLogSync() {
  try {
    const parsed = JSON.parse(readFileSync(performanceLogPath, "utf8"));
    return { records: (Array.isArray(parsed.records) ? parsed.records : []).map(normalizePerformanceRecord).filter((record) => record.id) };
  } catch {
    return defaultPerformanceLog();
  }
}

function writePerformanceLogSync(records = []) {
  try {
    mkdirSync(runtimeRoot, { recursive: true });
    const normalized = records
      .map(normalizePerformanceRecord)
      .filter((record) => record.id)
      .sort((a, b) => jobTimeValue(b.createdAt) - jobTimeValue(a.createdAt))
      .slice(0, 200);
    writeFileSync(performanceLogPath, `${JSON.stringify({ records: normalized }, null, 2)}\n`, "utf8");
  } catch {
    // Performance logging is best-effort and must not block user-facing work.
  }
}

function performanceSummary(records = []) {
  const list = records.map(normalizePerformanceRecord);
  const total = list.length;
  const avgScore = total ? Math.round(list.reduce((sum, record) => sum + record.score, 0) / total) : 0;
  const portfolioCount = list.filter((record) => record.portfolioCandidate || record.portfolioRelPath).length;
  const passedCount = list.filter((record) => record.passed).length;
  const recent = list.slice(0, 5);
  const adjustmentMaps = economicsAdjustmentMaps();
  const economicsRows = list.map((record) => applyPerformanceEconomicsAdjustment(record, adjustmentForPerformanceRecord(record, adjustmentMaps)));
  const totalEstimatedCostKrw = economicsRows.reduce((sum, item) => sum + item.displayCostKrw, 0);
  const totalEstimatedValueKrw = economicsRows.reduce((sum, item) => sum + item.displayValueKrw, 0);
  const totalEstimatedNetKrw = totalEstimatedValueKrw - totalEstimatedCostKrw;
  const totalSavedMinutes = economicsRows.reduce((sum, item) => sum + item.displaySavedMinutes, 0);
  const profitableCount = economicsRows.filter((item) => item.profitable).length;
  return {
    total,
    avgScore,
    portfolioCount,
    passedCount,
    lastScore: recent[0]?.score || 0,
    lastGrade: recent[0]?.grade || "",
    recent,
    economics: {
      basis: "estimated_cli_proxy",
      hourlyValueKrw: economicsHourlyValueKrw(),
      estimatedCostKrw: totalEstimatedCostKrw,
      estimatedValueKrw: totalEstimatedValueKrw,
      estimatedNetKrw: totalEstimatedNetKrw,
      estimatedSavedMinutes: totalSavedMinutes,
      profitableCount,
      adjustedCount: economicsRows.filter((item) => item.adjusted).length,
      roiPercent: totalEstimatedCostKrw ? Math.round((totalEstimatedNetKrw / totalEstimatedCostKrw) * 100) : 0,
      avgCostKrw: total ? Math.round(totalEstimatedCostKrw / total) : 0,
      avgSavedMinutes: total ? Math.round(totalSavedMinutes / total) : 0
    }
  };
}

function economicsHourlyValueKrw() {
  const value = Number(process.env.YOMI_AI_HOURLY_VALUE_KRW || 30000);
  return Number.isFinite(value) && value > 0 ? Math.round(value) : 30000;
}

function clampEconomicsNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : fallback;
}

function estimatePerformanceEconomics(record = {}) {
  const normalized = normalizePerformanceRecord(record);
  const metrics = normalized.metrics || {};
  const reportLength = clampEconomicsNumber(metrics.reportLength);
  const sourceCount = clampEconomicsNumber(metrics.sourceCount);
  const subtaskCount = clampEconomicsNumber(metrics.subtaskCount);
  const reflectionCount = clampEconomicsNumber(metrics.reflectionCount);
  const failedCount = clampEconomicsNumber(metrics.failedCount);
  const completedCount = clampEconomicsNumber(metrics.completedCount);
  const saved = Boolean(metrics.saved);
  const ragReady = Boolean(metrics.ragReady);
  const estimatedCostKrw = Math.round(
    35
    + Math.max(1, subtaskCount || completedCount || 1) * 75
    + sourceCount * 12
    + Math.ceil(reportLength / 1000) * 18
    + reflectionCount * 22
    + failedCount * 35
  );
  let savedMinutes = 8
    + Math.max(1, subtaskCount || completedCount || 1) * 9
    + sourceCount * 4
    + Math.min(70, Math.round(reportLength / 700) * 7)
    + (saved ? 6 : 0)
    + (ragReady ? 4 : 0);
  if (!normalized.passed) savedMinutes *= 0.72;
  if (["failed", "cancelled"].includes(normalized.status)) savedMinutes *= 0.35;
  if (normalized.status === "completed_with_errors") savedMinutes *= 0.6;
  savedMinutes = Math.max(0, Math.round(savedMinutes));
  const estimatedValueKrw = Math.round((savedMinutes / 60) * economicsHourlyValueKrw());
  const estimatedNetKrw = estimatedValueKrw - estimatedCostKrw;
  return {
    basis: "estimated_cli_proxy",
    hourlyValueKrw: economicsHourlyValueKrw(),
    estimatedCostKrw,
    estimatedValueKrw,
    estimatedNetKrw,
    estimatedSavedMinutes: savedMinutes,
    profitable: estimatedNetKrw > 0,
    roiPercent: estimatedCostKrw ? Math.round((estimatedNetKrw / estimatedCostKrw) * 100) : 0
  };
}

function defaultEconomicsAdjustmentsState() {
  return { adjustments: [] };
}

function economicsAdjustmentKey(jobId = "", recordId = "") {
  const job = String(jobId || "").trim();
  const record = String(recordId || "").trim();
  return job ? `job:${job}` : `record:${record}`;
}

function actualEconomicsNumber(value) {
  if (value === "" || value == null) return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.round(number) : null;
}

function normalizeEconomicsAdjustment(input = {}) {
  const jobId = String(input.jobId || "").trim();
  const recordId = String(input.recordId || input.id || "").trim();
  const key = String(input.key || economicsAdjustmentKey(jobId, recordId));
  const createdAt = String(input.createdAt || new Date().toISOString());
  const updatedAt = String(input.updatedAt || createdAt);
  const actualHourlyValueKrw = actualEconomicsNumber(input.hourlyValueKrw);
  const hourlyValueKrw = actualHourlyValueKrw == null ? economicsHourlyValueKrw() : actualHourlyValueKrw;
  return {
    key,
    jobId,
    recordId,
    title: compactLine(input.title || input.targetTitle || "", 120),
    actualCostKrw: actualEconomicsNumber(input.actualCostKrw),
    actualSavedMinutes: actualEconomicsNumber(input.actualSavedMinutes),
    hourlyValueKrw,
    note: String(input.note || "").trim().slice(0, 1000),
    createdAt,
    updatedAt
  };
}

function normalizeEconomicsAdjustmentsState(input = {}) {
  const adjustments = Array.isArray(input.adjustments) ? input.adjustments : [];
  return {
    adjustments: adjustments
      .map(normalizeEconomicsAdjustment)
      .filter((item) => item.jobId || item.recordId)
  };
}

function readEconomicsAdjustmentsSync() {
  try {
    if (!existsSync(economicsAdjustmentsPath)) return defaultEconomicsAdjustmentsState();
    return normalizeEconomicsAdjustmentsState(JSON.parse(readFileSync(economicsAdjustmentsPath, "utf8")));
  } catch {
    return defaultEconomicsAdjustmentsState();
  }
}

function writeEconomicsAdjustmentsSync(state = {}) {
  mkdirSync(runtimeRoot, { recursive: true });
  const normalized = normalizeEconomicsAdjustmentsState(state);
  normalized.adjustments = normalized.adjustments
    .sort((a, b) => jobTimeValue(b.updatedAt || b.createdAt) - jobTimeValue(a.updatedAt || a.createdAt))
    .slice(0, 300);
  writeFileSync(economicsAdjustmentsPath, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
  return normalized;
}

function economicsAdjustmentMaps(state = readEconomicsAdjustmentsSync()) {
  const adjustments = Array.isArray(state.adjustments) ? state.adjustments : [];
  return {
    byJobId: new Map(adjustments.filter((item) => item.jobId).map((item) => [item.jobId, item])),
    byRecordId: new Map(adjustments.filter((item) => item.recordId).map((item) => [item.recordId, item]))
  };
}

function adjustmentForPerformanceRecord(record = {}, maps = economicsAdjustmentMaps()) {
  return maps.byJobId.get(record.jobId) || maps.byRecordId.get(record.id) || null;
}

function applyPerformanceEconomicsAdjustment(record = {}, adjustment = null) {
  const estimated = estimatePerformanceEconomics(record);
  const normalizedAdjustment = adjustment ? normalizeEconomicsAdjustment(adjustment) : null;
  const actualCostKrw = normalizedAdjustment?.actualCostKrw ?? null;
  const actualSavedMinutes = normalizedAdjustment?.actualSavedMinutes ?? null;
  const hourlyValueKrw = normalizedAdjustment?.hourlyValueKrw ?? estimated.hourlyValueKrw;
  const displayCostKrw = actualCostKrw ?? estimated.estimatedCostKrw;
  const displaySavedMinutes = actualSavedMinutes ?? estimated.estimatedSavedMinutes;
  const displayValueKrw = Math.round((displaySavedMinutes / 60) * hourlyValueKrw);
  const displayNetKrw = displayValueKrw - displayCostKrw;
  return {
    ...estimated,
    estimatedHourlyValueKrw: estimated.hourlyValueKrw,
    hourlyValueKrw,
    displayHourlyValueKrw: hourlyValueKrw,
    basis: normalizedAdjustment ? "manual_adjusted" : estimated.basis,
    adjusted: Boolean(normalizedAdjustment),
    adjustment: normalizedAdjustment,
    actualCostKrw,
    actualSavedMinutes,
    displayCostKrw,
    displayValueKrw,
    displayNetKrw,
    displaySavedMinutes,
    displayRoiPercent: displayCostKrw ? Math.round((displayNetKrw / displayCostKrw) * 100) : 0,
    profitable: displayNetKrw > 0
  };
}

function buildJobQualityEvaluation(job) {
  const subtasks = job.subtasks || [];
  const completed = subtasks.filter((step) => step.status === "completed");
  const failed = subtasks.filter((step) => step.status === "failed");
  const reportLength = String(job.report || "").trim().length;
  const sourceCount = job.context?.sources?.length || 0;
  const criteriaCount = job.capsule?.completionCriteria?.length || 0;
  const reflectionCount = job.reflections?.length || 0;
  const saved = job.saved?.ok === true;
  const assetReview = job.assetReview || buildAssetQualityReview(job);
  const completionRatio = subtasks.length ? completed.length / subtasks.length : 0;
  const rubric = [
    {
      id: "goal",
      label: "목표/완료기준",
      score: clampScore((job.capsule?.goal ? 42 : 0) + Math.min(40, criteriaCount * 10) + (job.capsule?.goalDefinitionQuestions?.length ? 18 : 0)),
      note: `${criteriaCount}개 완료 기준과 ${job.capsule?.goalDefinitionQuestions?.length || 0}개 목표 질문`
    },
    {
      id: "materials",
      label: "자료/RAG 활용",
      score: clampScore(Math.min(70, sourceCount * 18) + (job.capsule?.materialBrief?.needs?.length ? 20 : 0) + (job.context?.rag?.mode === "semantic_hybrid" ? 10 : 0)),
      note: `Vault/RAG 참고 ${sourceCount}개 · ${job.context?.rag?.mode || "unknown"}`
    },
    {
      id: "decomposition",
      label: "업무분해",
      score: clampScore(Math.min(70, subtasks.length * 18) + (subtasks.some((step) => step.handoffFrom?.length) ? 18 : 0) + (job.plan?.workerPool ? 12 : 0)),
      note: `${subtasks.length}개 서브태스크 · 직원 인계 ${buildHandoffLinks(job).length}개`
    },
    {
      id: "execution",
      label: "실행/완료",
      score: clampScore(completionRatio * 100 - failed.length * 20),
      note: `${completed.length}/${subtasks.length || 0} 완료 · 실패 ${failed.length}`
    },
    {
      id: "review",
      label: "검수/수정/회고",
      score: clampScore(Math.min(70, reflectionCount * 24) + (subtasks.some((step) => step.selfCritique) ? 20 : 0) + (job.finalEngineUsed ? 10 : 0)),
      note: `반성/재계획 ${reflectionCount}회`
    },
    {
      id: "assetization",
      label: "성과기록/자산화",
      score: clampScore((saved ? 35 : 12) + Math.min(45, Math.round(Number(assetReview.score || 0) * 0.45)) + (assetReview.ragReady ? 20 : assetReview.shouldSave ? 10 : 0)),
      note: saved ? `Vault 저장: ${job.saved.relPath} · 품질 ${assetReview.score || 0}점` : job.saved?.reason || assetReview.reason || "저장 대기"
    }
  ];
  const score = clampScore(rubric.reduce((sum, item) => sum + item.score, 0) / rubric.length);
  const issues = rubric.filter((item) => item.score < 70).map((item) => `${item.label}: ${item.note}`);
  return {
    score,
    grade: scoreGrade(score),
    passed: score >= 75 && failed.length === 0,
    portfolioCandidate: score >= 75 && reportLength >= 520 && !isTrivialAutoSaveInput(`${job.capsule?.originalInput || ""} ${job.capsule?.normalizedTask || ""}`),
    rubric,
    issues,
    metrics: {
      reportLength,
      sourceCount,
      subtaskCount: subtasks.length,
      completedCount: completed.length,
      failedCount: failed.length,
      reflectionCount,
      saved,
      assetReviewScore: assetReview.score || 0,
      ragReady: Boolean(assetReview.ragReady)
    }
  };
}

function buildJobRetrospective(job, evaluation) {
  const best = [...evaluation.rubric].sort((a, b) => b.score - a.score)[0];
  const weakest = [...evaluation.rubric].sort((a, b) => a.score - b.score)[0];
  const sources = job.context?.sources || [];
  return {
    wins: [
      best ? `${best.label}이 강점입니다. ${best.note}` : "",
      sources.length ? `기존 Vault 자료 ${sources.length}개를 작업 컨텍스트로 연결했습니다.` : "",
      job.reflections?.length ? `중간 반성/재계획 ${job.reflections.length}회를 기록했습니다.` : ""
    ].filter(Boolean),
    improvements: [
      weakest ? `${weakest.label} 보강 필요: ${weakest.note}` : "",
      evaluation.issues.length ? "다음 실행에서는 낮은 점수 항목을 먼저 질문으로 확정합니다." : "",
      evaluation.metrics.sourceCount < 2 ? "사용자가 자료를 모르면 AI가 먼저 참고 키워드와 재료 후보를 제안해야 합니다." : ""
    ].filter(Boolean),
    nextActions: [
      "성과기록을 다음 작업의 RAG 컨텍스트로 재사용한다.",
      "반복 가능한 기준은 스킬 후보로 승격한다.",
      evaluation.portfolioCandidate ? "개인 AX/RAG 포트폴리오 사례로 정리한다." : "포트폴리오 후보가 되려면 근거/성과/자산화 항목을 보강한다."
    ],
    portfolioAngle: `개인 AX/RAG 시스템이 ${job.capsule?.workType || "업무"} 요청을 목표정의, 자료검색, 업무분해, 검수, 자산화 흐름으로 처리한 사례`
  };
}

function formatPerformanceRecordMarkdown(record, job) {
  return [
    "# YOMI Office 성과기록",
    "",
    `- 작업: ${record.title}`,
    `- 점수: ${record.score} / 100 (${record.grade})`,
    `- 통과: ${record.passed ? "yes" : "no"}`,
    `- 작업 유형: ${record.workType}`,
    `- 원본 작업 ID: ${record.jobId}`,
    record.savedRelPath ? `- 산출물: ${record.savedRelPath}` : "",
    "",
    "## 평가 루브릭",
    ...record.rubric.map((item) => `- ${item.label}: ${item.score}/100 · ${item.note}`),
    "",
    "## 성과 메트릭",
    ...Object.entries(record.metrics || {}).map(([key, value]) => `- ${key}: ${value}`),
    "",
    "## 자산화 품질 게이트",
    record.assetReview
      ? [
          `- 저장 판단: ${record.assetReview.shouldSave ? "save" : "skip"}`,
          `- RAG 포함: ${record.assetReview.ragReady ? "yes" : "no"}`,
          `- 품질: ${record.assetReview.score || 0}/100 (${record.assetReview.grade || ""})`,
          `- 사유: ${record.assetReview.reason || ""}`,
          ...(record.assetReview.issues || []).map((item) => `- 이슈: ${item}`)
        ].join("\n")
      : "- 기록 없음",
    "",
    "## 회고",
    "### 잘된 점",
    ...(record.retrospective?.wins || []).map((item) => `- ${item}`),
    "",
    "### 보완할 점",
    ...(record.retrospective?.improvements || []).map((item) => `- ${item}`),
    "",
    "### 다음 액션",
    ...(record.retrospective?.nextActions || []).map((item) => `- ${item}`),
    "",
    "## 포트폴리오 관점",
    record.retrospective?.portfolioAngle || "",
    "",
    "## RAG 근거 출처",
    ...(record.sources || []).map((item) => `- ${item.title || "문서"} · ${item.displayPath || item.relPath || ""}`),
    "",
    "## 작업캡슐",
    "```json",
    JSON.stringify(job.capsule || {}, null, 2),
    "```"
  ].join("\n");
}

async function savePerformanceRecordToVault(record, job) {
  const vaultRoot = await findVaultRoot();
  if (!vaultRoot || !record.portfolioCandidate) return { ok: false, skipped: true, reason: "포트폴리오 후보가 아니거나 Vault가 연결되지 않았습니다." };
  const now = new Date();
  const day = now.toISOString().slice(0, 10);
  const stamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const outDir = path.join(vaultRoot, "50_Outputs", primaryReportFolder, "AX RAG Portfolio", day);
  await mkdir(outDir, { recursive: true });
  const fullPath = path.join(outDir, `${stamp}-${slugify(record.title)}-performance.md`);
  const relPath = path.relative(vaultRoot, fullPath).replace(/\\/g, "/");
  const frontmatter = [
    "---",
    `type: ${yamlString("yomi_office_ax_rag_portfolio")}`,
    `created: ${now.toISOString()}`,
    `score: ${record.score}`,
    `grade: ${yamlString(record.grade)}`,
    `work_type: ${yamlString(record.workType)}`,
    "tags:",
    "  - yomi-office",
    "  - yomi-ai",
    "  - ax-rag-portfolio",
    "  - performance-record",
    "  - personal-ai-office",
    "---",
    ""
  ].join("\n");
  await writeFile(fullPath, `${frontmatter}${formatPerformanceRecordMarkdown(record, job)}\n`, "utf8");
  return { ok: true, relPath, fullPath };
}

async function recordJobPerformance(job) {
  const evaluation = buildJobQualityEvaluation(job);
  const record = normalizePerformanceRecord({
    id: `perf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    jobId: job.id,
    createdAt: new Date().toISOString(),
    title: job.capsule?.title || job.capsule?.normalizedTask || "요미 직원 실행",
    workType: job.capsule?.workType || "general_work",
    status: job.status,
    score: evaluation.score,
    grade: evaluation.grade,
    passed: evaluation.passed,
    portfolioCandidate: evaluation.portfolioCandidate,
    metrics: evaluation.metrics,
    rubric: evaluation.rubric,
    retrospective: buildJobRetrospective(job, evaluation),
    assetReview: job.assetReview || buildAssetQualityReview(job),
    savedRelPath: job.saved?.ok ? job.saved.relPath : "",
    sources: (job.context?.sources || []).map((item) => ({ title: item.title || "", relPath: item.relPath || "", displayPath: item.displayPath || "" }))
  });
  try {
    const portfolio = await savePerformanceRecordToVault(record, job);
    if (portfolio.ok) record.portfolioRelPath = portfolio.relPath;
  } catch (error) {
    record.retrospective = {
      ...record.retrospective,
      improvements: [
        ...(record.retrospective?.improvements || []),
        `포트폴리오 저장 실패: ${error instanceof Error ? error.message : String(error)}`
      ]
    };
  }
  const state = readPerformanceLogSync();
  const records = [record, ...state.records.filter((item) => item.jobId !== job.id)];
  writePerformanceLogSync(records);
  job.performance = record;
  appendJobLog(job, `성과 평가 ${record.score}점(${record.grade}) · ${record.passed ? "통과" : "보완 필요"}`, "secretary", record.passed ? "info" : "warn");
  return record;
}

function buildPerformanceLogState(limit = 20) {
  const records = readPerformanceLogSync().records;
  const adjustmentMaps = economicsAdjustmentMaps();
  const enrichedRecords = records.map((record) => ({
    ...record,
    economics: applyPerformanceEconomicsAdjustment(record, adjustmentForPerformanceRecord(record, adjustmentMaps))
  }));
  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    summary: performanceSummary(records),
    records: enrichedRecords.slice(0, Math.max(1, Math.min(80, Number(limit) || 20)))
  };
}

function updatePerformanceEconomics(input = {}) {
  const action = String(input.action || "save").trim().toLowerCase();
  const jobId = String(input.jobId || "").trim();
  const recordId = String(input.recordId || input.id || "").trim();
  if (!jobId && !recordId) throw new Error("성과기록 ID 또는 작업 ID가 필요합니다");
  const state = readEconomicsAdjustmentsSync();
  const key = economicsAdjustmentKey(jobId, recordId);
  if (action === "clear") {
    state.adjustments = state.adjustments.filter((item) => item.key !== key && !(jobId && item.jobId === jobId) && !(recordId && item.recordId === recordId));
    writeEconomicsAdjustmentsSync(state);
    return buildPerformanceLogState(input.limit);
  }
  const existing = state.adjustments.find((item) => item.key === key || (jobId && item.jobId === jobId) || (recordId && item.recordId === recordId));
  const now = new Date().toISOString();
  const adjustment = normalizeEconomicsAdjustment({
    ...existing,
    ...input,
    jobId: jobId || existing?.jobId || "",
    recordId: recordId || existing?.recordId || "",
    createdAt: existing?.createdAt || now,
    updatedAt: now
  });
  state.adjustments = [adjustment, ...state.adjustments.filter((item) => item.key !== adjustment.key && !(adjustment.jobId && item.jobId === adjustment.jobId) && !(adjustment.recordId && item.recordId === adjustment.recordId))];
  writeEconomicsAdjustmentsSync(state);
  return buildPerformanceLogState(input.limit);
}

function defaultReviewDecisionsState() {
  return { decisions: [] };
}

function reviewDecisionKey(type, id) {
  return `${String(type || "office").trim().toLowerCase()}:${String(id || "").trim()}`;
}

function reviewDecisionStatusLabel(status = "") {
  return {
    approved: "승인",
    rejected: "반려",
    needs_revision: "수정 필요",
    resolved: "재시도 해결",
    pending: "검수 대기"
  }[status] || "검수 대기";
}

function reviewTextValue(value = "", maxLength = 40000) {
  return String(value || "").replace(/\r\n/g, "\n").slice(0, maxLength);
}

function commonPrefixLength(a = "", b = "") {
  const limit = Math.min(a.length, b.length);
  let index = 0;
  while (index < limit && a[index] === b[index]) index += 1;
  return index;
}

function commonSuffixLength(a = "", b = "", prefix = 0) {
  const max = Math.min(a.length, b.length) - prefix;
  let index = 0;
  while (index < max && a[a.length - 1 - index] === b[b.length - 1 - index]) index += 1;
  return index;
}

function changedTextPreview(value = "") {
  return compactLine(String(value || "").replace(/\s+/g, " "), 260);
}

function buildReviewEditDiff(draftText = "", finalText = "") {
  const draft = reviewTextValue(draftText);
  const final = reviewTextValue(finalText);
  const prefix = commonPrefixLength(draft, final);
  const suffix = commonSuffixLength(draft, final, prefix);
  const removed = draft.slice(prefix, Math.max(prefix, draft.length - suffix));
  const added = final.slice(prefix, Math.max(prefix, final.length - suffix));
  const draftLines = draft.split("\n");
  const finalLines = final.split("\n");
  let linePrefix = 0;
  const lineLimit = Math.min(draftLines.length, finalLines.length);
  while (linePrefix < lineLimit && draftLines[linePrefix] === finalLines[linePrefix]) linePrefix += 1;
  let lineSuffix = 0;
  const lineMax = Math.min(draftLines.length, finalLines.length) - linePrefix;
  while (lineSuffix < lineMax && draftLines[draftLines.length - 1 - lineSuffix] === finalLines[finalLines.length - 1 - lineSuffix]) lineSuffix += 1;
  const removedLines = Math.max(0, draftLines.length - linePrefix - lineSuffix);
  const addedLines = Math.max(0, finalLines.length - linePrefix - lineSuffix);
  const changedChars = Math.max(0, removed.length + added.length);
  const summary = changedChars
    ? `${removedLines}줄 제거 · ${addedLines}줄 추가 · ${changedChars}자 변경`
    : "변경 없음";
  return {
    summary,
    changed: changedChars > 0,
    draftLength: draft.length,
    finalLength: final.length,
    changedChars,
    removedLines,
    addedLines,
    removedPreview: changedTextPreview(removed),
    addedPreview: changedTextPreview(added)
  };
}

function normalizeReviewEdit(input = {}) {
  const draftText = reviewTextValue(input.draftText ?? input.draft ?? "");
  const finalText = reviewTextValue(input.finalText ?? input.final ?? "");
  if (!draftText && !finalText) return null;
  const diff = buildReviewEditDiff(draftText, finalText);
  return {
    draftText,
    finalText,
    diff,
    note: String(input.note || "").trim().slice(0, 1200),
    createdAt: String(input.createdAt || new Date().toISOString()),
    updatedAt: String(input.updatedAt || input.createdAt || new Date().toISOString())
  };
}

function normalizeReviewDecision(input = {}) {
  const rawType = String(input.type || input.targetType || "office").trim().toLowerCase();
  const type = ["office", "codex", "portfolio", "skill", "automation"].includes(rawType) ? rawType : "office";
  const id = String(input.id || input.targetId || "").trim();
  const rawStatus = String(input.status || "").trim().toLowerCase();
  const status = ["approved", "rejected", "needs_revision", "resolved", "pending"].includes(rawStatus) ? rawStatus : "pending";
  const createdAt = String(input.createdAt || new Date().toISOString());
  const updatedAt = String(input.updatedAt || createdAt);
  const editSource = input.edit && typeof input.edit === "object"
    ? { ...input.edit, draftText: input.draftText ?? input.edit.draftText, finalText: input.finalText ?? input.edit.finalText }
    : { draftText: input.draftText, finalText: input.finalText };
  const edit = normalizeReviewEdit(editSource);
  return {
    key: reviewDecisionKey(type, id),
    type,
    id,
    targetTitle: compactLine(input.targetTitle || input.title || "", 120),
    status,
    statusLabel: reviewDecisionStatusLabel(status),
    note: String(input.note || "").trim().slice(0, 1200),
    createdAt,
    updatedAt,
    decidedAt: String(input.decidedAt || (status === "pending" ? "" : updatedAt)),
    edit
  };
}

function normalizeReviewDecisionsState(input = {}) {
  const decisions = Array.isArray(input.decisions) ? input.decisions : [];
  return { decisions: decisions.map(normalizeReviewDecision).filter((decision) => decision.id) };
}

async function readReviewDecisionsState() {
  if (!(await exists(reviewDecisionsPath))) return defaultReviewDecisionsState();
  return normalizeReviewDecisionsState(await readJson(reviewDecisionsPath, defaultReviewDecisionsState()));
}

function readReviewDecisionsStateSync() {
  try {
    if (!existsSync(reviewDecisionsPath)) return defaultReviewDecisionsState();
    return normalizeReviewDecisionsState(JSON.parse(readFileSync(reviewDecisionsPath, "utf8")));
  } catch {
    return defaultReviewDecisionsState();
  }
}

function publicTaskQueueReviewDecision(decision = null) {
  if (!decision?.id || !decision.status || decision.status === "pending") return null;
  return {
    key: decision.key,
    type: decision.type,
    id: decision.id,
    status: decision.status,
    statusLabel: decision.statusLabel,
    note: decision.note,
    decidedAt: decision.decidedAt,
    updatedAt: decision.updatedAt,
    editSummary: decision.edit?.diff?.summary || ""
  };
}

function reviewDecisionClosesAttention(decision = null) {
  return ["approved", "rejected", "resolved"].includes(decision?.status || "");
}

function taskQueueReviewDecisionMapSync() {
  return new Map(readReviewDecisionsStateSync().decisions.map((decision) => [decision.key, decision]));
}

function attachTaskQueueReviewDecision(row = {}, decisionsByKey = taskQueueReviewDecisionMapSync()) {
  const decision = decisionsByKey.get(reviewDecisionKey(row.type || "office", row.id || ""));
  const reviewDecision = publicTaskQueueReviewDecision(decision);
  const closesAttention = reviewDecisionClosesAttention(reviewDecision);
  return {
    ...row,
    needsAttention: closesAttention ? false : row.needsAttention,
    sortRank: closesAttention && Number(row.sortRank || 0) < 4 ? 4 : row.sortRank,
    reviewDecision
  };
}

async function writeReviewDecisionsState(state) {
  const normalized = normalizeReviewDecisionsState(state);
  normalized.decisions = normalized.decisions
    .sort((a, b) => jobTimeValue(b.updatedAt || b.createdAt) - jobTimeValue(a.updatedAt || a.createdAt))
    .slice(0, 300);
  await writeJsonFile(reviewDecisionsPath, normalized);
  return normalized;
}

function reviewDecisionSummary(decisions = []) {
  return {
    total: decisions.length,
    approved: decisions.filter((decision) => decision.status === "approved").length,
    rejected: decisions.filter((decision) => decision.status === "rejected").length,
    needsRevision: decisions.filter((decision) => decision.status === "needs_revision").length,
    resolved: decisions.filter((decision) => decision.status === "resolved").length,
    pending: decisions.filter((decision) => decision.status === "pending").length,
    edited: decisions.filter((decision) => decision.edit?.diff?.changed).length
  };
}

async function buildReviewDecisionsState() {
  const state = await readReviewDecisionsState();
  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    summary: reviewDecisionSummary(state.decisions),
    decisions: state.decisions
  };
}

async function updateReviewDecision(input = {}) {
  const action = String(input.action || "decide").trim().toLowerCase();
  const targetType = String(input.type || input.targetType || "").trim().toLowerCase();
  const targetId = String(input.id || input.targetId || "").trim();
  if (!targetId) throw new Error("검수 대상 ID가 필요합니다");
  const state = await readReviewDecisionsState();
  const key = reviewDecisionKey(targetType || "office", targetId);
  if (action === "clear") {
    state.decisions = state.decisions.filter((decision) => decision.key !== key);
    await writeReviewDecisionsState(state);
    return await buildReviewDecisionsState();
  }
  const existing = state.decisions.find((decision) => decision.key === key);
  const statusByAction = {
    approve: "approved",
    approved: "approved",
    reject: "rejected",
    rejected: "rejected",
    revision: "needs_revision",
    needs_revision: "needs_revision",
    resolve: "resolved",
    resolved: "resolved",
    save_edit: existing?.status || "needs_revision"
  };
  const status = statusByAction[action] || String(input.status || "pending").trim().toLowerCase();
  if (!["approved", "rejected", "needs_revision", "resolved", "pending"].includes(status)) throw new Error("알 수 없는 검수 상태입니다");
  const now = new Date().toISOString();
  const decision = normalizeReviewDecision({
    ...existing,
    ...input,
    type: targetType || existing?.type || "office",
    id: targetId,
    status,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    decidedAt: status === "pending" ? "" : now
  });
  state.decisions = [decision, ...state.decisions.filter((item) => item.key !== key)];
  await writeReviewDecisionsState(state);
  return await buildReviewDecisionsState();
}

function workflowCandidateAgentIds(job) {
  return [...new Set([
    "ceo",
    ...((job.subtasks || []).map((step) => step.agentId).filter(Boolean)),
    "archivist"
  ])].filter((id) => specialistRoles.some((agent) => agent.id === id)).slice(0, 6);
}

async function createWorkflowCandidateFromJob(job) {
  if (!job || job.plan?.questionRequired) return null;
  const performance = job.performance || {};
  const score = Number(performance.score || 0);
  const reusable = job.saved?.ok || performance.portfolioCandidate || score >= 82;
  if (!reusable || !job.report || String(job.report).trim().length < 500) return null;
  const state = await readSkillCandidatesState();
  const existing = state.candidates.find((candidate) => candidate.kind === "workflow" && candidate.sourceJobId === job.id);
  if (existing) return existing;
  const capsule = job.capsule || {};
  const completed = (job.subtasks || []).filter((step) => step.status === "completed");
  const title = compactLine(`${capsule.workType || "workflow"}: ${capsule.title || capsule.normalizedTask || "YOMI workflow"}`, 42);
  const candidate = normalizeSkillCandidate({
    kind: "workflow",
    title,
    description: `성과 ${score || "N/A"}점 작업에서 추출한 재사용 워크플로우 후보입니다.`,
    confidence: score || 82,
    evidence: job.saved?.relPath || performance.portfolioRelPath || "",
    instructions: [
      "이 워크플로우 후보는 완료된 직원 실행에서 자동 추출되었습니다.",
      "같은 유형의 업무가 들어오면 목표 질문, 자료 기준, 직원 분배, 검수/회고 순서를 재사용합니다.",
      "",
      "## Goal",
      capsule.goal || capsule.normalizedTask || "",
      "",
      "## Completion Criteria",
      ...(capsule.completionCriteria || []).map((item) => `- ${item}`),
      "",
      "## Material Needs",
      ...(capsule.materialBrief?.needs || []).map((item) => `- ${item}`),
      "",
      "## Staffing Pattern",
      ...completed.map((step) => `- ${step.agentName || step.agentId}: ${step.label || step.expectedOutput || "subtask"}`),
      "",
      "## Review Rule",
      "성과기록과 회고를 남기고, 재사용 가치가 있으면 Vault와 스킬 후보로 승격합니다."
    ].join("\n"),
    agentIds: workflowCandidateAgentIds(job),
    status: "pending",
    sourceJobId: job.id,
    sourceRelPath: job.saved?.relPath || performance.portfolioRelPath || ""
  });
  state.candidates.unshift(candidate);
  await writeSkillCandidatesState(state);
  return candidate;
}

async function recordLearningFromOrchestration(job) {
  const candidate = await createWorkflowCandidateFromJob(job);
  const candidateIds = candidate ? [candidate.id] : [];
  job.learning = {
    candidateIds,
    generatedAt: new Date().toISOString()
  };
  if (candidate) appendJobLog(job, `학습 후보 생성: ${candidate.title}`, "archivist", "info");
  return job.learning;
}

function assessReusableOrchestration(job) {
  const review = buildAssetQualityReview(job);
  job.assetReview = review;
  if (!review.shouldSave) {
    return {
      ...review,
      shouldSave: false,
      reason: review.issues.length ? `자동 저장 제외: ${review.issues[0]}` : review.reason
    };
  }
  return {
    ...review,
    shouldSave: true,
    reason: review.reason
  };
}

function formatReusableOrchestrationMarkdown(job) {
  return [
    job.report || "# 요미 최종 보고서\n\n보고서 없음",
    "",
    "---",
    "",
    "## 작업캡슐",
    "",
    "```json",
    JSON.stringify(job.capsule || {}, null, 2),
    "```",
    "",
    "## 재사용 중간 산출물",
    "",
    orchestrationOutputSummary((job.subtasks || []).filter((step) => step.status === "completed")) || "저장할 중간 산출물이 없습니다.",
    "",
    "## 직원 간 인계",
    "",
    formatHandoffLinks(job),
    "",
    "## 반성/재계획 로그",
    "",
    formatOrchestrationReflections(job.reflections || []),
    "",
    "## 자산화 품질 게이트",
    "",
    job.assetReview
      ? [
          `- 저장 판단: ${job.assetReview.shouldSave ? "save" : "skip"}`,
          `- RAG 포함: ${job.assetReview.ragReady ? "yes" : "no"}`,
          `- 품질: ${job.assetReview.score}/100 (${job.assetReview.grade})`,
          `- 사유: ${job.assetReview.reason}`,
          ...(job.assetReview.issues || []).map((item) => `- 이슈: ${item}`)
        ].join("\n")
      : "품질 게이트 기록 없음",
    "",
    "## 성과 평가",
    "",
    job.performance
      ? `- 점수: ${job.performance.score}/100 (${job.performance.grade})\n- 포트폴리오 후보: ${job.performance.portfolioCandidate ? "yes" : "no"}\n- 포트폴리오 기록: ${job.performance.portfolioRelPath || "없음"}`
      : "성과 평가 기록 없음"
  ].join("\n");
}

async function saveReusableOrchestrationAssets(job) {
  const assessment = assessReusableOrchestration(job);
  if (!assessment.shouldSave) {
    job.saved = { ok: false, skipped: true, reason: assessment.reason, quality: assessment.quality, rag: false, assetReview: assessment };
    return job.saved;
  }
  const assigned = Array.from(new Set((job.subtasks || []).map((step) => step.agentId).filter(Boolean)))
    .map(resolveAgent)
    .filter(Boolean);
  const workTag = slugify(job.capsule?.workType || "office").toLowerCase();
  job.saved = await saveReportToVault(
    job.capsule?.title || job.capsule?.normalizedTask || "요미 직원 실행",
    formatReusableOrchestrationMarkdown(job),
    assigned,
    {
      type: "yomi_office_orchestration",
      quality: assessment.quality,
      rag: assessment.rag,
      assetReview: assessment,
      tags: ["yomi-office", "yomi-ai", "personal-office", "auto-asset", "orchestration", workTag, assessment.ragReady ? "rag-ready" : "review-candidate"]
    }
  );
  if (job.saved?.ok) {
    job.saved.reason = assessment.reason;
    job.saved.assetReview = assessment;
  }
  return job.saved;
}

async function runOrchestrationJob(job) {
  if (job.cancelRequested || job.status === "cancelled") {
    job.status = "cancelled";
    job.completedAt = job.completedAt || new Date().toISOString();
    job.updatedAt = job.completedAt;
    appendJobLog(job, "사용자 요청으로 직원 실행을 시작하지 않았습니다.", "ceo", "warn");
    return;
  }
  if (job.plan?.questionRequired) {
    job.status = "waiting_question";
    job.updatedAt = new Date().toISOString();
    appendJobLog(job, "사용자 확인이 필요해 실행을 멈췄습니다.", "ceo", "warn");
    setOrchestrationRuntime(job, "사용자 확인 대기", "failed");
    return;
  }
  job.status = "running";
  job.startedAt = new Date().toISOString();
  job.updatedAt = job.startedAt;
  const contextQuery = job.capsule?.materialBrief?.ragQuery || `${job.capsule?.normalizedTask || job.message || ""} ${job.capsule?.workType || ""}`;
  job.context = job.context || await buildPersonalContext(contextQuery, { limit: 5 });
  const contextUse = attachContextToOrchestrationJob(job, job.context, contextQuery);
  appendJobLog(job, `자동 Vault 참조 ${contextUse.sourceCount}개와 톤 프로필을 적용했습니다.`, "archivist");
  appendJobLog(job, "직원 병렬 실행을 시작했습니다.", "ceo");
  setOrchestrationRuntime(job, "직원 실행 시작", "running");
  const groups = new Map();
  for (const subtask of job.subtasks) {
    const group = Number(subtask.parallelGroup || 0);
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(subtask);
  }
  try {
    const completedOutputs = [];
    for (const groupIndex of Array.from(groups.keys()).sort((a, b) => a - b)) {
      if (job.cancelRequested || job.status === "cancelled") {
        job.status = "cancelled";
        job.completedAt = new Date().toISOString();
        job.updatedAt = job.completedAt;
        appendJobLog(job, "사용자 요청으로 남은 직원 실행을 취소했습니다.", "ceo", "warn");
        setOrchestrationRuntime(job, "사용자 취소", "failed");
        return;
      }
      const group = groups.get(groupIndex);
      setOrchestrationRuntime(job, `병렬 그룹 ${groupIndex + 1}`, "running");
      appendJobLog(job, `병렬 그룹 ${groupIndex + 1} 실행 중 · ${group.length}명`, "ceo");
      job.updatedAt = new Date().toISOString();
      const groupResults = await Promise.all(group.map((subtask) => executeOrchestrationSubtask(job, subtask, completedOutputs.slice())));
      completedOutputs.push(...groupResults);
      reflectOrchestrationGroup(job, groupIndex, groupResults, completedOutputs);
      if (job.cancelRequested || job.status === "cancelled") {
        job.status = "cancelled";
        job.completedAt = new Date().toISOString();
        job.updatedAt = job.completedAt;
        appendJobLog(job, "현재 병렬 그룹 완료 후 작업을 취소했습니다.", "ceo", "warn");
        setOrchestrationRuntime(job, "사용자 취소", "failed");
        return;
      }
      job.updatedAt = new Date().toISOString();
      appendJobLog(job, `병렬 그룹 ${groupIndex + 1} 완료`, "ceo");
    }
    const failed = job.subtasks.filter((step) => step.status === "failed");
    job.status = failed.length ? "failed" : "finalizing";
    setOrchestrationRuntime(job, failed.length ? "실패 포함 취합" : "요미 최종 취합", failed.length ? "failed" : "evaluating");
    appendJobLog(job, failed.length ? "실패 항목을 포함해 최종 취합합니다." : "요미가 최종 보고서를 취합합니다.", "ceo", failed.length ? "warn" : "info");
    job.report = await buildYomiFinalReport(job);
    job.status = failed.length ? "completed_with_errors" : "completed";
    await saveReusableOrchestrationAssets(job);
    await recordJobPerformance(job);
    await recordLearningFromOrchestration(job);
    job.completedAt = new Date().toISOString();
    job.updatedAt = job.completedAt;
    appendJobLog(job, job.status === "completed" ? "직원 실행이 완료되었습니다." : "직원 실행이 일부 실패로 완료되었습니다.", "ceo", failed.length ? "warn" : "info");
    workflowRuntime.runCount += 1;
    if (failed.length) workflowRuntime.statusCounts.failed += 1;
    else workflowRuntime.statusCounts.success += 1;
    setOrchestrationRuntime(job, failed.length ? "완료 · 일부 실패" : "완료", failed.length ? "failed" : "completed");
  } catch (error) {
    job.status = "failed";
    job.error = error instanceof Error ? error.message : String(error);
    job.completedAt = new Date().toISOString();
    job.updatedAt = job.completedAt;
    appendJobLog(job, `직원 실행 중단: ${job.error}`, "ceo", "error");
    workflowRuntime.statusCounts.failed += 1;
    setOrchestrationRuntime(job, "중단", "failed");
    recordWorkflowError("요미 병렬 실행", job.error);
  }
}

function createOrchestrationJob(message, route, orchestration, options = {}) {
  const job = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    mode: "parallel_worker_pool",
    status: "queued",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    startedAt: "",
    completedAt: "",
    message,
    route,
    capsule: orchestration.capsule,
    plan: orchestration.plan,
    humanLoopQuestion: orchestration.plan.humanLoopQuestion || orchestration.capsule.humanLoopQuestion || null,
    humanLoopAnswer: null,
    subtasks: (orchestration.plan.subtasks || []).map((step) => ({ ...step, output: "", error: "", attempts: 0 })),
    handoffs: [],
    reflections: [],
    context: options.context || null,
    contextUse: null,
    report: "",
    error: "",
    assetReview: null,
    saved: { ok: false, skipped: true, reason: "완료 후 재사용 가치가 있으면 Vault 50_Outputs에 자동 저장합니다." },
    llm: { provider: "dual-cli", model: "codex-default-claude-reasoning", used: false },
    logs: []
  };
  if (options.context) {
    attachContextToOrchestrationJob(job, options.context, options.contextQuery || orchestration.capsule?.materialBrief?.ragQuery || route.task || message);
  }
  appendJobLog(job, "요미 작업이 큐에 등록되었습니다.", "ceo");
  orchestrationJobs.set(job.id, job);
  queueMicrotask(() => {
    runOrchestrationJob(job).catch((error) => {
      job.status = "failed";
      job.error = error instanceof Error ? error.message : String(error);
      job.updatedAt = new Date().toISOString();
      appendJobLog(job, `직원 실행 예약 실패: ${job.error}`, "ceo", "error");
      recordWorkflowError("요미 병렬 실행", job.error);
    });
  });
  return job;
}

function resolveHumanLoopChoice(question, choiceId) {
  const choices = question?.choices || [];
  return choices.find((choice) => choice.id === choiceId) || null;
}

function resumeOrchestrationJob(job, choice, note = "") {
  job.humanLoopAnswer = {
    choiceId: choice.id,
    label: choice.label,
    note: String(note || "").trim(),
    answeredAt: new Date().toISOString()
  };
  job.capsule = {
    ...job.capsule,
    needsQuestion: false,
    humanLoopQuestion: null,
    resolvedQuestionReasons: job.capsule?.questionReasons || [],
    questionReasons: [],
    constraints: [
      ...(job.capsule?.constraints || []),
      choice.id === "safe_plan"
        ? "사용자가 안전 분석만 진행을 선택했다. 실제 파일 쓰기, Git 쓰기, 외부 전송, 비용 발생은 하지 않는다."
        : "사용자가 현재 지시 기준으로 진행을 선택했다."
    ]
  };
  job.plan = {
    ...job.plan,
    questionRequired: false,
    questionReasons: [],
    humanLoopQuestion: null,
    nextAction: "사용자 확인 완료 후 병렬 직원 실행"
  };
  job.humanLoopQuestion = null;
  job.status = "queued";
  job.updatedAt = new Date().toISOString();
  for (const step of job.subtasks || []) {
    if (step.status === "planned") step.status = "queued";
  }
  appendJobLog(job, `사용자 선택: ${choice.label}. 작업을 재개합니다.`, "ceo");
  queueMicrotask(() => {
    runOrchestrationJob(job).catch((error) => {
      job.status = "failed";
      job.error = error instanceof Error ? error.message : String(error);
      job.updatedAt = new Date().toISOString();
      appendJobLog(job, `직원 실행 재개 실패: ${job.error}`, "ceo", "error");
      recordWorkflowError("요미 병렬 실행 재개", job.error);
    });
  });
  return job;
}

function answerOrchestrationQuestion(input = {}) {
  const id = String(input.id || "");
  const choiceId = String(input.choiceId || input.choice || "");
  const job = orchestrationJobs.get(id);
  if (!job) throw new Error("요미 직원 실행 작업을 찾을 수 없습니다");
  if (job.status !== "waiting_question") throw new Error("현재 확인 대기 상태가 아닙니다");
  const choice = resolveHumanLoopChoice(job.humanLoopQuestion || job.plan?.humanLoopQuestion || job.capsule?.humanLoopQuestion, choiceId);
  if (!choice) throw new Error("선택지를 찾을 수 없습니다");
  if (choice.id === "cancel") {
    job.status = "cancelled";
    job.completedAt = new Date().toISOString();
    job.updatedAt = job.completedAt;
    job.humanLoopAnswer = { choiceId: choice.id, label: choice.label, note: String(input.note || "").trim(), answeredAt: job.completedAt };
    job.saved = { ok: false, skipped: true, reason: "사용자가 확인 단계에서 작업을 취소했습니다." };
    appendJobLog(job, "사용자가 작업을 취소했습니다.", "ceo", "warn");
    setOrchestrationRuntime(job, "사용자 취소", "failed");
    return job;
  }
  return resumeOrchestrationJob(job, choice, input.note);
}

async function generateCodexConversation(message) {
  const context = await buildPersonalContext(message, { limit: 4 });
  const prompt = [
    "너는 YOMI Office의 총괄 매니저 요미다.",
    "사용자의 질문에 한국어로 직접 답한다.",
    "고정 안내문이나 사용법 안내로 빠지지 말고, 요청한 산출물을 바로 제공한다.",
    "외부 최신 정보가 필요하지만 확인할 수 없으면 그 한계를 짧게 밝히고 일반적인 답을 제공한다.",
    "사용자 톤/스타일 프로필을 지키고, 자동 Vault 참조가 직접 관련 있으면 답변에 반영한다.",
    "",
    context.promptBlock,
    "",
    `사용자 입력: ${message}`
  ].join("\n");
  const generated = await runCodexText(prompt, "대화 응답 생성");
  return { ...generated, context: publicContextSummary(context) };
}

async function generateClaudeConversation(message) {
  const context = await buildPersonalContext(message, { limit: 4 });
  const prompt = [
    "너는 YOMI Office / 요미오피스에서 사용자가 명시적으로 호출한 Claude Code CLI다.",
    "사용자가 /cc 또는 /claude 명령을 썼을 때만 이 호출이 실행된다.",
    "한국어로 답하고, 요청한 산출물을 바로 제공한다.",
    "이 호출은 안전한 계획 모드다. 파일 수정, 삭제, Git 쓰기, 외부 전송 같은 상태 변경은 실행하지 말고 필요한 경우 확인 질문이나 제안으로만 남긴다.",
    "사용자 톤/스타일 프로필을 지키고, 자동 Vault 참조가 직접 관련 있으면 답변에 반영한다.",
    "",
    context.promptBlock,
    "",
    `사용자 요청: ${message}`
  ].join("\n");
  const directTimeoutMs = Math.min(60_000, Math.max(20_000, claudePromptTimeoutMs));
  const generated = await runClaudeText(prompt, "Claude 직접 호출", { timeoutMs: directTimeoutMs });
  return { ...generated, context: publicContextSummary(context) };
}

async function generateCodexVaultAnswer(message, sources) {
  const profile = await readStyleProfile();
  const sourceText = sources.length
    ? sources.map((item, index) => `자료 ${index + 1}\n제목: ${item.title}\n경로: ${item.displayPath || item.relPath}\n발췌: ${item.excerpt}`).join("\n\n")
    : "검색된 자료 없음";
  const prompt = [
    "너는 YOMI Office의 저장소 분석 담당이다.",
    "아래 Vault 검색 결과만 근거로 사용자 질문에 답한다.",
    "자료가 부족하면 부족하다고 말하고, 다음에 어떤 키워드로 찾으면 좋을지 제안한다.",
    "사용자 톤/스타일 프로필을 지킨다.",
    "",
    formatStyleProfilePrompt(profile),
    "",
    `사용자 질문: ${message}`,
    "",
    "Vault 검색 결과:",
    sourceText
  ].join("\n");
  return await runCodexText(prompt, "저장소 답변 생성");
}

async function runChatMessageCore({ message }) {
  const explicitRoute = parseChatRoute(message);
  const route = explicitRoute.intent === "auto" ? await classifyChatRouteWithCodex(message) : explicitRoute;
  if (route.intent === "codex_error") {
    return {
      intent: "error",
      modeLabel: "Codex 오류",
      reply: route.error,
      sources: [],
      llm: { provider: "codex-cli", model: "exec", used: false }
    };
  }

  if (route.intent === "codex") {
    if (!route.task) {
      return {
        intent: "codex",
        modeLabel: "코덱스",
        reply: "사용법: /codex 점검할 작업 내용",
        sources: [],
        llm: { provider: "codex-cli", model: "exec-readonly", used: false }
      };
    }
    const job = createCodexJob(route.task);
    return {
      intent: "codex",
      modeLabel: "코덱스",
      reply: `태오에게 코덱스 작업을 맡겼습니다.\n\n- 작업 ID: ${job.id}\n- 실행: ${job.commandLabel}\n- 상태: ${job.status}\n\n완료되면 보고서가 Vault에 저장됩니다.`,
      codexJob: publicCodexJob(job),
      sources: [],
      llm: { provider: "codex-cli", model: "exec-readonly", used: false }
    };
  }

  if (route.intent === "claude") {
    if (!route.task) {
      return {
        intent: "claude",
        modeLabel: "Claude 직접 호출",
        reply: "사용법: /cc 요청 내용 또는 /claude 요청 내용",
        sources: [],
        llm: { provider: "claude-code", model: "manual-plan", used: false }
      };
    }
    const generated = await generateClaudeConversation(route.task);
    return {
      intent: "claude",
      modeLabel: "Claude 직접 호출",
      reply: generated.text,
      sources: generated.context?.sources || [],
      llm: { provider: "claude-code", model: "manual-plan", used: true, commandLabel: generated.commandLabel },
      context: generated.context,
      capture: { ok: false, skipped: true, reason: "Claude 직접 호출 결과는 자동 저장하지 않았습니다" }
    };
  }

  if (route.intent === "office") {
    if (!route.task) {
      return {
        intent: "office",
        modeLabel: "요미 라우팅",
        reply: "사용법: /업무 실행할 내용",
        sources: [],
        llm: { provider: "yomi-router", model: "task-capsule", used: false }
      };
    }
    const orchestration = createYomiOrchestration(message, route);
    const contextQuery = orchestration.capsule?.materialBrief?.ragQuery || `${route.task || message} ${orchestration.capsule?.workType || ""}`;
    const context = await buildPersonalContext(contextQuery, { limit: 5 });
    const contextUse = buildContextUsePlan(context, contextQuery);
    orchestration.capsule = {
      ...orchestration.capsule,
      contextUse,
      materialBrief: {
        ...(orchestration.capsule.materialBrief || {}),
        ragSources: contextUse.sources.map((item) => ({
          rank: item.rank,
          title: item.title,
          relPath: item.relPath,
          displayPath: item.displayPath,
          score: item.score
        }))
      }
    };
    orchestration.plan = {
      ...orchestration.plan,
      contextUse
    };
    const job = createOrchestrationJob(message, route, orchestration, { context, contextQuery });
    const workflowRun = workflowRunFromYomiPlan(orchestration.plan);
    return {
      intent: "office",
      modeLabel: orchestration.plan.questionRequired ? "확인 필요" : "직원 실행",
      reply: formatYomiPlanReply(orchestration),
      officePlan: orchestration,
      officeJob: publicOrchestrationJob(job),
      officeTask: {
        saved: { ok: false, skipped: true, reason: "완료 후 재사용 가치가 있으면 Vault 50_Outputs에 자동 저장합니다." },
        workflowRun
      },
      sources: context.sources || [],
      context: publicContextSummary(context),
      llm: { provider: "dual-cli", model: "codex-default-claude-reasoning", used: !orchestration.plan.questionRequired }
    };
  }

  if (route.intent === "vault") {
    const search = await searchRagIndex(route.task || message, 5);
    const sources = search.results || [];
    const profile = await readStyleProfile();
    const generated = await generateCodexVaultAnswer(message, sources);
    return {
      intent: "vault",
      modeLabel: "저장소검색",
      reply: generated.text,
      sources,
      llm: { provider: "codex-cli", model: "exec", used: true },
      context: { profile: { label: profile.label, enabled: profile.enabled }, vaultConnected: search.connected, sourceCount: sources.length, sources },
      capture: { ok: false, skipped: true, reason: "저장소 검색 답변은 자동 저장하지 않았습니다" }
    };
  }

  const generated = await generateCodexConversation(message);
  return {
    intent: "general",
    modeLabel: "Codex 대화",
    reply: generated.text,
    sources: generated.context?.sources || [],
    llm: { provider: "codex-cli", model: "exec", used: true },
    context: generated.context,
    capture: { ok: false, skipped: true, reason: "B 단계에서는 채팅 저장 정책을 변경하지 않았습니다" }
  };
}

async function runChatMessage({ message, sessionId = "" }) {
  const result = await runChatMessageCore({ message });
  try {
    result.memory = await recordConversationTurn({ message, result, sessionId });
    if (!result.capture) result.capture = result.memory.capture;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    result.memory = { ok: false, capture: { ok: false, skipped: true, reason: `대화 자산화 실패: ${reason}` }, skillCandidateIds: [] };
    recordWorkflowError("대화 자산화", reason);
  }
  return result;
}

function publicAutomationRules() {
  return { ...automationRules, keywords: [...automationRules.keywords] };
}

function updateAutomationRules(input = {}) {
  const next = { ...automationRules };
  for (const key of ["chatAssetCapture", "vaultModeCapture", "reportSave", "codexReportSave"]) if (typeof input[key] === "boolean") next[key] = input[key];
  if (Array.isArray(input.keywords)) next.keywords = input.keywords.map((item) => String(item || "").trim()).filter(Boolean);
  else if (typeof input.keywords === "string") next.keywords = input.keywords.split(/[\n,]+/).map((item) => item.trim()).filter(Boolean);
  if (!next.keywords.length) next.keywords = [...defaultAutomationRules.keywords];
  automationRules = next;
  return publicAutomationRules();
}

const automationTriggerHistoryLimit = 20;
const defaultAutomationTriggerRetryPolicy = {
  enabled: true,
  maxAttempts: 2,
  delayMinutes: 5,
  backoffMultiplier: 2
};

function defaultAutomationTriggersConfig() {
  return {
    triggers: [
      {
        id: "daily-ai-trend",
        title: "매일 오전 AI 트렌드 요약",
        type: "schedule",
        enabled: false,
        message: "/업무 오늘 기준 AI 개인업무 자동화 트렌드를 조사해서 핵심 인사이트, 실행 아이디어, 저장할 키워드로 정리해줘",
        schedule: { kind: "daily", time: "09:00" },
        watch: { folder: "", patterns: [] },
        lastRunAt: "",
        nextRunAt: "",
        lastEventAt: "",
        lastResult: null,
        failureCount: 0,
        nextRetryAt: "",
        retryContext: null,
        retryPolicy: { ...defaultAutomationTriggerRetryPolicy },
        history: []
      },
      {
        id: "vault-inbox-watch",
        title: "Vault 00_Inbox 새 파일 정리",
        type: "folder_watch",
        enabled: false,
        message: "/업무 Vault에 새로 들어온 파일을 읽고 요약, 태그 후보, 다음 행동을 정리해줘: {{file}}",
        schedule: { kind: "manual", time: "" },
        watch: { folder: "00_Inbox", patterns: ["*.md"], debounceSeconds: 20 },
        lastRunAt: "",
        nextRunAt: "",
        lastEventAt: "",
        lastResult: null,
        failureCount: 0,
        nextRetryAt: "",
        retryContext: null,
        retryPolicy: { ...defaultAutomationTriggerRetryPolicy },
        history: []
      }
    ]
  };
}

function normalizeAutomationRetryPolicy(input = {}) {
  const policy = input && typeof input === "object" ? input : {};
  return {
    enabled: policy.enabled !== false,
    maxAttempts: Math.max(1, Math.min(5, Number(policy.maxAttempts || defaultAutomationTriggerRetryPolicy.maxAttempts) || defaultAutomationTriggerRetryPolicy.maxAttempts)),
    delayMinutes: Math.max(1, Math.min(120, Number(policy.delayMinutes || defaultAutomationTriggerRetryPolicy.delayMinutes) || defaultAutomationTriggerRetryPolicy.delayMinutes)),
    backoffMultiplier: Math.max(1, Math.min(5, Number(policy.backoffMultiplier || defaultAutomationTriggerRetryPolicy.backoffMultiplier) || defaultAutomationTriggerRetryPolicy.backoffMultiplier))
  };
}

function normalizeAutomationRetryContext(input = null) {
  if (!input || typeof input !== "object") return null;
  return {
    event: compactLine(input.event || "retry", 32),
    file: String(input.file || "").replace(/\\/g, "/").slice(0, 260)
  };
}

function normalizeAutomationTriggerHistoryEntry(input = {}) {
  return {
    id: String(input.id || `run-${Date.now().toString(36)}`),
    ok: input.ok === true,
    event: compactLine(input.event || "trigger", 32),
    file: String(input.file || "").replace(/\\/g, "/").slice(0, 260),
    jobId: String(input.jobId || ""),
    jobStatus: compactLine(input.jobStatus || "", 36),
    jobStatusLabel: compactLine(input.jobStatusLabel || "", 48),
    jobCompletedAt: String(input.jobCompletedAt || ""),
    jobUpdatedAt: String(input.jobUpdatedAt || ""),
    jobSavedOk: input.jobSavedOk === true,
    jobSavedRelPath: String(input.jobSavedRelPath || "").replace(/\\/g, "/").slice(0, 260),
    jobSavedReason: compactLine(input.jobSavedReason || "", 180),
    modeLabel: compactLine(input.modeLabel || "", 48),
    intent: compactLine(input.intent || "", 32),
    error: compactLine(input.error || "", 180),
    attempt: Math.max(1, Math.min(5, Number(input.attempt || 1) || 1)),
    retryScheduledAt: String(input.retryScheduledAt || ""),
    durationMs: Math.max(0, Math.round(Number(input.durationMs || 0) || 0)),
    ranAt: String(input.ranAt || input.createdAt || new Date().toISOString())
  };
}

function appendAutomationTriggerHistory(trigger, entry) {
  if (!trigger) return;
  const history = Array.isArray(trigger.history) ? trigger.history : [];
  trigger.history = [
    normalizeAutomationTriggerHistoryEntry(entry),
    ...history.map(normalizeAutomationTriggerHistoryEntry)
  ].slice(0, automationTriggerHistoryLimit);
}

function automationJobOutcomeText(row = {}) {
  return compactLine(row.progress || row.lastLog || row.saved?.reason || row.detail || row.statusLabel || row.status || "", 180);
}

function syncAutomationEntryWithJob(entry = {}) {
  const normalized = normalizeAutomationTriggerHistoryEntry(entry);
  const jobId = String(normalized.jobId || "").trim();
  if (!jobId) return { entry: normalized, changed: false };
  const resolved = resolveTaskQueueJob("", jobId);
  if (!resolved) return { entry: normalized, changed: false };
  const row = publicResolvedTaskQueueJob(resolved);
  if (!row?.status || !finalJobStatuses.has(row.status)) return { entry: normalized, changed: false };
  const jobOk = row.status === "completed";
  const next = normalizeAutomationTriggerHistoryEntry({
    ...normalized,
    ok: jobOk,
    jobStatus: row.status,
    jobStatusLabel: row.statusLabel || serverJobStatusLabel(row.status),
    jobCompletedAt: row.completedAt || row.updatedAt || "",
    jobUpdatedAt: row.updatedAt || "",
    jobSavedOk: row.saved?.ok === true,
    jobSavedRelPath: row.saved?.relPath || "",
    jobSavedReason: row.saved?.reason || "",
    modeLabel: normalized.modeLabel || row.statusLabel || serverJobStatusLabel(row.status),
    error: jobOk ? normalized.error : automationJobOutcomeText(row)
  });
  const changed = JSON.stringify(normalized) !== JSON.stringify(next);
  return { entry: next, changed };
}

function syncAutomationTriggerJobResults(config = {}) {
  let dirty = false;
  for (const trigger of Array.isArray(config.triggers) ? config.triggers : []) {
    if (trigger.lastResult?.jobId) {
      const synced = syncAutomationEntryWithJob(trigger.lastResult);
      trigger.lastResult = synced.entry;
      dirty = dirty || synced.changed;
    }
    if (Array.isArray(trigger.history) && trigger.history.length) {
      trigger.history = trigger.history.map((entry) => {
        const synced = syncAutomationEntryWithJob(entry);
        dirty = dirty || synced.changed;
        return synced.entry;
      });
    }
  }
  return dirty;
}

function automationReviewIdForEntry(triggerId = "", entry = {}) {
  return `${String(triggerId || "").trim()}:${String(entry.id || entry.ranAt || entry.event || "run").trim()}`;
}

async function automationReviewIdsForJob(jobId = "") {
  const targetJobId = String(jobId || "").trim();
  if (!targetJobId) return [];
  const config = await readAutomationTriggersConfig().catch(() => ({ triggers: [] }));
  const ids = new Set();
  for (const trigger of Array.isArray(config.triggers) ? config.triggers : []) {
    const entries = [
      ...(trigger.lastResult ? [trigger.lastResult] : []),
      ...(Array.isArray(trigger.history) ? trigger.history : [])
    ];
    for (const entry of entries) {
      if (String(entry?.jobId || "").trim() !== targetJobId) continue;
      const id = automationReviewIdForEntry(trigger.id, entry);
      if (id.includes(":")) ids.add(id);
    }
  }
  return [...ids];
}

function normalizeTriggerTime(value) {
  const match = String(value || "").trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return "09:00";
  const hour = Math.max(0, Math.min(23, Number(match[1]) || 0));
  const minute = Math.max(0, Math.min(59, Number(match[2]) || 0));
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function normalizeAutomationTrigger(input = {}, index = 0) {
  const type = String(input.type || "schedule") === "folder_watch" ? "folder_watch" : "schedule";
  const title = compactLine(input.title || input.name || (type === "schedule" ? "예약 작업" : "폴더 감시"), 64);
  const id = slugId(input.id || title || `trigger-${index + 1}`);
  const schedule = input.schedule && typeof input.schedule === "object" ? input.schedule : {};
  const watchConfig = input.watch && typeof input.watch === "object" ? input.watch : {};
  const watchFolder = String(watchConfig.folder || input.folder || "").replace(/\\/g, "/").replace(/^\/+/, "").trim();
  return {
    id,
    title,
    type,
    enabled: input.enabled === true,
    message: String(input.message || "").trim(),
    schedule: {
      kind: String(schedule.kind || input.scheduleKind || "daily") === "interval" ? "interval" : (type === "schedule" ? "daily" : "manual"),
      time: normalizeTriggerTime(schedule.time || input.time),
      everyMinutes: Math.max(15, Math.min(1440, Number(schedule.everyMinutes || input.everyMinutes || 60) || 60))
    },
    watch: {
      folder: watchFolder || "00_Inbox",
      patterns: normalizeStringList(watchConfig.patterns || input.patterns || ["*.md"]).length ? normalizeStringList(watchConfig.patterns || input.patterns || ["*.md"]) : ["*.md"],
      debounceSeconds: Math.max(5, Math.min(300, Number(watchConfig.debounceSeconds || input.debounceSeconds || 20) || 20))
    },
    lastRunAt: String(input.lastRunAt || ""),
    nextRunAt: String(input.nextRunAt || ""),
    lastEventAt: String(input.lastEventAt || ""),
    lastResult: input.lastResult && typeof input.lastResult === "object" ? input.lastResult : null,
    failureCount: Math.max(0, Math.min(5, Number(input.failureCount || 0) || 0)),
    nextRetryAt: String(input.nextRetryAt || ""),
    retryContext: normalizeAutomationRetryContext(input.retryContext),
    retryPolicy: normalizeAutomationRetryPolicy(input.retryPolicy),
    history: (Array.isArray(input.history) ? input.history : []).map(normalizeAutomationTriggerHistoryEntry).slice(0, automationTriggerHistoryLimit)
  };
}

function normalizeAutomationTriggersConfig(config = defaultAutomationTriggersConfig()) {
  const fallback = defaultAutomationTriggersConfig();
  const source = Array.isArray(config.triggers) ? config.triggers : fallback.triggers;
  const triggers = source.map(normalizeAutomationTrigger);
  return { triggers };
}

function normalizeAutomationTriggerRuntimeFields(input = {}) {
  return {
    lastRunAt: String(input.lastRunAt || ""),
    nextRunAt: String(input.nextRunAt || ""),
    lastEventAt: String(input.lastEventAt || ""),
    lastResult: input.lastResult && typeof input.lastResult === "object" ? normalizeAutomationTriggerHistoryEntry(input.lastResult) : null,
    failureCount: Math.max(0, Math.min(5, Number(input.failureCount || 0) || 0)),
    nextRetryAt: String(input.nextRetryAt || ""),
    retryContext: normalizeAutomationRetryContext(input.retryContext),
    history: (Array.isArray(input.history) ? input.history : []).map(normalizeAutomationTriggerHistoryEntry).slice(0, automationTriggerHistoryLimit)
  };
}

function automationTriggerConfigFields(trigger = {}) {
  return {
    ...trigger,
    lastRunAt: "",
    nextRunAt: "",
    lastEventAt: "",
    lastResult: null,
    failureCount: 0,
    nextRetryAt: "",
    retryContext: null,
    history: []
  };
}

function automationTriggerRuntimeStateFromConfig(config = {}) {
  const normalized = normalizeAutomationTriggersConfig(config);
  const triggers = {};
  for (const trigger of normalized.triggers) {
    triggers[trigger.id] = normalizeAutomationTriggerRuntimeFields(trigger);
  }
  return { triggers };
}

function normalizeAutomationTriggerRuntimeState(input = {}) {
  const source = input?.triggers && typeof input.triggers === "object" && !Array.isArray(input.triggers) ? input.triggers : {};
  const triggers = {};
  for (const [id, value] of Object.entries(source)) {
    const triggerId = slugId(id);
    if (!triggerId) continue;
    triggers[triggerId] = normalizeAutomationTriggerRuntimeFields(value);
  }
  return { triggers };
}

function automationTriggerHasRuntimeState(input = {}) {
  return Boolean(
    input.lastRunAt
    || input.nextRunAt
    || input.lastEventAt
    || input.lastResult
    || Number(input.failureCount || 0) > 0
    || input.nextRetryAt
    || input.retryContext
    || (Array.isArray(input.history) && input.history.length)
  );
}

function automationConfigHasRuntimeState(input = {}) {
  return (Array.isArray(input.triggers) ? input.triggers : []).some(automationTriggerHasRuntimeState);
}

function applyAutomationTriggerRuntimeState(config = {}, state = {}) {
  const normalized = normalizeAutomationTriggersConfig(config);
  const runtime = normalizeAutomationTriggerRuntimeState(state);
  return {
    triggers: normalized.triggers.map((trigger) => runtime.triggers[trigger.id] ? {
      ...trigger,
      ...runtime.triggers[trigger.id]
    } : trigger)
  };
}

async function readAutomationTriggerState() {
  return normalizeAutomationTriggerRuntimeState(await readJson(automationTriggerStatePath, { triggers: {} }));
}

async function writeAutomationTriggerState(config) {
  await writeJsonFile(automationTriggerStatePath, automationTriggerRuntimeStateFromConfig(config));
}

async function readAutomationTriggersConfig() {
  const rawConfig = await exists(automationTriggersConfigPath) ? await readJson(automationTriggersConfigPath, defaultAutomationTriggersConfig()) : defaultAutomationTriggersConfig();
  const config = applyAutomationTriggerRuntimeState(rawConfig, await readAutomationTriggerState());
  if (automationConfigHasRuntimeState(rawConfig)) await writeAutomationTriggersConfig(config, { syncWatchers: false });
  return config;
}

function dailyRunAt(time, base = new Date()) {
  const [hour, minute] = normalizeTriggerTime(time).split(":").map(Number);
  const next = new Date(base);
  next.setHours(hour, minute, 0, 0);
  if (next.getTime() <= base.getTime()) next.setDate(next.getDate() + 1);
  return next.toISOString();
}

function intervalRunAt(minutes, base = new Date()) {
  return new Date(base.getTime() + Math.max(15, Math.min(1440, Number(minutes) || 60)) * 60000).toISOString();
}

function computeAutomationNextRunAt(trigger, base = new Date()) {
  if (trigger.type !== "schedule") return "";
  if (trigger.schedule?.kind === "interval") return intervalRunAt(trigger.schedule.everyMinutes, base);
  return dailyRunAt(trigger.schedule?.time, base);
}

function computeAutomationRetryAt(trigger, failureCount = 1, base = new Date()) {
  const policy = normalizeAutomationRetryPolicy(trigger.retryPolicy);
  const exponent = Math.max(0, Math.min(4, Number(failureCount || 1) - 1));
  const delayMinutes = policy.delayMinutes * Math.pow(policy.backoffMultiplier, exponent);
  return new Date(base.getTime() + Math.max(1, Math.min(720, delayMinutes)) * 60000).toISOString();
}

function preserveAutomationRuntimeFields(existing = {}, next = {}, options = {}) {
  return {
    ...next,
    lastRunAt: existing.lastRunAt || next.lastRunAt || "",
    nextRunAt: next.type === "schedule" ? (next.nextRunAt || existing.nextRunAt || "") : "",
    lastEventAt: existing.lastEventAt || next.lastEventAt || "",
    lastResult: existing.lastResult || next.lastResult || null,
    failureCount: Number(existing.failureCount || next.failureCount || 0) || 0,
    nextRetryAt: existing.nextRetryAt || next.nextRetryAt || "",
    retryContext: existing.retryContext || next.retryContext || null,
    retryPolicy: normalizeAutomationRetryPolicy(options.replaceRetryPolicy ? next.retryPolicy : (existing.retryPolicy || next.retryPolicy)),
    history: Array.isArray(existing.history) ? existing.history : (Array.isArray(next.history) ? next.history : [])
  };
}

function automationTriggerStatusLabel(status = "") {
  return {
    disabled: "비활성",
    scheduled: "예약됨",
    watching: "감시 중",
    ready: "준비",
    running: "실행 중",
    retrying: "재시도 예약",
    blocked: "확인 필요",
    failed: "실패"
  }[status] || status || "대기";
}

function globToRegExp(pattern) {
  const source = String(pattern || "*").replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".");
  return new RegExp(`^${source}$`, "i");
}

function matchesWatchPattern(fileName, patterns = []) {
  const base = path.basename(String(fileName || ""));
  if (!base) return false;
  return (patterns.length ? patterns : ["*.md"]).some((pattern) => globToRegExp(pattern).test(base));
}

async function resolveTriggerWatchFolder(trigger) {
  const vaultRoot = await findVaultRoot();
  if (!vaultRoot) return { ok: false, reason: "Vault 경로를 찾지 못했습니다." };
  const folder = String(trigger.watch?.folder || "00_Inbox").replace(/\\/g, "/").replace(/^\/+/, "").trim();
  if (!folder || folder.includes("..") || path.isAbsolute(folder)) return { ok: false, reason: "감시 폴더는 Vault 내부 상대 경로만 허용합니다." };
  const fullPath = path.resolve(vaultRoot, folder);
  const vaultPath = path.resolve(vaultRoot);
  if (fullPath !== vaultPath && !fullPath.startsWith(`${vaultPath}${path.sep}`)) return { ok: false, reason: "감시 폴더가 Vault 밖을 가리킵니다." };
  if (!(await exists(fullPath))) return { ok: false, reason: `폴더 없음: ${folder}` };
  return { ok: true, folder, fullPath, vaultRoot };
}

function automationReadinessLabel(status = "") {
  return ({
    ready: "활성화 가능",
    review: "점검 권장",
    blocked: "활성화 차단"
  })[status] || "점검 대기";
}

async function buildAutomationTriggerReadiness(trigger) {
  const checks = [];
  const addCheck = (id, status, label, detail = "", blocking = false) => {
    checks.push({ id, status, label, detail, blocking: blocking === true });
  };
  const sampleFile = trigger.type === "folder_watch" ? `${trigger.watch?.folder || "00_Inbox"}/example.md` : "";
  const sampleMessage = renderAutomationMessage(trigger, { event: "preview", file: sampleFile });
  if (sampleMessage) addCheck("message", "ok", "실행 메시지", "미리보기 생성 가능");
  else addCheck("message", "bad", "실행 메시지", "실행할 메시지가 없습니다.", true);

  const hasExplicitRoute = /^\s*\/(?:업무|codex|cc|claude|vault)(?:\s+|$)/i.test(String(trigger.message || ""));
  addCheck(
    "route",
    hasExplicitRoute ? "ok" : "warn",
    "라우팅",
    hasExplicitRoute ? "명시적 라우팅 사용" : "자동 분류로 라우팅됩니다."
  );

  if (trigger.type === "schedule") {
    const schedule = trigger.schedule || {};
    const detail = schedule.kind === "interval"
      ? `${Number(schedule.everyMinutes || 60)}분 간격`
      : `매일 ${schedule.time || "09:00"}`;
    addCheck("schedule", "ok", "예약", detail);
  } else {
    const resolved = await resolveTriggerWatchFolder(trigger);
    addCheck(
      "watch_folder",
      resolved.ok ? "ok" : "bad",
      "감시 폴더",
      resolved.ok ? `${resolved.folder} 확인됨` : resolved.reason,
      !resolved.ok
    );
    const patterns = Array.isArray(trigger.watch?.patterns) ? trigger.watch.patterns : [];
    addCheck("watch_pattern", patterns.length ? "ok" : "warn", "파일 패턴", patterns.length ? patterns.join(", ") : "*.md 기본값 사용");
  }

  const policy = normalizeAutomationRetryPolicy(trigger.retryPolicy);
  addCheck(
    "retry",
    policy.enabled ? "ok" : "warn",
    "재시도",
    policy.enabled ? `최대 ${policy.maxAttempts}회 · ${policy.delayMinutes}분` : "재시도 꺼짐"
  );
  addCheck("review", "ok", "검수 연결", "실행 후 검수함에 기록됩니다.");
  if (trigger.nextRetryAt) addCheck("retry_waiting", "warn", "재시도 대기", trigger.nextRetryAt);

  const blockers = checks.filter((check) => check.blocking);
  const warnings = checks.filter((check) => check.status === "warn");
  const status = blockers.length ? "blocked" : warnings.length ? "review" : "ready";
  return {
    status,
    statusLabel: automationReadinessLabel(status),
    blocking: blockers.length > 0,
    warningCount: warnings.length,
    blockerCount: blockers.length,
    summary: blockers.length
      ? blockers.map((check) => `${check.label}: ${check.detail}`).join(" · ")
      : warnings.length
        ? warnings.map((check) => `${check.label}: ${check.detail}`).join(" · ")
        : "활성화 전 점검 통과",
    checks
  };
}

function renderAutomationMessage(trigger, context = {}) {
  const timestamp = new Date().toISOString();
  return String(trigger.message || "")
    .replace(/\{\{file\}\}/g, context.file || "")
    .replace(/\{\{path\}\}/g, context.file || "")
    .replace(/\{\{event\}\}/g, context.event || "")
    .replace(/\{\{timestamp\}\}/g, timestamp)
    .trim();
}

async function buildAutomationTriggerPreview(trigger, context = {}) {
  if (!trigger?.id) throw new Error("트리거 ID가 없습니다");
  const event = context.event || (context.manual ? "manual" : trigger.type === "schedule" ? "schedule" : "change");
  const message = renderAutomationMessage(trigger, { ...context, event });
  if (!message) throw new Error("실행할 메시지가 없습니다");
  const preview = {
    id: trigger.id,
    title: trigger.title || trigger.id,
    type: trigger.type,
    enabled: trigger.enabled === true,
    event,
    manual: context.manual === true,
    message,
    schedule: trigger.type === "schedule" ? {
      kind: trigger.schedule?.kind || "daily",
      time: trigger.schedule?.time || "09:00",
      everyMinutes: Number(trigger.schedule?.everyMinutes || 0)
    } : null,
    watch: trigger.type === "folder_watch" ? {
      folder: trigger.watch?.folder || "00_Inbox",
      patterns: Array.isArray(trigger.watch?.patterns) ? trigger.watch.patterns : ["*.md"],
      debounceSeconds: Number(trigger.watch?.debounceSeconds || 20)
    } : null,
    nextRunAt: trigger.nextRunAt || "",
    lastRunAt: trigger.lastRunAt || "",
    wouldRun: trigger.enabled === true || context.manual === true,
    dryRun: true
  };
  if (trigger.type === "folder_watch") {
    const resolved = await resolveTriggerWatchFolder(trigger);
    preview.watchResolved = {
      ok: resolved.ok === true,
      folder: resolved.folder || preview.watch.folder,
      reason: resolved.reason || ""
    };
  }
  return preview;
}

async function executeAutomationTrigger(trigger, context = {}) {
  if (!trigger?.id) throw new Error("트리거 ID가 없습니다");
  if (!trigger.enabled && !context.manual) return { ok: false, skipped: true, reason: "비활성 트리거" };
  if (automationTriggerRuntime.running.has(trigger.id)) return { ok: false, skipped: true, reason: "이미 실행 중" };
  const message = renderAutomationMessage(trigger, context);
  if (!message) throw new Error("실행할 메시지가 없습니다");
  const startedAt = Date.now();
  const event = context.event || (context.manual ? "manual" : "schedule");
  const file = context.file || "";
  const policy = normalizeAutomationRetryPolicy(trigger.retryPolicy);
  const isAutomaticRun = context.manual !== true;
  const runAttempt = Math.max(1, Math.min(5, Number(trigger.failureCount || 0) + 1));
  automationTriggerRuntime.running.add(trigger.id);
  trigger.lastEventAt = event ? new Date().toISOString() : trigger.lastEventAt;
  try {
    const result = await runChatMessage({ message });
    const jobId = result.officeJob?.id || result.codexJob?.id || "";
    trigger.lastRunAt = new Date().toISOString();
    trigger.nextRunAt = computeAutomationNextRunAt(trigger, new Date(trigger.lastRunAt));
    trigger.failureCount = 0;
    trigger.nextRetryAt = "";
    trigger.retryContext = null;
    trigger.lastResult = {
      ok: true,
      intent: result.intent || "",
      modeLabel: result.modeLabel || "",
      jobId,
      event,
      file,
      attempt: runAttempt,
      durationMs: Date.now() - startedAt,
      ranAt: trigger.lastRunAt
    };
    appendAutomationTriggerHistory(trigger, trigger.lastResult);
    return trigger.lastResult;
  } catch (error) {
    const messageText = error instanceof Error ? error.message : String(error);
    trigger.lastRunAt = new Date().toISOString();
    trigger.nextRunAt = computeAutomationNextRunAt(trigger, new Date(trigger.lastRunAt));
    trigger.failureCount = runAttempt;
    const retryScheduledAt = isAutomaticRun && policy.enabled && trigger.enabled && trigger.failureCount < policy.maxAttempts
      ? computeAutomationRetryAt(trigger, trigger.failureCount, new Date(trigger.lastRunAt))
      : "";
    trigger.nextRetryAt = retryScheduledAt;
    trigger.retryContext = retryScheduledAt ? normalizeAutomationRetryContext({ event, file }) : null;
    trigger.lastResult = {
      ok: false,
      error: messageText,
      event,
      file,
      attempt: trigger.failureCount,
      retryScheduledAt,
      retryExhausted: !retryScheduledAt && isAutomaticRun,
      durationMs: Date.now() - startedAt,
      ranAt: trigger.lastRunAt
    };
    appendAutomationTriggerHistory(trigger, trigger.lastResult);
    recordWorkflowError("자동화 트리거", `${trigger.title}: ${messageText}${retryScheduledAt ? ` · 재시도 예약 ${retryScheduledAt}` : ""}`);
    return trigger.lastResult;
  } finally {
    automationTriggerRuntime.running.delete(trigger.id);
  }
}

async function writeAutomationTriggersConfig(config, options = {}) {
  const normalized = normalizeAutomationTriggersConfig(config);
  const configOnly = {
    triggers: normalized.triggers.map(automationTriggerConfigFields)
  };
  await writeFile(automationTriggersConfigPath, `${JSON.stringify(configOnly, null, 2)}\n`, "utf8");
  await writeAutomationTriggerState(normalized);
  if (options.syncWatchers !== false) await syncFolderWatchers(normalized);
  return normalized;
}

async function publicAutomationTrigger(trigger) {
  const running = automationTriggerRuntime.running.has(trigger.id);
  const readiness = await buildAutomationTriggerReadiness(trigger);
  let status = trigger.enabled ? "ready" : "disabled";
  let detail = trigger.enabled ? "실행 조건 대기" : "설정에서 켜면 실행됩니다.";
  let nextRunAt = trigger.nextRunAt;
  if (running) {
    status = "running";
    detail = "백그라운드 실행 중";
  } else if (trigger.enabled && readiness.blocking) {
    status = "blocked";
    detail = readiness.summary;
  } else if (trigger.enabled && trigger.nextRetryAt) {
    status = "retrying";
    detail = `실패 ${Number(trigger.failureCount || 0)}회 · ${trigger.nextRetryAt} 재시도`;
  } else if (trigger.enabled && trigger.lastResult?.ok === false && Number(trigger.failureCount || 0) >= normalizeAutomationRetryPolicy(trigger.retryPolicy).maxAttempts) {
    status = "failed";
    detail = `재시도 한도 도달 · ${trigger.lastResult.error || "실패 원인 확인 필요"}`;
  } else if (trigger.type === "schedule") {
    nextRunAt = trigger.enabled ? (trigger.nextRunAt || computeAutomationNextRunAt(trigger)) : "";
    status = trigger.enabled ? "scheduled" : "disabled";
    detail = trigger.enabled ? `${trigger.schedule.kind === "interval" ? `${trigger.schedule.everyMinutes}분 간격` : `매일 ${trigger.schedule.time}`} 실행` : detail;
  } else if (trigger.type === "folder_watch" && trigger.enabled) {
    const resolved = await resolveTriggerWatchFolder(trigger);
    status = resolved.ok ? (automationTriggerRuntime.watchers.has(trigger.id) ? "watching" : "ready") : "blocked";
    detail = resolved.ok ? `${resolved.folder} · ${trigger.watch.patterns.join(", ")}` : resolved.reason;
  }
  return {
    ...trigger,
    status,
    statusLabel: automationTriggerStatusLabel(status),
    detail,
    nextRunAt,
    running,
    readiness
  };
}

async function buildAutomationTriggersState() {
  const config = await readAutomationTriggersConfig();
  const jobSyncDirty = syncAutomationTriggerJobResults(config);
  if (jobSyncDirty) await writeAutomationTriggersConfig(config, { syncWatchers: false });
  await syncFolderWatchers(config);
  const triggers = await Promise.all(config.triggers.map(publicAutomationTrigger));
  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    summary: {
      total: triggers.length,
      enabled: triggers.filter((trigger) => trigger.enabled).length,
      running: triggers.filter((trigger) => trigger.running).length,
      retrying: triggers.filter((trigger) => trigger.status === "retrying").length,
      failed: triggers.filter((trigger) => trigger.status === "failed").length,
      readinessBlocked: triggers.filter((trigger) => trigger.readiness?.blocking).length,
      readinessWarnings: triggers.filter((trigger) => Number(trigger.readiness?.warningCount || 0) > 0).length,
      attention: triggers.filter((trigger) => ["blocked", "failed"].includes(trigger.status)).length
    },
    triggers
  };
}

async function updateAutomationTriggersConfig(input = {}) {
  const config = await readAutomationTriggersConfig();
  const action = String(input.action || "save");
  let actionResult = null;
  if (action === "list") {
    return await buildAutomationTriggersState();
  }
  if (action === "save") {
    const rawTrigger = input.trigger || input;
    const next = normalizeAutomationTrigger(rawTrigger, config.triggers.length);
    if (next.enabled && next.type === "schedule" && !next.nextRunAt) next.nextRunAt = computeAutomationNextRunAt(next);
    const ids = new Set(config.triggers.map((item) => item.id));
    const existing = config.triggers.find((item) => item.id === next.id);
    const savedTrigger = existing ? preserveAutomationRuntimeFields(existing, next, { replaceRetryPolicy: Object.prototype.hasOwnProperty.call(rawTrigger, "retryPolicy") }) : next;
    if (savedTrigger.enabled) {
      const readiness = await buildAutomationTriggerReadiness(savedTrigger);
      if (readiness.blocking) throw new Error(`활성화 점검 실패: ${readiness.summary}`);
    }
    if (ids.has(next.id)) config.triggers = config.triggers.map((item) => item.id === next.id ? { ...savedTrigger, updatedAt: new Date().toISOString() } : item);
    else config.triggers.push({ ...savedTrigger, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    await writeAutomationTriggersConfig(config);
  } else if (action === "toggle") {
    const id = String(input.id || "");
    if (input.enabled !== false) {
      const target = config.triggers.find((item) => item.id === id);
      if (!target) throw new Error("자동화 트리거를 찾을 수 없습니다");
      const readiness = await buildAutomationTriggerReadiness({ ...target, enabled: true });
      if (readiness.blocking) throw new Error(`활성화 점검 실패: ${readiness.summary}`);
    }
    config.triggers = config.triggers.map((item) => {
      if (item.id !== id) return item;
      const enabled = input.enabled !== false;
      return {
        ...item,
        enabled,
        nextRunAt: enabled && item.type === "schedule" ? (item.nextRunAt || computeAutomationNextRunAt(item)) : "",
        nextRetryAt: enabled ? item.nextRetryAt || "" : "",
        retryContext: enabled ? item.retryContext || null : null,
        updatedAt: new Date().toISOString()
      };
    });
    await writeAutomationTriggersConfig(config);
  } else if (action === "delete") {
    const id = String(input.id || "");
    config.triggers = config.triggers.filter((item) => item.id !== id);
    await writeAutomationTriggersConfig(config);
  } else if (action === "preview") {
    const id = String(input.id || "");
    const trigger = config.triggers.find((item) => item.id === id);
    if (!trigger) throw new Error("자동화 트리거를 찾을 수 없습니다");
    actionResult = {
      preview: await buildAutomationTriggerPreview(trigger, {
        manual: true,
        event: "manual",
        file: input.file || ""
      })
    };
  } else if (action === "run") {
    const id = String(input.id || "");
    const trigger = config.triggers.find((item) => item.id === id);
    if (!trigger) throw new Error("자동화 트리거를 찾을 수 없습니다");
    actionResult = { runResult: await executeAutomationTrigger(trigger, { manual: true, event: "manual" }) };
    await writeAutomationTriggersConfig(config);
  } else {
    throw new Error("Unknown automation trigger action");
  }
  const state = await buildAutomationTriggersState();
  return actionResult ? { ...state, ...actionResult } : state;
}

function scheduleFolderTrigger(triggerId, fileName, eventType, debounceSeconds = 20) {
  if (!fileName) return;
  const timerKey = `${triggerId}:${fileName}`;
  if (automationTriggerRuntime.pendingWatchTimers.has(timerKey)) clearTimeout(automationTriggerRuntime.pendingWatchTimers.get(timerKey));
  const timeout = setTimeout(async () => {
    automationTriggerRuntime.pendingWatchTimers.delete(timerKey);
    const config = await readAutomationTriggersConfig();
    const trigger = config.triggers.find((item) => item.id === triggerId);
    if (!trigger || !trigger.enabled || trigger.type !== "folder_watch") return;
    if (!matchesWatchPattern(fileName, trigger.watch.patterns)) return;
    const resolved = await resolveTriggerWatchFolder(trigger);
    if (!resolved.ok) return;
    const fullPath = path.resolve(resolved.fullPath, String(fileName));
    if (!(fullPath === resolved.fullPath || fullPath.startsWith(`${resolved.fullPath}${path.sep}`))) return;
    const relPath = path.relative(resolved.vaultRoot, fullPath).replace(/\\/g, "/");
    await executeAutomationTrigger(trigger, { event: eventType || "change", file: relPath });
    await writeAutomationTriggersConfig(config);
  }, Math.max(5, Math.min(300, Number(debounceSeconds) || 20)) * 1000);
  automationTriggerRuntime.pendingWatchTimers.set(timerKey, timeout);
}

async function syncFolderWatchers(config = null) {
  const nextConfig = config || await readAutomationTriggersConfig();
  const activeIds = new Set();
  for (const trigger of nextConfig.triggers) {
    if (!trigger.enabled || trigger.type !== "folder_watch") continue;
    const resolved = await resolveTriggerWatchFolder(trigger);
    if (!resolved.ok) continue;
    activeIds.add(trigger.id);
    const current = automationTriggerRuntime.watchers.get(trigger.id);
    if (current?.path === resolved.fullPath) continue;
    if (current?.watcher) current.watcher.close();
    try {
      const watcher = watch(resolved.fullPath, { persistent: false }, (eventType, fileName) => {
        if (!fileName) return;
        scheduleFolderTrigger(trigger.id, String(fileName), eventType, trigger.watch.debounceSeconds);
      });
      automationTriggerRuntime.watchers.set(trigger.id, { watcher, path: resolved.fullPath });
    } catch (error) {
      recordWorkflowError("폴더 감시", error instanceof Error ? error.message : String(error));
    }
  }
  for (const [id, current] of automationTriggerRuntime.watchers.entries()) {
    if (activeIds.has(id)) continue;
    current.watcher.close();
    automationTriggerRuntime.watchers.delete(id);
  }
}

async function tickAutomationTriggers() {
  const config = await readAutomationTriggersConfig();
  const now = new Date();
  let dirty = false;
  for (const trigger of config.triggers) {
    if (!trigger.enabled) continue;
    if (trigger.nextRetryAt && new Date(trigger.nextRetryAt).getTime() <= now.getTime()) {
      const retryContext = normalizeAutomationRetryContext(trigger.retryContext) || { event: trigger.type === "folder_watch" ? "change" : "schedule", file: trigger.lastResult?.file || "" };
      await executeAutomationTrigger(trigger, { ...retryContext, retry: true });
      dirty = true;
      continue;
    }
    if (trigger.type !== "schedule") continue;
    const nextRunAt = trigger.nextRunAt || computeAutomationNextRunAt(trigger, now);
    if (!trigger.nextRunAt) {
      trigger.nextRunAt = nextRunAt;
      dirty = true;
    }
    if (!nextRunAt || new Date(nextRunAt).getTime() > now.getTime()) continue;
    await executeAutomationTrigger(trigger, { event: "schedule" });
    dirty = true;
  }
  if (dirty) await writeAutomationTriggersConfig(config);
}

function startAutomationTriggerRuntime() {
  if (automationTriggerRuntime.initialized) return;
  automationTriggerRuntime.initialized = true;
  syncFolderWatchers().catch((error) => recordWorkflowError("폴더 감시 시작", error instanceof Error ? error.message : String(error)));
  automationTriggerRuntime.schedulerTimer = setInterval(() => {
    tickAutomationTriggers().catch((error) => recordWorkflowError("예약 트리거", error instanceof Error ? error.message : String(error)));
  }, 30000);
  setTimeout(() => {
    tickAutomationTriggers().catch((error) => recordWorkflowError("예약 트리거 초기 확인", error instanceof Error ? error.message : String(error)));
  }, 1500);
}

async function readJsonBody(request) {
  const chunks = [];
  let total = 0;
  for await (const chunk of request) {
    total += chunk.length;
    if (total > maxBodyBytes) throw new Error("Request body too large");
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function serveFile(response, root, requestPath) {
  const filePath = resolveInside(root, requestPath);
  if (!filePath) return sendText(response, 403, "Forbidden");
  const details = await stat(filePath).catch(() => null);
  if (!details || !details.isFile()) return sendText(response, 404, "Not found");
  response.writeHead(200, { "content-type": mimeTypes.get(path.extname(filePath).toLowerCase()) || "application/octet-stream", "cache-control": "no-store" });
  createReadStream(filePath).pipe(response);
}

async function serveAssetFile(response, requestPath) {
  const localAssetsRoot = path.join(webRoot, "assets");
  const localAssetPath = resolveInside(localAssetsRoot, requestPath);
  const localAsset = localAssetPath ? await stat(localAssetPath).catch(() => null) : null;
  if (localAsset?.isFile()) {
    response.writeHead(200, { "content-type": mimeTypes.get(path.extname(localAssetPath).toLowerCase()) || "application/octet-stream", "cache-control": "no-store" });
    createReadStream(localAssetPath).pipe(response);
    return;
  }
  return await serveFile(response, assetsRoot, requestPath);
}

const server = createServer(async (request, response) => {
  try {
    applyLocalCorsHeaders(request, response);
    if (!request.url) return sendText(response, 400, "Bad request");
    if (request.method === "OPTIONS") {
      response.writeHead(204, { "cache-control": "no-store" });
      response.end();
      return;
    }
    const url = new URL(request.url, `http://${request.headers.host || "127.0.0.1"}`);
    if (request.method === "GET" && url.pathname === "/api/health") return sendJson(response, 200, { ok: true });
    if (request.method === "GET" && url.pathname === "/api/office-state") return sendJson(response, 200, await buildOfficeState());
    if (request.method === "GET" && url.pathname === "/api/task-queue") return sendJson(response, 200, buildTaskQueueState(Math.max(1, Math.min(50, Number(url.searchParams.get("limit") || 20)))));
    if (request.method === "POST" && url.pathname === "/api/task-queue") {
      const body = await readJsonBody(request);
      try {
        return sendJson(response, 200, await updateTaskQueue(body));
      } catch (error) {
        return sendJson(response, 400, { ok: false, error: error instanceof Error ? error.message : String(error) });
      }
    }
    if (request.method === "GET" && url.pathname === "/api/context-profile") {
      const limit = Math.max(1, Math.min(8, Number(url.searchParams.get("limit") || 4)));
      const context = await buildPersonalContext(String(url.searchParams.get("q") || ""), { limit });
      return sendJson(response, 200, { ok: true, context: publicContextSummary(context) });
    }
    if (request.method === "GET" && url.pathname === "/api/profile") return sendJson(response, 200, await buildProfileState());
    if (request.method === "PUT" && url.pathname === "/api/profile") {
      const body = await readJsonBody(request);
      try {
        return sendJson(response, 200, await updateProfileState(body));
      } catch (error) {
        return sendJson(response, 400, { ok: false, error: error instanceof Error ? error.message : String(error) });
      }
    }
    if (request.method === "GET" && url.pathname === "/api/memory") return sendJson(response, 200, await buildMemoryState());
    if ((request.method === "POST" || request.method === "PUT") && url.pathname === "/api/memory") {
      const body = await readJsonBody(request);
      try {
        return sendJson(response, 200, await updateMemoryState(body));
      } catch (error) {
        return sendJson(response, 400, { ok: false, error: error instanceof Error ? error.message : String(error) });
      }
    }
    if (request.method === "GET" && url.pathname === "/api/performance-log") return sendJson(response, 200, buildPerformanceLogState(Math.max(1, Math.min(80, Number(url.searchParams.get("limit") || 20)))));
    if (request.method === "POST" && url.pathname === "/api/performance-economics") {
      const body = await readJsonBody(request);
      try {
        return sendJson(response, 200, updatePerformanceEconomics(body));
      } catch (error) {
        return sendJson(response, 400, { ok: false, error: error instanceof Error ? error.message : String(error) });
      }
    }
    if (request.method === "GET" && url.pathname === "/api/review-decisions") return sendJson(response, 200, await buildReviewDecisionsState());
    if (request.method === "POST" && url.pathname === "/api/review-decisions") {
      const body = await readJsonBody(request);
      try {
        return sendJson(response, 200, await updateReviewDecision(body));
      } catch (error) {
        return sendJson(response, 400, { ok: false, error: error instanceof Error ? error.message : String(error) });
      }
    }
    if (request.method === "GET" && url.pathname === "/api/skills-state") return sendJson(response, 200, await buildSkillsState());
    if (request.method === "POST" && url.pathname === "/api/skills-state") {
      const body = await readJsonBody(request);
      try {
        return sendJson(response, 200, await updateSkillsConfig(body));
      } catch (error) {
        return sendJson(response, 400, { ok: false, error: error instanceof Error ? error.message : String(error) });
      }
    }
    if (request.method === "GET" && url.pathname === "/api/skill-candidates") return sendJson(response, 200, await buildSkillCandidatesState());
    if (request.method === "POST" && url.pathname === "/api/skill-candidates") {
      const body = await readJsonBody(request);
      try {
        return sendJson(response, 200, await updateSkillCandidate(body));
      } catch (error) {
        return sendJson(response, 400, { ok: false, error: error instanceof Error ? error.message : String(error) });
      }
    }
    if (request.method === "GET" && url.pathname === "/api/connections") return sendJson(response, 200, await buildConnectionsState());
    if (request.method === "POST" && url.pathname === "/api/connections") {
      const body = await readJsonBody(request);
      try {
        return sendJson(response, 200, await updateConnectionsConfig(body));
      } catch (error) {
        return sendJson(response, 400, { ok: false, error: error instanceof Error ? error.message : String(error) });
      }
    }
    if (request.method === "POST" && url.pathname === "/api/research-probes") {
      const body = await readJsonBody(request);
      return sendJson(response, 200, await buildResearchProbeState(body));
    }
    if (request.method === "GET" && url.pathname === "/api/automation-rules") return sendJson(response, 200, { ok: true, rules: publicAutomationRules(), defaults: defaultAutomationRules });
    if (request.method === "POST" && url.pathname === "/api/automation-rules") {
      const body = await readJsonBody(request);
      return sendJson(response, 200, { ok: true, rules: updateAutomationRules(body.rules || body) });
    }
    if (request.method === "GET" && url.pathname === "/api/automation-triggers") return sendJson(response, 200, await buildAutomationTriggersState());
    if (request.method === "POST" && url.pathname === "/api/automation-triggers") {
      const body = await readJsonBody(request);
      try {
        return sendJson(response, 200, await updateAutomationTriggersConfig(body));
      } catch (error) {
        return sendJson(response, 400, { ok: false, error: error instanceof Error ? error.message : String(error) });
      }
    }
    if (request.method === "GET" && url.pathname === "/api/scheduler") {
      const state = await buildAutomationTriggersState();
      return sendJson(response, 200, { ...state, scheduler: { enabled: true, tickMs: 30000, running: Boolean(automationTriggerRuntime.schedulerTimer) } });
    }
    if (request.method === "POST" && url.pathname === "/api/scheduler") {
      const body = await readJsonBody(request);
      try {
        const state = await updateAutomationTriggersConfig(body);
        return sendJson(response, 200, { ...state, scheduler: { enabled: true, tickMs: 30000, running: Boolean(automationTriggerRuntime.schedulerTimer) } });
      } catch (error) {
        return sendJson(response, 400, { ok: false, error: error instanceof Error ? error.message : String(error) });
      }
    }
    if (request.method === "GET" && url.pathname === "/api/recent-reports") return sendJson(response, 200, await listRecentReports(Math.max(1, Math.min(30, Number(url.searchParams.get("limit") || 12)))));
    if (request.method === "GET" && url.pathname === "/api/vault-overview") return sendJson(response, 200, await buildVaultOverview(Math.max(1, Math.min(30, Number(url.searchParams.get("limit") || 12)))));
    if (request.method === "GET" && url.pathname === "/api/rag/exclusions") return sendJson(response, 200, await buildRagExclusionsState(Math.max(1, Math.min(100, Number(url.searchParams.get("limit") || 30)))));
    if (request.method === "POST" && url.pathname === "/api/rag/exclusions") {
      const body = await readJsonBody(request);
      try {
        return sendJson(response, 200, await updateRagExclusionState(body));
      } catch (error) {
        return sendJson(response, 400, { ok: false, error: error instanceof Error ? error.message : String(error) });
      }
    }
    if (request.method === "GET" && url.pathname === "/api/rag") return sendJson(response, 200, await buildRagApiState());
    if (request.method === "POST" && url.pathname === "/api/rag") {
      const body = await readJsonBody(request);
      try {
        const embeddings = body.embeddings !== false && url.searchParams.get("embeddings") !== "0";
        const result = await buildRagIndex({ force: body.force === true || url.searchParams.get("force") === "1", embeddings });
        return sendJson(response, 200, { ok: result.ok !== false, connected: result.connected !== false, stats: result.stats || result.index?.stats || {}, embedding: result.embedding || result.index?.embedding || {}, status: await buildRagStatus() });
      } catch (error) {
        return sendJson(response, 500, { ok: false, error: error instanceof Error ? error.message : String(error) });
      }
    }
    if (request.method === "POST" && url.pathname === "/api/rag/index") {
      const body = await readJsonBody(request);
      try {
        const embeddings = body.embeddings !== false && url.searchParams.get("embeddings") !== "0";
        const result = await buildRagIndex({ force: body.force === true || url.searchParams.get("force") === "1", embeddings });
        return sendJson(response, 200, { ok: result.ok !== false, connected: result.connected !== false, stats: result.stats || result.index?.stats || {}, embedding: result.embedding || result.index?.embedding || {}, status: await buildRagStatus() });
      } catch (error) {
        return sendJson(response, 500, { ok: false, error: error instanceof Error ? error.message : String(error) });
      }
    }
    if (request.method === "GET" && url.pathname === "/api/rag/search") {
      const k = Math.max(1, Math.min(20, Number(url.searchParams.get("k") || 6)));
      return sendJson(response, 200, publicRagSearchResponse(await searchRagIndex(String(url.searchParams.get("q") || ""), k)));
    }
    if (request.method === "GET" && url.pathname === "/api/vault-search") return sendJson(response, 200, { ok: true, ...(await searchVaultMarkdown(String(url.searchParams.get("q") || ""), 6)) });
    if (request.method === "POST" && url.pathname === "/api/vault-export") {
      const body = await readJsonBody(request);
      try {
        return sendJson(response, 200, await exportVaultDocument(body));
      } catch (error) {
        return sendJson(response, 400, { ok: false, error: error instanceof Error ? error.message : String(error) });
      }
    }
    if (request.method === "GET" && url.pathname === "/api/chat-sessions") return sendJson(response, 200, await buildChatSessionsState({ id: url.searchParams.get("id") || "" }));
    if (request.method === "POST" && url.pathname === "/api/chat-sessions") {
      const body = await readJsonBody(request);
      try {
        return sendJson(response, 200, await updateChatSessionsState(body));
      } catch (error) {
        return sendJson(response, 400, { ok: false, error: error instanceof Error ? error.message : String(error) });
      }
    }
    if (request.method === "POST" && url.pathname === "/api/chat") {
      const body = await readJsonBody(request);
      const message = String(body.message || "").trim();
      if (!message) return sendJson(response, 400, { ok: false, error: "메시지가 필요합니다" });
      return sendJson(response, 200, { ok: true, ...(await runChatMessage({ message, sessionId: body.sessionId || "" })) });
    }
    if (request.method === "POST" && url.pathname === "/api/run-office-task") {
      const body = await readJsonBody(request);
      const task = String(body.task || "").trim();
      if (!task) return sendJson(response, 400, { ok: false, error: "업무 내용이 필요합니다" });
      return sendJson(response, 200, { ok: true, ...(await runOfficeTask(task)) });
    }
    if (request.method === "GET" && url.pathname === "/api/codex-job") {
      const job = codexJobs.get(String(url.searchParams.get("id") || ""));
      if (!job) return sendJson(response, 404, { ok: false, error: "코덱스 작업을 찾을 수 없습니다" });
      return sendJson(response, 200, { ok: true, job: publicCodexJob(job) });
    }
    if (request.method === "GET" && url.pathname === "/api/orchestration-job") {
      const job = orchestrationJobs.get(String(url.searchParams.get("id") || ""));
      if (!job) return sendJson(response, 404, { ok: false, error: "요미 직원 실행 작업을 찾을 수 없습니다" });
      return sendJson(response, 200, { ok: true, job: publicOrchestrationJob(job) });
    }
    if (request.method === "POST" && url.pathname === "/api/orchestration-job/answer") {
      const body = await readJsonBody(request);
      try {
        return sendJson(response, 200, { ok: true, job: publicOrchestrationJob(answerOrchestrationQuestion(body)) });
      } catch (error) {
        return sendJson(response, 400, { ok: false, error: error instanceof Error ? error.message : String(error) });
      }
    }
    if (!request.method || !["GET", "HEAD"].includes(request.method)) return sendText(response, 405, "Method not allowed");
    if (url.pathname.startsWith("/assets/")) return await serveAssetFile(response, url.pathname.slice("/assets/".length));
    return await serveFile(response, webRoot, url.pathname === "/" ? "/index.html" : url.pathname);
  } catch (error) {
    return sendJson(response, 500, { ok: false, error: error instanceof Error ? error.message : String(error) });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`YOMI Office: http://127.0.0.1:${port}`);
  console.log(`저장소: ${path.resolve(explicitVaultPath)}`);
  startAutomationTriggerRuntime();
});
