import os
import uuid
import json
import shutil
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

from .agent import agent_instance

# Storage directories
UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../storage/uploads"))
OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../storage/outputs"))
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

app = FastAPI(
    title="AI Office Agent API",
    description="智能办公协同智能体后端 - 接入 Gemini 支持 Excel/Word 自动化生成",
    version="1.0.0"
)

# Enable CORS for local Vite dev (port 5173/3000) and deployed frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "AI Office Agent",
        "agent_ready": True
    }

@app.get("/api/templates")
def get_quick_templates():
    return [
        {
            "id": "excel-sales",
            "type": "excel",
            "title": "销售业绩核算与提成表",
            "prompt": "帮我制作一份2026年Q1销售业绩核算与提成统计 Excel，包含5个销售员的月度目标、实际完成额、完成率、提成比例与最终提成金额，附带求和与平均值公式。"
        },
        {
            "id": "excel-attendance",
            "type": "excel",
            "title": "公司月度考勤与工时表",
            "prompt": "请生成一份规范的部门月度考勤与加班工时统计表 Excel，包含员工姓名、出勤天数、迟到次数、加班工时、全勤奖判定及备注。"
        },
        {
            "id": "word-proposal",
            "type": "word",
            "title": "AI 项目立项与商业可行性报告",
            "prompt": "请撰写一份详实的《企业级办公智能体项目立项与商业可行性报告》Word 文档，包括项目背景、痛点分析、核心功能架构、实施里程碑表格以及预期投资回报。"
        },
        {
            "id": "word-weekly",
            "type": "word",
            "title": "技术团队周报与工作纪要",
            "prompt": "请帮我整理一份专业的技术团队周度工作汇报 Word 文档，涵盖本周上线成果、待解决问题、团队任务进度表以及下周重点规划。"
        }
    ]

@app.get("/api/models")
def get_available_models():
    """Returns available models configuration"""
    doubao_key = os.getenv("DOUBAO_API_KEY", "")
    doubao_ep = os.getenv("DOUBAO_MODEL_ENDPOINT", "")
    return {
        "models": [
            {
                "id": "gemini",
                "name": "Google Gemini 3.5",
                "badge": "国际旗舰",
                "provider": "google",
                "desc": "支持多模态与精准工具调用"
            },
            {
                "id": "doubao",
                "name": "豆包大模型 (Doubao)",
                "badge": "字节跳动·国内直连",
                "provider": "bytedance",
                "desc": "火山引擎方舟平台接入",
                "has_key": bool(doubao_key),
                "endpoint": doubao_ep
            }
        ]
    }

@app.post("/api/chat")
async def chat_endpoint(
    prompt: str = Form(...),
    history: Optional[str] = Form(None),
    model: Optional[str] = Form("gemini"),
    doubao_endpoint: Optional[str] = Form(None),
    files: Optional[List[UploadFile]] = File(None)
):
    """
    Core Chat & Task Execution Endpoint.
    Accepts user prompt and optional uploaded files/images.
    """
    saved_media = []
    
    # Save uploaded files if any
    if files:
        for f in files:
            if not f.filename:
                continue
            ext = os.path.splitext(f.filename)[1].lower()
            file_id = f"{uuid.uuid4().hex[:8]}_{f.filename}"
            save_path = os.path.join(UPLOAD_DIR, file_id)
            with open(save_path, "wb") as buffer:
                shutil.copyfileobj(f.file, buffer)
            
            # Identify MIME
            mime = "image/jpeg"
            if ext in [".png"]:
                mime = "image/png"
            elif ext in [".webp"]:
                mime = "image/webp"
            elif ext in [".gif"]:
                mime = "image/gif"
            
            saved_media.append({
                "path": save_path,
                "mime_type": mime,
                "filename": f.filename
            })

    # Parse history if provided
    chat_history = None
    if history:
        try:
            chat_history = json.loads(history)
        except Exception:
            chat_history = None

    try:
        response = agent_instance.run(
            user_prompt=prompt,
            media_files=saved_media,
            chat_history=chat_history,
            model_provider=model or "gemini",
            doubao_endpoint=doubao_endpoint
        )
        return response
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.api_route("/api/download/{file_id}", methods=["GET", "HEAD"])
async def download_file(file_id: str):
    """Download the generated Excel or Word file"""
    file_path = os.path.join(OUTPUT_DIR, file_id)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="文件不存在或已过期")

    # Extract clean filename without prefix
    clean_name = file_id.split("_", 1)[-1] if "_" in file_id else file_id

    media_type = "application/octet-stream"
    if clean_name.endswith(".xlsx"):
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    elif clean_name.endswith(".docx"):
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

    return FileResponse(
        path=file_path,
        filename=clean_name,
        media_type=media_type
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
