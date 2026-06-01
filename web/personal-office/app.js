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
  officeSummaryStage: document.getElementById("officeSummaryStage"),
  agentList: document.getElementById("agentList"),
  agentSkillStatus: document.getElementById("agentSkillStatus"),
  vaultStats: document.getElementById("vaultStats"),
  vaultCategoryCounts: document.getElementById("vaultCategoryCounts"),
  vaultTagCounts: document.getElementById("vaultTagCounts"),
  vaultGraph: document.getElementById("vaultGraph"),
  vaultGraphMeta: document.getElementById("vaultGraphMeta"),
  recentReports: document.getElementById("recentReports"),
  portfolioStatus: document.getElementById("portfolioStatus"),
  portfolioList: document.getElementById("portfolioList"),
  vaultExportStatus: document.getElementById("vaultExportStatus"),
  refreshReportsBtn: document.getElementById("refreshReportsBtn"),
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
  profileReloadBtn: document.getElementById("profileReloadBtn"),
  ragStatus: document.getElementById("ragStatus"),
  ragMeta: document.getElementById("ragMeta"),
  ragIndexSummary: document.getElementById("ragIndexSummary"),
  ragIndexStats: document.getElementById("ragIndexStats"),
  ragSearchInput: document.getElementById("ragSearchInput"),
  ragSearchBtn: document.getElementById("ragSearchBtn"),
  ragSearchResults: document.getElementById("ragSearchResults"),
  ragReindexBtn: document.getElementById("ragReindexBtn"),
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
  dashboardAttention: document.getElementById("dashboardAttention"),
  dashboardAttentionMeta: document.getElementById("dashboardAttentionMeta"),
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
  automationTriggerResetBtn: document.getElementById("automationTriggerResetBtn"),
  harnessScopeList: document.getElementById("harnessScopeList"),
  braveKeyGuide: document.getElementById("braveKeyGuide"),
  braveKeyStatus: document.getElementById("braveKeyStatus"),
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
let skillsState = { agents: [], tools: [] };
let connectionsState = { connections: [], candidates: [] };
let automationTriggersState = { triggers: [], summary: {} };
let latestOfficeTask = "";
let skillUpdateBusy = false;
let officeJobPollTimer = null;
let activeOfficeJobId = "";
let codexJobPollTimer = null;
let activeCodexJobId = "";
let activeChatSessionId = "";
let chatSessionsState = { sessions: [] };
let skillCandidatesState = { candidates: [] };
let profileState = { profile: null };
let taskQueueLoadedOnce = false;
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

