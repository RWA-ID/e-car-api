#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# e-car.eth — OEM Quickstart
# ─────────────────────────────────────────────────────────────────────────────
# Runs the full OEM happy path end-to-end against any e-car.eth API instance:
#
#   1. health check
#   2. brand namespace lookup (tesla / ford / your brand)
#   3. preauthorize a batch of VINs   → returns merkleRoot
#   4. fetch the Merkle proof for one VIN
#   5. fetch a paginated list of proofs
#   6. generate bulk-transfer calldata
#   7. read a live vehicle from chain
#   8. read its battery passport
#   9. list charging stations
#
# Each step prints the response and aborts on error so OEM integration teams
# can spot a regression immediately.
#
# Usage:
#   API_BASE=http://localhost:3001 \
#   API_KEY=test-api-key \
#   BRAND=tesla \
#   OEM_WALLET=0x1111111111111111111111111111111111111111 \
#   BUYER_WALLET=0x2222222222222222222222222222222222222222 \
#   ./scripts/oem-quickstart.sh
#
# Defaults below match a local dev server with the test API key.
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

API_BASE="${API_BASE:-http://localhost:3001}"
API_KEY="${API_KEY:-test-api-key}"
BRAND="${BRAND:-tesla}"
OEM_WALLET="${OEM_WALLET:-0x1111111111111111111111111111111111111111}"
BUYER_WALLET="${BUYER_WALLET:-0x2222222222222222222222222222222222222222}"
VEHICLE_ID="${VEHICLE_ID:-1}"

# Colors
BOLD='\033[1m'; GREEN='\033[32m'; CYAN='\033[36m'; RED='\033[31m'; DIM='\033[2m'; RESET='\033[0m'

step() { echo -e "\n${BOLD}${CYAN}▶ $1${RESET}"; }
ok()   { echo -e "${GREEN}  ✓ $1${RESET}"; }
fail() { echo -e "${RED}  ✗ $1${RESET}"; exit 1; }
note() { echo -e "${DIM}  $1${RESET}"; }

# Requires: curl + jq
command -v jq >/dev/null || fail "jq is required — brew install jq"

echo -e "${BOLD}e-car.eth OEM Quickstart${RESET}"
note "API_BASE   : $API_BASE"
note "API_KEY    : ${API_KEY:0:12}…"
note "BRAND      : $BRAND"
note "OEM_WALLET : $OEM_WALLET"
note "BUYER      : $BUYER_WALLET"

# ─── 1. Health check ─────────────────────────────────────────────────────────
step "1/9 · GET /health"
HEALTH=$(curl -fsS "$API_BASE/health") || fail "API unreachable at $API_BASE"
echo "$HEALTH" | jq '{status, service, version}'
ok "API up"

# ─── 2. Brand namespace lookup ───────────────────────────────────────────────
step "2/9 · GET /api/v1/brands/$BRAND"
BRAND_RES=$(curl -fsS "$API_BASE/api/v1/brands/$BRAND")
echo "$BRAND_RES" | jq '{brand, ensName, reserved, claimed}'
ok "brand info fetched"

# ─── 3. Preauthorize a batch ─────────────────────────────────────────────────
step "3/9 · POST /api/v1/vehicles/batch/preauthorize (10 VINs)"
VINS_JSON='["QS-OEM-0001","QS-OEM-0002","QS-OEM-0003","QS-OEM-0004","QS-OEM-0005","QS-OEM-0006","QS-OEM-0007","QS-OEM-0008","QS-OEM-0009","QS-OEM-0010"]'
BRAND_TITLE="$(echo "$BRAND" | awk '{print toupper(substr($0,1,1)) substr($0,2)}')"
PRE_BODY=$(cat <<EOF
{
  "vins": $VINS_JSON,
  "manufacturer": "$BRAND_TITLE",
  "model": "QuickstartCar",
  "year": 2026,
  "batteryCapacityKwh": 82,
  "soulbound": true,
  "overrides": [{"vin":"QS-OEM-0003","soulbound":false}]
}
EOF
)
PRE_RES=$(curl -fsS -X POST "$API_BASE/api/v1/vehicles/batch/preauthorize" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "$PRE_BODY")
echo "$PRE_RES" | jq '{batchId, merkleRoot, total, soulboundCount, transferableCount}'
BATCH_ID=$(echo "$PRE_RES" | jq -r '.batchId')
MERKLE_ROOT=$(echo "$PRE_RES" | jq -r '.merkleRoot')
[[ "$BATCH_ID" == batch_* ]] || fail "no batchId returned"
ok "batch created — id=$BATCH_ID"

