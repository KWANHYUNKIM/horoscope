from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import chromadb
from chromadb.config import Settings
import uvicorn
import json
import logging
from openai import OpenAI
import os
from dotenv import load_dotenv
from pathlib import Path

# .env 파일 로드
load_dotenv()

# 프로젝트 루트 디렉토리 경로 설정
ROOT_DIR = Path(__file__).parent.parent.parent
CHROMA_DIR = ROOT_DIR / "server/vector_db/chroma_db"

# OpenAI API 키를 환경 변수에서 가져오기
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY가 환경 변수에 설정되어 있지 않습니다.")

# OpenAI 클라이언트 초기화
client_openai = OpenAI(api_key=OPENAI_API_KEY)

def create_embedding(text):
    response = client_openai.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )
    return response.data[0].embedding

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# CORS 미들웨어 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8081"],  # 프론트엔드 주소
    allow_credentials=True,
    allow_methods=["*"],  # 모든 HTTP 메서드 허용
    allow_headers=["*"],  # 모든 헤더 허용
)

# ChromaDB 클라이언트 초기화
client = chromadb.Client(Settings(
    persist_directory=str(CHROMA_DIR),
    anonymized_telemetry=False,
    is_persistent=True
))

# 컬렉션 가져오기 또는 생성
try:
    collection = client.get_collection("hospital_info")
    logger.info(f"컬렉션 크기: {collection.count()}")
except Exception as e:
    logger.error(f"컬렉션 가져오기 실패: {str(e)}")
    collection = client.create_collection(
        name="hospital_info",
        metadata={"hnsw:space": "cosine"}
    )

class QueryRequest(BaseModel):
    query_texts: List[str]
    n_results: int = 5

class ChatMessage(BaseModel):
    message: str
    user_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    status: str = "success"

@app.post("/api/query")
async def query(request: QueryRequest):
    try:
        results = collection.query(
            query_texts=request.query_texts,
            n_results=request.n_results
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat/send", response_model=ChatResponse)
async def send_chat(chat_message: ChatMessage):
    try:
        logger.info(f"받은 메시지: {chat_message.message}")
        
        # 사용자 메시지의 임베딩 생성
        query_embedding = create_embedding(chat_message.message)
        
        # 벡터 DB 검색
        search_results = collection.query(
            query_embeddings=[query_embedding],
            n_results=3
        )
        
        # 검색된 병원 정보들을 하나의 문맥으로 결합
        context = "\n\n".join(search_results['documents'][0]) if search_results['documents'][0] else ""
        
        logger.info("검색된 컨텍스트:")
        logger.info(context)

        if context:
            # OpenAI를 사용하여 자연스러운 응답 생성
            prompt = f"""아래는 사용자의 질문에 관련된 병원 정보입니다:

{context}

사용자 질문: {chat_message.message}

위 정보를 바탕으로 사용자의 질문에 친절하고 자연스럽게 답변해주세요. 
병원 위치, 진료시간, 특징 등 관련 정보를 포함해서 설명해주세요.
답변은 한국어로 해주세요."""

            response = client_openai.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "당신은 병원 정보를 안내해주는 친절한 상담원입니다."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7
            )
            
            response_text = response.choices[0].message.content
            logger.info(f"생성된 응답: {response_text}")
        else:
            response_text = "죄송합니다. 해당하는 병원 정보를 찾을 수 없습니다. 다른 키워드로 검색해보시겠어요?"
            logger.info("검색 결과 없음")

        return ChatResponse(response=response_text)
    except Exception as e:
        logger.error(f"오류 발생: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/collection/info")
async def get_collection_info():
    try:
        # 컬렉션 정보 가져오기
        count = collection.count()
        # 샘플 데이터 가져오기 (처음 5개)
        sample_results = collection.query(
            query_texts=["병원"],
            n_results=5
        )
        
        return {
            "collection_name": "hospital_info",
            "total_documents": count,
            "sample_data": sample_results
        }
    except Exception as e:
        logger.error(f"컬렉션 정보 조회 실패: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    # 시작 시 컬렉션 정보 출력
    logger.info("=== ChromaDB 컬렉션 정보 ===")
    logger.info(f"컬렉션 이름: hospital_info")
    logger.info(f"문서 수: {collection.count()}")
    
    uvicorn.run(app, host="0.0.0.0", port=8001) 