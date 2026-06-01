# PROJECT_INTENT.md

## 1. Project Purpose

이 프로젝트는 Connect AI를 기반으로 요미님이 실제로 쓰는 개인 AI 운영/지식/자동화 시스템을 만드는 프로젝트다.

핵심 목표는 판매가 아니라 실제 사용성이다. 반복 작업을 줄이고, 프롬프트/검수 기준/작업 로그/성과 패턴이 Vault 자산으로 쌓이게 만든다.

## 2. Current Product Direction

현재 중심은 **YOMI Office / 요미오피스**이다.

기본 방향:

- Codex CLI를 기본 엔진으로 사용한다.
- Claude Code CLI는 긴 추론, 글쓰기, 리서치 종합, 검토 업무에 자동 라우팅할 수 있고 `/cc`, `/claude` 직접 호출도 허용한다.
- YOMI Office 런타임은 Codex CLI와 Claude Code CLI만 사용한다.
- 직원별 역할과 스킬에 맞는 업무만 배정한다.
- 중요한 일은 깊게 처리하되, 사소한 일에 전 직원이 동원되지 않게 한다.
- 결과와 재사용 가치가 있는 중간 산출물은 Vault에 markdown으로 자산화한다.
- 애매하거나 위험한 작업은 실행 전에 사용자에게 묻는다.

## 3. Current System Shape

현재 시스템은 다음 구조를 목표로 한다.

```text
Connect AI repository
  VS Code/Cursor extension
  YOMI Office local web app
  Codex CLI default engine
  Claude Code CLI reasoning/writing/review route
  Obsidian Vault markdown outputs
  role-based staff routing
  skill/tool permission scopes
  Exa/Firecrawl/Tavily research candidates
  Playwright browser verification
```

## 4. Current Phase

현재 단계는 **실사용 가능한 개인 사무실 안정화**다.

지금 해야 하는 것:

- Codex 기본 라우팅 안정화
- 직원별 역할 배정 정확도 개선
- 불필요한 전 직원 동원 방지
- Vault 자동 저장 기준 정교화
- 저장소/설정/직원 UI의 혼란 줄이기
- Exa/Firecrawl/Tavily 연결 상태와 실제 리서치 흐름 확인
- Playwright 기반 화면 검증
- 문서와 실제 구현 상태 동기화

지금 하지 않는 것:

- 외부 고객용 상품화 페이지 제작
- 무단 자동 Git push
- 무단 배포
- 무단 파일 삭제
- 무단 외부 전송
- 유료 API 확대 연결
- Codex/Claude 이외의 실행 엔진을 기본 챗봇으로 되돌리기

## 5. Priority Order

1. Security
2. Stability
3. Real usability
4. Assetization
5. Visual clarity
6. Productization

## 6. Security Rules

- `.env`, API key, token, cookie, session, password는 절대 출력/저장/커밋하지 않는다.
- 고객사명, 계정 ID, 개인정보가 로그나 문서에 과하게 남지 않게 한다.
- 자동 git push, force push, 파일 삭제, 외부 전송, 배포는 항상 위험 작업으로 본다.
- 위험 작업은 사용자 승인 전 진행하지 않는다.
- Vault와 소스코드 저장소를 섞지 않는다.
- 연결 JSON에는 실제 키 값을 넣지 않는다. 존재 여부와 연결 상태만 표시한다.

## 7. Assetization Target

다음 항목은 자산화 대상이다.

- 좋은 프롬프트
- 실패한 프롬프트와 원인
- 검수 기준
- 자동화 흐름
- 성공/실패 패턴
- 작업 로그
- 의사결정 기준
- 수익화 아이디어
- 반복 가능한 체크리스트
- 리서치 출처 묶음
- 데모/상품화에 쓸 수 있는 설명 구조

## 8. Human-In-The-Loop Rules

확실한 것은 자동 처리한다.

물어봐야 하는 것은 멈추고 사용자에게 질문한다.

무조건 질문해야 하는 조건:

- 파일 덮어쓰기
- 파일 삭제/이동
- Git write 작업
- 배포/릴리즈
- 외부 전송
- 비용 발생
- API 키/토큰/세션/인증 관련 판단
- 저장 위치가 애매한 자동 저장
- 파일명이 애매한 자동 저장
- 사용자의 지시가 모호한 상태에서 되돌리기 어려운 작업

## 9. Future MVP Direction

나중에 만들 외부 공개형 MVP는 단순 파일 목록이 아니라 사람들이 보고 "나도 이런 개인 AI 사무실을 만들고 싶다"고 느끼는 형태여야 한다.

가능한 방향:

- Markdown 기반 작업 로그 뷰어
- 프로젝트별 지식 그래프
- AI 에이전트 캐릭터형 작업 흐름
- 프롬프트/성과/검수 기준 대시보드
- 자동화 흐름 시각화
- 오늘의 작업, 누적 자산, 다음 액션 표시
- 직원별 역할과 산출물이 한눈에 보이는 운영 화면

## 10. Autonomous Safety Check

Codex는 아래 상황에서 별도의 확인 블록을 표시하지 않는다. 대신 자체 안전 점검을 한 번 더 수행하고, 사용자가 이미 요청한 범위 안에서 가장 안전하고 유용한 선택으로 진행한다.

자체 점검 기준:

- 최신 사용자 요청과 직접 관련 있는 작업인지 확인한다.
- 변경 전에는 가능한 한 읽기 전용 확인부터 한다.
- 파일 변경은 좁고 되돌리기 쉽게 유지한다.
- `.env`, 토큰, 쿠키, 세션, 비밀번호는 출력하거나 커밋하지 않는다.
- 삭제, force push, 배포, 외부 전송은 사용자가 명시한 범위를 벗어나면 실행하지 않는다.
- Git 쓰기/푸시는 사용자가 명시적으로 요청했을 때만 진행한다.
- 정말로 사용자 입력 없이는 진행할 수 없는 경우에만 짧게 한 가지 질문을 한다.

목표는 멈춤이 아니라 안전한 진행이다.