# ─── 4. Fetch one Merkle proof ───────────────────────────────────────────────
step "4/9 · GET /api/v1/vehicles/batch/$BATCH_ID/proof/QS-OEM-0001"
PROOF_RES=$(curl -fsS "$API_BASE/api/v1/vehicles/batch/$BATCH_ID/proof/QS-OEM-0001")
echo "$PROOF_RES" | jq '{vin, vinHash, soulbound, leaf, proof}'
ok "proof retrieved"

# ─── 5. Paginated proofs ────────────────────────────────────────────────────
step "5/9 · GET /api/v1/vehicles/batch/$BATCH_ID/proofs?limit=3"
PROOFS_RES=$(curl -fsS "$API_BASE/api/v1/vehicles/batch/$BATCH_ID/proofs?limit=3" \
  -H "x-api-key: $API_KEY")
echo "$PROOFS_RES" | jq '{total, limit, offset, vehicleCount: (.vehicles | length)}'
ok "paginated proofs fetched"

# ─── 6. Bulk transfer calldata ──────────────────────────────────────────────
step "6/9 · POST /api/v1/vehicles/batch/$BATCH_ID/transfer (2 transfers)"
TRANSFER_BODY=$(cat <<EOF
{
  "from": "$OEM_WALLET",
  "transfers": [
    {"tokenId":"1","to":"$BUYER_WALLET"},
    {"tokenId":"2","to":"$BUYER_WALLET"}
  ]
}
EOF
)
TR_RES=$(curl -fsS -X POST "$API_BASE/api/v1/vehicles/batch/$BATCH_ID/transfer" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "$TRANSFER_BODY")
echo "$TR_RES" | jq '{total, contract, firstCalldata: .unsignedTxs[0].unsignedTx.data}'
ok "unsigned safeTransferFrom calldata generated"

# ─── 7. Read a live vehicle from chain ──────────────────────────────────────
step "7/9 · GET /api/v1/vehicles/$VEHICLE_ID"
if VEH_RES=$(curl -fsS "$API_BASE/api/v1/vehicles/$VEHICLE_ID"); then
  echo "$VEH_RES" | jq '{tokenId, manufacturer, model, year, locked, owner}'
  ok "vehicle read"
else
  note "no vehicle at tokenId=$VEHICLE_ID — skipping (expected on a fresh chain)"
fi

# ─── 8. Battery passport ────────────────────────────────────────────────────
step "8/9 · GET /api/v1/battery/$VEHICLE_ID"
if BAT_RES=$(curl -fsS "$API_BASE/api/v1/battery/$VEHICLE_ID"); then
  echo "$BAT_RES" | jq '{vehicleId, stateOfHealth, cycleCount, merkleRoot}'
  ok "passport read"
else
  note "no passport for vehicle $VEHICLE_ID — skipping"
fi

# ─── 9. List charging stations ──────────────────────────────────────────────
step "9/9 · GET /api/v1/charging/stations"
ST_RES=$(curl -fsS "$API_BASE/api/v1/charging/stations" || echo '{"stations":[]}')
echo "$ST_RES" | jq '{total, sample: (.stations | .[0])}'
ok "stations listed"

echo -e "\n${BOLD}${GREEN}OEM quickstart complete.${RESET}"
echo -e "${DIM}Batch ID for reference: $BATCH_ID${RESET}"
echo -e "${DIM}Merkle root:           $MERKLE_ROOT${RESET}\n"
