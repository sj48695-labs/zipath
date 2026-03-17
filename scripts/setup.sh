#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# DevLoop setup.sh - GitHub 버전
# 반복 실행하면 단계별로 진행됩니다.
# =============================================================================

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEVLOOP_FILE="$REPO_ROOT/.devloop"
SCRIPTS_DIR="$REPO_ROOT/scripts"

# 색상
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info()  { echo -e "${BLUE}[INFO]${NC} $1"; }
ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()   { echo -e "${RED}[ERROR]${NC} $1"; }

# GitHub 리포 (gh가 로컬 remote 인식 못할 경우를 위해)
get_repo() {
  if [[ -f "$DEVLOOP_FILE" ]] && grep -q "GITHUB_REPO=" "$DEVLOOP_FILE"; then
    grep "GITHUB_REPO=" "$DEVLOOP_FILE" | cut -d= -f2
  else
    # gh api로 현재 유저 확인 후, remote URL에서 추출 시도
    local remote_url
    remote_url=$(git -C "$REPO_ROOT" remote get-url origin 2>/dev/null || echo "")
    if echo "$remote_url" | grep -q "github.com"; then
      echo "$remote_url" | sed -E 's|.*github\.com[:/](.+)(\.git)?$|\1|' | sed 's/\.git$//'
    else
      echo ""
    fi
  fi
}

# .devloop 읽기
load_devloop() {
  if [[ -f "$DEVLOOP_FILE" ]]; then
    source "$DEVLOOP_FILE"
  fi
}

# .devloop에 값 쓰기
set_devloop() {
  local key="$1" value="$2"
  if [[ -f "$DEVLOOP_FILE" ]] && grep -q "^${key}=" "$DEVLOOP_FILE"; then
    sed -i "s|^${key}=.*|${key}=${value}|" "$DEVLOOP_FILE"
  else
    echo "${key}=${value}" >> "$DEVLOOP_FILE"
  fi
}

# =============================================================================
# 사전 요구사항 체크
# =============================================================================
check_prerequisites() {
  local missing=0

  for cmd in gh git jq curl claude; do
    if ! command -v "$cmd" &>/dev/null; then
      err "$cmd 가 설치되어 있지 않습니다."
      missing=1
    fi
  done

  if [[ $missing -eq 1 ]]; then
    exit 1
  fi

  # gh 인증 확인
  if ! gh auth status &>/dev/null; then
    err "gh auth login 을 먼저 실행해주세요."
    exit 1
  fi

  ok "사전 요구사항 충족"
}

# =============================================================================
# Stage 1: plan.md 확인
# =============================================================================
stage_plan() {
  if [[ ! -f "$REPO_ROOT/plan.md" ]]; then
    warn "plan.md가 없습니다."
    echo ""
    echo "프로젝트 루트에 plan.md를 작성해주세요."
    echo "포함할 내용:"
    echo "  - 프로젝트 목표"
    echo "  - 핵심 기능 목록"
    echo "  - 기술 스택"
    echo "  - 개발 Phase (단계별 작업)"
    echo ""
    echo "작성 후 다시 ./scripts/setup.sh 를 실행하세요."
    exit 0
  fi
  ok "plan.md 확인 완료"
}

# =============================================================================
# Stage 2: plan_by_claude.md 생성
# =============================================================================
stage_plan_by_claude() {
  if [[ -f "$REPO_ROOT/plan_by_claude.md" ]]; then
    ok "plan_by_claude.md 이미 존재"
    return
  fi

  info "Claude에게 개발 계획 구체화를 요청합니다..."

  unset CLAUDECODE 2>/dev/null || true

  claude --print --verbose \
    "다음 plan.md를 읽고 구체적인 개발 계획(plan_by_claude.md)을 작성해줘.
각 Phase를 세분화된 Task로 나누고, 각 Task에 예상 파일 변경사항을 포함해줘.
기존에 구현된 기능은 제외하고, 아직 안 된 것만 계획해줘.

$(cat "$REPO_ROOT/plan.md")

CLAUDE.md 내용:
$(cat "$REPO_ROOT/CLAUDE.md" 2>/dev/null || echo '없음')

현재 프로젝트 구조:
$(find "$REPO_ROOT/apps" "$REPO_ROOT/packages" -name "*.ts" -o -name "*.tsx" | head -50)

plan_by_claude.md 형식:
# Phase N: 제목
## Task N.1: 세부 작업
- 설명
- 변경 파일: file1, file2
## Task N.2: ...
" > "$REPO_ROOT/plan_by_claude.md" 2>/dev/null || {
    err "Claude 실행 실패"
    rm -f "$REPO_ROOT/plan_by_claude.md"
    exit 1
  }

  if [[ ! -s "$REPO_ROOT/plan_by_claude.md" ]]; then
    err "plan_by_claude.md가 비어있습니다. Claude 실행을 확인해주세요."
    rm -f "$REPO_ROOT/plan_by_claude.md"
    exit 1
  fi

  ok "plan_by_claude.md 생성 완료"
  echo "내용을 검토한 후 다시 ./scripts/setup.sh 를 실행하세요."
}

