const apiBaseUrl = (() => {
  const params = new URLSearchParams(window.location.search);
  const explicit = params.get("apiBase") || window.localStorage.getItem("yomiApiBase") || "";
  if (explicit) return explicit.replace(/\/+$/, "");
  const localHosts = new Set(["127.0.0.1", "localhost", "::1"]);
  if (localHosts.has(window.location.hostname) && window.location.port && window.location.port !== "17331") {
    const host = window.location.hostname === "localhost" ? "127.0.0.1" : window.location.hostname;
    return `${window.location.protocol}//${host}:17331`;
  }
  return "";
})();

function apiUrl(pathValue = "") {
  const value = String(pathValue || "");
  if (/^https?:\/\//i.test(value)) return value;
  if (!value.startsWith("/api")) return value;
  return `${apiBaseUrl}${value}`;
}

function apiFetch(pathValue, options = {}) {
  return fetch(apiUrl(pathValue), options);
}

function displayApiBase() {
  return apiBaseUrl || window.location.origin;
}

const agents = [
  { id: "ceo", name: "총괄 요미", role: "총괄 매니저", roleShort: "총괄", sprite: "/assets/pixel/characters/ceo.png", spriteSheet: "/assets/pixel/characters/ceo_sheet.png", x: 50, y: 45, work: "목표와 완료 기준을 정하고 직원 작업을 지휘합니다." },
  { id: "secretary", name: "운영 나래", role: "운영 비서", roleShort: "운영", sprite: "/assets/pixel/characters/secretary.png", spriteSheet: "/assets/pixel/characters/secretary_sheet.png", x: 39, y: 51, work: "업무 티켓, 체크리스트, 검토 기준을 챙깁니다." },
  { id: "youtube", name: "영상 유진", role: "영상 기획", roleShort: "영상", sprite: "/assets/pixel/characters/youtube.png", spriteSheet: "/assets/pixel/characters/youtube_sheet.png", x: 47, y: 22, work: "영상 훅, 제목, 구성을 설계합니다." },
  { id: "instagram", name: "SNS 리아", role: "SNS 운영", roleShort: "SNS", sprite: "/assets/pixel/characters/instagram.png", spriteSheet: "/assets/pixel/characters/instagram_sheet.png", x: 57, y: 23, work: "SNS 캡션, 해시태그, 재활용 포맷을 만듭니다." },
  { id: "designer", name: "디자인 이안", role: "디자인", roleShort: "디자인", sprite: "/assets/pixel/characters/designer.png", spriteSheet: "/assets/pixel/characters/designer_sheet.png", x: 74, y: 27, work: "화면 구조와 정보 위계를 점검합니다." },
  { id: "developer", name: "개발 태오", role: "개발", roleShort: "개발", sprite: "/assets/pixel/characters/developer.png", spriteSheet: "/assets/pixel/characters/developer_sheet.png", x: 46, y: 75, work: "파일, API, 자동화, 검증을 맡습니다." },
  { id: "business", name: "전략 도윤", role: "전략", roleShort: "전략", sprite: "/assets/pixel/characters/business.png", spriteSheet: "/assets/pixel/characters/business_sheet.png", x: 80, y: 47, work: "우선순위, KPI, 실행 효과를 판단합니다." },
  { id: "editor", name: "편집 하루", role: "편집", roleShort: "편집", sprite: "/assets/pixel/characters/editor.png", spriteSheet: "/assets/pixel/characters/editor_sheet.png", x: 60, y: 74, work: "리듬, 압축, 강조 지점을 잡습니다." },
  { id: "writer", name: "문서 문채", role: "문서", roleShort: "문서", sprite: "/assets/pixel/characters/writer.png", spriteSheet: "/assets/pixel/characters/writer_sheet.png", x: 22, y: 71, work: "보고서, 카피, 문장 구조를 완성합니다." },
  { id: "researcher", name: "리서치 서아", role: "리서치", roleShort: "리서치", sprite: "/assets/pixel/characters/researcher.png", spriteSheet: "/assets/pixel/characters/researcher_sheet.png", x: 22, y: 31, work: "근거, 사례, 리스크를 모읍니다." },
  { id: "archivist", name: "자산화 아카", role: "자산화", roleShort: "Vault", sprite: "", spriteSheet: "/assets/pixel/characters/archivist_sheet.png", x: 73, y: 79, work: "Vault 저장 위치, 태그, RAG 후보를 분류합니다." }
];

const phases = [
  { title: "코어 점화", agents: ["ceo", "secretary"], text: "총괄 요미가 명령을 업무 캡슐로 바꾸고 운영 나래가 실행 순서를 엽니다." },
  { title: "근거 수집", agents: ["researcher", "business"], text: "리서치 서아와 전략 도윤이 자료, 리스크, 판단 기준을 동시에 모읍니다." },
  { title: "제작 가동", agents: ["writer", "designer", "developer"], text: "문서 문채, 디자인 이안, 개발 태오가 산출물을 만들고 구조를 맞춥니다." },
  { title: "콘텐츠 튜닝", agents: ["youtube", "instagram", "editor"], text: "영상 유진, SNS 리아, 편집 하루가 포맷과 리듬을 다듬습니다." },
  { title: "Vault 저장", agents: ["archivist", "secretary"], text: "자산화 아카가 결과를 지식 자산으로 저장하고 운영 나래가 다음 행동을 정리합니다." }
];

const nodes = {
  input: document.getElementById("officeInput"),
  runBtn: document.getElementById("runBtn"),
  resetBtn: document.getElementById("resetBtn"),
  cmdMeta: document.getElementById("cmdMeta"),
  agentLayer: document.getElementById("agentLayer"),
  stageEffects: document.getElementById("stageEffects"),
  collabLayer: document.getElementById("collabLayer"),
  officeZoneBadges: document.getElementById("officeZoneBadges"),
  officeAgentDetailPanel: document.getElementById("officeAgentDetailPanel"),
  phaseBadge: document.getElementById("phaseBadge"),
  pipeline: document.getElementById("pipeline"),
  activityLog: document.getElementById("activityLog"),
  reportText: document.getElementById("reportText"),
  saveNotice: document.getElementById("saveNotice"),
  humanLoopPanel: document.getElementById("humanLoopPanel"),
  officeCurrentStatus: document.getElementById("officeCurrentStatus"),
  officeCurrentTask: document.getElementById("officeCurrentTask"),
  officeAgentStatus: document.getElementById("officeAgentStatus"),
  officeChainStatus: document.getElementById("officeChainStatus"),
  taskQueueStatus: document.getElementById("taskQueueStatus"),
  taskQueueList: document.getElementById("taskQueueList"),
  reviewPage: document.getElementById("page-review"),
  reviewStatus: document.getElementById("reviewStatus"),
  reviewRefreshBtn: document.getElementById("reviewRefreshBtn"),
  reviewSummaryLine: document.getElementById("reviewSummaryLine"),
  reviewSectionTabs: document.getElementById("reviewSectionTabs"),
  reviewQueueCount: document.getElementById("reviewQueueCount"),
  reviewQueueMeta: document.getElementById("reviewQueueMeta"),
  reviewActiveCount: document.getElementById("reviewActiveCount"),
  reviewActiveMeta: document.getElementById("reviewActiveMeta"),
  reviewQualityScore: document.getElementById("reviewQualityScore"),
  reviewQualityMeta: document.getElementById("reviewQualityMeta"),
  reviewSkillCount: document.getElementById("reviewSkillCount"),
  reviewSkillMeta: document.getElementById("reviewSkillMeta"),
  reviewOpsStatus: document.getElementById("reviewOpsStatus"),
  reviewTrustLadder: document.getElementById("reviewTrustLadder"),
  reviewTrustLadderMeta: document.getElementById("reviewTrustLadderMeta"),
  reviewAutoCandidateCount: document.getElementById("reviewAutoCandidateCount"),
  reviewAutoCandidateMeta: document.getElementById("reviewAutoCandidateMeta"),
  reviewRevisionRate: document.getElementById("reviewRevisionRate"),
  reviewRevisionMeta: document.getElementById("reviewRevisionMeta"),
  reviewHermesFuel: document.getElementById("reviewHermesFuel"),
  reviewHermesMeta: document.getElementById("reviewHermesMeta"),
  reviewOpsRecommendation: document.getElementById("reviewOpsRecommendation"),
  reviewAttentionStatus: document.getElementById("reviewAttentionStatus"),
  reviewAttentionList: document.getElementById("reviewAttentionList"),
  reviewCompletedStatus: document.getElementById("reviewCompletedStatus"),
  reviewCompletedList: document.getElementById("reviewCompletedList"),
  reviewSkillStatus: document.getElementById("reviewSkillStatus"),
  reviewSkillList: document.getElementById("reviewSkillList"),
  reviewPortfolioStatus: document.getElementById("reviewPortfolioStatus"),
  reviewPortfolioList: document.getElementById("reviewPortfolioList"),
  reviewAutomationStatus: document.getElementById("reviewAutomationStatus"),
  reviewAutomationList: document.getElementById("reviewAutomationList"),
  reviewEditPanel: document.getElementById("reviewEditPanel"),
  reviewEditForm: document.getElementById("reviewEditForm"),
  reviewEditTarget: document.getElementById("reviewEditTarget"),
  reviewEditDraft: document.getElementById("reviewEditDraft"),
  reviewEditFinal: document.getElementById("reviewEditFinal"),
  reviewEditNote: document.getElementById("reviewEditNote"),
  reviewEditSaveBtn: document.getElementById("reviewEditSaveBtn"),
  reviewEditCancelBtn: document.getElementById("reviewEditCancelBtn"),
  reviewDetailPanel: document.getElementById("reviewDetailPanel"),
  officeSummaryStage: document.getElementById("officeSummaryStage"),
  agentList: document.getElementById("agentList"),
  agentDetailPanel: document.getElementById("agentDetailPanel"),
  agentKpiTotal: document.getElementById("agentKpiTotal"),
  agentKpiActive: document.getElementById("agentKpiActive"),
  agentKpiWork: document.getElementById("agentKpiWork"),
  agentSkillStatus: document.getElementById("agentSkillStatus"),
  vaultStats: document.getElementById("vaultStats"),
  vaultCategoryCounts: document.getElementById("vaultCategoryCounts"),
  vaultTagCounts: document.getElementById("vaultTagCounts"),
  vaultGraph: document.getElementById("vaultGraph"),
  vaultGraphMeta: document.getElementById("vaultGraphMeta"),
  vaultGraphLegend: document.getElementById("vaultGraphLegend"),
  vaultGraphDetail: document.getElementById("vaultGraphDetail"),
  recentReports: document.getElementById("recentReports"),
  portfolioStatus: document.getElementById("portfolioStatus"),
  portfolioList: document.getElementById("portfolioList"),
  quarantineStatus: document.getElementById("quarantineStatus"),
  quarantineList: document.getElementById("quarantineList"),
  vaultExportStatus: document.getElementById("vaultExportStatus"),
  refreshReportsBtn: document.getElementById("refreshReportsBtn"),
  badgeReview: document.getElementById("badgeReview"),
  badgeAutomation: document.getElementById("badgeAutomation"),
  badgeSkills: document.getElementById("badgeSkills"),
  badgeMemory: document.getElementById("badgeMemory"),
  serverStatus: document.getElementById("serverStatus"),
  aiStatus: document.getElementById("aiStatus"),
  codexStatus: document.getElementById("codexStatus"),
  claudeStatus: document.getElementById("claudeStatus"),
  styleProfileStatus: document.getElementById("styleProfileStatus"),
  styleProfileMeta: document.getElementById("styleProfileMeta"),
  profileEditStatus: document.getElementById("profileEditStatus"),
  profileForm: document.getElementById("profileForm"),
  profileLabel: document.getElementById("profileLabel"),
  profileEnabled: document.getElementById("profileEnabled"),
  profileVoice: document.getElementById("profileVoice"),
  profileFormat: document.getElementById("profileFormat"),
  profileAvoid: document.getElementById("profileAvoid"),
  profileMemory: document.getElementById("profileMemory"),
  profileUserMemory: document.getElementById("profileUserMemory"),
  autoRoutingHighCut: document.getElementById("autoRoutingHighCut"),
  autoRoutingLowCut: document.getElementById("autoRoutingLowCut"),
  autoRoutingSummary: document.getElementById("autoRoutingSummary"),
  profileReloadBtn: document.getElementById("profileReloadBtn"),
  ragStatus: document.getElementById("ragStatus"),
  ragMeta: document.getElementById("ragMeta"),
  ragIndexSummary: document.getElementById("ragIndexSummary"),
  ragIndexStats: document.getElementById("ragIndexStats"),
  ragSearchInput: document.getElementById("ragSearchInput"),
  ragSearchBtn: document.getElementById("ragSearchBtn"),
  ragSearchResults: document.getElementById("ragSearchResults"),
  ragReindexBtn: document.getElementById("ragReindexBtn"),
  ragQualityStatus: document.getElementById("ragQualityStatus"),
  ragQualityList: document.getElementById("ragQualityList"),
  ragQualityRefreshBtn: document.getElementById("ragQualityRefreshBtn"),
  vaultStatus: document.getElementById("vaultStatus"),
  vaultPath: document.getElementById("vaultPath"),
  reportCount: document.getElementById("reportCount"),
  dashboardFocusWork: document.getElementById("dashboardFocusWork"),
  dashboardFocusMeta: document.getElementById("dashboardFocusMeta"),
  dashboardTodayCount: document.getElementById("dashboardTodayCount"),
  dashboardReviewRate: document.getElementById("dashboardReviewRate"),
  dashboardTodayMeta: document.getElementById("dashboardTodayMeta"),
  dashboardPerformanceScore: document.getElementById("dashboardPerformanceScore"),
  dashboardPerformanceGrade: document.getElementById("dashboardPerformanceGrade"),
  dashboardPerformanceMeta: document.getElementById("dashboardPerformanceMeta"),
  dashboardEconomicsValue: document.getElementById("dashboardEconomicsValue"),
  dashboardEconomicsRoi: document.getElementById("dashboardEconomicsRoi"),
  dashboardEconomicsMeta: document.getElementById("dashboardEconomicsMeta"),
  dashboardAttention: document.getElementById("dashboardAttention"),
  dashboardAttentionMeta: document.getElementById("dashboardAttentionMeta"),
  dashboardActiveAgents: document.getElementById("dashboardActiveAgents"),
  dashboardRunningWork: document.getElementById("dashboardRunningWork"),
  dashboardPendingApprovals: document.getElementById("dashboardPendingApprovals"),
  dashboardRecentQuality: document.getElementById("dashboardRecentQuality"),
  dashboardReportCount: document.getElementById("dashboardReportCount"),
  dashboardCaptureCount: document.getElementById("dashboardCaptureCount"),
  dashboardCodexMode: document.getElementById("dashboardCodexMode"),
  dashboardVaultState: document.getElementById("dashboardVaultState"),
  dashboardLastReport: document.getElementById("dashboardLastReport"),
  dashboardPipelineState: document.getElementById("dashboardPipelineState"),
  dashboardWorkflowStatus: document.getElementById("dashboardWorkflowStatus"),
  dashboardWorkflowCurrent: document.getElementById("dashboardWorkflowCurrent"),
  dashboardWorkflowCounts: document.getElementById("dashboardWorkflowCounts"),
  dashboardAgentCounts: document.getElementById("dashboardAgentCounts"),
  dashboardToolStatus: document.getElementById("dashboardToolStatus"),
  mainVaultPath: document.getElementById("mainVaultPath"),
  settingsVaultPath: document.getElementById("settingsVaultPath"),
  settingsToolStatus: document.getElementById("settingsToolStatus"),
  skillStatusSummary: document.getElementById("skillStatusSummary"),
  activeSkillStatus: document.getElementById("activeSkillStatus"),
  activeSkillList: document.getElementById("activeSkillList"),
  connectionStatus: document.getElementById("connectionStatus"),
  connectionList: document.getElementById("connectionList"),
  connectionForm: document.getElementById("connectionForm"),
  connectionId: document.getElementById("connectionId"),
  connectionName: document.getElementById("connectionName"),
  connectionKind: document.getElementById("connectionKind"),
  connectionProvider: document.getElementById("connectionProvider"),
  connectionEnvKeys: document.getElementById("connectionEnvKeys"),
  connectionMcpServer: document.getElementById("connectionMcpServer"),
  connectionNotes: document.getElementById("connectionNotes"),
  connectionEnabled: document.getElementById("connectionEnabled"),
  connectionResetBtn: document.getElementById("connectionResetBtn"),
  connectionCandidates: document.getElementById("connectionCandidates"),
  automationDashboardSummary: document.getElementById("automationDashboardSummary"),
  automationTriggerSummary: document.getElementById("automationTriggerSummary"),
  automationTriggerStatus: document.getElementById("automationTriggerStatus"),
  automationTriggerList: document.getElementById("automationTriggerList"),
  automationTriggerForm: document.getElementById("automationTriggerForm"),
  automationTriggerId: document.getElementById("automationTriggerId"),
  automationTriggerTitle: document.getElementById("automationTriggerTitle"),
  automationTriggerType: document.getElementById("automationTriggerType"),
  automationTriggerTime: document.getElementById("automationTriggerTime"),
  automationTriggerFolder: document.getElementById("automationTriggerFolder"),
  automationTriggerPatterns: document.getElementById("automationTriggerPatterns"),
  automationTriggerMessage: document.getElementById("automationTriggerMessage"),
  automationTriggerEnabled: document.getElementById("automationTriggerEnabled"),
  automationTriggerChannel: document.getElementById("automationTriggerChannel"),
  automationTriggerResetBtn: document.getElementById("automationTriggerResetBtn"),
  channelStatus: document.getElementById("channelStatus"),
  channelList: document.getElementById("channelList"),
  channelSendForm: document.getElementById("channelSendForm"),
  channelSendText: document.getElementById("channelSendText"),
  channelSendBtn: document.getElementById("channelSendBtn"),
  harnessScopeList: document.getElementById("harnessScopeList"),
  braveKeyGuide: document.getElementById("braveKeyGuide"),
  braveKeyStatus: document.getElementById("braveKeyStatus"),
  apiDiagnosticStatus: document.getElementById("apiDiagnosticStatus"),
  apiDiagnosticList: document.getElementById("apiDiagnosticList"),
  apiDiagnosticBtn: document.getElementById("apiDiagnosticBtn"),
  researchProbeBtn: document.getElementById("researchProbeBtn"),
  chatThread: document.getElementById("chatThread"),
  chatForm: document.getElementById("chatForm"),
  chatInput: document.getElementById("chatInput"),
  chatQueueBtn: document.getElementById("chatQueueBtn"),
  chatSendBtn: document.getElementById("chatSendBtn"),
  chatStatus: document.getElementById("chatStatus"),
  chatResultMode: document.getElementById("chatResultMode"),
  chatResultPreview: document.getElementById("chatResultPreview"),
  chatProvider: document.getElementById("chatProvider"),
  chatMemory: document.getElementById("chatMemory"),
  chatRunMeta: document.getElementById("chatRunMeta"),
  chatSources: document.getElementById("chatSources"),
  chatSessionList: document.getElementById("chatSessionList"),
  newChatSessionBtn: document.getElementById("newChatSessionBtn"),
  skillCandidateStatus: document.getElementById("skillCandidateStatus"),
  skillCandidateList: document.getElementById("skillCandidateList")
};

let phaseTimer = null;
let officeEndTimer = null;
let officeMoveTimers = [];
let officeDashboardState = {};
let skillsState = { agents: [], tools: [] };
let connectionsState = { connections: [], candidates: [] };
let automationTriggersState = { triggers: [], summary: {} };
let channelsState = { channels: [], summary: {} };
let quarantineState = { documents: [], summary: {} };
let latestOfficeTask = "";
let skillUpdateBusy = false;
let officeJobPollTimer = null;
let activeOfficeJobId = "";
let codexJobPollTimer = null;
let activeCodexJobId = "";
let activeChatSessionId = "";
let chatSessionsState = { sessions: [] };
let skillCandidatesState = { candidates: [] };
let editingSkillCandidateId = "";
let reviewEditTarget = null;
let reviewAutomationItemsState = [];
let activeReviewSection = "skills";
let profileState = { profile: null };
let taskQueueLoadedOnce = false;
let latestTaskQueueState = { jobs: [], summary: {} };
let latestVisualAgentIds = [];
let latestVisualAgentBubbles = {};
let selectedOfficeAgentId = "";
const completedOfficeJobIds = new Set();
const completedCodexJobIds = new Set();
const agentPositions = Object.fromEntries(agents.map((agent) => [agent.id, { x: agent.x, y: agent.y }]));
const phaseMeetingSpots = [
  { ceo: { x: 50, y: 45 }, secretary: { x: 43, y: 50 } },
  { researcher: { x: 36, y: 42 }, business: { x: 43, y: 45 } },
  { writer: { x: 41, y: 63 }, designer: { x: 50, y: 60 }, developer: { x: 58, y: 63 } },
  { youtube: { x: 46, y: 34 }, instagram: { x: 54, y: 34 }, editor: { x: 61, y: 39 } },
  { archivist: { x: 70, y: 69 }, secretary: { x: 65, y: 69 } }
];
const officeZones = [
  { id: "research", label: "Research", agentIds: ["researcher", "business", "archivist"], x: 22, y: 17 },
  { id: "studio", label: "Design", agentIds: ["youtube", "instagram", "designer"], x: 65, y: 16 },
  { id: "build", label: "Build", agentIds: ["developer", "writer", "editor"], x: 43, y: 89 },
  { id: "ops", label: "Ops", agentIds: ["ceo", "secretary"], x: 50, y: 37 }
];
const officeRunningStatuses = new Set(["queued", "running", "retrying", "finalizing"]);
const officeAttentionStatuses = new Set(["failed", "completed_with_errors", "waiting_question"]);
const agentActionCopy = {
  ceo: { move: "목표 분해", work: "지휘 중" },
  secretary: { move: "체크리스트", work: "순서 정리" },
  youtube: { move: "훅 설계", work: "영상 기획" },
  instagram: { move: "캡션 정리", work: "SNS 포맷" },
  designer: { move: "보드 확인", work: "화면 구조" },
  developer: { move: "구현 점검", work: "코드 검증" },
  business: { move: "지표 판단", work: "우선순위" },
  editor: { move: "컷 조율", work: "리듬 편집" },
  writer: { move: "문장 구성", work: "초안 작성" },
  researcher: { move: "근거 수집", work: "자료 확인" },
  archivist: { move: "Vault 분류", work: "자산화" }
};

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
}

