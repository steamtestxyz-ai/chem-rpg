#!/bin/bash
# 化學城堡大冒險 · 本地伺服器一-click 啟動器（macOS）
# 雙擊呢個檔就會喺正確目錄起伺服器並開瀏覽器。
cd "$(dirname "$0")" || exit 1
PORT=8000
echo "⚗️  化學城堡伺服器啟動中… 請開 http://localhost:$PORT"
python3 -m http.server "$PORT" &
SERVER_PID=$!
sleep 1.2
open "http://localhost:$PORT"
wait "$SERVER_PID"
