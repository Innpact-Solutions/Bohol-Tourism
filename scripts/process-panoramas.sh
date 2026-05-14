#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# process-panoramas.sh
# Processes new DJI 360° JPG files dropped into public/panoramas/
# ─ converts to WebP (7680×3840, quality 82)
# ─ creates _thumb.jpg (640×320) and _thumb.webp
# ─ extracts GPS + datetime from EXIF
# ─ appends new entries to src/config/panoramaLocations.ts
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PANO_DIR="$ROOT_DIR/public/panoramas"
CONFIG_FILE="$ROOT_DIR/src/config/panoramaLocations.ts"

echo "📂 Scanning: $PANO_DIR"
echo "📝 Config:   $CONFIG_FILE"
echo ""

NEW_ENTRIES=""
PROCESSED=0
SKIPPED=0

for jpg in "$PANO_DIR"/*.JPG "$PANO_DIR"/*.jpg; do
  # Handle glob expansion producing no matches
  [ -f "$jpg" ] || continue

  filename="$(basename "$jpg")"
  base="${filename%.*}"

  # Skip thumbnails
  [[ "$base" == *_thumb* ]] && continue

  # Check if already registered in config
  if grep -q "'/$( echo "panoramas/${base}" | sed 's/[.]/\\./g' )" "$CONFIG_FILE" 2>/dev/null ||
     grep -q "\"/$( echo "panoramas/${base}" | sed 's/[.]/\\./g' )" "$CONFIG_FILE" 2>/dev/null ||
     grep -q "panoramas/${base}.webp" "$CONFIG_FILE" 2>/dev/null ||
     grep -q "panoramas/${base}.JPG" "$CONFIG_FILE" 2>/dev/null ||
     grep -q "panoramas/${base}.jpg" "$CONFIG_FILE" 2>/dev/null; then
    echo "⏭  Skipping  $filename  (already in config)"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  echo "🔄 Processing $filename ..."

  # ── WebP conversion ──────────────────────────────────────────
  WEBP="$PANO_DIR/${base}.webp"
  if [ ! -f "$WEBP" ]; then
    echo "   → Converting to WebP..."
    cwebp -q 82 -resize 7680 3840 "$jpg" -o "$WEBP" -quiet
    echo "   ✅ Created ${base}.webp"
  else
    echo "   ⏭  ${base}.webp already exists"
  fi

  # ── Thumbnail JPG (640×320) ─────────────────────────────────
  THUMB_JPG="$PANO_DIR/${base}_thumb.jpg"
  if [ ! -f "$THUMB_JPG" ]; then
    echo "   → Creating thumbnail JPG..."
    convert "$jpg" -resize 640x320! -quality 85 "$THUMB_JPG"
    echo "   ✅ Created ${base}_thumb.jpg"
  else
    echo "   ⏭  ${base}_thumb.jpg already exists"
  fi

  # ── Thumbnail WebP (640×320) ────────────────────────────────
  THUMB_WEBP="$PANO_DIR/${base}_thumb.webp"
  if [ ! -f "$THUMB_WEBP" ]; then
    echo "   → Creating thumbnail WebP..."
    cwebp -q 75 -resize 640 320 "$jpg" -o "$THUMB_WEBP" -quiet
    echo "   ✅ Created ${base}_thumb.webp"
  else
    echo "   ⏭  ${base}_thumb.webp already exists"
  fi

  # ── Extract EXIF metadata ───────────────────────────────────
  echo "   → Extracting EXIF..."
  EXIF_JSON=$(exiftool -n -GPSLatitude -GPSLongitude -CreateDate -DateTimeOriginal -json "$jpg" 2>/dev/null || echo "[]")

  GPS_LAT=$(echo "$EXIF_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0].get('GPSLatitude',''))" 2>/dev/null || echo "")
  GPS_LNG=$(echo "$EXIF_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0].get('GPSLongitude',''))" 2>/dev/null || echo "")
  DATETIME=$(echo "$EXIF_JSON" | python3 -c "
import sys, json
d = json.load(sys.stdin)
v = d[0].get('DateTimeOriginal') or d[0].get('CreateDate') or ''
# Format: '2026:03:24 07:38:12' -> '24 Mar 2026 · 07:38'
if v:
    parts = v.split(' ')
    if len(parts) == 2:
        date_parts = parts[0].split(':')
        time_parts = parts[1].split(':')
        months = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
        if len(date_parts) == 3 and len(time_parts) >= 2:
            print(f'{int(date_parts[2])} {months[int(date_parts[1])]} {date_parts[0]} · {time_parts[0]}:{time_parts[1]}')
        else:
            print(v)
    else:
        print(v)
" 2>/dev/null || echo "")

  if [ -z "$GPS_LAT" ] || [ -z "$GPS_LNG" ]; then
    echo "   ⚠️  No GPS data found in $filename — using placeholder coords [0, 0]"
    GPS_LAT="0"
    GPS_LNG="0"
  else
    echo "   📍 GPS: lat=$GPS_LAT lng=$GPS_LNG"
  fi

  # ── Build config entry ──────────────────────────────────────
  ID="dji-$(echo "$base" | tr '[:upper:]' '[:lower:]' | tr '_' '-')"
  DESC_TIME="${DATETIME:-DJI FC3582 aerial capture}"

  ENTRY="  {
    id: '${ID}',
    title: '${base}',
    description: 'DJI FC3582 aerial capture · ${DESC_TIME}',
    imageUrl: '/panoramas/${base}.webp',
    thumbnail: '/panoramas/${base}_thumb.jpg',
    coordinates: [${GPS_LNG}, ${GPS_LAT}],
  },"

  NEW_ENTRIES="${NEW_ENTRIES}
${ENTRY}"
  PROCESSED=$((PROCESSED + 1))
  echo "   ✅ Entry prepared for: $ID"
  echo ""
done

# ── Inject into panoramaLocations.ts ───────────────────────────
if [ $PROCESSED -gt 0 ]; then
  echo "════════════════════════════════════════"
  echo "📝 Appending $PROCESSED new entries to panoramaLocations.ts..."

  # Insert before the closing ]; of PANORAMA_LOCATIONS
  # We replace the last "];" line that closes the array
  TMPFILE=$(mktemp)
  python3 - "$CONFIG_FILE" "$TMPFILE" "$NEW_ENTRIES" <<'PYEOF'
import sys

config_path = sys.argv[1]
out_path = sys.argv[2]
new_entries = sys.argv[3]

with open(config_path, 'r') as f:
    content = f.read()

# Find the closing bracket of PANORAMA_LOCATIONS array
# It's the line containing "];" that closes the array (before the PANORAMA_GEOJSON export)
insert_marker = "];\n\n/**\n * GeoJSON FeatureCollection"
if insert_marker not in content:
    # Try alternate
    insert_marker = "];\n\n/**"

if insert_marker in content:
    idx = content.index(insert_marker)
    updated = content[:idx] + new_entries + "\n" + content[idx:]
else:
    print("ERROR: Could not find insertion point in config file", file=sys.stderr)
    sys.exit(1)

with open(out_path, 'w') as f:
    f.write(updated)

print("OK")
PYEOF

  if [ $? -eq 0 ]; then
    cp "$TMPFILE" "$CONFIG_FILE"
    rm -f "$TMPFILE"
    echo "✅ panoramaLocations.ts updated successfully."
  else
    rm -f "$TMPFILE"
    echo "❌ Failed to update panoramaLocations.ts"
    exit 1
  fi
else
  echo "ℹ️  No new images to process."
fi

echo ""
echo "════════════════════════════════════════"
echo "Summary:"
echo "  Processed : $PROCESSED"
echo "  Skipped   : $SKIPPED (already in config)"
echo "════════════════════════════════════════"
echo ""
echo "⚠️  NEXT STEP: Open src/config/panoramaLocations.ts and update"
echo "   the 'title' field for each new entry (currently set to filename)."
echo "   The app will reload automatically."