function nowTime() {
  return new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

function providerLabel(provider = "") {
  if (provider === "codex-cli") return "Codex CLI";
  if (provider === "claude-code") return "Claude Code";
  if (provider === "yomi-router") return "요미 라우터";
  return "기본 응답";
}

function cleanDisplayPath(value) {
  return String(value || "").replace(/^50_Outputs\/Web Office\//, "50_Outputs/기존 업무 보고서/");
}

function switchPage(page, options = {}) {
  const focus = String(options.focus || "");
  document.querySelectorAll(".app-tab").forEach((tab) => {
    const tabFocus = String(tab.dataset.focus || "");
    const active = tab.dataset.page === page && (focus ? tabFocus === focus : !tabFocus);
    tab.classList.toggle("active", active);
    if (active) tab.setAttribute("aria-current", "page");
    else tab.removeAttribute("aria-current");
  });
  document.querySelectorAll(".page").forEach((section) => {
    const active = section.dataset.page === page;
    section.classList.toggle("active", active);
    section.hidden = !active;
    section.setAttribute("aria-hidden", active ? "false" : "true");
  });
  const scrollTarget = options.scrollTarget ? document.getElementById(options.scrollTarget) : null;
  if (scrollTarget) window.setTimeout(() => scrollTarget.scrollIntoView({ block: "start", behavior: "smooth" }), 80);
}

function addLog(text, agentId = "ceo", type = "") {
  const agent = agents.find((item) => item.id === agentId) || agents[0];
  const row = document.createElement("div");
  row.className = `log-row ${type}`;
  row.innerHTML = `<strong>${escapeHtml(agent.name)}</strong><span>${escapeHtml(nowTime())}</span><p>${escapeHtml(text)}</p>`;
  nodes.activityLog?.prepend(row);
}

function renderOfficeAgentStatus(activeIds = [], statusMap = {}) {
  if (!nodes.officeAgentStatus) return;
  const active = new Set(activeIds);
  const rows = agents.filter((agent) => {
    const status = statusMap[agent.id] || {};
    return active.has(agent.id) || ["running", "retrying", "queued", "planned"].includes(status.status);
  });
  if (!rows.length) {
    nodes.officeAgentStatus.innerHTML = '<div class="office-agent-empty">진행 중인 직원이 없습니다.</div>';
    return;
  }
  nodes.officeAgentStatus.innerHTML = rows.map((agent) => {
    const status = statusMap[agent.id] || {};
    const statusText = status.label || status.status || "진행 중";
    return `<div class="office-agent-row active"><strong>${escapeHtml(agent.name)}</strong><span>${escapeHtml(status.detail || agent.role)}</span><b>${escapeHtml(statusText)}</b></div>`;
  }).join("");
}

function setOfficeProgress({ status = "대기 중", task = "", chainStatus = "", detail = "" } = {}) {
  if (nodes.officeCurrentStatus) nodes.officeCurrentStatus.textContent = status;
  if (nodes.officeCurrentTask) nodes.officeCurrentTask.textContent = task || latestOfficeTask || "대화 탭에서 업무를 지시하면 이곳에 진행 상태가 표시됩니다.";
  if (nodes.officeChainStatus && chainStatus) nodes.officeChainStatus.textContent = chainStatus;
  if (detail && nodes.reportText) nodes.reportText.textContent = detail;
}

function clearOfficeMoveTimers() {
  officeMoveTimers.forEach((timer) => clearTimeout(timer));
  officeMoveTimers = [];
}

function scheduleOfficeMove(callback, delay = 0) {
  const timer = setTimeout(() => {
    officeMoveTimers = officeMoveTimers.filter((item) => item !== timer);
    callback();
  }, delay);
  officeMoveTimers.push(timer);
}

function agentHome(agentId) {
  const agent = agents.find((item) => item.id === agentId);
  return agent ? { x: agent.x, y: agent.y } : { x: 50, y: 50 };
}

function getAgentElement(agentId) {
  return nodes.agentLayer?.querySelector(`[data-agent-id="${agentId}"]`) || null;
}

function setAgentBubble(agentId, text = "") {
  const el = getAgentElement(agentId);
  if (!el) return;
  let bubble = el.querySelector("em");
  if (!text) {
    bubble?.remove();
    return;
  }
  if (!bubble) {
    bubble = document.createElement("em");
    el.append(bubble);
  }
  bubble.textContent = text;
}

function agentActionBubble(agentId, mode = "work", fallback = "") {
  return agentActionCopy[agentId]?.[mode] || agentActionCopy[agentId]?.work || fallback;
}

function clearCollaborationCue() {
  if (nodes.collabLayer) nodes.collabLayer.innerHTML = "";
}

function renderCollaborationCue(phaseIndex, phase) {
  if (!nodes.collabLayer || !phase?.agents?.length) return;
  const spots = phaseMeetingSpots[phaseIndex] || {};
  const activeIds = phase.agents.filter((id) => agents.some((agent) => agent.id === id));
  if (!activeIds.length) {
    clearCollaborationCue();
    return;
  }

  const targetPoints = activeIds.map((id) => spots[id] || agentPositions[id] || agentHome(id));
  const center = targetPoints.reduce(
    (sum, point) => ({ x: sum.x + point.x / targetPoints.length, y: sum.y + point.y / targetPoints.length }),
    { x: 0, y: 0 }
  );
  const safeX = Math.max(12, Math.min(88, center.x));
  const safeY = Math.max(14, Math.min(86, center.y));
  const team = activeIds
    .map((id) => agents.find((agent) => agent.id === id)?.name || id)
    .join(" + ");
  const lines = activeIds.map((id) => {
    const from = agentPositions[id] || agentHome(id);
    const to = spots[id] || center;
    return `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" />`;
  }).join("");
  const dots = targetPoints.map((point) => `<circle cx="${point.x}" cy="${point.y}" r="1.05" />`).join("");

  nodes.collabLayer.innerHTML = `
    <svg class="collab-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <g class="collab-links">${lines}</g>
      <g class="collab-dots"><circle cx="${center.x}" cy="${center.y}" r="2.4" />${dots}</g>
    </svg>
    <div class="collab-hotspot" style="left:${safeX}%;top:${safeY}%">
      <strong>${escapeHtml(phase.title)}</strong>
      <span>${escapeHtml(team)}</span>
    </div>
  `;
}

function ensureAgentElements() {
  if (!nodes.agentLayer || nodes.agentLayer.dataset.ready === "true") return;
  nodes.agentLayer.innerHTML = agents.map((agent) => {
    const pos = agentPositions[agent.id] || agentHome(agent.id);
    const sprite = agent.spriteSheet
      ? `<div class="agent-sprite-sheet ${escapeHtml(agent.id)}-sprite" style="background-image:url('${agent.spriteSheet}')" aria-hidden="true"></div>`
      : agent.sprite ? `<img src="${agent.sprite}" alt="" />` : `<div class="agent-fallback">${agent.name.slice(0, 1)}</div>`;
    return `<div class="agent idle" data-agent-id="${escapeHtml(agent.id)}" style="left:${pos.x}%;top:${pos.y}%"><span class="ag-led"></span>${sprite}<strong>${escapeHtml(agent.name)}</strong><span class="agent-role">${escapeHtml(agent.roleShort || agent.role)}</span></div>`;
  }).join("");
  nodes.agentLayer.dataset.ready = "true";
}

function moveAgentTo(agentId, point, { duration = 900, bubble = "" } = {}) {
  ensureAgentElements();
  const el = getAgentElement(agentId);
  if (!el || !point) return;
  const prev = agentPositions[agentId] || agentHome(agentId);
  agentPositions[agentId] = { x: point.x, y: point.y };
  el.dataset.dir = point.x < prev.x ? "left" : "right";
  el.style.setProperty("--move-ms", `${duration}ms`);
  el.classList.add("walking");
  el.style.left = `${point.x}%`;
  el.style.top = `${point.y}%`;
  setAgentBubble(agentId, bubble);
  scheduleOfficeMove(() => el.classList.remove("walking"), duration + 80);
}

function moveAgentHome(agentId, duration = 900) {
  moveAgentTo(agentId, agentHome(agentId), { duration, bubble: "" });
}

function resetAgentPositions() {
  agents.forEach((agent) => {
    agentPositions[agent.id] = { x: agent.x, y: agent.y };
  });
}

function returnAllAgentsHome(duration = 900) {
  agents.forEach((agent, index) => {
    scheduleOfficeMove(() => moveAgentHome(agent.id, duration), index * 45);
  });
}

function choreographPhase(phaseIndex, phase) {
  const activeSet = new Set(phase.agents);
  const spots = phaseMeetingSpots[phaseIndex] || {};
  agents.forEach((agent, index) => {
    if (!activeSet.has(agent.id)) {
      scheduleOfficeMove(() => moveAgentHome(agent.id, 850), index * 35);
    }
  });
  phase.agents.forEach((agentId, index) => {
    const fallback = agentHome(agentId);
    const spot = spots[agentId] || { x: fallback.x, y: fallback.y };
    scheduleOfficeMove(() => moveAgentTo(agentId, spot, { duration: 1000, bubble: agentActionBubble(agentId, "move", phase.title) }), index * 120);
  });
}

function renderAgents(active = [], bubbles = {}) {
  if (!nodes.agentLayer) return;
  ensureAgentElements();
  latestVisualAgentIds = Array.isArray(active) ? active : [];
  latestVisualAgentBubbles = bubbles || {};
  renderStageEffects(active);
  const activeSet = new Set(active);
  agents.forEach((agent) => {
    const el = getAgentElement(agent.id);
    if (!el) return;
    const pos = agentPositions[agent.id] || agentHome(agent.id);
    const isActive = activeSet.has(agent.id);
    el.classList.toggle("working", isActive);
    el.classList.toggle("idle", !isActive);
    el.style.left = `${pos.x}%`;
    el.style.top = `${pos.y}%`;
    setAgentBubble(agent.id, bubbles[agent.id] || "");
  });
  syncOfficeLiveStage();
}

function officeJobSubtasks(job = {}) {
  if (Array.isArray(job.subtasks)) return job.subtasks;
  if (Array.isArray(job.plan?.subtasks)) return job.plan.subtasks;
  return [];
}

function officeJobAllAgentIds(job = {}) {
  const ids = new Set();
  [job.agentId, job.currentAgentId].filter(Boolean).forEach((id) => ids.add(id));
  [job.activeAgentIds, job.currentAgentIds, job.plan?.activeAgentIds].forEach((list) => {
    if (Array.isArray(list)) list.filter(Boolean).forEach((id) => ids.add(id));
  });
  officeJobSubtasks(job).forEach((step) => {
    if (step.agentId) ids.add(step.agentId);
  });
  if (!ids.size && job.type === "codex") ids.add("developer");
  return Array.from(ids);
}

function officeJobCurrentAgentIds(job = {}) {
  const subtasks = officeJobSubtasks(job);
  const current = currentSubtaskAgentIds(subtasks, job.status);
  if (current.length) return current;
  const listed = [job.currentAgentIds, job.activeAgentIds, job.plan?.activeAgentIds]
    .find((list) => Array.isArray(list) && list.length);
  if (listed?.length) return listed.filter(Boolean);
  if (officeRunningStatuses.has(job.status)) return officeJobAllAgentIds(job);
  return [];
}

function officeJobNeedsLiveAttention(job = {}) {
  if (!officeAttentionStatuses.has(job.status)) return false;
  if (job.status === "waiting_question") return true;
  if (job.needsAttention === true || job.isActive === true) return true;
  if (job.id && (job.id === activeOfficeJobId || job.id === activeCodexJobId)) return true;
  const decisionStatus = String(job.reviewDecision?.status || "");
  return !job.reviewDecision || ["pending", "needs_review", "needs_revision", "open"].includes(decisionStatus);
}

function officeJobProgressPercent(job = {}, agentId = "") {
  const subtasks = officeJobSubtasks(job);
  if (subtasks.length) {
    const completed = subtasks.filter((step) => ["completed", "skipped"].includes(step.status)).length;
    const currentIndex = Math.max(0, subtasks.findIndex((step) => step.agentId === agentId));
    const base = Math.round((completed / subtasks.length) * 100);
    return Math.max(12, Math.min(96, base || Math.round(((currentIndex + 0.35) / subtasks.length) * 100)));
  }
  if (job.status === "queued") return 16;
  if (job.status === "retrying") return 58;
  if (job.status === "finalizing") return 86;
  if (job.status === "waiting_question") return 100;
  return officeRunningStatuses.has(job.status) ? 42 : 0;
}

function officeAgentLiveState(agentId = "") {
  const jobs = Array.isArray(latestTaskQueueState.jobs) ? latestTaskQueueState.jobs : [];
  const workflowActiveIds = new Set(officeDashboardState.workflow?.activeAgentIds || []);
  const countMap = new Map((officeDashboardState.workflow?.agentCounts || []).map((row) => [row.id, Number(row.count || 0)]));
  const visualActiveIds = new Set(latestVisualAgentIds || []);
  const currentJob = jobs.find((job) => officeRunningStatuses.has(job.status) && officeJobCurrentAgentIds(job).includes(agentId));
  const attentionJob = jobs.find((job) => officeJobNeedsLiveAttention(job) && officeJobAllAgentIds(job).includes(agentId));
  const recentJob = jobs.find((job) => ["completed", "completed_with_errors"].includes(job.status) && officeJobAllAgentIds(job).includes(agentId));
  const subtasks = officeJobSubtasks(currentJob || attentionJob || {});
  const currentStep = subtasks.find((step) => step.agentId === agentId && !["completed", "skipped"].includes(step.status))
    || subtasks.find((step) => step.agentId === agentId);
  const active = Boolean(currentJob) || workflowActiveIds.has(agentId) || visualActiveIds.has(agentId);
  const attention = Boolean(attentionJob);
  const progress = currentJob ? officeJobProgressPercent(currentJob, agentId) : active ? 46 : 0;
  const jobTitle = currentJob?.title || currentJob?.capsule?.goal || currentJob?.capsule?.normalizedTask || latestOfficeTask;
  const currentTask = currentStep?.label || currentJob?.progress || jobTitle || latestVisualAgentBubbles[agentId] || "";
  const recentOutput = recentJob?.saved?.relPath || recentJob?.saved?.path || recentJob?.output?.relPath || recentJob?.title || "";
  const statusLabel = attention
    ? officeJobStatusLabel(attentionJob.status)
    : active
      ? (currentJob?.statusLabel || officeJobStatusLabel(currentJob?.status || "running"))
      : "대기";
  return {
    active,
    attention,
    progress,
    currentTask,
    recentOutput,
    statusLabel,
    taskCount: countMap.get(agentId) || 0,
    bubble: attention ? statusLabel : currentTask || latestVisualAgentBubbles[agentId] || statusLabel
  };
}

function renderOfficeZoneBadges(stateMap = null) {
  if (!nodes.officeZoneBadges) return;
  const states = stateMap || new Map(agents.map((agent) => [agent.id, officeAgentLiveState(agent.id)]));
  nodes.officeZoneBadges.innerHTML = officeZones.map((zone) => {
    const activeCount = zone.agentIds.filter((id) => states.get(id)?.active).length;
    const attentionCount = zone.agentIds.filter((id) => states.get(id)?.attention).length;
    const count = activeCount + attentionCount;
    const tone = attentionCount ? "attention" : activeCount ? "active" : "idle";
    return `
      <span class="office-zone-badge ${tone}" style="left:${zone.x}%;top:${zone.y}%">
        <b>${escapeHtml(zone.label)}</b>
        <em>${count}</em>
      </span>
    `;
  }).join("");
}

function renderOfficeAgentDetail(agentId = "") {
  if (!nodes.officeAgentDetailPanel) return;
  const agent = agents.find((item) => item.id === agentId);
  if (!agent) {
    nodes.officeAgentDetailPanel.hidden = true;
    selectedOfficeAgentId = "";
    return;
  }
  selectedOfficeAgentId = agent.id;
  const state = officeAgentLiveState(agent.id);
  const skillRow = skillsState.agents?.find((item) => item.id === agent.id) || {};
  const skills = skillRow.skills || [];
  const engine = skillRow.engine || { id: "codex", label: "Codex CLI" };
  const enabledSkills = skills.filter((skill) => skill.enabled !== false && skill.status !== "disabled");
  const statusClass = state.attention ? "attention" : state.active ? "active" : "idle";
  nodes.officeAgentDetailPanel.hidden = false;
  nodes.officeAgentDetailPanel.innerHTML = `
    <button class="office-agent-panel-close" type="button" data-office-agent-action="close" aria-label="닫기">x</button>
    <div class="detail-head">
      <span class="detail-kicker ${statusClass}">${escapeHtml(state.statusLabel)}</span>
      <h2>${escapeHtml(agent.name)}</h2>
      <p>${escapeHtml(agent.role)} · ${escapeHtml(agent.work)}</p>
    </div>
    <dl class="office-agent-live-list">
      <div><dt>현재 작업</dt><dd>${escapeHtml(state.currentTask || "대기 중")}</dd></div>
      <div><dt>최근 산출물</dt><dd>${escapeHtml(cleanDisplayPath(state.recentOutput) || "기록 없음")}</dd></div>
    </dl>
    <div class="agent-profile-blocks office-agent-profile-blocks">
      <article><span>Memory</span><strong>${state.taskCount}개</strong><small>누적 작업</small></article>
      <article><span>Soul</span><strong>${escapeHtml(engine.label || engine.id || "Codex")}</strong><small>담당 엔진</small></article>
      <article><span>Rules</span><strong>${enabledSkills.length}개</strong><small>활성 스킬</small></article>
      <article><span>Guardrails</span><strong>${skills.filter((skill) => skill.requiresConfirmation).length}개</strong><small>확인 필요</small></article>
    </div>
    <div class="office-agent-panel-actions">
      <button type="button" data-office-agent-action="assign" data-agent-id="${escapeHtml(agent.id)}">작업 배정</button>
      <button type="button" data-office-agent-action="detail" data-agent-id="${escapeHtml(agent.id)}">상세</button>
    </div>
  `;
  nodes.agentLayer?.querySelectorAll(".agent").forEach((el) => {
    el.classList.toggle("selected", el.dataset.agentId === agent.id);
  });
}

function syncOfficeLiveStage() {
  if (!nodes.agentLayer) return;
  ensureAgentElements();
  const states = new Map();
  agents.forEach((agent) => {
    const el = getAgentElement(agent.id);
    if (!el) return;
    const state = officeAgentLiveState(agent.id);
    states.set(agent.id, state);
    el.dataset.officeState = state.attention ? "attention" : state.active ? "active" : "idle";
    el.dataset.workCount = String(state.taskCount || 0);
    el.classList.toggle("desk-active", state.active && !state.attention);
    el.classList.toggle("desk-attention", state.attention);
    el.classList.toggle("desk-idle", !state.active && !state.attention);
    el.classList.toggle("working", state.active && !state.attention);
    el.classList.toggle("idle", !state.active && !state.attention);
    let progress = el.querySelector(".agent-progress");
    if (!progress) {
      progress = document.createElement("span");
      progress.className = "agent-progress";
      progress.innerHTML = "<i></i>";
      el.append(progress);
    }
    progress.hidden = !state.active && !state.attention;
    const bar = progress.querySelector("i");
    if (bar) bar.style.width = `${Math.max(8, Math.min(100, state.progress || 0))}%`;
    setAgentBubble(agent.id, state.active || state.attention ? state.bubble : "");
  });
  renderOfficeZoneBadges(states);
  if (selectedOfficeAgentId && !nodes.officeAgentDetailPanel?.hidden) renderOfficeAgentDetail(selectedOfficeAgentId);
}

function handleOfficeAgentClick(event) {
  const el = event.target.closest(".agent[data-agent-id]");
  if (!el || !nodes.agentLayer?.contains(el)) return;
  renderOfficeAgentDetail(el.dataset.agentId || "");
}

function handleOfficeAgentPanelClick(event) {
  const button = event.target.closest("[data-office-agent-action]");
  if (!button || !nodes.officeAgentDetailPanel?.contains(button)) return;
  const action = button.dataset.officeAgentAction || "";
  const agentId = button.dataset.agentId || selectedOfficeAgentId || "";
  const agent = agents.find((item) => item.id === agentId);
  if (action === "close") {
    nodes.officeAgentDetailPanel.hidden = true;
    selectedOfficeAgentId = "";
    nodes.agentLayer?.querySelectorAll(".agent").forEach((el) => el.classList.remove("selected"));
    return;
  }
  if (action === "assign") {
    switchPage("chat");
    if (nodes.chatInput) {
      nodes.chatInput.value = `/업무 @${agent?.name || agentId} `;
      nodes.chatInput.focus();
      resizeChatInput();
    }
    return;
  }
  if (action === "detail") {
    switchPage("agents");
    renderAgentDetailPanel(agentId);
  }
}

function renderStageEffects(active = []) {
  if (!nodes.stageEffects) return;
  const routeIds = new Set(active.length ? ["ceo", ...active] : []);
  nodes.stageEffects.querySelectorAll("[data-agent-route]").forEach((el) => {
    el.classList.toggle("active", routeIds.has(el.getAttribute("data-agent-route")));
  });
}

function renderPipeline(activeIndex = -1, done = false) {
  if (!nodes.pipeline) return;
  nodes.pipeline.innerHTML = phases.map((phase, index) => `<div class="pipe-step ${done || index < activeIndex ? "done" : ""} ${index === activeIndex ? "active" : ""}"><strong>${phase.title}</strong><span>${phase.text}</span></div>`).join("");
}

function startVisualFlow(task = "") {
  clearInterval(phaseTimer);
  clearTimeout(officeEndTimer);
  clearOfficeMoveTimers();
  resetAgentPositions();
  latestOfficeTask = task || latestOfficeTask;
  setOfficeProgress({ status: "진행 중", task: latestOfficeTask, chainStatus: "실행 중", detail: "직원 체인이 진행 중입니다. 단계별 상태는 오른쪽 체인 로그와 픽셀 오피스에서 확인하세요." });
  if (nodes.activityLog) nodes.activityLog.innerHTML = "";
  clearCollaborationCue();
  renderAgents([]);
  let index = 0;
  const tick = () => {
    const phase = phases[index];
    if (!phase) return;
    nodes.phaseBadge.textContent = phase.title;
    setOfficeProgress({ status: phase.title, task: latestOfficeTask, chainStatus: `${index + 1}/${phases.length}` });
    renderPipeline(index);
    renderAgents(phase.agents, Object.fromEntries(phase.agents.map((id) => [id, agentActionBubble(id, "work", phase.title)])));
    renderCollaborationCue(index, phase);
    choreographPhase(index, phase);
    renderOfficeAgentStatus(phase.agents);
    addLog(phase.text, phase.agents[0] || "ceo");
    index += 1;
    if (index >= phases.length) {
      clearInterval(phaseTimer);
      officeEndTimer = setTimeout(() => {
        nodes.phaseBadge.textContent = "보고 완료";
        setOfficeProgress({ status: "보고 완료", task: latestOfficeTask, chainStatus: "완료" });
        renderPipeline(-1, true);
        clearCollaborationCue();
        renderAgents([]);
        returnAllAgentsHome(1000);
        renderOfficeAgentStatus([]);
      }, 1800);
    }
  };
  tick();
  phaseTimer = setInterval(tick, 2400);
}

function resetOffice() {
  clearInterval(phaseTimer);
  clearTimeout(officeEndTimer);
  clearOfficeMoveTimers();
  if (officeJobPollTimer) clearInterval(officeJobPollTimer);
  officeJobPollTimer = null;
  activeOfficeJobId = "";
  if (codexJobPollTimer) clearInterval(codexJobPollTimer);
  codexJobPollTimer = null;
  activeCodexJobId = "";
  resetAgentPositions();
  clearCollaborationCue();
  nodes.agentLayer?.querySelectorAll(".agent").forEach((el) => el.classList.remove("walking", "working"));
  if (nodes.activityLog) nodes.activityLog.innerHTML = "";
  if (nodes.reportText) nodes.reportText.textContent = "사무실 탭은 진행 시각화 전용입니다. 업무 지시는 대화 탭에서 입력하세요.";
  if (nodes.saveNotice) nodes.saveNotice.textContent = "대화 탭에서 실행 대기";
  hideHumanLoopPanel();
  if (nodes.phaseBadge) nodes.phaseBadge.textContent = "대기 중";
  if (nodes.cmdMeta) nodes.cmdMeta.textContent = "요미 대기";
  latestOfficeTask = "";
  setOfficeProgress({ status: "대기 중", task: "", chainStatus: "대기" });
  renderPipeline();
  renderAgents([]);
  renderOfficeAgentStatus([]);
}

function workflowStatusLabel(status) {
  return ({ running: "진행 중", evaluating: "검토 중", completed: "완료", failed: "중단" })[status] || "대기";
}

function renderSkillBadges(skillList = []) {
  if (!skillList.length) return '<span class="skill-badge none">도구 없음</span>';
  return skillList.map((skill) => `<span class="skill-badge ${escapeHtml(skill.tone || "muted")}">${escapeHtml(skill.label)} <small>${escapeHtml(skill.statusLabel || "")}</small></span>`).join("");
}

function setAgentSkillStatus(message, tone = "") {
  if (!nodes.agentSkillStatus) return;
  nodes.agentSkillStatus.textContent = message;
  nodes.agentSkillStatus.className = `agent-skill-status ${tone}`.trim();
}

function renderToolOptions(agentId, assignedIds) {
  const availableTools = skillsState.tools || [];
  const options = availableTools.filter((tool) => !assignedIds.has(tool.id));
  if (!options.length) return '<option value="">추가할 도구 없음</option>';
  return ['<option value="">도구 선택</option>', ...options.map((tool) => `<option value="${escapeHtml(tool.id)}">${escapeHtml(tool.label || tool.id)}</option>`)].join("");
}

function renderEngineOptions(selected = "codex") {
  const engines = skillsState.engineOptions?.length ? skillsState.engineOptions : [
    { id: "codex", label: "Codex CLI" },
    { id: "claude", label: "Claude Code CLI" }
  ];
  return engines.map((engine) => `<option value="${escapeHtml(engine.id)}" ${engine.id === selected ? "selected" : ""}>${escapeHtml(engine.label || engine.id)}</option>`).join("");
}

function renderAgentSkillItem(agentId, skill) {
  const checked = skill.enabled !== false && skill.status !== "disabled" ? "checked" : "";
  const detail = [skill.detail || "", skill.requiresConfirmation ? "확인 필요" : ""].filter(Boolean).join(" · ");
  return `
    <div class="agent-skill-item ${escapeHtml(skill.tone || "muted")}">
      <div class="agent-skill-main">
        <span class="skill-badge ${escapeHtml(skill.tone || "muted")}">${escapeHtml(skill.label || skill.id)} <small>${escapeHtml(skill.statusLabel || "")}</small></span>
        ${detail ? `<small>${escapeHtml(detail)}</small>` : ""}
      </div>
      <label class="skill-toggle">
        <input type="checkbox" data-skill-action="toggle" data-agent-id="${escapeHtml(agentId)}" data-tool-id="${escapeHtml(skill.id)}" ${checked}>
        <span>활성</span>
      </label>
      <button class="skill-remove" type="button" data-skill-action="remove" data-agent-id="${escapeHtml(agentId)}" data-tool-id="${escapeHtml(skill.id)}" aria-label="스킬 제거">x</button>
    </div>
  `;
}

function agentSkillSummary(skills = []) {
  const enabled = skills.filter((skill) => skill.enabled !== false && skill.status !== "disabled");
  const problems = enabled.filter((skill) => ["key_required", "disconnected", "unknown"].includes(skill.status));
  if (!enabled.length) return { text: "연결된 스킬 없음", tone: "muted" };
  if (problems.length) return { text: `확인 필요 ${problems.length}개`, tone: "warn" };
  return { text: `${enabled.length}개 스킬 정상`, tone: "ok" };
}

function renderAgentDetailPanel(agentId = "") {
  if (!nodes.agentDetailPanel) return;
  const agent = agents.find((item) => item.id === agentId) || agents[0];
  if (!agent) return;
  const skillMap = new Map((skillsState.agents || []).map((row) => [row.id, row.skills || []]));
  const countMap = new Map((officeDashboardState.workflow?.agentCounts || []).map((row) => [row.id, Number(row.count || 0)]));
  const activeIds = new Set(officeDashboardState.workflow?.activeAgentIds || []);
  const skills = skillMap.get(agent.id) || [];
  const engine = skillsState.agents?.find((item) => item.id === agent.id)?.engine || { id: "codex", label: "Codex CLI" };
  const taskCount = countMap.get(agent.id) || 0;
  const active = activeIds.has(agent.id);
  const enabledSkills = skills.filter((skill) => skill.enabled !== false && skill.status !== "disabled");
  nodes.agentDetailPanel.innerHTML = `
    <div class="detail-head">
      <span class="detail-kicker">${escapeHtml(active ? "Active" : "대기")}</span>
      <h2>${escapeHtml(agent.name)}</h2>
      <p>${escapeHtml(agent.role)} · ${escapeHtml(agent.work)}</p>
    </div>
    <div class="agent-profile-blocks detail-profile-blocks">
      <article><span>Memory</span><strong>${taskCount}개</strong><small>누적 작업량</small></article>
      <article><span>Soul</span><strong>${escapeHtml(engine.label || engine.id || "Codex")}</strong><small>담당 엔진</small></article>
      <article><span>Rules</span><strong>${enabledSkills.length}개</strong><small>활성 스킬</small></article>
      <article><span>Guardrails</span><strong>${skills.filter((skill) => skill.requiresConfirmation).length}개</strong><small>확인 필요 도구</small></article>
    </div>
    <div class="detail-section">
      <strong>스킬</strong>
      <div class="skill-badges">${enabledSkills.length ? enabledSkills.slice(0, 8).map((skill) => `<span class="skill-badge ${escapeHtml(skill.tone || "muted")}">${escapeHtml(skill.label || skill.id)} <small>${escapeHtml(skill.statusLabel || "")}</small></span>`).join("") : renderSkillBadges([])}</div>
    </div>
  `;
  nodes.agentList?.querySelectorAll(".agent-card").forEach((card) => card.classList.toggle("selected", card.dataset.agentId === agent.id));
}

function renderAgentsList() {
  if (!nodes.agentList) return;
  const skillMap = new Map((skillsState.agents || []).map((agent) => [agent.id, agent.skills || []]));
  const countMap = new Map((officeDashboardState.workflow?.agentCounts || []).map((agent) => [agent.id, Number(agent.count || 0)]));
  const activeIds = new Set(officeDashboardState.workflow?.activeAgentIds || []);
  const totalWork = [...countMap.values()].reduce((sum, value) => sum + Number(value || 0), 0);
  if (nodes.agentKpiTotal) nodes.agentKpiTotal.textContent = `${agents.length}명`;
  if (nodes.agentKpiActive) nodes.agentKpiActive.textContent = `${activeIds.size}명`;
  if (nodes.agentKpiWork) nodes.agentKpiWork.textContent = `${totalWork}개`;
  nodes.agentList.innerHTML = agents.map((agent) => {
    const skills = skillMap.get(agent.id) || [];
    const assignedIds = new Set(skills.map((skill) => skill.id));
    const hasOptions = (skillsState.tools || []).some((tool) => !assignedIds.has(tool.id));
    const portrait = `/assets/pixel/characters/${agent.id}_portrait.png`;
    const summary = agentSkillSummary(skills);
    const engine = skillsState.agents?.find((item) => item.id === agent.id)?.engine || { id: "codex", label: "Codex CLI" };
    const taskCount = countMap.get(agent.id) || 0;
    const active = activeIds.has(agent.id);
    const enabledSkills = skills.filter((skill) => skill.enabled !== false && skill.status !== "disabled");
    return `
      <article class="agent-card" data-agent-id="${escapeHtml(agent.id)}">
        <div class="agent-card-head">
          <div class="agent-card-portrait" style="background-image:url('${portrait}')" aria-hidden="true"></div>
          <div class="agent-card-title">
            <strong>${escapeHtml(agent.name)}</strong>
            <span>${escapeHtml(agent.role)}</span>
            <small>${escapeHtml(agent.roleShort || agent.role)}</small>
          </div>
        </div>
        <div class="agent-roster-meta">
          <b class="agent-state ${active ? "active" : ""}">${active ? "Active" : "대기"}</b>
          <span>${taskCount}개 작업</span>
        </div>
        <details class="agent-detail">
          <summary>상세</summary>
          <p>${escapeHtml(agent.work)}</p>
          <div class="agent-profile-blocks">
            <article><span>Memory</span><strong>${taskCount}개</strong><small>누적 작업량</small></article>
            <article><span>Soul</span><strong>${escapeHtml(engine.label || engine.id || "Codex")}</strong><small>담당 엔진</small></article>
            <article><span>Rules</span><strong>${enabledSkills.length}개</strong><small>활성 스킬</small></article>
            <article><span>Guardrails</span><strong>${skills.filter((skill) => skill.requiresConfirmation).length}개</strong><small>확인 필요 도구</small></article>
          </div>
          <label class="agent-engine-row">
            <span>담당 엔진</span>
            <select data-agent-engine-select="${escapeHtml(agent.id)}">${renderEngineOptions(engine.id || "codex")}</select>
          </label>
          <div class="agent-skill-summary ${escapeHtml(summary.tone)}">${escapeHtml(summary.text)}</div>
          <div class="agent-skill-list">${skills.length ? skills.map((skill) => renderAgentSkillItem(agent.id, skill)).join("") : renderSkillBadges([])}</div>
          <div class="agent-skill-controls">
            <select data-agent-tool-select="${escapeHtml(agent.id)}" ${hasOptions ? "" : "disabled"}>${renderToolOptions(agent.id, assignedIds)}</select>
            <button class="mini-action" type="button" data-skill-action="add" data-agent-id="${escapeHtml(agent.id)}" ${hasOptions ? "" : "disabled"}>추가</button>
          </div>
        </details>
      </article>
    `;
  }).join("");
  renderAgentDetailPanel(nodes.agentList.querySelector(".agent-card")?.dataset.agentId || "");
}

function handleAgentSelect(event) {
  if (event.target.closest("button, input, select, textarea, summary, label")) return;
  const card = event.target.closest(".agent-card[data-agent-id]");
  if (!card || !nodes.agentList?.contains(card)) return;
  renderAgentDetailPanel(card.dataset.agentId || "");
}

function handleAgentRosterAction(event) {
  const button = event.target.closest("[data-agent-roster-action]");
  if (!button) return;
  const action = button.dataset.agentRosterAction || "";
  if (action === "assign") {
    switchPage("chat");
    if (nodes.chatInput) {
      nodes.chatInput.value = "/업무 ";
      nodes.chatInput.focus();
    }
    return;
  }
  if (action === "add") {
    setAgentSkillStatus("직원 추가는 specialistRoles 데이터 모델 확장 후 활성화합니다. 현재는 작업 배정을 먼저 사용하세요.", "warn");
  }
}

function renderToolStatus(container, tools = []) {
  if (!container) return;
  if (!tools.length) {
    container.innerHTML = '<div class="empty">등록된 도구가 없습니다.</div>';
    return;
  }
  const renderItem = (tool) => `
    <article class="tool-status ${escapeHtml(tool.tone || "muted")}">
      <div><strong>${escapeHtml(tool.label || tool.id)}</strong><span>${escapeHtml(tool.provider || tool.type || "")}${tool.mcp?.server ? ` · MCP: ${escapeHtml(tool.mcp.server)}` : ""}</span></div>
      <b>${escapeHtml(tool.statusLabel || tool.status)}</b>
      <small>${escapeHtml(tool.detail || "")}</small>
    </article>
  `;
  if (container === nodes.settingsToolStatus) {
    const problems = tools.filter((tool) => ["key_required", "disconnected", "unknown"].includes(tool.status));
    const normal = tools.filter((tool) => !problems.includes(tool));
    container.innerHTML = [
      problems.length
        ? problems.map(renderItem).join("")
        : '<div class="empty ok">필수 스킬과 API 연결이 정상입니다.</div>',
      `<details class="settings-advanced-list"><summary>정상 도구 ${normal.length}개 보기</summary>${normal.map(renderItem).join("")}</details>`
    ].join("");
    return;
  }
  container.innerHTML = tools.map(renderItem).join("");
}

function updateBraveKeyGuide(tools = []) {
  if (!nodes.braveKeyGuide) return;
  nodes.braveKeyGuide.hidden = true;
  nodes.braveKeyGuide.setAttribute("aria-hidden", "true");
}

function renderSkillsState(state = skillsState) {
  skillsState = state || { agents: [], tools: [] };
  renderAgentsList();
  renderToolStatus(nodes.settingsToolStatus, skillsState.tools || []);
  renderToolStatus(nodes.dashboardToolStatus, skillsState.tools || []);
  updateBraveKeyGuide(skillsState.tools || []);
  const counts = (skillsState.tools || []).reduce((acc, tool) => {
    acc[tool.status] = (acc[tool.status] || 0) + 1;
    return acc;
  }, {});
  if (nodes.skillStatusSummary) nodes.skillStatusSummary.textContent = `정상 ${counts.normal || 0} · 키 필요 ${counts.key_required || 0} · 미연결 ${counts.disconnected || 0}`;
}

function renderActiveSkillsState(state = {}) {
  const skills = Array.isArray(state.skills) ? state.skills : [];
  const summary = state.summary || {};
  if (nodes.activeSkillStatus) nodes.activeSkillStatus.textContent = `${Number(summary.active || skills.length || 0)}개 활성 · 재사용 ${Number(summary.totalReuse || 0)}회`;
  if (!nodes.activeSkillList) return;
  if (!skills.length) {
    nodes.activeSkillList.innerHTML = '<div class="empty">승인된 학습 스킬이 없습니다.</div>';
    return;
  }
  nodes.activeSkillList.innerHTML = skills.map((skill) => `
    <article class="active-skill-item">
      <div><strong>${escapeHtml(skill.label || skill.id)}</strong><span>${escapeHtml((skill.agents || []).join(", ") || "담당 미지정")}</span></div>
      <b>${Number(skill.reuseCount || 0)}회</b>
      <small>${skill.lastUsedAt ? `최근 ${escapeHtml(formatShortTime(skill.lastUsedAt))}` : "아직 재사용 없음"}</small>
      ${skill.instructionsPreview ? `<p>${escapeHtml(skill.instructionsPreview)}</p>` : ""}
    </article>
  `).join("");
}

async function loadActiveSkills() {
  if (!nodes.activeSkillList && !nodes.activeSkillStatus) return null;
  try {
    const response = await apiFetch("/api/skills", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok || data.ok === false) throw new Error(data.error || `HTTP ${response.status}`);
    renderActiveSkillsState(data);
    return data;
  } catch (error) {
    if (nodes.activeSkillStatus) nodes.activeSkillStatus.textContent = "로드 실패";
    if (nodes.activeSkillList) nodes.activeSkillList.innerHTML = `<div class="empty">활성 스킬 로드 실패: ${escapeHtml(error.message)}</div>`;
    return null;
  }
}

function profileListToText(value = []) {
  return (Array.isArray(value) ? value : []).join("\n");
}

function profileMemorySummary(profile = {}, counts = null) {
  const totalFallback = Number(counts?.total ?? counts?.memoryCount ?? 0);
  const memoryCount = Number(counts?.memory ?? (Array.isArray(profile.memory) ? profile.memory.length : totalFallback));
  const userMemoryCount = Number(counts?.userMemory ?? (Array.isArray(profile.userMemory) ? profile.userMemory.length : 0));
  const totalChars = Number(counts?.totalChars || 0);
  const maxChars = Number(counts?.maxTotalChars || 0);
  const budget = maxChars ? ` · ${totalChars}/${maxChars}자` : "";
  return `MEMORY ${memoryCount}개 · USER ${userMemoryCount}개${budget}`;
}

function renderProfileState(state = profileState) {
  profileState = state || { profile: null };
  const profile = profileState.profile || {};
  const memorySummary = profileMemorySummary(profile, profileState.counts);
  if (nodes.styleProfileStatus) nodes.styleProfileStatus.textContent = profile.enabled !== false ? "RAG+톤 적용" : "프로필 꺼짐";
  if (nodes.styleProfileMeta) nodes.styleProfileMeta.textContent = `${profile.label || "Vault RAG와 톤 프로필"} · ${memorySummary}`;
  if (nodes.profileEditStatus) nodes.profileEditStatus.textContent = profile.enabled !== false ? `적용 중 · ${memorySummary}` : `꺼짐 · ${memorySummary}`;
  if (nodes.profileLabel) nodes.profileLabel.value = profile.label || "";
  if (nodes.profileEnabled) nodes.profileEnabled.checked = profile.enabled !== false;
  if (nodes.profileVoice) nodes.profileVoice.value = profileListToText(profile.voice);
  if (nodes.profileFormat) nodes.profileFormat.value = profileListToText(profile.format);
  if (nodes.profileAvoid) nodes.profileAvoid.value = profileListToText(profile.avoid);
  if (nodes.profileMemory) nodes.profileMemory.value = profileListToText(profile.memory);
  if (nodes.profileUserMemory) nodes.profileUserMemory.value = profileListToText(profile.userMemory);
  const routing = profileState.autoRouting || {};
  const policy = routing.policy || {};
  if (nodes.autoRoutingHighCut) nodes.autoRoutingHighCut.value = Number(policy.highCut ?? 75);
  if (nodes.autoRoutingLowCut) nodes.autoRoutingLowCut.value = Number(policy.lowCut ?? 40);
  if (nodes.autoRoutingSummary) {
    const summary = routing.summary || {};
    nodes.autoRoutingSummary.textContent = `자동저장 >= ${Number(policy.highCut ?? 75)} · 검토 ${Number(policy.lowCut ?? 40)}~${Number(policy.highCut ?? 75) - 1} · 격리 < ${Number(policy.lowCut ?? 40)} · 최근 로그 ${Number(summary.total || 0)}건`;
  }
}

async function loadProfileState() {
  if (!nodes.profileForm) return null;
  try {
    if (nodes.profileEditStatus) nodes.profileEditStatus.textContent = "불러오는 중";
    const response = await apiFetch("/api/profile", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok || data.ok === false) throw new Error(data.error || `HTTP ${response.status}`);
    renderProfileState(data);
    return data;
  } catch (error) {
    if (nodes.profileEditStatus) nodes.profileEditStatus.textContent = `로드 실패: ${error.message}`;
    return null;
  }
}

async function saveProfileState(event) {
  event.preventDefault();
  if (!nodes.profileForm) return;
  try {
    if (nodes.profileEditStatus) nodes.profileEditStatus.textContent = "저장 중";
    const response = await apiFetch("/api/profile", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        label: nodes.profileLabel?.value || "",
        enabled: nodes.profileEnabled?.checked !== false,
        voice: nodes.profileVoice?.value || "",
        format: nodes.profileFormat?.value || "",
        avoid: nodes.profileAvoid?.value || "",
        memory: nodes.profileMemory?.value || "",
        userMemory: nodes.profileUserMemory?.value || ""
      })
    });
    const data = await response.json();
    if (!response.ok || data.ok === false) throw new Error(data.error || "프로필 저장 실패");
    const routingResponse = await apiFetch("/api/auto-routing", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        highCut: Number(nodes.autoRoutingHighCut?.value || 75),
        lowCut: Number(nodes.autoRoutingLowCut?.value || 40)
      })
    });
    const routingData = await routingResponse.json();
    if (!routingResponse.ok || routingData.ok === false) throw new Error(routingData.error || "자동 라우팅 저장 실패");
    data.autoRouting = routingData;
    renderProfileState(data);
    if (nodes.profileEditStatus) nodes.profileEditStatus.textContent = "저장 완료";
    await refreshState();
  } catch (error) {
    if (nodes.profileEditStatus) nodes.profileEditStatus.textContent = `저장 실패: ${error.message}`;
  }
}

function setAgentSkillControlsDisabled(disabled) {
  if (!nodes.agentList) return;
  nodes.agentList.querySelectorAll("button, select, input").forEach((control) => {
    control.disabled = disabled;
  });
}

async function updateSkillConfig(payload, pendingMessage) {
  if (skillUpdateBusy) return;
  skillUpdateBusy = true;
  setAgentSkillStatus(pendingMessage || "skills.json 반영 중", "pending");
  setAgentSkillControlsDisabled(true);
  try {
    const response = await apiFetch("/api/skills-state", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok || data.ok === false) throw new Error(data.error || "스킬 설정 저장 실패");
    renderSkillsState(data);
    setAgentSkillStatus("skills.json에 반영됨", "ok");
  } catch (error) {
    setAgentSkillStatus(`저장 실패: ${error.message}`, "bad");
    await refreshState();
  } finally {
    skillUpdateBusy = false;
  }
}

