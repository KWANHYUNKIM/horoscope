const mongoose = require('mongoose');
const client = require('../config/elasticsearch'); // ✅ Elasticsearch 클라이언트 가져오기
const Hospital = require('../models/hospital'); // MongoDB Hospital 모델
const HospitalTime = require('../models/hospitalTime'); // MongoDB HospitalTime 모델
const HospitalMajor = require('../models/hospitalSubject'); // MongoDB HospitalSubject 모델

const BULK_SIZE = 500; // 500개씩 색인

const MONGO_URI =
  process.env.MONGO_URI ||
  (process.env.NODE_ENV === 'development'
    ? 'mongodb://localhost:27017/horoscope_db'
    : 'mongodb://34.64.58.121:27017/horoscope_db'
  );
async function bulkIndex() {
  try {
      // 1. MongoDB 연결
      if (mongoose.connection.readyState !== 1) {
        console.log("🔄 MongoDB 연결 시도 중...");
        await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true, serverSelectionTimeoutMS: 20000, socketTimeoutMS: 45000 });
      }
      if (mongoose.connection.readyState !== 1) {
        console.error("⚠️ MongoDB 연결 실패. 실행을 중단합니다.");
        return;
      }
      console.log("✅ MongoDB 연결 성공!" + MONGO_URI);

    // MongoDB 데이터 조회 및 조인
    const hospitalsWithDetails = await Hospital.aggregate([
      {
        $lookup: {
          from: 'hospitaltimes',
          localField: 'ykiho',
          foreignField: 'ykiho',
          as: 'times'
        }
      },
      {
        $lookup: {
          from: 'hospitalsubjects',
          localField: 'ykiho',
          foreignField: 'ykiho',
          as: 'subjects'
        }
      },
      {
        $unwind: {
          path: '$times',
          preserveNullAndEmptyArrays: true
        }
      }
    ]);

    console.log(`🔍 MongoDB에서 ${hospitalsWithDetails.length}개의 병원 데이터를 가져왔습니다.`);

    if (hospitalsWithDetails.length === 0) {
      throw new Error("❌ MongoDB에서 가져온 데이터가 없습니다.");
    }

    // BULK_SIZE만큼 나누어 색인하기
    for (let i = 0; i < hospitalsWithDetails.length; i += BULK_SIZE) {
      const chunk = hospitalsWithDetails.slice(i, i + BULK_SIZE);
      const body = [];

      for (const h of chunk) {
        const majorSubjects = h.subjects.map(subject => subject.dgsbjtCdNm); // 병원 전공 리스트
       
        const schedule = {
          Monday: { openTime: h.times?.trmtMonStart || "-", closeTime: h.times?.trmtMonEnd || "-" },
          Tuesday: { openTime: h.times?.trmtTueStart || "-", closeTime: h.times?.trmtTueEnd || "-" },
          Wednesday: { openTime: h.times?.trmtWedStart || "-", closeTime: h.times?.trmtWedEnd || "-" },
          Thursday: { openTime: h.times?.trmtThuStart || "-", closeTime: h.times?.trmtThuEnd || "-" },
          Friday: { openTime: h.times?.trmtFriStart || "-", closeTime: h.times?.trmtFriEnd || "-" },
          Saturday: { openTime: h.times?.trmtSatStart || "-", closeTime: h.times?.trmtSatEnd || "-" },
          Sunday: { openTime: h.times?.trmtSunStart || "-", closeTime: h.times?.trmtSunEnd || "-" },

          lunch: h.times?.lunchWeek || "-",                // 점심시간: 예) "12:30 ~ 14:00"
          receptionWeek: h.times?.rcvWeek || "-",         // 평일 접수시간
          receptionSat: h.times?.rcvSat || "-",           // 토요일 접수시간
          noTreatmentHoliday: h.times?.noTrmtHoli || "-", // 공휴일 휴진 여부
          emergencyDay: h.times?.emyDayYn === "Y",       // 응급진료(주간)
          emergencyNight: h.times?.emyNgtYn === "Y"      // 응급진료(야간)
        };

        body.push({ index: { _index: 'hospitals', _id: h.ykiho || h._id.toString() } }); // ✅ `ykiho` 없으면 `_id` 사용
        body.push({
          yadmNm: h.yadmNm,
          addr: h.addr,
          region: h.sidoCdNm,
          subject: h.clCdNm,
          major: majorSubjects,
          nightCare: h.times && h.times.emyNgtYn === 'Y',
          weekendCare: h.times && (h.times.noTrmtSat !== '휴무' || h.times.noTrmtSun !== '휴무'),
          location: {
            lat: h.YPos,
            lon: h.XPos
          },
          hospUrl: h.hospUrl,
          telno: h.telno,
          schedule
        });
      }

      console.log(`📝 색인 진행 중... (Batch ${Math.floor(i / BULK_SIZE) + 1})`);

      let resp;
      try {
        resp = await client.bulk({ refresh: true, body });
      } catch (bulkError) {
        console.error(`❌ Bulk 요청 중 오류 발생:`, bulkError);
        continue;
      }

      if (!resp || !resp.body) {
        console.error("❌ Elasticsearch 응답이 비어 있음.");
        continue;
      }

      if (resp.body.errors) {
        const erroredDocuments = resp.body.items.filter(item => item.index && item.index.error);
        erroredDocuments.forEach(doc => {
          console.error(`❌ 색인 오류 (ID: ${doc.index._id}):`, doc.index.error);
        });
      } else {
        console.log(`✅ ${chunk.length}개의 문서가 'hospitals' 인덱스에 색인됨.`);
      }
    }

    // 인덱스 새로 고침
    await client.indices.refresh({ index: 'hospitals' });
    console.log("🔄 Elasticsearch 인덱스 새로 고침 완료.");
  } catch (error) {
    console.error("❌ 색인 오류:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 MongoDB 연결 종료");
  }
}

module.exports = { bulkIndex };
