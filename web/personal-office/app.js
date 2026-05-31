const agents = [
  { id: "ceo", name: "요미", role: "총괄 매니저", roleShort: "총괄", sprite: "/assets/pixel/characters/ceo.png", spriteSheet: "/assets/pixel/characters/ceo_sheet.png", x: 50, y: 45, work: "목표와 완료 기준을 정하고 직원 작업을 지휘합니다." },
  { id: "secretary", name: "나래", role: "운영 비서", roleShort: "운영", sprite: "/assets/pixel/characters/secretary.png", spriteSheet: "/assets/pixel/characters/secretary_sheet.png", x: 39, y: 51, work: "업무 티켓, 체크리스트, 검토 기준을 챙깁니다." },
  { id: "youtube", name: "유진", role: "영상 기획", roleShort: "영상", sprite: "/assets/pixel/characters/youtube.png", spriteSheet: "/assets/pixel/characters/youtube_sheet.png", x: 47, y: 22, work: "영상 훅, 제목, 구성을 설계합니다." },
  { id: "instagram", name: "리아", role: "SNS 운영", roleShort: "SNS", sprite: "/assets/pixel/characters/instagram.png", spriteSheet: "/assets/pixel/characters/instagram_sheet.png", x: 57, y: 23, work: "SNS 캡션, 해시태그, 재활용 포맷을 만듭니다." },
  { id: "designer", name: "이안", role: "디자인", roleShort: "디자인", sprite: "/assets/pixel/characters/designer.png", spriteSheet: "/assets/pixel/characters/designer_sheet.png", x: 74, y: 27, work: "화면 구조와 정보 위계를 점검합니다." },
  { id: "developer", name: "태오", role: "개발", roleShort: "개발", sprite: "/assets/pixel/characters/developer.png", spriteSheet: "/assets/pixel/characters/developer_sheet.png", x: 46, y: 75, work: "파일, API, 자동화, 검증을 맡습니다." },
  { id: "business", name: "도윤", role: "전략", roleShort: "전략", sprite: "/assets/pixel/characters/business.png", spriteSheet: "/assets/pixel/characters/business_sheet.png", x: 80, y: 47, work: "우선순위, KPI, 실행 효과를 판단합니다." },
  { id: "editor", name: "하루", role: "편집", roleShort: "편집", sprite: "/assets/pixel/characters/editor.png", spriteSheet: "/assets/pixel/characters/editor_sheet.png", x: 60, y: 74, work: "리듬, 압축, 강조 지점을 잡습니다." },
  { id: "writer", name: "문채", role: "문서", roleShort: "문서", sprite: "/assets/pixel/characters/writer.png", spriteSheet: "/assets/pixel/characters/writer_sheet.png", x: 22, y: 71, work: "보고서, 카피, 문장 구조를 완성합니다." },
  { id: "researcher", name: "서아", role: "리서치", roleShort: "리서치", sprite: "/assets/pixel/characters/researcher.png", spriteSheet: "/assets/pixel/characters/researcher_sheet.png", x: 22, y: 31, work: "근거, 사례, 리스크를 모읍니다." },
  { id: "archivist", name: "아카", role: "자산화", roleShort: "Vault", sprite: "", spriteSheet: "/assets/pixel/characters/archivist_sheet.png", x: 73, y: 79, work: "Vault 저장 위치, 태그, RAG 후보를 분류합니다." }
];

