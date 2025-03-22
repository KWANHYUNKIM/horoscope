const { ChromaClient } = require('chromadb');
const { OpenAIEmbeddings } = require('@langchain/openai');
const { Hospital } = require('../models/hospital');

class VectorDBService {
  constructor() {
    this.client = new ChromaClient();
    this.collection = null;
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: 'text-embedding-3-small'
    });
  }

  async ensureCollection() {
    if (!this.collection) {
      try {
        // 기존 컬렉션이 있는지 확인
        const collections = await this.client.listCollections();
        const existingCollection = collections.find(c => c.name === 'hospitals');
        
        if (existingCollection) {
          this.collection = await this.client.getCollection('hospitals');
        } else {
          // 새로운 컬렉션 생성
          this.collection = await this.client.createCollection({
            name: 'hospitals',
            metadata: { 'hnsw:space': 'cosine' }
          });
        }
      } catch (error) {
        console.error('컬렉션 초기화 실패:', error);
        throw error;
      }
    }
    return this.collection;
  }

  async initialize() {
    try {
      // 기존 컬렉션이 있다면 삭제
      try {
        await this.client.deleteCollection('hospitals');
      } catch (error) {
        console.log('기존 컬렉션이 없습니다.');
      }

      // 새로운 컬렉션 생성
      this.collection = await this.client.createCollection({
        name: 'hospitals',
        metadata: { 'hnsw:space': 'cosine' }
      });

      console.log('벡터 DB 초기화 완료');
    } catch (error) {
      console.error('벡터 DB 초기화 실패:', error);
      throw error;
    }
  }

  async createHospitalEmbeddings() {
    try {
      await this.ensureCollection();
      
      // 모든 병원 데이터 가져오기
      const hospitals = await Hospital.find({});
      console.log(`총 ${hospitals.length}개의 병원 데이터 처리 시작`);

      // 병원 정보를 텍스트로 변환
      const documents = hospitals.map(hospital => ({
        id: hospital.ykiho,
        text: `${hospital.yadmNm}은(는) ${hospital.addr}에 위치한 ${hospital.clCdNm}입니다. 
        진료과목: ${hospital.dgsbjtCdNm}
        운영시간: ${hospital.hospUrl}
        전화번호: ${hospital.telno}
        응급실운영여부: ${hospital.eryn === 'Y' ? '운영' : '미운영'}
        입원실운영여부: ${hospital.hvcrYyn === 'Y' ? '운영' : '미운영'}
        ${hospital.hospInfo || ''}`,
        metadata: {
          name: hospital.yadmNm,
          address: hospital.addr,
          type: hospital.clCdNm,
          departments: hospital.dgsbjtCdNm,
          phone: hospital.telno,
          hasER: hospital.eryn === 'Y',
          hasWard: hospital.hvcrYyn === 'Y'
        }
      }));

      // 벡터 임베딩 생성 및 저장
      for (const doc of documents) {
        const embedding = await this.embeddings.embedQuery(doc.text);
        await this.collection.add({
          ids: [doc.id],
          embeddings: [embedding],
          metadatas: [doc.metadata],
          documents: [doc.text]
        });
      }

      console.log('병원 데이터 벡터화 완료');
    } catch (error) {
      console.error('병원 데이터 벡터화 실패:', error);
      throw error;
    }
  }

  async searchSimilarHospitals(query, limit = 5) {
    try {
      await this.ensureCollection();
      
      const queryEmbedding = await this.embeddings.embedQuery(query);
      const results = await this.collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: limit
      });

      return results;
    } catch (error) {
      console.error('유사 병원 검색 실패:', error);
      throw error;
    }
  }
}

module.exports = new VectorDBService(); 