function handleAgentSkillClick(event) {
  const button = event.target.closest("button[data-skill-action]");
  if (!button || !nodes.agentList?.contains(button)) return;
  const action = button.dataset.skillAction;
  const agentId = button.dataset.agentId || "";
  if (action === "add") {
    const select = nodes.agentList.querySelector(`select[data-agent-tool-select="${CSS.escape(agentId)}"]`);
    const toolId = select?.value || "";
    if (!toolId) return setAgentSkillStatus("추가할 도구를 선택하세요", "pending");
    return updateSkillConfig({ action: "add-agent-skill", agentId, toolId }, "스킬 추가 중");
  }
  if (action === "remove") {
    return updateSkillConfig({ action: "remove-agent-skill", agentId, toolId: button.dataset.toolId || "" }, "스킬 제거 중");
  }
}

function handleAgentSkillChange(event) {
  const engineSelect = event.target.closest("select[data-agent-engine-select]");
  if (engineSelect && nodes.agentList?.contains(engineSelect)) {
    return updateSkillConfig({ action: "set-agent-engine", agentId: engineSelect.dataset.agentEngineSelect || "", engine: engineSelect.value }, "담당 엔진 변경 중");
  }
  const input = event.target.closest('input[data-skill-action="toggle"]');
  if (!input || !nodes.agentList?.contains(input)) return;
  return updateSkillConfig({ action: "set-agent-skill-enabled", agentId: input.dataset.agentId || "", toolId: input.dataset.toolId || "", enabled: input.checked }, "스킬 상태 변경 중");
}

function renderEnvState(envState = []) {
  if (!envState.length) return '<small>환경변수 필요 없음</small>';
  return envState.map((item) => `<small>${escapeHtml(item.name)}: ${item.present ? "연결됨" : item.required ? "키 필요" : "선택"}</small>`).join("");
}

function renderConnectionCard(connection) {
  return `
    <article class="connection-item ${escapeHtml(connection.tone || "muted")}">
      <div>
        <strong>${escapeHtml(connection.name)}</strong>
        <span>${escapeHtml(connection.kind)} · ${escapeHtml(connection.provider || "provider 미설정")}${connection.mcpServer ? ` · MCP: ${escapeHtml(connection.mcpServer)}` : ""}</span>
        <small>${escapeHtml(connection.detail || connection.notes || "")}</small>
        ${renderEnvState(connection.envState || [])}
      </div>
      <b>${escapeHtml(connection.statusLabel || connection.status || "")}</b>
      <div class="connection-row-actions">
        <button type="button" data-connection-action="toggle" data-connection-id="${escapeHtml(connection.id)}" data-enabled="${connection.enabled ? "false" : "true"}">${connection.enabled ? "끄기" : "켜기"}</button>
        <button type="button" data-connection-action="edit" data-connection-id="${escapeHtml(connection.id)}">수정</button>
        <button type="button" data-connection-action="delete" data-connection-id="${escapeHtml(connection.id)}">삭제</button>
      </div>
    </article>
  `;
}

function renderHarnessScopes(scopes = {}) {
  if (!nodes.harnessScopeList) return;
  const agentScopes = scopes.agents || {};
  const rows = agents
    .map((agent) => ({ agent, scope: agentScopes[agent.id] || {} }))
    .filter(({ scope }) => (scope.allowedConnections || []).length || (scope.allowedTools || []).length)
    .map(({ agent, scope }) => `
      <article class="harness-scope-item">
        <strong>${escapeHtml(agent.name)}</strong>
        <span>${escapeHtml((scope.allowedConnections || []).join(", ") || "연결 없음")}</span>
        <small>도구: ${escapeHtml((scope.allowedTools || []).join(", ") || "없음")}</small>
        ${(scope.requiresConfirmation || []).length ? `<small class="warn">확인 필요: ${escapeHtml(scope.requiresConfirmation.join(", "))}</small>` : ""}
      </article>
    `);
  nodes.harnessScopeList.innerHTML = rows.length ? rows.join("") : '<div class="empty">등록된 하네스 스코프가 없습니다.</div>';
}

function renderConnectionsState(state = connectionsState) {
  connectionsState = state || { connections: [], candidates: [] };
  if (nodes.connectionStatus) nodes.connectionStatus.textContent = connectionsState.secretPolicy || "비밀값 저장 안 함";
  if (nodes.connectionList) {
    if (!connectionsState.connections?.length) {
      nodes.connectionList.innerHTML = '<div class="empty">등록된 연결이 없습니다.</div>';
    } else {
      const coreIds = new Set(["codex_cli", "claude_cli", "obsidian_vault", "exa_mcp", "firecrawl_mcp", "tavily_search"]);
      const core = connectionsState.connections.filter((connection) => coreIds.has(connection.id));
      const advanced = connectionsState.connections.filter((connection) => !coreIds.has(connection.id));
      nodes.connectionList.innerHTML = [
        '<div class="connection-section-title">핵심 연결</div>',
        core.map(renderConnectionCard).join(""),
        advanced.length
          ? `<details class="settings-advanced-list"><summary>고급 연결 ${advanced.length}개 보기</summary>${advanced.map(renderConnectionCard).join("")}</details>`
          : ""
      ].join("");
    }
  }
  if (nodes.connectionCandidates) {
    nodes.connectionCandidates.innerHTML = "";
  }
  renderHarnessScopes(connectionsState.harnessScopes || {});
}

function resetConnectionForm() {
  if (!nodes.connectionForm) return;
  nodes.connectionId.value = "";
  nodes.connectionName.value = "";
  nodes.connectionKind.value = "api";
  nodes.connectionProvider.value = "";
  nodes.connectionEnvKeys.value = "";
  nodes.connectionMcpServer.value = "";
  nodes.connectionNotes.value = "";
  nodes.connectionEnabled.checked = true;
  nodes.connectionForm.classList.remove("editing");
}

function fillConnectionForm(connection) {
  if (!nodes.connectionForm || !connection) return;
  nodes.connectionId.value = connection.id || "";
  nodes.connectionName.value = connection.name || "";
  nodes.connectionKind.value = connection.kind || "api";
  nodes.connectionProvider.value = connection.provider || "";
  nodes.connectionEnvKeys.value = (connection.envKeys || []).join(", ");
  nodes.connectionMcpServer.value = connection.mcpServer || "";
  nodes.connectionNotes.value = connection.notes || "";
  nodes.connectionEnabled.checked = connection.enabled !== false;
  nodes.connectionForm.classList.add("editing");
  nodes.connectionName.focus();
}

async function updateConnectionConfig(payload) {
  if (nodes.connectionStatus) nodes.connectionStatus.textContent = "연결 설정 저장 중";
  const response = await apiFetch("/api/connections", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok || data.ok === false) throw new Error(data.error || "연결 설정 저장 실패");
  renderConnectionsState(data);
  if (nodes.connectionStatus) nodes.connectionStatus.textContent = "저장 완료 · 비밀값 저장 안 함";
  return data;
}

async function loadConnectionsState() {
  if (!nodes.connectionList) return;
  try {
    const response = await apiFetch("/api/connections", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
    renderConnectionsState(data);
  } catch (error) {
    if (nodes.connectionList) nodes.connectionList.innerHTML = `<div class="empty">연결 상태 로드 실패: ${escapeHtml(error.message)}</div>`;
  }
}

async function handleConnectionSubmit(event) {
  event.preventDefault();
  try {
    await updateConnectionConfig({
      action: "save",
      connection: {
        id: nodes.connectionId.value,
        name: nodes.connectionName.value,
        kind: nodes.connectionKind.value,
        provider: nodes.connectionProvider.value,
        envKeys: nodes.connectionEnvKeys.value,
        mcpServer: nodes.connectionMcpServer.value,
        notes: nodes.connectionNotes.value,
        enabled: nodes.connectionEnabled.checked
      }
    });
    resetConnectionForm();
  } catch (error) {
    if (nodes.connectionStatus) nodes.connectionStatus.textContent = `저장 실패: ${error.message}`;
  }
}

async function handleConnectionClick(event) {
  const button = event.target.closest("button[data-connection-action]");
  if (!button || !nodes.connectionList?.contains(button)) return;
  const action = button.dataset.connectionAction;
  const id = button.dataset.connectionId || "";
  const connection = (connectionsState.connections || []).find((item) => item.id === id);
  if (action === "edit") return fillConnectionForm(connection);
  try {
    if (action === "toggle") await updateConnectionConfig({ action: "toggle", id, enabled: button.dataset.enabled === "true" });
    if (action === "delete") await updateConnectionConfig({ action: "delete", id });
  } catch (error) {
    if (nodes.connectionStatus) nodes.connectionStatus.textContent = `변경 실패: ${error.message}`;
  }
}

function formatTriggerDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function formatAutomationDuration(ms) {
  const value = Number(ms || 0);
  if (!value) return "";
  if (value < 1000) return `${Math.round(value)}ms`;
  return `${(value / 1000).toFixed(value < 10000 ? 1 : 0)}s`;
}

function renderAutomationTriggerHistory(history = []) {
  const rows = (Array.isArray(history) ? history : []).slice(0, 3);
  if (!rows.length) return "";
  return `
    <div class="automation-trigger-history" aria-label="최근 자동화 실행 이력">
      ${rows.map((entry) => {
        const status = entry.ok ? "성공" : "실패";
        const when = formatTriggerDate(entry.ranAt);
        const detail = entry.ok
          ? [entry.modeLabel, entry.jobId ? `작업 ${entry.jobId}` : "", formatAutomationDuration(entry.durationMs)].filter(Boolean).join(" · ")
          : [entry.error || "오류", entry.retryScheduledAt ? `재시도 ${formatTriggerDate(entry.retryScheduledAt)}` : "", `${entry.attempt || 1}회차`].filter(Boolean).join(" · ");
        return `<small class="${entry.ok ? "success" : "warn"}">${escapeHtml(status)}${when ? ` · ${escapeHtml(when)}` : ""}${detail ? ` · ${escapeHtml(detail)}` : ""}</small>`;
      }).join("")}
    </div>
  `;
}

function renderAutomationReadiness(readiness = null) {
  if (!readiness || !Array.isArray(readiness.checks)) return "";
  const checks = readiness.checks.slice(0, 5);
  return `
    <div class="automation-readiness ${escapeHtml(readiness.status || "")}">
      <strong>${escapeHtml(readiness.statusLabel || "활성화 점검")}</strong>
      ${readiness.summary ? `<small>${escapeHtml(readiness.summary)}</small>` : ""}
      <div>
        ${checks.map((check) => `<span class="${escapeHtml(check.status || "")}">${escapeHtml(check.label || check.id)}${check.detail ? ` · ${escapeHtml(check.detail)}` : ""}</span>`).join("")}
      </div>
    </div>
  `;
}

function renderAutomationTriggerCard(trigger) {
  const typeLabel = trigger.type === "folder_watch" ? "폴더 감시" : "예약";
  const nextText = trigger.nextRunAt ? `다음: ${formatTriggerDate(trigger.nextRunAt)}` : "";
  const lastText = trigger.lastRunAt ? `최근: ${formatTriggerDate(trigger.lastRunAt)}` : "실행 기록 없음";
  const retryText = trigger.nextRetryAt
    ? `재시도: ${formatTriggerDate(trigger.nextRetryAt)}`
    : trigger.failureCount
      ? `실패 ${trigger.failureCount}회`
      : "";
  const policy = trigger.retryPolicy || {};
  const retryPolicyText = policy.enabled === false
    ? "재시도 꺼짐"
    : `재시도 최대 ${policy.maxAttempts || 2}회 · ${policy.delayMinutes || 5}분`;
  const resultText = trigger.lastResult?.ok === false
    ? `실패: ${trigger.lastResult.error || "오류"}`
    : trigger.lastResult?.jobId
      ? `작업: ${trigger.lastResult.jobId}`
      : trigger.lastResult?.modeLabel || "";
  const channelText = trigger.sendToChannel ? "채널 발송 켜짐" : "";
  return `
    <article class="automation-trigger-item ${escapeHtml(trigger.status || "")}">
      <div>
        <strong>${escapeHtml(trigger.title || trigger.id)}</strong>
        <span>${escapeHtml(typeLabel)} · ${escapeHtml(trigger.statusLabel || trigger.status || "대기")}</span>
        <small>${escapeHtml(trigger.detail || "")}</small>
        <small>${escapeHtml([nextText, lastText, resultText, channelText].filter(Boolean).join(" · "))}</small>
        <small>${escapeHtml([retryText, retryPolicyText].filter(Boolean).join(" · "))}</small>
        ${renderAutomationReadiness(trigger.readiness)}
        ${renderAutomationTriggerHistory(trigger.history || [])}
      </div>
      <div class="connection-row-actions">
        <button type="button" data-trigger-action="toggle" data-trigger-id="${escapeHtml(trigger.id)}" data-enabled="${trigger.enabled ? "false" : "true"}">${trigger.enabled ? "끄기" : "켜기"}</button>
        <button type="button" data-trigger-action="preview" data-trigger-id="${escapeHtml(trigger.id)}">미리보기</button>
        <button type="button" data-trigger-action="run" data-trigger-id="${escapeHtml(trigger.id)}">수동 실행</button>
        <button type="button" data-trigger-action="edit" data-trigger-id="${escapeHtml(trigger.id)}">수정</button>
        <button type="button" data-trigger-action="delete" data-trigger-id="${escapeHtml(trigger.id)}">삭제</button>
      </div>
    </article>
  `;
}

function renderAutomationDashboardSummary(summary = {}, triggers = []) {
  if (!nodes.automationDashboardSummary) return;
  const nextRuns = triggers
    .filter((trigger) => trigger.enabled && trigger.nextRunAt)
    .sort((a, b) => new Date(a.nextRunAt).getTime() - new Date(b.nextRunAt).getTime())
    .slice(0, 2)
    .map((trigger) => `${trigger.title || trigger.id} ${formatTriggerDate(trigger.nextRunAt)}`)
    .join(" · ");
  nodes.automationDashboardSummary.innerHTML = [
    ["실행 중", Number(summary.running || 0), "running"],
    ["재시도", Number(summary.retrying || 0), "retrying"],
    ["실패", Number(summary.failed || 0), "failed"],
    ["주의", Number(summary.attention || summary.readinessBlocked || 0), "attention"]
  ].map(([label, value, tone]) => `
    <article class="automation-summary-card ${value ? tone : ""}">
      <span>${escapeHtml(label)}</span>
      <strong>${value}</strong>
      <small>${tone === "attention" && nextRuns ? escapeHtml(nextRuns) : value ? "상태 확인 필요" : "정상"}</small>
    </article>
  `).join("");
}

function renderAutomationTriggersState(state = automationTriggersState) {
  automationTriggersState = state || { triggers: [], summary: {} };
  const triggers = automationTriggersState.triggers || [];
  const summary = automationTriggersState.summary || {};
  renderAutomationDashboardSummary(summary, triggers);
  if (nodes.automationTriggerSummary) {
    nodes.automationTriggerSummary.textContent = summary.running
      ? `${summary.running}개 실행`
      : summary.readinessBlocked
        ? `점검 ${summary.readinessBlocked}개`
      : summary.enabled
        ? `${summary.enabled}/${summary.total || triggers.length} 활성`
        : "대기";
  }
  if (nodes.automationTriggerStatus) {
    nodes.automationTriggerStatus.textContent = summary.attention
      ? `확인 필요 ${summary.attention}개`
      : summary.readinessBlocked
        ? `활성화 점검 필요 ${summary.readinessBlocked}개`
      : summary.retrying
        ? `재시도 대기 ${summary.retrying}개`
      : summary.enabled
        ? "자동화 준비"
        : "필요할 때 켜기";
  }
  if (!nodes.automationTriggerList) return;
  nodes.automationTriggerList.innerHTML = triggers.length
    ? triggers.map(renderAutomationTriggerCard).join("")
    : '<div class="empty">등록된 자동화 트리거가 없습니다.</div>';
}

function renderAutomationTriggerPreview(preview = {}) {
  const typeLabel = preview.type === "folder_watch" ? "폴더 감시" : "예약";
  const scheduleText = preview.schedule
    ? preview.schedule.kind === "interval"
      ? `${preview.schedule.everyMinutes || 0}분 간격`
      : `매일 ${preview.schedule.time || "09:00"}`
    : "";
  const watchText = preview.watch
    ? [
      preview.watch.folder || "00_Inbox",
      (preview.watch.patterns || []).join(", "),
      preview.watchResolved ? (preview.watchResolved.ok ? "폴더 확인됨" : `확인 필요: ${preview.watchResolved.reason || "폴더 상태 불명"}`) : ""
    ].filter(Boolean).join(" · ")
    : "";
  if (nodes.chatResultMode) nodes.chatResultMode.textContent = "자동화 미리보기";
  if (nodes.chatRunMeta) nodes.chatRunMeta.textContent = `${preview.title || preview.id || "트리거"} · 실제 실행 안 함`;
  if (nodes.chatResultPreview) {
    nodes.chatResultPreview.textContent = [
      "# 자동화 트리거 미리보기",
      "",
      `- 트리거: ${preview.title || preview.id || "이름 없음"}`,
      `- 유형: ${typeLabel}`,
      `- 상태: ${preview.enabled ? "활성" : "비활성"}`,
      `- 이벤트: ${preview.event || "manual"}`,
      "- 실제 실행: 하지 않음",
      scheduleText ? `- 예약: ${scheduleText}` : "",
      watchText ? `- 감시: ${watchText}` : "",
      "",
      "## 실행 메시지",
      preview.message || "(비어 있음)"
    ].filter(Boolean).join("\n");
  }
  if (nodes.automationTriggerStatus) nodes.automationTriggerStatus.textContent = "미리보기 완료";
}

function resetAutomationTriggerForm() {
  if (!nodes.automationTriggerForm) return;
  nodes.automationTriggerId.value = "";
  nodes.automationTriggerTitle.value = "";
  nodes.automationTriggerType.value = "schedule";
  nodes.automationTriggerTime.value = "09:00";
  nodes.automationTriggerFolder.value = "00_Inbox";
  nodes.automationTriggerPatterns.value = "*.md";
  nodes.automationTriggerMessage.value = "";
  nodes.automationTriggerEnabled.checked = false;
  if (nodes.automationTriggerChannel) nodes.automationTriggerChannel.checked = false;
  nodes.automationTriggerForm.classList.remove("editing");
}

function fillAutomationTriggerForm(trigger) {
  if (!nodes.automationTriggerForm || !trigger) return;
  nodes.automationTriggerId.value = trigger.id || "";
  nodes.automationTriggerTitle.value = trigger.title || "";
  nodes.automationTriggerType.value = trigger.type || "schedule";
  nodes.automationTriggerTime.value = trigger.schedule?.time || "09:00";
  nodes.automationTriggerFolder.value = trigger.watch?.folder || "00_Inbox";
  nodes.automationTriggerPatterns.value = (trigger.watch?.patterns || ["*.md"]).join(", ");
  nodes.automationTriggerMessage.value = trigger.message || "";
  nodes.automationTriggerEnabled.checked = trigger.enabled === true;
  if (nodes.automationTriggerChannel) nodes.automationTriggerChannel.checked = trigger.sendToChannel === true;
  nodes.automationTriggerForm.classList.add("editing");
  nodes.automationTriggerTitle.focus();
}

async function updateAutomationTriggerConfig(payload) {
  if (nodes.automationTriggerStatus) {
    nodes.automationTriggerStatus.textContent = payload.action === "preview"
      ? "자동화 미리보기 중"
      : payload.action === "run"
        ? "수동 실행 중"
        : "자동화 설정 저장 중";
  }
  const response = await apiFetch("/api/automation-triggers", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok || data.ok === false) throw new Error(data.error || "자동화 설정 저장 실패");
  renderAutomationTriggersState(data);
  if (data.preview) renderAutomationTriggerPreview(data.preview);
  else if (nodes.automationTriggerStatus) nodes.automationTriggerStatus.textContent = "자동화 설정 반영됨";
  return data;
}

async function loadAutomationTriggersState() {
  if (!nodes.automationTriggerList) return;
  try {
    const response = await apiFetch("/api/automation-triggers", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
    renderAutomationTriggersState(data);
  } catch (error) {
    if (nodes.automationTriggerStatus) nodes.automationTriggerStatus.textContent = "로드 실패";
    nodes.automationTriggerList.innerHTML = `<div class="empty">자동화 트리거 로드 실패: ${escapeHtml(error.message)}</div>`;
  }
}

async function handleAutomationTriggerSubmit(event) {
  event.preventDefault();
  try {
    await updateAutomationTriggerConfig({
      action: "save",
      trigger: {
        id: nodes.automationTriggerId.value,
        title: nodes.automationTriggerTitle.value,
        type: nodes.automationTriggerType.value,
        enabled: nodes.automationTriggerEnabled.checked,
        sendToChannel: nodes.automationTriggerChannel?.checked === true,
        message: nodes.automationTriggerMessage.value,
        schedule: { kind: "daily", time: nodes.automationTriggerTime.value || "09:00" },
        watch: {
          folder: nodes.automationTriggerFolder.value || "00_Inbox",
          patterns: nodes.automationTriggerPatterns.value || "*.md",
          debounceSeconds: 20
        }
      }
    });
    resetAutomationTriggerForm();
  } catch (error) {
    if (nodes.automationTriggerStatus) nodes.automationTriggerStatus.textContent = `저장 실패: ${error.message}`;
  }
}

async function handleAutomationTriggerClick(event) {
  const button = event.target.closest("button[data-trigger-action]");
  if (!button || !nodes.automationTriggerList?.contains(button)) return;
  const action = button.dataset.triggerAction;
  const id = button.dataset.triggerId || "";
  const trigger = (automationTriggersState.triggers || []).find((item) => item.id === id);
  if (action === "edit") return fillAutomationTriggerForm(trigger);
  if (action === "run") {
    const title = trigger?.title || id || "자동화 트리거";
    const confirmed = window.confirm(`"${title}" 트리거를 실제로 수동 실행합니다.\n\n이 작업은 채팅 라우터를 호출하고 작업 큐나 Vault 기록을 변경할 수 있습니다.`);
    if (!confirmed) {
      if (nodes.automationTriggerStatus) nodes.automationTriggerStatus.textContent = "수동 실행 취소됨";
      return;
    }
  }
  button.disabled = true;
  try {
    if (action === "toggle") await updateAutomationTriggerConfig({ action: "toggle", id, enabled: button.dataset.enabled === "true" });
    if (action === "delete") await updateAutomationTriggerConfig({ action: "delete", id });
    if (action === "preview") await updateAutomationTriggerConfig({ action: "preview", id });
    if (action === "run") {
      const data = await updateAutomationTriggerConfig({ action: "run", id });
      await loadTaskQueue({ resume: false });
      if (nodes.automationTriggerStatus) {
        nodes.automationTriggerStatus.textContent = data.runResult?.ok === false
          ? `수동 실행 실패: ${data.runResult.error || data.runResult.reason || "오류"}`
          : "수동 실행을 시작했습니다.";
      }
    }
  } catch (error) {
    if (nodes.automationTriggerStatus) nodes.automationTriggerStatus.textContent = `실행 실패: ${error.message}`;
  } finally {
    button.disabled = false;
  }
}

function renderChannelsState(state = channelsState) {
  channelsState = state || { channels: [], summary: {} };
  const channels = Array.isArray(channelsState.channels) ? channelsState.channels : [];
  const connected = channels.filter((channel) => channel.connected);
  if (nodes.channelStatus) {
    nodes.channelStatus.textContent = connected.length
      ? `${connected.length}개 연결됨`
      : channels.length ? "끊김" : "미등록";
  }
  if (nodes.channelSendBtn) nodes.channelSendBtn.disabled = !connected.length;
  if (!nodes.channelList) return;
  if (!channels.length) {
    nodes.channelList.innerHTML = '<div class="empty">등록된 채널이 없습니다.</div>';
    return;
  }
  nodes.channelList.innerHTML = channels.map((channel) => `
    <article class="channel-item ${escapeHtml(channel.tone || "muted")}">
      <div>
        <strong>${escapeHtml(channel.name || channel.id)}</strong>
        <span>${escapeHtml(channel.connected ? "연결됨" : "끊김")}${channel.maskedIdentifier ? ` · ${escapeHtml(channel.maskedIdentifier)}` : ""}</span>
        <small>${escapeHtml(channel.detail || "")}</small>
      </div>
      <b>${escapeHtml(channel.statusLabel || channel.status || "")}</b>
    </article>
  `).join("");
}

async function loadChannelsState() {
  if (!nodes.channelList) return null;
  try {
    if (nodes.channelStatus) nodes.channelStatus.textContent = "확인 중";
    const response = await apiFetch("/api/channels", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok || data.ok === false) throw new Error(data.error || `HTTP ${response.status}`);
    renderChannelsState(data);
    return data;
  } catch (error) {
    if (nodes.channelStatus) nodes.channelStatus.textContent = "로드 실패";
    nodes.channelList.innerHTML = `<div class="empty">채널 상태 로드 실패: ${escapeHtml(error.message)}</div>`;
    return null;
  }
}

async function handleChannelSend(event) {
  event.preventDefault();
  const channel = (channelsState.channels || []).find((item) => item.connected);
  const text = (nodes.channelSendText?.value || "").trim() || "YOMI Office 채널 연결 점검";
  if (!channel?.id) {
    if (nodes.channelStatus) nodes.channelStatus.textContent = "연결된 채널 없음";
    return;
  }
  if (nodes.channelSendBtn) nodes.channelSendBtn.disabled = true;
  try {
    if (nodes.channelStatus) nodes.channelStatus.textContent = "발송 중";
    const response = await apiFetch(`/api/channels/${encodeURIComponent(channel.id)}/send`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text })
    });
    const data = await response.json();
    if (!response.ok || data.ok === false) throw new Error(data.error || `HTTP ${response.status}`);
    if (nodes.channelStatus) nodes.channelStatus.textContent = "발송 성공";
    if (nodes.channelSendText) nodes.channelSendText.value = "";
    await loadChannelsState();
  } catch (error) {
    if (nodes.channelStatus) nodes.channelStatus.textContent = `발송 실패: ${error.message}`;
  } finally {
    if (nodes.channelSendBtn) nodes.channelSendBtn.disabled = !(channelsState.channels || []).some((item) => item.connected);
  }
}

function renderDashboardAgentCounts(agentCounts = []) {
  if (!nodes.dashboardAgentCounts) return;
  const active = agentCounts.filter((agent) => agent.count > 0).sort((a, b) => b.count - a.count).slice(0, 8);
  if (!active.length) {
    nodes.dashboardAgentCounts.innerHTML = '<div class="agent-metric empty">직원별 처리 기록 대기</div>';
    return;
  }
  nodes.dashboardAgentCounts.innerHTML = active.map((agent) => `<div class="agent-metric"><span>${escapeHtml(agent.name)}</span><strong>${agent.count}</strong></div>`).join("");
}

function ragModeLabel(mode = "") {
  if (mode === "semantic_hybrid") return "시맨틱+BM25";
  if (mode === "bm25_keyword") return "BM25+키워드";
  if (mode === "not_indexed") return "인덱스 대기";
  if (mode === "disconnected") return "Vault 대기";
  return mode || "확인 중";
}

