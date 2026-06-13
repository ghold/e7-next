#!/bin/bash
set -e

echo "=== E7 GEAR 部署 ==="
echo ""

# Build Docker image
echo "[1/2] 构建 Docker 镜像..."
docker compose build

# Start service
echo "[2/2] 启动服务..."
docker compose up -d

echo ""
echo "✓ 部署完成！访问 http://localhost:3000"
echo ""
echo "常用命令："
echo "  docker compose logs -f    # 查看日志"
echo "  docker compose down       # 停止服务"
echo "  docker compose restart    # 重启服务"
