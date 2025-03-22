from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import chromadb
from chromadb.config import Settings
import uvicorn

app = FastAPI()

# ChromaDB 클라이언트 초기화
client = chromadb.Client(Settings(
    persist_directory="./chroma_db",
    anonymized_telemetry=False
))

# 컬렉션 가져오기 또는 생성
try:
    collection = client.get_collection("hospital_info")
except:
    collection = client.create_collection(
        name="hospital_info",
        metadata={"hnsw:space": "cosine"}
    )

class QueryRequest(BaseModel):
    query_texts: List[str]
    n_results: int = 5

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

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 