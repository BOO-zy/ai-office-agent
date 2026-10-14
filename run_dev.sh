#!/bin/bash

# AI Office Agent - 一键启动脚本
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=================================================="
echo "🚀 启动 Yiz AI Office Agent (Gemini 驱动)..."
echo "=================================================="

# 1. 启动后端 FastAPI 服务
echo "👉 [1/2] 正在启动后端 FastAPI 服务 (端口: 8000)..."
cd "$ROOT_DIR/backend"
if [ ! -d "venv" ]; then
    echo "⚠️ 未检测到虚拟环境，正在创建..."
    python3 -m venv venv
    ./venv/bin/pip install -r requirements.txt
fi

./venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo "✅ 后端已在后台启动 (PID: $BACKEND_PID)"

# 2. 启动前端 Vite 服务
echo "👉 [2/2] 正在启动前端 React 服务 (端口: 5173)..."
cd "$ROOT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!
echo "✅ 前端已在后台启动 (PID: $FRONTEND_PID)"

echo "=================================================="
echo "🎉 服务全部就绪！"
echo "🌐 前端访问地址: http://localhost:5173"
echo "📖 后端 API 文档: http://localhost:8000/docs"
echo "按 Ctrl+C 可停止所有服务。"
echo "=================================================="

# 捕获退出信号，清理子进程
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM

wait
