# PROJECT_INTENT.md

## 1. Project Purpose

이 프로젝트는 Connect-AI를 기반으로 요미님이 AI를 더 잘 사용하기 위한 개인용 AI 운영/지식/자동화 기반 시스템을 만드는 프로젝트다.

초기 목표는 판매가 아니라 실제 사용성이다.
요미님이 직접 잘 쓰고, 반복 작업이 줄고, 프롬프트/검수기준/작업로그/성과패턴이 자산으로 쌓이는 구조를 먼저 만든다.

## 2. Long-Term Vision

최종적으로는 다음 구조를 목표로 한다.

Connect-AI fork
 요미님 GitHub 저장소
 AGENTS.md / HANDOFF / 검증 루프
 VS Code 또는 Antigravity 확장 설치
 localBrainPath와 YOMI_ASSET_LIBRARY 연결
 작업 기록과 지식 자산 축적
 웹 뷰어 / 대시보드 / 시각화 MVP
 검증 후 상품화 가능성 검토

## 3. Current Phase

현재 단계는 엔진 안정화와 안전 기준선 구축이다.

지금 해야 하는 것:
- 로컬 빌드 가능 상태 만들기
- 확장 설치 가능 상태 만들기
- 위험 기능 파악
- AGENTS.md 기준으로 Codex 작업 통제
- localBrainPath 연결 준비
- 작업 기록 구조 준비

지금 하지 않는 것:
- 수익화 기능 주입
- 웹 대시보드 개발
- 고객사 데이터 연결
- 자동 git sync 활성화
- 외부 배포
- 상품화 페이지 제작

## 4. Priority Order

1. Security
2. Stability
3. Real usability
4. Assetization
5. Visual impact
6. Productization

## 5. Security Rules

- .env, API Key, token, cookie, session, password는 절대 출력/저장/커밋하지 않는다.
- 고객사명, 계정ID, 개인정보가 로그나 문서에 과하게 남지 않게 한다.
- 자동 git push, force push, 파일 삭제, 외부 전송, 배포는 항상 위험 작업으로 본다.
- 위험 작업은 사용자 승인 전 진행하지 않는다.
- YOMI_ASSET_LIBRARY와 소스코드 저장소를 섞지 않는다.

## 6. Assetization Target

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
- 데모/상품화에 쓸 수 있는 설명 구조

## 7. Future MVP Direction

나중에 만들 웹 MVP는 단순 파일 목록이 아니라, 사람들이 보고 나도 이런 시스템 만들고 싶다고 느낄 수 있는 형태여야 한다.

가능한 방향:
- Markdown 기반 작업 로그 뷰어
- 프로젝트별 지식 그래프
- AI 에이전트 캐릭터형 작업 흐름
- 프롬프트/성과/검수 기준 대시보드
- 자동화 흐름 시각화
- 오늘의 작업, 누적 자산, 다음 액션 표시

## 8. When to Ask GPT

Codex가 아래 상황을 만나면 작업을 멈추고 GPT 확인 요청을 표시한다.

- 보안, 인증, .env, 토큰, 쿠키, 세션 관련 판단이 필요할 때
- Git push, force push, 자동 sync, 파일 삭제, 배포가 관련될 때
- 같은 에러가 2번 이상 반복될 때
- 의존성 버전 변경, Node 버전 변경, 빌드 스크립트 변경이 필요할 때
- 프로젝트 방향이 상품화/UI/엔진/자산화 중 어디로 가야 할지 애매할 때
- 여러 파일을 크게 바꾸는 구조 변경이 필요할 때
- 사용자의 원래 목적과 작업이 어긋나는 것 같을 때

표시 형식:
## GPT 확인 요청

- 멈춘 이유:
- 현재 상태:
- 위험 요소:
- 선택지:
- Codex의 추천:
- GPT에게 확인할 질문:
