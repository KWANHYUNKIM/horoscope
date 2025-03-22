from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import chromadb
from chromadb.config import Settings
from openai import OpenAI
import os
from dotenv import load_dotenv
from pathlib import Path
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.schema import StrOutputParser
from langchain.schema.runnable import RunnablePassthrough
from fastapi.middleware.cors import CORSMiddleware

# 환경 변수 로드
load_dotenv()

app = FastAPI()

# CORS 미들웨어 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8081"],  # 프론트엔드 주소
    allow_credentials=True,
    allow_methods=["*"],  # 모든 HTTP 메서드 허용
    allow_headers=["*"],  # 모든 헤더 허용
)

# 프로젝트 루트 디렉토리 경로 설정
ROOT_DIR = Path(__file__).parent.parent.parent
CHROMA_DIR = ROOT_DIR / "server/vector_db/chroma_db"

# ChromaDB 클라이언트 초기화
client = chromadb.Client(Settings(
    persist_directory=str(CHROMA_DIR),
    anonymized_telemetry=False,
    is_persistent=True
))

# 컬렉션 가져오기
try:
    collection = client.get_collection("hospital_info")
except:
    # 컬렉션이 없으면 에러를 발생시킴
    raise Exception("hospital_info 컬렉션이 없습니다. 먼저 init_vector_db.py를 실행하여 데이터를 초기화해주세요.")

# OpenAI 클라이언트 초기화
openai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

class QueryRequest(BaseModel):
    query: str
    n_results: int = 4  # 기본값으로 4개의 결과를 반환

class ChatRequest(BaseModel):
    message: str

def create_embedding(text):
    response = openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )
    return response.data[0].embedding

def get_relevant_hospitals(query: str, n_results: int = 4):
    query_embedding = create_embedding(query)
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results
    )
    return results

def format_hospital_info(results):
    formatted_results = []
    for i in range(len(results['ids'][0])):
        formatted_results.append({
            'id': results['ids'][0][i],
            'document': results['documents'][0][i],
            'distance': results['distances'][0][i]
        })
    return formatted_results

@app.post("/api/query")
async def query_hospitals(request: QueryRequest):
    try:
        results = get_relevant_hospitals(request.query, request.n_results)
        return {"results": format_hospital_info(results)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# LangChain 설정
llm = ChatOpenAI(
    model="gpt-4-turbo-preview",
    temperature=0.7
)

prompt = ChatPromptTemplate.from_messages([
    ("system", """당신은 병원 검색을 도와주는 AI 어시스턴트입니다. 
    사용자의 질문에 대해 관련된 병원 정보를 찾아주고, 
    병원에 대한 자세한 설명과 추천을 해주세요.
    
    다음 병원 정보를 참고하여 답변해주세요:
    {hospital_info}
    
    답변은 친근하고 전문적인 톤으로 해주세요."""),
    ("human", "{message}")
])

chain = (
    {"hospital_info": lambda x: format_hospital_info(get_relevant_hospitals(x["message"])), "message": RunnablePassthrough()}
    | prompt
    | llm
    | StrOutputParser()
)

@app.post("/api/chat/send")
async def chat_with_ai(request: ChatRequest):
    try:
        print(f"Received message: {request.message}")
        
        # Vector DB 검색 결과 확인
        hospitals = get_relevant_hospitals(request.message)
        print(f"Found hospitals: {format_hospital_info(hospitals)}")
        
        # LangChain 응답 생성
        response = chain.invoke({"message": request.message})
        print(f"Generated response: {response}")
        
        return {"response": response}
    except Exception as e:
        print(f"Error occurred: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8001)
