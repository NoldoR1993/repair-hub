#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-http://localhost:4000}"

if command -v python3 >/dev/null 2>&1; then
  PYTHON_BIN="python3"
elif command -v python >/dev/null 2>&1; then
  PYTHON_BIN="python"
else
  echo "Python interpreter not found. Install python3 or python." >&2
  exit 1
fi

api() {
  local method="$1"
  local path="$2"
  local body="${3:-}"
  local token="${4:-}"

  if [[ -n "$body" ]]; then
    curl -sS -X "$method" "$API_URL$path" \
      -H "Content-Type: application/json" \
      ${token:+-H "Authorization: Bearer $token"} \
      --data "$body"
  else
    curl -sS -X "$method" "$API_URL$path" \
      -H "Content-Type: application/json" \
      ${token:+-H "Authorization: Bearer $token"}
  fi
}

dispatcher_json="$(api POST /auth/login '{"username":"admin","password":"admin"}')"
master_json="$(api POST /auth/login '{"username":"worker1","password":"password"}')"

dispatcher_token="$("$PYTHON_BIN" -c "import json,sys; print(json.load(sys.stdin)['token'])" <<< "$dispatcher_json")"
master_token="$("$PYTHON_BIN" -c "import json,sys; print(json.load(sys.stdin)['token'])" <<< "$master_json")"

created_json="$(api POST /requests '{"clientName":"Race Test Client","phone":"+79990000000","address":"Test street 1","problemText":"Race test request"}')"
request_id="$("$PYTHON_BIN" -c "import json,sys; print(json.load(sys.stdin)['id'])" <<< "$created_json")"
request_version="$("$PYTHON_BIN" -c "import json,sys; print(json.load(sys.stdin)['version'])" <<< "$created_json")"

masters_json="$(api GET /users/masters '' "$dispatcher_token")"
worker_id="$("$PYTHON_BIN" -c "import json,sys; print(next(item['id'] for item in json.load(sys.stdin) if item['username'] == 'worker1'))" <<< "$masters_json")"

assigned_json="$(api PATCH "/requests/$request_id/assign" "{\"masterId\":\"$worker_id\",\"version\":$request_version}" "$dispatcher_token")"
assigned_version="$("$PYTHON_BIN" -c "import json,sys; print(json.load(sys.stdin)['version'])" <<< "$assigned_json")"

tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT

for i in 1 2 3; do
  {
    curl -sS -o "$tmp_dir/body_$i.json" -w "%{http_code}" \
      -X PATCH "$API_URL/requests/$request_id/take" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $master_token" \
      --data "{\"version\":$assigned_version}" > "$tmp_dir/status_$i.txt"
  } &
done

wait

"$PYTHON_BIN" - <<'PY' "$tmp_dir"
import json
import pathlib
import sys

tmp = pathlib.Path(sys.argv[1])
statuses = [int((tmp / f"status_{i}.txt").read_text().strip()) for i in range(1, 4)]
bodies = [json.loads((tmp / f"body_{i}.json").read_text()) for i in range(1, 4)]

success_count = sum(1 for status in statuses if status == 200)
conflict_count = sum(1 for status in statuses if status == 409)

print(json.dumps({
    "successCount": success_count,
    "conflictCount": conflict_count,
    "attempts": [{"status": status, "data": body} for status, body in zip(statuses, bodies)],
}, ensure_ascii=False, indent=2))

if success_count != 1 or conflict_count != 2:
    raise SystemExit(1)
PY