const phases = [
  { title: "코어 점화", agents: ["ceo", "secretary"], text: "요미가 명령을 업무 캡슐로 바꾸고 나래가 실행 순서를 엽니다." },
  { title: "근거 수집", agents: ["researcher", "business"], text: "서아와 도윤이 자료, 리스크, 판단 기준을 동시에 모읍니다." },
  { title: "제작 가동", agents: ["writer", "designer", "developer"], text: "문채, 이안, 태오가 산출물을 만들고 구조를 맞춥니다." },
  { title: "콘텐츠 튜닝", agents: ["youtube", "instagram", "editor"], text: "유진, 리아, 하루가 포맷과 리듬을 다듬습니다." },
  { title: "Vault 저장", agents: ["archivist", "secretary"], text: "아카가 결과를 지식 보석으로 저장하고 나래가 다음 행동을 정리합니다." }
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
  officeCurrentStatus: document.getElementById("officeCurrentStatus"),
  officeCurrentTask: document.getElementById("officeCurrentTask"),
  officeAgentStatus: document.getElementById("officeAgentStatus"),
  officeChainStatus: document.getElementById("officeChainStatus"),
  officeSummaryStage: document.getElementById("officeSummaryStage"),
  agentList: document.getElementById("agentList"),
  agentSkillStatus: document.getElementById("agentSkillStatus"),
  vaultStats: document.getElementById("vaultStats"),
  vaultCategoryCounts: document.getElementById("vaultCategoryCounts"),
  vaultTagCounts: document.getElementById("vaultTagCounts"),
  vaultGraph: document.getElementById("vaultGraph"),
  vaultGraphMeta: document.getElementById("vaultGraphMeta"),
  recentReports: document.getElementById("recentReports"),
  refreshReportsBtn: document.getElementById("refreshReportsBtn"),
  serverStatus: document.getElementById("serverStatus"),
  aiStatus: document.getElementById("aiStatus"),
  codexStatus: document.getElementById("codexStatus"),
  claudeStatus: document.getElementById("claudeStatus"),
  vaultStatus: document.getElementById("vaultStatus"),
  vaultPath: document.getElementById("vaultPath"),
  reportCount: document.getElementById("reportCount"),
  dashboardFocusWork: document.getElementById("dashboardFocusWork"),
  dashboardFocusMeta: document.getElementById("dashboardFocusMeta"),
  dashboardTodayCount: document.getElementById("dashboardTodayCount"),
  dashboardReviewRate: document.getElementById("dashboardReviewRate"),
  dashboardTodayMeta: document.getElementById("dashboardTodayMeta"),
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
  harnessScopeList: document.getElementById("harnessScopeList"),
  braveKeyGuide: document.getElementById("braveKeyGuide"),
  braveKeyStatus: document.getElementById("braveKeyStatus"),
  chatThread: document.getElementById("chatThread"),
  chatForm: document.getElementById("chatForm"),
  chatInput: document.getElementById("chatInput"),
  chatSendBtn: document.getElementById("chatSendBtn"),
  chatStatus: document.getElementById("chatStatus"),
  chatResultMode: document.getElementById("chatResultMode"),
  chatResultPreview: document.getElementById("chatResultPreview"),
  chatProvider: document.getElementById("chatProvider"),
  chatMemory: document.getElementById("chatMemory"),
  chatRunMeta: document.getElementById("chatRunMeta"),
  chatSources: document.getElementById("chatSources")
};

let phaseTimer = null;
let officeEndTimer = null;
let officeMoveTimers = [];
let skillsState = { agents: [], tools: [] };
let connectionsState = { connections: [], candidates: [] };
let latestOfficeTask = "";
let skillUpdateBusy = false;
let officeJobPollTimer = null;
let activeOfficeJobId = "";
const completedOfficeJobIds = new Set();
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
  resetAgentPositions();
  clearCollaborationCue();
  nodes.agentLayer?.querySelectorAll(".agent").forEach((el) => el.classList.remove("walking", "working"));
  if (nodes.activityLog) nodes.activityLog.innerHTML = "";
  if (nodes.reportText) nodes.reportText.textContent = "사무실 탭은 진행 시각화 전용입니다. 업무 지시는 대화 탭에서 입력하세요.";
  if (nodes.saveNotice) nodes.saveNotice.textContent = "대화 탭에서 실행 대기";
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

function renderDashboardAgentCounts(agentCounts = []) {
  if (!nodes.dashboardAgentCounts) return;
  const active = agentCounts.filter((agent) => agent.count > 0).sort((a, b) => b.count - a.count).slice(0, 8);
  if (!active.length) {
    nodes.dashboardAgentCounts.innerHTML = '<div class="agent-metric empty">직원별 처리 기록 대기</div>';
    return;
  }
  nodes.dashboardAgentCounts.innerHTML = active.map((agent) => `<div class="agent-metric"><span>${escapeHtml(agent.name)}</span><strong>${agent.count}</strong></div>`).join("");
}

