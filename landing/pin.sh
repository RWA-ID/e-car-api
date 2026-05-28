#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Pin the e-car.eth landing directory to IPFS via Pinata.
#
# Usage:
#   PINATA_JWT="eyJ…" bash landing/pin.sh
#
# Outputs the CID + a gateway URL on success.
# The CID is what you'd paste into the ENS contenthash field.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NAME="${PIN_NAME:-e-car.eth landing $(date -u +%Y-%m-%d)}"

if [[ -z "${PINATA_JWT:-}" ]]; then
  echo "✗ PINATA_JWT env var is required" >&2
  echo "  Usage: PINATA_JWT='eyJ…' bash $0" >&2
  exit 1
fi

echo "▶ Pinning $DIR  ($(du -sh "$DIR" | cut -f1))"

# Build the multipart form: one -F entry per file, with the file path inside the wrapping folder.
FILES=()
while IFS= read -r f; do
  rel="${f#$DIR/}"
  FILES+=(-F "file=@${f};filename=landing/${rel}")
done < <(find "$DIR" -type f \
  ! -name '.DS_Store' \
  ! -name 'pin.sh' \
  ! -name '.gitignore' \
  ! -path '*/.git/*' \
  ! -path '*/node_modules/*' \
  ! -path '*/wallet-src/*')

echo "  ${#FILES[@]} entries..." | sed 's|file=@[^ ]* *||g'
echo "  POST https://api.pinata.cloud/pinning/pinFileToIPFS"

RESPONSE=$(curl -sS -X POST https://api.pinata.cloud/pinning/pinFileToIPFS \
  -H "Authorization: Bearer ${PINATA_JWT}" \
  -F "pinataMetadata={\"name\":\"${NAME}\"}" \
  -F 'pinataOptions={"cidVersion":1,"wrapWithDirectory":false}' \
  "${FILES[@]}")

CID=$(echo "$RESPONSE" | python3 -c "import json,sys;d=json.load(sys.stdin);print(d.get('IpfsHash',''))" 2>/dev/null || true)

if [[ -z "$CID" ]]; then
  echo "✗ Pin failed — full response:" >&2
  echo "$RESPONSE" >&2
  exit 1
fi

echo
echo "✓ Pinned successfully"
echo "  CID:           $CID"
echo "  Pin name:      $NAME"
echo "  Gateway:       https://gateway.pinata.cloud/ipfs/$CID/"
echo "  Public:        https://${CID}.ipfs.dweb.link/"
echo "  ENS:           ipfs://$CID"
echo
echo "Paste ipfs://$CID into the ENS contenthash field for e-car.eth"
