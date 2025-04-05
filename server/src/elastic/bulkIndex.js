const mongoose = require("mongoose");
const client = require("../config/elasticsearch");
const { Hospital } = require("../models/hospital");
const BULK_SIZE = 500;

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/horoscope_db";

if (!MONGO_URI) {
  console.error("❌ [오류] MONGO_URI 환경 변수가 설정되지 않았습니다.");
  process.exit(1);
}

async function bulkIndex() {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.log("🔄 MongoDB 연결 시도 중...");
      await mongoose.connect(MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 20000,
        socketTimeoutMS: 45000
      });
    }

    if (mongoose.connection.readyState !== 1) {
      console.error("⚠️ MongoDB 연결 실패.");
      return;
    }
    console.log(`✅ MongoDB 연결 성공! ${MONGO_URI}`);

    const hospitalsWithDetails = await Hospital.aggregate([
      {
        $lookup: {
          from: "hospitaltimes",
          localField: "ykiho",
          foreignField: "ykiho",
          as: "times"
        }
      },
      {
        $lookup: {
          from: "hospitalsubjects",
          localField: "ykiho",
          foreignField: "ykiho",
          as: "subjects"
        }
      },
      {
        $unwind: {
          path: "$times",
          preserveNullAndEmptyArrays: true
        }
      }
    ]);

    console.log(`🔍 ${hospitalsWithDetails.length}개의 병원 데이터를 가져왔습니다.`);

    if (hospitalsWithDetails.length === 0) {
      console.error("❌ MongoDB에서 가져온 데이터가 없습니다.");
      return;
    }

    for (let i = 0; i < hospitalsWithDetails.length; i += BULK_SIZE) {
      const chunk = hospitalsWithDetails.slice(i, i + BULK_SIZE);
      const body = [];

      for (const h of chunk) {
        const majorSubjects = h.subjects?.map(subject => subject.dgsbjtCdNm) || ["-"];
        const subjectText = majorSubjects.length > 0 ? majorSubjects.join(", ") : "-";
 
        const category = h.clCdNm || "-";  

        const schedule = {
          Monday: { openTime: h.times?.trmtMonStart || "-", closeTime: h.times?.trmtMonEnd || "-" },
          Tuesday: { openTime: h.times?.trmtTueStart || "-", closeTime: h.times?.trmtTueEnd || "-" },
          Wednesday: { openTime: h.times?.trmtWedStart || "-", closeTime: h.times?.trmtWedEnd || "-" },
          Thursday: { openTime: h.times?.trmtThuStart || "-", closeTime: h.times?.trmtThuEnd || "-" },
          Friday: { openTime: h.times?.trmtFriStart || "-", closeTime: h.times?.trmtFriEnd || "-" },
          Saturday: { openTime: h.times?.trmtSatStart || "-", closeTime: h.times?.trmtSatEnd || "-" },
          Sunday: { openTime: h.times?.trmtSunStart || "-", closeTime: h.times?.trmtSunEnd || "-" },
          lunch: h.times?.lunchWeek || "-",
          receptionWeek: h.times?.rcvWeek || "-",
          receptionSat: h.times?.rcvSat || "-",
          noTreatmentHoliday: h.times?.noTrmtHoli || "-",
          emergencyDay: h.times?.emyDayYn === "Y",
          emergencyNight: h.times?.emyNgtYn === "Y"
        };

        const location = (h.YPos && h.XPos) ? { lat: h.YPos, lon: h.XPos } : null;

        body.push({ index: { _index: "hospitals", _id: h.ykiho || h._id.toString() } });
        body.push({
          ykiho: h.ykiho || h._id.toString(),
          yadmNm: h.yadmNm || "-",
          addr: h.addr || "-",
          region: h.sidoCdNm || "-",
          subject: subjectText,
          category: category,
          major: majorSubjects,
          nightCare: h.times?.emyNgtYn === "Y",
          weekendCare: h.times?.noTrmtSat !== "휴무" || h.times?.noTrmtSun !== "휴무",
          location: location,
          hospUrl: h.hospUrl || "-",
          telno: h.telno || "-",
          schedule
        });
      }

      console.log(`📝 색인 진행 중... (Batch ${Math.floor(i / BULK_SIZE) + 1})`);

      try {
        const resp = await client.bulk({ refresh: true, body });

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
          console.log(`✅ ${chunk.length}개의 병원이 'hospitals' 인덱스에 색인됨.`);
        }
      } catch (bulkError) {
        console.error("❌ Bulk 요청 중 오류 발생: ", bulkError);
        continue;
      }
    }

    await client.indices.refresh({ index: "hospitals" });
    console.log("🔄 Elasticsearch 인덱스 새로 고침 완료.");
  } catch (error) {
    console.error("❌ 색인 오류:", error);
  }
}

module.exports = { bulkIndex };
