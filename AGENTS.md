# Agents Guide

프로젝트 컨텍스트는 [CLAUDE.md](./CLAUDE.md)를 참조하세요.

## 작업 원칙

- CLAUDE.md의 기술 스택과 코딩 규칙을 반드시 따를 것
- ORM은 TypeORM 사용 (Prisma 사용 금지)
- DB는 PostgreSQL 사용
- `any` 타입 사용 금지, `unknown` 사용
- 모노레포 구조 유지 (apps/, packages/)

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
