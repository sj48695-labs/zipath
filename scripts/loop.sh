#!/usr/bin/env bash
set -uo pipefail

# =============================================================================
# DevLoop loop.sh - GitHub 버전
# 이슈를 자동으로 처리하는 무한 루프
# =============================================================================

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEVLOOP_FILE="$REPO_ROOT/.devloop"
SCRIPTS_DIR="$REPO_ROOT/scripts"
LOG_FILE="$SCRIPTS_DIR/dev-loop.log"
STOP_FILE="$SCRIPTS_DIR/.stop"
MAIN_BRANCH="main"

# 색상
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { echo -e "${BLUE}[$(date +%H:%M:%S)]${NC} $1" | tee -a "$LOG_FILE"; }
ok()    { echo -e "${GREEN}[$(date +%H:%M:%S)]${NC} $1" | tee -a "$LOG_FILE"; }
warn()  { echo -e "${YELLOW}[$(date +%H:%M:%S)]${NC} $1" | tee -a "$LOG_FILE"; }
err()   { echo -e "${RED}[$(date +%H:%M:%S)]${NC} $1" | tee -a "$LOG_FILE"; }
header(){ echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}" | tee -a "$LOG_FILE"; }

# .devloop 로드
load_devloop() {
  if [[ ! -f "$DEVLOOP_FILE" ]]; then
    err ".devloop 파일이 없습니다. ./scripts/setup.sh를 먼저 실행하세요."
    exit 1
  fi
  source "$DEVLOOP_FILE"
}

REPO=""

# SIGINT 핸들링 (Ctrl+C)
INTERRUPT_COUNT=0
trap_handler() {
  ((INTERRUPT_COUNT++))
  if [[ $INTERRUPT_COUNT -ge 2 ]]; then
    err "즉시 종료"
    exit 1
  fi
  warn "Ctrl+C 감지. 현재 작업 완료 후 종료합니다. (한 번 더 누르면 즉시 종료)"
  touch "$STOP_FILE"
}
trap trap_handler SIGINT

# 안전 종료 체크
should_stop() {
  [[ -f "$STOP_FILE" ]]
}

cleanup_stop() {
  rm -f "$STOP_FILE"
}

# =============================================================================
# 이슈 가져오기 (우선순위: error > urgent > bug > task > phase)
# =============================================================================
get_next_issue() {
  local labels=("error" "urgent" "bug" "task" "phase")

  for label in "${labels[@]}"; do
    local issue
    issue=$(gh issue list --repo "$REPO" \
      --state open \
      --label "$label" \
      --json number,title,labels,body \
      --jq 'sort_by(.number) | .[0] // empty' 2>/dev/null)

    if [[ -n "$issue" ]]; then
      echo "$issue"
      return 0
    fi
  done

  return 1
}

