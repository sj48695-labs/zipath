# Zipath 배포 모니터링 리포트

**실행 일시**: 2026-03-29 09:03 KST
**실행 횟수**: 17차 (자동 스케줄)

---

## 요약

| 항목 | 상태 |
|------|------|
| GitHub Actions CI | ✅ 정상 (최근 5회 연속 성공) |
| 최신 CI Run | #19 — 성공 (3m 15s) |
| develop 브랜치 | ✅ 최신 상태 (clean) |
| 자동 수정 | 없음 (에러 없음) |

---

## GitHub Actions CI 상태

| 항목 | 내용 |
|------|------|
| 최신 run | #19 (`6b4a973`) |
| 상태 | ✅ Success |
| 소요 시간 | 3m 15s |
| 브랜치 | develop |

### 최근 5회 실행 히스토리

| Run | 커밋 메시지 | 결과 | 소요 |
|-----|------------|------|------|
| #19 | fix(api): jest config를 JS로 변환 + --runInBand CLI 플래그 추가 | ✅ | 3m 15s |
| #18 | fix(api): runInBand → maxWorkers: 1로 수정 (CI OOM 해결) | ✅ | 2m 50s |
| #17 | fix(api): jest runInBand으로 변경해 CI OOM 수정 | ✅ | 2m 45s |
| #16 | fix(api): jest maxWorkers=2로 병렬 실행 OOM SIGKILL 수정 | ✅ | 2m 40s |
| #15 | fix(api): class-validator, class-transformer 의존성 추가 | ✅ | 2m 44s |

---

## 코드 상태

- develop 브랜치: `origin/develop`과 동기화 완료
- working tree: clean (uncommitted changes 없음)
- jest config: `jest.config.js` (JS 변환 완료), `maxWorkers: 1` 적용 — CI OOM 이슈 해결됨

---

## Vercel / Render 배포 상태

- CI Run #19 성공 → Vercel 및 Render 배포 자동 트리거 정상
- ⚠️ Vercel/Render 직접 API 접근 불가 (네트워크 제한) — CI 상태로 간접 확인

---

## 자동 수정 내역

**없음** — 현재 에러 없음, 수정 불필요.

---

## 비고

이전 이슈였던 **Jest OOM(Out of Memory) / SIGKILL** 문제는 다음과 같이 해결됨:
- `jest.config.ts` → `jest.config.js` 변환
- `maxWorkers: 1` 적용 + CLI `--runInBand` 플래그 병행

Run #17 이후 CI 100% 성공률 유지 중.
