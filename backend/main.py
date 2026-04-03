import os
import json
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv
import requests
from pydantic import BaseModel

from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document

# Load environment variables
load_dotenv()

app = FastAPI(title="iM Rookie API", description="Internal AI Agent Backend MVP")

# 정적 파일 서빙 (MRO 비품몰 데모 페이지)
BASE_DIR_STATIC = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
if os.path.exists(BASE_DIR_STATIC):
    app.mount("/static", StaticFiles(directory=BASE_DIR_STATIC), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for RAG
vectorstore = None
llm = None
DEV_MODE = os.getenv("DEV_MODE", "false").lower() == "true"

# DEV_MODE용 부서별 목업 퀴즈
DEV_QUIZZES = {
    "IT": {"question": "[DEV_MODE] IT 보안 정책상 비밀번호 변경 주기는?", "options": ["30일", "60일", "90일", "180일"], "answer": 2, "explanation": "보안 정책에 따라 90일마다 변경해야 합니다."},
    "HR": {"question": "[DEV_MODE] 연차 신청은 며칠 전에 해야 하나요?", "options": ["1일", "3일", "5일", "7일"], "answer": 0, "explanation": "인사 규정상 1일 전에 신청해야 합니다."},
    "Sales": {"question": "[DEV_MODE] 영업 보고서 제출 주기는?", "options": ["일간", "주간", "월간", "분기"], "answer": 1, "explanation": "영업팀은 매주 주간 보고서를 제출합니다."},
    "Compliance": {"question": "[DEV_MODE] 내부 감사는 연 몇 회 실시하나요?", "options": ["1회", "2회", "4회", "12회"], "answer": 1, "explanation": "준법감시 규정상 반기 1회, 연 2회 실시합니다."},
    "Marketing": {"question": "[DEV_MODE] 마케팅 예산 집행 시 결재선은?", "options": ["팀장", "팀장→부장", "팀장→부장→임원", "임원"], "answer": 1, "explanation": "100만원 이상은 팀장→부장 결재가 필요합니다."},
    "Strategy": {"question": "[DEV_MODE] 전략기획부의 중장기 경영계획 수립 주기는?", "options": ["1년", "3년", "5년", "10년"], "answer": 2, "explanation": "중장기 경영계획은 통상 5개년 단위로 수립하며 매년 롤링 업데이트합니다."},
}

def init_rag():
    global vectorstore, llm

    if DEV_MODE:
        print("🛠️  DEV_MODE=true — Gemini API 초기화 생략 (목업 데이터 사용)")
        return

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Warning: GEMINI_API_KEY is not set. RAG pipeline cannot be initialized.")
        return
        
    embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001", google_api_key=api_key)
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.7, google_api_key=api_key)
    
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(BASE_DIR, "data")
    documents = []
    
    file_dept_map = {
        "it_rules.txt": "IT",
        "sales_rules.txt": "Sales",
        "compliance_rules.txt": "Compliance",
        "hr_rules.txt": "HR",
        "marketing_rules.txt": "Marketing",
        "strategy_rules.txt": "Strategy",
    }
    
    if os.path.exists(data_dir):
        for filename in os.listdir(data_dir):
            if filename in file_dept_map:
                filepath = os.path.join(data_dir, filename)
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()
                    
                doc = Document(
                    page_content=content, 
                    metadata={"source": filename, "department": file_dept_map[filename]}
                )
                documents.append(doc)
    
    if documents:
        # Create Chroma vectorstore
        vectorstore = Chroma.from_documents(documents, embeddings, collection_name="im_rookie_rules")
        print(f"✅ RAG initialized with {len(documents)} documents.")

@app.on_event("startup")
async def startup_event():
    init_rag()