# =============================================================================
# Phase 이슈 처리 → Task 이슈들 생성
# =============================================================================
handle_phase_issue() {
  local issue_num="$1"
  local issue_title="$2"
  local issue_body="$3"

  info "Phase 이슈 처리: #$issue_num $issue_title"
  info "Claude에게 Task 분할을 요청합니다..."

  unset CLAUDECODE 2>/dev/null || true

  local tasks_output
  tasks_output=$(claude --print --verbose \
    "다음 Phase 이슈를 구체적인 Task 이슈들로 분할해줘.

Phase: $issue_title
내용:
$issue_body

프로젝트 CLAUDE.md:
$(cat "$REPO_ROOT/CLAUDE.md" 2>/dev/null || echo '없음')

현재 프로젝트 구조:
$(find "$REPO_ROOT/apps" "$REPO_ROOT/packages" -name '*.ts' -o -name '*.tsx' 2>/dev/null | sort | head -60)

응답 형식 (JSON 배열만 출력, 다른 텍스트 없이):
[
  {\"title\": \"Task 제목\", \"body\": \"상세 설명\\n- 변경 파일\\n- 구현 내용\"},
  ...
]
" 2>/dev/null) || {
    err "Claude Task 분할 실패"
    return 1
  }

  # JSON 배열 추출
  local json_array
  json_array=$(echo "$tasks_output" | grep -o '\[.*\]' | head -1)

  if [[ -z "$json_array" ]] || ! echo "$json_array" | jq empty 2>/dev/null; then
    err "Claude 응답에서 유효한 JSON을 추출할 수 없습니다."
    err "응답: $(echo "$tasks_output" | head -5)"
    return 1
  fi

  local task_count
  task_count=$(echo "$json_array" | jq length)
  info "${task_count}개 Task 이슈 생성 중..."

  for i in $(seq 0 $((task_count - 1))); do
    local title body
    title=$(echo "$json_array" | jq -r ".[$i].title")
    body=$(echo "$json_array" | jq -r ".[$i].body")

    gh issue create --repo "$REPO" \
      --title "[Task] $title" \
      --label "task" \
      --body "$body" 2>/dev/null && {
      ok "  Task 생성: $title"
    } || {
      warn "  Task 생성 실패: $title"
    }
  done

  # Phase 이슈 닫기
  gh issue close "$issue_num" --repo "$REPO" \
    --comment "Phase를 ${task_count}개 Task로 분할했습니다." 2>/dev/null
  ok "Phase #$issue_num 닫기 완료"
}

# =============================================================================
# Task/Bug/Error 이슈 처리 → Claude 구현
# =============================================================================
handle_work_issue() {
  local issue_num="$1"
  local issue_title="$2"
  local issue_body="$3"

  info "작업 이슈 처리: #$issue_num $issue_title"

  # 브랜치 생성
  local branch="devloop/issue-${issue_num}"
  git -C "$REPO_ROOT" checkout "$MAIN_BRANCH" 2>/dev/null
  git -C "$REPO_ROOT" pull origin "$MAIN_BRANCH" 2>/dev/null || true
  git -C "$REPO_ROOT" checkout -b "$branch" 2>/dev/null || git -C "$REPO_ROOT" checkout "$branch" 2>/dev/null

  info "브랜치: $branch"
  info "Claude에게 구현을 요청합니다..."

  unset CLAUDECODE 2>/dev/null || true

  # Claude 실행 및 result 이벤트 확인
  local claude_success=false
  local claude_output

  claude_output=$(claude --print --verbose \
    "GitHub 이슈 #$issue_num 를 구현해줘.

제목: $issue_title
내용:
$issue_body

프로젝트 루트: $REPO_ROOT

CLAUDE.md:
$(cat "$REPO_ROOT/CLAUDE.md" 2>/dev/null || echo '없음')

규칙:
1. 코드를 직접 수정해줘 (파일 생성/편집)
2. TypeScript strict mode, any 금지
3. NestJS: 모듈/컨트롤러/서비스 패턴
4. 변경 후 빌드가 되는지 확인해줘 (npx turbo build)
5. 완료되면 'IMPLEMENTATION_COMPLETE' 를 출력해줘
" 2>/dev/null) || true

  if echo "$claude_output" | grep -q "IMPLEMENTATION_COMPLETE"; then
    claude_success=true
  fi

  if [[ "$claude_success" != "true" ]]; then
    err "Claude 구현 실패 또는 미완료. 이슈를 닫지 않습니다."
    warn "30초 후 재시도합니다..."
    git -C "$REPO_ROOT" checkout "$MAIN_BRANCH" 2>/dev/null
    sleep 30
    return 1
  fi

  # 변경사항 확인
  local changes
  changes=$(git -C "$REPO_ROOT" status --porcelain 2>/dev/null)

  if [[ -z "$changes" ]]; then
    warn "변경사항이 없습니다. 이슈를 닫지 않습니다."
    git -C "$REPO_ROOT" checkout "$MAIN_BRANCH" 2>/dev/null
    return 1
  fi

  # 커밋 & 푸시
  info "변경사항 커밋 중..."
  git -C "$REPO_ROOT" add -A
  git -C "$REPO_ROOT" commit -m "feat: resolve #$issue_num - $issue_title

Implemented by DevLoop auto-development system."

  # 푸시 (재시도 포함)
  local push_success=false
  for retry in 1 2 3 4; do
    if git -C "$REPO_ROOT" push -u origin "$branch" 2>/dev/null; then
      push_success=true
      break
    fi
    local wait_time=$((2 ** retry))
    warn "Push 실패, ${wait_time}초 후 재시도 ($retry/4)..."
    sleep "$wait_time"
  done

  if [[ "$push_success" != "true" ]]; then
    err "Push 실패. 이슈를 닫지 않습니다."
    return 1
  fi

  ok "Push 완료: $branch"

  # 빌드 확인 (로컬)
  info "빌드 확인 중..."
  local build_output
  build_output=$(cd "$REPO_ROOT" && npx turbo build 2>&1) || true

  if echo "$build_output" | grep -q "ERROR\|Failed"; then
    err "빌드 실패! error 이슈를 생성합니다."
    create_error_issue "빌드 실패: #$issue_num $issue_title" \
      "브랜치 \`$branch\` 에서 빌드가 실패했습니다.\n\n\`\`\`\n$(echo "$build_output" | tail -30)\n\`\`\`"
    echo "$build_output" >> "$LOG_FILE"
    git -C "$REPO_ROOT" checkout "$MAIN_BRANCH" 2>/dev/null
    return 1
  fi

  echo "$build_output" >> "$LOG_FILE"
  ok "빌드 성공"

  # PR 생성 (직접 머지 대신)
  info "Pull Request 생성 중..."
  local pr_url
  pr_url=$(gh pr create --repo "$REPO" \
    --base "$MAIN_BRANCH" \
    --head "$branch" \
    --title "feat: resolve #$issue_num - $issue_title" \
    --body "## Summary
이슈 #$issue_num 자동 구현

## Changes
$issue_title

## DevLoop
- 브랜치: \`$branch\`
- 커밋: \`$(git -C "$REPO_ROOT" log -1 --format='%h %s')\`
- 빌드: 통과

Closes #$issue_num" 2>&1) || true

  if [[ -n "$pr_url" ]] && echo "$pr_url" | grep -q "http"; then
    ok "PR 생성 완료: $pr_url"

    # 자동 머지 시도 (--auto는 branch protection 있을 때, --merge는 직접 머지)
    if gh pr merge "$pr_url" --repo "$REPO" --merge --delete-branch 2>/dev/null; then
      ok "PR 자동 머지 완료"
      # 로컬 main 업데이트
      git -C "$REPO_ROOT" checkout "$MAIN_BRANCH" 2>/dev/null
      git -C "$REPO_ROOT" pull origin "$MAIN_BRANCH" 2>/dev/null || true
    else
      info "PR 자동 머지 불가 — 수동 리뷰 후 머지해주세요: $pr_url"
      git -C "$REPO_ROOT" checkout "$MAIN_BRANCH" 2>/dev/null
    fi
  else
    warn "PR 생성 실패 — 직접 머지를 시도합니다."
    # PR 생성 실패 시 fallback: 직접 머지
    git -C "$REPO_ROOT" checkout "$MAIN_BRANCH" 2>/dev/null
    git -C "$REPO_ROOT" merge "$branch" --no-edit 2>/dev/null

    for retry in 1 2 3 4; do
      if git -C "$REPO_ROOT" push origin "$MAIN_BRANCH" 2>/dev/null; then
        break
      fi
      sleep $((2 ** retry))
    done

    # 이슈 닫기 (PR이 없으니 수동으로)
    gh issue close "$issue_num" --repo "$REPO" \
      --comment "DevLoop에 의해 자동 구현 완료.
브랜치: \`$branch\`
커밋: \`$(git -C "$REPO_ROOT" log -1 --format='%h %s')\`" 2>/dev/null
  fi

  ok "이슈 #$issue_num 처리 완료! ✓"

  # 로컬 브랜치 정리
  git -C "$REPO_ROOT" checkout "$MAIN_BRANCH" 2>/dev/null
  git -C "$REPO_ROOT" branch -d "$branch" 2>/dev/null || true
}

# =============================================================================
# Error 이슈 생성
# =============================================================================
create_error_issue() {
  local title="$1"
  local body="$2"

  gh issue create --repo "$REPO" \
    --title "[Error] $title" \
    --label "error" \
    --body "$body" 2>/dev/null || {
    err "Error 이슈 생성 실패: $title"
  }
}

# =============================================================================
# 메인 루프
# =============================================================================
main() {
  echo ""
  header
  echo -e "${CYAN}  DevLoop - 자동 개발 루프 (GitHub Edition)${NC}"
  header
  echo ""

  load_devloop
  REPO="${GITHUB_REPO:-}"

  if [[ -z "$REPO" ]]; then
    err "GITHUB_REPO가 설정되지 않았습니다. ./scripts/setup.sh를 먼저 실행하세요."
    exit 1
  fi

  info "리포: $REPO"
  info "종료: touch scripts/.stop 또는 Ctrl+C"
  echo ""

  cleanup_stop

  while true; do
    # 종료 체크
    if should_stop; then
      ok "종료 플래그 감지. 안전하게 종료합니다."
      cleanup_stop
      break
    fi

    header

    # 다음 이슈 가져오기
    local issue_json
    if ! issue_json=$(get_next_issue); then
      info "처리할 이슈가 없습니다. 60초 후 다시 확인합니다..."
      sleep 60
      continue
    fi

    local issue_num issue_title issue_body issue_labels
    issue_num=$(echo "$issue_json" | jq -r '.number')
    issue_title=$(echo "$issue_json" | jq -r '.title')
    issue_body=$(echo "$issue_json" | jq -r '.body // ""')
    issue_labels=$(echo "$issue_json" | jq -r '[.labels[].name] | join(",")')

    info "다음 이슈: #$issue_num [$issue_labels] $issue_title"

    # Phase 이슈인 경우 Task 분할
    if echo "$issue_labels" | grep -q "phase"; then
      handle_phase_issue "$issue_num" "$issue_title" "$issue_body"
    else
      # Task/Bug/Error 이슈 → Claude 구현
      handle_work_issue "$issue_num" "$issue_title" "$issue_body" || true
    fi

    # 종료 체크
    if should_stop; then
      ok "종료 플래그 감지. 안전하게 종료합니다."
      cleanup_stop
      break
    fi

    info "5초 대기 후 다음 이슈 처리..."
    sleep 5
  done

  echo ""
  ok "DevLoop 종료"
}

main "$@"
