const { Redis } = require('ioredis');
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const { Hospital } = require('../models/hospital');
const axios = require('axios');

class ChatService {
  constructor() {
    this.sessionData = {};
  }

  async getSession(userId) {
    try {
      const sessionData = await redis.get(`chat:${userId}`);
      if (!sessionData) {
        return { messages: [] };
      }
      return JSON.parse(sessionData);
    } catch (error) {
      console.error('세션 데이터 조회 실패:', error);
      return { messages: [] };
    }
  }

  async saveSession(userId, sessionData) {
    try {
      await redis.set(`chat:${userId}`, JSON.stringify(sessionData));
    } catch (error) {
      console.error('세션 데이터 저장 실패:', error);
    }
  }

  async resetSession(userId) {
    try {
      await redis.del(`chat:${userId}`);
      return { success: true, message: '채팅 세션이 초기화되었습니다.' };
    } catch (error) {
      console.error('세션 초기화 실패:', error);
      return { success: false, message: '세션 초기화 중 오류가 발생했습니다.' };
    }
  }

  async searchSimilarHospitals(query) {
    try {
      // ChromaDB API 호출
      const response = await axios.post('http://localhost:8000/api/query', {
        query_texts: [query],
        n_results: 5
      });

      return response.data;
    } catch (error) {
      console.error('벡터 검색 실패:', error);
      return null;
    }
  }

  async generateResponse(userId, userMessage) {
    try {
      let sessionData = await this.getSession(userId);
      if (!sessionData.messages) {
        sessionData.messages = [];
      }

      // 사용자 메시지 저장
      sessionData.messages.push({ role: 'user', content: userMessage });

      let response = '';
      let hospitals = [];

      // 병원 검색 관련 키워드 확인
      const searchKeywords = ['병원', '의원', '검색', '찾아'];
      const isSearchQuery = searchKeywords.some(keyword => userMessage.includes(keyword));

      if (isSearchQuery) {
        // 벡터 검색 수행
        const searchResults = await this.searchSimilarHospitals(userMessage);

        if (searchResults && searchResults.documents && searchResults.documents[0]) {
          response = '검색 결과입니다:\n\n';
          searchResults.documents[0].forEach((doc, index) => {
            response += `${doc}\n\n`;
          });
        } else {
          // 벡터 검색 실패 시 일반 검색으로 전환
          hospitals = await Hospital.find({
            $or: [
              { yadmNm: { $regex: userMessage, $options: 'i' } },
              { addr: { $regex: userMessage, $options: 'i' } }
            ]
          }).limit(5);

          if (hospitals.length > 0) {
            response = '검색 결과입니다:\n\n';
            hospitals.forEach(hospital => {
              response += `🏥 ${hospital.yadmNm}\n`;
              response += `📍 주소: ${hospital.addr}\n`;
              if (hospital.dgsbjtCdNm) {
                response += `🏷 진료과목: ${hospital.dgsbjtCdNm}\n`;
              }
              if (hospital.telno) {
                response += `📞 전화번호: ${hospital.telno}\n`;
              }
              response += '\n';
            });
          } else {
            response = '죄송합니다. 검색 결과가 없습니다. 다른 키워드로 다시 검색해보시겠어요?';
          }
        }
      } else {
        response = '병원을 검색하시려면 "병원 찾아줘" 또는 "근처 병원"과 같이 말씀해주세요.';
      }

      // 응답 메시지 저장
      sessionData.messages.push({ role: 'assistant', content: response });
      await this.saveSession(userId, sessionData);

      return {
        success: true,
        message: response,
        hospitals: hospitals
      };
    } catch (error) {
      console.error('응답 생성 실패:', error);
      return {
        success: false,
        message: '죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        hospitals: []
      };
    }
  }
}

module.exports = new ChatService(); 