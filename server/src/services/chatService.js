const { ChatOpenAI } = require('@langchain/openai');
const { HumanMessage, SystemMessage } = require('@langchain/core/messages');
const { OpenAIEmbeddings } = require('@langchain/openai');
const { Hospital } = require('../models/hospital');
const { HospitalSubject } = require('../models/hospitalSubject');
const { HospitalTime } = require('../models/hospitalTime');
const { Redis } = require('ioredis');

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// 시스템 프롬프트 정의
const INTENT_CLASSIFICATION_PROMPT = `당신은 사용자의 의도를 분류하는 AI 어시스턴트입니다.
사용자의 메시지를 다음 4가지 의도 중 하나로 분류해주세요:
1. HOSPITAL_SEARCH: 병원 검색 관련 질문
2. SYMPTOM_INQUIRY: 증상 문의
3. GENERAL_INQUIRY: 일반적인 문의
4. END_CONVERSATION: 대화 종료 의도

응답은 의도 코드만 반환해주세요.`;

const HOSPITAL_SEARCH_PROMPT = `당신은 병원 검색을 도와주는 AI 어시스턴트입니다.
사용자의 질문에 대해 친절하고 전문적으로 답변해주세요.
병원 정보는 제공된 데이터를 기반으로 답변해주세요.
만약 검색 결과가 없다면 "죄송합니다. 해당 지역의 병원 정보를 찾을 수 없습니다."라고 답변해주세요.`;

const SYMPTOM_INQUIRY_PROMPT = `당신은 의료 상담을 도와주는 AI 어시스턴트입니다.
사용자의 증상에 대해 공감하고, 적절한 의료 기관을 추천해주세요.
단, 진단이나 처방은 하지 마세요.`;

const GENERAL_INQUIRY_PROMPT = `당신은 친절한 AI 어시스턴트입니다.
사용자의 일반적인 질문에 대해 친절하게 답변해주세요.`;

class ChatService {
  constructor() {
    this.llm = new ChatOpenAI({
      modelName: 'gpt-3.5-turbo',
      temperature: 0.7,
      openAIApiKey: process.env.OPENAI_API_KEY
    });
  }

  // 사용자 세션 저장
  async saveUserSession(userId, sessionData) {
    try {
      await redis.set(`chat:${userId}`, JSON.stringify(sessionData));
    } catch (error) {
      console.error('세션 저장 중 오류:', error);
    }
  }

  // 사용자 세션 조회
  async getUserSession(userId) {
    try {
      const sessionData = await redis.get(`chat:${userId}`);
      return sessionData ? JSON.parse(sessionData) : null;
    } catch (error) {
      console.error('세션 조회 중 오류:', error);
      return null;
    }
  }

  // 의도 분류
  async classifyIntent(message) {
    try {
      const response = await this.llm.call([
        new SystemMessage(INTENT_CLASSIFICATION_PROMPT),
        new HumanMessage(message)
      ]);
      return response.content.trim();
    } catch (error) {
      console.error('의도 분류 중 오류:', error);
      return 'GENERAL_INQUIRY';
    }
  }

  // 병원 검색
  async searchHospitals(query) {
    try {
      // 지역명 추출 (예: "서울", "부산" 등)
      const locationMatch = query.match(/(서울|부산|대구|인천|광주|대전|울산|제주|경기|강원|충북|충남|전북|전남|경북|경남)/);
      const location = locationMatch ? locationMatch[1] : null;

      // 검색 조건 구성
      const searchQuery = {};
      if (location) {
        searchQuery.sidoNm = location;
      }

      // 병원 검색
      const hospitals = await Hospital.find(searchQuery).limit(5);
      return hospitals;
    } catch (error) {
      console.error('병원 검색 중 오류:', error);
      return [];
    }
  }

  // 응답 생성
  async generateResponse(userId, message) {
    try {
      const session = await this.getUserSession(userId) || {
        history: [],
        currentIntent: null,
        lastSearchResults: null
      };

      // 의도 분류
      const intent = await this.classifyIntent(message);
      session.currentIntent = intent;

      let response;
      switch (intent) {
        case 'HOSPITAL_SEARCH':
          const hospitals = await this.searchHospitals(message);
          session.lastSearchResults = hospitals;
          
          response = await this.llm.call([
            new SystemMessage(HOSPITAL_SEARCH_PROMPT),
            new HumanMessage(`질문: ${message}\n\n검색된 병원 정보:\n${JSON.stringify(hospitals, null, 2)}`)
          ]);
          break;

        case 'SYMPTOM_INQUIRY':
          response = await this.llm.call([
            new SystemMessage(SYMPTOM_INQUIRY_PROMPT),
            new HumanMessage(message)
          ]);
          break;

        case 'GENERAL_INQUIRY':
          response = await this.llm.call([
            new SystemMessage(GENERAL_INQUIRY_PROMPT),
            new HumanMessage(message)
          ]);
          break;

        case 'END_CONVERSATION':
          response = "대화를 종료합니다. 다른 도움이 필요하시다면 언제든 말씀해주세요.";
          break;

        default:
          response = "죄송합니다. 질문을 이해하지 못했습니다. 다시 말씀해주시겠어요?";
      }

      // 대화 이력 업데이트
      session.history.push({
        role: 'user',
        content: message
      });
      session.history.push({
        role: 'assistant',
        content: response.content || response
      });

      // 세션 저장
      await this.saveUserSession(userId, session);

      return {
        message: response.content || response,
        intent,
        hospitals: session.lastSearchResults
      };
    } catch (error) {
      console.error('응답 생성 중 오류:', error);
      return {
        message: "죄송합니다. 현재 서비스에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
        intent: 'ERROR',
        hospitals: []
      };
    }
  }

  // 세션 초기화
  async resetSession(userId) {
    try {
      await redis.del(`chat:${userId}`);
      return { message: "대화가 초기화되었습니다." };
    } catch (error) {
      console.error('세션 초기화 중 오류:', error);
      return { message: "세션 초기화 중 오류가 발생했습니다." };
    }
  }
}

module.exports = new ChatService(); 