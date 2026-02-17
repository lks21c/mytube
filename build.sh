#!/bin/bash

# build.sh - NAS에서 mytube 빌드 및 배포
# deploy.sh에서 SSH로 호출되거나 NAS에서 직접 실행

set -e

IMAGE_NAME="mytube"
CONTAINER_NAME="mytube"
PORT=3434

echo "=== mytube 빌드 & 배포 ==="

# 1. docker 그룹 체크
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker 접근 불가. docker 그룹 확인 필요."
    exit 1
fi

# 2. 기존 컨테이너 중지/제거
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "🛑 기존 ${CONTAINER_NAME} 컨테이너 중지/제거..."
    docker stop "$CONTAINER_NAME" 2>/dev/null || true
    docker rm "$CONTAINER_NAME" 2>/dev/null || true
fi

# 3. 최신 코드 pull
echo "📥 git pull..."
git pull

# 4. Docker 이미지 빌드
echo "🔨 Docker 이미지 빌드 중..."
docker build -t "$IMAGE_NAME:latest" .

# 5. dangling 이미지 정리
echo "🧹 dangling 이미지 정리..."
docker image prune -f

# 6. 새 컨테이너 시작
echo "🚀 새 컨테이너 시작..."
docker run -d --restart=unless-stopped \
    -p ${PORT}:${PORT} \
    --env-file .env \
    -v /volume1/repo/mytube/mytube-cookies.json:/tmp/mytube-cookies.json \
    --name "$CONTAINER_NAME" \
    "$IMAGE_NAME:latest"

# 7. 실행 확인
echo ""
echo "✅ 컨테이너 상태:"
docker ps --filter "name=${CONTAINER_NAME}" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "=== 배포 완료 (http://localhost:${PORT}) ==="
