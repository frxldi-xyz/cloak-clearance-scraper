#!/bin/sh
set -e

if [ "${HEADLESS}" = "true" ] || [ "${DISABLE_XVFB}" = "true" ]; then
  exec "$@"
fi

export DISPLAY="${DISPLAY:-:99}"

Xvfb "$DISPLAY" -screen 0 "${XVFB_WHD:-1920x1080x24}" -ac +extension RANDR >/tmp/xvfb.log 2>&1 &
XVFB_PID=$!

cleanup() {
  kill "$XVFB_PID" 2>/dev/null || true
}
trap cleanup INT TERM EXIT

sleep 1
exec "$@"
