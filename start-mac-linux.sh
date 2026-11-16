#!/usr/bin/env bash
# Starts App Builder. Usage: ./start-mac-linux.sh
cd "$(dirname "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  echo "  [X] Node.js is not installed. Install the LTS version from nodejs.org."
  exit 1
fi
if [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 20 ]; then
  echo "  [X] Node.js 20 or newer is needed. You have $(node -v)."
  exit 1
fi
[ -f .env ] || cp .env.example .env
# Install on first start, and again whenever an update changes package.json
if ! cmp -s package.json node_modules/.installed-package.json; then
  echo "  [1/2] Installing packages. This takes a few minutes after an update..."
  npm install || { echo "  [X] Installing packages failed."; exit 1; }
  cp package.json node_modules/.installed-package.json
fi
echo "  [2/2] Starting at http://localhost:3000 — keep this window open. Ctrl+C stops it."
( sleep 8; (command -v open >/dev/null && open http://localhost:3000) || (command -v xdg-open >/dev/null && xdg-open http://localhost:3000) ) >/dev/null 2>&1 &
npm run dev
