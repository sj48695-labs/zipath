# Phase 1: 공공분양 공고 고도화

## Task 1.1: 공고 API 연동을 백엔드로 이전
- 현재 프론트에서 직접 호출하는 공공분양 API를 NestJS 백엔드로 이전
- AnnouncementService에 LH공사 API 호출 로직 구현
- 변경 파일: apps/api/src/announcement/announcement.service.ts, apps/api/src/announcement/announcement.controller.ts

## Task 1.2: 공고 데이터 DB 저장 + 캐싱
- TypeORM 엔티티로 공고 데이터 DB 저장
- fetchedAt 기반 캐싱 (3개월 정리 정책 적용)
- 변경 파일: packages/db/src/entities/announcement.entity.ts, apps/api/src/announcement/announcement.service.ts

## Task 1.3: 사용자 청약 자격-공고 자동 매칭
- 사용자 입력(나이, 소득, 무주택기간 등)과 공고 요구사항 비교 로직
- 매칭 결과 API 엔드포인트
- 변경 파일: apps/api/src/announcement/announcement.service.ts, apps/api/src/announcement/dto/

## Task 1.4: 공고 상세 페이지
- Next.js 공고 상세 페이지 구현
- 자격 매칭 결과 표시
- 변경 파일: apps/web/app/announcements/[id]/page.tsx

# Phase 2: SSO 인증

## Task 2.1: Google OAuth 로그인
- Passport.js + Google Strategy 설정
- JWT 토큰 발급
- 변경 파일: apps/api/src/auth/auth.module.ts, apps/api/src/auth/google.strategy.ts, apps/api/src/auth/auth.service.ts

## Task 2.2: Kakao 로그인
- Passport Kakao Strategy 설정
- 변경 파일: apps/api/src/auth/kakao.strategy.ts

## Task 2.3: Naver 로그인
- Passport Naver Strategy 설정
- 변경 파일: apps/api/src/auth/naver.strategy.ts

## Task 2.4: 유저 프로필 페이지
- Next.js 프로필 페이지 (로그인 정보, 관심 지역 설정)
- 변경 파일: apps/web/app/profile/page.tsx, apps/web/components/auth/

# Phase 3: 실거래가 시각화

## Task 3.1: 월별 가격 추이 차트
- Chart.js 또는 Recharts로 실거래가 시계열 차트
- 변경 파일: apps/web/app/real-price/components/PriceChart.tsx

## Task 3.2: 지역 간 비교 기능
- 복수 지역 선택 후 가격 비교 차트
- 변경 파일: apps/web/app/real-price/compare/page.tsx, apps/api/src/real-price/real-price.controller.ts

## Task 3.3: 평형별 필터링
- 전용면적 기준 필터링 기능
- 변경 파일: apps/api/src/real-price/real-price.service.ts, apps/web/app/real-price/components/AreaFilter.tsx

# Phase 4: 안정성 강화

## Task 4.1: API Rate Limiting
- NestJS Throttler 모듈 적용
- IP 기반 rate limit (분당 60회)
- 변경 파일: apps/api/src/app.module.ts, apps/api/src/common/guards/

## Task 4.2: 에러 핸들링 강화
- Global exception filter 개선
- API 응답 표준화 (success/error 포맷)
- 변경 파일: apps/api/src/common/filters/, apps/api/src/common/interceptors/

## Task 4.3: 테스트 코드 보강
- 주요 서비스 unit test 보강
- E2E 테스트 시나리오 추가
- 변경 파일: apps/api/test/

# Phase 5: 프리미엄 기능

## Task 5.1: 계약서 분석 기능
- 계약서 이미지 업로드 + OCR 분석
- 주요 조항 체크리스트 자동 검출
- 변경 파일: apps/api/src/contract-analysis/, apps/web/app/contract/

## Task 5.2: 맞춤 알림 기능
- 관심 지역 실거래가 변동 알림
- 청약 공고 알림
- 변경 파일: apps/api/src/notification/, apps/web/app/notifications/
