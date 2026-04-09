# Zipath - 부동산 입문자를 위한 올인원 가이드

## 프로젝트 개요

- **이름**: Zipath (Zip + Path = "내 집으로 가는 길")
- **슬로건**: "부동산, 처음이라도 괜찮아"
- **목표**: 부동산 입문자를 위한 올인원 가이드 서비스

## 타겟 사용자

- 월세/전세/매매 첫 계약을 앞둔 사람
- 부동산 용어 자체가 낯선 사람 (갑구, 을구, 근저당 모름)
- 전세사기 이후 월세로 전환하는 2030세대
- "전문가한테 물어보기 창피한" 사람

## 핵심 기능 (우선순위 순)

1. **청약 자격 시뮬레이션** → 공공API 활용, 내가 청약 가능한지 체크
2. **공공분양 공고 분석** → 공고 보여주면 지원 가능 여부 자동 판단
3. **실거래가 조회** → 국토부 공공API
4. **대출 한도 계산기** → 금감원 금융상품API
5. **계약서 체크리스트** → 월세/전세/매매 계약 전 확인 항목
6. **부동산 용어 설명** → 갑구/을구/근저당 등 쉬운 설명

## 활용 공공API (전부 무료)

- 청약홈 공공API → 청약 정보
- LH공사 공공API → 공공분양
- 국토부 공공API → 실거래가
- 금융감독원 금융상품API → 대출 비교
- 대법원API → 등기부등본 (유료, 저렴)

## 법적 고지

- "참고용이며 법적 효력 없음" 고지 필수
- 직접 법률 해석 X, 정보 제공만

## 기술 스택

- **모노레포**: Turborepo
- **프론트**: Next.js + TypeScript
- **백엔드**: NestJS + TypeScript
- **ORM**: TypeORM (NestJS 공식 지원)
- **DB**: Neon PostgreSQL (영구 무료, 512MB)
- **프론트 배포**: Vercel (영구 무료)
- **백엔드 배포**: Render (영구 무료, 콜드 스타트 있음)
- **파일 스토리지 (향후)**: Cloudflare R2 (10GB 무료, 전송 비용 없음)
- **향후 앱**: Expo (React Native)

## 레포 구조

```
zipath/ (모노레포)
├── apps/
│   ├── web/              ← Next.js 프론트
│   └── api/              ← NestJS 백엔드
└── packages/
    ├── db/               ← TypeORM 엔티티 + DataSource
    ├── ui/               ← 공통 컴포넌트
    ├── types/            ← 공통 타입
    └── config/           ← 공통 설정
```

## 프로젝트 설정 (글로벌 스킬 참조용)

- **메인 브랜치**: `develop`
- **테스트 명령어**: `npm test -w @zipath/api`
- **E2E 테스트**: `npm run test:e2e -w @zipath/api`
- **린트**: `npx turbo lint`
- **빌드**: `npx turbo build`
- **VCS**: GitHub (`gh`)
- **커밋 형식**: `<type>(<scope>): <subject>` (한글)

## 코딩 규칙

- TypeScript strict mode
- `any` 사용 금지 → `unknown` 사용
- 객체는 `interface`, 나머지는 `type` 사용
- NestJS: 데코레이터 기반, 모듈/컨트롤러/서비스 패턴

## MVP 개발 순서

1. Turborepo 모노레포 세팅
2. Next.js 프론트 세팅
3. NestJS 백엔드 세팅
4. TypeORM + PostgreSQL 연동
5. 공통 타입 패키지 세팅
6. 공공API 연동 (청약홈부터)
7. 청약 자격 시뮬레이션 구현
8. 실거래가 조회 구현

## 데이터 정리 정책 (512MB 제한 대응)

| 대상 | 기준 필드 | 삭제 조건 |
|------|----------|----------|
| 실거래가 캐시 | `fetchedAt` | 3개월 경과 |
| 공공분양 공고 | `endDate` | 마감 후 6개월 경과 |
| 유저 데이터 | `lastActiveAt` | 1년 미접속 |