function renderRagState(rag = {}) {
  const connected = rag.connected !== false;
  const mode = ragModeLabel(rag.embeddingMode || rag.mode);
  const docs = Number(rag.documentCount || 0);
  const chunks = Number(rag.chunkCount || 0);
  const excluded = Number(rag.excludedDocumentCount || rag.stats?.excludedDocumentCount || 0);
  const last = rag.lastIndexedAt ? formatShortTime(rag.lastIndexedAt) : "미실행";
  if (nodes.ragStatus) nodes.ragStatus.textContent = connected ? mode : "Vault 대기";
  if (nodes.ragMeta) nodes.ragMeta.textContent = `${docs}문서 · ${chunks}청크${excluded ? ` · 제외 ${excluded}` : ""} · ${last}`;
  if (nodes.ragIndexSummary) nodes.ragIndexSummary.textContent = rag.dirty ? "갱신 필요" : mode;
  if (nodes.ragIndexStats) {
    nodes.ragIndexStats.innerHTML = [
      ["문서", docs],
      ["청크", chunks],
      ["제외", excluded],
      ["최근 변경", Number(rag.changedDocumentCount || 0)],
      ["임베딩", mode],
      ["마지막", last]
    ].map(([label, value]) => `<div class="vault-stat"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("");
  }
}

function ragExclusionReasonLabel(reason = "") {
  return ({
    "frontmatter rag/index false": "frontmatter에서 RAG 제외",
    "auto-generated command/test title": "명령어형/테스트성 자동 저장",
    "encoding-noisy title": "깨진 제목/인코딩 의심",
    "tagged as non-rag": "no-rag 태그",
    "quality quarantine": "격리 품질",
    "quality test": "테스트 품질"
  })[reason] || reason || "제외";
}

function renderRagExclusionsState(state = {}) {
  if (!nodes.ragQualityList) return;
  const rows = Array.isArray(state.exclusions) ? state.exclusions : [];
  const excludedCount = Number(state.excludedCount || rows.length || 0);
  if (nodes.ragQualityStatus) {
    nodes.ragQualityStatus.textContent = excludedCount ? `${excludedCount}개 제외` : "제외 없음";
  }
  if (!rows.length) {
    nodes.ragQualityList.innerHTML = '<div class="empty">RAG에서 제외된 문서가 없습니다.</div>';
    return;
  }
  nodes.ragQualityList.innerHTML = rows.slice(0, 12).map((item) => `
    <article class="rag-quality-item">
      <strong>${escapeHtml(item.title || "문서")}</strong>
      <span>${escapeHtml(ragExclusionReasonLabel(item.reason))} · ${escapeHtml(item.quality || "excluded")}</span>
      <small>${escapeHtml(item.displayPath || item.relPath || "")}</small>
      <div class="rag-quality-actions">
        <button type="button" data-rag-quality-action="promote" data-rel-path="${escapeHtml(item.relPath || "")}">RAG 살리기</button>
        <button type="button" data-rag-quality-action="quarantine" data-rel-path="${escapeHtml(item.relPath || "")}">격리 유지</button>
      </div>
    </article>
  `).join("");
}

async function loadRagExclusions() {
  if (!nodes.ragQualityList) return null;
  try {
    if (nodes.ragQualityStatus) nodes.ragQualityStatus.textContent = "확인 중";
    const response = await apiFetch("/api/rag/exclusions?limit=30", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok || data.ok === false) throw new Error(data.error || `HTTP ${response.status}`);
    renderRagExclusionsState(data);
    return data;
  } catch (error) {
    if (nodes.ragQualityStatus) nodes.ragQualityStatus.textContent = "로드 실패";
    nodes.ragQualityList.innerHTML = `<div class="empty">RAG 제외 대상 로드 실패: ${escapeHtml(error.message)}</div>`;
    return null;
  }
}

async function updateRagQualityAction(action, relPath, button) {
  if (!action || !relPath) return;
  const message = action === "promote"
    ? "이 문서에 rag:true / quality: verified를 붙여 RAG 재포함 대상으로 바꿉니다. 실제 인덱스 반영은 이후 인덱스 갱신이 필요합니다. 진행할까요?"
    : "이 문서에 rag:false / quality: quarantine을 명시해 격리 상태를 유지합니다. 진행할까요?";
  if (!window.confirm(message)) return;
  if (button) button.disabled = true;
  try {
    if (nodes.ragQualityStatus) nodes.ragQualityStatus.textContent = "수정 중";
    const response = await apiFetch("/api/rag/exclusions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, relPath, limit: 30 })
    });
    const data = await response.json();
    if (!response.ok || data.ok === false) throw new Error(data.error || `HTTP ${response.status}`);
    renderRagExclusionsState(data.state || {});
    if (nodes.ragIndexSummary && data.needsReindex) nodes.ragIndexSummary.textContent = "인덱스 갱신 필요";
    if (nodes.ragQualityStatus) nodes.ragQualityStatus.textContent = data.needsReindex ? "수정 완료 · 인덱스 갱신 필요" : "수정 완료";
  } catch (error) {
    if (nodes.ragQualityStatus) nodes.ragQualityStatus.textContent = `수정 실패: ${error.message}`;
  } finally {
    if (button) button.disabled = false;
  }
}

function handleRagQualityClick(event) {
  const button = event.target.closest("button[data-rag-quality-action]");
  if (!button || !nodes.ragQualityList?.contains(button)) return;
  updateRagQualityAction(button.dataset.ragQualityAction || "", button.dataset.relPath || "", button);
}

function quarantineReasonLabel(reason = "") {
  return ({
    "command-or-low-value-autosave": "명령형/저가치 자동 저장",
    "requested-quarantine": "요청 격리",
    "encoding-noisy-title": "깨진 제목 의심",
    "manual-review": "수동 검토",
    "quality quarantine": "격리 품질"
  })[reason] || reason || "격리";
}

function renderQuarantineState(state = quarantineState) {
  quarantineState = state || { documents: [], summary: {} };
  const docs = Array.isArray(quarantineState.documents) ? quarantineState.documents : [];
  const summary = quarantineState.summary || {};
  if (nodes.quarantineStatus) {
    nodes.quarantineStatus.textContent = quarantineState.connected === false
      ? "Vault 대기"
      : docs.length
        ? `${Number(summary.total || docs.length)}건`
        : "비어 있음";
  }
  if (!nodes.quarantineList) return;
  if (!docs.length) {
    nodes.quarantineList.innerHTML = '<div class="empty">격리 문서가 없습니다.</div>';
    return;
  }
  nodes.quarantineList.innerHTML = docs.slice(0, 12).map((doc) => `
    <article class="quarantine-item">
      <div>
        <strong>${escapeHtml(doc.title || "격리 문서")}</strong>
        <span>품질 ${Number(doc.qualityScore || 0)}점 · ${escapeHtml(quarantineReasonLabel(doc.reason))}</span>
        <small>${escapeHtml(doc.displayPath || doc.relPath || "")}</small>
      </div>
      <div class="quarantine-actions">
        <button type="button" data-quarantine-action="promote" data-rel-path="${escapeHtml(doc.relPath || "")}">승격</button>
        <button type="button" data-quarantine-action="discard" data-rel-path="${escapeHtml(doc.relPath || "")}">보관</button>
      </div>
    </article>
  `).join("");
}

async function loadQuarantineState() {
  if (!nodes.quarantineList) return null;
  try {
    if (nodes.quarantineStatus) nodes.quarantineStatus.textContent = "확인 중";
    const response = await apiFetch("/api/quarantine?limit=30", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok || data.ok === false) throw new Error(data.error || `HTTP ${response.status}`);
    renderQuarantineState(data);
    return data;
  } catch (error) {
    if (nodes.quarantineStatus) nodes.quarantineStatus.textContent = "로드 실패";
    nodes.quarantineList.innerHTML = `<div class="empty">격리 문서 로드 실패: ${escapeHtml(error.message)}</div>`;
    return null;
  }
}

async function updateQuarantineAction(action, relPath, button) {
  if (!action || !relPath) return;
  const confirmed = window.confirm(action === "promote"
    ? "이 격리 문서를 RAG 포함 문서로 승격하고 50_Outputs로 이동합니다. 진행할까요?"
    : "이 격리 문서를 삭제하지 않고 archived:true로 보관 폴더에 이동합니다. 진행할까요?");
  if (!confirmed) return;
  if (button) button.disabled = true;
  try {
    if (nodes.quarantineStatus) nodes.quarantineStatus.textContent = action === "promote" ? "승격 중" : "보관 중";
    const response = await apiFetch("/api/quarantine", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, relPath, reason: "archived-from-quarantine-ui", limit: 30 })
    });
    const data = await response.json();
    if (!response.ok || data.ok === false) throw new Error(data.error || `HTTP ${response.status}`);
    renderQuarantineState(data.state || {});
    if (data.rag) renderRagState(data.rag);
    if (nodes.quarantineStatus) nodes.quarantineStatus.textContent = data.needsReindex ? "처리 완료 · 인덱스 갱신 필요" : "처리 완료";
    await loadRagExclusions();
  } catch (error) {
    if (nodes.quarantineStatus) nodes.quarantineStatus.textContent = `처리 실패: ${error.message}`;
  } finally {
    if (button) button.disabled = false;
  }
}

function handleQuarantineClick(event) {
  const button = event.target.closest("button[data-quarantine-action]");
  if (!button || !nodes.quarantineList?.contains(button)) return;
  updateQuarantineAction(button.dataset.quarantineAction || "", button.dataset.relPath || "", button);
}

function renderApiDiagnostics(rows = []) {
  if (!nodes.apiDiagnosticList) return;
  nodes.apiDiagnosticList.innerHTML = rows.map((row) => `
    <div class="api-diagnostic-row ${escapeHtml(row.tone || "")}">
      <span>${escapeHtml(row.label)}</span>
      <strong>${escapeHtml(row.status)}</strong>
      <small>${escapeHtml(row.detail || "")}</small>
    </div>
  `).join("");
}

function summarizeDiagnostic(pathValue, data = {}) {
  if (pathValue === "/api/health") return data.ok ? "서버 응답 정상" : "서버 응답 이상";
  if (pathValue === "/api/rag") {
    const status = data.status || data;
    const excluded = Number(status.excludedDocumentCount || data.stats?.excludedDocumentCount || 0);
    return `${Number(status.documentCount || data.documentCount || 0)}문서 · ${Number(status.chunkCount || data.chunkCount || 0)}청크${excluded ? ` · 제외 ${excluded}` : ""} · ${status.embeddingMode || data.embedding?.mode || data.mode || "unknown"}`;
  }
  if (pathValue === "/api/profile") {
    const profile = data.profile || {};
    return `${profile.enabled !== false ? "프로필 켜짐" : "프로필 꺼짐"} · ${profileMemorySummary(profile, data.counts)}`;
  }
  if (pathValue === "/api/connections") {
    const summary = data.summary || {};
    return `정상 ${Number(summary.normal || 0)}개 · 주의 ${Number(summary.attention || 0)}개 · 선택 ${Number(summary.optional || 0)}개 · 모델 ${Number(summary.modelReady || 0)}/${Number(summary.modelTotal || 0)} · 리서치 ${Number(summary.researchReady || 0)}/${Number(summary.researchTotal || 0)}`;
  }
  if (pathValue.startsWith("/api/vault-overview")) {
    return `그래프 ${data.graph?.nodes?.length || 0}노드 · ${data.graph?.edges?.length || 0}연결`;
  }
  if (pathValue === "/api/chat-sessions") return `세션 ${Array.isArray(data.sessions) ? data.sessions.length : 0}개`;
  return "JSON 응답 정상";
}

function diagnosticTone(pathValue, data = {}, ok = false) {
  if (!ok) return "bad";
  if (pathValue === "/api/connections" && Number(data.summary?.attention || 0) > 0) return "warn";
  return "ok";
}

async function runApiDiagnostics() {
  if (!nodes.apiDiagnosticList) return;
  const checks = [
    { label: "Health", path: "/api/health" },
    { label: "연결", path: "/api/connections" },
    { label: "RAG", path: "/api/rag" },
    { label: "프로필", path: "/api/profile" },
    { label: "Vault 그래프", path: "/api/vault-overview?limit=3" },
    { label: "대화 세션", path: "/api/chat-sessions" }
  ];
  const rows = [
    { label: "화면 Origin", status: "현재", detail: window.location.origin, tone: "info" },
    { label: "API Base", status: apiBaseUrl ? "분리" : "동일", detail: displayApiBase(), tone: apiBaseUrl ? "warn" : "ok" }
  ];
  renderApiDiagnostics(rows);
  if (nodes.apiDiagnosticStatus) nodes.apiDiagnosticStatus.textContent = "점검 중";
  for (const check of checks) {
    try {
      const response = await apiFetch(check.path, { cache: "no-store" });
      const text = await response.text();
      let data = null;
      try {
        data = JSON.parse(text);
      } catch {
        rows.push({ label: check.label, status: `HTTP ${response.status}`, detail: text.slice(0, 120), tone: "bad" });
        renderApiDiagnostics(rows);
        continue;
      }
      const ok = response.ok && data.ok !== false;
      const tone = diagnosticTone(check.path, data, ok);
      rows.push({ label: check.label, status: ok ? (tone === "warn" ? "주의" : "정상") : `HTTP ${response.status}`, detail: summarizeDiagnostic(check.path, data), tone });
    } catch (error) {
      rows.push({ label: check.label, status: "실패", detail: error.message, tone: "bad" });
    }
    renderApiDiagnostics(rows);
  }
  const badCount = rows.filter((row) => row.tone === "bad").length;
  const warnCount = rows.filter((row) => row.tone === "warn").length;
  if (nodes.apiDiagnosticStatus) nodes.apiDiagnosticStatus.textContent = badCount ? `문제 ${badCount}개` : warnCount ? `주의 ${warnCount}개` : "정상";
}

async function runResearchLiveProbe() {
  if (!nodes.researchProbeBtn) return;
  const confirmed = window.confirm("Exa, Firecrawl, Tavily에 최소 라이브 요청을 보내 연결을 확인합니다. 외부 API 쿼터나 비용이 사용될 수 있습니다. 진행할까요?");
  if (!confirmed) return;
  nodes.researchProbeBtn.disabled = true;
  if (nodes.apiDiagnosticStatus) nodes.apiDiagnosticStatus.textContent = "리서치 라이브 점검 중";
  renderApiDiagnostics([{ label: "리서치 라이브", status: "진행 중", detail: "외부 API 최소 요청을 실행합니다. 키 값은 표시하지 않습니다.", tone: "warn" }]);
  try {
    const response = await apiFetch("/api/research-probes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ providers: ["exa", "firecrawl", "tavily"] })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
    const summary = data.summary || {};
    const tone = summary.failed ? "bad" : summary.keyRequired ? "warn" : "ok";
    const rows = [
      {
        label: "리서치 라이브",
        status: summary.failed ? "문제" : summary.keyRequired ? "키 필요" : "완료",
        detail: `성공 ${Number(summary.ok || 0)}/${Number(summary.total || 0)} · 실패 ${Number(summary.failed || 0)} · 키 필요 ${Number(summary.keyRequired || 0)}`,
        tone
      },
      ...(data.probes || []).map((probe) => ({
        label: probe.label || probe.id,
        status: probe.statusLabel || probe.status || "확인",
        detail: `${probe.detail || ""}${probe.latencyMs ? ` · ${probe.latencyMs}ms` : ""}`,
        tone: probe.tone || "warn"
      }))
    ];
    renderApiDiagnostics(rows);
    if (nodes.apiDiagnosticStatus) nodes.apiDiagnosticStatus.textContent = tone === "bad" ? "라이브 문제" : tone === "warn" ? "라이브 주의" : "라이브 정상";
  } catch (error) {
    renderApiDiagnostics([{ label: "리서치 라이브", status: "실패", detail: error.message, tone: "bad" }]);
    if (nodes.apiDiagnosticStatus) nodes.apiDiagnosticStatus.textContent = "라이브 실패";
  } finally {
    nodes.researchProbeBtn.disabled = false;
  }
}

async function handleRagReindex() {
  if (!nodes.ragReindexBtn) return;
  nodes.ragReindexBtn.disabled = true;
  if (nodes.ragIndexSummary) nodes.ragIndexSummary.textContent = "인덱싱 중";
  try {
    const embeddings = window.confirm("임베딩 API 키가 있으면 시맨틱 인덱싱 중 API 비용/쿼터가 사용될 수 있습니다. 시맨틱 인덱싱으로 갱신할까요?\n\n취소를 누르면 비용 없는 BM25+키워드 인덱스만 갱신합니다.");
    const response = await apiFetch("/api/rag/index", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ force: true, embeddings })
    });
    const data = await response.json();
    if (!response.ok || data.ok === false) throw new Error(data.error || `HTTP ${response.status}`);
    renderRagState(data.status || {});
    await loadRagExclusions();
    await refreshState();
  } catch (error) {
    if (nodes.ragIndexSummary) nodes.ragIndexSummary.textContent = `실패: ${error.message}`;
  } finally {
    nodes.ragReindexBtn.disabled = false;
  }
}

function renderRagSearchResults(data = {}) {
  if (!nodes.ragSearchResults) return;
  const results = Array.isArray(data.results) ? data.results : [];
  if (!results.length) {
    nodes.ragSearchResults.innerHTML = `<div class="empty">검색 결과가 없습니다. 다른 키워드나 더 구체적인 표현으로 다시 확인하세요.</div>`;
    return;
  }
  const meta = `${ragModeLabel(data.mode)} · ${results.length}개`;
  nodes.ragSearchResults.innerHTML = [
    `<div class="rag-search-meta">${escapeHtml(meta)}</div>`,
    ...results.map((item) => `
      <article class="rag-search-result">
        <strong>${escapeHtml(item.title || "문서")}</strong>
        <span>${escapeHtml(item.displayPath || item.relPath || "")}</span>
        <p>${escapeHtml(item.excerpt || "")}</p>
        <small>score ${escapeHtml(item.score ?? "")} · keyword ${escapeHtml(item.keywordScore ?? "")} · semantic ${escapeHtml(item.semanticScore ?? "")}</small>
      </article>
    `)
  ].join("");
}

async function handleRagSearch() {
  const query = String(nodes.ragSearchInput?.value || "").trim();
  if (!nodes.ragSearchResults) return;
  if (!query) {
    nodes.ragSearchResults.innerHTML = `<div class="empty">검색어를 입력하면 RAG 근거 문서를 확인합니다.</div>`;
    return;
  }
  if (nodes.ragSearchBtn) nodes.ragSearchBtn.disabled = true;
  nodes.ragSearchResults.innerHTML = `<div class="empty">RAG 검색 중...</div>`;
  try {
    const response = await apiFetch(`/api/rag/search?q=${encodeURIComponent(query)}&k=5`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok || data.ok === false) throw new Error(data.error || `HTTP ${response.status}`);
    renderRagSearchResults(data);
  } catch (error) {
    nodes.ragSearchResults.innerHTML = `<div class="empty">검색 실패: ${escapeHtml(error.message)}</div>`;
  } finally {
    if (nodes.ragSearchBtn) nodes.ragSearchBtn.disabled = false;
  }
}

function renderVaultStats(counts = {}) {
  const rows = [["요미오피스 보고서", counts.webOfficeReports ?? 0], ["자동 수집", counts.autoCaptures ?? 0], ["초안", counts.knowledgeDrafts ?? 0], ["자동 요약", counts.autoDigests ?? 0], ["일일 리뷰", counts.dailyReviews ?? 0]];
  nodes.vaultStats.innerHTML = rows.map(([label, value]) => `<div class="vault-stat"><span>${escapeHtml(label)}</span><strong>${value}</strong></div>`).join("");
}

function renderVaultChips(container, rows = [], emptyText = "표시할 항목이 없습니다.") {
  if (!container) return;
  if (!rows.length) {
    container.innerHTML = `<div class="empty">${escapeHtml(emptyText)}</div>`;
    return;
  }
  container.innerHTML = rows.map((row) => `<div class="vault-chip"><span>${escapeHtml(row.label)}</span><strong>${escapeHtml(row.count)}</strong></div>`).join("");
}

function shortGraphLabel(value) {
  const text = String(value || "");
  return text.length > 16 ? `${text.slice(0, 15)}...` : text;
}

const vaultGraphPalette = ["#41f27a", "#7dd3fc", "#fbbf24", "#f472b6", "#a78bfa", "#fb7185", "#34d399", "#f97316"];

function vaultGraphGroupKey(node = {}) {
  const folder = String(node.folder || "").trim();
  if (folder) return folder;
  const tags = Array.isArray(node.tags) ? node.tags.filter(Boolean) : [];
  return tags[0] || "Vault";
}

function vaultGraphGroupLabel(value = "") {
  const text = String(value || "Vault");
  return text.length > 18 ? `${text.slice(0, 17)}...` : text;
}

function renderVaultGraphLegend(groups = []) {
  if (!nodes.vaultGraphLegend) return;
  if (!groups.length) {
    nodes.vaultGraphLegend.innerHTML = "";
    return;
  }
  nodes.vaultGraphLegend.innerHTML = groups.slice(0, 6).map((group) => `
    <span><i style="background:${escapeHtml(group.color)}"></i>${escapeHtml(vaultGraphGroupLabel(group.key))}<b>${Number(group.count || 0)}</b></span>
  `).join("");
}

function forceGraphLayout(graphNodes = [], graphEdges = [], width = 960, height = 520) {
  const degree = new Map(graphNodes.map((node) => [node.id, 0]));
  const validEdges = graphEdges.filter((edge) => degree.has(edge.source) && degree.has(edge.target));
  for (const edge of validEdges) {
    degree.set(edge.source, (degree.get(edge.source) || 0) + 1);
    degree.set(edge.target, (degree.get(edge.target) || 0) + 1);
  }
  const cx = width / 2;
  const cy = height / 2;
  const degreeValues = [...degree.values()];
  const minDegree = Math.min(...degreeValues);
  const maxDegree = Math.max(...degreeValues);
  const nodes = graphNodes.map((node, index) => {
    const angle = index * 2.399963229728653;
    const radius = 90 + 22 * Math.sqrt(index + 1);
    const nodeDegree = degree.get(node.id) || 0;
    const degreeT = maxDegree === minDegree ? 0.45 : (nodeDegree - minDegree) / Math.max(1, maxDegree - minDegree);
    return {
      ...node,
      degree: nodeDegree,
      r: 8 + Math.pow(Math.max(0, degreeT), 0.72) * 20,
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
      vx: 0,
      vy: 0
    };
  });
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const links = validEdges.map((edge) => ({ ...edge, sourceNode: byId.get(edge.source), targetNode: byId.get(edge.target) })).filter((edge) => edge.sourceNode && edge.targetNode);
  for (let tick = 0; tick < 420; tick += 1) {
    const alpha = 1 - tick / 420;
    for (let i = 0; i < nodes.length; i += 1) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j += 1) {
        const b = nodes[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let dist2 = dx * dx + dy * dy;
        if (dist2 < 1) {
          dx = (i + 1) * 0.01;
          dy = (j + 1) * 0.01;
          dist2 = dx * dx + dy * dy;
        }
        const dist = Math.sqrt(dist2);
        const minDist = a.r + b.r + 22;
        const repel = Math.min(68, 2600 / dist2) * alpha;
        const rx = (dx / dist) * repel;
        const ry = (dy / dist) * repel;
        a.vx -= rx;
        a.vy -= ry;
        b.vx += rx;
        b.vy += ry;
        if (dist < minDist) {
          const push = ((minDist - dist) / Math.max(dist, 1)) * 0.16 * alpha;
          a.vx -= dx * push;
          a.vy -= dy * push;
          b.vx += dx * push;
          b.vy += dy * push;
        }
      }
    }
    for (const link of links) {
      const source = link.sourceNode;
      const target = link.targetNode;
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
      const desired = 118 + Math.max(0, 6 - Math.min(source.degree, target.degree)) * 9;
      const pull = (dist - desired) * 0.0055 * alpha;
      const px = (dx / dist) * pull;
      const py = (dy / dist) * pull;
      source.vx += px;
      source.vy += py;
      target.vx -= px;
      target.vy -= py;
    }
    for (const node of nodes) {
      node.vx += (cx - node.x) * 0.0025 * alpha;
      node.vy += (cy - node.y) * 0.0025 * alpha;
      node.vx *= 0.84;
      node.vy *= 0.84;
      node.x = Math.max(56, Math.min(width - 56, node.x + node.vx));
      node.y = Math.max(56, Math.min(height - 62, node.y + node.vy));
    }
  }
  if (nodes.length > 1) {
    const minX = Math.min(...nodes.map((node) => node.x));
    const maxX = Math.max(...nodes.map((node) => node.x));
    const minY = Math.min(...nodes.map((node) => node.y));
    const maxY = Math.max(...nodes.map((node) => node.y));
    const currentW = Math.max(1, maxX - minX);
    const currentH = Math.max(1, maxY - minY);
    const scale = Math.min(1.55, Math.max(1, Math.min((width * 0.72) / currentW, (height * 0.66) / currentH)));
    for (const node of nodes) {
      node.x = cx + (node.x - cx) * scale;
      node.y = cy + (node.y - cy) * scale;
      node.x = Math.max(58, Math.min(width - 58, node.x));
      node.y = Math.max(58, Math.min(height - 64, node.y));
    }
    for (let pass = 0; pass < 90; pass += 1) {
      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
          const minDist = a.r + b.r + 13;
          if (dist >= minDist) continue;
          const push = (minDist - dist) / 2;
          const px = (dx / dist) * push;
          const py = (dy / dist) * push;
          a.x = Math.max(58, Math.min(width - 58, a.x - px));
          a.y = Math.max(58, Math.min(height - 64, a.y - py));
          b.x = Math.max(58, Math.min(width - 58, b.x + px));
          b.y = Math.max(58, Math.min(height - 64, b.y + py));
        }
      }
    }
  }
  return { nodes, links, degree };
}

function renderVaultGraphDetail(node = null, neighbors = []) {
  if (!nodes.vaultGraphDetail) return;
  if (!node) {
    nodes.vaultGraphDetail.innerHTML = '<div class="detail-empty"><strong>그래프 노드를 선택하세요</strong><span>문서 연결, 폴더, 태그 요약이 여기에 표시됩니다.</span></div>';
    return;
  }
  nodes.vaultGraphDetail.innerHTML = `
    <div class="detail-head">
      <span class="detail-kicker">${escapeHtml(node.folder || "Vault")}</span>
      <h2>${escapeHtml(node.title || node.id)}</h2>
      <p>${escapeHtml(node.relPath || node.displayPath || "")}</p>
    </div>
    <div class="detail-score-row"><b>${Number(node.degree || 0)} 연결</b><span>${neighbors.length ? `${neighbors.length}개 이웃 문서` : "직접 연결 없음"}</span></div>
    <div class="detail-section">
      <strong>이웃 문서</strong>
      ${neighbors.length ? `<div class="detail-chip-list">${neighbors.slice(0, 10).map((item) => `<span>${escapeHtml(shortGraphLabel(item.title || item.id))}</span>`).join("")}</div>` : "<p>연결된 문서가 없습니다.</p>"}
    </div>
  `;
}

function renderVaultGraph(graph = {}) {
  if (!nodes.vaultGraph) return;
  const graphNodes = (graph.nodes || []).slice(0, 28);
  const graphEdges = graph.edges || [];
  if (!graphNodes.length) {
    nodes.vaultGraph.innerHTML = '<text x="560" y="320" text-anchor="middle" class="graph-empty">표시할 문서가 없습니다.</text>';
    if (nodes.vaultGraphMeta) nodes.vaultGraphMeta.textContent = "0개 노드";
    renderVaultGraphLegend([]);
    renderVaultGraphDetail(null);
    return;
  }
  const width = 1120;
  const height = 640;
  nodes.vaultGraph.setAttribute("viewBox", `0 0 ${width} ${height}`);
  const layout = forceGraphLayout(graphNodes, graphEdges, width, height);
  const byId = new Map(layout.nodes.map((node) => [node.id, node]));
  const neighborsById = new Map(layout.nodes.map((node) => [node.id, new Set()]));
  for (const link of layout.links) {
    neighborsById.get(link.source)?.add(link.target);
    neighborsById.get(link.target)?.add(link.source);
  }
  const groupCounts = new Map();
  for (const node of layout.nodes) {
    const key = vaultGraphGroupKey(node);
    groupCounts.set(key, (groupCounts.get(key) || 0) + 1);
  }
  const graphGroups = [...groupCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([key, count], index) => ({ key, count, color: vaultGraphPalette[index % vaultGraphPalette.length] }));
  const colorByGroup = new Map(graphGroups.map((group) => [group.key, group.color]));
  renderVaultGraphLegend(graphGroups);
  const maxDegree = Math.max(1, ...layout.nodes.map((node) => Number(node.degree || 0)));
  const lines = layout.links.map((edge) => {
    const source = edge.sourceNode;
    const target = edge.targetNode;
    const reason = (edge.reasonLabels || edge.reasons || []).join(" · ");
    return `<line data-source="${escapeHtml(edge.source)}" data-target="${escapeHtml(edge.target)}" x1="${source.x.toFixed(1)}" y1="${source.y.toFixed(1)}" x2="${target.x.toFixed(1)}" y2="${target.y.toFixed(1)}"><title>${escapeHtml(reason || "연관 문서")}</title></line>`;
  }).join("");
  const dots = layout.nodes.map((node) => {
    const groupKey = vaultGraphGroupKey(node);
    const color = colorByGroup.get(groupKey) || vaultGraphPalette[0];
    const hubClass = Number(node.degree || 0) >= Math.max(5, maxDegree * 0.68) ? " is-hub-label" : "";
    return `
      <g class="graph-node${hubClass}" data-node-id="${escapeHtml(node.id)}" data-degree="${Number(node.degree || 0)}" data-group="${escapeHtml(groupKey)}" transform="translate(${node.x.toFixed(1)} ${node.y.toFixed(1)})">
        <title>${escapeHtml(node.title)} · ${escapeHtml(node.folder || "")} · ${Number(node.degree || 0)} 연결</title>
        <circle r="${node.r.toFixed(1)}" fill="${escapeHtml(color)}" stroke="${escapeHtml(color)}" />
        <text y="${(node.r + 15).toFixed(1)}" text-anchor="middle">${escapeHtml(shortGraphLabel(node.title))}</text>
      </g>
    `;
  }).join("");
  nodes.vaultGraph.innerHTML = `
    <defs>
      <filter id="graphGlow" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
    <rect class="graph-hit-area" x="0" y="0" width="${width}" height="${height}" />
    <g class="graph-viewport"><g class="graph-edges">${lines}</g><g class="graph-nodes">${dots}</g></g>
  `;
  const viewport = nodes.vaultGraph.querySelector(".graph-viewport");
  const graphState = { scale: 1, tx: 0, ty: 0, selectedNodeId: "", hoverNodeId: "", drag: null };
  const applyTransform = () => {
    if (viewport) viewport.setAttribute("transform", `translate(${graphState.tx.toFixed(1)} ${graphState.ty.toFixed(1)}) scale(${graphState.scale.toFixed(3)})`);
    nodes.vaultGraph.classList.toggle("is-zoomed", graphState.scale > 1.22);
    nodes.vaultGraph.querySelectorAll(".graph-node").forEach((el) => {
      const degree = Number(el.getAttribute("data-degree") || 0);
      el.classList.toggle("is-zoom-label", graphState.scale > 1.38 && degree >= 2);
    });
  };
  const svgPoint = (event) => {
    const rect = nodes.vaultGraph.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / Math.max(1, rect.width)) * width,
      y: ((event.clientY - rect.top) / Math.max(1, rect.height)) * height
    };
  };
  const graphPoint = (event) => {
    const point = svgPoint(event);
    return {
      x: (point.x - graphState.tx) / graphState.scale,
      y: (point.y - graphState.ty) / graphState.scale
    };
  };
  const updateLinesForNode = (nodeId = "") => {
    const node = byId.get(nodeId);
    if (!node) return;
    nodes.vaultGraph.querySelectorAll(".graph-edges line").forEach((line) => {
      if (line.getAttribute("data-source") === nodeId) {
        line.setAttribute("x1", node.x.toFixed(1));
        line.setAttribute("y1", node.y.toFixed(1));
      }
      if (line.getAttribute("data-target") === nodeId) {
        line.setAttribute("x2", node.x.toFixed(1));
        line.setAttribute("y2", node.y.toFixed(1));
      }
    });
  };
  const setFocus = (nodeId = "") => {
    const focusId = nodeId || graphState.hoverNodeId || graphState.selectedNodeId;
    const neighborIds = neighborsById.get(focusId) || new Set();
    nodes.vaultGraph.querySelectorAll(".graph-node").forEach((el) => {
      const id = el.getAttribute("data-node-id") || "";
      const active = id === focusId || neighborIds.has(id);
      el.classList.toggle("dim", Boolean(focusId) && !active);
      el.classList.toggle("is-active", Boolean(focusId) && active);
      el.classList.toggle("is-selected", Boolean(graphState.selectedNodeId) && id === graphState.selectedNodeId);
      el.classList.toggle("is-labeled", Boolean(focusId) && id === focusId);
    });
    nodes.vaultGraph.querySelectorAll(".graph-edges line").forEach((el) => {
      const active = el.getAttribute("data-source") === focusId || el.getAttribute("data-target") === focusId;
      el.classList.toggle("dim", Boolean(focusId) && !active);
      el.classList.toggle("is-active", Boolean(focusId) && active);
    });
  };
  const selectGraphNode = (nodeId = "") => {
    const node = byId.get(nodeId);
    if (!node) return;
    const neighborIds = [...(neighborsById.get(nodeId) || [])];
    renderVaultGraphDetail(node, neighborIds.map((id) => byId.get(id)).filter(Boolean));
    graphState.selectedNodeId = nodeId;
    setFocus(nodeId);
  };
  nodes.vaultGraph.querySelectorAll(".graph-node").forEach((el) => {
    const nodeId = el.getAttribute("data-node-id") || "";
    el.addEventListener("mouseenter", () => {
      graphState.hoverNodeId = nodeId;
      setFocus(nodeId);
    });
    el.addEventListener("mouseleave", () => {
      graphState.hoverNodeId = "";
      setFocus("");
    });
    el.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const node = byId.get(nodeId);
      if (!node) return;
      const point = graphPoint(event);
      graphState.drag = { type: "node", nodeId, offsetX: node.x - point.x, offsetY: node.y - point.y };
      nodes.vaultGraph.setPointerCapture?.(event.pointerId);
      el.classList.add("is-dragging");
      selectGraphNode(nodeId);
    });
    el.addEventListener("click", () => selectGraphNode(nodeId));
  });
  nodes.vaultGraph.onwheel = (event) => {
    event.preventDefault();
    const point = svgPoint(event);
    const graphX = (point.x - graphState.tx) / graphState.scale;
    const graphY = (point.y - graphState.ty) / graphState.scale;
    const factor = event.deltaY < 0 ? 1.12 : 0.9;
    const nextScale = Math.max(0.62, Math.min(2.8, graphState.scale * factor));
    graphState.tx = point.x - graphX * nextScale;
    graphState.ty = point.y - graphY * nextScale;
    graphState.scale = nextScale;
    applyTransform();
  };
  nodes.vaultGraph.onpointerdown = (event) => {
    if (event.target.closest?.(".graph-node")) return;
    event.preventDefault();
    graphState.drag = { type: "pan", last: svgPoint(event) };
    nodes.vaultGraph.setPointerCapture?.(event.pointerId);
  };
  nodes.vaultGraph.onpointermove = (event) => {
    if (!graphState.drag) return;
    if (graphState.drag.type === "pan") {
      const point = svgPoint(event);
      graphState.tx += point.x - graphState.drag.last.x;
      graphState.ty += point.y - graphState.drag.last.y;
      graphState.drag.last = point;
      applyTransform();
      return;
    }
    const node = byId.get(graphState.drag.nodeId);
    if (!node) return;
    const point = graphPoint(event);
    node.x = Math.max(30, Math.min(width - 30, point.x + graphState.drag.offsetX));
    node.y = Math.max(30, Math.min(height - 30, point.y + graphState.drag.offsetY));
    const group = [...nodes.vaultGraph.querySelectorAll(".graph-node")].find((el) => el.getAttribute("data-node-id") === graphState.drag.nodeId);
    if (group) group.setAttribute("transform", `translate(${node.x.toFixed(1)} ${node.y.toFixed(1)})`);
    updateLinesForNode(graphState.drag.nodeId);
  };
  const endDrag = (event) => {
    if (!graphState.drag) return;
    nodes.vaultGraph.querySelectorAll(".graph-node.is-dragging").forEach((el) => el.classList.remove("is-dragging"));
    graphState.drag = null;
    if (event?.pointerId != null) nodes.vaultGraph.releasePointerCapture?.(event.pointerId);
  };
  nodes.vaultGraph.onpointerup = endDrag;
  nodes.vaultGraph.onpointercancel = endDrag;
  const highestDegree = [...layout.nodes].sort((a, b) => b.degree - a.degree)[0];
  if (highestDegree) renderVaultGraphDetail(highestDegree, [...(neighborsById.get(highestDegree.id) || [])].map((id) => byId.get(id)).filter(Boolean));
  applyTransform();
  if (nodes.vaultGraphMeta) nodes.vaultGraphMeta.textContent = `${layout.nodes.length}개 노드 · ${layout.links.length}개 연결 · 휠 줌/드래그 이동`;
}

function formatShortTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function formatKrw(value = 0) {
  const amount = Math.round(Number(value || 0));
  return `${amount.toLocaleString("ko-KR")}원`;
}

function formatSavedTime(minutes = 0) {
  const value = Math.max(0, Math.round(Number(minutes || 0)));
  if (value >= 60) {
    const hours = Math.floor(value / 60);
    const rest = value % 60;
    return rest ? `${hours}시간 ${rest}분` : `${hours}시간`;
  }
  return `${value}분`;
}

function economicsValue(economics = {}, actualKey = "", estimatedKey = "") {
  const actual = economics?.[actualKey];
  if (actual != null && actual !== "") return actual;
  return economics?.[estimatedKey] || 0;
}

function economicsInputValue(value) {
  return value == null || value === "" ? "" : String(Math.round(Number(value || 0)));
}

function setNavBadge(node, value) {
  if (!node) return;
  const count = Number(value || 0);
  node.hidden = count <= 0;
  node.textContent = count > 99 ? "99+" : String(count);
}

function updateNavigationBadges(data = {}) {
  const badges = data.badges || {};
  setNavBadge(nodes.badgeReview, badges.reviewPending);
  setNavBadge(nodes.badgeAutomation, Number(badges.automationAttention || 0) + Number(badges.automationRunning || 0));
  setNavBadge(nodes.badgeSkills, badges.activeSkills);
  setNavBadge(nodes.badgeMemory, badges.memoryCount);
}

function updateDashboardKpis(data = {}) {
  const kpis = data.kpis || {};
  if (nodes.dashboardActiveAgents) nodes.dashboardActiveAgents.textContent = `${Number(kpis.activeAgents || 0)}명`;
  if (nodes.dashboardRunningWork) nodes.dashboardRunningWork.textContent = `${Number(kpis.runningWork || 0)}건`;
  if (nodes.dashboardPendingApprovals) nodes.dashboardPendingApprovals.textContent = `${Number(kpis.pendingApprovals || 0)}개`;
  if (nodes.dashboardRecentQuality) nodes.dashboardRecentQuality.textContent = `${Number(kpis.recentQualityScore || 0)}점`;
}

function updateDashboardFocus(data) {
  const current = data.workflow?.current || {};
  const currentActive = ["running", "evaluating"].includes(current.status);
  if (nodes.dashboardFocusWork) nodes.dashboardFocusWork.textContent = currentActive ? current.stepLabel || "진행 중" : "대기 중";
  if (nodes.dashboardFocusMeta) {
    const lastUpdated = formatShortTime(current.updatedAt);
    nodes.dashboardFocusMeta.textContent = currentActive
      ? `${current.workflowName || "직원 체인"} · ${lastUpdated || "방금 갱신"}`
      : current.status === "completed"
        ? `마지막 완료: ${lastUpdated || current.stepLabel || "완료"}`
        : "실행 중인 직원 체인이 없습니다.";
  }

  const today = data.today || {};
  if (nodes.dashboardTodayCount) nodes.dashboardTodayCount.textContent = `${today.processed ?? 0}건`;
  if (nodes.dashboardReviewRate) nodes.dashboardReviewRate.textContent = today.reviewPassRate == null ? "검토 대기" : `${today.reviewPassRate}% 통과`;
  if (nodes.dashboardTodayMeta) nodes.dashboardTodayMeta.textContent = `${today.date || "오늘"} 저장된 요미오피스 보고서 기준`;
  const performance = data.workflow?.performance || {};
  if (nodes.dashboardPerformanceScore) nodes.dashboardPerformanceScore.textContent = performance.lastScore ? `${performance.lastScore}점` : `${performance.avgScore || 0}점`;
  if (nodes.dashboardPerformanceGrade) nodes.dashboardPerformanceGrade.textContent = performance.lastGrade || "대기";
  if (nodes.dashboardPerformanceMeta) {
    nodes.dashboardPerformanceMeta.textContent = performance.total
      ? `평균 ${performance.avgScore || 0}점 · 포트폴리오 ${performance.portfolioCount || 0}건`
      : "성과기록 대기";
  }
  const economics = performance.economics || {};
  if (nodes.dashboardEconomicsValue) nodes.dashboardEconomicsValue.textContent = performance.total ? formatKrw(economics.estimatedNetKrw || 0) : "0원";
  if (nodes.dashboardEconomicsRoi) nodes.dashboardEconomicsRoi.textContent = performance.total ? `ROI ${Number(economics.roiPercent || 0)}%` : "ROI 대기";
  if (nodes.dashboardEconomicsMeta) {
    nodes.dashboardEconomicsMeta.textContent = performance.total
      ? `추정 절약 ${formatSavedTime(economics.estimatedSavedMinutes || 0)} · 비용 ${formatKrw(economics.estimatedCostKrw || 0)}`
      : "작업당 경제성 기록 대기";
  }

  const tools = data.skills?.tools || [];
  const keyRequired = tools.filter((tool) => tool.status === "key_required");
  const disconnected = tools.filter((tool) => tool.status === "disconnected");
  const errors = data.workflow?.recentErrors || [];
  const attentionItems = [];
  if (!data.vault?.connected) attentionItems.push("저장소 미연결");
  if (keyRequired.length) attentionItems.push(`키 필요 ${keyRequired.length}개`);
  if (disconnected.length) attentionItems.push(`미연결 ${disconnected.length}개`);
  if (errors.length) attentionItems.push(`오류 ${errors.length}건`);
  if (nodes.dashboardAttention) nodes.dashboardAttention.textContent = attentionItems.length ? attentionItems.join(" · ") : "주의 없음";
  if (nodes.dashboardAttentionMeta) {
    const toolNames = [...keyRequired, ...disconnected].map((tool) => tool.label || tool.id).slice(0, 3).join(", ");
    nodes.dashboardAttentionMeta.textContent = errors[0]?.message || toolNames || "키, 연결, 최근 오류가 안정적입니다.";
  }
}

function updateDashboard(data) {
  officeDashboardState = data || {};
  if (nodes.serverStatus) nodes.serverStatus.textContent = "서버 정상";
  updateDashboardKpis(data);
  updateNavigationBadges(data);
  if (nodes.dashboardReportCount) nodes.dashboardReportCount.textContent = data.counts?.webOfficeReports ?? 0;
  if (nodes.dashboardCaptureCount) nodes.dashboardCaptureCount.textContent = data.counts?.autoCaptures ?? 0;
  if (nodes.dashboardCodexMode) nodes.dashboardCodexMode.textContent = data.codex?.available ? "정상" : "대기";
  if (nodes.dashboardVaultState) nodes.dashboardVaultState.textContent = data.vault?.connected ? "연결" : "대기";
  if (nodes.mainVaultPath) nodes.mainVaultPath.textContent = data.vault?.path || "경로 미설정";
  if (nodes.settingsVaultPath) nodes.settingsVaultPath.textContent = data.vault?.path || "경로 미설정";
  if (nodes.vaultPath) nodes.vaultPath.textContent = data.vault?.path || "경로 미설정";
  if (nodes.vaultStatus) nodes.vaultStatus.textContent = data.vault?.connected ? "Vault 연결됨" : "Vault 대기";
  if (nodes.aiStatus) nodes.aiStatus.textContent = providerLabel(data.llm?.provider);
  if (nodes.codexStatus) nodes.codexStatus.textContent = data.codex?.available ? "정상" : "대기";
  if (nodes.claudeStatus) nodes.claudeStatus.textContent = data.claude?.available ? "자동/직접 가능" : "대기";
  if (nodes.styleProfileStatus) nodes.styleProfileStatus.textContent = data.context?.styleProfile?.enabled ? "RAG+톤 적용" : "프로필 꺼짐";
  if (nodes.styleProfileMeta) {
    const profile = data.context?.styleProfile || {};
    nodes.styleProfileMeta.textContent = `${profile.label || "Vault RAG와 톤 프로필"} · ${profileMemorySummary({}, profile.memoryCounts || { total: profile.memoryCount || 0 })}`;
  }
  renderRagState(data.rag || data.context?.rag || {});
  if (nodes.dashboardLastReport) nodes.dashboardLastReport.textContent = data.lastReport?.displayPath || cleanDisplayPath(data.lastReport?.relPath) || "저장된 보고서 없음";
  const current = data.workflow?.current || {};
  if (nodes.dashboardWorkflowStatus) nodes.dashboardWorkflowStatus.textContent = workflowStatusLabel(current.status);
  if (nodes.dashboardWorkflowCurrent) nodes.dashboardWorkflowCurrent.textContent = current.stepLabel ? `${current.workflowName || "기본 체인"} · ${current.stepLabel}` : "직원 인계 대기 중";
  const counts = data.workflow?.statusCounts || {};
  if (nodes.dashboardWorkflowCounts) nodes.dashboardWorkflowCounts.textContent = `${counts.success || 0} / ${counts.rework || 0} / ${counts.failed || 0}`;
  if (nodes.dashboardPipelineState) nodes.dashboardPipelineState.textContent = workflowStatusLabel(current.status);
  if (nodes.officeSummaryStage) nodes.officeSummaryStage.textContent = workflowStatusLabel(current.status);
  renderDashboardAgentCounts(data.workflow?.agentCounts || []);
  renderVaultStats(data.counts || {});
  renderSkillsState(data.skills || skillsState);
  updateDashboardFocus(data);
  syncOfficeLiveStage();
}

async function refreshState() {
  try {
    const response = await apiFetch("/api/office-state", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
    updateDashboard(data);
  } catch (error) {
    if (nodes.serverStatus) nodes.serverStatus.textContent = `서버 오류: ${error.message}`;
  }
}

function vaultExportFormatLabel(format) {
  return ({ blog: "블로그", sns: "SNS", pdf: "PDF용" })[format] || format || "활용";
}

function renderVaultExportActions(doc) {
  const relPath = escapeHtml(doc.relPath || "");
  return `
    <div class="report-actions">
      ${["blog", "sns", "pdf"].map((format) => `
        <button type="button" data-vault-export="${format}" data-rel-path="${relPath}">
          ${vaultExportFormatLabel(format)}
        </button>
      `).join("")}
    </div>
  `;
}

function renderVaultRelatedDocs(doc = {}) {
  const related = Array.isArray(doc.relatedDocs) ? doc.relatedDocs : [];
  if (!related.length) return '<div class="vault-related empty">연결된 문서 없음</div>';
  return `
    <div class="vault-related">
      <strong>연관 문서</strong>
      ${related.map((item) => `
        <span>
          <b>${escapeHtml(item.title || "문서")}</b>
          <small>${escapeHtml((item.reasons || []).join(" · ") || item.folder || "연관")}</small>
        </span>
      `).join("")}
    </div>
  `;
}

async function exportVaultReport(relPath, format) {
  if (!relPath || !format) return;
  if (nodes.vaultExportStatus) nodes.vaultExportStatus.textContent = `${vaultExportFormatLabel(format)} 변환 중`;
  try {
    const response = await apiFetch("/api/vault-export", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ relPath, format })
    });
    const data = await response.json();
    if (!response.ok || data.ok === false) throw new Error(data.error || `HTTP ${response.status}`);
    if (nodes.vaultExportStatus) nodes.vaultExportStatus.textContent = `${data.formatLabel || vaultExportFormatLabel(format)} 저장 완료: ${data.relPath}`;
    addChatMessage("assistant", `${data.formatLabel || vaultExportFormatLabel(format)}로 변환해 Vault에 저장했습니다.\n${data.relPath}`, "YOMI Office", "Vault 활용");
    await loadRecentReports();
  } catch (error) {
    if (nodes.vaultExportStatus) nodes.vaultExportStatus.textContent = `활용 실패: ${error.message}`;
  }
}

function handleVaultExportClick(event) {
  const button = event.target.closest("button[data-vault-export]");
  if (!button || !nodes.recentReports?.contains(button)) return;
  event.preventDefault();
  event.stopPropagation();
  const relPath = button.dataset.relPath || "";
  const format = button.dataset.vaultExport || "";
  button.disabled = true;
  exportVaultReport(relPath, format).finally(() => { button.disabled = false; });
}

async function loadRecentReports() {
  nodes.recentReports.innerHTML = '<div class="empty">저장소 문서를 불러오는 중입니다.</div>';
  renderVaultChips(nodes.vaultCategoryCounts, [], "카테고리 확인 중");
  renderVaultChips(nodes.vaultTagCounts, [], "태그 확인 중");
  try {
    const response = await apiFetch("/api/vault-overview?limit=28", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
    if (nodes.reportCount) nodes.reportCount.textContent = `${data.recentDocs?.length || 0} / ${data.totalMarkdown || 0}`;
    renderVaultChips(nodes.vaultCategoryCounts, data.categories || [], "카테고리가 없습니다.");
    renderVaultChips(nodes.vaultTagCounts, data.tags || [], "태그가 없습니다.");
    renderVaultGraph(data.graph || {});
    if (!data.connected) {
      nodes.recentReports.innerHTML = '<div class="empty">저장소가 연결되지 않았습니다.</div>';
      return;
    }
    if (!data.recentDocs?.length) {
      nodes.recentReports.innerHTML = '<div class="empty">저장된 문서가 없습니다.</div>';
      return;
    }
    nodes.recentReports.innerHTML = data.recentDocs.map((doc) => `
      <details class="report-item">
        <summary><strong>${escapeHtml(doc.title)}</strong></summary>
        <div class="report-detail">
          <span>${escapeHtml(doc.displayPath || cleanDisplayPath(doc.relPath))}</span>
          <small>${escapeHtml(doc.created || "")}</small>
          <small>${escapeHtml(doc.folder || "루트")}${doc.tags?.length ? ` · #${doc.tags.map(escapeHtml).join(" #")}` : ""}</small>
          ${renderVaultRelatedDocs(doc)}
          ${renderVaultExportActions(doc)}
        </div>
      </details>
    `).join("");
  } catch (error) {
    renderVaultGraph({ nodes: [], edges: [] });
    nodes.recentReports.innerHTML = `<div class="empty">저장소 로드 실패: ${escapeHtml(error.message)}</div>`;
  }
}

function renderPortfolioList(state = {}) {
  const records = Array.isArray(state.records) ? state.records : [];
  const summary = state.summary || {};
  if (nodes.portfolioStatus) {
    nodes.portfolioStatus.textContent = summary.total
      ? `평균 ${summary.avgScore || 0}점 · 포트폴리오 ${summary.portfolioCount || 0}건`
      : "성과기록 대기";
  }
  if (!nodes.portfolioList) return;
  if (!records.length) {
    nodes.portfolioList.innerHTML = '<div class="empty">아직 성과기록이 없습니다.</div>';
    return;
  }
  nodes.portfolioList.innerHTML = records.slice(0, 10).map((record) => {
    const rubric = Array.isArray(record.rubric) ? record.rubric.slice(0, 6) : [];
    const sources = Array.isArray(record.sources) ? record.sources.slice(0, 4) : [];
    const assetReview = record.assetReview && typeof record.assetReview === "object" ? record.assetReview : null;
    const economics = record.economics && typeof record.economics === "object" ? record.economics : null;
    const adjustment = economics?.adjustment || {};
    const displayNetKrw = economicsValue(economics, "actualNetKrw", "displayNetKrw");
    const displayCostKrw = economicsValue(economics, "actualCostKrw", "displayCostKrw");
    const displaySavedMinutes = economicsValue(economics, "actualSavedMinutes", "displaySavedMinutes");
    const displayRoiPercent = economics?.displayRoiPercent ?? economics?.roiPercent ?? 0;
    return `
      <details class="portfolio-item">
        <summary>
          <strong>${escapeHtml(record.title || "성과 기록")}</strong>
          <b>${escapeHtml(`${record.score || 0}점 · ${record.grade || "평가"}`)}</b>
        </summary>
        <div class="portfolio-detail">
          <span>${escapeHtml(record.workType || "general_work")} · ${escapeHtml(record.status || "completed")}</span>
          <small>작업 ID: ${escapeHtml(record.jobId || "")}</small>
          <small>${escapeHtml(record.portfolioRelPath || record.savedRelPath || "Vault 포트폴리오 저장 대기")}</small>
          ${record.retrospective?.portfolioAngle ? `<p>${escapeHtml(record.retrospective.portfolioAngle)}</p>` : ""}
          ${assetReview ? `<div class="portfolio-rubric"><span>자산화 ${Number(assetReview.score || 0)}점</span><span>저장 ${assetReview.shouldSave ? "통과" : "제외"}</span><span>RAG ${assetReview.ragReady ? "포함" : "검토"}</span></div>` : ""}
          ${economics ? `<div class="portfolio-rubric economics"><span>${economics.adjusted ? "보정" : "추정"} 순가치 ${escapeHtml(formatKrw(displayNetKrw))}</span><span>비용 ${escapeHtml(formatKrw(displayCostKrw))}</span><span>절약 ${escapeHtml(formatSavedTime(displaySavedMinutes))}</span><span>ROI ${Number(displayRoiPercent || 0)}%</span></div>` : ""}
          ${economics ? `
            <form class="portfolio-economics-form" data-economics-form="true" data-record-id="${escapeHtml(record.id || "")}" data-job-id="${escapeHtml(record.jobId || "")}" data-title="${escapeHtml(record.title || "")}">
              <label>실제 비용(원)<input name="actualCostKrw" type="number" min="0" step="1" value="${escapeHtml(economicsInputValue(adjustment.actualCostKrw))}" placeholder="${escapeHtml(String(economics.estimatedCostKrw || 0))}" /></label>
              <label>절약 시간(분)<input name="actualSavedMinutes" type="number" min="0" step="1" value="${escapeHtml(economicsInputValue(adjustment.actualSavedMinutes))}" placeholder="${escapeHtml(String(economics.estimatedSavedMinutes || 0))}" /></label>
              <label>시간가치(원/h)<input name="hourlyValueKrw" type="number" min="0" step="1000" value="${escapeHtml(economicsInputValue(adjustment.hourlyValueKrw ?? economics.hourlyValueKrw))}" /></label>
              <label class="wide">보정 메모<textarea name="note" rows="2" placeholder="실제 수정 시간, API 비용, 작업 가치 판단 기준">${escapeHtml(adjustment.note || "")}</textarea></label>
              <div class="portfolio-economics-actions">
                <button type="submit">ROI 보정 저장</button>
                <button type="button" data-economics-clear="true" data-record-id="${escapeHtml(record.id || "")}" data-job-id="${escapeHtml(record.jobId || "")}">보정 해제</button>
              </div>
            </form>
          ` : ""}
          ${assetReview?.reason ? `<small>${escapeHtml(assetReview.reason)}</small>` : ""}
          ${rubric.length ? `<div class="portfolio-rubric">${rubric.map((item) => `<span>${escapeHtml(item.label || item.id || "평가")} ${Number(item.score || 0)}점</span>`).join("")}</div>` : ""}
          ${sources.length ? `<div class="portfolio-sources">${sources.map((item) => `<small>${escapeHtml(item.displayPath || item.relPath || item.title || "")}</small>`).join("")}</div>` : ""}
        </div>
      </details>
    `;
  }).join("");
}

async function loadPerformanceLog() {
  if (!nodes.portfolioList && !nodes.portfolioStatus) return null;
  try {
    const response = await apiFetch("/api/performance-log?limit=12", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok || data.ok === false) throw new Error(data.error || `HTTP ${response.status}`);
    renderPortfolioList(data);
    return data;
  } catch (error) {
    if (nodes.portfolioStatus) nodes.portfolioStatus.textContent = "성과기록 로드 실패";
    if (nodes.portfolioList) nodes.portfolioList.innerHTML = `<div class="empty">성과기록 로드 실패: ${escapeHtml(error.message)}</div>`;
    return null;
  }
}

async function savePortfolioEconomics(payload = {}) {
  const response = await apiFetch("/api/performance-economics", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok || data.ok === false) throw new Error(data.error || `HTTP ${response.status}`);
  return data;
}

async function refreshEconomicsViews(state = null) {
  if (state) renderPortfolioList(state);
  else await loadPerformanceLog();
  await refreshState();
}

async function handlePortfolioEconomicsSubmit(event) {
  const form = event.target.closest("form[data-economics-form]");
  if (!form || !nodes.portfolioList?.contains(form)) return;
  event.preventDefault();
  const submitButton = form.querySelector("button[type='submit']");
  if (submitButton) submitButton.disabled = true;
  if (nodes.portfolioStatus) nodes.portfolioStatus.textContent = "ROI 보정 저장 중";
  const formData = new FormData(form);
  try {
    const state = await savePortfolioEconomics({
      action: "save",
      recordId: form.dataset.recordId || "",
      jobId: form.dataset.jobId || "",
      title: form.dataset.title || "",
      actualCostKrw: formData.get("actualCostKrw"),
      actualSavedMinutes: formData.get("actualSavedMinutes"),
      hourlyValueKrw: formData.get("hourlyValueKrw"),
      note: formData.get("note")
    });
    await refreshEconomicsViews(state);
    if (nodes.portfolioStatus) nodes.portfolioStatus.textContent = "ROI 보정 저장 완료";
  } catch (error) {
    if (nodes.portfolioStatus) nodes.portfolioStatus.textContent = `ROI 보정 실패: ${error.message}`;
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
}

async function handlePortfolioEconomicsClick(event) {
  const button = event.target.closest("button[data-economics-clear]");
  if (!button || !nodes.portfolioList?.contains(button)) return;
  button.disabled = true;
  if (nodes.portfolioStatus) nodes.portfolioStatus.textContent = "ROI 보정 해제 중";
  try {
    const state = await savePortfolioEconomics({
      action: "clear",
      recordId: button.dataset.recordId || "",
      jobId: button.dataset.jobId || ""
    });
    await refreshEconomicsViews(state);
    if (nodes.portfolioStatus) nodes.portfolioStatus.textContent = "ROI 보정 해제 완료";
  } catch (error) {
    if (nodes.portfolioStatus) nodes.portfolioStatus.textContent = `ROI 보정 해제 실패: ${error.message}`;
  } finally {
    button.disabled = false;
  }
}

function reviewEmpty(message) {
  return `<div class="empty">${escapeHtml(message)}</div>`;
}

function reviewTrustScore(job = {}, record = null) {
  let score = 54;
  const status = String(job.status || "");
  if (status === "completed") score += 18;
  if (status === "completed_with_errors") score -= 8;
  if (["failed", "cancelled"].includes(status)) score -= 20;
  if (status === "waiting_question") score -= 6;
  if (job.saved?.ok) score += 10;
  if (String(job.detail || "").includes("RAG")) score += 8;
  if (record?.score) score = Math.round((score * 0.45) + (Number(record.score || 0) * 0.55));
  return Math.max(0, Math.min(100, Math.round(score)));
}

function reviewTrustClass(score) {
  if (score >= 82) return "ok";
  if (score < 62) return "warn";
  return "info";
}

function reviewDecisionStats(decisionRows = []) {
  const rows = Array.isArray(decisionRows) ? decisionRows : [];
  const approved = rows.filter((decision) => decision.status === "approved").length;
  const rejected = rows.filter((decision) => decision.status === "rejected").length;
  const needsRevision = rows.filter((decision) => decision.status === "needs_revision").length;
  const resolvedByRetry = rows.filter((decision) => decision.status === "resolved").length;
  const pending = rows.filter((decision) => !decision.status || decision.status === "pending").length;
  const edited = rows.filter((decision) => decision.edit?.diff?.changed).length;
  const resolved = approved + rejected + needsRevision + resolvedByRetry;
  const revisionLike = rejected + needsRevision;
  return {
    total: rows.length,
    approved,
    rejected,
    needsRevision,
    resolvedByRetry,
    pending,
    edited,
    resolved,
    revisionLike,
    approvalRate: resolved ? Math.round((approved / resolved) * 100) : null,
    revisionRate: resolved ? Math.round((revisionLike / resolved) * 100) : null
  };
}

function buildReviewOpsSummary(jobs = [], records = [], decisionRows = [], recordsByJobId = new Map(), decisionsByKey = new Map(), skillReviewSummary = {}) {
  const stats = reviewDecisionStats(decisionRows);
  const skillReviewTotal = Number(skillReviewSummary.reviewTotal || 0);
  if (skillReviewTotal) {
    stats.total += skillReviewTotal;
    stats.approved += Number(skillReviewSummary.reviewApproved || 0);
    stats.rejected += Number(skillReviewSummary.reviewRejected || 0);
    stats.needsRevision += Number(skillReviewSummary.reviewNeedsRevision || 0);
    stats.edited += Number(skillReviewSummary.reviewDiffs || 0);
    stats.resolved += skillReviewTotal;
    stats.revisionLike += Number(skillReviewSummary.reviewRevisionLike || 0);
    stats.approvalRate = stats.resolved ? Math.round((stats.approved / stats.resolved) * 100) : null;
    stats.revisionRate = stats.resolved ? Math.round((stats.revisionLike / stats.resolved) * 100) : null;
  }
  const completedJobs = jobs.filter((job) => ["completed", "completed_with_errors"].includes(job.status));
  const trustRows = completedJobs.map((job) => {
    const record = recordsByJobId.get(job.id);
    const decision = decisionsByKey.get(`${job.type || "office"}:${job.id || ""}`);
    return { job, record, decision, trust: reviewTrustScore(job, record) };
  });
  const avgTrust = trustRows.length ? Math.round(trustRows.reduce((sum, item) => sum + item.trust, 0) / trustRows.length) : 0;
  const avgPerformance = records.length ? Math.round(records.reduce((sum, record) => sum + Number(record.score || 0), 0) / records.length) : 0;
  const autoCandidates = trustRows.filter((item) => {
    const blocked = ["rejected", "needs_revision"].includes(item.decision?.status || "");
    const approvedOrUnreviewed = !item.decision || item.decision.status === "approved" || item.decision.status === "pending";
    const highPerformance = item.record?.passed || Number(item.record?.score || 0) >= 82;
    return item.trust >= 86 && highPerformance && approvedOrUnreviewed && !blocked;
  });
  let ladder = "수동";
  let ladderMeta = "검토 기록 대기";
  let recommendation = "먼저 5건 이상을 승인/반려/수정필요로 남겨 기준 데이터를 만드세요.";
  const revisionRate = stats.revisionRate ?? 0;
  if (stats.resolved >= 15 && stats.approved >= 10 && revisionRate <= 5 && avgPerformance >= 90 && autoCandidates.length >= 5) {
    ladder = "자동 후보";
    ladderMeta = `평균 ${avgPerformance}점 · 수정률 ${revisionRate}%`;
    recommendation = "완전 자동 실행은 아직 게이트를 유지하고, 동일 워크플로 1개만 예약 자동화 후보로 올리세요.";
  } else if (stats.resolved >= 8 && stats.approved >= 5 && revisionRate <= 15 && avgPerformance >= 82 && autoCandidates.length >= 2) {
    ladder = "조건부 자동";
    ladderMeta = `승인 ${stats.approved}건 · 후보 ${autoCandidates.length}건`;
    recommendation = "고신뢰 작업은 일괄 승인 후보로 묶고, 저신뢰 작업만 요미 검토로 에스컬레이션하세요.";
  } else if (stats.resolved >= 2 || records.length) {
    ladder = "감독";
    ladderMeta = stats.resolved ? `검토 ${stats.resolved}건 · 수정률 ${revisionRate}%` : `성과기록 ${records.length}건`;
    recommendation = revisionRate >= 30
      ? "수정률이 높습니다. 직원 프롬프트나 완료 기준을 먼저 보강하고 자동화 승급은 막아두세요."
      : "검토 기록을 계속 쌓으면서 반복 성공 패턴만 스킬 후보로 승격하세요.";
  }
  if (stats.edited < 3) {
    recommendation = stats.resolved
      ? "헤르메스 개선에는 편집 diff가 더 필요합니다. 승인보다 수정기록을 최소 3건 먼저 모으세요."
      : recommendation;
  }
  return {
    ladder,
    ladderMeta,
    avgTrust,
    avgPerformance,
    autoCandidateCount: autoCandidates.length,
    autoCandidateMeta: autoCandidates.length
      ? `평균 신뢰 ${avgTrust || 0}점 · 조건 충족`
      : completedJobs.length ? "고신뢰 완료 작업 없음" : "완료 작업 대기",
    revisionRate: stats.revisionRate == null ? 0 : stats.revisionRate,
    revisionMeta: stats.resolved
      ? `승인 ${stats.approved} · 수정 ${stats.needsRevision} · 반려 ${stats.rejected}`
      : "승인/반려 기록 대기",
    hermesFuel: stats.edited,
    hermesMeta: stats.edited ? `편집 diff ${stats.edited}개 저장됨` : "초안-최종본 diff 대기",
    opsStatus: `검토 ${stats.resolved}건 · 성과 ${records.length}건`,
    recommendation
  };
}

function setReviewSection(section = "pending") {
  activeReviewSection = ["pending", "skills", "portfolio", "history"].includes(section) ? section : "pending";
  if (nodes.reviewSectionTabs) {
    nodes.reviewSectionTabs.querySelectorAll("[data-review-section]").forEach((button) => {
      const active = button.dataset.reviewSection === activeReviewSection;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", active ? "true" : "false");
    });
  }
  if (nodes.reviewPage) {
    nodes.reviewPage.querySelectorAll("[data-review-section-panel]").forEach((panel) => {
      panel.hidden = panel.dataset.reviewSectionPanel !== activeReviewSection;
    });
  }
  const firstVisibleItem = nodes.reviewPage?.querySelector(`[data-review-section-panel="${CSS.escape(activeReviewSection)}"]:not([hidden]) .review-item[data-review-detail]`);
  if (firstVisibleItem) renderReviewDetailFromItem(firstVisibleItem);
}

function renderReviewSummaryLine({ queueSummary = {}, performanceSummary = {}, skillsSummary = {}, decisionCount = 0, attentionCount = 0, automationAttention = 0 } = {}) {
  if (!nodes.reviewSummaryLine) return;
  const reviewed = Number(skillsSummary.reviewTotal || decisionCount || 0);
  const revisionRate = Number(skillsSummary.reviewRevisionRate ?? 0);
  const pending = Number(skillsSummary.pending || 0) + Number(skillsSummary.needsRevision || 0) + Number(queueSummary.attention || attentionCount || 0) + Number(automationAttention || 0);
  const quality = Number(performanceSummary.lastScore || performanceSummary.avgScore || 0);
  nodes.reviewSummaryLine.textContent = `검토 ${reviewed}건 · 수정률 ${revisionRate}% · 승인 대기 ${pending} · 최근 품질 ${quality}점`;
}

function renderReviewDetailFromItem(item) {
  if (!nodes.reviewDetailPanel || !item) return;
  const title = item.dataset.detailTitle || "검토 항목";
  const meta = item.dataset.detailMeta || "";
  const score = item.dataset.detailScore || "";
  const body = item.dataset.detailBody || "";
  const note = item.dataset.detailNote || "";
  nodes.reviewDetailPanel.innerHTML = `
    <div class="detail-head">
      <span class="detail-kicker">${escapeHtml(item.dataset.reviewDetail || "review")}</span>
      <h2>${escapeHtml(title)}</h2>
      ${meta ? `<p>${escapeHtml(meta)}</p>` : ""}
    </div>
    <div class="detail-score-row">
      ${score ? `<b>${escapeHtml(score)}</b>` : ""}
      <span>처리 액션은 선택 카드의 더보기에서 실행합니다.</span>
    </div>
    ${body ? `<div class="detail-section"><strong>요약</strong><p>${escapeHtml(body)}</p></div>` : ""}
    ${note ? `<div class="detail-section"><strong>검토 기록</strong><p>${escapeHtml(note)}</p></div>` : ""}
  `;
  nodes.reviewPage?.querySelectorAll(".review-item.selected").forEach((row) => row.classList.remove("selected"));
  item.classList.add("selected");
}

function renderReviewOpsDashboard(summary = {}) {
  if (nodes.reviewOpsStatus) nodes.reviewOpsStatus.textContent = summary.opsStatus || "신뢰도 계산 대기";
  if (nodes.reviewTrustLadder) nodes.reviewTrustLadder.textContent = summary.ladder || "수동";
  if (nodes.reviewTrustLadderMeta) nodes.reviewTrustLadderMeta.textContent = summary.ladderMeta || "검토 기록 대기";
  if (nodes.reviewAutoCandidateCount) nodes.reviewAutoCandidateCount.textContent = `${Number(summary.autoCandidateCount || 0)}건`;
  if (nodes.reviewAutoCandidateMeta) nodes.reviewAutoCandidateMeta.textContent = summary.autoCandidateMeta || "승급 후보 없음";
  if (nodes.reviewRevisionRate) nodes.reviewRevisionRate.textContent = `${Number(summary.revisionRate || 0)}%`;
  if (nodes.reviewRevisionMeta) nodes.reviewRevisionMeta.textContent = summary.revisionMeta || "승인/반려 기록 대기";
  if (nodes.reviewHermesFuel) nodes.reviewHermesFuel.textContent = `${Number(summary.hermesFuel || 0)}개`;
  if (nodes.reviewHermesMeta) nodes.reviewHermesMeta.textContent = summary.hermesMeta || "편집 diff 대기";
  if (nodes.reviewOpsRecommendation) nodes.reviewOpsRecommendation.textContent = summary.recommendation || "검토 기록이 쌓이면 다음 자동화 승급 기준을 제안합니다.";
}

function reviewDecisionLabel(decision = null) {
  if (!decision?.status || decision.status === "pending") return "";
  return decision.statusLabel || ({ approved: "승인", rejected: "반려", needs_revision: "수정 필요", resolved: "재시도됨" })[decision.status] || decision.status;
}

function reviewDecisionClosesAttention(decision = null) {
  return ["approved", "rejected", "resolved"].includes(decision?.status || "");
}

function reviewEditSummary(decision = null) {
  const diff = decision?.edit?.diff;
  if (!diff) return "";
  return diff.summary || (diff.changed ? "수정 기록 있음" : "수정 기록: 변경 없음");
}

function reviewJobCard(job = {}, recordsByJobId = new Map(), decisionsByKey = new Map()) {
  const record = recordsByJobId.get(job.id);
  const decision = decisionsByKey.get(`${job.type || "office"}:${job.id || ""}`);
  const decisionLabel = reviewDecisionLabel(decision);
  const editSummary = reviewEditSummary(decision);
  const trust = reviewTrustScore(job, record);
  const statusLabel = job.statusLabel || officeJobStatusLabel(job.status);
  const elapsed = formatTaskQueueDuration(job.durationMs);
  const typeLabel = job.type === "codex" ? "Codex" : "직원 실행";
  const progress = job.lastLog || job.progress || job.detail || "";
  const savedText = job.saved?.ok ? `Vault ${job.saved.relPath || "저장됨"}` : job.saved?.reason || "";
  return `
    <article class="review-item ${escapeHtml(taskQueueTone(job.status))}" data-review-detail="job" data-detail-title="${escapeHtml(job.title || job.id || "작업")}" data-detail-meta="${escapeHtml([statusLabel, typeLabel, elapsed].filter(Boolean).join(" · "))}" data-detail-score="${trust}점" data-detail-body="${escapeHtml(progress || savedText || "진행 정보 없음")}" data-detail-note="${escapeHtml(decisionLabel || editSummary || "")}">
      <div class="review-item-head">
        <strong>${escapeHtml(job.title || job.id || "작업")}</strong>
        <b class="review-trust ${reviewTrustClass(trust)}">${trust}점</b>
      </div>
      <div class="review-item-meta">
        <span>${escapeHtml(statusLabel)}</span>
        <span>${escapeHtml(typeLabel)}</span>
        ${elapsed ? `<span>${escapeHtml(elapsed)}</span>` : ""}
        ${record?.grade ? `<span>${escapeHtml(record.grade)}</span>` : ""}
      </div>
      ${progress ? `<p>${escapeHtml(progress)}</p>` : ""}
      ${savedText ? `<small>${escapeHtml(savedText)}</small>` : ""}
      ${decisionLabel ? `<small class="review-decision ${escapeHtml(decision.status || "")}">검토: ${escapeHtml(decisionLabel)}${decision.note ? ` · ${escapeHtml(decision.note)}` : ""}</small>` : ""}
      ${editSummary ? `<small class="review-edit">편집 diff: ${escapeHtml(editSummary)}</small>` : ""}
      <div class="review-actions primary">
        <button type="button" data-review-detail-button>검토하기</button>
      </div>
      <details class="review-more-actions">
        <summary>더보기</summary>
        <div class="review-actions">
          <button type="button" data-review-job-action="approve" data-job-type="${escapeHtml(job.type || "")}" data-job-id="${escapeHtml(job.id || "")}" data-job-title="${escapeHtml(job.title || "")}">승인</button>
          <button type="button" data-review-job-action="revision" data-job-type="${escapeHtml(job.type || "")}" data-job-id="${escapeHtml(job.id || "")}" data-job-title="${escapeHtml(job.title || "")}">수정필요</button>
          <button type="button" data-review-job-action="edit-diff" data-job-type="${escapeHtml(job.type || "")}" data-job-id="${escapeHtml(job.id || "")}" data-job-title="${escapeHtml(job.title || "")}" data-job-draft="${escapeHtml(progress || job.title || "")}">수정기록</button>
          <button type="button" data-review-job-action="reject" data-job-type="${escapeHtml(job.type || "")}" data-job-id="${escapeHtml(job.id || "")}" data-job-title="${escapeHtml(job.title || "")}">반려</button>
        </div>
      </details>
    </article>
  `;
}

function reviewSkillCard(candidate = {}, decisionsByKey = new Map()) {
  const decision = decisionsByKey.get(`skill:${candidate.id || ""}`);
  const decisionLabel = reviewDecisionLabel(decision);
  const reviewSummary = candidate.reviewSummary || {};
  const draftText = candidate.instructionsPreview || candidate.evidencePreview || candidate.description || candidate.title || "";
  const editSummary = Number(reviewSummary.edited || 0) ? `수정기록 ${Number(reviewSummary.edited || 0)}개` : "";
  return `
    <article class="review-item skill" data-review-detail="skill" data-detail-title="${escapeHtml(candidate.title || candidate.id || "스킬 후보")}" data-detail-meta="${escapeHtml([skillCandidateKindLabel(candidate.kind), candidate.statusLabel || "검토 대기", candidate.createdAt ? formatShortTime(candidate.createdAt) : ""].filter(Boolean).join(" · "))}" data-detail-score="${Number(candidate.confidence || 0)}점" data-detail-body="${escapeHtml(candidate.description || candidate.evidencePreview || draftText || "")}" data-detail-note="${escapeHtml(editSummary || candidate.reviewNote || "")}">
      <div class="review-item-head">
        <strong>${escapeHtml(candidate.title || candidate.id || "스킬 후보")}</strong>
        <b class="review-trust info">${Number(candidate.confidence || 0)}점</b>
      </div>
      <div class="review-item-meta">
        <span>${escapeHtml(skillCandidateKindLabel(candidate.kind))}</span>
        <span>${escapeHtml(candidate.statusLabel || "검토 대기")}</span>
        ${candidate.createdAt ? `<span>${escapeHtml(formatShortTime(candidate.createdAt))}</span>` : ""}
      </div>
      ${candidate.description ? `<p>${escapeHtml(candidate.description)}</p>` : ""}
      ${candidate.evidencePreview ? `<small>${escapeHtml(candidate.evidencePreview)}</small>` : ""}
      ${candidate.reviewNote ? `<small class="review-decision ${escapeHtml(candidate.reviewStatus || "")}">후보 검토: ${escapeHtml(skillCandidateStatusText(candidate.reviewStatus || candidate.status))}${candidate.reviewNote ? ` · ${escapeHtml(candidate.reviewNote)}` : ""}</small>` : ""}
      ${decisionLabel ? `<small class="review-decision ${escapeHtml(decision.status || "")}">검토: ${escapeHtml(decisionLabel)}${decision.note ? ` · ${escapeHtml(decision.note)}` : ""}</small>` : ""}
      ${editSummary ? `<small class="review-edit">${escapeHtml(editSummary)}</small>` : ""}
      <div class="review-actions primary">
        <button type="button" data-review-detail-button>검토하기</button>
      </div>
      <details class="review-more-actions">
        <summary>더보기</summary>
        <div class="review-actions">
          <button type="button" data-review-skill-action="approve" data-candidate-id="${escapeHtml(candidate.id || "")}" data-candidate-title="${escapeHtml(candidate.title || "")}">${candidate.kind === "memory" ? "메모리 적용" : "스킬 적용"}</button>
          <button type="button" data-review-skill-action="revision" data-candidate-id="${escapeHtml(candidate.id || "")}" data-candidate-title="${escapeHtml(candidate.title || "")}">수정필요</button>
          <button type="button" data-review-skill-action="edit-diff" data-candidate-id="${escapeHtml(candidate.id || "")}" data-candidate-title="${escapeHtml(candidate.title || "")}" data-job-type="skill" data-job-id="${escapeHtml(candidate.id || "")}" data-job-title="${escapeHtml(candidate.title || "")}" data-job-draft="${escapeHtml(draftText)}">수정기록</button>
          <button type="button" data-review-skill-action="dismiss" data-candidate-id="${escapeHtml(candidate.id || "")}" data-candidate-title="${escapeHtml(candidate.title || "")}">반려</button>
        </div>
      </details>
    </article>
  `;
}

function reviewPortfolioId(record = {}) {
  return String(record.id || record.recordId || record.jobId || "").trim();
}

function reviewPortfolioCard(record = {}, decisionsByKey = new Map()) {
  const assetReview = record.assetReview && typeof record.assetReview === "object" ? record.assetReview : null;
  const portfolioId = reviewPortfolioId(record);
  const decision = decisionsByKey.get(`portfolio:${portfolioId}`);
  const decisionLabel = reviewDecisionLabel(decision);
  return `
    <article class="review-item portfolio" data-review-detail="portfolio" data-detail-title="${escapeHtml(record.title || "포트폴리오 후보")}" data-detail-meta="${escapeHtml([record.grade || "평가", record.passed ? "통과" : "보완", record.workType || ""].filter(Boolean).join(" · "))}" data-detail-score="${Number(record.score || 0)}점" data-detail-body="${escapeHtml(record.retrospective?.portfolioAngle || assetReview?.reason || record.portfolioRelPath || record.savedRelPath || "")}" data-detail-note="${escapeHtml(decisionLabel || "")}">
      <div class="review-item-head">
        <strong>${escapeHtml(record.title || "포트폴리오 후보")}</strong>
        <b class="review-trust ${reviewTrustClass(record.score || 0)}">${Number(record.score || 0)}점</b>
      </div>
      <div class="review-item-meta">
        <span>${escapeHtml(record.grade || "평가")}</span>
        <span>${record.passed ? "통과" : "보완"}</span>
        ${record.workType ? `<span>${escapeHtml(record.workType)}</span>` : ""}
      </div>
      ${record.retrospective?.portfolioAngle ? `<p>${escapeHtml(record.retrospective.portfolioAngle)}</p>` : ""}
      ${assetReview?.reason ? `<small>${escapeHtml(assetReview.reason)}</small>` : ""}
      ${record.portfolioRelPath || record.savedRelPath ? `<small>${escapeHtml(record.portfolioRelPath || record.savedRelPath)}</small>` : ""}
      ${decisionLabel ? `<small class="review-decision ${escapeHtml(decision.status || "")}">자산 검토: ${escapeHtml(decisionLabel)}${decision.note ? ` · ${escapeHtml(decision.note)}` : ""}</small>` : ""}
      <div class="review-actions primary">
        <button type="button" data-review-detail-button>검토하기</button>
      </div>
      <details class="review-more-actions">
        <summary>더보기</summary>
        <div class="review-actions">
          <button type="button" data-review-portfolio-action="approve" data-record-id="${escapeHtml(portfolioId)}" data-job-id="${escapeHtml(record.jobId || "")}" data-record-title="${escapeHtml(record.title || "")}">자산 승인</button>
          <button type="button" data-review-portfolio-action="revision" data-record-id="${escapeHtml(portfolioId)}" data-job-id="${escapeHtml(record.jobId || "")}" data-record-title="${escapeHtml(record.title || "")}">보완 필요</button>
          <button type="button" data-review-portfolio-action="reject" data-record-id="${escapeHtml(portfolioId)}" data-job-id="${escapeHtml(record.jobId || "")}" data-record-title="${escapeHtml(record.title || "")}">반려</button>
        </div>
      </details>
    </article>
  `;
}

function automationReviewItemId(triggerId = "", entry = {}) {
  return `${String(triggerId || "").trim()}:${String(entry.id || entry.ranAt || entry.event || "run").trim()}`;
}

function automationReviewItems(automation = {}) {
  const rows = [];
  for (const trigger of Array.isArray(automation.triggers) ? automation.triggers : []) {
    const history = Array.isArray(trigger.history) && trigger.history.length
      ? trigger.history
      : trigger.lastResult
        ? [trigger.lastResult]
        : [];
    for (const entry of history.slice(0, 6)) {
      const id = automationReviewItemId(trigger.id, entry);
      if (!trigger.id || !id.includes(":")) continue;
      rows.push({
        id,
        triggerId: trigger.id,
        triggerTitle: trigger.title || trigger.id,
        triggerType: trigger.type || "",
        triggerStatus: trigger.status || "",
        statusLabel: trigger.statusLabel || trigger.status || "",
        ok: entry.ok === true,
        event: entry.event || "",
        file: entry.file || "",
        jobId: entry.jobId || "",
        jobStatus: entry.jobStatus || "",
        jobStatusLabel: entry.jobStatusLabel || "",
        jobCompletedAt: entry.jobCompletedAt || "",
        jobSavedOk: entry.jobSavedOk === true,
        jobSavedRelPath: entry.jobSavedRelPath || "",
        jobSavedReason: entry.jobSavedReason || "",
        modeLabel: entry.modeLabel || "",
        intent: entry.intent || "",
        error: entry.error || "",
        attempt: entry.attempt || 1,
        retryScheduledAt: entry.retryScheduledAt || "",
        retryExhausted: entry.retryExhausted === true,
        durationMs: entry.durationMs || 0,
        ranAt: entry.ranAt || trigger.lastRunAt || "",
        message: trigger.message || ""
      });
    }
  }
  return rows
    .sort((a, b) => new Date(b.ranAt || 0).getTime() - new Date(a.ranAt || 0).getTime())
    .slice(0, 12);
}

function automationReviewDecisionLabel(decision = null) {
  const label = reviewDecisionLabel(decision);
  return label ? `자동화 검토: ${label}` : "";
}

function reviewAutomationCard(item = {}, decisionsByKey = new Map()) {
  const decision = decisionsByKey.get(`automation:${item.id || ""}`);
  const decisionLabel = automationReviewDecisionLabel(decision);
  const trust = item.ok ? 88 : item.retryScheduledAt ? 58 : 42;
  const typeLabel = item.triggerType === "folder_watch" ? "폴더 감시" : "예약";
  const resultText = item.ok
    ? [item.jobStatusLabel || item.modeLabel || item.intent || "실행 완료", item.jobId ? `작업 ${item.jobId}` : "", item.jobSavedRelPath ? `Vault ${item.jobSavedRelPath}` : "", formatAutomationDuration(item.durationMs)].filter(Boolean).join(" · ")
    : [item.jobStatusLabel || "실패", item.error || item.jobSavedReason || "", item.retryScheduledAt ? `재시도 ${formatTriggerDate(item.retryScheduledAt)}` : "", `${item.attempt || 1}회차`].filter(Boolean).join(" · ");
  return `
    <article class="review-item automation ${item.ok ? "" : "warn"}" data-review-detail="automation" data-detail-title="${escapeHtml(item.triggerTitle || item.triggerId || "자동화 실행")}" data-detail-meta="${escapeHtml([item.ok ? "성공" : "실패", typeLabel, item.ranAt ? formatShortTime(item.ranAt) : ""].filter(Boolean).join(" · "))}" data-detail-score="${trust}점" data-detail-body="${escapeHtml(resultText || item.file || item.error || "")}" data-detail-note="${escapeHtml(decisionLabel || "")}">
      <div class="review-item-head">
        <strong>${escapeHtml(item.triggerTitle || item.triggerId || "자동화 실행")}</strong>
        <b class="review-trust ${reviewTrustClass(trust)}">${trust}점</b>
      </div>
      <div class="review-item-meta">
        <span>${escapeHtml(item.ok ? "성공" : "실패")}</span>
        <span>${escapeHtml(typeLabel)}</span>
        ${item.ranAt ? `<span>${escapeHtml(formatShortTime(item.ranAt))}</span>` : ""}
        ${item.event ? `<span>${escapeHtml(item.event)}</span>` : ""}
      </div>
      ${resultText ? `<p>${escapeHtml(resultText)}</p>` : ""}
      ${item.file ? `<small>${escapeHtml(item.file)}</small>` : ""}
      ${decisionLabel ? `<small class="review-decision ${escapeHtml(decision.status || "")}">${escapeHtml(decisionLabel)}${decision.note ? ` · ${escapeHtml(decision.note)}` : ""}</small>` : ""}
      <div class="review-actions primary">
        <button type="button" data-review-detail-button>검토하기</button>
      </div>
      <details class="review-more-actions">
        <summary>더보기</summary>
        <div class="review-actions">
          <button type="button" data-review-automation-action="approve" data-automation-id="${escapeHtml(item.id || "")}" data-automation-title="${escapeHtml(item.triggerTitle || "")}">승인</button>
          <button type="button" data-review-automation-action="revision" data-automation-id="${escapeHtml(item.id || "")}" data-automation-title="${escapeHtml(item.triggerTitle || "")}">보완 필요</button>
          <button type="button" data-review-automation-action="reject" data-automation-id="${escapeHtml(item.id || "")}" data-automation-title="${escapeHtml(item.triggerTitle || "")}">반려</button>
        </div>
      </details>
    </article>
  `;
}

function renderReviewInbox({ queue = {}, performance = {}, skills = {}, decisions = {}, automation = {} } = {}) {
  if (!nodes.reviewStatus) return;
  const jobs = Array.isArray(queue.jobs) ? queue.jobs : [];
  const records = Array.isArray(performance.records) ? performance.records : [];
  const candidates = Array.isArray(skills.candidates) ? skills.candidates : [];
  const decisionRows = Array.isArray(decisions.decisions) ? decisions.decisions : [];
  const recordsByJobId = new Map(records.filter((record) => record.jobId).map((record) => [record.jobId, record]));
  const decisionsByKey = new Map(decisionRows.filter((decision) => decision.key).map((decision) => [decision.key, decision]));
  const automationRows = automationReviewItems(automation);
  reviewAutomationItemsState = automationRows;
  const attentionJobs = jobs.filter((job) => !reviewDecisionClosesAttention(job.reviewDecision) && (job.needsAttention || ["waiting_question", "failed", "completed_with_errors", "cancelled"].includes(job.status))).slice(0, 8);
  const automationAttention = automationRows.filter((item) => {
    const decision = decisionsByKey.get(`automation:${item.id || ""}`);
    return item.ok === false && !reviewDecisionClosesAttention(decision);
  });
  const completedJobs = jobs.filter((job) => ["completed", "completed_with_errors"].includes(job.status)).slice(0, 8);
  const pendingSkills = candidates.filter((candidate) => ["pending", "needs_revision"].includes(candidate.status)).slice(0, 8);
  const portfolioRecords = records.filter((record) => record.portfolioCandidate || record.portfolioRelPath).slice(0, 8);
  const queueSummary = queue.summary || {};
  const performanceSummary = performance.summary || {};
  const skillsSummary = skills.summary || {};
  const opsSummary = buildReviewOpsSummary(jobs, records, decisionRows, recordsByJobId, decisionsByKey, skillsSummary);
  renderReviewOpsDashboard(opsSummary);
  renderReviewSummaryLine({
    queueSummary,
    performanceSummary,
    skillsSummary,
    decisionCount: decisionRows.length,
    attentionCount: attentionJobs.length,
    automationAttention: automationAttention.length
  });

  if (nodes.reviewQueueCount) nodes.reviewQueueCount.textContent = `${Number(queueSummary.attention || attentionJobs.length || 0) + automationAttention.length}건`;
  if (nodes.reviewQueueMeta) nodes.reviewQueueMeta.textContent = attentionJobs.length || automationAttention.length
    ? [attentionJobs.length ? "작업 확인 필요" : "", automationAttention.length ? `자동화 ${automationAttention.length}건` : ""].filter(Boolean).join(" · ")
    : "대기 없음";
  if (nodes.reviewActiveCount) nodes.reviewActiveCount.textContent = `${Number(queueSummary.active || queueSummary.running || 0)}건`;
  if (nodes.reviewActiveMeta) nodes.reviewActiveMeta.textContent = queueSummary.latestUpdatedAt ? `최근 ${formatShortTime(queueSummary.latestUpdatedAt)}` : "실행 대기";
  if (nodes.reviewQualityScore) nodes.reviewQualityScore.textContent = performanceSummary.lastScore ? `${performanceSummary.lastScore}점` : `${performanceSummary.avgScore || 0}점`;
  if (nodes.reviewQualityMeta) nodes.reviewQualityMeta.textContent = performanceSummary.total ? `평균 ${performanceSummary.avgScore || 0}점 · 통과 ${performanceSummary.passedCount || 0}/${performanceSummary.total}` : "성과기록 대기";
  if (nodes.reviewSkillCount) nodes.reviewSkillCount.textContent = `${Number(skillsSummary.pending || 0) + Number(skillsSummary.needsRevision || 0) || pendingSkills.length || 0}개`;
  if (nodes.reviewSkillMeta) nodes.reviewSkillMeta.textContent = skillsSummary.approved ? `적용 ${skillsSummary.approved}개 · 수정필요 ${skillsSummary.needsRevision || 0}` : "검토 대기 없음";

  if (nodes.reviewAttentionStatus) nodes.reviewAttentionStatus.textContent = attentionJobs.length ? `${attentionJobs.length}건` : "정상";
  if (nodes.reviewAttentionList) nodes.reviewAttentionList.innerHTML = attentionJobs.length ? attentionJobs.map((job) => reviewJobCard(job, recordsByJobId, decisionsByKey)).join("") : reviewEmpty("확인 필요한 작업이 없습니다.");
  if (nodes.reviewCompletedStatus) nodes.reviewCompletedStatus.textContent = completedJobs.length ? `${completedJobs.length}건` : "대기";
  if (nodes.reviewCompletedList) nodes.reviewCompletedList.innerHTML = completedJobs.length ? completedJobs.map((job) => reviewJobCard(job, recordsByJobId, decisionsByKey)).join("") : reviewEmpty("완료된 작업 기록이 없습니다.");
  if (nodes.reviewSkillStatus) nodes.reviewSkillStatus.textContent = pendingSkills.length ? `${pendingSkills.length}개` : "대기";
  if (nodes.reviewSkillList) nodes.reviewSkillList.innerHTML = pendingSkills.length ? pendingSkills.map((candidate) => reviewSkillCard(candidate, decisionsByKey)).join("") : reviewEmpty("검토할 스킬 후보가 없습니다.");
  if (nodes.reviewPortfolioStatus) nodes.reviewPortfolioStatus.textContent = portfolioRecords.length ? `${portfolioRecords.length}건` : "대기";
  if (nodes.reviewPortfolioList) nodes.reviewPortfolioList.innerHTML = portfolioRecords.length ? portfolioRecords.map((record) => reviewPortfolioCard(record, decisionsByKey)).join("") : reviewEmpty("포트폴리오 후보가 없습니다.");
  if (nodes.reviewAutomationStatus) nodes.reviewAutomationStatus.textContent = automationRows.length ? `${automationRows.length}건` : "대기";
  if (nodes.reviewAutomationList) nodes.reviewAutomationList.innerHTML = automationRows.length ? automationRows.slice(0, 8).map((item) => reviewAutomationCard(item, decisionsByKey)).join("") : reviewEmpty("자동화 실행 이력이 없습니다.");
  setReviewSection(activeReviewSection);
  const firstVisibleItem = nodes.reviewPage?.querySelector(`[data-review-section-panel="${CSS.escape(activeReviewSection)}"]:not([hidden]) .review-item[data-review-detail]`);
  if (firstVisibleItem) renderReviewDetailFromItem(firstVisibleItem);
}

async function fetchReviewApiState(pathValue, label) {
  const response = await apiFetch(pathValue, { cache: "no-store" });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${label}: HTTP ${response.status}${text ? ` · ${text.slice(0, 80)}` : ""}`);
  }
  const data = await response.json();
  if (data.ok === false) throw new Error(`${label}: ${data.error || `HTTP ${response.status}`}`);
  return data;
}

