#!/bin/bash

# build.sh - mytube Docker 이미지 빌드 (런타임 전용)
# Node.js 버전 변경 시에만 실행 필요
# 사용법: ./build.sh

set -e

IMAGE_NAME="mytube"

echo "=== mytube 이미지 빌드 ==="

if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker 접근 불가. docker 그룹 확인 필요."
    exit 1
fi

docker build -t "$IMAGE_NAME:latest" .

echo ""
echo "✅ $IMAGE_NAME:latest 빌드 완료"
echo "💡 이미지는 런타임 전용 — 소스는 볼륨 마운트로 제공"
