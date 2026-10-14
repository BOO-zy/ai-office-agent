import os
import json
import base64
import requests
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

from .tools.excel_builder import create_styled_excel
from .tools.word_builder import create_styled_word

# Load env
ENV_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.env"))
load_dotenv(ENV_PATH)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
PRIMARY_MODEL = os.getenv("MODEL_NAME", "gemini-3.5-flash-lite")
OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../storage/outputs"))

# Candidate models in priority order for fault tolerance
CANDIDATE_MODELS = [
    PRIMARY_MODEL,
    "gemini-3.5-flash-lite",
    "gemini-3.5-flash",
    "gemini-3.6-flash",
    "gemini-3.1-flash-lite"
]
# Remove duplicates while preserving order
CANDIDATE_MODELS = list(dict.fromkeys(CANDIDATE_MODELS))

SYSTEM_INSTRUCTION = """
你是一个顶级的全能 AI 办公智能体专家（Office Copilot Agent）。
你的职责是帮助用户高效处理、分析办公需求，并直接为用户创作生成具备出版级精美格式的 Excel 表格（.xlsx）和 Word 文档（.docx）。

你的核心能力与准则：
1. 【自动判断并调用工具】：
   - 当用户需要表格、财务统计、数据核算、对比清单、考勤表、甘特进度表或任何结构化数据时，你必须调用 `create_excel` 工具生成。
   - 当用户需要可行性报告、商业计划书、立项总结、合同草案、周报月报、会议纪要或长篇规范文档时，你必须调用 `create_word` 工具生成。
   - 如果用户既想要数据表又想要汇报文档，你可以依次调用工具生成。
   - 如果用户的需求只是简单的普通问答，直接文本回复即可，无需调用工具。
2. 【专业度与审美要求】：
   - 生成 Excel 时：表头字段要严谨详实，数值要真实合理，公式（如求和、均值、乘积等）使用大写公式（如 `=SUM(...)`, `=AVERAGE(...)` 等），并自带总计/平均值行。
   - 生成 Word 时：逻辑层次分明（一、1. (1)），包含引言背景、核心要点（带 bullets）、正文分析、结论与建议，以及适合的对比表格与关键点总结（callout）。
3. 【多模态感知与文件处理】：
   - 用户上传图片（如发票、手写草稿、表格截图、收据等）或已有 Excel/Word 文档时，仔细识别其中的文字、金额、项目或已有数据，并将其转化为结构化数据填入文档中。
4. 【沟通风格】：
   - 热情、专业、高效。调用工具生成文件后，请用清晰的中文对生成的内容进行总结陈述，突出重点亮点。
"""