async function loadReviewInbox() {
  if (!nodes.reviewStatus) return null;
  nodes.reviewStatus.textContent = "검토 불러오는 중";
  const [queue, performance, skills, decisions, automation] = await Promise.all([
    fetchReviewApiState("/api/task-queue?limit=30", "작업 큐").catch((error) => ({ ok: false, error: error.message, jobs: [], summary: {} })),
    fetchReviewApiState("/api/performance-log?limit=20", "성과기록").catch((error) => ({ ok: false, error: error.message, records: [], summary: {} })),
    fetchReviewApiState("/api/skill-candidates", "스킬 후보").catch((error) => ({ ok: false, error: error.message, candidates: [], summary: {} })),
    fetchReviewApiState("/api/review-decisions", "검토 결정").catch((error) => ({ ok: false, error: error.message, decisions: [], summary: {} })),
    fetchReviewApiState("/api/automation-triggers", "자동화").catch((error) => ({ ok: false, error: error.message, triggers: [], summary: {} }))
  ]);
  renderReviewInbox({ queue, performance, skills, decisions, automation });
  const errors = [queue, performance, skills, decisions, automation].filter((item) => item.ok === false && item.error).map((item) => item.error);
  nodes.reviewStatus.textContent = errors.length ? `일부 로드 실패: ${errors.join(" · ")}` : `업데이트 ${nowTime()}`;
  return { queue, performance, skills, decisions, automation };
}

