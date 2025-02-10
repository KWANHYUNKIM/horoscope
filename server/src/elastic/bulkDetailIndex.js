const mongoose = require('mongoose');
const client = require('../config/elasticsearch');
const Hospital = require('../models/hospital');
// HospitalTime, HospitalMajor 모델은 lookup에서 사용하므로 별도 import 없이 aggregate에서 처리합니다.

// 상수 정의
const BULK_SIZE = 500;
const INDEX_NAME = 'hospital_details';
const MONGO_URI =
  process.env.MONGO_URI ||
  (process.env.NODE_ENV === 'development'
    ? 'mongodb://localhost:27017/horoscope_db'
    : 'mongodb://34.64.58.121:27017/horoscope_db'
  );

async function bulkDetailIndex() {
  try {
    // 1. MongoDB 연결
    if (mongoose.connection.readyState !== 1) {
      console.log("🔄 MongoDB 연결 시도 중...");
      await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    }
    if (mongoose.connection.readyState !== 1) {
      console.error("⚠️ MongoDB 연결 실패. 실행을 중단합니다.");
      return;
    }
    console.log("✅ MongoDB 연결 성공!");

    // 2. 병원 상세 데이터 조회 (lookup을 통해 times, subjects 데이터를 병합)
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
        // times 배열을 펼쳐 단일 객체처럼 사용 (없을 경우 null 처리)
        $unwind: {
          path: '$times',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          ykiho: 1,       // 색인의 _id로 사용
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

    // 3. Bulk 작업 단위로 Elasticsearch 색인 진행
    for (let i = 0; i < hospitalsWithDetails.length; i += BULK_SIZE) {
      const chunk = hospitalsWithDetails.slice(i, i + BULK_SIZE);
      const bulkBody = [];

      for (const h of chunk) {
        // subjects 배열이 존재하면 각 항목의 dgsbjtCdNm 값을 추출
        const majorSubjects = Array.isArray(h.subjects)
          ? h.subjects.map(subject => subject.dgsbjtCdNm)
          : [];

        // XML 데이터에 포함된 모든 시간 정보를 그대로 노출하도록 schedule 객체 구성
        const schedule = {
          // 각 요일별 진료시간 (값이 없으면 "-" 기본값)
          Monday: `${h.times?.trmtMonStart || "-"} ~ ${h.times?.trmtMonEnd || "-"}`,
          Tuesday: `${h.times?.trmtTueStart || "-"} ~ ${h.times?.trmtTueEnd || "-"}`,
          Wednesday: `${h.times?.trmtWedStart || "-"} ~ ${h.times?.trmtWedEnd || "-"}`,
          Thursday: `${h.times?.trmtThuStart || "-"} ~ ${h.times?.trmtThuEnd || "-"}`,
          Friday: `${h.times?.trmtFriStart || "-"} ~ ${h.times?.trmtFriEnd || "-"}`,
          Saturday: `${h.times?.trmtSatStart || "-"} ~ ${h.times?.trmtSatEnd || "-"}`,
          Sunday: `${h.times?.trmtSunStart || "-"} ~ ${h.times?.trmtSunEnd || "-"}`,

          // 추가 시간 정보
          lunch: h.times?.lunchWeek || "-",              // 예: "12시30분 ~ 14시00분"
          receptionWeek: h.times?.rcvWeek || "-",          // 예: "08시30분 ~ 18시30분"
          receptionSat: h.times?.rcvSat || "-",            // 예: "08시30분 ~ 12시30분"
          noTreatmentHoliday: h.times?.noTrmtHoli || "-",   // 예: "전부 휴진"
          emergencyDay: h.times?.emyDayYn || "-",          // 예: "N"
          emergencyNight: h.times?.emyNgtYn || "-"         // 예: "N"
        };

        // Elasticsearch 색인에 사용할 데이터 구성
        bulkBody.push({ index: { _index: INDEX_NAME, _id: h.times?.ykiho || "데이터 없음" } });
        bulkBody.push({
          yadmNm: h.yadmNm || "-",
          addr: h.addr || "-",
          region: h.sidoCdNm || "-",
          subject: h.clCdNm || "-",
          major: majorSubjects.length > 0 ? majorSubjects : ["-"],
          // 좌표 정보: YPos, XPos 값이 있을 경우만 사용 (Elasticsearch의 geo_point 매핑에 맞게)
          location: h.YPos && h.XPos ? { lat: h.YPos, lon: h.XPos } : null,
          // XML에 포함된 기타 정보
          place: h.times?.plcNm || "-",         // 예: "맥도날드 명지DT점 / S-oil 셀프주유소 건너편"
          parkQty: h.times?.parkQty || "-",
          parkXpnsYn: h.times?.parkXpnsYn || "-",
          // 구성한 schedule 객체 포함
          schedule
        });
      }

      console.log(`📝 색인 진행 중... (${Math.floor(i / BULK_SIZE) + 1}번째 배치, ${chunk.length}개 데이터)`);

      try {
        const resp = await client.bulk({ refresh: true, body: bulkBody });
        if (!resp || !resp.body) {
          console.error("❌ Elasticsearch 응답이 없음. 요청 실패!");
          continue;
        }
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

    // 4. 모든 배치 색인 후 인덱스 새로 고침
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
