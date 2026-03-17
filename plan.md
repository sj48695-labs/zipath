# Zipath 개발 계획

## 프로젝트
- **이름**: Zipath (Zip + Path)
- **목표**: 부동산 입문자를 위한 올인원 가이드 서비스
- **기술스택**: Turborepo + Next.js + NestJS + TypeORM + PostgreSQL

## 현재 완료된 기능
- [x] 모노레포 세팅 (Turborepo)
- [x] Next.js 프론트 + NestJS 백엔드
- [x] TypeORM + PostgreSQL 연동
- [x] 청약 자격 시뮬레이션
- [x] 실거래가 조회 + DB 캐싱
- [x] 대출 한도 계산기
- [x] 계약서 체크리스트
- [x] 부동산 용어 사전
- [x] 공공분양 공고 목록
- [x] 데이터 정리 크론잡 (CleanupService)

## 남은 기능 (Phase별)

### Phase 1: 공공분양 공고 고도화
- 공고 API 연동을 백엔드로 이전 + DB 저장
- 사용자 청약 자격과 공고 요구사항 자동 매칭
- 공고 상세 페이지

### Phase 2: SSO 인증
- Google OAuth 로그인
- Kakao 로그인
- Naver 로그인
- 유저 프로필 페이지

### Phase 3: 실거래가 시각화
- 월별 가격 추이 차트
- 지역 간 비교 기능
- 평형별 필터링

### Phase 4: 안정성 강화
- API rate limiting
- 에러 핸들링 강화
- 테스트 코드 작성 (unit + e2e)

### Phase 5: 프리미엄 기능
- 계약서 분석 (건당 990원~)
- 맞춤 알림 (관심 지역 실거래가, 청약 공고)