@app.get("/api/quiz")
async def generate_quiz(department: str = Query(..., description="Department name (e.g. IT, HR, Compliance, Marketing, Sales)")):
    global vectorstore, llm

    # DEV_MODE: Gemini 미호출, 목업 반환
    if DEV_MODE:
        print(f"🛠️  DEV_MODE=true — {department} 부서 목업 퀴즈 반환")
        quiz = DEV_QUIZZES.get(department, DEV_QUIZZES["IT"]).copy()
        quiz["source_department"] = department
        return quiz

    if not vectorstore or not llm:
        raise HTTPException(status_code=500, detail="RAG system not initialized. Check GEMINI_API_KEY.")
        
    # Retrieve documents matching the queried department using metadata filtering
    results = vectorstore.similarity_search(
        query="규정 정책 안내", 
        k=3, 
        filter={"department": department}
    )
    
    if not results:
        raise HTTPException(status_code=404, detail=f"No knowledge base found for department: {department}")
        
    context = "\n\n".join([doc.page_content for doc in results])
    
    prompt = f"""
당신은 사내 규정 퀴즈 출제 위원입니다.
다음 [{department}] 부서의 규정 내용을 바탕으로 4지선다형 퀴즈 1개를 생성해주세요.
반드시 아래의 JSON 포맷으로만 응답해야 합니다. 다른 사족은 절대 포함하지 마세요.

부서: {department}
사내 규정 내용:
{context}

응답 포맷 (JSON):
{{
  "question": "규정과 관련된 문제",
  "options": [
    "1번 보기",
    "2번 보기",
    "3번 보기",
    "4번 보기"
  ],
  "answer": 정답의_인덱스(0부터 3사이의 정수),
  "explanation": "정답인 이유와 규정 설명"
}}
"""
    try:
        response = llm.invoke(prompt)
        content = response.content
        
        # Clean up Markdown JSON wrapper if it exists
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].strip()
            
        quiz_data = json.loads(content)
        quiz_data["source_department"] = department
        return quiz_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"퀴즈 생성 실패: {str(e)}")


class MRORequest(BaseModel):
    item_name: str = "A4용지 박스"
    quantity: int = 1
    user_name: str = "루키"

@app.post("/api/action/mro")
async def request_mro(
    department: str = Query(None, description="부서명"),
    request: MRORequest = None
):
    """
    Playwright를 사용한 시각적 RPA 자동화.
    headless=False로 실행하여 사용자 화면에 브라우저가 직접 보입니다.
    """
    import asyncio
    from playwright.async_api import async_playwright

    # 기본값 설정
    if request is None:
        request = MRORequest()

    screenshot_path = os.path.join(BASE_DIR_STATIC, "mro_result.png")
    mro_mall_url = "http://localhost:8000/mro-mall"

    try:
        async with async_playwright() as p:
            # ✅ headless=False: 사용자 화면에 브라우저 창이 직접 열림
            browser = await p.chromium.launch(headless=False, slow_mo=300)
            page = await browser.new_page(viewport={"width": 1200, "height": 800})

            # 1. 비품몰 접속
            print(f"🌐 [RPA] 사내 비품몰 접속 중... ({mro_mall_url})")
            await page.goto(mro_mall_url)
            await page.wait_for_load_state("networkidle")
            await asyncio.sleep(1)  # 사람처럼 보이게 1초 대기

            # 2. 'A4용지 장바구니 담기' 클릭
            print("🛒 [RPA] A4용지 장바구니 담기 클릭")
            await page.click("#btnCart")
            await asyncio.sleep(1)  # 1초 대기

            # 3. '결재 상신하기' 클릭
            print("📋 [RPA] 결재 상신하기 클릭")
            # JavaScript Alert 승인 핸들러 등록 (클릭 전에 먼저 등록해야 함)
            page.on("dialog", lambda dialog: asyncio.ensure_future(dialog.accept()))
            await page.click("#btnSubmit")
            await asyncio.sleep(1)  # Alert 처리 및 모달 표시 대기

            # 4. 최종 완료 스크린샷 캡처
            print("📸 [RPA] 완료 스크린샷 캡처")
            await page.screenshot(path=screenshot_path, full_page=True)

            # 5. 브라우저 닫기
            await asyncio.sleep(0.5)
            await browser.close()

        print(f"✅ [RPA] MRO 자동화 완료 - 스크린샷: {screenshot_path}")

        # Slack 알림 (설정된 경우)
        webhook_url = os.getenv("SLACK_WEBHOOK_URL")
        message = f"📦 [MRO 비품 신청] {request.user_name}님이 {request.item_name} ({request.quantity}개) 비품을 RPA로 자동 신청했습니다."
        if webhook_url and webhook_url != "your_slack_webhook_here":
            try:
                requests.post(webhook_url, json={"text": message}, headers={"Content-Type": "application/json"})
            except Exception:
                pass

        return {
            "status": "success",
            "message": f"RPA 실행 완료: {request.item_name} {request.quantity}건 결재 상신 완료",
            "screenshot_url": "/static/mro_result.png",
            "department": department
        }

    except Exception as e:
        print(f"❌ [RPA] 오류 발생: {str(e)}")
        return {
            "status": "error",
            "message": f"RPA 실행 중 오류가 발생했습니다: {str(e)}"
        }


@app.get("/mro-mall")
async def mro_mall():
    """데모용 사내 비품몰 페이지"""
    html_path = os.path.join(BASE_DIR_STATIC, "mro_mock.html")
    return FileResponse(html_path, media_type="text/html")
