# Zipath - 부동산 입문자를 위한 올인원 가이드

> "내 집으로 가는 길"

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 타겟 | 월세/전세/매매 첫 계약자 |
| 목표 | 부동산 초보자가 계약 전 필요한 모든 정보를 한 곳에서 확인 |
| 배포 | 프론트 Vercel / 백엔드 Render / DB Neon PostgreSQL |

---

## 2. 기술 스택

```
zipath/                          # Turborepo 모노레포
├── apps/
│   ├── web/                     # Next.js 14 (App Router) + TypeScript
│   └── api/                     # NestJS + TypeScript
├── packages/
│   ├── ui/                      # 공유 UI 컴포넌트 (shadcn/ui 기반)
│   ├── db/                      # TypeORM 엔티티 + DataSource
│   ├── types/                   # 공유 타입 정의
│   └── config/                  # 공유 설정 (ESLint, TSConfig)
├── turbo.json
├── package.json
└── .gitignore
```

---

## 3. 주요 기능 및 구현 계획

### Phase 1: MVP (핵심 기능)

#### 3-1. 청약 자격 시뮬레이션
- **설명**: 나이, 소득, 무주택 기간 등을 입력하면 청약 가능 여부 판별
- **프론트**: 스텝 폼 (React Hook Form + Zod 검증)
- **백엔드**: 청약 자격 판별 로직 API (`POST /api/subscription/simulate`)
- **DB 테이블**: `subscription_criteria` (청약 기준 데이터)

#### 3-2. 대출 한도 계산기
- **설명**: 연소득, 기존 대출, 주택 가격 기준으로 대출 가능 금액 산출
- **프론트**: 입력 폼 + 실시간 계산 결과 표시
- **백엔드**: 대출 계산 API (`POST /api/loan/calculate`)
- **계산 로직**: DSR(총부채원리금상환비율), LTV(주택담보대출비율) 기반

#### 3-3. 계약서 체크리스트
- **설명**: 월세/전세/매매 유형별 계약 시 확인사항 체크리스트
- **프론트**: 체크리스트 UI (진행률 표시, 로컬 저장)
- **백엔드**: 체크리스트 템플릿 API (`GET /api/checklist/:type`)
- **DB 테이블**: `checklist_template`, `checklist_item`

### Phase 2: 데이터 연동

#### 3-4. 실거래가 조회
- **설명**: 국토교통부 실거래가 공개시스템 API 연동
- **외부 API**: 국토교통부 실거래가 API
- **프론트**: 검색 + 지역별/기간별 필터 + 차트 시각화
- **백엔드**: 외부 API 프록시 + 캐싱 (`GET /api/real-price/search`)
- **DB 테이블**: `real_price_cache` (API 응답 캐시, 3개월 후 자동 삭제)

#### 3-5. 공공분양 공고 분석
- **설명**: 공공분양 공고를 파싱하여 주요 정보 요약 제공
- **외부 API**: 한국토지주택공사(LH), 청약홈 데이터
- **프론트**: 공고 목록 + 상세 보기 + 필터링
- **백엔드**: 공고 크롤링/파싱 + 저장 (`GET /api/announcements`)
- **DB 테이블**: `announcement` (마감 후 6개월 지나면 자동 삭제)

---

## 4. DB 스키마 (TypeORM)

### User (SSO 대비, 비회원 지원)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | PK, auto | |
| email | string, nullable, unique | 비회원은 null |
| nickname | string, nullable | |
| provider | string, nullable | google, kakao, naver (SSO) |
| providerId | string, nullable, unique | SSO provider의 유저 ID |
| lastActiveAt | timestamp | 1년 미접속 시 삭제 기준 |
| createdAt | timestamp | |
| updatedAt | timestamp | |

### SubscriptionCriteria (청약 기준)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | PK, auto | |
| type | string | 1순위, 2순위, 특별공급 |
| minAge | int, nullable | |
| maxIncome | int, nullable | 만원 단위 |
| minHomeless | int, nullable | 무주택 기간(월) |
| region | string, nullable | |
| description | text, nullable | |

### ChecklistTemplate + ChecklistItem
- 월세/전세/매매 유형별 체크리스트 템플릿
- 1:N 관계 (template → items)

### RealPriceCache
- regionCode + dealType + yearMonth 복합 유니크
- jsonb 타입으로 API 응답 저장
- 3개월 후 자동 삭제

### Announcement
- 공공분양 공고 데이터
- endDate 기준 마감 후 6개월 경과 시 자동 삭제

---

## 5. 데이터 정리 정책

Neon 무료 512MB 제한 대응, `CleanupService` 크론잡 (매주 일요일 03:00):

| 대상 | 기준 필드 | 삭제 조건 |
|------|----------|----------|
| 실거래가 캐시 | `fetchedAt` | 3개월 경과 |
| 공공분양 공고 | `endDate` | 마감 후 6개월 경과 |
| 유저 데이터 | `lastActiveAt` | 1년 미접속 |

---

## 6. API 엔드포인트 설계

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/subscription/simulate` | 청약 자격 시뮬레이션 |
| POST | `/api/loan/calculate` | 대출 한도 계산 |
| GET | `/api/checklist/:type` | 체크리스트 조회 (rent/jeonse/buy) |
| GET | `/api/real-price/search` | 실거래가 검색 |
| GET | `/api/announcements` | 공고 목록 조회 |
| GET | `/api/announcements/:id` | 공고 상세 조회 |

---

## 7. 배포 전략

| 서비스 | 플랫폼 | 비용 | 비고 |
|--------|--------|------|------|
| 프론트 (Next.js) | Vercel | 영구 무료 | GitHub push 시 자동 배포 |
| 백엔드 (NestJS) | Render | 영구 무료 | 15분 미사용 시 슬립 (콜드 스타트) |
| DB (PostgreSQL) | Neon | 영구 무료 | 512MB, 비활성 시 일시정지 |

---

## 8. 프론트엔드 페이지 구조

```
apps/web/app/
├── page.tsx                      # 랜딩 페이지
├── layout.tsx                    # 공통 레이아웃
├── subscription/
│   └── page.tsx                  # 청약 자격 시뮬레이션
├── loan/
│   └── page.tsx                  # 대출 한도 계산기
├── checklist/
│   ├── page.tsx                  # 유형 선택
│   └── [type]/page.tsx           # 체크리스트 상세
├── real-price/
│   └── page.tsx                  # 실거래가 조회
└── announcements/
    ├── page.tsx                  # 공고 목록
    └── [id]/page.tsx             # 공고 상세
```

---

## 9. 향후 확장 고려사항

- 사용자 인증 (SSO: Google, Kakao, Naver)
- 마이페이지 (저장한 체크리스트, 관심 공고)
- 알림 기능 (새 공고, 청약 일정)
- PWA 지원 (모바일 최적화)
- AI 기반 맞춤 추천 (Claude API 연동)