function renderVaultStats(counts = {}) {
  const rows = [["YOMI 보고서", counts.webOfficeReports ?? 0], ["자동 수집", counts.autoCaptures ?? 0], ["초안", counts.knowledgeDrafts ?? 0], ["자동 요약", counts.autoDigests ?? 0], ["일일 리뷰", counts.dailyReviews ?? 0]];
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
  if (nodes.dashboardTodayMeta) nodes.dashboardTodayMeta.textContent = `${today.date || "오늘"} 저장된 YOMI 보고서 기준`;

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
  if (nodes.claudeStatus) nodes.claudeStatus.textContent = data.claude?.available ? "수동 호출 가능" : "대기";
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
        </div>
      </details>
    `).join("");
  } catch (error) {
    renderVaultGraph({ nodes: [], edges: [] });
    nodes.recentReports.innerHTML = `<div class="empty">저장소 로드 실패: ${escapeHtml(error.message)}</div>`;
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
  const title = label || (role === "user" ? "나" : "YOMI AI");
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
    planned: "계획"
  })[status] || status || "대기";
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
  return ["completed", "completed_with_errors", "failed", "waiting_question"].includes(status);
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
      row.innerHTML = `<strong>${escapeHtml(step.agentName || step.agentId)}</strong><span>${escapeHtml(step.status || "planned")}</span><p>${escapeHtml(`${step.label || "서브태스크"} → ${step.expectedOutput || ""}`)}</p>`;
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
        ? subtasks.map((step, index) => `${index + 1}. ${step.agentName}(${step.role || ""}) - ${step.label}\n   - 목표: ${step.objective}\n   - 산출물: ${step.expectedOutput}\n   - 병렬 그룹: ${step.parallelGroup}`).join("\n")
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
      "",
      "## 현재 진행",
      currentOfficeJobSummary(subtasks, currentIds),
      "",
      "## 요미 최종 보고",
      reportText
    ].join("\n")
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
      "",
      "## 현재 진행",
      currentOfficeJobSummary(subtasks, currentIds),
      "",
      "## 요미 최종 보고",
      reportText
    ].join("\n");
  }
  if (announceFinal && officeJobDone(job.status) && !completedOfficeJobIds.has(job.id)) {
    completedOfficeJobIds.add(job.id);
    const text = job.status === "waiting_question"
      ? "이 작업은 확인이 필요해서 실행을 멈췄습니다. 상단 작업 결과 패널에서 확인할 조건을 봐주세요."
      : job.report || job.error || "병렬 직원 실행이 완료되었습니다.";
    addChatMessage("assistant", compactReply(text, 900), "YOMI AI", officeJobStatusLabel(job.status));
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
    if (officeJobDone(job.status) && officeJobPollTimer) {
      clearInterval(officeJobPollTimer);
      officeJobPollTimer = null;
      activeOfficeJobId = "";
      await refreshState();
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
  if (nodes.chatMemory) nodes.chatMemory.textContent = `대화 기록 ${nodes.chatThread.querySelectorAll(".chat-message").length}개`;

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
        plan.subtasks?.length ? plan.subtasks.map((step, index) => `${index + 1}. ${step.agentName} · ${step.label} · ${step.expectedOutput}`).join("\n") : "분배 계획 없음",
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
    return;
  }

  if (data.intent === "claude") {
    if (nodes.chatRunMeta) nodes.chatRunMeta.textContent = data.llm?.used ? "Claude Code CLI · 수동 호출" : "Claude Code CLI 대기";
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

  if (nodes.chatRunMeta) nodes.chatRunMeta.textContent = data.sources?.length ? `참조 문서 ${data.sources.length}개` : "일반 대화";
  nodes.chatResultPreview.textContent = [
    "# 최근 응답",
    "",
    data.reply || "응답 없음",
    data.sources?.length ? "\n## 참고 문서\n" + data.sources.map((item, index) => `${index + 1}. ${item.title || "문서"} · ${item.displayPath || item.relPath || ""}`).join("\n") : ""
  ].filter(Boolean).join("\n");
}

async function submitChat(event) {
  event.preventDefault();
  const message = nodes.chatInput.value.trim();
  if (!message) return;
  nodes.chatInput.value = "";
  nodes.chatInput.style.height = "";
  nodes.chatSendBtn.disabled = true;
  nodes.chatStatus.textContent = "처리 중";
  addChatMessage("user", message, "나", "입력");
  if (/^\/업무(?:\s+|$)/i.test(message) || /^(업무|작업|실행|보고서|조사|분석|정리|기획|계획|작성|만들기)\s*[:：-]\s*/i.test(message)) {
    showYomiRoutingPending(message.replace(/^\/업무\s*/i, ""));
  }
  try {
    const response = await fetch("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
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
    addChatMessage("assistant", bubbleReply, "YOMI AI", modeLabel);
    nodes.chatStatus.textContent = modeLabel;
    renderChatSources(data.sources || []);
    updateChatResultPanel(data, message);
    if ((data.intent === "office" && !data.officePlan) || data.intent === "codex") {
      await refreshState();
      await loadRecentReports();
    }
  } catch (error) {
    addChatMessage("assistant", `처리 실패: ${error.message}`, "YOMI AI", "오류");
    nodes.chatStatus.textContent = "오류";
    nodes.chatResultMode.textContent = "오류";
    if (nodes.chatRunMeta) nodes.chatRunMeta.textContent = "CLI 호출 실패";
    nodes.chatResultPreview.textContent = `# 처리 실패\n\n${error.message}`;
  } finally {
    nodes.chatSendBtn.disabled = false;
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
nodes.chatForm.addEventListener("submit", submitChat);
nodes.chatInput.addEventListener("keydown", handleChatKeydown);
nodes.chatInput.addEventListener("input", resizeChatInput);
nodes.refreshReportsBtn.addEventListener("click", loadRecentReports);

initializeStaticCopy();
renderAgents([]);
renderPipeline();
renderOfficeAgentStatus([]);
renderAgentsList();
refreshState();
loadRecentReports();
loadConnectionsState();
setInterval(refreshState, 15000);