AGENT_TOOLS_DECLARATION = [
    {
        "function_declarations": [
            {
                "name": "create_excel",
                "description": "用于生成精美、专业的 Excel 表格文件 (.xlsx)。支持多 Sheet、自定义表头、数据行、计算公式、汇总行等。",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "filename": {
                            "type": "STRING",
                            "description": "生成的 Excel 文件名（例如：'2026年第一季度销售数据统计.xlsx'）"
                        },
                        "sheets_data": {
                            "type": "ARRAY",
                            "description": "包含的工作表数据列表",
                            "items": {
                                "type": "OBJECT",
                                "properties": {
                                    "name": {"type": "STRING", "description": "工作表名称，如'销售汇总'"},
                                    "title": {"type": "STRING", "description": "表头上方的大标题横幅内容（可选）"},
                                    "headers": {
                                        "type": "ARRAY",
                                        "items": {"type": "STRING"},
                                        "description": "列标题列表，例如 ['月份', '部门', '销售额(元)', '达成率']"
                                    },
                                    "rows": {
                                        "type": "ARRAY",
                                        "items": {
                                            "type": "ARRAY",
                                            "items": {"type": "STRING"},
                                            "description": "行数据，每个单元格可以是文字、数字或Excel公式（如'=C3*D3'）"
                                        },
                                        "description": "各行的数据列表"
                                    },
                                    "summary_row": {
                                        "type": "ARRAY",
                                        "items": {"type": "STRING"},
                                        "description": "底部的汇总行（可选），如 ['总计', '-', '=SUM(C3:C10)', '-']"
                                    }
                                },
                                "required": ["headers", "rows"]
                            }
                        }
                    },
                    "required": ["filename", "sheets_data"]
                }
            },
            {
                "name": "create_word",
                "description": "用于生成排版规范、样式优美的 Word 汇报或说明文档 (.docx)。支持多级标题、段落、项目符号、强调框和数据表格。",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "filename": {
                            "type": "STRING",
                            "description": "生成的 Word 文件名（例如：'AI商业化落地项目可行性分析报告.docx'）"
                        },
                        "title": {
                            "type": "STRING",
                            "description": "文档一级大标题"
                        },
                        "subtitle": {
                            "type": "STRING",
                            "description": "文档副标题或作者日期信息（例如：'编制人：产品部 | 日期：2026年10月'）"
                        },
                        "sections": {
                            "type": "ARRAY",
                            "description": "章节列表",
                            "items": {
                                "type": "OBJECT",
                                "properties": {
                                    "heading": {"type": "STRING", "description": "本节小标题"},
                                    "level": {"type": "INTEGER", "description": "标题级别，1为大节，2为小节"},
                                    "content": {
                                        "type": "ARRAY",
                                        "items": {"type": "STRING"},
                                        "description": "段落正文文本列表"
                                    },
                                    "bullets": {
                                        "type": "ARRAY",
                                        "items": {"type": "STRING"},
                                        "description": "项目符号列表（要点归纳）"
                                    },
                                    "callout": {
                                        "type": "STRING",
                                        "description": "高亮总结或核心警示框文字"
                                    },
                                    "table": {
                                        "type": "OBJECT",
                                        "properties": {
                                            "headers": {"type": "ARRAY", "items": {"type": "STRING"}},
                                            "rows": {"type": "ARRAY", "items": {"type": "ARRAY", "items": {"type": "STRING"}}}
                                        },
                                        "description": "章节内附带的数据表格"
                                    }
                                },
                                "required": ["heading"]
                            }
                        }
                    },
                    "required": ["filename", "title", "sections"]
                }
            }
        ]
    }
]

# OpenAI-compatible tool declaration for Doubao (Volcengine Ark)
DOUBAO_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "create_excel",
            "description": "用于生成精美、专业的 Excel 表格文件 (.xlsx)。支持多 Sheet、自定义表头、数据行、计算公式、汇总行等。",
            "parameters": {
                "type": "object",
                "properties": {
                    "filename": {
                        "type": "string",
                        "description": "生成的 Excel 文件名（例如：'2026年第一季度销售数据统计.xlsx'）"
                    },
                    "sheets_data": {
                        "type": "array",
                        "description": "包含的工作表数据列表",
                        "items": {
                            "type": "object",
                            "properties": {
                                "name": {"type": "string", "description": "工作表名称，如'销售汇总'"},
                                "title": {"type": "string", "description": "表头上方的大标题横幅内容（可选）"},
                                "headers": {
                                    "type": "array",
                                    "items": {"type": "string"},
                                    "description": "列标题列表，例如 ['月份', '部门', '销售额(元)', '达成率']"
                                },
                                "rows": {
                                    "type": "array",
                                    "items": {
                                        "type": "array",
                                        "items": {"type": "string"},
                                        "description": "各单元格数据列表"
                                    },
                                    "description": "各行的数据列表"
                                },
                                "summary_row": {
                                    "type": "array",
                                    "items": {"type": "string"},
                                    "description": "底部的汇总行（可选）"
                                }
                            },
                            "required": ["headers", "rows"]
                        }
                    }
                },
                "required": ["filename", "sheets_data"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_word",
            "description": "用于生成排版规范、样式优美的 Word 汇报或说明文档 (.docx)。支持多级标题、段落、项目符号、强调框和数据表格。",
            "parameters": {
                "type": "object",
                "properties": {
                    "filename": {
                        "type": "string",
                        "description": "生成的 Word 文件名（例如：'企业级办公智能体立项方案.docx'）"
                    },
                    "title": {
                        "type": "string",
                        "description": "文档总标题"
                    },
                    "subtitle": {
                        "type": "string",
                        "description": "文档副标题（可选）"
                    },
                    "sections": {
                        "type": "array",
                        "description": "文档各个章节内容",
                        "items": {
                            "type": "object",
                            "properties": {
                                "heading": {"type": "string", "description": "章节大标题"},
                                "paragraphs": {
                                    "type": "array",
                                    "items": {"type": "string"},
                                    "description": "章节下的正文段落列表"
                                },
                                "bullets": {
                                    "type": "array",
                                    "items": {"type": "string"},
                                    "description": "项目符号无序列表要点（可选）"
                                },
                                "callout": {
                                    "type": "string",
                                    "description": "高亮引用框或重要总结提示（可选）"
                                },
                                "table": {
                                    "type": "object",
                                    "description": "本章节包含的表格数据（可选）",
                                    "properties": {
                                        "headers": {
                                            "type": "array",
                                            "items": {"type": "string"}
                                        },
                                        "rows": {
                                            "type": "array",
                                            "items": {
                                                "type": "array",
                                                "items": {"type": "string"}
                                            }
                                        }
                                    }
                                }
                            },
                            "required": ["heading"]
                        }
                    }
                },
                "required": ["filename", "title", "sections"]
            }
        }
    }
]