function showReviewJobDetail(job = {}) {
  const logs = Array.isArray(job.logs) ? job.logs.slice(-6).map((log) => `- ${formatShortTime(log.createdAt)} · ${log.actor || "system"} · ${log.message || ""}`) : [];
  if (nodes.chatResultMode) nodes.chatResultMode.textContent = "검토 상세";
  if (nodes.chatRunMeta) nodes.chatRunMeta.textContent = `${job.type === "codex" ? "Codex" : "직원 실행"} · ${job.statusLabel || officeJobStatusLabel(job.status)}`;
  if (nodes.chatResultPreview) {
    nodes.chatResultPreview.textContent = [
      "# 검토 작업 상세",
      "",
      `- 작업 ID: ${job.id || ""}`,
      `- 유형: ${job.type === "codex" ? "Codex" : "직원 실행"}`,
      `- 상태: ${job.statusLabel || officeJobStatusLabel(job.status)}`,
      `- 제목: ${job.title || ""}`,
      job.detail ? `- 세부: ${job.detail}` : "",
      job.saved?.ok ? `- 저장: ${job.saved.relPath || "Vault 저장됨"}` : job.saved?.reason ? `- 저장: ${job.saved.reason}` : "",
      "",
      "## 진행",
      job.progress || job.lastLog || "진행 정보 없음",
      "",
      "## 최근 로그",
      logs.length ? logs.join("\n") : "로그 없음"
    ].filter(Boolean).join("\n");
  }
  switchPage("chat");
}

function showAutomationReviewDetail(item = {}) {
  if (nodes.chatResultMode) nodes.chatResultMode.textContent = "자동화 검토 상세";
  if (nodes.chatRunMeta) nodes.chatRunMeta.textContent = `${item.triggerTitle || item.triggerId || "자동화"} · ${item.ok ? "성공" : "실패"}`;
  if (nodes.chatResultPreview) {
    nodes.chatResultPreview.textContent = [
      "# 자동화 실행 상세",
      "",
      `- 검토 ID: ${item.id || ""}`,
      `- 트리거: ${item.triggerTitle || item.triggerId || ""}`,
      `- 유형: ${item.triggerType === "folder_watch" ? "폴더 감시" : "예약"}`,
      `- 이벤트: ${item.event || ""}`,
      `- 실행 시각: ${item.ranAt || ""}`,
      `- 결과: ${item.ok ? "성공" : "실패"}`,
      item.jobId ? `- 작업 ID: ${item.jobId}` : "",
      item.jobStatusLabel ? `- 작업 상태: ${item.jobStatusLabel}` : "",
      item.jobSavedRelPath ? `- 저장: ${item.jobSavedRelPath}` : item.jobSavedReason ? `- 저장: ${item.jobSavedReason}` : "",
      item.file ? `- 파일: ${item.file}` : "",
      item.retryScheduledAt ? `- 재시도 예약: ${item.retryScheduledAt}` : "",
      item.error ? `- 오류: ${item.error}` : "",
      "",
      "## 실행 메시지",
      item.message || "(메시지 없음)"
    ].filter(Boolean).join("\n");
  }
  switchPage("chat");
}