# =============================================================================
# Stage 3: GitHub 리포 설정 + .devloop 생성
# =============================================================================
stage_setup_repo() {
  load_devloop

  if [[ "${REPO_CONFIGURED:-}" == "true" ]]; then
    ok "리포 설정 완료 상태"
    return
  fi

  info "GitHub 리포 설정 중..."

  # GitHub 리포 확인/설정
  local repo
  repo=$(get_repo)

  if [[ -z "$repo" ]]; then
    echo ""
    read -rp "GitHub 리포 (owner/repo 형식): " repo
  fi

  # 리포 존재 확인
  if ! gh repo view "$repo" --json nameWithOwner &>/dev/null; then
    err "리포 $repo 에 접근할 수 없습니다."
    exit 1
  fi

  ok "GitHub 리포: $repo"
  set_devloop "GITHUB_REPO" "$repo"

  # 라벨 생성
  info "이슈 라벨 생성 중..."
  local -A labels=(
    ["error"]="d73a4a"
    ["urgent"]="e4e669"
    ["bug"]="d73a4a"
    ["task"]="0075ca"
    ["phase"]="5319e7"
  )

  for label in "${!labels[@]}"; do
    gh label create "$label" --repo "$repo" --color "${labels[$label]}" --force 2>/dev/null || true
  done
  ok "라벨 생성 완료 (error, urgent, bug, task, phase)"

  set_devloop "REPO_CONFIGURED" "true"

  # .gitignore에 .devloop 추가
  if ! grep -q ".devloop" "$REPO_ROOT/.gitignore" 2>/dev/null; then
    echo ".devloop" >> "$REPO_ROOT/.gitignore"
    ok ".devloop을 .gitignore에 추가"
  fi

  ok "리포 설정 완료"
}

# =============================================================================
# Stage 4: Phase 이슈 생성
# =============================================================================
stage_create_issues() {
  load_devloop

  if [[ "${ISSUES_CREATED:-}" == "true" ]]; then
    ok "이슈 이미 생성됨"
    return
  fi

  local repo="${GITHUB_REPO:-}"
  if [[ -z "$repo" ]]; then
    err "GITHUB_REPO가 설정되지 않았습니다. setup.sh를 다시 실행하세요."
    exit 1
  fi

  if [[ ! -f "$REPO_ROOT/plan_by_claude.md" ]]; then
    err "plan_by_claude.md가 없습니다."
    exit 1
  fi

  info "plan_by_claude.md에서 Phase 이슈를 생성합니다..."

  # Phase 제목 추출 및 이슈 생성
  local phase_count=0
  while IFS= read -r line; do
    if [[ "$line" =~ ^#[[:space:]]+Phase ]]; then
      local title="${line#\# }"
      local body=""

      # Phase 내용 수집 (다음 Phase 시작 전까지)
      body=$(sed -n "/^${line//\//\\/}$/,/^# Phase/p" "$REPO_ROOT/plan_by_claude.md" | head -n -1 | tail -n +2)

      if [[ -z "$body" ]]; then
        body="$title 구현"
      fi

      info "이슈 생성: $title"
      gh issue create --repo "$repo" \
        --title "[Phase] $title" \
        --label "phase" \
        --body "$body" 2>/dev/null || {
        warn "이슈 생성 실패: $title"
      }
      ((phase_count++))
    fi
  done < "$REPO_ROOT/plan_by_claude.md"

  if [[ $phase_count -eq 0 ]]; then
    warn "Phase를 찾지 못했습니다. plan_by_claude.md 형식을 확인해주세요."
    warn "'# Phase N: 제목' 형식이어야 합니다."
    exit 1
  fi

  set_devloop "ISSUES_CREATED" "true"
  ok "${phase_count}개 Phase 이슈 생성 완료"
  echo ""
  echo "이제 ./scripts/loop.sh 를 실행하세요!"
}

# =============================================================================
# 메인
# =============================================================================
main() {
  echo "========================================"
  echo "  DevLoop Setup (GitHub Edition)"
  echo "========================================"
  echo ""

  check_prerequisites

  # Stage 1
  stage_plan

  # Stage 2
  stage_plan_by_claude

  # Stage 3
  stage_setup_repo

  # Stage 4
  stage_create_issues

  echo ""
  ok "모든 설정 완료!"
  echo "다음 명령어로 개발 루프를 시작하세요:"
  echo "  ./scripts/loop.sh"
}

main "$@"