- 매주 일요일 새벽 3시 크론잡 자동 실행 (`CleanupService`)
- 비회원도 시뮬레이션 사용 가능 (User 테이블 email nullable)
- SSO 대비: `provider` + `providerId` 필드 (Google, Kakao, Naver)

## 수익화 계획

- 기본 기능 무료
- 계약서 분석 등 프리미엄 기능 유료 (건당 990원~)
- 광고 수익

## 개발 워크플로우

### 브랜치 전략

```
main          ← 프로덕션 (직접 push 금지, develop에서만 PR)
develop       ← 기본 브랜치 (PR 기본 타겟, 직접 push 금지)
feat/*        ← 새 기능
fix/*         ← 버그 수정
chore/*       ← 빌드/설정/의존성
docs/*        ← 문서만 변경
refactor/*    ← 기능 변경 없는 리팩토링
```

PR 흐름: `feat/*` → **`develop`** → `main` (릴리즈)

> **기본 브랜치는 `develop`입니다.** 모든 피처/픽스 브랜치는 `develop`을 타겟으로 PR을 생성하세요.

### 커밋 컨벤션 (Conventional Commits)

```
<type>(<scope>): <subject>

type: feat | fix | chore | docs | refactor | test | style
scope: web | api | db | ui | types | config (선택)
subject: 현재형, 소문자, 마침표 없음
```

예시:
- `feat(api): 청약 자격 시뮬레이션 API 구현`
- `fix(web): 실거래가 조회 오류 수정`
- `chore: turbo 캐시 설정 추가`

### 로컬 개발 명령어

```bash
# 전체 개발 서버 시작
npm run dev

# 린트 (전체)
npx turbo lint

# 빌드 (전체)
npx turbo build

# 백엔드 유닛 테스트
npm test -w @zipath/api

# 백엔드 E2E 테스트 (로컬 DB 필요)
npm run test:e2e -w @zipath/api

# DB 컨테이너 시작
npm run db:up
```

### PR 규칙

- PR 기본 타겟: **`develop`** (feature/fix 브랜치 → develop)
- 제목: 커밋 컨벤션 형식 사용
- CI (lint + build + test) 통과 필수
- `auto-merge` 라벨이 **있으면**: CI 통과 시 자동 squash merge
- `auto-merge` 라벨이 **없으면**: CI만 실행, 머지는 수동 (리뷰 대기)
- 라벨을 붙이거나 떼서 자동 머지를 중간에 제어 가능

### AI 워크플로우 (글로벌 스킬)

```
/prep <이슈> → /plan → /code → /commit-mr → /reply
```

| 스킬 | 설명 |
|------|------|
| `/prep <이슈번호>` | 브랜치 생성 + Draft PR + worktree 전환 |
| `/plan` | Phase별 구현 계획 작성 → `plans/`에 저장 |
| `/code` | Phase 순회 구현 (TDD + /simplify + 자동 커밋 분리) |
| `/commit-mr` | fixup/rebase 정리 + push + PR 마무리 |
| `/reply` | PR에 플랜 댓글 게시 + 플랜 파일 정리 |
| `/daily-report` | 일일 업무 리포트 |

### CI/CD 파이프라인

```
이슈 → /prep → /plan → /code → /commit-mr → PR(→ develop) → CI → [auto-merge 라벨?] → 머지
                                                                          ↓ 없으면
                                                                     리뷰 대기 (수동 머지)
```

| 단계 | 트리거 | 내용 |
|------|--------|------|
| CI | PR to develop/main, push to develop | lint → build → unit test → E2E test |
| Auto Merge | CI 통과 + `auto-merge` 라벨 | squash merge into develop |
| Deploy Web | push to main (Vercel) | Vercel 자동 배포 |
| Deploy API | push to main (Render) | Render 자동 배포 |
