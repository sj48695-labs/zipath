#!/usr/bin/env bash
# template: playwright-e2e v0.1
# Create issues from meeting candidates (B3-2).
#
# Input: JSON array via stdin
#   [{"id":"...","title":"...","description":"...","labels":[...],"attachments":[...],"approved":true}, ...]
# Env:
#   PROJECT_DIR (required) — repo working tree
#   PLATFORM    (required) — "github" or "gitlab"
# Output: JSON to stdout: {"ok":[iid…], "fail":[{"title":"...","error":"..."},...]}

set -euo pipefail

: "${PROJECT_DIR:?PROJECT_DIR required}"
: "${PLATFORM:?PLATFORM required (github|gitlab)}"

if [[ ! -d "$PROJECT_DIR" ]]; then
  printf '{"ok":[],"fail":[{"title":"(setup)","error":"PROJECT_DIR not found: %s"}]}\n' "$PROJECT_DIR"
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  printf '{"ok":[],"fail":[{"title":"(setup)","error":"jq not installed"}]}\n'
  exit 1
fi

cd "$PROJECT_DIR"

input="$(cat -)"
if [[ -z "$input" ]]; then
  echo '{"ok":[],"fail":[]}'
  exit 0
fi

count="$(printf '%s' "$input" | jq 'length')"
ok=()
fail_titles=()
fail_errors=()

json_escape() {
  printf '%s' "$1" | jq -Rs .
}

upload_glab_attachment() {
  # stdout = markdown link, stderr = error
  local file="$1"
  if [[ ! -f "$file" ]]; then
    echo "file not found: $file" >&2
    return 1
  fi
  local resp
  if ! resp="$(glab api "projects/:id/uploads" -F "file=@${file}" 2>/dev/null)"; then
    echo "glab upload failed" >&2
    return 1
  fi
  printf '%s' "$resp" | jq -r '.markdown // empty'
}

upload_gh_attachment() {
  # stdout = raw URL, stderr = error
  # Push to assets/screenshots branch (default branch 트리거 회피)
  local file="$1"
  if [[ ! -f "$file" ]]; then
    echo "file not found: $file" >&2
    return 1
  fi
  local repo
  repo="$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || true)"
  if [[ -z "$repo" ]]; then
    echo "gh repo not detected" >&2
    return 1
  fi
  local ts
  ts="$(date +%s)"
  local base
  base="$(basename "$file")"
  local rel="meeting-attachments/${ts}-${base}"
  local b64
  b64="$(base64 < "$file" | tr -d '\n')"
  local body
  body="$(jq -n --arg msg "chore: attach $base for meeting issue" --arg content "$b64" --arg branch "assets/screenshots" \
    '{message:$msg, content:$content, branch:$branch}')"

  # ensure branch exists (best effort: try once)
  gh api -X PUT "repos/${repo}/contents/${rel}" --input - <<<"$body" >/dev/null 2>&1 || {
    echo "gh contents PUT failed" >&2
    return 1
  }
  printf 'https://raw.githubusercontent.com/%s/assets/screenshots/%s' "$repo" "$rel"
}

create_glab_issue() {
  local title="$1" desc="$2" labels_csv="$3"
  local args=(issue create --title "$title" --description "$desc")
  [[ -n "$labels_csv" ]] && args+=(--label "$labels_csv")
  glab "${args[@]}" 2>&1 | grep -oE '/issues/[0-9]+' | head -1 | grep -oE '[0-9]+'
}

create_gh_issue() {
  local title="$1" body="$2" labels_csv="$3"
  local args=(issue create --title "$title" --body "$body")
  if [[ -n "$labels_csv" ]]; then
    IFS=',' read -ra LARR <<<"$labels_csv"
    for lbl in "${LARR[@]}"; do
      [[ -n "$lbl" ]] && args+=(--label "$lbl")
    done
  fi
  local url
  url="$(gh "${args[@]}" 2>&1 | tail -1)"
  basename "$url"
}

for i in $(seq 0 $((count - 1))); do
  title="$(printf '%s' "$input" | jq -r ".[$i].title // \"\"")"
  desc="$(printf '%s' "$input" | jq -r ".[$i].description // \"\"")"
  labels_csv="$(printf '%s' "$input" | jq -r ".[$i].labels // [] | join(\",\")")"
  attachments="$(printf '%s' "$input" | jq -r ".[$i].attachments // [] | .[]")"

  if [[ -z "$title" ]]; then
    fail_titles+=("(empty)")
    fail_errors+=("title 비어있음")
    continue
  fi

  attach_section=""
  if [[ -n "$attachments" ]]; then
    while IFS= read -r att; do
      [[ -z "$att" ]] && continue
      if [[ "$PLATFORM" == "gitlab" ]]; then
        if md="$(upload_glab_attachment "$att" 2>/dev/null)" && [[ -n "$md" ]]; then
          attach_section+="${md}"$'\n'
        fi
      else
        if raw="$(upload_gh_attachment "$att" 2>/dev/null)" && [[ -n "$raw" ]]; then
          attach_section+="![](${raw})"$'\n'
        fi
      fi
    done <<<"$attachments"
  fi

  full_desc="$desc"
  if [[ -n "$attach_section" ]]; then
    full_desc+=$'\n\n---\n'"$attach_section"
  fi

  iid=""
  err=""
  if [[ "$PLATFORM" == "gitlab" ]]; then
    if ! iid="$(create_glab_issue "$title" "$full_desc" "$labels_csv" 2>&1)"; then
      err="glab issue create 실패"
    fi
  else
    if ! iid="$(create_gh_issue "$title" "$full_desc" "$labels_csv" 2>&1)"; then
      err="gh issue create 실패"
    fi
  fi

  if [[ -n "$iid" && "$iid" =~ ^[0-9]+$ ]]; then
    ok+=("$iid")
  else
    fail_titles+=("$title")
    fail_errors+=("${err:-iid 파싱 실패: $iid}")
  fi
done

# Build JSON output
ok_json="[]"
if [[ ${#ok[@]} -gt 0 ]]; then
  ok_json="$(printf '%s\n' "${ok[@]}" | jq -R 'tonumber? // .' | jq -s .)"
fi

fail_json="[]"
if [[ ${#fail_titles[@]} -gt 0 ]]; then
  fail_json="[]"
  for idx in "${!fail_titles[@]}"; do
    fail_json="$(jq -n --argjson acc "$fail_json" --arg t "${fail_titles[$idx]}" --arg e "${fail_errors[$idx]}" \
      '$acc + [{title:$t, error:$e}]')"
  done
fi

jq -n --argjson ok "$ok_json" --argjson fail "$fail_json" '{ok:$ok, fail:$fail}'