async function saveReviewDecision(payload = {}) {
  const response = await apiFetch("/api/review-decisions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok || data.ok === false) throw new Error(data.error || `HTTP ${response.status}`);
  return data;
}

async function saveSkillCandidateAction(payload = {}) {
  const response = await apiFetch("/api/skill-candidates", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok || data.ok === false) throw new Error(data.error || `HTTP ${response.status}`);
  return data;
}

async function saveSkillCandidateReview(candidateId, payload = {}) {
  const response = await apiFetch(`/api/skill-candidates/${encodeURIComponent(candidateId)}/review`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok || data.ok === false) throw new Error(data.error || `HTTP ${response.status}`);
  return data;
}

function closeReviewEditPanel() {
  reviewEditTarget = null;
  if (nodes.reviewEditPanel) nodes.reviewEditPanel.hidden = true;
  if (nodes.reviewEditTarget) nodes.reviewEditTarget.textContent = "선택 대기";
  if (nodes.reviewEditDraft) nodes.reviewEditDraft.value = "";
  if (nodes.reviewEditFinal) nodes.reviewEditFinal.value = "";
  if (nodes.reviewEditNote) nodes.reviewEditNote.value = "";
}

function openReviewEditPanel(button) {
  if (!nodes.reviewEditPanel || !nodes.reviewEditDraft || !nodes.reviewEditFinal) return false;
  const type = button.dataset.jobType || "office";
  const id = button.dataset.jobId || "";
  const targetTitle = button.dataset.jobTitle || id || "작업";
  const draftText = button.dataset.jobDraft || targetTitle || "";
  reviewEditTarget = { type, id, targetTitle };
  if (nodes.reviewEditTarget) nodes.reviewEditTarget.textContent = compactReply(targetTitle, 44);
  nodes.reviewEditDraft.value = draftText;
  nodes.reviewEditFinal.value = draftText;
  if (nodes.reviewEditNote) nodes.reviewEditNote.value = "";
  nodes.reviewEditPanel.hidden = false;
  nodes.reviewEditPanel.scrollIntoView({ block: "nearest", behavior: "smooth" });
  window.setTimeout(() => nodes.reviewEditFinal?.focus(), 80);
  if (nodes.reviewStatus) nodes.reviewStatus.textContent = "수정기록 입력 중";
  return true;
}

async function submitReviewEditPanel(event) {
  event?.preventDefault();
  if (!reviewEditTarget?.id) {
    if (nodes.reviewStatus) nodes.reviewStatus.textContent = "수정기록을 저장할 작업이 선택되지 않았습니다.";
    return false;
  }
  const draftText = nodes.reviewEditDraft?.value || "";
  const finalText = nodes.reviewEditFinal?.value || "";
  const note = nodes.reviewEditNote?.value || "";
  if (nodes.reviewStatus) nodes.reviewStatus.textContent = "수정 diff 저장 중";
  if (nodes.reviewEditSaveBtn) nodes.reviewEditSaveBtn.disabled = true;
  try {
    if (reviewEditTarget.type === "skill") {
      await saveSkillCandidateReview(reviewEditTarget.id, {
        action: "save_edit",
        targetTitle: reviewEditTarget.targetTitle,
        draftText,
        finalText,
        note
      });
      await loadSkillCandidates();
      await loadActiveSkills();
    } else {
      await saveReviewDecision({
        action: "save_edit",
        type: reviewEditTarget.type,
        id: reviewEditTarget.id,
        targetTitle: reviewEditTarget.targetTitle,
        draftText,
        finalText,
        note
      });
    }
    closeReviewEditPanel();
    await loadReviewInbox();
    return true;
  } catch (error) {
    if (nodes.reviewStatus) nodes.reviewStatus.textContent = `수정 diff 저장 실패: ${error.message}`;
    return false;
  } finally {
    if (nodes.reviewEditSaveBtn) nodes.reviewEditSaveBtn.disabled = false;
  }
}

async function handleReviewClick(event) {
  const sectionButton = event.target.closest("button[data-review-section]");
  if (sectionButton && nodes.reviewPage?.contains(sectionButton)) {
    setReviewSection(sectionButton.dataset.reviewSection || "pending");
    return;
  }
  const reviewDetailButton = event.target.closest("button[data-review-detail-button]");
  if (reviewDetailButton && nodes.reviewPage?.contains(reviewDetailButton)) {
    renderReviewDetailFromItem(reviewDetailButton.closest(".review-item"));
    return;
  }
  const detailItem = event.target.closest(".review-item[data-review-detail]");
  if (detailItem && nodes.reviewPage?.contains(detailItem) && !event.target.closest("button, summary, textarea, input, select, label")) {
    renderReviewDetailFromItem(detailItem);
    return;
  }
  const openButton = event.target.closest("button[data-review-open]");
  if (openButton && nodes.reviewPage?.contains(openButton)) {
    const requested = openButton.dataset.reviewOpen || "chat";
    const target = ["vault", "settings", "chat"].includes(requested) ? requested : "chat";
    switchPage(target);
    return;
  }
  const automationButton = event.target.closest("button[data-review-automation-action]");
  if (automationButton && nodes.reviewPage?.contains(automationButton)) {
    const action = automationButton.dataset.reviewAutomationAction || "";
    const id = automationButton.dataset.automationId || "";
    const title = automationButton.dataset.automationTitle || id;
    const item = reviewAutomationItemsState.find((row) => row.id === id);
    if (action === "detail") {
      showAutomationReviewDetail(item || { id, triggerTitle: title });
      return;
    }
    automationButton.disabled = true;
    try {
      if (!id) throw new Error("자동화 검토 ID가 없습니다");
      const needsNote = action !== "approve";
      const note = needsNote ? window.prompt(action === "reject" ? "자동화 결과 반려 이유를 적어주세요." : "보완할 부분을 적어주세요.", "") : "";
      if (needsNote && note === null) return;
      if (nodes.reviewStatus) nodes.reviewStatus.textContent = "자동화 검토 저장 중";
      await saveReviewDecision({
        action,
        type: "automation",
        id,
        targetTitle: title,
        note: note || ""
      });
      await loadReviewInbox();
      if (nodes.reviewStatus) nodes.reviewStatus.textContent = action === "approve" ? "자동화 결과 승인 저장 완료" : "자동화 검토 저장 완료";
    } catch (error) {
      if (nodes.reviewStatus) nodes.reviewStatus.textContent = `자동화 검토 실패: ${error.message}`;
    } finally {
      automationButton.disabled = false;
    }
    return;
  }
  const skillButton = event.target.closest("button[data-review-skill-action]");
  if (skillButton && nodes.reviewPage?.contains(skillButton)) {
    const action = skillButton.dataset.reviewSkillAction || "";
    const id = skillButton.dataset.candidateId || "";
    const title = skillButton.dataset.candidateTitle || id;
    if (action === "edit-diff") {
      openReviewEditPanel(skillButton);
      return;
    }
    skillButton.disabled = true;
    try {
      if (!id) throw new Error("스킬 후보 ID가 없습니다");
      const needsNote = action !== "approve";
      const note = needsNote ? window.prompt(action === "dismiss" ? "스킬 후보 반려 이유를 적어주세요." : "수정이 필요한 부분을 적어주세요.", "") : "";
      if (needsNote && note === null) return;
      const reviewAction = action === "dismiss" ? "reject" : action;
      const data = await saveSkillCandidateReview(id, { action: reviewAction, targetTitle: title, note: note || "" });
      if (data.skills) renderSkillsState(data.skills);
      if (data.profile) renderProfileState(data.profile);
      await loadActiveSkills();
      await loadSkillCandidates();
      await loadReviewInbox();
      if (nodes.reviewStatus) nodes.reviewStatus.textContent = action === "approve" ? "스킬 적용 완료" : "스킬 후보 검토 저장 완료";
      if (action === "approve") addChatMessage("assistant", "검토에서 스킬 후보를 직원 스킬에 적용했습니다.", "YOMI Office", "스킬 적용");
    } catch (error) {
      if (nodes.reviewStatus) nodes.reviewStatus.textContent = `스킬 후보 처리 실패: ${error.message}`;
    } finally {
      skillButton.disabled = false;
    }
    return;
  }
  const portfolioButton = event.target.closest("button[data-review-portfolio-action]");
  if (portfolioButton && nodes.reviewPage?.contains(portfolioButton)) {
    const action = portfolioButton.dataset.reviewPortfolioAction || "";
    const id = portfolioButton.dataset.recordId || portfolioButton.dataset.jobId || "";
    const title = portfolioButton.dataset.recordTitle || id;
    portfolioButton.disabled = true;
    try {
      if (!id) throw new Error("포트폴리오 기록 ID가 없습니다");
      const needsNote = action !== "approve";
      const note = needsNote ? window.prompt(action === "reject" ? "포트폴리오 반려 이유를 적어주세요." : "보완할 부분을 적어주세요.", "") : "";
      if (needsNote && note === null) return;
      if (nodes.reviewStatus) nodes.reviewStatus.textContent = "포트폴리오 검토 저장 중";
      await saveReviewDecision({
        action,
        type: "portfolio",
        id,
        targetTitle: title,
        note: note || ""
      });
      await loadReviewInbox();
      if (nodes.reviewStatus) nodes.reviewStatus.textContent = action === "approve" ? "포트폴리오 승인 저장 완료" : "포트폴리오 검토 저장 완료";
    } catch (error) {
      if (nodes.reviewStatus) nodes.reviewStatus.textContent = `포트폴리오 검토 실패: ${error.message}`;
    } finally {
      portfolioButton.disabled = false;
    }
    return;
  }
  const detailButton = event.target.closest("button[data-review-job-action]");
  if (!detailButton || !nodes.reviewPage?.contains(detailButton)) return;
  detailButton.disabled = true;
  try {
    const action = detailButton.dataset.reviewJobAction || "";
    if (action === "edit-diff") {
      openReviewEditPanel(detailButton);
      return;
    }
    if (["approve", "reject", "revision"].includes(action)) {
      const status = action === "approve" ? "approved" : action === "reject" ? "rejected" : "needs_revision";
      const needsNote = action !== "approve";
      const note = needsNote ? window.prompt(action === "reject" ? "반려 이유를 남겨주세요." : "수정이 필요한 부분을 남겨주세요.", "") : "";
      if (needsNote && note === null) return;
      if (nodes.reviewStatus) nodes.reviewStatus.textContent = "검토 결정 저장 중";
      await saveReviewDecision({
        action,
        status,
        type: detailButton.dataset.jobType || "office",
        id: detailButton.dataset.jobId || "",
        targetTitle: detailButton.dataset.jobTitle || "",
        note: note || ""
      });
      await loadReviewInbox();
      return;
    }
    const detail = await updateTaskQueueAction({
      action: "detail",
      id: detailButton.dataset.jobId || "",
      type: detailButton.dataset.jobType || ""
    });
    if (detail?.job) showReviewJobDetail(detail.job);
    await loadReviewInbox();
  } catch (error) {
    if (nodes.reviewStatus) nodes.reviewStatus.textContent = `상세 로드 실패: ${error.message}`;
  } finally {
    detailButton.disabled = false;
  }
}

async function runOfficeTask() {
  if (!nodes.input || !nodes.runBtn) return;
  const task = nodes.input.value.trim();
  if (!task) return addLog("업무 내용을 먼저 입력하세요.", "secretary", "warn");
  nodes.runBtn.disabled = true;
  nodes.runBtn.textContent = "진행 중";
  nodes.reportText.textContent = "직원들이 업무를 처리하고 있습니다...";
  nodes.saveNotice.textContent = "보고서 생성 중";
  nodes.activityLog.innerHTML = "";
  startVisualFlow();
  try {
    const response = await apiFetch("/api/run-office-task", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ task }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
    nodes.reportText.textContent = data.report;
    nodes.saveNotice.textContent = data.saved?.ok ? `Vault 저장 완료: ${data.saved.relPath}` : data.saved?.reason || "Vault 미연결: 화면 결과만 생성됨";
    await refreshState();
    await loadRecentReports();
    await loadPerformanceLog();
  } catch (error) {
    nodes.reportText.textContent = `업무 실행 실패\n\n${error.message}`;
  } finally {
    nodes.runBtn.disabled = false;
    nodes.runBtn.textContent = "전송";
  }
}

function addChatMessage(role, text, label = "", meta = "") {
  const el = document.createElement("div");
  el.className = `chat-message ${role}`;
  const title = label || (role === "user" ? "나" : "YOMI Office");
  el.innerHTML = `<div class="chat-bubble-head"><strong>${escapeHtml(title)}</strong>${meta ? `<small>${escapeHtml(meta)}</small>` : ""}</div><p>${escapeHtml(text)}</p>`;
  nodes.chatThread.append(el);
  nodes.chatThread.scrollTop = nodes.chatThread.scrollHeight;
}

function renderChatSources(sources = []) {
  if (!nodes.chatSources) return;
  if (!sources.length) {
    nodes.chatSources.innerHTML = '<div class="empty">참고 문서 없음</div>';
    return;
  }
  nodes.chatSources.innerHTML = sources.map((item) => `<div class="chat-source"><strong>${escapeHtml(item.title || "문서")}</strong><span>${escapeHtml(item.displayPath || item.relPath || "")}</span><small>${escapeHtml(item.excerpt || "")}</small></div>`).join("");
}

function renderChatSessions(state = chatSessionsState) {
  chatSessionsState = state || { sessions: [] };
  if (!nodes.chatSessionList) return;
  const sessions = chatSessionsState.sessions || [];
  if (!sessions.length) {
    nodes.chatSessionList.innerHTML = '<div class="empty">대화 기록 없음</div>';
    return;
  }
  nodes.chatSessionList.innerHTML = sessions.slice(0, 18).map((session) => `
    <article class="chat-session-item ${session.id === activeChatSessionId ? "active" : ""}">
      <button class="chat-session-main" type="button" data-session-id="${escapeHtml(session.id)}">
        <strong>${escapeHtml(session.title || "새 대화")}</strong>
        <span>${escapeHtml(session.lastMode || `${session.turnCount || 0}턴`)}</span>
        <small>${escapeHtml(session.lastUser || "")}</small>
        <div class="chat-session-metrics" aria-label="세션 자산화 요약">
          <b>턴 ${Number(session.turnCount || 0)}</b>
          <b>자산 ${Number(session.assetCount || 0)}</b>
          <b>스킬 ${Number(session.skillCandidateCount || 0)}</b>
          <b>근거 ${Number(session.sourceCount || 0)}</b>
          ${Number(session.memoryCount || 0) ? `<b>메모리 ${Number(session.memoryCount || 0)}</b>` : ""}
        </div>
      </button>
      <button class="chat-session-delete" type="button" title="대화 삭제" aria-label="대화 삭제" data-session-action="delete" data-session-id="${escapeHtml(session.id)}">×</button>
    </article>
  `).join("");
}

function renderSessionTurns(session) {
  if (!session || !nodes.chatThread) return;
  nodes.chatThread.innerHTML = "";
  for (const turn of session.turns || []) {
    addChatMessage("user", turn.user || "", "나", "기록");
    const meta = turn.capture?.ok
      ? "Vault 저장"
      : turn.learning?.autoAppliedMemoryIds?.length
        ? "메모리 반영"
        : turn.skillCandidateIds?.length
          ? "스킬 후보"
          : turn.modeLabel || "기록";
    addChatMessage("assistant", turn.assistant || "", "YOMI Office", meta);
  }
  if (nodes.chatMemory) {
    const turnCount = Number(session.turnCount || session.turns?.length || 0);
    const assetCount = Number(session.assetCount || 0);
    const skillCount = Number(session.skillCandidateCount || 0);
    const sourceCount = Number(session.sourceCount || 0);
    nodes.chatMemory.textContent = `${turnCount}턴 · 자산 ${assetCount} · 스킬 ${skillCount} · 근거 ${sourceCount}`;
  }
}

async function loadChatSessions(selectId = "") {
  if (!nodes.chatSessionList) return null;
  try {
    const url = selectId ? `/api/chat-sessions?id=${encodeURIComponent(selectId)}` : "/api/chat-sessions";
    const response = await apiFetch(url, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok || data.ok === false) throw new Error(data.error || `HTTP ${response.status}`);
    chatSessionsState = data;
    if (!activeChatSessionId && data.sessions?.[0]) activeChatSessionId = data.sessions[0].id;
    renderChatSessions(data);
    if (data.selected) {
      activeChatSessionId = data.selected.id;
      renderChatSessions(data);
      renderSessionTurns(data.selected);
    }
    return data;
  } catch (error) {
    nodes.chatSessionList.innerHTML = `<div class="empty">대화 기록 로드 실패: ${escapeHtml(error.message)}</div>`;
    return null;
  }
}

async function updateChatSessionAction(payload = {}) {
  const response = await apiFetch("/api/chat-sessions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok || data.ok === false) throw new Error(data.error || `HTTP ${response.status}`);
  return data;
}

async function startNewChatSession() {
  try {
    const data = await updateChatSessionAction({ action: "create", title: "새 대화" });
    activeChatSessionId = data.selected?.id || data.sessions?.[0]?.id || "";
    if (nodes.chatThread) nodes.chatThread.innerHTML = "";
    if (nodes.chatMemory) nodes.chatMemory.textContent = "새 대화";
    renderChatSessions(data);
  } catch (error) {
    activeChatSessionId = "";
    if (nodes.chatThread) nodes.chatThread.innerHTML = "";
    if (nodes.chatMemory) nodes.chatMemory.textContent = `새 대화 준비 실패: ${error.message}`;
    renderChatSessions(chatSessionsState);
  }
}

async function handleChatSessionClick(event) {
  const actionButton = event.target.closest("button[data-session-action]");
  if (actionButton && nodes.chatSessionList?.contains(actionButton)) {
    const action = actionButton.dataset.sessionAction || "";
    const id = actionButton.dataset.sessionId || "";
    actionButton.disabled = true;
    try {
      const data = await updateChatSessionAction({ action, id });
      if (id === activeChatSessionId) {
        activeChatSessionId = "";
        if (nodes.chatThread) nodes.chatThread.innerHTML = "";
        if (nodes.chatMemory) nodes.chatMemory.textContent = "대화 기록 삭제됨";
      }
      renderChatSessions(data);
    } catch (error) {
      if (nodes.chatMemory) nodes.chatMemory.textContent = `세션 처리 실패: ${error.message}`;
    } finally {
      actionButton.disabled = false;
    }
    return;
  }
  const button = event.target.closest("button[data-session-id]");
  if (!button || !nodes.chatSessionList?.contains(button)) return;
  loadChatSessions(button.dataset.sessionId || "");
}

function skillCandidateKindLabel(kind = "") {
  if (kind === "memory") return "메모리";
  if (kind === "workflow") return "워크플로우";
  if (kind === "template") return "템플릿";
  return "스킬";
}

function skillCandidateStatusText(status = "") {
  return {
    pending: "검토 대기",
    approved: "적용됨",
    dismissed: "숨김",
    rejected: "반려",
    needs_revision: "수정 필요"
  }[status] || status || "검토 대기";
}

function renderSkillCandidateAgentPicker(candidate = {}) {
  const selected = new Set(candidate.agentIds || []);
  return agents.map((agent) => `
    <label>
      <input type="checkbox" data-skill-candidate-agent="${escapeHtml(agent.id)}" ${selected.has(agent.id) ? "checked" : ""}>
      <span>${escapeHtml(agent.name)}</span>
    </label>
  `).join("");
}

function renderSkillCandidateEditor(candidate = {}) {
  if (editingSkillCandidateId !== candidate.id || candidate.status === "approved") return "";
  return `
    <div class="skill-candidate-editor">
      <label>제목<input type="text" data-skill-candidate-field="title" value="${escapeHtml(candidate.title || "")}" autocomplete="off"></label>
      <label>설명<textarea data-skill-candidate-field="description" rows="2">${escapeHtml(candidate.description || "")}</textarea></label>
      <label class="wide">지침<textarea data-skill-candidate-field="instructions" rows="5">${escapeHtml(candidate.instructions || "")}</textarea></label>
      <div class="skill-candidate-agent-picker" aria-label="담당 직원 선택">
        ${renderSkillCandidateAgentPicker(candidate)}
      </div>
      <div class="connection-row-actions">
        <button type="button" data-skill-candidate-action="update" data-candidate-id="${escapeHtml(candidate.id)}">수정 저장</button>
        <button type="button" data-skill-candidate-action="cancel-edit" data-candidate-id="${escapeHtml(candidate.id)}">취소</button>
      </div>
    </div>
  `;
}

function skillCandidateScopeText(candidate = {}) {
  const scope = candidate.scope || {};
  const hierarchy = candidate.hierarchy || {};
  return [
    scope.workType ? `범위 ${scope.workType}` : "",
    hierarchy.level ? `계층 ${hierarchy.level}` : "",
    candidate.uses ? `근거 ${candidate.uses}건` : "",
    scope.specificity ? `적용 ${scope.specificity}` : ""
  ].filter(Boolean).join(" · ");
}

function renderSkillCandidates(state = skillCandidatesState) {
  skillCandidatesState = state || { candidates: [] };
  if (!nodes.skillCandidateList) return;
  const candidates = (skillCandidatesState.candidates || []).filter((candidate) => candidate.status !== "dismissed").slice(0, 12);
  const visibleCandidates = candidates.slice(0, 3);
  const pending = candidates.filter((candidate) => candidate.status === "pending");
  const approved = candidates.filter((candidate) => candidate.status === "approved").length;
  if (nodes.skillCandidateStatus) nodes.skillCandidateStatus.textContent = pending.length ? `${pending.length}개 검토 · 적용 ${approved}개` : approved ? `적용 ${approved}개` : "대기";
  if (!candidates.length) {
    nodes.skillCandidateList.innerHTML = '<div class="empty">스킬 후보 없음</div>';
    return;
  }
  nodes.skillCandidateList.innerHTML = [
    visibleCandidates.map((candidate) => `
    <article class="skill-candidate-item ${escapeHtml(candidate.status || "")}">
      <div class="skill-candidate-head">
        <strong>${escapeHtml(candidate.title || candidate.id)}</strong>
        <b>${escapeHtml(candidate.statusLabel || (candidate.status === "approved" ? "적용됨" : "검토 대기"))}</b>
      </div>
      <span><b class="skill-candidate-kind">${escapeHtml(skillCandidateKindLabel(candidate.kind))}</b> ${escapeHtml((candidate.agentNames || (candidate.agentIds || []).map((id) => agents.find((agent) => agent.id === id)?.name || id)).join(", "))}</span>
      <div class="skill-candidate-metrics">
        <b>신뢰도 ${Number(candidate.confidence || 0)}점</b>
        ${candidate.autoAppliedAt ? "<b>자동 반영</b>" : ""}
        ${candidate.source?.sessionTitle ? `<b>${escapeHtml(candidate.source.sessionTitle)}</b>` : ""}
        ${candidate.createdAt ? `<b>${escapeHtml(formatShortTime(candidate.createdAt))}</b>` : ""}
      </div>
      <small>${escapeHtml(candidate.description || "")}</small>
      ${skillCandidateScopeText(candidate) ? `<small>${escapeHtml(skillCandidateScopeText(candidate))}</small>` : ""}
      ${candidate.evidencePreview ? `<p class="skill-candidate-evidence">${escapeHtml(candidate.evidencePreview)}</p>` : ""}
      ${candidate.instructionsPreview ? `<p class="skill-candidate-instructions">${escapeHtml(candidate.instructionsPreview)}</p>` : ""}
      ${renderSkillCandidateEditor(candidate)}
      <div class="connection-row-actions">
        ${candidate.status === "approved" ? `<b>적용됨</b>` : `
          <button type="button" data-skill-candidate-action="edit" data-candidate-id="${escapeHtml(candidate.id)}">${editingSkillCandidateId === candidate.id ? "수정 중" : "수정"}</button>
          <button type="button" data-skill-candidate-action="approve" data-candidate-id="${escapeHtml(candidate.id)}">${candidate.kind === "memory" ? "메모리 적용" : "스킬 적용"}</button>
          <button type="button" data-skill-candidate-action="dismiss" data-candidate-id="${escapeHtml(candidate.id)}">반려</button>
        `}
      </div>
    </article>
  `).join(""),
    candidates.length > visibleCandidates.length
      ? `<div class="skill-candidate-more"><span>나머지 ${candidates.length - visibleCandidates.length}개는 검토 탭에서 처리합니다.</span><button type="button" data-skill-candidate-action="review">전체 보기</button></div>`
      : ""
  ].filter(Boolean).join("");
}

async function loadSkillCandidates() {
  if (!nodes.skillCandidateList) return null;
  try {
    const response = await apiFetch("/api/skill-candidates", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok || data.ok === false) throw new Error(data.error || `HTTP ${response.status}`);
    renderSkillCandidates(data);
    return data;
  } catch (error) {
    if (nodes.skillCandidateStatus) nodes.skillCandidateStatus.textContent = "로드 실패";
    nodes.skillCandidateList.innerHTML = `<div class="empty">스킬 후보 로드 실패: ${escapeHtml(error.message)}</div>`;
    return null;
  }
}

async function handleSkillCandidateClick(event) {
  const button = event.target.closest("button[data-skill-candidate-action]");
  if (!button || !nodes.skillCandidateList?.contains(button)) return;
  const action = button.dataset.skillCandidateAction || "";
  const id = button.dataset.candidateId || "";
  if (action === "review") {
    setReviewSection("skills");
    switchPage("review");
    return;
  }
  if (action === "edit") {
    editingSkillCandidateId = editingSkillCandidateId === id ? "" : id;
    renderSkillCandidates();
    return;
  }
  if (action === "cancel-edit") {
    editingSkillCandidateId = "";
    renderSkillCandidates();
    return;
  }
  button.disabled = true;
  try {
    const payload = { action, id };
    if (action === "update") {
      const editor = button.closest(".skill-candidate-item")?.querySelector(".skill-candidate-editor");
      payload.title = editor?.querySelector('[data-skill-candidate-field="title"]')?.value || "";
      payload.description = editor?.querySelector('[data-skill-candidate-field="description"]')?.value || "";
      payload.instructions = editor?.querySelector('[data-skill-candidate-field="instructions"]')?.value || "";
      payload.agentIds = [...(editor?.querySelectorAll("[data-skill-candidate-agent]:checked") || [])].map((input) => input.dataset.skillCandidateAgent);
    }
    const data = ["approve", "dismiss"].includes(action)
      ? await saveSkillCandidateReview(id, { action: action === "dismiss" ? "reject" : "approve", targetTitle: button.closest(".skill-candidate-item")?.querySelector("strong")?.textContent || id, note: action === "dismiss" ? "대화 패널에서 숨김 처리" : "" })
      : await saveSkillCandidateAction(payload);
    if (data.skills) renderSkillsState(data.skills);
    if (data.profile) renderProfileState(data.profile);
    await loadActiveSkills();
    if (action === "update") editingSkillCandidateId = "";
    await loadSkillCandidates();
    if (action === "approve") {
      addChatMessage("assistant", "대화에서 만든 스킬 후보를 직원 스킬에 적용했습니다.", "YOMI Office", "스킬 적용");
      if (nodes.skillCandidateStatus) nodes.skillCandidateStatus.textContent = "스킬 적용 완료";
    } else if (action === "update") {
      if (nodes.skillCandidateStatus) nodes.skillCandidateStatus.textContent = "스킬 후보 수정 완료";
    }
  } catch (error) {
    if (nodes.skillCandidateStatus) nodes.skillCandidateStatus.textContent = `처리 실패: ${error.message}`;
  } finally {
    button.disabled = false;
  }
}

function compactReply(text, maxLength = 520) {
  const value = String(text || "").trim();
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).trim()}...`;
}

function workflowSummary(run) {
  if (!run?.steps?.length) return "";
  return run.steps.map((step, index) => `${index + 1}. ${step.label || step.id} · ${step.agentName || step.agentId} · ${step.status}`).join("\n");
}

function officeJobStatusLabel(status = "") {
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

function taskQueueTone(status = "") {
  if (["failed"].includes(status)) return "bad";
  if (["waiting_question", "completed_with_errors", "retrying", "cancelled"].includes(status)) return "warn";
  return "";
}

function taskQueueDisplayRank(job = {}) {
  const status = job.status || "";
  if (status === "waiting_question") return 0;
  if (job.isActive || ["queued", "running", "retrying", "finalizing"].includes(status)) return 1;
  if (job.needsAttention || ["failed", "completed_with_errors"].includes(status)) return 2;
  if (status === "cancelled") return 3;
  if (status === "completed") return 4;
  return 5;
}

function taskQueueTimeValue(value) {
  const time = new Date(value || 0).getTime();
  return Number.isFinite(time) ? time : 0;
}

function taskQueueIsClosedHistory(job = {}) {
  return job.restored && reviewDecisionClosesAttention(job.reviewDecision);
}

function taskQueueCompletionKey(job = {}) {
  const title = String(job.title || job.task || "").replace(/\s+/g, " ").trim().toLowerCase();
  if (!title || job.status !== "completed") return "";
  return `${job.type || "job"}:${title}`;
}

function taskQueueDisplayRows(jobs = []) {
  const openJobs = [...jobs].filter((job) => !taskQueueIsClosedHistory(job));
  const latestCompleted = new Map();
  for (const job of openJobs) {
    const key = taskQueueCompletionKey(job);
    if (!key) continue;
    const current = latestCompleted.get(key);
    if (!current || taskQueueTimeValue(job.updatedAt || job.createdAt) > taskQueueTimeValue(current.updatedAt || current.createdAt)) {
      latestCompleted.set(key, job);
    }
  }
  return openJobs
    .filter((job) => {
      const key = taskQueueCompletionKey(job);
      return !key || latestCompleted.get(key)?.id === job.id;
    })
    .sort((a, b) => taskQueueDisplayRank(a) - taskQueueDisplayRank(b)
      || taskQueueTimeValue(b.updatedAt || b.createdAt) - taskQueueTimeValue(a.updatedAt || a.createdAt))
    .slice(0, 8);
}

function formatTaskQueueDuration(ms = 0) {
  const value = Number(ms || 0);
  if (!Number.isFinite(value) || value <= 0) return "";
  const minutes = Math.floor(value / 60000);
  if (minutes < 1) return "1분 미만";
  if (minutes < 60) return `${minutes}분`;
  return `${Math.floor(minutes / 60)}시간 ${minutes % 60}분`;
}

function formatQueueTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

function jobFinished(status = "") {
  return ["completed", "completed_with_errors", "failed", "waiting_question", "cancelled"].includes(status);
}

function renderJobLogs(logs = []) {
  if (!nodes.activityLog) return;
  nodes.activityLog.innerHTML = "";
  const rows = logs.slice(-8).reverse();
  if (!rows.length) {
    nodes.activityLog.innerHTML = '<div class="empty">아직 표시할 로그가 없습니다.</div>';
    return;
  }
  rows.forEach((log) => {
    const row = document.createElement("div");
    row.className = `log-row ${log.level === "error" || log.level === "warn" ? "warn" : ""}`;
    row.innerHTML = `<strong>${escapeHtml(log.actor || "system")}</strong><span>${escapeHtml(formatQueueTime(log.createdAt))}</span><p>${escapeHtml(log.message || "")}</p>`;
    nodes.activityLog.append(row);
  });
}

function subtaskStatusMap(subtasks = []) {
  return Object.fromEntries(subtasks.map((step) => [step.agentId, {
    status: step.status,
    label: officeJobStatusLabel(step.status),
    detail: step.label || step.role || ""
  }]));
}

function currentSubtaskAgentIds(subtasks = [], jobStatus = "") {
  if (officeJobDone(jobStatus)) return [];
  const running = subtasks.filter((step) => ["running", "retrying", "queued"].includes(step.status));
  if (running.length) return Array.from(new Set(running.map((step) => step.agentId).filter(Boolean)));
  const next = subtasks.find((step) => !["completed", "failed"].includes(step.status));
  return next?.agentId ? [next.agentId] : [];
}

function officeJobDone(status = "") {
  return ["completed", "completed_with_errors", "failed", "waiting_question", "cancelled"].includes(status);
}

function officeJobSummary(job = {}) {
  const subtasks = job.subtasks || [];
  if (!subtasks.length) return "";
  return subtasks.map((step, index) => {
    const retry = step.attempts > 1 ? ` · ${step.attempts}회 시도` : "";
    const error = step.error ? ` · ${step.error}` : "";
    return `${index + 1}. ${step.agentName} · ${step.label} · ${officeJobStatusLabel(step.status)}${retry}${error}`;
  }).join("\n");
}

function currentOfficeJobSummary(subtasks = [], currentIds = []) {
  const current = currentIds.length ? subtasks.filter((step) => currentIds.includes(step.agentId)) : [];
  if (!current.length) return "진행 중인 직원이 없습니다.";
  return current.map((step) => `- ${step.agentName || step.agentId} · ${step.label || "서브태스크"} · ${officeJobStatusLabel(step.status)}`).join("\n");
}

function renderOfficeWorkflowResult(run, task, saved, report = "") {
  hideHumanLoopPanel();
  latestOfficeTask = task || latestOfficeTask;
  const steps = run?.steps || [];
  if (nodes.activityLog) {
    nodes.activityLog.innerHTML = "";
    steps.slice().reverse().forEach((step) => {
      const agent = agents.find((item) => item.id === step.agentId) || agents.find((item) => item.name === step.agentName) || agents[0];
      const row = document.createElement("div");
      row.className = `log-row ${step.status === "failed" ? "warn" : "save"}`;
      const evaluation = step.evaluations?.length ? " · 검토 통과" : "";
      row.innerHTML = `<strong>${escapeHtml(step.agentName || agent.name)}</strong><span>${escapeHtml(step.status || "completed")}</span><p>${escapeHtml(step.label || step.id)}${evaluation}</p>`;
      nodes.activityLog.prepend(row);
    });
  }
  const activeIds = steps.map((step) => step.agentId).filter(Boolean);
  renderOfficeAgentStatus([]);
  renderPipeline(-1, Boolean(run?.ok));
  renderAgents(activeIds, Object.fromEntries(activeIds.map((id) => [id, "완료"])));
  if (nodes.phaseBadge) nodes.phaseBadge.textContent = run?.ok ? "체인 완료" : "체인 중단";
  if (nodes.saveNotice) nodes.saveNotice.textContent = saved?.ok ? `Vault 저장 완료: ${saved.relPath}` : saved?.reason || "저장 대기";
  setOfficeProgress({
    status: run?.ok ? "체인 완료" : "체인 중단",
    task: latestOfficeTask,
    chainStatus: run?.ok ? "완료" : "중단",
    detail: [
      "# 사무실 진행 세부",
      "",
      `업무: ${latestOfficeTask}`,
      "",
      "## 체인 단계",
      workflowSummary(run) || "workflow 정보 없음",
      "",
      "## 저장 상태",
      saved?.ok ? saved.relPath : saved?.reason || "저장 대기",
      "",
      "## 결과 요약",
      compactReply(report, 1200)
    ].join("\n")
  });
}

function renderOfficePlanResult(officePlan, originalMessage = "") {
  const capsule = officePlan?.capsule || {};
  const plan = officePlan?.plan || {};
  const subtasks = plan.subtasks || [];
  const activeIds = plan.activeAgentIds || subtasks.map((step) => step.agentId).filter(Boolean);
  latestOfficeTask = capsule.normalizedTask || originalMessage || latestOfficeTask;
  clearInterval(phaseTimer);
  clearTimeout(officeEndTimer);
  clearOfficeMoveTimers();
  resetAgentPositions();
  clearCollaborationCue();
  if (nodes.activityLog) {
    nodes.activityLog.innerHTML = "";
    subtasks.slice().reverse().forEach((step) => {
      const row = document.createElement("div");
      row.className = `log-row ${plan.questionRequired ? "warn" : "save"}`;
      row.innerHTML = `<strong>${escapeHtml(step.agentName || step.agentId)}</strong><span>${escapeHtml(step.engine?.label || "Codex CLI")}</span><p>${escapeHtml(`${step.label || "서브태스크"} → ${step.expectedOutput || ""}`)}</p>`;
      nodes.activityLog.prepend(row);
    });
  }
  const bubbles = Object.fromEntries(subtasks.map((step) => [step.agentId, step.label || "분배됨"]));
  renderAgents(activeIds, bubbles);
  renderOfficeAgentStatus(plan.questionRequired ? ["ceo"] : []);
  renderPipeline(-1, false);
  if (nodes.phaseBadge) nodes.phaseBadge.textContent = plan.questionRequired ? "확인 필요" : "분배 완료";
  if (nodes.saveNotice) nodes.saveNotice.textContent = "1단계 계획만 생성 · 자동 저장 안 함";
  setOfficeProgress({
    status: plan.questionRequired ? "요미 확인 요청" : "요미 분배 계획",
    task: capsule.goal || latestOfficeTask,
    chainStatus: subtasks.length ? `${subtasks.length}개 분배` : "계획",
    detail: [
      "# 요미 작업캡슐",
      "",
      "```json",
      JSON.stringify(capsule, null, 2),
      "```",
      "",
      "## 직원 분배 계획",
      subtasks.length
        ? subtasks.map((step, index) => `${index + 1}. ${step.agentName}(${step.role || ""}) - ${step.label}\n   - 담당 엔진: ${step.engine?.label || "Codex CLI"}\n   - 목표: ${step.objective}\n   - 산출물: ${step.expectedOutput}\n   - 병렬 그룹: ${step.parallelGroup}`).join("\n")
        : "분배 계획 없음",
      "",
      "## 실행 정책",
      `- 모드: ${plan.mode || "plan_only"}`,
      `- 배정 규모: ${capsule.staffing?.level || "standard"} · 최대 ${capsule.staffing?.maxAgents || subtasks.length}명`,
      `- 배정 이유: ${capsule.staffing?.reason || "역할 기반 배정"}`,
      `- 병렬 처리: ${plan.workerPool || "2단계에서 적용"}`,
      `- 다음 상태: ${plan.nextAction || "대기"}`,
      "",
      "## 질문 기준",
      capsule.humanLoopRules?.map((rule) => `- ${rule.label}: ${rule.askWhen}`).join("\n") || "질문 기준 없음",
      plan.questionReasons?.length ? `\n## 이번 입력에서 확인할 것\n${plan.questionReasons.map((item) => `- ${item.reason}`).join("\n")}` : ""
    ].filter(Boolean).join("\n")
  });
}

function hideHumanLoopPanel() {
  if (!nodes.humanLoopPanel) return;
  nodes.humanLoopPanel.hidden = true;
  nodes.humanLoopPanel.innerHTML = "";
}

function renderHumanLoopPanel(job = {}) {
  if (!nodes.humanLoopPanel) return;
  const question = job.humanLoopQuestion || job.plan?.humanLoopQuestion || job.capsule?.humanLoopQuestion;
  if (job.status !== "waiting_question" || !question?.choices?.length) {
    hideHumanLoopPanel();
    return;
  }
  const reasons = question.reasons?.length ? question.reasons : job.plan?.questionReasons || job.capsule?.questionReasons || [];
  nodes.humanLoopPanel.hidden = false;
  nodes.humanLoopPanel.innerHTML = `
    <strong>${escapeHtml(question.title || "확인 필요")}</strong>
    <p>${escapeHtml(question.message || "진행 전 확인이 필요합니다.")}</p>
    ${reasons.length ? `<ul class="human-loop-reasons">${reasons.map((item) => `<li>${escapeHtml(item.reason || item.id || item)}</li>`).join("")}</ul>` : ""}
    <div class="human-loop-actions">
      ${question.choices.map((choice) => `
        <button type="button" class="${choice.id === "cancel" ? "secondary" : ""}" data-human-loop-choice="${escapeHtml(choice.id)}" data-job-id="${escapeHtml(job.id)}">
          ${escapeHtml(choice.label || choice.id)}${choice.recommended ? " · 추천" : ""}
          <small>${escapeHtml(choice.description || "")}</small>
        </button>
      `).join("")}
    </div>
  `;
}

function renderOfficeJobResult(job, originalMessage = "", announceFinal = false) {
  if (!job) return;
  const capsule = job.capsule || {};
  const subtasks = job.subtasks || job.plan?.subtasks || [];
  const activeIds = Array.from(new Set(subtasks.map((step) => step.agentId).filter(Boolean)));
  const currentIds = currentSubtaskAgentIds(subtasks, job.status);
  latestOfficeTask = capsule.normalizedTask || originalMessage || latestOfficeTask;
  if (nodes.activityLog) {
    nodes.activityLog.innerHTML = "";
    const currentSteps = currentIds.length ? subtasks.filter((step) => currentIds.includes(step.agentId)) : [];
    if (!currentSteps.length) nodes.activityLog.innerHTML = '<div class="empty">진행 중인 항목이 없습니다.</div>';
    currentSteps.slice().reverse().forEach((step) => {
      const row = document.createElement("div");
      const tone = step.status === "failed" || step.status === "retrying" ? "warn" : step.status === "completed" ? "save" : "";
      row.className = `log-row ${tone}`;
      const attempt = step.attempts > 1 ? ` · ${step.attempts}회 시도` : "";
      row.innerHTML = `<strong>${escapeHtml(step.agentName || step.agentId)}</strong><span>${escapeHtml(officeJobStatusLabel(step.status))}</span><p>${escapeHtml(`${step.label || "서브태스크"}${attempt}`)}</p>`;
      nodes.activityLog.prepend(row);
    });
  }
  const bubbles = Object.fromEntries(subtasks.map((step) => [step.agentId, officeJobStatusLabel(step.status)]));
  renderAgents(activeIds, bubbles);
  renderOfficeAgentStatus(currentIds, subtaskStatusMap(subtasks));
  if (nodes.phaseBadge) nodes.phaseBadge.textContent = officeJobStatusLabel(job.status);
  if (nodes.saveNotice) nodes.saveNotice.textContent = job.saved?.reason || "2단계 자동 저장 안 함";
  const reportText = job.report || "직원들이 병렬로 산출물을 만들고 있습니다.";
  renderHumanLoopPanel(job);
  setOfficeProgress({
    status: `직원 실행 · ${officeJobStatusLabel(job.status)}`,
    task: capsule.goal || latestOfficeTask,
    chainStatus: `${subtasks.filter((step) => step.status === "completed").length}/${subtasks.length || 0}`,
    detail: [
      "# 병렬 직원 실행",
      "",
      `- 작업 ID: ${job.id}`,
      `- 상태: ${officeJobStatusLabel(job.status)}`,
      `- 모드: ${job.mode || "parallel_worker_pool"}`,
      `- 배정 규모: ${job.capsule?.staffing?.level || "standard"} · ${job.subtasks?.length || 0}명`,
      `- 저장: ${job.saved?.ok ? job.saved.relPath : job.saved?.reason || "대기"}`,
      job.humanLoopAnswer ? `- 확인 응답: ${job.humanLoopAnswer.label}` : "",
      "",
      "## 현재 진행",
      currentOfficeJobSummary(subtasks, currentIds),
      job.status === "waiting_question" ? `\n## 확인 필요\n${(job.humanLoopQuestion?.reasons || job.plan?.questionReasons || []).map((item) => `- ${item.reason || item.id}`).join("\n")}` : "",
      "",
      "## 요미 최종 보고",
      reportText
    ].filter(Boolean).join("\n")
  });
  if (nodes.chatRunMeta) nodes.chatRunMeta.textContent = `작업 ID: ${job.id} · ${officeJobStatusLabel(job.status)}`;
  if (nodes.chatResultPreview) {
    nodes.chatResultPreview.textContent = [
      "# 병렬 직원 실행",
      "",
      `입력: ${originalMessage || capsule.originalInput || ""}`,
      `작업 ID: ${job.id}`,
      `상태: ${officeJobStatusLabel(job.status)}`,
      `배정 규모: ${job.capsule?.staffing?.level || "standard"} · ${job.subtasks?.length || 0}명`,
      `저장: ${job.saved?.ok ? job.saved.relPath : job.saved?.reason || "대기"}`,
      job.humanLoopAnswer ? `확인 응답: ${job.humanLoopAnswer.label}` : "",
      "",
      "## 현재 진행",
      currentOfficeJobSummary(subtasks, currentIds),
      job.status === "waiting_question" ? `\n## 확인 필요\n${(job.humanLoopQuestion?.reasons || job.plan?.questionReasons || []).map((item) => `- ${item.reason || item.id}`).join("\n")}` : "",
      "",
      "## 요미 최종 보고",
      reportText
    ].filter(Boolean).join("\n");
  }
  if (announceFinal && officeJobDone(job.status) && !completedOfficeJobIds.has(job.id)) {
    completedOfficeJobIds.add(job.id);
    const text = job.status === "waiting_question"
      ? "이 작업은 확인이 필요해서 실행을 멈췄습니다. 상단 작업 결과 패널에서 확인할 조건을 봐주세요."
      : job.report || job.error || "병렬 직원 실행이 완료되었습니다.";
    addChatMessage("assistant", compactReply(text, 900), "YOMI Office", officeJobStatusLabel(job.status));
  }
}

