#!/bin/bash

# build-deps.sh - mytube-deps 이미지 빌드
# package.json / package-lock.json 변경 시만 실행

set -e

echo "=== mytube-deps 이미지 빌드 ==="
docker build -f Dockerfile.deps -t mytube-deps:latest .
echo "✅ mytube-deps:latest 빌드 완료"
