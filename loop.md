# DevLoop - 자동 개발 루프 시스템 (GitHub Edition)

GitHub 이슈 기반으로 Claude Code가 자동으로 코드를 구현하는 시스템.

## 전체 흐름

```
plan.md 작성 → setup.sh → plan_by_claude.md 생성 → setup.sh → 라벨/이슈 생성 → loop.sh (무한 루프)
```

## Quick Start

```bash
# Stage 1~4 순차 실행 (plan.md가 이미 있으면 Stage 2부터)
./scripts/setup.sh

# 개발 루프 시작
./scripts/loop.sh
```

## setup.sh 단계

| Stage | 조건 | 동작 |
|-------|------|------|
| 1 | `plan.md` 없음 | 작성 가이드 출력 |
| 2 | `plan_by_claude.md` 없음 | Claude로 개발 계획 생성 |
| 3 | `.devloop`에 `REPO_CONFIGURED=true` 없음 | GitHub 라벨 생성 + 설정 |
| 4 | `.devloop`에 `ISSUES_CREATED=true` 없음 | Phase 이슈 생성 |

## loop.sh 이슈 우선순위

| 우선순위 | 라벨 | 용도 | 생성 주체 |
|---------|------|------|-----------|
| P0 | `error` | 빌드 실패 등 시스템 에러 | loop.sh 자동 |
| P1 | `urgent` | 긴급 작업 (핫픽스) | 수동 |
| P2 | `bug` | 버그 수정 | 수동 |
| P3 | `task` | 일반 구현 작업 | loop.sh (Phase 처리 시) |
| P4 | `phase` | Phase 분할 (Task 생성용) | setup.sh |

## 수동 이슈 추가

```bash
# 긴급 핫픽스 (task보다 먼저 처리됨)
gh issue create -R sj48695-labs/zipath --title "로그인 버튼 안 눌림" --label "urgent"

# 버그
gh issue create -R sj48695-labs/zipath --title "실거래가 조회 에러" --label "bug"

# 일반 작업
gh issue create -R sj48695-labs/zipath --title "[Task] 다크모드" --label "task"
```

## 종료

```bash
touch scripts/.stop    # 현재 작업 완료 후 안전 종료
# 또는 Ctrl+C (1번: 안전 종료, 2번: 즉시 종료)
```

## 파일 구조

```
zipath/
├── scripts/
│   ├── setup.sh          # 프로젝트 초기 설정
│   ├── loop.sh           # 무한 개발 루프
│   ├── dev-loop.log      # 실행 로그 (gitignored)
│   └── .stop             # 종료 플래그 (gitignored)
├── plan.md               # 개발 계획
├── plan_by_claude.md     # Claude가 구체화한 계획
├── loop.md               # 이 문서
└── .devloop              # 설정 파일 (gitignored)
```
