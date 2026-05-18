#!/bin/bash

# launchd から呼ばれるスクリプト（PATH が限定されているため明示的に設定）
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"

PROJECT_DIR="$HOME/amazon-review-tracker"
LOG_DIR="$PROJECT_DIR/logs"

mkdir -p "$LOG_DIR"

LOG_FILE="$LOG_DIR/scrape-$(date '+%Y-%m').log"

echo "=== $(date '+%Y-%m-%d %H:%M:%S') ===" >> "$LOG_FILE"
cd "$PROJECT_DIR" && npm run scrape >> "$LOG_FILE" 2>&1
echo "" >> "$LOG_FILE"
