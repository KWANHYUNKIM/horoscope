const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const { Client } = require('@elastic/elasticsearch');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const client = new Client({
  node: 'http://localhost:9200'
});

// 병원 검색 관련 키워드
const HOSPITAL_KEYWORDS = [
  '병원', '의원', '치과', '한의원', '내과', '외과', '소아과', '정형외과',
  '이비인후과', '안과', '피부과', '산부인과', '응급실', '야간', '주말',
  '진료', '검진', '처방', '처방전', '진단', '상담', '예약'
];

// 지역 키워드
const REGION_KEYWORDS = [
  '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
  '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'
];

// 메시지가 병원 검색 관련인지 확인
const isHospitalSearch = (message) => {
  return HOSPITAL_KEYWORDS.some(keyword => message.includes(keyword));
};

// 메시지에서 지역 추출
const extractRegion = (message) => {
  return REGION_KEYWORDS.find(region => message.includes(region)) || null;
};

// 두 지점 간의 거리 계산 (Haversine 공식)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // 지구의 반경 (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// 병원 검색 함수
const searchHospitals = async (query, coordinates = null, distance = 0.5) => {
  try {
    // 검색어에서 키워드 추출
    const keywords = query.toLowerCase().split(' ');
    const departmentKeywords = ['내과', '외과', '소아과', '치과', '한의원', '정형외과', '이비인후과', '안과', '피부과', '산부인과'];
    const serviceKeywords = ['야간', '주말', '응급', '영업중'];
    
    // 검색 조건 파싱
    const searchConditions = {
      departments: departmentKeywords.filter(keyword => keywords.includes(keyword)),
      services: serviceKeywords.filter(keyword => keywords.includes(keyword)),
      distance: keywords.includes('500미터') ? 0.5 : 
                keywords.includes('1킬로') ? 1 : 
                keywords.includes('2킬로') ? 2 : 
                keywords.includes('3킬로') ? 3 : 5,
      isOpen: keywords.includes('영업중')
    };

    // Elasticsearch 쿼리 구성
    const must = [];
    const should = [];
    const filter = [];

    // 진료과목 검색
    if (searchConditions.departments.length > 0) {
      should.push({
        terms: {
          'major.keyword': searchConditions.departments
        }
      });
    }

    // 거리 검색
    if (coordinates) {
      filter.push({
        geo_distance: {
          distance: `${searchConditions.distance}km`,
          location: {
            lat: parseFloat(coordinates.latitude),
            lon: parseFloat(coordinates.longitude)
          }
        }
      });
    }

    // 영업중 검색
    if (searchConditions.isOpen) {
      const now = new Date();
      const day = now.getDay();
      const time = now.getHours() * 100 + now.getMinutes();
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day];

      filter.push({
        script: {
          script: {
            source: `
              def schedule = doc['schedule.${dayName}'];
              if (schedule.empty) return false;
              def openTime = schedule.openTime.value;
              def closeTime = schedule.closeTime.value;
              if (openTime == '-' || closeTime == '-') return false;
              def currentTime = params.time;
              return currentTime >= Integer.parseInt(openTime) && currentTime <= Integer.parseInt(closeTime);
            `,
            params: { time }
          }
        }
      });
    }

    // Elasticsearch 검색 실행
    const response = await client.search({
      index: 'hospitals',
      body: {
        query: {
          bool: {
            must,
            should,
            filter,
            minimum_should_match: should.length > 0 ? 1 : 0
          }
        },
        size: 5,
        sort: coordinates ? [
          {
            _geo_distance: {
              location: {
                lat: parseFloat(coordinates.latitude),
                lon: parseFloat(coordinates.longitude)
              },
              order: 'asc',
              unit: 'km'
            }
          }
        ] : undefined
      }
    });

    const hospitals = response.hits.hits.map(hit => hit._source);

    // OpenAI API 호출
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `당신은 병원 검색 전문가입니다. 다음 지침에 따라 응답해주세요:

1. 검색 결과를 명확하고 구조화된 형태로 제공하세요.
2. 각 병원의 주요 정보(이름, 주소, 연락처, 진료과목)를 포함하세요.
3. 운영시간 정보가 있다면 함께 표시하세요.
4. 거리 정보가 있다면 함께 표시하세요.
5. 응답은 한국어로 작성하세요.
6. HTML 형식으로 응답하되, 스타일은 포함하지 마세요.

예시 형식:
<div class="hospital-info">
  <h3>병원명</h3>
  <p>주소: [주소]</p>
  <p>연락처: [전화번호]</p>
  <p>진료과목: [진료과목]</p>
  <p>운영시간: [운영시간]</p>
  <p>거리: [거리]km</p>
</div>`
        },
        {
          role: "user",
          content: `검색어: ${query}
위도: ${coordinates?.latitude}
경도: ${coordinates?.longitude}
검색 조건: ${JSON.stringify(searchConditions)}

검색된 병원 정보:
${JSON.stringify(hospitals, null, 2)}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('병원 검색 오류:', error);
    return '죄송합니다. 병원 검색 중 오류가 발생했습니다.';
  }
};

// 채팅 메시지 처리
router.post('/message', async (req, res) => {
  try {
    const { message, location, coordinates } = req.body;
    
    console.log('=== 서버 요청 정보 ===');
    console.log('시간:', new Date().toLocaleString());
    console.log('메시지:', message);
    console.log('위치:', location);
    console.log('좌표:', coordinates);
    console.log('=====================');

    // 일반 대화인 경우
    if (!isHospitalSearch(message)) {
      const response = {
        type: 'general',
        message: '죄송합니다. 저는 병원 검색만 도와드릴 수 있습니다.',
        suggestions: [
          '내 주변 병원 검색 (예: "내 주변 내과 찾아줘")',
          '지역별 병원 검색 (예: "서울 내과", "대전 치과")',
          '특수 조건 검색 (예: "야간 진료 병원", "주말 진료 치과")'
        ]
      };

      console.log('=== 서버 응답 정보 ===');
      console.log('응답 타입:', response.type);
      console.log('=====================');

      return res.json({
        message: `
          <div class="message bot">
            <div class="message-content" style="padding: 10px; border-radius: 8px; max-width: 80%; word-break: break-word;">
              <div class="answer-section">
                <div class="answer-content">
                  <p>${response.message}</p>
                  <ul>
                    ${response.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        `,
        debug: response
      });
    }

    // 지역 기반 검색인 경우
    const region = extractRegion(message);
    if (region) {
      const response = await client.search({
        index: 'hospitals',
        body: {
          query: {
            term: {
              'region.keyword': region
            }
          },
          size: 5,
          sort: [
            { _score: { order: 'desc' } }
          ]
        }
      });

      const hospitals = response.hits.hits.map(hit => hit._source);
      
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `당신은 ${region} 지역의 병원 검색 전문가입니다. 다음 지침에 따라 응답해주세요:

1. 검색 결과를 명확하고 구조화된 형태로 제공하세요.
2. 각 병원의 주요 정보(이름, 주소, 연락처, 진료과목)를 포함하세요.
3. 운영시간 정보가 있다면 함께 표시하세요.
4. 응답은 한국어로 작성하세요.
5. HTML 형식으로 응답하되, 스타일은 포함하지 마세요.`
          },
          {
            role: "user",
            content: `검색어: ${message}
지역: ${region}

검색된 병원 정보:
${JSON.stringify(hospitals, null, 2)}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      return res.json({
        message: `
          <div class="message bot">
            <div class="message-content" style="padding: 10px; border-radius: 8px; max-width: 80%; word-break: break-word;">
              <div class="answer-section">
                <div class="answer-content">
                  <h2 class="answer-title">${region} 지역 병원 검색 결과</h2>
                  <div class="search-result">
                    ${completion.choices[0].message.content}
                  </div>
                  <div class="notice-section">
                    <h4>안내사항</h4>
                    <ul>
                      <li>응급실이 필요한 경우 119에 연락하세요.</li>
                      <li>방문 전 전화 예약을 권장합니다.</li>
                      <li>운영시간은 변경될 수 있으니 방문 전 확인하세요.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `
      });
    }
    
    // 위치 기반 검색인 경우
    if (coordinates) {
      const searchResult = await searchHospitals(message, coordinates);
      return res.json({
        message: `
          <div class="message bot">
            <div class="message-content" style="padding: 10px; border-radius: 8px; max-width: 80%; word-break: break-word;">
              <div class="answer-section">
                <div class="answer-content">
                  <h2 class="answer-title">내 주변 병원 검색 결과</h2>
                  <div class="search-result">
                    ${searchResult}
                  </div>
                  <div class="notice-section">
                    <h4>안내사항</h4>
                    <ul>
                      <li>응급실이 필요한 경우 119에 연락하세요.</li>
                      <li>방문 전 전화 예약을 권장합니다.</li>
                      <li>운영시간은 변경될 수 있으니 방문 전 확인하세요.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `
      });
    }

    // 위치 정보가 없는 경우
    return res.json({
      message: `
        <div class="message bot">
          <div class="message-content" style="padding: 10px; border-radius: 8px; max-width: 80%; word-break: break-word;">
            <div class="answer-section">
              <div class="answer-content">
                <h2 class="answer-title">위치 정보 필요</h2>
                <p>정확한 병원 검색을 위해서는 위치 정보가 필요합니다. 다음 중 하나를 시도해주세요:</p>
                <ul>
                  <li>위치 정보 제공을 허용해주세요.</li>
                  <li>특정 지역을 지정해주세요 (예: "서울 병원", "대전 내과")</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      `
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    res.status(500).json({
      error: '처리 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router; 