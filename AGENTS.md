# Agents Guide

프로젝트 컨텍스트는 [CLAUDE.md](./CLAUDE.md)를 참조하세요.

## 작업 원칙

- CLAUDE.md의 기술 스택과 코딩 규칙을 반드시 따를 것
- ORM은 TypeORM 사용 (Prisma 사용 금지)
- DB는 PostgreSQL 사용
- `any` 타입 사용 금지, `unknown` 사용
- 모노레포 구조 유지 (apps/, packages/)
- UI 이슈는 아래 디자인 스킬 절을 따른다

## 디자인 스킬

`/prep` `/plan` `/code` `/fast-track` / DevLoop에서 UI가 걸리면 디자인 스킬을 쓴다. 호출을 기다리지 않는다.

- **있으면 `ui-design`, 없으면 공식 `frontend-design`.** 둘 다 없으면 기존 디자인을 유지하고, 필요할 때만 새 디자인을 추천한다.
- 경로 (있는 것 중 첫 번째): `~/.agents/skills/ui-design/SKILL.md` → `~/.agent-skills/ui-design/SKILL.md` → 설치된 공식 `frontend-design`
- `ui-design`이 있으면 그 파일의 `codex-explicit-only`보다 이 절이 우선한다.
- **기본은 match mode**: 기존 `apps/web` 토큰·컴포넌트·헤더·톤을 따른다. 새 비주얼 아이덴티티는 그린필드이거나 이슈가 새 룩을 명시할 때만 (`references/new-design.md`).
- **브리프**: Zipath는 부동산 입문자용 가이드. 슬로건 "부동산, 처음이라도 괜찮아". 카피는 쉬운 말, 법적 고지, 다음 행동. 구현 용어를 UI에 올리지 않는다.
- **UI가 있는 이슈** (신규 화면, 레이아웃, 카피, 상태 UI, `apps/web` 변경): 스킬 워크플로를 따른다. 한 문장으로 사용자·할 일·전환 행동을 적고, 기존 디자인 시스템을 확인한 뒤 구현한다. 라이브면 Playwright로 본 흐름 + empty/loading/error를 검증하고, 데스크톱과 390px을 본다. 발견은 P0/P1/P2/Skip으로 나눈다. 감사·이슈 초안만이면 제품 코드를 수정하지 않는다.
- **UI가 없는 이슈** (API·DB·CI만): 스킬을 찾았으면 읽었다고 한 줄 남기고 시각 작업은 하지 않는다.
- **이슈 초안**: 증상 하나로 이슈를 쪼개지 않는다. 열린 이슈를 검색하고 같은 원인을 합친다. 본문은 User/business impact, Evidence, Expected behavior, Scope, Acceptance criteria, Verification, Skills used.

## 모듈 구조 (NestJS)

각 기능은 NestJS 모듈 패턴을 따름:
- `*.module.ts` - 모듈 정의
- `*.controller.ts` - API 엔드포인트
- `*.service.ts` - 비즈니스 로직
- `*.entity.ts` - TypeORM 엔티티 (필요 시)

## 공공API 연동 시 주의

- 모든 공공API는 `DATA_GO_KR_API_KEY` 환경변수 사용
- API 응답은 가능하면 캐싱 (DB 또는 인메모리)
- 에러 시 적절한 HTTP 상태 코드 반환 (502 for upstream errors)

## 서브에이전트 모델 라우팅

| 작업 | 모델 | 에이전트 |
|------|------|----------|
| 설계/아키텍처 | Opus | senior-clean-architect |
| 구현 (TDD) | Sonnet | tdd |
| 코드 탐색/분석 | Sonnet | Explore |
| 리뷰/검토 | Sonnet | codex:rescue (선택) |
| 단순 조회/댓글 | Haiku | — |

## 커밋/푸시 규칙

- **자동 커밋 금지** → `/code` 스킬 내 자동 커밋만 허용
- 수동 작업 시 반드시 "커밋해도 될까요?" 확인 후 진행
- 커밋 메시지: `<type>(<scope>): #이슈번호 한글 메시지`
