#!/bin/bash

# Docker 镜像构建和推送脚本
# 使用方法: ./build-and-push.sh [镜像名称] [标签] [远程仓库]

set -e

# 默认值
IMAGE_NAME=${1:-"neo-blog"}
TAG=${2:-"latest"}
REGISTRY=${3:-""}  # 例如: docker.io/username 或 registry.example.com

# 如果没有指定远程仓库，只构建本地镜像
if [ -z "$REGISTRY" ]; then
  echo "🚀 构建本地镜像: ${IMAGE_NAME}:${TAG}"
  docker build -t "${IMAGE_NAME}:${TAG}" .
  echo "✅ 构建完成！"
  echo ""
  echo "运行镜像:"
  echo "  docker run -p 3000:3000 ${IMAGE_NAME}:${TAG}"
  exit 0
fi

# 完整的镜像名称（包含远程仓库）
FULL_IMAGE_NAME="${REGISTRY}/${IMAGE_NAME}:${TAG}"

echo "🚀 构建镜像: ${FULL_IMAGE_NAME}"
docker build -t "${FULL_IMAGE_NAME}" .

echo "📤 推送镜像到远程仓库..."
docker push "${FULL_IMAGE_NAME}"

echo "✅ 完成！镜像已推送到: ${FULL_IMAGE_NAME}"
