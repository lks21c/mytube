#!/bin/bash

# restart.sh - NAS에서 직접 실행: git pull → 컨테이너 재시작 (볼륨 마운트)
# 사용법: ./restart.sh

set -e

IMAGE_NAME="mytube"
CONTAINER_NAME="mytube"
PORT=3434
APP_DIR="/volume1/repo/mytube"

echo "=== mytube 재시작 ==="

# 1. Docker 접근 체크
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker 접근 불가. docker 그룹 확인 필요."
    exit 1
fi

# 2. SQLite WAL checkpoint
if [ -f "$APP_DIR/dev.db" ]; then
    echo "🗃️ SQLite WAL checkpoint..."
    sqlite3 "$APP_DIR/dev.db" "PRAGMA wal_checkpoint(TRUNCATE);" 2>/dev/null || true
fi

# 3. 기존 컨테이너 중지/제거
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "🛑 기존 ${CONTAINER_NAME} 컨테이너 중지/제거..."
    docker stop "$CONTAINER_NAME" 2>/dev/null || true
    docker rm "$CONTAINER_NAME" 2>/dev/null || true
fi

# 4. git pull
echo "📥 git pull..."
cd "$APP_DIR"
git pull

# 5. .current-commit 기록
git rev-parse HEAD > .current-commit

# 6. 쿠키/OAuth 파일 touch (마운트 시 파일 없으면 디렉토리로 생성됨)
touch "$APP_DIR/mytube-cookies.json" 2>/dev/null || true
touch "$APP_DIR/mytube-oauth.json" 2>/dev/null || true

# 7. 새 컨테이너 시작 (볼륨 마운트)
echo "🚀 새 컨테이너 시작 (볼륨 마운트)..."
docker run -d --restart=unless-stopped \
    -p ${PORT}:${PORT} \
    --env-file "$APP_DIR/.env" \
    -v "$APP_DIR":/app/mytube \
    --name "$CONTAINER_NAME" \
    "$IMAGE_NAME:latest"

# 8. dangling 이미지 정리
echo "🧹 dangling 이미지 정리..."
docker image prune -f

# 9. 실행 확인
echo ""
echo "✅ 컨테이너 상태:"
docker ps --filter "name=${CONTAINER_NAME}" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "=== 재시작 완료 (http://localhost:${PORT}) ==="
echo "💡 첫 시작 시 npm ci + build 실행됨 (로그: docker logs -f $CONTAINER_NAME)"
