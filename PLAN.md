# Zipath - 부동산 입문자를 위한 올인원 가이드

> "내 집으로 가는 길"

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 타겟 | 월세/전세/매매 첫 계약자 |
| 목표 | 부동산 초보자가 계약 전 필요한 모든 정보를 한 곳에서 확인 |
| 배포 | 프론트 Vercel / 백엔드 Railway |

---

## 2. 기술 스택

```
zipath/                          # Turborepo 모노레포
├── apps/
│   ├── web/                     # Next.js 14 (App Router) + TypeScript
│   └── api/                     # NestJS + TypeScript
├── packages/
│   ├── ui/                      # 공유 UI 컴포넌트 (shadcn/ui 기반)
│   ├── db/                      # Prisma 스키마 + 클라이언트
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
- **DB 테이블**: `checklist_templates`, `checklist_items`

### Phase 2: 데이터 연동

#### 3-4. 실거래가 조회
- **설명**: 국토교통부 실거래가 공개시스템 API 연동
- **외부 API**: 국토교통부 실거래가 API
- **프론트**: 검색 + 지역별/기간별 필터 + 차트 시각화
- **백엔드**: 외부 API 프록시 + 캐싱 (`GET /api/real-price/search`)
- **DB 테이블**: `real_price_cache` (API 응답 캐시)

#### 3-5. 공공분양 공고 분석
- **설명**: 공공분양 공고를 파싱하여 주요 정보 요약 제공
- **외부 API**: 한국토지주택공사(LH), 청약홈 데이터
- **프론트**: 공고 목록 + 상세 보기 + 필터링
- **백엔드**: 공고 크롤링/파싱 + 저장 (`GET /api/announcements`)
- **DB 테이블**: `announcements`, `announcement_details`

---

## 4. DB 스키마 (Prisma)

```prisma
// 청약 기준
model SubscriptionCriteria {
  id          Int      @id @default(autoincrement())
  type        String   // 1순위, 2순위, 특별공급 등
  minAge      Int?
  maxIncome   Int?     // 만원 단위
  minHomeless Int?     // 무주택 기간(월)
  region      String?
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// 체크리스트 템플릿
model ChecklistTemplate {
  id    Int              @id @default(autoincrement())
  type  String           // rent, jeonse, buy
  title String
  items ChecklistItem[]
}

model ChecklistItem {
  id         Int               @id @default(autoincrement())
  templateId Int
  template   ChecklistTemplate @relation(fields: [templateId], references: [id])
  order      Int
  content    String
  category   String?           // 서류, 현장확인, 계약조건 등
  isRequired Boolean           @default(true)
}

// 실거래가 캐시
model RealPriceCache {
  id        Int      @id @default(autoincrement())
  regionCode String
  dealType   String  // 매매, 전세, 월세
  yearMonth  String
  data       Json
  fetchedAt  DateTime @default(now())

  @@unique([regionCode, dealType, yearMonth])
}

// 공공분양 공고
model Announcement {
  id            Int      @id @default(autoincrement())
  title         String
  organization  String   // LH, SH 등
  region        String
  supplyType    String   // 공공분양, 국민임대 등
  startDate     DateTime
  endDate       DateTime
  detailUrl     String?
  summary       String?
  rawData       Json?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

---

## 5. API 엔드포인트 설계

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/subscription/simulate` | 청약 자격 시뮬레이션 |
| POST | `/api/loan/calculate` | 대출 한도 계산 |
| GET | `/api/checklist/:type` | 체크리스트 조회 (rent/jeonse/buy) |
| GET | `/api/real-price/search` | 실거래가 검색 |
| GET | `/api/announcements` | 공고 목록 조회 |
| GET | `/api/announcements/:id` | 공고 상세 조회 |

---

## 6. 프론트엔드 페이지 구조

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

## 7. 이번 세션 구현 범위

빈 리포지토리이므로 **프로젝트 초기 세팅**에 집중:

1. **Turborepo 모노레포 구조** 생성
2. **Next.js 웹 앱** 기본 세팅 (App Router, Tailwind, shadcn/ui)
3. **NestJS API 앱** 기본 세팅
4. **Prisma 스키마** 정의 (위 DB 설계 반영)
5. **공유 패키지** 구성 (types, ui, config)
6. **랜딩 페이지** 기본 UI

---

## 8. 향후 확장 고려사항

- 사용자 인증 (NextAuth.js)
- 마이페이지 (저장한 체크리스트, 관심 공고)
- 알림 기능 (새 공고, 청약 일정)
- PWA 지원 (모바일 최적화)
- AI 기반 맞춤 추천 (Claude API 연동)
