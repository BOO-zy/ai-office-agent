# Yiz AI Office Agent (智能办公协同智能体)

基于 Google Gemini 大模型的全自主 AI 办公协同智能体。用户可通过网页聊天、上传图片/发票截图/草稿提出需求，Agent 自主规划并调用专业的文档引擎生成出版级格式的 **Excel 表格 (.xlsx)** 与 **Word 文档 (.docx)**，支持一键在线下载。

---

## 🌟 核心特性

- **多模态感知理解**：支持用户直接拖拽上传图片、报销发票凭据截图、纸质表格照片，模型自动 OCR 提取并结构化入库。
- **自主 Agent 工具调用 (Function Calling)**：
  - `create_excel`：自动设计多 Sheet 商务配色、大标题、表头冻结、网格线保护、单元格自适应宽度、货币/百分比格式化及大写公式（`SUM`、`AVERAGE` 等）。
  - `create_word`：自动组织多级层级结构、背景引言、核心结论 Callout 强调框、项目符号及对比表格。
- **现代化聊天交互**：基于 React + Tailwind CSS，具备对话流式体验、图片即时预览、生成文件徽章卡片与一键下载。
- **极简部署架构**：前后端解耦，前端支持零成本托管在 Vercel/Cloudflare，后端支持零成本运行在 Hugging Face Spaces / Render。

---

## 🛠 技术栈

* **后端**：Python 3.9+、FastAPI、Uvicorn、openpyxl、python-docx、pandas、Pillow
* **AI 核心**：Google Gemini (Gemini 3.5 Flash / Gemini 3.1 Flash-Lite) 原生 Function Calling 与多模态能力
* **前端**：React 18、Vite、Tailwind CSS、Lucide React、React Markdown、Axios

---

## 📁 目录结构

```text
ai-office-agent/
├── backend/                  # Python 后端服务
│   ├── app/
│   │   ├── main.py           # FastAPI 路由入口 (CORS/文件上传/下载接口)
│   │   ├── agent.py          # Gemini Agent 调度逻辑与 Function Calling
│   │   └── tools/
│   │       ├── excel_builder.py # 专业 Excel 渲染生成引擎
│   │       └── word_builder.py  # 专业 Word 排版生成引擎
│   ├── storage/
│   │   ├── uploads/          # 用户上传的图片/临时文件
│   │   └── outputs/          # Agent 生成的 Excel/Word 文件
│   ├── requirements.txt      # 后端依赖列表
│   ├── Dockerfile            # 容器化部署文件
│   └── .env                  # 环境变量配置 (已配置 API Key)
│
├── frontend/                 # React 前端应用
│   ├── src/
│   │   ├── components/       # 头部、聊天框、文件卡片、快捷模板
│   │   ├── App.jsx           # 主应用交互逻辑
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js        # 代理配置 (将 /api 转发至后端 8000)
│
├── run_dev.sh                # 本地一键启动前后端脚本
└── README.md                 # 项目使用说明
```

---

## 🚀 本地运行指南

### 方法一：一键启动（推荐）

在项目根目录下直接运行脚本：
```bash
cd /Users/edy/Documents/yiz/ai-office-agent
./run_dev.sh
```
启动后访问：
* 前端页面：`http://localhost:5173`
* 后端 API 文档：`http://localhost:8000/docs`

---

### 方法二：分步骤分别启动

#### 1. 启动后端
```bash
cd /Users/edy/Documents/yiz/ai-office-agent/backend
# 激活已有虚拟环境
source venv/bin/activate
# 启动 FastAPI
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. 启动前端
```bash
cd /Users/edy/Documents/yiz/ai-office-agent/frontend
npm run dev
```

---

## ☁️ 免费部署方案

### 1. 前端部署（推荐 Vercel）
1. 将 `frontend/` 目录推送到你的 GitHub 仓库。
2. 登录 [Vercel](https://vercel.com/)，导入该仓库。
3. Root Directory 选择 `frontend`，点击 Deploy 即可全自动生成全球 CDN 加速的访问域名。

### 2. 后端部署（推荐 Hugging Face Spaces - 永久免费 2vCPU/16GB）
1. 在 [Hugging Face](https://huggingface.co/spaces) 创建一个新的 Space，SDK 选择 **Docker**。
2. 将 `backend/` 下的所有文件（包括 `Dockerfile`、`requirements.txt`、`app/`）提交到 Space 仓库。
3. 在 Space 的 **Settings -> Variables and secrets** 中添加 Secret：
   * `GEMINI_API_KEY`: 填入你的 Gemini Key。
4. 部署成功后，得到一个以 `https://xxx.hf.space` 结尾的免费后端链接。将前端的 API 请求地址指向此链接即可。
