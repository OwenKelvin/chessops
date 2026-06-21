#!/usr/bin/env bash
set -euo pipefail

# API smoke test: register, login, tournament, players, pairings, results, standings, admins.
# Usage: bash apps/api/e2e/smoke-test.sh [BASE_URL]
# Requires: curl, jq

BASE="${1:-http://localhost:8082/api}"
STAMP=$(date +%s)
EMAIL="smoke_owner_${STAMP}@example.com"
OTHER_EMAIL="smoke_other_${STAMP}@example.com"
JQ=$(command -v jq)

if [ -z "$JQ" ]; then
  echo "jq is required but not installed"
  exit 1
fi

OK="\033[32m✓\033[0m"
FAIL="\033[31m✗\033[0m"

check() {
  local label="$1"; shift
  local resp code body
  resp=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$@")
  code=$(echo "$resp" | tail -1 | sed 's/HTTP_CODE://')
  body=$(echo "$resp" | sed '$d')
  if [ "$code" -lt 400 ]; then
    echo -e "$OK $label ($code)"
  else
    echo -e "$FAIL $label ($code)"
    echo "  $(echo "$body" | head -c 200)"
    return 1
  fi
}

expect() {
  local label="$1" expected="$2"; shift 2
  local resp code body
  resp=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$@")
  code=$(echo "$resp" | tail -1 | sed 's/HTTP_CODE://')
  body=$(echo "$resp" | sed '$d')
  if [ "$code" -eq "$expected" ]; then
    echo -e "$OK $label ($code)"
  else
    echo -e "$FAIL $label expected $expected got $code"
    echo "  $(echo "$body" | head -c 200)"
    return 1
  fi
}

json_get() {
  local url="$1"
  shift
  curl -s "$url" "$@" | "$JQ" -c '. // empty'
}

echo "=== Register owner ($EMAIL) ==="
OWNER=$(curl -s -X POST "$BASE/auth/register" -H "Content-Type: application/json" -d "{\"email\":\"$EMAIL\",\"password\":\"Password123!\",\"displayName\":\"Smoke Owner\"}")
TOKEN=$(echo "$OWNER" | "$JQ" -r '.accessToken // empty')
[ -n "$TOKEN" ] || { echo "Failed to register: $OWNER"; exit 1; }
AUTH="Authorization: Bearer $TOKEN"

check "GET /auth/me" "$BASE/auth/me" -H "$AUTH"

echo "=== Create tournament ==="
TOUR_PAYLOAD='{"name":"Smoke Swiss","description":"Smoke test","location":"Nairobi","country":"KE","countryName":"Kenya","startDate":"2026-07-01","endDate":"2026-07-05","format":"swiss","maxRounds":3,"timeControl":"90+30","maxPlayers":8,"isPublic":true,"registrationOpen":true}'
TOUR=$(curl -s -X POST "$BASE/tournaments" -H "$AUTH" -H "Content-Type: application/json" -d "$TOUR_PAYLOAD")
TOUR_ID=$(echo "$TOUR" | "$JQ" -r '.id')
TOUR_SLUG=$(echo "$TOUR" | "$JQ" -r '.slug')
check "POST /tournaments" "$BASE/tournaments" -H "$AUTH" -H "Content-Type: application/json" -d "$TOUR_PAYLOAD"

echo "=== Create 4 players ==="
PIDS=""
for i in 1 2 3 4; do
  P=$(curl -s -X POST "$BASE/players" -H "$AUTH" -H "Content-Type: application/json" -d "{\"firstName\":\"Player\",\"lastName\":\"$i\",\"email\":\"player${i}_${STAMP}@smoke.com\",\"rating\":$((2000 + i * 50)),\"country\":\"KE\",\"gender\":\"M\"}")
  PID=$(echo "$P" | "$JQ" -r '.id // empty')
  [ -n "$PID" ] && PIDS="$PIDS $PID"
  check "POST /players #$i" "$BASE/players" -H "$AUTH" -H "Content-Type: application/json" -d "{\"firstName\":\"Player\",\"lastName\":\"$i\",\"email\":\"player${i}_${STAMP}@smoke.com\",\"rating\":$((2000 + i * 50)),\"country\":\"KE\",\"gender\":\"M\"}"
