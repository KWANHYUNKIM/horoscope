const mongoose = require('mongoose');
const client = require('../config/elasticsearch'); // ✅ Elasticsearch 클라이언트 가져오기
const Hospital = require('../models/hospital'); // MongoDB Hospital 모델
const HospitalTime = require('../models/hospitalTime'); // MongoDB HospitalTime 모델
const HospitalMajor = require('../models/hospitalSubject'); // MongoDB HospitalSubject 모델

const BULK_SIZE = 500; // 500개씩 색인

async function bulkIndex() {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.log("⚠️ MongoDB가 아직 연결되지 않음.");
      return;
    }
    console.log("✅ MongoDB 연결 성공!");

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

        body.push({ index: { _index: 'hospitals', _id: h.ykiho || h._id.toString() } }); // ✅ `ykiho` 없으면 `_id` 사용
        body.push({
          yadmNm: h.yadmNm,
          addr: h.addr,
          region: h.sidoCdNm,
          subject: h.clCdNm,
          major: majorSubjects,
          nightCare: h.times && h.times.emyNgtYn === 'Y',
          twentyfourCare: h.times && h.times.trmtMonEnd === '2400',
          weekendCare: h.times && (h.times.noTrmtSat !== '휴무' || h.times.noTrmtSun !== '휴무'),
          location: {
            lat: h.YPos,
            lon: h.XPos
          }
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
