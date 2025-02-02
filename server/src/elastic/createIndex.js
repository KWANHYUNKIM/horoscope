// server/src/elastic/createIndex.js
const client = require('../config/elasticsearch'); // ✅ 클라이언트 가져오기

async function createHospitalIndex() {
  try {
    // 인덱스 존재 여부 확인
    const exists = await client.indices.exists({ index: 'hospitals' });
    if (exists.body) {
      console.log("인덱스 'hospitals' 이미 존재합니다.");
      return;
    }

    // 인덱스 생성
    await client.indices.create({
      index: 'hospitals',
      body: {
        mappings: {
          properties: {
            yadmNm: { type: 'text' },
            addr: { type: 'text' },
            region: { type: 'keyword' },
            subject: { type: 'keyword' },
            major : {type: 'keyword'},
            nightCare: { type: 'boolean' },
            twentyfourCare: { type: 'boolean' },
            weekendCare: { type: 'boolean' },
            location: { type: "geo_point" }
            // 필요한 다른 필드들도 추가
          }
        }
      }
    });

    console.log("인덱스 'hospitals' 생성 완료!");
  } catch (error) {
    console.error("인덱스 생성 오류:", error.meta ? error.meta.body.error : error);
  }
}

module.exports = { createHospitalIndex } ;
