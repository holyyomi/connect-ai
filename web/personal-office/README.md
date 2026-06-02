# YOMI Office / 요미오피스

YOMI Office / 요미오피스는 Codex CLI를 기본 엔진으로 사용하는 로컬 웹 사무실입니다. 대화, 직원 인계, 진행 상태, Vault 저장, 스킬/도구 연결 상태를 한 화면에서 다룹니다.

## 실행

```powershell
npm run yomi:start
```

기본 주소:

```text
http://127.0.0.1:17331
```

포트가 이미 사용 중이면:

```powershell
npm run yomi:restart
```

## 기본 엔진

기본 엔진은 Codex CLI입니다.

```text
codex
```

선택 환경변수:

```text
YOMI_AI_CODEX_COMMAND
YOMI_AI_CODEX_TIMEOUT_MS
YOMI_AI_CODEX_PROMPT_TIMEOUT_MS
```

Claude Code CLI는 긴 추론, 글쓰기, 리서치 종합, 검토 업무에 자동 라우팅될 수 있고 직접 호출도 가능합니다.

```text
/cc 요청 내용
/claude 요청 내용
```

선택 환경변수:

```text
YOMI_AI_CLAUDE_COMMAND
YOMI_AI_CLAUDE_MODEL
YOMI_AI_CLAUDE_PROMPT_TIMEOUT_MS
YOMI_AI_CLAUDE_MAX_BUDGET_USD
```

YOMI Office 런타임은 Codex CLI와 Claude Code CLI만 사용합니다.

## 화면 구성

| 탭 | 역할 |
| --- | --- |
| 사무실 | 픽셀아트 사무실과 현재 진행 상태 |
| 검수함 | 작업 큐, 성과, 스킬 후보, 포트폴리오 후보 검수 |
| 대화 | Codex-first 입력창과 실행 결과 |
| 직원 | 역할별 직원 카드, 스킬, 도구 토글 |
| 저장소 | Vault 최근 저장 문서와 그래프 |
| 설정 | Codex, Claude, Vault, API, MCP 연결 상태 |

## 직원 역할

| 직원 | 역할 |
| --- | --- |
| 요미 | 총괄, 의도 분석, 작업 분해, 최종 취합 |
| 나래 | 운영, 체크리스트, 티켓, 진행 관리 |
| 서아 | 리서치, 출처, 웹/문서 근거 수집 |
| 도윤 | 전략, 우선순위, KPI, 판단 기준 |
| 태오 | 개발, 파일/API/검증/자동화 |
| 문채 | 문서 초안, 지식화 |
| 하루 | 편집, 톤, 압축, 검수 |
| 이안 | 디자인, 화면 구조, 레퍼런스 |
| 유진 | 영상 기획과 포맷 |
| 리아 | SNS, 릴스/쇼츠/해시태그 |
| 아카 | Vault 저장, 태깅, RAG 분류 |

직원별 스킬 매핑:

```text
web/personal-office/skills.json
```

연결/권한 매핑:

```text
web/personal-office/connections.json
web/personal-office/mcp-servers.safe.json
```

## 검색/API 키

Brave Search는 현재 기본 경로에서 제외되었습니다.

현재 리서치용 후보:

```text
EXA_API_KEY
FIRECRAWL_API_KEY
TAVILY_API_KEY
```

키는 `.env` 또는 사용자 환경변수에 둡니다. 화면과 JSON 파일에는 키 값이 아니라 존재 여부만 표시해야 합니다.

## MCP/도구 상태

현재 기준:

- Context7: API 키 없이 사용 가능한 최신 문서 조회 후보
- Playwright: 브라우저 검증/제어 후보, 기본 비활성 권장
- Exa: API 키 필요
- Firecrawl: API 키 필요
- Tavily: API 키 필요
- Fetch MCP: 선택 후보, `uvx`가 없으면 선택 상태로 표시
- Git MCP: 선택 후보, `uvx`가 없으면 선택 상태로 표시, 읽기 전용 권장

Playwright 브라우저 검증이 필요하면 Chromium 바이너리를 설치합니다.

```powershell
npx playwright install chromium
```

## Vault 저장

기본 Vault:

```text
C:\Users\a0104\Desktop\MY\obsidian
```

기본 저장 위치:

```text
50_Outputs/YOMI Office/
```

자동 저장 기준:

- 최종 보고서가 재사용 가치가 있을 때
- 중간 산출물이 나중에 다시 쓸 수 있는 지식/체크리스트/기준일 때
- 저장 위치와 파일명이 명확할 때

사용자에게 물어봐야 하는 경우:

- 저장 위치가 애매함
- 파일명이 애매함
- 덮어쓰기 가능성 있음
- 외부 전송이 필요함
- 비용 발생 가능성 있음
- 작업 지시 자체가 모호함
- 파일 쓰기/Git 쓰기/삭제/배포가 관련됨

## 검증

문법 체크:

```powershell
node --check web\personal-office\server.mjs
node --check web\personal-office\app.js
```

브라우저 확인:

```powershell
npx playwright --version
```

확인할 항목:

- 6개 탭 전환
- 콘솔 에러 없음
- 사무실 진행 상태가 현재 작업만 표시되는지
- 직원 카드에서 서아/리서치 API 상태가 정상인지
- 저장소 최근 문서가 제목으로 보이고 클릭 시 펼쳐지는지
- 설정 탭이 핵심 연결 중심으로 정리되어 있는지
