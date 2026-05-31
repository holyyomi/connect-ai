# PROJECT_INTENT.md

## 1. Project Purpose

이 프로젝트는 Connect AI를 기반으로 요미님이 실제로 쓰는 개인 AI 운영/지식/자동화 시스템을 만드는 프로젝트다.

핵심 목표는 판매가 아니라 실제 사용성이다. 반복 작업을 줄이고, 프롬프트/검수 기준/작업 로그/성과 패턴이 Vault 자산으로 쌓이게 만든다.

## 2. Current Product Direction

현재 중심은 **YOMI AI 개인 사무실**이다.

기본 방향:

- Codex CLI를 기본 엔진으로 사용한다.
- Claude Code CLI는 `/cc`, `/claude` 수동 호출 전용으로 둔다.
- Ollama/LM Studio는 현재 기본 경로에서 제거하거나 legacy fallback으로만 취급한다.
- 직원별 역할과 스킬에 맞는 업무만 배정한다.
- 중요한 일은 깊게 처리하되, 사소한 일에 전 직원이 동원되지 않게 한다.
- 결과와 재사용 가치가 있는 중간 산출물은 Vault에 markdown으로 자산화한다.
- 애매하거나 위험한 작업은 실행 전에 사용자에게 묻는다.

## 3. Current System Shape

현재 시스템은 다음 구조를 목표로 한다.

```text
Connect AI repository
  VS Code/Cursor extension
  YOMI AI personal office
  Codex CLI default engine
  Claude Code CLI manual-only route
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
- Ollama/LM Studio를 기본 챗봇으로 되돌리기

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

## 10. When To Ask GPT

Codex가 아래 상황을 만나면 작업을 멈추고 GPT 확인 요청을 표시한다.

- 보안, 인증, `.env`, 토큰, 쿠키, 세션 관련 판단이 필요할 때
- Git push, force push, 자동 sync, 파일 삭제, 배포가 관련될 때
- 같은 에러가 2번 이상 반복될 때
- 의존성 버전 변경, Node 버전 변경, 빌드 스크립트 변경이 필요할 때
- 프로젝트 방향이 상품화/UI/엔진/자산화 중 어디로 가야 할지 애매할 때
- 여러 파일을 크게 바꾸는 구조 변경이 필요할 때
- 사용자의 원래 목적과 작업이 어긋나는 것 같을 때

표시 형식:

```text
## GPT 확인 요청

- 멈춘 이유:
- 현재 상태:
- 위험 요소:
- 선택지:
- Codex의 추천:
- GPT에게 확인할 질문:
```