function switchPage(page) {
  document.querySelectorAll(".app-tab").forEach((tab) => {
    const active = tab.dataset.page === page;
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
  return `
    <div class="agent-skill-item ${escapeHtml(skill.tone || "muted")}">
      <span class="skill-badge ${escapeHtml(skill.tone || "muted")}">${escapeHtml(skill.label || skill.id)} <small>${escapeHtml(skill.statusLabel || "")}</small></span>
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

function renderAgentsList() {
  if (!nodes.agentList) return;
  const skillMap = new Map((skillsState.agents || []).map((agent) => [agent.id, agent.skills || []]));
  nodes.agentList.innerHTML = agents.map((agent) => {
    const skills = skillMap.get(agent.id) || [];
    const assignedIds = new Set(skills.map((skill) => skill.id));
    const hasOptions = (skillsState.tools || []).some((tool) => !assignedIds.has(tool.id));
    const portrait = `/assets/pixel/characters/${agent.id}_portrait.png`;
    const summary = agentSkillSummary(skills);
    const engine = skillsState.agents?.find((item) => item.id === agent.id)?.engine || { id: "codex", label: "Codex CLI" };
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
        <p>${escapeHtml(agent.work)}</p>
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
      </article>
    `;
  }).join("");
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

function profileListToText(value = []) {
  return (Array.isArray(value) ? value : []).join("\n");
}

function renderProfileState(state = profileState) {
  profileState = state || { profile: null };
  const profile = profileState.profile || {};
  const memoryCount = Array.isArray(profile.memory) ? profile.memory.length : 0;
  if (nodes.styleProfileStatus) nodes.styleProfileStatus.textContent = profile.enabled !== false ? "RAG+톤 적용" : "프로필 꺼짐";
  if (nodes.styleProfileMeta) nodes.styleProfileMeta.textContent = `${profile.label || "Vault RAG와 톤 프로필"} · 메모리 ${memoryCount}개`;
  if (nodes.profileEditStatus) nodes.profileEditStatus.textContent = profile.enabled !== false ? `적용 중 · 메모리 ${memoryCount}개` : `꺼짐 · 메모리 ${memoryCount}개`;
  if (nodes.profileLabel) nodes.profileLabel.value = profile.label || "";
  if (nodes.profileEnabled) nodes.profileEnabled.checked = profile.enabled !== false;
  if (nodes.profileVoice) nodes.profileVoice.value = profileListToText(profile.voice);
  if (nodes.profileFormat) nodes.profileFormat.value = profileListToText(profile.format);
  if (nodes.profileAvoid) nodes.profileAvoid.value = profileListToText(profile.avoid);
  if (nodes.profileMemory) nodes.profileMemory.value = profileListToText(profile.memory);
}

async function loadProfileState() {
  if (!nodes.profileForm) return null;
  try {
    if (nodes.profileEditStatus) nodes.profileEditStatus.textContent = "불러오는 중";
    const response = await fetch("/api/profile", { cache: "no-store" });
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
    const response = await fetch("/api/profile", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        label: nodes.profileLabel?.value || "",
        enabled: nodes.profileEnabled?.checked !== false,
        voice: nodes.profileVoice?.value || "",
        format: nodes.profileFormat?.value || "",
        avoid: nodes.profileAvoid?.value || "",
        memory: nodes.profileMemory?.value || ""
      })
    });
    const data = await response.json();
    if (!response.ok || data.ok === false) throw new Error(data.error || "프로필 저장 실패");
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
    const response = await fetch("/api/skills-state", {
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
        ${renderEnvState(connection.envState || [])}
        <small>${escapeHtml(connection.detail || connection.notes || "")}</small>
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
  const response = await fetch("/api/connections", {
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
    const response = await fetch("/api/connections", { cache: "no-store" });
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

function renderAutomationTriggerCard(trigger) {
  const typeLabel = trigger.type === "folder_watch" ? "폴더 감시" : "예약";
  const nextText = trigger.nextRunAt ? `다음: ${formatTriggerDate(trigger.nextRunAt)}` : "";
  const lastText = trigger.lastRunAt ? `최근: ${formatTriggerDate(trigger.lastRunAt)}` : "실행 기록 없음";
  const resultText = trigger.lastResult?.ok === false
    ? `실패: ${trigger.lastResult.error || "오류"}`
    : trigger.lastResult?.jobId
      ? `작업: ${trigger.lastResult.jobId}`
      : trigger.lastResult?.modeLabel || "";
  return `
    <article class="automation-trigger-item ${escapeHtml(trigger.status || "")}">
      <div>
        <strong>${escapeHtml(trigger.title || trigger.id)}</strong>
        <span>${escapeHtml(typeLabel)} · ${escapeHtml(trigger.statusLabel || trigger.status || "대기")}</span>
        <small>${escapeHtml(trigger.detail || "")}</small>
        <small>${escapeHtml([nextText, lastText, resultText].filter(Boolean).join(" · "))}</small>
      </div>
      <div class="connection-row-actions">
        <button type="button" data-trigger-action="toggle" data-trigger-id="${escapeHtml(trigger.id)}" data-enabled="${trigger.enabled ? "false" : "true"}">${trigger.enabled ? "끄기" : "켜기"}</button>
        <button type="button" data-trigger-action="run" data-trigger-id="${escapeHtml(trigger.id)}">수동 실행</button>
        <button type="button" data-trigger-action="edit" data-trigger-id="${escapeHtml(trigger.id)}">수정</button>
        <button type="button" data-trigger-action="delete" data-trigger-id="${escapeHtml(trigger.id)}">삭제</button>
      </div>
    </article>
  `;
}

function renderAutomationTriggersState(state = automationTriggersState) {
  automationTriggersState = state || { triggers: [], summary: {} };
  const triggers = automationTriggersState.triggers || [];
  const summary = automationTriggersState.summary || {};
  if (nodes.automationTriggerSummary) {
    nodes.automationTriggerSummary.textContent = summary.running
      ? `${summary.running}개 실행`
      : summary.enabled
        ? `${summary.enabled}/${summary.total || triggers.length} 활성`
        : "대기";
  }
  if (nodes.automationTriggerStatus) {
    nodes.automationTriggerStatus.textContent = summary.attention
      ? `확인 필요 ${summary.attention}개`
      : summary.enabled
        ? "자동화 준비"
        : "필요할 때 켜기";
  }
  if (!nodes.automationTriggerList) return;
  nodes.automationTriggerList.innerHTML = triggers.length
    ? triggers.map(renderAutomationTriggerCard).join("")
    : '<div class="empty">등록된 자동화 트리거가 없습니다.</div>';
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
  nodes.automationTriggerForm.classList.add("editing");
  nodes.automationTriggerTitle.focus();
}

async function updateAutomationTriggerConfig(payload) {
  if (nodes.automationTriggerStatus) nodes.automationTriggerStatus.textContent = "자동화 설정 저장 중";
  const response = await fetch("/api/automation-triggers", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok || data.ok === false) throw new Error(data.error || "자동화 설정 저장 실패");
  renderAutomationTriggersState(data);
  if (nodes.automationTriggerStatus) nodes.automationTriggerStatus.textContent = "자동화 설정 반영됨";
  return data;
}

async function loadAutomationTriggersState() {
  if (!nodes.automationTriggerList) return;
  try {
    const response = await fetch("/api/automation-triggers", { cache: "no-store" });
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
  button.disabled = true;
  try {
    if (action === "toggle") await updateAutomationTriggerConfig({ action: "toggle", id, enabled: button.dataset.enabled === "true" });
    if (action === "delete") await updateAutomationTriggerConfig({ action: "delete", id });
    if (action === "run") {
      await updateAutomationTriggerConfig({ action: "run", id });
      await loadTaskQueue({ resume: false });
      if (nodes.automationTriggerStatus) nodes.automationTriggerStatus.textContent = "수동 실행을 큐에 등록했습니다.";
    }
  } catch (error) {
    if (nodes.automationTriggerStatus) nodes.automationTriggerStatus.textContent = `실행 실패: ${error.message}`;
  } finally {
    button.disabled = false;
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
  const last = rag.lastIndexedAt ? formatShortTime(rag.lastIndexedAt) : "미실행";
  if (nodes.ragStatus) nodes.ragStatus.textContent = connected ? mode : "Vault 대기";
  if (nodes.ragMeta) nodes.ragMeta.textContent = `${docs}문서 · ${chunks}청크 · ${last}`;
  if (nodes.ragIndexSummary) nodes.ragIndexSummary.textContent = rag.dirty ? "갱신 필요" : mode;
  if (nodes.ragIndexStats) {
    nodes.ragIndexStats.innerHTML = [
      ["문서", docs],
      ["청크", chunks],
      ["최근 변경", Number(rag.changedDocumentCount || 0)],
      ["임베딩", mode],
      ["마지막", last]
    ].map(([label, value]) => `<div class="vault-stat"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("");
  }
}

async function handleRagReindex() {
  if (!nodes.ragReindexBtn) return;
  nodes.ragReindexBtn.disabled = true;
  if (nodes.ragIndexSummary) nodes.ragIndexSummary.textContent = "인덱싱 중";
  try {
    const embeddings = window.confirm("임베딩 API 키가 있으면 시맨틱 인덱싱 중 API 비용/쿼터가 사용될 수 있습니다. 시맨틱 인덱싱으로 갱신할까요?\n\n취소를 누르면 비용 없는 BM25+키워드 인덱스만 갱신합니다.");
    const response = await fetch("/api/rag/index", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ force: true, embeddings })
    });
    const data = await response.json();
    if (!response.ok || data.ok === false) throw new Error(data.error || `HTTP ${response.status}`);
    renderRagState(data.status || {});
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
    const response = await fetch(`/api/rag/search?q=${encodeURIComponent(query)}&k=5`, { cache: "no-store" });
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

function renderVaultGraph(graph = {}) {
  if (!nodes.vaultGraph) return;
  const graphNodes = (graph.nodes || []).slice(0, 28);
  const graphEdges = graph.edges || [];
  if (!graphNodes.length) {
    nodes.vaultGraph.innerHTML = '<text x="360" y="180" text-anchor="middle" class="graph-empty">표시할 문서가 없습니다.</text>';
    if (nodes.vaultGraphMeta) nodes.vaultGraphMeta.textContent = "0개 노드";
    return;
  }
  const width = 720;
  const height = 360;
  const cx = width / 2;
  const cy = height / 2;
  const radiusX = graphNodes.length > 10 ? 260 : 210;
  const radiusY = graphNodes.length > 10 ? 126 : 106;
  const positions = new Map(graphNodes.map((node, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(1, graphNodes.length) - Math.PI / 2;
    return [node.id, { x: cx + Math.cos(angle) * radiusX, y: cy + Math.sin(angle) * radiusY, node }];
  }));
  const lines = graphEdges.filter((edge) => positions.has(edge.source) && positions.has(edge.target)).map((edge) => {
    const source = positions.get(edge.source);
    const target = positions.get(edge.target);
    return `<line x1="${source.x.toFixed(1)}" y1="${source.y.toFixed(1)}" x2="${target.x.toFixed(1)}" y2="${target.y.toFixed(1)}" />`;
  }).join("");
  const dots = [...positions.values()].map(({ x, y, node }) => {
    const size = Math.min(18, 7 + Number(node.size || 1) * 2);
    return `
      <g class="graph-node" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})">
        <title>${escapeHtml(node.title)} · ${escapeHtml(node.folder || "")}</title>
        <circle r="${size}" />
        <text y="${size + 13}" text-anchor="middle">${escapeHtml(shortGraphLabel(node.title))}</text>
      </g>
    `;
  }).join("");
  nodes.vaultGraph.innerHTML = `<g class="graph-edges">${lines}</g><g>${dots}</g>`;
  if (nodes.vaultGraphMeta) nodes.vaultGraphMeta.textContent = `${graphNodes.length}개 노드 · ${graphEdges.length}개 연결`;
}

function formatShortTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
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
  if (nodes.serverStatus) nodes.serverStatus.textContent = "서버 정상";
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
    const count = Number(profile.memoryCount || 0);
    nodes.styleProfileMeta.textContent = `${profile.label || "Vault RAG와 톤 프로필"} · 메모리 ${count}개`;
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
}

async function refreshState() {
  try {
    const response = await fetch("/api/office-state", { cache: "no-store" });
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

async function exportVaultReport(relPath, format) {
  if (!relPath || !format) return;
  if (nodes.vaultExportStatus) nodes.vaultExportStatus.textContent = `${vaultExportFormatLabel(format)} 변환 중`;
  try {
    const response = await fetch("/api/vault-export", {
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
    const response = await fetch("/api/vault-overview?limit=14", { cache: "no-store" });
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
    const response = await fetch("/api/performance-log?limit=12", { cache: "no-store" });
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
    const response = await fetch("/api/run-office-task", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ task }) });
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
    const meta = turn.capture?.ok ? "Vault 저장" : turn.skillCandidateIds?.length ? "스킬 후보" : turn.modeLabel || "기록";
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
    const response = await fetch(url, { cache: "no-store" });
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
  const response = await fetch("/api/chat-sessions", {
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

function renderSkillCandidates(state = skillCandidatesState) {
  skillCandidatesState = state || { candidates: [] };
  if (!nodes.skillCandidateList) return;
  const candidates = (skillCandidatesState.candidates || []).filter((candidate) => candidate.status !== "dismissed").slice(0, 12);
  const pending = candidates.filter((candidate) => candidate.status === "pending");
  if (nodes.skillCandidateStatus) nodes.skillCandidateStatus.textContent = pending.length ? `${pending.length}개 대기` : "대기";
  if (!candidates.length) {
    nodes.skillCandidateList.innerHTML = '<div class="empty">스킬 후보 없음</div>';
    return;
  }
  nodes.skillCandidateList.innerHTML = candidates.map((candidate) => `
    <article class="skill-candidate-item ${escapeHtml(candidate.status || "")}">
      <strong>${escapeHtml(candidate.title || candidate.id)}</strong>
      <span><b class="skill-candidate-kind">${escapeHtml(skillCandidateKindLabel(candidate.kind))}</b> ${escapeHtml((candidate.agentIds || []).map((id) => agents.find((agent) => agent.id === id)?.name || id).join(", "))}</span>
      <small>${escapeHtml(candidate.description || "")}</small>
      ${candidate.confidence ? `<small>신뢰도 ${Number(candidate.confidence || 0)}점${candidate.autoAppliedAt ? " · 자동 반영" : ""}</small>` : ""}
      <div class="connection-row-actions">
        ${candidate.status === "approved" ? `<b>적용됨</b>` : `
          <button type="button" data-skill-candidate-action="approve" data-candidate-id="${escapeHtml(candidate.id)}">${candidate.kind === "memory" ? "메모리 적용" : "스킬 적용"}</button>
          <button type="button" data-skill-candidate-action="dismiss" data-candidate-id="${escapeHtml(candidate.id)}">숨김</button>
        `}
      </div>
    </article>
  `).join("");
}

async function loadSkillCandidates() {
  if (!nodes.skillCandidateList) return null;
  try {
    const response = await fetch("/api/skill-candidates", { cache: "no-store" });
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
  button.disabled = true;
  const action = button.dataset.skillCandidateAction || "";
  const id = button.dataset.candidateId || "";
  try {
    const response = await fetch("/api/skill-candidates", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, id })
    });
    const data = await response.json();
    if (!response.ok || data.ok === false) throw new Error(data.error || `HTTP ${response.status}`);
    if (data.skills) renderSkillsState(data.skills);
    if (data.profile) renderProfileState(data.profile);
    await loadSkillCandidates();
    if (action === "approve") {
      addChatMessage("assistant", "대화에서 만든 스킬 후보를 직원 스킬에 적용했습니다.", "YOMI Office", "스킬 적용");
      if (nodes.skillCandidateStatus) nodes.skillCandidateStatus.textContent = "스킬 적용 완료";
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
    const response = await fetch(`/api/orchestration-job?id=${encodeURIComponent(jobId)}`, { cache: "no-store" });
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
    const response = await fetch("/api/orchestration-job/answer", {
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
    const response = await fetch(`/api/codex-job?id=${encodeURIComponent(jobId)}`, { cache: "no-store" });
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
  const jobs = state.jobs || [];
  if (nodes.taskQueueStatus) {
    const running = state.summary?.running || 0;
    const completed = state.summary?.completed || 0;
    const attention = state.summary?.attention || 0;
    nodes.taskQueueStatus.textContent = running
      ? `${running}개 실행 · 완료 ${completed}개`
      : attention
        ? `주의 ${attention}개 · 완료 ${completed}개`
        : jobs.length
          ? `완료 ${completed}개 · 기록 ${jobs.length}개`
          : "대기";
  }
  if (!jobs.length) {
    nodes.taskQueueList.innerHTML = '<div class="office-agent-empty">대기 중인 작업이 없습니다.</div>';
    return;
  }
  nodes.taskQueueList.innerHTML = jobs.slice(0, 8).map((job) => {
    const active = job.id === activeOfficeJobId || job.id === activeCodexJobId ? " active" : "";
    const tone = taskQueueTone(job.status);
    const running = ["queued", "running", "retrying", "finalizing", "waiting_question"].includes(job.status);
    const retryable = ["failed", "completed_with_errors", "cancelled"].includes(job.status);
    return `
      <article class="task-queue-item ${tone}${active}">
        <button class="task-queue-main" type="button" data-job-type="${escapeHtml(job.type)}" data-job-id="${escapeHtml(job.id)}">
          <strong>${escapeHtml(job.title || job.id)}</strong>
          <span>${escapeHtml(job.restored ? "기록" : job.type === "codex" ? "Codex" : "직원")}</span>
          <b>${escapeHtml(job.statusLabel || officeJobStatusLabel(job.status))}</b>
          <p>${escapeHtml(job.progress || job.detail || "")}</p>
          <small>${escapeHtml(formatShortTime(job.updatedAt || job.completedAt || job.createdAt))}</small>
        </button>
        <div class="task-queue-actions">
          ${running ? `<button type="button" data-task-queue-action="cancel" data-job-type="${escapeHtml(job.type)}" data-job-id="${escapeHtml(job.id)}">취소</button>` : ""}
          ${retryable ? `<button type="button" data-task-queue-action="retry" data-job-type="${escapeHtml(job.type)}" data-job-id="${escapeHtml(job.id)}">재시도</button>` : ""}
        </div>
      </article>
    `;
  }).join("");
}

async function loadTaskQueue(options = {}) {
  if (!nodes.taskQueueList) return null;
  const { resume = false } = options;
  try {
    const response = await fetch("/api/task-queue?limit=20", { cache: "no-store" });
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
  const response = await fetch("/api/task-queue", {
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

  if (nodes.chatRunMeta) nodes.chatRunMeta.textContent = data.context?.sourceCount ? `자동 Vault 참조 ${data.context.sourceCount}개 · ${data.context.profile?.label || "톤 프로필"}` : data.sources?.length ? `참조 문서 ${data.sources.length}개` : "일반 대화";
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
    const response = await fetch("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message, sessionId: activeChatSessionId }) });
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

document.querySelectorAll(".app-tab").forEach((tab) => tab.addEventListener("click", () => switchPage(tab.dataset.page)));
document.querySelectorAll("[data-jump]").forEach((btn) => btn.addEventListener("click", () => switchPage(btn.dataset.jump)));
document.addEventListener("click", handleExamplePromptClick);
if (nodes.runBtn) nodes.runBtn.addEventListener("click", runOfficeTask);
if (nodes.resetBtn) nodes.resetBtn.addEventListener("click", resetOffice);
if (nodes.agentList) nodes.agentList.addEventListener("click", handleAgentSkillClick);
if (nodes.agentList) nodes.agentList.addEventListener("change", handleAgentSkillChange);
if (nodes.connectionForm) nodes.connectionForm.addEventListener("submit", handleConnectionSubmit);
if (nodes.connectionResetBtn) nodes.connectionResetBtn.addEventListener("click", resetConnectionForm);
if (nodes.connectionList) nodes.connectionList.addEventListener("click", handleConnectionClick);
if (nodes.profileForm) nodes.profileForm.addEventListener("submit", saveProfileState);
if (nodes.profileReloadBtn) nodes.profileReloadBtn.addEventListener("click", loadProfileState);
if (nodes.ragReindexBtn) nodes.ragReindexBtn.addEventListener("click", handleRagReindex);
if (nodes.ragSearchBtn) nodes.ragSearchBtn.addEventListener("click", handleRagSearch);
if (nodes.ragSearchInput) nodes.ragSearchInput.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" || event.isComposing) return;
  event.preventDefault();
  handleRagSearch();
});
if (nodes.automationTriggerForm) nodes.automationTriggerForm.addEventListener("submit", handleAutomationTriggerSubmit);
if (nodes.automationTriggerResetBtn) nodes.automationTriggerResetBtn.addEventListener("click", resetAutomationTriggerForm);
if (nodes.automationTriggerList) nodes.automationTriggerList.addEventListener("click", handleAutomationTriggerClick);
if (nodes.taskQueueList) nodes.taskQueueList.addEventListener("click", handleTaskQueueClick);
if (nodes.humanLoopPanel) nodes.humanLoopPanel.addEventListener("click", handleHumanLoopClick);
if (nodes.chatSessionList) nodes.chatSessionList.addEventListener("click", handleChatSessionClick);
if (nodes.newChatSessionBtn) nodes.newChatSessionBtn.addEventListener("click", startNewChatSession);
if (nodes.skillCandidateList) nodes.skillCandidateList.addEventListener("click", handleSkillCandidateClick);
if (nodes.chatQueueBtn) nodes.chatQueueBtn.addEventListener("click", enqueueChatInput);
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
loadChatSessions();
loadSkillCandidates();
loadTaskQueue({ resume: true });
setInterval(refreshState, 15000);
setInterval(loadAutomationTriggersState, 10000);
setInterval(() => loadTaskQueue({ resume: false }), 5000);
