const client = require('../config/elasticsearch'); // ✅ Elasticsearch 클라이언트 가져오기

async function createHospitalDetailIndex() {
  try {
    const exists = await client.indices.exists({ index: 'hospital_details' });
    if (exists.body) {
      console.log("인덱스 'hospital_details' 이미 존재합니다.");
      return;
    }

    await client.indices.create({
      index: 'hospital_details',
      body: {
        mappings: {
          properties: {
            yadmNm: { type: 'text' },
            addr: { type: 'text' },
            region: { type: 'keyword' },
            subject: { type: 'keyword' },
            major: { type: 'keyword' },
            schedule: { type: 'object' } // 🏥 운영 시간 추가
          }
        }
      }
    });

    console.log("✅ 'hospital_details' 인덱스 생성 완료!");
  } catch (error) {
    console.error("인덱스 생성 오류:", error.meta ? error.meta.body.error : error);
  }
}

module.exports = { createHospitalDetailIndex };
