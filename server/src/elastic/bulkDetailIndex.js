const mongoose = require('mongoose');
const client = require('../config/elasticsearch');
const Hospital = require('../models/hospital');

const BULK_SIZE = 500;
const INDEX_NAME = 'hospital_details';

// MongoDB URI를 환경 변수에서 가져옴
const MONGO_URI = process.env.MONGO_URI || 'http://localhost:8081' ;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI 환경 변수가 설정되지 않았습니다.');
  process.exit(1); // 환경 변수가 없으면 실행 중단
}

async function bulkDetailIndex() {
  try {
    // 1. MongoDB 연결 확인 (연결되어 있지 않다면 새로 연결)
    if (mongoose.connection.readyState !== 1) {
      console.log("🔄 MongoDB 연결 시도 중...");
      await mongoose.connect(MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 20000,
        socketTimeoutMS: 45000
      });
    }

    // 연결 상태 다시 체크
    if (mongoose.connection.readyState !== 1) {
      console.error("⚠️ MongoDB 연결 실패. 실행을 중단합니다.");
      return;
    }

    console.log(`✅ MongoDB 연결 성공! ${MONGO_URI}`);

    // 병원 상세 데이터 조회 및 색인
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
      },
      {
        $project: {
          _id: 1,
          ykiho: 1,       
          yadmNm: 1,
          addr: 1,
          sidoCdNm: 1,
          clCdNm: 1,
          subjects: 1,
          times: 1,
          YPos: 1,
          XPos: 1
        }
      }
    ]);

    console.log(`🔍 ${hospitalsWithDetails.length}개의 병원 상세 데이터를 가져왔습니다.`);

    // 데이터 Elasticsearch에 색인
    for (let i = 0; i < hospitalsWithDetails.length; i += BULK_SIZE) {
      const chunk = hospitalsWithDetails.slice(i, i + BULK_SIZE);
      const bulkBody = [];

      for (const h of chunk) {
        const majorSubjects = Array.isArray(h.subjects)
          ? h.subjects.map(subject => subject.dgsbjtCdNm)
          : [];

        const schedule = {
          Monday: `${h.times?.trmtMonStart || "-"} ~ ${h.times?.trmtMonEnd || "-"}`,
          Tuesday: `${h.times?.trmtTueStart || "-"} ~ ${h.times?.trmtTueEnd || "-"}`,
          Wednesday: `${h.times?.trmtWedStart || "-"} ~ ${h.times?.trmtWedEnd || "-"}`,
          Thursday: `${h.times?.trmtThuStart || "-"} ~ ${h.times?.trmtThuEnd || "-"}`,
          Friday: `${h.times?.trmtFriStart || "-"} ~ ${h.times?.trmtFriEnd || "-"}`,
          Saturday: `${h.times?.trmtSatStart || "-"} ~ ${h.times?.trmtSatEnd || "-"}`,
          Sunday: `${h.times?.trmtSunStart || "-"} ~ ${h.times?.trmtSunEnd || "-"}`,
          lunch: h.times?.lunchWeek || "-",
          receptionWeek: h.times?.rcvWeek || "-",
          receptionSat: h.times?.rcvSat || "-",
          noTreatmentHoliday: h.times?.noTrmtHoli || "-",
          emergencyDay: h.times?.emyDayYn || "-",
          emergencyNight: h.times?.emyNgtYn || "-"
        };

        bulkBody.push({ index: { _index: INDEX_NAME, _id: h.times?.ykiho || "데이터 없음" } });
        bulkBody.push({
          yadmNm: h.yadmNm || "-",
          addr: h.addr || "-",
          region: h.sidoCdNm || "-",
          subject: h.clCdNm || "-",
          major: majorSubjects.length > 0 ? majorSubjects : ["-"],
          location: h.YPos && h.XPos ? { lat: h.YPos, lon: h.XPos } : null,
          place: h.times?.plcNm || "-",
          parkQty: h.times?.parkQty || "-",
          parkXpnsYn: h.times?.parkXpnsYn || "-",
          schedule
        });
      }

      console.log(`📝 색인 진행 중... (${Math.floor(i / BULK_SIZE) + 1}번째 배치, ${chunk.length}개 데이터)`);

      try {
        const resp = await client.bulk({ refresh: true, body: bulkBody });
        if (resp.body.errors) {
          console.error("⚠️ 일부 데이터 색인 오류 발생!", JSON.stringify(resp.body.errors, null, 2));
        } else {
          console.log(`✅ ${chunk.length}개의 병원 상세 정보가 색인되었습니다.`);
        }
      } catch (error) {
        console.error("❌ Elasticsearch bulk 요청 중 오류 발생:", error);
        continue;
      }
    }

    // 인덱스 새로 고침
    await client.indices.refresh({ index: INDEX_NAME });
    console.log("🔄 Elasticsearch 인덱스 새로 고침 완료.");
  } catch (error) {
    console.error("색인 오류:", error);
  } finally {
    console.log("🔌 MongoDB 연결 종료");
    await mongoose.disconnect();
  }
}

module.exports = { bulkDetailIndex };
