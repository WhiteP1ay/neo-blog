#!/usr/bin/env bash
# Cursor Agent `stop` hook：限频后按端口结束 Next dev → 删除 .next → 后台 pnpm dev
# 文档：https://cursor.com/docs/hooks
#
# 环境变量：
#   CURSOR_NEXT_DEV_PORT              端口，默认 3000
#   CURSOR_NEXT_RESTART_MIN_SECONDS   最短间隔秒数，默认 180
#   CURSOR_NEXT_RESTART_ALWAYS=1      即使端口无监听也删 .next 并启动 dev
#   CURSOR_NEXT_SKIP_RM=1             不删除 .next（仅逃生）

set -uo pipefail

# Hook 协议：消费 stdin JSON；stdout 必须输出合法 JSON
cat >/dev/null

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

PORT="${CURSOR_NEXT_DEV_PORT:-3000}"
MIN_SECONDS="${CURSOR_NEXT_RESTART_MIN_SECONDS:-180}"
STATE_FILE="$REPO_ROOT/.cursor/.last-next-restart-at"
LOG_FILE="$REPO_ROOT/.cursor/next-dev-restart.log"

mkdir -p "$REPO_ROOT/.cursor"

NOW="$(date +%s)"

if [[ -f "$STATE_FILE" ]]; then
  LAST="$(tr -d '[:space:]' <"$STATE_FILE" || true)"
  if [[ "$LAST" =~ ^[0-9]+$ ]] && ((NOW - LAST < MIN_SECONDS)); then
    printf '%s\n' '{}'
    exit 0
  fi
fi

collect_listen_pids() {
  lsof -nP -iTCP:"$PORT" -sTCP:LISTEN -t 2>/dev/null | sort -u
}

PIDS="$(collect_listen_pids | tr '\n' ' ')"
HAS_LISTENER=false
if [[ -n "${PIDS// }" ]]; then
  HAS_LISTENER=true
fi

if [[ "$HAS_LISTENER" != true ]] && [[ "${CURSOR_NEXT_RESTART_ALWAYS:-0}" != "1" ]]; then
  printf '%s\n' '{}'
  exit 0
fi

if [[ "$HAS_LISTENER" == true ]]; then
  while read -r pid; do
    [[ -n "$pid" ]] || continue
    kill -TERM "$pid" 2>/dev/null || true
  done < <(collect_listen_pids)
  sleep 2
  while read -r pid; do
    [[ -n "$pid" ]] || continue
    kill -KILL "$pid" 2>/dev/null || true
  done < <(collect_listen_pids)
  sleep 1
fi

if [[ "${CURSOR_NEXT_SKIP_RM:-0}" != "1" ]]; then
  rm -rf "$REPO_ROOT/.next"
fi

echo "----- restart $(date) -----" >>"$LOG_FILE"
(cd "$REPO_ROOT" && nohup pnpm dev >>"$LOG_FILE" 2>&1 &)

printf '%s\n' "$NOW" >"$STATE_FILE"
printf '%s\n' '{}'
exit 0