async function pollOfficeJob(jobId, originalMessage = "") {
  if (!jobId) return;
  try {
    const response = await apiFetch(`/api/orchestration-job?id=${encodeURIComponent(jobId)}`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
    const job = data.job;
    renderOfficeJobResult(job, originalMessage, true);
    await loadTaskQueue({ resume: false });
    if (officeJobDone(job.status) && officeJobPollTimer) {
      clearInterval(officeJobPollTimer);
      officeJobPollTimer = null;
      activeOfficeJobId = "";
      await refreshState();
      await loadRecentReports();
      await loadPerformanceLog();
    }
  } catch (error) {
    if (nodes.chatRunMeta) nodes.chatRunMeta.textContent = `직원 실행 상태 확인 실패: ${error.message}`;
  }
}

function startOfficeJobPolling(jobId, originalMessage = "") {
  if (!jobId) return;
  if (officeJobPollTimer) clearInterval(officeJobPollTimer);
  activeOfficeJobId = jobId;
  officeJobPollTimer = setInterval(() => {
    if (activeOfficeJobId) pollOfficeJob(activeOfficeJobId, originalMessage);
  }, 1800);
  pollOfficeJob(jobId, originalMessage);
}

async function answerHumanLoop(jobId, choiceId) {
  if (!jobId || !choiceId) return;
  const buttons = nodes.humanLoopPanel?.querySelectorAll("button") || [];
  buttons.forEach((button) => { button.disabled = true; });
  if (nodes.saveNotice) nodes.saveNotice.textContent = "확인 응답 처리 중";
  try {
    const response = await apiFetch("/api/orchestration-job/answer", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: jobId, choiceId })
    });
    const data = await response.json();
    if (!response.ok || data.ok === false) throw new Error(data.error || `HTTP ${response.status}`);
    const job = data.job;
    renderOfficeJobResult(job, job.capsule?.originalInput || "", false);
    await loadTaskQueue({ resume: false });
    if (!officeJobDone(job.status)) startOfficeJobPolling(job.id, job.capsule?.originalInput || "");
    else {
      renderOfficeJobResult(job, job.capsule?.originalInput || "", true);
      await refreshState();
      await loadRecentReports();
      await loadPerformanceLog();
    }
    addChatMessage("assistant", choiceId === "cancel" ? "확인 단계에서 작업을 취소했습니다." : "확인 완료. 직원 실행을 재개합니다.", "YOMI Office", "확인 응답");
  } catch (error) {
    if (nodes.saveNotice) nodes.saveNotice.textContent = `확인 처리 실패: ${error.message}`;
    buttons.forEach((button) => { button.disabled = false; });
  }
}

function handleHumanLoopClick(event) {
  const button = event.target.closest("button[data-human-loop-choice]");
  if (!button || !nodes.humanLoopPanel?.contains(button)) return;
  return answerHumanLoop(button.dataset.jobId || activeOfficeJobId, button.dataset.humanLoopChoice || "");
}

function renderCodexJobResult(job, announceFinal = false) {
  if (!job) return;
  hideHumanLoopPanel();
  latestOfficeTask = job.task || latestOfficeTask;
  const activeIds = jobFinished(job.status) ? [] : ["developer"];
  renderAgents(activeIds.length ? ["developer"] : [], { developer: officeJobStatusLabel(job.status) });
  renderOfficeAgentStatus(activeIds, { developer: { status: job.status, label: officeJobStatusLabel(job.status), detail: "Codex CLI" } });
  renderPipeline(-1, job.status === "completed");
  renderJobLogs(job.logs || []);
  if (nodes.phaseBadge) nodes.phaseBadge.textContent = officeJobStatusLabel(job.status);
  if (nodes.saveNotice) nodes.saveNotice.textContent = job.saved?.ok ? `Vault 저장 완료: ${job.saved.relPath}` : job.saved?.reason || "코덱스 작업 저장 대기";
  const output = job.output?.trim() || job.stderr?.trim() || job.error || "Codex CLI가 작업을 실행 중입니다.";
  setOfficeProgress({
    status: `코덱스 · ${officeJobStatusLabel(job.status)}`,
    task: job.task || "코덱스 작업",
    chainStatus: job.status,
    detail: [
      "# 코덱스 작업",
      "",
      `- 작업 ID: ${job.id}`,
      `- 상태: ${officeJobStatusLabel(job.status)}`,
      job.commandLabel ? `- 실행: ${job.commandLabel}` : "",
      `- 저장: ${job.saved?.ok ? job.saved.relPath : job.saved?.reason || "대기"}`,
      "",
      "## 출력",
      output
    ].filter(Boolean).join("\n")
  });
  if (nodes.chatRunMeta) nodes.chatRunMeta.textContent = `작업 ID: ${job.id} · ${officeJobStatusLabel(job.status)}`;
  if (nodes.chatResultPreview) {
    nodes.chatResultPreview.textContent = [
      "# 코덱스 작업",
      "",
      `입력: ${job.task || ""}`,
      `작업 ID: ${job.id}`,
      `상태: ${officeJobStatusLabel(job.status)}`,
      `저장: ${job.saved?.ok ? job.saved.relPath : job.saved?.reason || "대기"}`,
      "",
      "## 출력",
      output
    ].join("\n");
  }
  if (announceFinal && jobFinished(job.status) && !completedCodexJobIds.has(job.id)) {
    completedCodexJobIds.add(job.id);
    addChatMessage("assistant", compactReply(output, 900), "YOMI Office", officeJobStatusLabel(job.status));
  }
}

async function pollCodexJob(jobId) {
  if (!jobId) return;
  try {
    const response = await apiFetch(`/api/codex-job?id=${encodeURIComponent(jobId)}`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
    const job = data.job;
    renderCodexJobResult(job, true);
    await loadTaskQueue({ resume: false });
    if (jobFinished(job.status) && codexJobPollTimer) {
      clearInterval(codexJobPollTimer);
      codexJobPollTimer = null;
      activeCodexJobId = "";
      await refreshState();
    }
  } catch (error) {
    if (nodes.chatRunMeta) nodes.chatRunMeta.textContent = `코덱스 상태 확인 실패: ${error.message}`;
  }
}

function startCodexJobPolling(jobId) {
  if (!jobId) return;
  if (codexJobPollTimer) clearInterval(codexJobPollTimer);
  activeCodexJobId = jobId;
  codexJobPollTimer = setInterval(() => {
    if (activeCodexJobId) pollCodexJob(activeCodexJobId);
  }, 2200);
  pollCodexJob(jobId);
}

function renderTaskQueue(state = {}) {
  if (!nodes.taskQueueList) return;
  latestTaskQueueState = state || { jobs: [], summary: {} };
  const jobs = state.jobs || [];
  const visibleJobs = taskQueueDisplayRows(jobs);
  const hiddenClosedJobs = jobs.filter(taskQueueIsClosedHistory).length;
  if (nodes.taskQueueStatus) {
    const running = state.summary?.running || 0;
    const completed = state.summary?.completed || 0;
    const attention = state.summary?.attention || 0;
    nodes.taskQueueStatus.textContent = running
      ? `${running}개 실행 · 완료 ${completed}개`
      : attention
        ? `주의 ${attention}개 · 완료 ${completed}개`
        : visibleJobs.length
          ? `완료 ${completed}개 · 기록 ${visibleJobs.length}개${hiddenClosedJobs ? ` · 정리 ${hiddenClosedJobs}개` : ""}`
          : "대기";
  }
  if (!visibleJobs.length) {
    nodes.taskQueueList.innerHTML = '<div class="office-agent-empty">대기 중인 작업이 없습니다.</div>';
    syncOfficeLiveStage();
    return;
  }
  nodes.taskQueueList.innerHTML = visibleJobs.map((job) => {
    const active = job.id === activeOfficeJobId || job.id === activeCodexJobId ? " active" : "";
    const tone = taskQueueTone(job.status);
    const running = ["queued", "running", "retrying", "finalizing", "waiting_question"].includes(job.status);
    const retryable = ["failed", "completed_with_errors", "cancelled"].includes(job.status);
    const restored = job.restored ? " restored" : "";
    const elapsed = formatTaskQueueDuration(job.durationMs);
    const decisionLabel = reviewDecisionLabel(job.reviewDecision);
    return `
      <article class="task-queue-item ${tone}${active}${restored}">
        <button class="task-queue-main" type="button" data-job-type="${escapeHtml(job.type)}" data-job-id="${escapeHtml(job.id)}">
          <strong>${escapeHtml(job.title || job.id)}</strong>
          <span>${escapeHtml(job.restored ? "기록" : job.type === "codex" ? "Codex" : "직원")}</span>
          <b>${escapeHtml(job.statusLabel || officeJobStatusLabel(job.status))}</b>
          <p>${escapeHtml(job.progress || job.detail || "")}</p>
          <small>${escapeHtml([formatShortTime(job.updatedAt || job.completedAt || job.createdAt), elapsed].filter(Boolean).join(" · "))}</small>
          ${decisionLabel ? `<small class="task-queue-review ${escapeHtml(job.reviewDecision.status || "")}">검토: ${escapeHtml(decisionLabel)}${job.reviewDecision.editSummary ? ` · ${escapeHtml(job.reviewDecision.editSummary)}` : ""}</small>` : ""}
        </button>
        <div class="task-queue-actions">
          ${running ? `<button type="button" data-task-queue-action="cancel" data-job-type="${escapeHtml(job.type)}" data-job-id="${escapeHtml(job.id)}">취소</button>` : ""}
          ${retryable ? `<button type="button" data-task-queue-action="retry" data-job-type="${escapeHtml(job.type)}" data-job-id="${escapeHtml(job.id)}">재시도</button>` : ""}
        </div>
      </article>
    `;
  }).join("");
  syncOfficeLiveStage();
}

async function loadTaskQueue(options = {}) {
  if (!nodes.taskQueueList) return null;
  const { resume = false } = options;
  try {
    const response = await apiFetch("/api/task-queue?limit=20", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
    renderTaskQueue(data);
    if (resume && !taskQueueLoadedOnce) {
      taskQueueLoadedOnce = true;
      const running = (data.jobs || []).find((job) => ["running", "queued", "retrying", "finalizing"].includes(job.status));
      if (running?.type === "office") startOfficeJobPolling(running.id, running.title || "");
      if (running?.type === "codex") startCodexJobPolling(running.id);
    }
    return data;
  } catch (error) {
    if (nodes.taskQueueStatus) nodes.taskQueueStatus.textContent = "로드 실패";
    nodes.taskQueueList.innerHTML = `<div class="empty">작업 큐 로드 실패: ${escapeHtml(error.message)}</div>`;
    return null;
  }
}

async function updateTaskQueueAction(payload = {}) {
  const response = await apiFetch("/api/task-queue", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok || data.ok === false) throw new Error(data.error || `HTTP ${response.status}`);
  renderTaskQueue(data.queue || data);
  return data;
}

async function handleTaskQueueClick(event) {
  const actionButton = event.target.closest("button[data-task-queue-action]");
  if (actionButton && nodes.taskQueueList?.contains(actionButton)) {
    const action = actionButton.dataset.taskQueueAction || "";
    const id = actionButton.dataset.jobId || "";
    const type = actionButton.dataset.jobType || "";
    actionButton.disabled = true;
    try {
      const data = await updateTaskQueueAction({ action, id, type });
      const job = data.job;
      if (nodes.chatRunMeta) nodes.chatRunMeta.textContent = `${action === "retry" ? "재시도 등록" : "작업 취소"} · ${job?.id || id}`;
      if (job?.type === "office" || type === "office") startOfficeJobPolling(job.id || id, job.title || "");
      if (job?.type === "codex" || type === "codex") startCodexJobPolling(job.id || id);
      await refreshState();
      await loadPerformanceLog();
    } catch (error) {
      if (nodes.chatRunMeta) nodes.chatRunMeta.textContent = `작업 큐 처리 실패: ${error.message}`;
      await loadTaskQueue({ resume: false });
    } finally {
      actionButton.disabled = false;
    }
    return;
  }
  const button = event.target.closest("button[data-job-id]");
  if (!button || !nodes.taskQueueList?.contains(button)) return;
  const id = button.dataset.jobId || "";
  const type = button.dataset.jobType || "";
  const detail = await updateTaskQueueAction({ action: "detail", id, type }).catch(() => null);
  if (detail?.job?.restored) {
    const job = detail.job;
    if (nodes.chatRunMeta) nodes.chatRunMeta.textContent = `복원된 작업 기록 · ${job.id}`;
    if (nodes.chatResultPreview) {
      nodes.chatResultPreview.textContent = [
        "# 작업 큐 기록",
        "",
        `작업 ID: ${job.id}`,
        `유형: ${job.type === "codex" ? "Codex" : "직원 실행"}`,
        `상태: ${job.statusLabel || officeJobStatusLabel(job.status)}`,
        `제목: ${job.title || ""}`,
        job.progress ? `진행 메모: ${job.progress}` : "",
        job.saved?.ok ? `저장: ${job.saved.relPath}` : job.saved?.reason ? `저장: ${job.saved.reason}` : "",
        "",
        "이 기록은 서버 재시작 후 복원된 큐 스냅샷입니다. 실제 실행 프로세스는 이어 붙지 않으며, 필요한 경우 재시도 버튼으로 새 작업을 등록하세요."
      ].filter(Boolean).join("\n");
    }
    return;
  }
  if (type === "office") return startOfficeJobPolling(id, "");
  if (type === "codex") return startCodexJobPolling(id);
}

function showYomiRoutingPending(message) {
  latestOfficeTask = message || latestOfficeTask;
  if (nodes.activityLog) nodes.activityLog.innerHTML = "";
  setOfficeProgress({
    status: "요미 분석 중",
    task: latestOfficeTask,
    chainStatus: "라우팅",
    detail: "요미가 입력 의도를 분석하고 작업캡슐과 직원 분배 계획을 준비하고 있습니다."
  });
  if (nodes.phaseBadge) nodes.phaseBadge.textContent = "라우팅";
  renderAgents(["ceo"], { ceo: "의도 분석" });
  renderOfficeAgentStatus(["ceo"]);
  addLog("입력을 분류하고 작업캡슐을 준비합니다.", "ceo");
}

function updateChatResultPanel(data, originalMessage) {
  const modeLabel = data.modeLabel || "일반대화";
  nodes.chatResultMode.textContent = modeLabel;
  if (nodes.chatProvider) nodes.chatProvider.textContent = providerLabel(data.llm?.provider);
  if (nodes.chatMemory) {
    const capture = data.memory?.capture || data.capture;
    nodes.chatMemory.textContent = capture?.ok
      ? `Vault 저장: ${capture.relPath}`
      : data.memory?.learning?.autoAppliedMemoryIds?.length
        ? `메모리 반영 ${data.memory.learning.autoAppliedMemoryIds.length}개`
        : data.memory?.skillCandidateIds?.length
        ? `스킬 후보 ${data.memory.skillCandidateIds.length}개`
        : capture?.reason || `대화 기록 ${nodes.chatThread.querySelectorAll(".chat-message").length}개`;
  }

  if (data.intent === "office") {
    if (data.officePlan) {
      const capsule = data.officePlan.capsule || {};
      const plan = data.officePlan.plan || {};
      if (nodes.chatRunMeta) nodes.chatRunMeta.textContent = data.officeJob?.id ? `작업 ID: ${data.officeJob.id} · ${officeJobStatusLabel(data.officeJob.status)}` : plan.questionRequired ? "사용자 확인 필요" : `${plan.subtasks?.length || 0}개 서브태스크 분배`;
      nodes.chatResultPreview.textContent = [
        "# 요미 라우팅 결과",
        "",
        `입력: ${originalMessage}`,
        `분류: ${capsule.route?.label || "업무"}`,
        `목표: ${capsule.goal || ""}`,
        "",
        "## 분배 계획",
        plan.subtasks?.length ? plan.subtasks.map((step, index) => `${index + 1}. ${step.agentName} · ${step.label} · ${step.expectedOutput} · ${step.engine?.label || "Codex CLI"}`).join("\n") : "분배 계획 없음",
        plan.questionReasons?.length ? `\n## 확인 필요\n${plan.questionReasons.map((item) => `- ${item.reason}`).join("\n")}` : "",
        "",
        "## 작업캡슐 JSON",
        JSON.stringify(capsule, null, 2)
      ].filter(Boolean).join("\n");
      renderOfficePlanResult(data.officePlan, originalMessage);
      if (data.officeJob) {
        renderOfficeJobResult(data.officeJob, originalMessage, false);
        if (!officeJobDone(data.officeJob.status)) startOfficeJobPolling(data.officeJob.id, originalMessage);
        else renderOfficeJobResult(data.officeJob, originalMessage, true);
        loadTaskQueue({ resume: false });
      }
      return;
    }
    const saved = data.officeTask?.saved;
    if (nodes.chatRunMeta) nodes.chatRunMeta.textContent = saved?.ok ? `Vault 저장 완료: ${saved.relPath}` : saved?.reason || "저장 대기";
    nodes.chatResultPreview.textContent = [
      "# 업무 실행 결과",
      "",
      `입력: ${originalMessage}`,
      "",
      "## 진행 체인",
      workflowSummary(data.officeTask?.workflowRun) || "workflow 정보 없음",
      "",
      "## 보고서",
      data.reply || "결과 없음"
    ].join("\n");
    renderOfficeWorkflowResult(data.officeTask?.workflowRun, originalMessage.replace(/^\/업무\s*/i, ""), saved, data.reply);
    return;
  }

  if (data.intent === "codex") {
    const job = data.codexJob;
    if (nodes.chatRunMeta) nodes.chatRunMeta.textContent = job?.id ? `작업 ID: ${job.id} · ${job.status}` : "코덱스 대기";
    nodes.chatResultPreview.textContent = [
      "# 코덱스 실행",
      "",
      `입력: ${originalMessage}`,
      job?.id ? `작업 ID: ${job.id}` : "",
      job?.commandLabel ? `실행: ${job.commandLabel}` : "",
      job?.status ? `상태: ${job.status}` : "",
      "",
      data.reply || ""
    ].filter(Boolean).join("\n");
    if (job?.id) startCodexJobPolling(job.id);
    loadTaskQueue({ resume: false });
    return;
  }

  if (data.intent === "claude") {
    if (nodes.chatRunMeta) nodes.chatRunMeta.textContent = data.llm?.used ? "Claude Code CLI · 직접 호출" : "Claude Code CLI 대기";
    nodes.chatResultPreview.textContent = [
      "# Claude Code 실행",
      "",
      `입력: ${originalMessage}`,
      data.llm?.commandLabel ? `실행: ${data.llm.commandLabel}` : "",
      "",
      data.reply || "응답 없음"
    ].filter(Boolean).join("\n");
    return;
  }

  if (data.intent === "error") {
    if (nodes.chatRunMeta) nodes.chatRunMeta.textContent = "Codex CLI 호출 실패";
    nodes.chatResultPreview.textContent = [
      "# Codex 오류",
      "",
      data.reply || "Codex CLI 호출에 실패했습니다."
    ].join("\n");
    return;
  }

  if (nodes.chatRunMeta) {
    const contextBits = [];
    if (data.context?.sourceCount) contextBits.push(`자동 Vault 참조 ${data.context.sourceCount}개`);
    if (data.context?.learnedSkillCount) contextBits.push(`자동 스킬 ${data.context.learnedSkillCount}개`);
    if (data.context?.profile?.label) contextBits.push(data.context.profile.label);
    nodes.chatRunMeta.textContent = contextBits.length ? contextBits.join(" · ") : data.sources?.length ? `참조 문서 ${data.sources.length}개` : "일반 대화";
  }
  nodes.chatResultPreview.textContent = [
    "# 최근 응답",
    "",
    data.reply || "응답 없음",
    data.sources?.length ? "\n## 참고 문서\n" + data.sources.map((item, index) => `${index + 1}. ${item.title || "문서"} · ${item.displayPath || item.relPath || ""}`).join("\n") : ""
  ].filter(Boolean).join("\n");
}

async function enqueueChatInput() {
  const message = nodes.chatInput.value.trim();
  if (!message) return;
  if (nodes.chatQueueBtn) nodes.chatQueueBtn.disabled = true;
  if (nodes.chatSendBtn) nodes.chatSendBtn.disabled = true;
  nodes.chatStatus.textContent = "큐 등록 중";
  try {
    const data = await updateTaskQueueAction({ action: "enqueue", message, type: /^\/(?:codex|code)\b/i.test(message) ? "codex" : "office" });
    const job = data.job || {};
    nodes.chatInput.value = "";
    nodes.chatInput.style.height = "";
    addChatMessage("user", message, "나", "큐 등록");
    addChatMessage("assistant", `작업 큐에 등록했습니다.\n${job.title || job.id || message}`, "YOMI Office", job.statusLabel || "대기");
    if (nodes.chatResultMode) nodes.chatResultMode.textContent = "작업 큐";
    if (nodes.chatRunMeta) nodes.chatRunMeta.textContent = `${job.type === "codex" ? "Codex" : "직원 실행"} · ${job.id || ""}`;
    if (nodes.chatResultPreview) {
      nodes.chatResultPreview.textContent = [
        "# 작업 큐 등록",
        "",
        `- 작업 ID: ${job.id || ""}`,
        `- 유형: ${job.type === "codex" ? "Codex" : "직원 실행"}`,
        `- 상태: ${job.statusLabel || job.status || "대기"}`,
        `- 제목: ${job.title || message}`
      ].join("\n");
    }
    if (job.type === "office") startOfficeJobPolling(job.id, job.title || message);
    if (job.type === "codex") startCodexJobPolling(job.id);
    await refreshState();
    await loadTaskQueue({ resume: false });
  } catch (error) {
    addChatMessage("assistant", `큐 등록 실패: ${error.message}`, "YOMI Office", "오류");
    nodes.chatStatus.textContent = "오류";
    if (nodes.chatRunMeta) nodes.chatRunMeta.textContent = `큐 등록 실패: ${error.message}`;
  } finally {
    if (nodes.chatQueueBtn) nodes.chatQueueBtn.disabled = false;
    if (nodes.chatSendBtn) nodes.chatSendBtn.disabled = false;
    nodes.chatInput.focus();
  }
}

async function submitChat(event) {
  event.preventDefault();
  const message = nodes.chatInput.value.trim();
  if (!message) return;
  nodes.chatInput.value = "";
  nodes.chatInput.style.height = "";
  nodes.chatSendBtn.disabled = true;
  if (nodes.chatQueueBtn) nodes.chatQueueBtn.disabled = true;
  nodes.chatStatus.textContent = "처리 중";
  addChatMessage("user", message, "나", "입력");
  if (/^\/업무(?:\s+|$)/i.test(message) || /^(업무|작업|실행|보고서|조사|분석|정리|기획|계획|작성|만들기)\s*[:：-]\s*/i.test(message)) {
    showYomiRoutingPending(message.replace(/^\/업무\s*/i, ""));
  }
  try {
    const response = await apiFetch("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message, sessionId: activeChatSessionId }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
    if (data.memory?.session?.id) activeChatSessionId = data.memory.session.id;
    const modeLabel = data.modeLabel || "일반대화";
    const bubbleReply = data.intent === "office"
      ? data.officePlan
        ? data.officeJob?.status === "waiting_question"
          ? "요미가 확인이 필요한 조건을 발견해서 실행을 멈췄습니다."
          : "요미가 작업캡슐을 만들고 직원 병렬 실행을 시작했습니다."
        : "업무 실행이 완료되었습니다. 상단 작업 결과 패널에서 보고서와 진행 체인을 확인하세요."
      : data.intent === "codex"
        ? "태오에게 코덱스 작업을 전달했습니다. 상단 작업 결과 패널에서 작업 ID와 상태를 확인하세요."
        : data.intent === "claude"
          ? compactReply(data.reply)
        : data.intent === "error"
          ? data.reply || "Codex CLI 호출에 실패했습니다."
        : compactReply(data.reply);
    addChatMessage("assistant", bubbleReply, "YOMI Office", modeLabel);
    nodes.chatStatus.textContent = modeLabel;
    renderChatSources(data.sources || []);
    updateChatResultPanel(data, message);
    await loadChatSessions(activeChatSessionId);
    await loadSkillCandidates();
    await loadActiveSkills();
    if ((data.intent === "office" && !data.officePlan) || data.intent === "codex") {
      await refreshState();
      await loadRecentReports();
      await loadPerformanceLog();
    }
    await loadTaskQueue({ resume: false });
  } catch (error) {
    addChatMessage("assistant", `처리 실패: ${error.message}`, "YOMI Office", "오류");
    nodes.chatStatus.textContent = "오류";
    nodes.chatResultMode.textContent = "오류";
    if (nodes.chatRunMeta) nodes.chatRunMeta.textContent = "CLI 호출 실패";
    nodes.chatResultPreview.textContent = `# 처리 실패\n\n${error.message}`;
  } finally {
    nodes.chatSendBtn.disabled = false;
    if (nodes.chatQueueBtn) nodes.chatQueueBtn.disabled = false;
    nodes.chatInput.focus();
  }
}

function resizeChatInput() {
  nodes.chatInput.style.height = "auto";
  nodes.chatInput.style.height = `${Math.min(140, nodes.chatInput.scrollHeight)}px`;
}

function handleExamplePromptClick(event) {
  const button = event.target?.closest?.("[data-example-prompt]");
  if (!button) return;
  const prompt = button.dataset.examplePrompt || "";
  if (!prompt || !nodes.chatInput) return;
  switchPage("chat");
  nodes.chatInput.value = prompt;
  resizeChatInput();
  nodes.chatInput.focus();
}

function handleChatKeydown(event) {
  if (event.key !== "Enter" || event.shiftKey || event.isComposing) return;
  event.preventDefault();
  if (!nodes.chatSendBtn.disabled) nodes.chatForm.requestSubmit();
}

function initializeStaticCopy() {
  if (nodes.chatResultPreview) nodes.chatResultPreview.textContent = "대화 결과가 여기에 표시됩니다.";
  const intro = nodes.chatThread?.querySelector(".chat-message.assistant p");
  if (intro) intro.textContent = "";
  if (nodes.connectionProvider) nodes.connectionProvider.placeholder = "exa, tavily, firecrawl, filesystem";
  if (nodes.connectionEnvKeys) nodes.connectionEnvKeys.placeholder = "EXA_API_KEY, TAVILY_API_KEY, FIRECRAWL_API_KEY";
  if (nodes.connectionMcpServer) nodes.connectionMcpServer.placeholder = "예: context7, tavily, exa";
}

document.querySelectorAll(".app-tab").forEach((tab) => tab.addEventListener("click", () => switchPage(tab.dataset.page, { focus: tab.dataset.focus || "", scrollTarget: tab.dataset.scrollTarget || "" })));
document.querySelectorAll("[data-jump]").forEach((btn) => btn.addEventListener("click", () => switchPage(btn.dataset.jump)));
document.addEventListener("click", handleExamplePromptClick);
if (nodes.runBtn) nodes.runBtn.addEventListener("click", runOfficeTask);
if (nodes.resetBtn) nodes.resetBtn.addEventListener("click", resetOffice);
if (nodes.agentLayer) nodes.agentLayer.addEventListener("click", handleOfficeAgentClick);
if (nodes.officeAgentDetailPanel) nodes.officeAgentDetailPanel.addEventListener("click", handleOfficeAgentPanelClick);
if (nodes.agentList) nodes.agentList.addEventListener("click", handleAgentSkillClick);
if (nodes.agentList) nodes.agentList.addEventListener("click", handleAgentSelect);
if (nodes.agentList) nodes.agentList.addEventListener("change", handleAgentSkillChange);
document.querySelectorAll("[data-agent-roster-action]").forEach((button) => button.addEventListener("click", handleAgentRosterAction));
if (nodes.connectionForm) nodes.connectionForm.addEventListener("submit", handleConnectionSubmit);
if (nodes.connectionResetBtn) nodes.connectionResetBtn.addEventListener("click", resetConnectionForm);
if (nodes.connectionList) nodes.connectionList.addEventListener("click", handleConnectionClick);
if (nodes.profileForm) nodes.profileForm.addEventListener("submit", saveProfileState);
if (nodes.profileReloadBtn) nodes.profileReloadBtn.addEventListener("click", loadProfileState);
if (nodes.ragReindexBtn) nodes.ragReindexBtn.addEventListener("click", handleRagReindex);
if (nodes.ragQualityRefreshBtn) nodes.ragQualityRefreshBtn.addEventListener("click", loadRagExclusions);
if (nodes.ragQualityList) nodes.ragQualityList.addEventListener("click", handleRagQualityClick);
if (nodes.quarantineList) nodes.quarantineList.addEventListener("click", handleQuarantineClick);
if (nodes.ragSearchBtn) nodes.ragSearchBtn.addEventListener("click", handleRagSearch);
if (nodes.ragSearchInput) nodes.ragSearchInput.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" || event.isComposing) return;
  event.preventDefault();
  handleRagSearch();
});
if (nodes.automationTriggerForm) nodes.automationTriggerForm.addEventListener("submit", handleAutomationTriggerSubmit);
if (nodes.automationTriggerResetBtn) nodes.automationTriggerResetBtn.addEventListener("click", resetAutomationTriggerForm);
if (nodes.automationTriggerList) nodes.automationTriggerList.addEventListener("click", handleAutomationTriggerClick);
if (nodes.channelSendForm) nodes.channelSendForm.addEventListener("submit", handleChannelSend);
if (nodes.taskQueueList) nodes.taskQueueList.addEventListener("click", handleTaskQueueClick);
if (nodes.reviewPage) nodes.reviewPage.addEventListener("click", handleReviewClick);
if (nodes.reviewRefreshBtn) nodes.reviewRefreshBtn.addEventListener("click", loadReviewInbox);
if (nodes.reviewEditForm) nodes.reviewEditForm.addEventListener("submit", submitReviewEditPanel);
if (nodes.reviewEditCancelBtn) nodes.reviewEditCancelBtn.addEventListener("click", closeReviewEditPanel);
if (nodes.humanLoopPanel) nodes.humanLoopPanel.addEventListener("click", handleHumanLoopClick);
if (nodes.chatSessionList) nodes.chatSessionList.addEventListener("click", handleChatSessionClick);
if (nodes.newChatSessionBtn) nodes.newChatSessionBtn.addEventListener("click", startNewChatSession);
if (nodes.skillCandidateList) nodes.skillCandidateList.addEventListener("click", handleSkillCandidateClick);
if (nodes.chatQueueBtn) nodes.chatQueueBtn.addEventListener("click", enqueueChatInput);
if (nodes.apiDiagnosticBtn) nodes.apiDiagnosticBtn.addEventListener("click", runApiDiagnostics);
if (nodes.researchProbeBtn) nodes.researchProbeBtn.addEventListener("click", runResearchLiveProbe);
if (nodes.portfolioList) nodes.portfolioList.addEventListener("submit", handlePortfolioEconomicsSubmit);
if (nodes.portfolioList) nodes.portfolioList.addEventListener("click", handlePortfolioEconomicsClick);
nodes.chatForm.addEventListener("submit", submitChat);
nodes.chatInput.addEventListener("keydown", handleChatKeydown);
nodes.chatInput.addEventListener("input", resizeChatInput);
nodes.refreshReportsBtn.addEventListener("click", async () => {
  await loadRecentReports();
  await loadPerformanceLog();
});
if (nodes.recentReports) nodes.recentReports.addEventListener("click", handleVaultExportClick);

initializeStaticCopy();
renderAgents([]);
renderPipeline();
renderOfficeAgentStatus([]);
renderAgentsList();
refreshState();
loadProfileState();
loadRecentReports();
loadPerformanceLog();
loadConnectionsState();
loadAutomationTriggersState();
loadChannelsState();
loadChatSessions();
loadSkillCandidates();
loadActiveSkills();
loadTaskQueue({ resume: true });
loadReviewInbox();
loadRagExclusions();
loadQuarantineState();
runApiDiagnostics();
setInterval(refreshState, 15000);
setInterval(loadAutomationTriggersState, 10000);
setInterval(loadChannelsState, 30000);
setInterval(() => loadTaskQueue({ resume: false }), 5000);
setInterval(loadReviewInbox, 8000);
