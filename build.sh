#!/bin/bash
IMAGE_NAME="mytube"
TAG="${1:-latest}"

docker build -t "$IMAGE_NAME:$TAG" .

echo "Built $IMAGE_NAME:$TAG"
echo "Run: docker run --env-file .env -p 3000:3000 -v ./mytube-cookies.json:/tmp/mytube-cookies.json $IMAGE_NAME:$TAG"
