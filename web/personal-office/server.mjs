import { spawn, spawnSync } from "node:child_process";
import { createReadStream, existsSync, readFileSync } from "node:fs";
import { access, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
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
const styleProfilePath = path.join(webRoot, "style-profile.json");

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
const primaryReportFolder = "YOMI AI";
const legacyReportFolder = "Web Office";
const reportFolderNames = [primaryReportFolder, legacyReportFolder];

const specialistRoles = [
  { id: "ceo", name: "요미", role: "총괄 매니저", work: "목표와 완료 기준을 정하고 직원 작업을 지휘합니다." },
  { id: "secretary", name: "나래", role: "운영 비서", work: "업무 티켓, 체크리스트, 검토 기준을 챙깁니다." },
  { id: "youtube", name: "유진", role: "영상 기획", work: "영상 훅, 제목, 구성을 설계합니다." },
  { id: "instagram", name: "리아", role: "SNS 운영", work: "SNS 캡션, 해시태그, 재활용 포맷을 만듭니다." },
  { id: "designer", name: "이안", role: "디자인", work: "화면 구조와 정보 위계를 점검합니다." },
  { id: "developer", name: "태오", role: "개발", work: "파일, API, 자동화, 검증을 맡습니다." },
  { id: "business", name: "도윤", role: "전략", work: "우선순위, KPI, 실행 효과를 판단합니다." },
  { id: "editor", name: "하루", role: "편집", work: "리듬, 압축, 강조 지점을 잡습니다." },
  { id: "writer", name: "문채", role: "문서", work: "보고서, 카피, 문장 구조를 완성합니다." },
  { id: "researcher", name: "서아", role: "리서치", work: "근거, 사례, 리스크를 모읍니다." },
  { id: "archivist", name: "아카", role: "자산화", work: "Vault 저장 위치, 태그, RAG 후보를 분류합니다." }
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
  ]
};
const codexJobs = new Map();
const orchestrationJobs = new Map();
const finalJobStatuses = new Set(["completed", "completed_with_errors", "failed", "waiting_question"]);

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
    planned: "계획"
  })[status] || status || "대기";
}

function jobTimeValue(value) {
  const time = new Date(value || 0).getTime();
  return Number.isFinite(time) ? time : 0;
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  response.end(JSON.stringify(payload, null, 2));
}

