#!/bin/bash

# restart.sh - NAS mytube 컨테이너 재시작 (빌드 없이)
# 사용법: ./restart.sh

set -e

CONTAINER_NAME="mytube"

# 네트워크 환경 감지 (hostname 기반)
CURRENT_HOST=$(hostname)
if [ "$CURRENT_HOST" = "Mac.asus.com" ]; then
    REMOTE_HOST="hydra01@192.168.1.177"
    echo "🏠 홈 맥북 감지 → ${REMOTE_HOST}"
else
    REMOTE_HOST="hydra01@hydra01.asuscomm.com"
    echo "🌐 외부 환경 → ${REMOTE_HOST}"
fi

echo "🔄 ${CONTAINER_NAME} 컨테이너 재시작 중..."
ssh $REMOTE_HOST "docker restart ${CONTAINER_NAME}"

echo ""
echo "✅ 컨테이너 상태:"
ssh $REMOTE_HOST "docker ps --filter name=${CONTAINER_NAME} --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"
echo ""
echo "=== 재시작 완료 ==="