def parse_uploaded_file(file_info: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Intelligently parses uploaded files:
    - Images & PDF: returns inline_data parts.
    - Excel / Word / Text / CSV: extracts content as text prompt parts.
    """
    parts = []
    path = file_info.get("path")
    filename = file_info.get("filename", "")
    ext = os.path.splitext(filename)[1].lower()

    if not path or not os.path.exists(path):
        return parts

    # 1. Images
    if ext in [".jpg", ".jpeg", ".png", ".webp", ".gif"]:
        mime_map = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".webp": "image/webp",
            ".gif": "image/gif"
        }
        with open(path, "rb") as f:
            b64_data = base64.b64encode(f.read()).decode("utf-8")
            parts.append({
                "inline_data": {
                    "mime_type": mime_map.get(ext, "image/jpeg"),
                    "data": b64_data
                }
            })
    # 2. PDF
    elif ext == ".pdf":
        with open(path, "rb") as f:
            b64_data = base64.b64encode(f.read()).decode("utf-8")
            parts.append({
                "inline_data": {
                    "mime_type": "application/pdf",
                    "data": b64_data
                }
            })
    # 3. Excel
    elif ext in [".xlsx", ".xls"]:
        try:
            import openpyxl
            wb = openpyxl.load_workbook(path, data_only=True)
            res = [f"【用户上传了 Excel 表格：{filename}】"]
            for sheet in wb.sheetnames[:5]: # Up to 5 sheets
                ws = wb[sheet]
                res.append(f"\n--- 工作表: {sheet} ---")
                rows = list(ws.iter_rows(values_only=True))[:30] # Top 30 rows
                for r in rows:
                    row_str = " | ".join([str(v) if v is not None else "" for v in r])
                    if row_str.strip():
                        res.append(f"| {row_str} |")
            parts.append({"text": "\n".join(res)})
        except Exception as e:
            parts.append({"text": f"【用户上传了 Excel 表格 {filename}，但解析失败：{e}】"})
    # 4. Word
    elif ext in [".docx"]:
        try:
            import docx
            doc = docx.Document(path)
            res = [f"【用户上传了 Word 文档：{filename}】\n文档正文提取内容如下："]
            for p in doc.paragraphs:
                if p.text.strip():
                    res.append(p.text.strip())
            for t in doc.tables:
                for row in t.rows:
                    res.append("| " + " | ".join([c.text.strip() for c in row.cells]) + " |")
            parts.append({"text": "\n".join(res[:100])})
        except Exception as e:
            parts.append({"text": f"【用户上传了 Word 文档 {filename}，但解析失败：{e}】"})
    # 5. Text / CSV / JSON
    elif ext in [".txt", ".csv", ".json", ".md"]:
        try:
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read(20000) # Up to 20k characters
                parts.append({"text": f"【用户上传了文件 {filename}，内容如下】：\n{content}"})
        except Exception as e:
            parts.append({"text": f"【用户上传了文件 {filename}，读取失败：{e}】"})
    else:
        parts.append({"text": f"【用户上传了文件：{filename}】"})

    return parts

def call_gemini_api(payload: dict) -> dict:
    """
    Calls Gemini API with automatic failover across candidate models.
    """
    last_error = None
    headers = {"Content-Type": "application/json"}

    for model in CANDIDATE_MODELS:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_API_KEY}"
        try:
            resp = requests.post(url, headers=headers, json=payload, timeout=60)
            if resp.status_code == 200:
                return resp.json()
            
            # If rate limit (429) or high demand (503) or not found (404), try next model
            print(f"⚠️ Model {model} returned status {resp.status_code}: {resp.text[:150]}")
            last_error = f"Model {model} error ({resp.status_code}): {resp.text[:200]}"
            if resp.status_code in [400, 401, 403]:
                # Argument error or auth error - don't blindly loop if invalid argument
                print(f"❌ Gemini Bad Request Detail: {resp.text}")
                # Still try other models once, as some preview models have different schema quirks
                continue
        except requests.exceptions.Timeout:
            print(f"⚠️ Model {model} timed out (60s), trying next fallback model...")
            last_error = f"Model {model} request timed out"
            continue
        except Exception as ex:
            print(f"⚠️ Model {model} network error: {ex}")
            last_error = str(ex)
            continue

    raise RuntimeError(f"All candidate models failed. Last error: {last_error}")

def execute_tool_call(func_name: str, args: dict) -> dict:
    """Executes the function called by Gemini"""
    if func_name == "create_excel":
        filename = args.get("filename", "表格.xlsx")
        sheets_data = args.get("sheets_data", [])
        result = create_styled_excel(filename=filename, sheets_data=sheets_data)
        return result
    elif func_name == "create_word":
        filename = args.get("filename", "文档.docx")
        title = args.get("title", "未命名文档")
        subtitle = args.get("subtitle", "")
        sections = args.get("sections", [])
        result = create_styled_word(filename=filename, title=title, subtitle=subtitle, sections=sections)
        return result
    else:
        raise ValueError(f"Unknown tool: {func_name}")

def call_doubao_api(
    user_prompt: str,
    media_files: Optional[List[Dict[str, Any]]] = None,
    chat_history: Optional[List[Dict[str, Any]]] = None,
    custom_endpoint: Optional[str] = None
) -> Dict[str, Any]:
    """Calls Volcengine Ark Doubao LLM API with OpenAI-compatible tool calling."""
    doubao_key = os.getenv("DOUBAO_API_KEY", "")
    endpoint = custom_endpoint or os.getenv("DOUBAO_MODEL_ENDPOINT") or "doubao-1-5-pro-32k-250115"
    
    url = "https://ark.cn-beijing.volces.com/api/v3/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {doubao_key}"
    }

    messages = [
        {"role": "system", "content": SYSTEM_INSTRUCTION}
    ]

    if chat_history:
        for item in chat_history:
            text = item.get("text", "")
            if text.startswith("⚠️") or not text.strip():
                continue
            role = "user" if item.get("role") == "user" else "assistant"
            messages.append({"role": role, "content": text})

    # Prepare user content (handle text and any uploaded file extractions)
    user_content_parts = []
    if media_files:
        for m in media_files:
            file_parts = parse_uploaded_file(m)
            for p in file_parts:
                if "text" in p:
                    user_content_parts.append(p["text"])
                elif "inline_data" in p:
                    mime = p["inline_data"].get("mime_type", "")
                    user_content_parts.append(f"[附带 {m.get('filename', '文件')} 提取需求]")
    
    if user_prompt:
        user_content_parts.append(user_prompt)
    elif not user_content_parts:
        user_content_parts.append("你好")

    messages.append({
        "role": "user",
        "content": "\n\n".join(user_content_parts)
    })

    payload = {
        "model": endpoint,
        "messages": messages,
        "tools": DOUBAO_TOOLS
    }

    try:
        resp = requests.post(url, headers=headers, json=payload, timeout=120)
        if resp.status_code == 200:
            data = resp.json()
            choice = data["choices"][0]
            msg = choice.get("message", {})
            content = msg.get("content") or ""
            tool_calls = msg.get("tool_calls") or []

            generated_files = []
            if tool_calls:
                for tc in tool_calls:
                    fn_name = tc.get("function", {}).get("name")
                    fn_args_raw = tc.get("function", {}).get("arguments", "{}")
                    try:
                        fn_args = json.loads(fn_args_raw)
                    except Exception:
                        fn_args = {}
                    file_result = execute_tool_call(fn_name, fn_args)
                    if file_result:
                        generated_files.append(file_result)

                file_summary = "\n\n" + "\n".join([f"- **{f['filename']}**（{f['file_type'].upper()} 文档）" for f in generated_files]) + "\n\n可在下方卡片直接点击下载！"
                if not content.strip():
                    content = f"已使用**豆包大模型**为您生成文件：{file_summary}"
                else:
                    content = f"{content.strip()}{file_summary}"

            return {
                "text": content,
                "generated_files": generated_files,
                "model_used": "doubao"
            }

        err_body = resp.text
        if "NoAvailableModel" in err_body:
            return {
                "text": "⚠️ **豆包接入点提示：接入点尚未绑定可用模型 (NoAvailableModel)**\n\n已成功连接您的接入点 `ep-20261014150717-s42n7`！但火山引擎返回该接入点暂无可用模型实例。\n\n**解决方法（在控制台点一下即可）**：\n1. 打开 [火山引擎方舟控制台](https://console.volcengine.com/ark) → **在线推理** → **接入点管理**\n2. 找到 `ep-20261014150717-s42n7`，查看右侧「模型」列是否为空，或点击进入详情\n3. 点击 **「添加模型」**，选择 **Doubao-1.5-pro** 或 **Doubao-lite** 并保存\n4. 确认接入点状态显示为 **「运行中」** 即可！",
                "generated_files": [],
                "model_used": "doubao"
            }
        elif "InvalidEndpointOrModel.NotFound" in err_body or "ModelNotOpen" in err_body:
            return {
                "text": f"⚠️ **豆包大模型 API Key 验证通过，但当前账号尚未配置接入点 ID (Endpoint ID)**\n\n您的 API Key 已成功连接火山引擎方舟平台！\n\n在火山引擎中调用模型需绑定一个推理接入点：\n1. 访问 [火山引擎方舟控制台](https://console.volcengine.com/ark)\n2. 进入 **在线推理** -> **接入点管理** -> 点击 **创建接入点**\n3. 选择 **Doubao-1.5-pro** 或 **Doubao-lite** 模型（新用户免费赠送50万Token）\n4. 将生成的接入点 ID 填入后即可直接使用！",
                "generated_files": [],
                "model_used": "doubao"
            }
        else:
            return {
                "text": f"⚠️ 豆包接口返回异常 ({resp.status_code}): {err_body[:200]}",
                "generated_files": [],
                "model_used": "doubao"
            }
    except Exception as e:
        return {
            "text": f"⚠️ 请求豆包大模型失败: {str(e)}",
            "generated_files": [],
            "model_used": "doubao"
        }

class OfficeAgent:
    def __init__(self):
        pass

    def run(
        self,
        user_prompt: str,
        media_files: Optional[List[Dict[str, Any]]] = None,
        chat_history: Optional[List[Dict[str, Any]]] = None,
        model_provider: str = "gemini",
        doubao_endpoint: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Runs the Office Agent loop with multi-model support:
        - If model_provider == 'doubao': calls Volcengine Ark Doubao API
        - If model_provider == 'gemini': calls Google Gemini API with fallback
        """
        if model_provider and model_provider.lower() == "doubao":
            return call_doubao_api(
                user_prompt=user_prompt,
                media_files=media_files,
                chat_history=chat_history,
                custom_endpoint=doubao_endpoint
            )

        # Default: Gemini execution flow
        parts = []

        # 1. Process and attach media / files
        if media_files:
            for m in media_files:
                file_parts = parse_uploaded_file(m)
                parts.extend(file_parts)

        # 2. Add text prompt
        if user_prompt:
            parts.append({"text": user_prompt})
        elif not parts:
            parts.append({"text": "你好"})

        # Build contents (including history if present)
        contents = []
        if chat_history:
            for item in chat_history:
                # Skip error messages from history
                text = item.get("text", "")
                if text.startswith("⚠️") or not text.strip():
                    continue
                role = "user" if item.get("role") == "user" else "model"
                contents.append({
                    "role": role,
                    "parts": [{"text": text}]
                })
        
        contents.append({
            "role": "user",
            "parts": parts
        })

        payload = {
            "contents": contents,
            "tools": AGENT_TOOLS_DECLARATION,
            "system_instruction": {
                "parts": [{"text": SYSTEM_INSTRUCTION}]
            }
        }

        # Step 1: Call Gemini
        result = call_gemini_api(payload)
        
        candidates = result.get("candidates", [])
        if not candidates:
            return {
                "text": "抱歉，未能获取到有效回复，请重试。",
                "generated_files": []
            }
        
        candidate = candidates[0]
        content_parts = candidate.get("content", {}).get("parts", [])
        
        generated_files = []
        model_text = ""
        function_calls = []

        for p in content_parts:
            if "text" in p:
                model_text += p["text"]
            if "functionCall" in p:
                function_calls.append(p["functionCall"])

        # Step 2: Handle function calls if any
        if function_calls:
            for f_call in function_calls:
                f_name = f_call.get("name")
                f_args = f_call.get("args", {})
                try:
                    tool_res = execute_tool_call(f_name, f_args)
                    generated_files.append(tool_res)
                except Exception as e:
                    print(f"Error executing tool {f_name}: {e}")

            # Send tool execution result to Gemini to get a natural conversational summary
            tool_summary_prompt = "我已经成功生成了以下办公文件：\n"
            for gf in generated_files:
                tool_summary_prompt += f"- 文件名：{gf['filename']} (类型：{gf['file_type']})\n"
            tool_summary_prompt += "请针对你生成的文件结构、包含的关键数据和主要亮点，向用户进行简要汇报与说明。"

            followup_payload = {
                "contents": contents + [
                    {
                        "role": "model",
                        "parts": content_parts
                    },
                    {
                        "role": "user",
                        "parts": [{"text": tool_summary_prompt}]
                    }
                ],
                "system_instruction": {
                    "parts": [{"text": SYSTEM_INSTRUCTION}]
                }
            }

            try:
                followup_res = call_gemini_api(followup_payload)
                f_candidates = followup_res.get("candidates", [])
                if f_candidates:
                    f_parts = f_candidates[0].get("content", {}).get("parts", [])
                    f_text = "".join([p["text"] for p in f_parts if "text" in p])
                    if f_text:
                        model_text = f_text
            except Exception as ex:
                print(f"Followup summary failed, using default text: {ex}")
                if not model_text:
                    model_text = "已成功为您生成相关办公文件，您可以在下方直接下载查看！"

        return {
            "text": model_text or "已为您完成处理。",
            "generated_files": generated_files,
            "model_used": "gemini"
        }

agent_instance = OfficeAgent()