done

echo "=== Add players to tournament ==="
for pid in $PIDS; do
  check "POST /tournaments/$TOUR_ID/players" "$BASE/tournaments/$TOUR_ID/players" -H "$AUTH" -H "Content-Type: application/json" -d "{\"playerId\":\"$pid\"}"
done

echo "=== Generate Swiss pairings (auto-creates round 1) ==="
check "POST /tournaments/$TOUR_ID/pairings/generate/swiss" "$BASE/tournaments/$TOUR_ID/pairings/generate/swiss" -H "$AUTH" -H "Content-Type: application/json" -d '{"roundNumber":1}'
PAIRS=$(json_get "$BASE/tournaments/$TOUR_ID" -H "$AUTH")
PAIRING_ID=$(echo "$PAIRS" | "$JQ" -r '.rounds[0].pairings[0].id // empty')
[ -n "$PAIRING_ID" ] || { echo -e "$FAIL No pairings generated"; exit 1; }

echo "=== Submit all round 1 results ==="
ROUND_ID=$(echo "$PAIRS" | "$JQ" -r '.rounds[0].id')
for pairing in $(echo "$PAIRS" | "$JQ" -r '.rounds[0].pairings[] | @base64'); do
  PID=$(echo "$pairing" | base64 -d | "$JQ" -r '.id')
  check "POST /tournaments/$TOUR_ID/results" "$BASE/tournaments/$TOUR_ID/results" -H "$AUTH" -H "Content-Type: application/json" -d "{\"pairingId\":\"$PID\",\"result\":\"1-0\"}"
done

echo "=== Verify standings updated ==="
STANDINGS=$(json_get "$BASE/tournaments/$TOUR_ID/standings")
TOP_POINTS=$(echo "$STANDINGS" | "$JQ" -r '.standings[0].points // 0')
if [ "${TOP_POINTS%.*}" -ge 1 ]; then
  echo -e "$OK Standings updated (top points: $TOP_POINTS)"
else
  echo -e "$FAIL Standings not updated (top points: $TOP_POINTS)"
  exit 1
fi

echo "=== Test slug-based lookups ==="
check "GET /tournaments/$TOUR_SLUG" "$BASE/tournaments/$TOUR_SLUG"
check "GET /tournaments/$TOUR_SLUG/standings" "$BASE/tournaments/$TOUR_SLUG/standings"

echo "=== Assign admin and test unauthorized access ==="
ADMIN_PID=$(echo "$PIDS" | awk '{print $2}')
check "POST /tournaments/$TOUR_ID/admins" "$BASE/tournaments/$TOUR_ID/admins" -H "$AUTH" -H "Content-Type: application/json" -d "{\"playerId\":\"$ADMIN_PID\"}"

OTHER=$(curl -s -X POST "$BASE/auth/register" -H "Content-Type: application/json" -d "{\"email\":\"$OTHER_EMAIL\",\"password\":\"Password123!\",\"displayName\":\"Smoke Other\"}")
OTHER_TOKEN=$(echo "$OTHER" | "$JQ" -r '.accessToken // empty')
if [ -n "$OTHER_TOKEN" ]; then
  expect "Unauthorized admin POST" 403 "$BASE/tournaments/$TOUR_ID/admins" -H "Authorization: Bearer $OTHER_TOKEN" -H "Content-Type: application/json" -d "{\"playerId\":\"$ADMIN_PID\"}"
else
  echo -e "$FAIL Could not register other user"
  exit 1
fi

echo "=== Public tournament list ==="
check "GET /tournaments" "$BASE/tournaments"

echo ""
echo "=== Smoke test passed ==="
echo "Tournament ID:   $TOUR_ID"
echo "Tournament slug: $TOUR_SLUG"
echo "Players: $PIDS"
