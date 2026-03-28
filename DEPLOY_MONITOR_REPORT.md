# Zipath 배포 모니터링 리포트

**실행 일시**: 2026-03-29 03:19 KST
**실행 횟수**: 16차

---

## GitHub Actions CI 상태

| 항목 | 내용 |
|------|------|
| 최신 run | #16 (`724806c`) |
| 상태 | ❌ Failure |
| 실패 단계 | Unit tests (exit code 1) |
| 총 소요 시간 | 2m 40s |
| 브랜치 | develop |

### 이전 run 히스토리 요약
- Run #1 ~ #16 **전부 실패** (Unit tests 단계)
- Lint ✅, Build ✅, Unit tests ❌

---

## 에러 원인 분석

**원인**: `jest.config.ts`의 `maxWorkers: 2` 설정이 CI 환경(GitHub Actions ubuntu-latest, 제한된 메모리)에서 OOM(Out of Memory) / SIGKILL을 유발.

**근거**: 로컬 환경에서 `maxWorkers: 2`로 실행 시 77초 소요, `--runInBand`(단일 프로세스)로 실행 시 13~25초로 단축되고 메모리 사용량 대폭 감소. 테스트 자체(8 suites, 83 tests)는 로컬에서 전부 통과.

---

## 자동 수정 내용

### 수정 파일
`apps/api/jest.config.ts`

### 변경 내용
```diff
-  maxWorkers: 2,
+  runInBand: true,
```

### 커밋
```
60f7baf fix(api): jest runInBand으로 변경해 CI OOM 수정
```

### ⚠️ Push 필요
VM 환경에서 GitHub 인증 불가로 자동 push 실패. 아래 명령어로 수동 push 필요:

```bash
cd /Users/sujeong/personal/github/sj48695-labs/zipath
git push origin develop
```

---

## Vercel 배포 상태

- ⚠️ Vercel 대시보드 로그인 필요 → 자동 확인 불가
- CI가 계속 실패했으므로 `main` 브랜치 배포는 미트리거 상태일 가능성 높음
- push 후 CI 통과 시 Render 배포도 자동 트리거됨

---

## 권장 조치

1. `git push origin develop` 실행 → Run #17 CI 트리거
2. CI 통과 여부 확인 (예상 소요: ~2분)
3. PR → main 머지 → Vercel/Render 배포 확인