function sendText(response, statusCode, message) {
  response.writeHead(statusCode, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" });
  response.end(message);
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

function defaultConnectionsConfig() {
  return {
    connections: [
      { id: "codex_cli", name: "Codex CLI", kind: "model", provider: "codex", enabled: true, envKeys: ["YOMI_AI_CODEX_COMMAND"], notes: "기존 codex-cli 인증 상태를 사용합니다." },
      { id: "claude_cli", name: "Claude Code CLI", kind: "model", provider: "claude-code", enabled: true, envKeys: ["YOMI_AI_CLAUDE_COMMAND", "YOMI_AI_CLAUDE_MODEL"], safeMode: true, allowedActions: ["manual_chat", "plan"], blockedActions: ["auto_route", "file_write", "git_write", "external_send"], notes: "/cc 또는 /claude로 명시 호출할 때만 사용합니다." },
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

function commandExists(command) {
  const name = String(command || "").trim();
  if (!name) return false;
  if (commandAvailabilityCache.has(name)) return commandAvailabilityCache.get(name);
  const result = process.platform === "win32"
    ? spawnSync("where.exe", [name], { stdio: "ignore" })
    : spawnSync("sh", ["-lc", `command -v ${JSON.stringify(name)}`], { stdio: "ignore" });
  const ok = result.status === 0;
  commandAvailabilityCache.set(name, ok);
  return ok;
}

function installCommandName(install) {
  return String(install || "").trim().split(/\s+/)[0] || "";
}

function connectionStatusMeta(status) {
  return {
    normal: { label: "정상", tone: "ok" },
    key_required: { label: "키 필요", tone: "warn" },
    disconnected: { label: "미연결", tone: "bad" },
    disabled: { label: "비활성", tone: "muted" }
  }[status] || { label: "확인 필요", tone: "warn" };
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
      status = command ? "normal" : "disconnected";
      detail = command ? `명령: ${command}` : "codex-cli 명령을 찾지 못했습니다.";
    } else if (connection.id === "claude_cli") {
      const command = claudeCommand();
      status = command ? "normal" : "disconnected";
      detail = command ? `명령: ${command} · /cc, /claude 수동호출 전용` : "claude 명령을 찾지 못했습니다.";
    } else if (connection.kind === "mcp" && connection.install) {
      const command = installCommandName(connection.install);
      status = commandExists(command) ? "normal" : "disconnected";
      detail = status === "normal"
        ? `MCP 등록됨: ${connection.mcpServer || connection.provider}`
        : `${command} 명령이 필요합니다. 설치 명령: ${connection.install}`;
    } else if (requiresEnv && connection.envKeys.length && envState.some((item) => !item.present)) {
      status = "key_required";
      detail = `${envState.filter((item) => !item.present).map((item) => item.name).join(", ")} 환경변수가 필요합니다.`;
    }
    const meta = connectionStatusMeta(status);
    return { ...connection, status, statusLabel: meta.label, tone: meta.tone, detail, envState };
  });
  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    secretsStored: false,
    secretPolicy: "실제 API 키/토큰은 저장하지 않습니다. 환경변수 또는 .env를 사용하고 화면에는 존재 여부만 표시합니다.",
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
  return path.basename(relPath, ".md").replace(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-?/, "").replace(/-/g, " ").trim() || "YOMI AI 보고서";
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

const graphStopWords = new Set([
  "yomi", "ai", "web", "office", "output", "outputs", "auto", "capture", "draft",
  "50", "개인", "사무실", "보고서", "작업", "최종", "진행", "정리", "요약",
  "업무", "문서", "오늘", "내일", "최근", "결과", "저장", "생성", "관리"
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

function isLowValueVaultOverviewDoc(doc) {
  const relPath = String(doc?.relPath || "");
  const title = `${doc?.title || ""} ${path.basename(relPath, ".md")}`;
  const autoGenerated = /(^|\/)50_Outputs\/(YOMI AI|Web Office)\//i.test(relPath)
    || (doc?.tags || []).some((tag) => ["auto-asset", "personal-office", "yomi-ai"].includes(normalizeGraphToken(tag)));
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

function normalizeStyleProfile(input = {}) {
  const source = input && typeof input === "object" ? input : {};
  const list = (key) => {
    const value = Array.isArray(source[key]) ? source[key] : defaultStyleProfile[key];
    return value.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 12);
  };
  return {
    label: String(source.label || defaultStyleProfile.label),
    enabled: source.enabled !== false,
    voice: list("voice"),
    format: list("format"),
    avoid: list("avoid")
  };
}

async function readStyleProfile() {
  if (!(await exists(styleProfilePath))) return normalizeStyleProfile(defaultStyleProfile);
  return normalizeStyleProfile(await readJson(styleProfilePath, defaultStyleProfile));
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
    ...profile.avoid.map((item) => `- ${item}`)
  ].join("\n");
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
  return {
    profile: context.profile ? { label: context.profile.label, enabled: context.profile.enabled } : null,
    vaultConnected: Boolean(context.vaultConnected),
    sourceCount: sources.length,
    sources: sources.map((item) => ({ title: item.title, relPath: item.relPath, displayPath: item.displayPath, score: item.score }))
  };
}

async function buildPersonalContext(query, options = {}) {
  const profile = await readStyleProfile();
  const search = await searchVaultMarkdown(query, options.limit || 4);
  const sources = (search.results || [])
    .filter((item) => !isLowValueVaultOverviewDoc(item))
    .slice(0, Math.max(0, Math.min(8, Number(options.limit || 4))));
  return {
    profile,
    vaultConnected: Boolean(search.connected),
    sources,
    promptBlock: [
      formatStyleProfilePrompt(profile),
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
      created: new Date(doc.mtimeMs).toLocaleString("ko-KR")
    })),
    categories: topEntries(categories, 12),
    tags: topEntries(tags, 16),
    graph: {
      nodes: graphDocs.map((doc) => ({ id: doc.relPath, title: doc.title, folder: doc.folder, size: degree.get(doc.relPath) || 1, tags: doc.tags.slice(0, 4) })),
      edges: graphEdges
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
    const meta = statusMeta(status);
    tools[toolId] = {
      id: toolId,
      label: toolDisplayName(toolId, toolConfig),
      type: toolConfig.type || toolId,
      provider: toolConfig.provider || "",
      mode: toolConfig.mode || "",
      mcp: toolConfig.mcp || null,
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
    agents,
    tools: Object.values(tools),
    raw: { agentSkills, agentDisabledSkills, tools: toolsConfig }
  };
}

function normalizeSkillsConfig(config = {}) {
  const agentSkills = config.agentSkills && typeof config.agentSkills === "object" ? config.agentSkills : {};
  const agentDisabledSkills = config.agentDisabledSkills && typeof config.agentDisabledSkills === "object" ? config.agentDisabledSkills : {};
  const tools = config.tools && typeof config.tools === "object" ? config.tools : {};
  return {
    ...config,
    agentSkills: Object.fromEntries(Object.entries(agentSkills).map(([agentId, skills]) => [agentId, Array.isArray(skills) ? [...skills] : []])),
    agentDisabledSkills: Object.fromEntries(Object.entries(agentDisabledSkills).map(([agentId, skills]) => [agentId, Array.isArray(skills) ? [...skills] : []])),
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
  return {
    runCount: workflowRuntime.runCount,
    agentCounts: specialistRoles.map((agent) => ({ id: agent.id, name: agent.name, role: agent.role, count: workflowRuntime.agentTaskCounts[agent.id] || 0 })),
    statusCounts: { ...workflowRuntime.statusCounts },
    recentErrors: workflowRuntime.recentErrors.slice(0, 6),
    current: workflowRuntime.current
  };
}

async function buildOfficeState() {
  const vaultRoot = await findVaultRoot();
  const styleProfile = await readStyleProfile();
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
    mode: "local-first",
    llm: await detectLocalLlm(),
    codex: { available: true, command: codexCommand() },
    claude: { available: true, command: claudeCommand(), manualOnly: true },
    workflow: publicWorkflowRuntime(),
    skills: await buildSkillsState(),
    context: {
      autoRag: true,
      styleProfile: { label: styleProfile.label, enabled: styleProfile.enabled },
      vaultContextLimit: 4
    },
    vault: { connected: Boolean(vaultRoot), path: vaultRoot },
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

function codexFailureMessage(result, label = "Codex CLI 호출") {
  const stderr = stripAnsi(result?.stderr || "");
  const error = stripAnsi(result?.error || "");
  const detail = stderr || error || `종료 코드 ${result?.exitCode ?? "unknown"}`;
  if (/auth|login|sign.?in|unauthori[sz]ed|credential/i.test(detail)) return `${label} 실패: 인증 상태를 확인해야 합니다. codex-cli 로그인 세션이 만료됐을 수 있습니다. (${detail})`;
  if (/timeout/i.test(detail)) return `${label} 실패: 응답 시간이 초과됐습니다. 작업을 더 작게 나눠 다시 시도하세요.`;
  if (/permission|sandbox|denied|access/i.test(detail)) return `${label} 실패: 권한 또는 샌드박스 제한에 걸렸습니다. (${detail})`;
  if (/ENOENT|not found/i.test(detail)) return `${label} 실패: codex-cli 실행 파일을 찾지 못했습니다. YOMI_AI_CODEX_COMMAND 설정을 확인하세요.`;
  return `${label} 실패: ${detail}`;
}

function claudeFailureMessage(result, label = "Claude Code CLI 호출") {
  const stderr = stripAnsi(result?.stderr || "");
  const error = stripAnsi(result?.error || "");
  const detail = stderr || error || `종료 코드 ${result?.exitCode ?? "unknown"}`;
  if (/auth|login|sign.?in|unauthori[sz]ed|credential|api.?key/i.test(detail)) return `${label} 실패: Claude Code 인증 상태를 확인해야 합니다. (${detail})`;
  if (/timeout/i.test(detail)) return `${label} 실패: 응답 시간이 초과됐습니다. 요청을 더 작게 나눠 다시 시도하세요.`;
  if (/permission|denied|access/i.test(detail)) return `${label} 실패: Claude Code 권한 제한에 걸렸습니다. (${detail})`;
  if (/ENOENT|not found/i.test(detail)) return `${label} 실패: claude 실행 파일을 찾지 못했습니다. YOMI_AI_CLAUDE_COMMAND 설정을 확인하세요.`;
  return `${label} 실패: ${detail}`;
}

async function runCodexPrompt(prompt, options = {}) {
  const command = codexCommand();
  const sandbox = options.sandbox || "read-only";
  const timeoutMs = Number(options.timeoutMs || codexPromptTimeoutMs);
  return await new Promise((resolve) => {
    const result = {
      ok: false,
      commandLabel: `${command} exec --sandbox ${sandbox}`,
      output: "",
      stderr: "",
      exitCode: null,
      error: ""
    };
    const child = spawn(command, ["exec", "--sandbox", sandbox, String(prompt || "")], { cwd: projectRoot, shell: false, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    const timer = setTimeout(() => {
      result.error = `timeout after ${timeoutMs}ms`;
      child.kill();
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
  const commandSpec = claudeCommandSpec();
  const timeoutMs = Number(options.timeoutMs || claudePromptTimeoutMs);
  const args = [
    "--print",
    "--output-format",
    "text",
    "--permission-mode",
    "plan",
    "--no-session-persistence",
    "--max-budget-usd",
    claudeMaxBudgetUsd
  ];
  const model = String(process.env.YOMI_AI_CLAUDE_MODEL || "").trim();
  if (model) args.push("--model", model);
  args.push(String(prompt || ""));
  return await new Promise((resolve) => {
    const result = {
      ok: false,
      commandLabel: `${commandSpec.label} --print --permission-mode plan`,
      output: "",
      stderr: "",
      exitCode: null,
      error: ""
    };
    const child = spawn(commandSpec.command, [...commandSpec.argsPrefix, ...args], { cwd: projectRoot, shell: false, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    const timer = setTimeout(() => {
      result.error = `timeout after ${timeoutMs}ms`;
      child.kill();
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

function parseJsonObject(text) {
  const source = String(text || "").trim();
  const fenced = source.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : source.slice(source.indexOf("{"), source.lastIndexOf("}") + 1);
  if (!candidate || !candidate.trim().startsWith("{")) throw new Error("Codex JSON 응답을 해석하지 못했습니다.");
  return JSON.parse(candidate);
}

async function saveReportToVault(task, report, assigned, options = {}) {
  if (!automationRules.reportSave) return { ok: false, skipped: true, reason: "자동화 규칙에서 업무 보고서 저장이 꺼져 있습니다" };
  const vaultRoot = await findVaultRoot();
  if (!vaultRoot) return { ok: false, reason: "저장소가 연결되지 않아 파일 저장은 건너뜀" };
  const now = new Date();
  const day = now.toISOString().slice(0, 10);
  const stamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const outDir = path.join(vaultRoot, "50_Outputs", primaryReportFolder, day);
  await mkdir(outDir, { recursive: true });
  const fullPath = path.join(outDir, `${stamp}-${slugify(task)}.md`);
  const relPath = path.relative(vaultRoot, fullPath).replace(/\\/g, "/");
  const tags = Array.isArray(options.tags) && options.tags.length ? options.tags : ["yomi-ai", "personal-office", "auto-asset"];
  const frontmatter = [
    "---",
    `type: ${yamlString(options.type || "yomi_ai_report")}`,
    `created: ${now.toISOString()}`,
    `task: ${yamlString(task)}`,
    `agents: [${assigned.map((agent) => yamlString(agent.id)).join(", ")}]`,
    `tags: [${tags.map(yamlString).join(", ")}]`,
    "---"
  ].join("\n");
  await writeFile(fullPath, `${frontmatter}\n\n${report}\n`, "utf8");
  return { ok: true, relPath, fullPath };
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
  if (!result.ok) throw new Error(codexFailureMessage(result, label));
  if (!result.output) throw new Error(`${label} 실패: Codex CLI가 빈 응답을 반환했습니다.`);
  return { text: result.output, commandLabel: result.commandLabel };
}

async function runClaudeText(prompt, label) {
  const result = await runClaudePrompt(prompt);
  if (!result.ok) throw new Error(claudeFailureMessage(result, label));
  if (!result.output) throw new Error(`${label} 실패: Claude Code CLI가 빈 응답을 반환했습니다.`);
  return { text: result.output, commandLabel: result.commandLabel };
}

async function runCodexWorkflowStep({ task, workflowName, step, agent, previousSteps = [], reworkNotes = "" }) {
  const previous = previousSteps.map((item, index) => `### 이전 단계 ${index + 1}: ${item.label} · ${item.agentName}\n${item.content}`).join("\n\n") || "이전 단계 없음";
  const context = await buildPersonalContext(`${task} ${workflowName} ${step.label || ""} ${agent?.role || ""}`, { limit: 4 });
  const prompt = [
    "너는 YOMI AI 개인 사무실의 직원 에이전트다.",
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
    "너는 YOMI AI의 검토자 나래다.",
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
        row.evaluations.push({ agentId: evaluator?.id || "secretary", agentName: evaluator?.name || "나래", status: evaluation.passed ? "passed" : "failed", passed: evaluation.passed, issues: evaluation.issues, summary: evaluation.summary, attempt: 1 });
        if (!evaluation.passed && Number(workflowConfig.evaluation.maxRetries || 0) > 0) {
          workflowRuntime.statusCounts.rework += 1;
          const reworked = await runCodexWorkflowStep({ task, workflowName, step, agent, previousSteps: workflowRun.steps, reworkNotes: evaluation.issues.join("; ") || evaluation.summary });
          row.content = reworked.text;
          row.status = "reworked";
          row.toolsUsed.push({ id: "codex_cli", label: "Codex CLI 재작업", detail: reworked.commandLabel });
          evaluation = await evaluateWorkflowDraft({ task, content: row.content, criteria: workflowConfig.evaluation.criteria });
          row.evaluations.push({ agentId: evaluator?.id || "secretary", agentName: evaluator?.name || "나래", status: evaluation.passed ? "passed" : "failed", passed: evaluation.passed, issues: evaluation.issues, summary: evaluation.summary, attempt: 2 });
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
    "# YOMI AI 업무 보고서",
    "",
    "## 1. 의도 해석",
    `"${task}"를 직원 인계 workflow로 접수했습니다.`,
    "",
    "## 2. 직원 간 인계 로그",
    ...workflowRun.steps.map((step, index) => `### ${index + 1}. ${step.label} · ${step.agentName}\n- 상태: ${step.status}\n${step.evaluations.length ? "- 검토: 나래 통과" : ""}\n\n${step.content}`),
    "",
    "## 3. 다음 행동",
    "- 필요한 산출물 형식을 정하고 이어서 실행합니다.",
    "- 저장 가치가 있는 결과는 Vault에 남깁니다."
  ].join("\n");
  const assessment = assessReusableOrchestration({
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
  });
  let saved = { ok: false, skipped: true, reason: assessment.reason };
  if (assessment.shouldSave) {
    saved = await saveReportToVault(task, report, assigned);
    if (saved?.ok) saved.reason = assessment.reason;
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
    job.status = "failed";
    job.error = error.message;
    job.updatedAt = new Date().toISOString();
    appendJobLog(job, `실행 실패: ${job.error}`, "taeo", "error");
    await saveCodexJobReport(job);
  });
  child.on("close", async (code) => {
    clearTimeout(timer);
    job.exitCode = code;
    job.status = code === 0 && !job.error ? "completed" : "failed";
    job.updatedAt = new Date().toISOString();
    appendJobLog(job, job.status === "completed" ? "코덱스 작업이 완료되었습니다." : `코덱스 작업이 실패했습니다. 종료 코드: ${code}`, "taeo", job.status === "completed" ? "info" : "error");
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
    "너는 YOMI AI 개인 사무실의 라우터다.",
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
  claude: "Claude 수동호출"
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
    staffing,
    goal: `${title} 작업을 직원별 산출물로 나누고 최종 보고 가능한 형태로 정리한다.`,
    completionCriteria: criteriaForWorkType(workType),
    deliverables: deliverablesForWorkType(workType),
    constraints: [
      "사소한 일은 핵심 담당자만 처리하고, 중요한 일만 관련 직원을 확장 투입한다.",
      "직원은 자기 역할에 맞는 서브태스크만 맡는다.",
      "확실한 것은 계획까지 자동으로 만들고, 애매하거나 위험한 것은 사용자에게 질문한다."
    ],
    savePolicy: {
      target: "Vault/50_Outputs/YOMI AI/YYYY-MM-DD",
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
    humanLoopRules
  };
}

function createYomiAssignmentPlan(capsule) {
  const templates = selectSubtaskTemplates(capsule.workType, capsule.staffing || { level: "standard", maxAgents: 2 });
  const subtasks = templates.map((item, index) => {
    const [agentId, label, objective, output] = item;
    const agent = resolveAgent(agentId) || { id: agentId, name: agentId, role: "" };
    const parallelGroup = templates.length <= 2 ? 0 : index <= 1 ? 0 : index === templates.length - 1 ? 2 : 1;
    return {
      id: `subtask-${index + 1}`,
      agentId: agent.id,
      agentName: agent.name,
      role: agent.role,
      label,
      objective,
      expectedOutput: output,
      status: "planned",
      parallelGroup,
      retryPolicy: "2단계 실행 엔진에서 실패 시 1회 재시도",
      allowedSkills: agentSkillHints[agent.id] || []
    };
  });
  return {
    mode: "plan_only",
    staffing: capsule.staffing,
    workerPool: "parallelGroup별 Promise.all 기반 워커 풀. quick은 1명, standard는 핵심 2명, deep은 관련 직원을 확장 실행",
    activeAgentIds: Array.from(new Set(subtasks.map((step) => step.agentId))),
    subtasks,
    questionRequired: capsule.needsQuestion,
    questionReasons: capsule.questionReasons,
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
      toolsUsed: (step.allowedSkills || []).map((skill) => ({ id: skill, label: skill })),
      content: `${step.objective}\n\n예상 산출물: ${step.expectedOutput}`
    }))
  };
}

function formatYomiPlanReply(orchestration) {
  const { capsule, plan } = orchestration;
  const questionBlock = capsule.needsQuestion
    ? ["", "## 확인 필요", ...capsule.questionReasons.map((item) => `- ${item.reason}`)].join("\n")
    : "";
  return [
    "# 요미 라우팅 결과",
    "",
    `- 분류: ${capsule.route.label}`,
    `- 작업 유형: ${capsule.workType}`,
    `- 배정 규모: ${capsule.staffing?.level || "standard"} · 최대 ${capsule.staffing?.maxAgents || plan.subtasks.length}명`,
    `- 배정 이유: ${capsule.staffing?.reason || "역할 기반 배정"}`,
    `- 목표: ${capsule.goal}`,
    `- 다음 상태: ${plan.nextAction}`,
    "",
    "## 직원 분배 계획",
    ...plan.subtasks.map((step) => `- ${step.agentName}(${step.role}): ${step.label} → ${step.expectedOutput}`),
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
    subtasks: job.subtasks,
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
  const current = subtasks.find((step) => ["running", "retrying"].includes(step.status))
    || subtasks.find((step) => step.status === "queued")
    || subtasks.find((step) => !["completed", "failed"].includes(step.status));
  return {
    type: "office",
    id: job.id,
    title: job.capsule?.normalizedTask || job.capsule?.goal || job.message || "요미 직원 실행",
    status: job.status,
    statusLabel: serverJobStatusLabel(job.status),
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    completedAt: job.completedAt || (finalJobStatuses.has(job.status) ? job.updatedAt : ""),
    detail: `${completed}/${subtasks.length || 0}명 완료 · ${job.capsule?.staffing?.level || "standard"}`,
    progress: current ? `${current.agentName || current.agentId} · ${current.label || "진행 중"} · ${serverJobStatusLabel(current.status)}` : (job.error || job.saved?.reason || ""),
    saved: job.saved || null,
    activeAgentIds: finalJobStatuses.has(job.status) ? [] : subtasks.filter((step) => ["running", "retrying", "queued"].includes(step.status)).map((step) => step.agentId).filter(Boolean),
    logs: publicJobLogs(job, 8)
  };
}

function buildTaskQueueState(limit = 20) {
  const jobs = [
    ...[...orchestrationJobs.values()].map(taskQueueOrchestrationRow),
    ...[...codexJobs.values()].map(taskQueueCodexRow)
  ]
    .sort((a, b) => jobTimeValue(b.updatedAt || b.createdAt) - jobTimeValue(a.updatedAt || a.createdAt))
    .slice(0, Math.max(1, Math.min(50, Number(limit) || 20)));
  const running = jobs.filter((job) => ["queued", "running", "retrying", "finalizing"].includes(job.status));
  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    summary: {
      total: jobs.length,
      running: running.length,
      attention: jobs.filter((job) => ["failed", "waiting_question", "completed_with_errors"].includes(job.status)).length
    },
    jobs
  };
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
    step.error ? `- 오류: ${step.error}` : "",
    "",
    step.output || "아직 산출물이 없습니다."
  ].filter(Boolean).join("\n")).join("\n\n");
}

async function runYomiSubtaskAttempt({ job, subtask, previousOutputs = [] }) {
  const agent = resolveAgent(subtask.agentId) || { name: subtask.agentName, role: subtask.role, work: "" };
  const previous = previousOutputs.length ? orchestrationOutputSummary(previousOutputs) : "이전 그룹 산출물 없음";
  const contextBlock = job.context?.promptBlock || "";
  const prompt = [
    "너는 YOMI AI 개인 사무실의 직원 에이전트다.",
    "현재 단계는 병렬 직원 실행 단계이며, 실제 파일 쓰기, Git 쓰기, 외부 전송은 하지 않는다.",
    "아래 작업캡슐과 네 역할에 맞춰 한국어 Markdown 산출물을 작성한다.",
    "사용자 톤/스타일 프로필과 자동 Vault 참조를 우선 반영하되, 직접 관련 있는 내용만 사용한다.",
    "",
    contextBlock,
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
    "",
    "## 이전 그룹 산출물",
    previous,
    "",
    "## 출력 형식",
    "### 담당 해석",
    "### 산출물",
    "### 요미에게 인계할 메모",
    "",
    "고정 안내문이 아니라 이 요청에 맞춘 실제 결과만 작성한다."
  ].join("\n");
  return await runCodexText(prompt, `${agent.name} 서브태스크`);
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
    subtask.status = "completed";
    subtask.completedAt = new Date().toISOString();
    subtask.updatedAt = subtask.completedAt;
    appendJobLog(job, `${subtask.agentName || subtask.agentId} 완료: ${subtask.label}`, subtask.agentId || "agent");
    return subtask;
  } catch (firstError) {
    subtask.status = "retrying";
    subtask.error = firstError instanceof Error ? firstError.message : String(firstError);
    subtask.updatedAt = new Date().toISOString();
    subtask.attempts = 2;
    appendJobLog(job, `${subtask.agentName || subtask.agentId} 재시도: ${subtask.error}`, subtask.agentId || "agent", "warn");
    try {
      const generated = await runYomiSubtaskAttempt({ job, subtask, previousOutputs });
      subtask.output = generated.text;
      subtask.commandLabel = generated.commandLabel;
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
  const prompt = [
    "너는 YOMI AI의 총괄 매니저 요미다.",
    "직원별 병렬 산출물을 하나의 최종 보고서로 취합한다.",
    "실패한 직원이 있으면 숨기지 말고 실패 사유와 대체 판단을 명시한다.",
    "파일 저장, Git 쓰기, 외부 전송은 하지 않는다.",
    "사용자 톤/스타일 프로필을 지키고, 자동 Vault 참조에서 직접 관련 있는 기존 자산만 녹여낸다.",
    "",
    contextBlock,
    "",
    "## 작업캡슐",
    JSON.stringify(job.capsule, null, 2),
    "",
    "## 직원 산출물",
    orchestrationOutputSummary(job.subtasks),
    "",
    "## 출력 형식",
    "# 요미 최종 보고서",
    "## 목표와 완료 기준",
    "## 직원별 핵심 산출물",
    "## 통합 결과",
    "## 리스크와 확인 필요 사항",
    "## 다음 행동"
  ].join("\n");
  try {
    const generated = await runCodexText(prompt, "요미 최종 취합");
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

function assessReusableOrchestration(job) {
  if (job.plan?.questionRequired || job.capsule?.needsQuestion) {
    return { shouldSave: false, reason: "사용자 확인이 필요한 작업이라 자동 저장하지 않았습니다." };
  }
  const reportText = String(job.report || "");
  const reportLength = reportText.trim().length;
  if (!job.report || reportLength < 320) {
    return { shouldSave: false, reason: "재사용 가능한 보고서 분량이 부족해 자동 저장하지 않았습니다." };
  }
  const completed = (job.subtasks || []).filter((step) => step.status === "completed");
  const failed = (job.subtasks || []).filter((step) => step.status === "failed");
  if (failed.length) {
    return { shouldSave: false, reason: "실패한 직원 산출물이 있어 자동 저장하지 않았습니다." };
  }
  const input = `${job.capsule?.originalInput || ""} ${job.capsule?.normalizedTask || ""}`;
  if (isTrivialAutoSaveInput(input)) {
    return { shouldSave: false, reason: "단발성 추천/잡담으로 판단해 자동 저장하지 않았습니다." };
  }
  const durableAssetKeyword = /(보고서|전략|자료|초안|문서|콘텐츠|기획안|분석|조사|자산|저장|매뉴얼|가이드|템플릿|로드맵|프로세스|정책)/i.test(input);
  const staffingLevel = job.capsule?.staffing?.level || "";
  if (
    (durableAssetKeyword && reportLength >= 520) ||
    (completed.length >= 2 && reportLength >= 720) ||
    reportLength >= 1200 ||
    (staffingLevel === "deep" && reportLength >= 640)
  ) {
    return { shouldSave: true, reason: "최종 보고서와 직원 산출물이 재사용 가치 기준을 충족했습니다." };
  }
  return { shouldSave: false, reason: "짧은 단발성 업무로 판단해 자동 저장하지 않았습니다." };
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
    orchestrationOutputSummary((job.subtasks || []).filter((step) => step.status === "completed")) || "저장할 중간 산출물이 없습니다."
  ].join("\n");
}

async function saveReusableOrchestrationAssets(job) {
  const assessment = assessReusableOrchestration(job);
  if (!assessment.shouldSave) {
    job.saved = { ok: false, skipped: true, reason: assessment.reason };
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
      type: "yomi_ai_orchestration",
      tags: ["yomi-ai", "personal-office", "auto-asset", "orchestration", workTag]
    }
  );
  if (job.saved?.ok) job.saved.reason = assessment.reason;
  return job.saved;
}

async function runOrchestrationJob(job) {
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
  job.context = job.context || await buildPersonalContext(`${job.capsule?.normalizedTask || job.message || ""} ${job.capsule?.workType || ""}`, { limit: 5 });
  appendJobLog(job, `자동 Vault 참조 ${job.context.sources.length}개와 톤 프로필을 적용했습니다.`, "archivist");
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
      const group = groups.get(groupIndex);
      setOrchestrationRuntime(job, `병렬 그룹 ${groupIndex + 1}`, "running");
      appendJobLog(job, `병렬 그룹 ${groupIndex + 1} 실행 중 · ${group.length}명`, "ceo");
      job.updatedAt = new Date().toISOString();
      const groupResults = await Promise.all(group.map((subtask) => executeOrchestrationSubtask(job, subtask, completedOutputs.slice())));
      completedOutputs.push(...groupResults);
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

function createOrchestrationJob(message, route, orchestration) {
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
    subtasks: (orchestration.plan.subtasks || []).map((step) => ({ ...step, output: "", error: "", attempts: 0 })),
    report: "",
    error: "",
    saved: { ok: false, skipped: true, reason: "완료 후 재사용 가치가 있으면 Vault 50_Outputs에 자동 저장합니다." },
    llm: { provider: "codex-cli", model: "parallel-worker-pool", used: false },
    logs: []
  };
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

async function generateCodexConversation(message) {
  const context = await buildPersonalContext(message, { limit: 4 });
  const prompt = [
    "너는 YOMI AI의 총괄 매니저 요미다.",
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
  const profile = await readStyleProfile();
  const prompt = [
    "너는 YOMI AI 개인 사무실에서 사용자가 명시적으로 호출한 Claude Code CLI다.",
    "사용자가 /cc 또는 /claude 명령을 썼을 때만 이 호출이 실행된다.",
    "한국어로 답하고, 요청한 산출물을 바로 제공한다.",
    "이 호출은 안전한 계획 모드다. 파일 수정, 삭제, Git 쓰기, 외부 전송 같은 상태 변경은 실행하지 말고 필요한 경우 확인 질문이나 제안으로만 남긴다.",
    "사용자 톤/스타일 프로필을 지킨다.",
    "",
    formatStyleProfilePrompt(profile),
    "",
    `사용자 요청: ${message}`
  ].join("\n");
  return await runClaudeText(prompt, "Claude 수동호출");
}

async function generateCodexVaultAnswer(message, sources) {
  const profile = await readStyleProfile();
  const sourceText = sources.length
    ? sources.map((item, index) => `자료 ${index + 1}\n제목: ${item.title}\n경로: ${item.displayPath || item.relPath}\n발췌: ${item.excerpt}`).join("\n\n")
    : "검색된 자료 없음";
  const prompt = [
    "너는 YOMI AI의 저장소 분석 담당이다.",
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

async function runChatMessage({ message }) {
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
        modeLabel: "Claude 수동호출",
        reply: "사용법: /cc 요청 내용 또는 /claude 요청 내용",
        sources: [],
        llm: { provider: "claude-code", model: "manual-plan", used: false }
      };
    }
    const generated = await generateClaudeConversation(route.task);
    return {
      intent: "claude",
      modeLabel: "Claude 수동호출",
      reply: generated.text,
      sources: [],
      llm: { provider: "claude-code", model: "manual-plan", used: true, commandLabel: generated.commandLabel },
      capture: { ok: false, skipped: true, reason: "Claude 수동호출 결과는 자동 저장하지 않았습니다" }
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
    const job = createOrchestrationJob(message, route, orchestration);
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
      sources: [],
      llm: { provider: "codex-cli", model: "parallel-worker-pool", used: !orchestration.plan.questionRequired }
    };
  }

  if (route.intent === "vault") {
    const search = await searchVaultMarkdown(route.task || message, 5);
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
    if (!request.url) return sendText(response, 400, "Bad request");
    const url = new URL(request.url, `http://${request.headers.host || "127.0.0.1"}`);
    if (request.method === "GET" && url.pathname === "/api/health") return sendJson(response, 200, { ok: true });
    if (request.method === "GET" && url.pathname === "/api/office-state") return sendJson(response, 200, await buildOfficeState());
    if (request.method === "GET" && url.pathname === "/api/task-queue") return sendJson(response, 200, buildTaskQueueState(Math.max(1, Math.min(50, Number(url.searchParams.get("limit") || 20)))));
    if (request.method === "GET" && url.pathname === "/api/context-profile") {
      const limit = Math.max(1, Math.min(8, Number(url.searchParams.get("limit") || 4)));
      const context = await buildPersonalContext(String(url.searchParams.get("q") || ""), { limit });
      return sendJson(response, 200, { ok: true, context: publicContextSummary(context) });
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
    if (request.method === "GET" && url.pathname === "/api/connections") return sendJson(response, 200, await buildConnectionsState());
    if (request.method === "POST" && url.pathname === "/api/connections") {
      const body = await readJsonBody(request);
      try {
        return sendJson(response, 200, await updateConnectionsConfig(body));
      } catch (error) {
        return sendJson(response, 400, { ok: false, error: error instanceof Error ? error.message : String(error) });
      }
    }
    if (request.method === "GET" && url.pathname === "/api/automation-rules") return sendJson(response, 200, { ok: true, rules: publicAutomationRules(), defaults: defaultAutomationRules });
    if (request.method === "POST" && url.pathname === "/api/automation-rules") {
      const body = await readJsonBody(request);
      return sendJson(response, 200, { ok: true, rules: updateAutomationRules(body.rules || body) });
    }
    if (request.method === "GET" && url.pathname === "/api/recent-reports") return sendJson(response, 200, await listRecentReports(Math.max(1, Math.min(30, Number(url.searchParams.get("limit") || 12)))));
    if (request.method === "GET" && url.pathname === "/api/vault-overview") return sendJson(response, 200, await buildVaultOverview(Math.max(1, Math.min(30, Number(url.searchParams.get("limit") || 12)))));
    if (request.method === "GET" && url.pathname === "/api/vault-search") return sendJson(response, 200, { ok: true, ...(await searchVaultMarkdown(String(url.searchParams.get("q") || ""), 6)) });
    if (request.method === "POST" && url.pathname === "/api/chat") {
      const body = await readJsonBody(request);
      const message = String(body.message || "").trim();
      if (!message) return sendJson(response, 400, { ok: false, error: "메시지가 필요합니다" });
      return sendJson(response, 200, { ok: true, ...(await runChatMessage({ message })) });
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
    if (!request.method || !["GET", "HEAD"].includes(request.method)) return sendText(response, 405, "Method not allowed");
    if (url.pathname.startsWith("/assets/")) return await serveAssetFile(response, url.pathname.slice("/assets/".length));
    return await serveFile(response, webRoot, url.pathname === "/" ? "/index.html" : url.pathname);
  } catch (error) {
    return sendJson(response, 500, { ok: false, error: error instanceof Error ? error.message : String(error) });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`YOMI AI: http://127.0.0.1:${port}`);
  console.log(`저장소: ${path.resolve(explicitVaultPath)}`);
});
