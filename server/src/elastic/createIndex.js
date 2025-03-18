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
            subject: { type: 'text' },
            major: { type: 'keyword' },
            nightCare: { type: 'boolean' },
            twentyfourCare: { type: 'boolean' }, // 24시간 운영 여부
            weekendCare: { type: 'boolean' },
            location: { type: "geo_point" },
            hospUrl: { type: "text" },
            telno: { type: "text" },
            schedule: {
              type: "object",
              properties: {
                Monday: {
                  type: "object",
                  properties: {
                    openTime: { type: "keyword" },
                    closeTime: { type: "keyword" },
                    lunchStart: { type: "keyword" },
                    lunchEnd: { type: "keyword" }
                  }
                },
                Tuesday: { type: "object", properties: { openTime: { type: "keyword" }, closeTime: { type: "keyword" }, lunchStart: { type: "keyword" }, lunchEnd: { type: "keyword" } } },
                Wednesday: { type: "object", properties: { openTime: { type: "keyword" }, closeTime: { type: "keyword" }, lunchStart: { type: "keyword" }, lunchEnd: { type: "keyword" } } },
                Thursday: { type: "object", properties: { openTime: { type: "keyword" }, closeTime: { type: "keyword" }, lunchStart: { type: "keyword" }, lunchEnd: { type: "keyword" } } },
                Friday: { type: "object", properties: { openTime: { type: "keyword" }, closeTime: { type: "keyword" }, lunchStart: { type: "keyword" }, lunchEnd: { type: "keyword" } } },
                Saturday: { type: "object", properties: { openTime: { type: "keyword" }, closeTime: { type: "keyword" }, lunchStart: { type: "keyword" }, lunchEnd: { type: "keyword" } } },
                Sunday: { type: "object", properties: { openTime: { type: "keyword" }, closeTime: { type: "keyword" }, lunchStart: { type: "keyword" }, lunchEnd: { type: "keyword" } } }
              }
            }
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
