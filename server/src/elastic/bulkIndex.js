const mongoose = require('mongoose');
const { Client } = require('@elastic/elasticsearch');
const Hospital = require('../models/Hospital'); // MongoDB Model
const HospitalTime = require('../models/HospitalTime'); // MongoDB HospitalTime Model
const HospitalMajor = require('../models/hospitalSubject'); // MongoDB HospitalMajor Model
const ES_NODE = process.env.ES_NODE || 'http://localhost:9200';

const client = new Client({ node: ES_NODE });

const BULK_SIZE = 500; // 안정성을 위해 500으로 설정

async function bulkIndex() {
  try {
    // MongoDB 연결
    await mongoose.connect('mongodb://localhost:27017/horoscope_db', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB 연결 성공");

    // Hospital과 HospitalTime, HospitalMajor 데이터 병합
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

    console.log(`MongoDB에서 ${hospitalsWithDetails.length}개의 병원 데이터를 가져왔습니다.`);

    if (hospitalsWithDetails.length === 0) {
      throw new Error("MongoDB에서 가져온 데이터가 없습니다.");
    }

    // 데이터를 BULK_SIZE 만큼씩 나누기
    for (let i = 0; i < hospitalsWithDetails.length; i += BULK_SIZE) {
      const chunk = hospitalsWithDetails.slice(i, i + BULK_SIZE);
      const body = [];

      for (const h of chunk) {
        const majorSubjects = h.subjects.map(subject => subject.dgsbjtCdNm); // 병원 전공 이름 리스트 생성

        body.push({ index: { _index: 'hospitals' } });
        body.push({
          yadmNm: h.yadmNm,
          addr: h.addr,
          region: h.sidoCdNm, // 실제 필드 이름으로 수정
          subject: h.clCdNm, // 실제 필드 이름으로 수정
          major: majorSubjects, // 전공 리스트 추가
          nightCare: h.times && h.times.emyNgtYn === 'Y' ? true : false,
          twentyfourCare: h.times && h.times.trmtMonEnd === '2400' ? true : false,
          weekendCare: h.times && (h.times.noTrmtSat !== '휴무' || h.times.noTrmtSun !== '휴무') ? true : false,
          // 필요한 다른 필드들도 추가
        });
      }

      console.log(`Processing bulk chunk ${Math.floor(i / BULK_SIZE) + 1}: ${chunk.length} documents`);

      // Bulk 요청 전에 일부 데이터 로그로 출력 (디버깅 용도)
      console.log("Bulk request body sample:", JSON.stringify(body.slice(0, 4), null, 2));

      let resp;
      try {
        resp = await client.bulk({ refresh: true, body });
      } catch (bulkError) {
        console.error(`Bulk 요청 중 네트워크 또는 클라이언트 오류 발생:`, bulkError);
        continue; // 다음 청크로 넘어가기
      }

      if (!resp || !resp.body) {
        console.error("Elasticsearch 응답이 비어 있습니다. resp:", resp);
        continue; // 다음 청크로 넘어가기
      }

      // Bulk 요청 응답 전체 출력 (디버깅 용도)
      console.log("Bulk response:", JSON.stringify(resp.body, null, 2));

      if (resp.body.errors) {
        const erroredDocuments = resp.body.items.filter(item => item.index && item.index.error);
        erroredDocuments.forEach(doc => {
          console.error(`Error indexing document ID ${doc.index._id}:`, doc.index.error);
        });
      } else {
        console.log(`성공적으로 ${chunk.length}개의 문서를 'hospitals' 인덱스에 색인했습니다.`);
      }
    }

    // Bulk 색인 완료 후 인덱스 새로 고침
    await client.indices.refresh({ index: 'hospitals' });
    console.log("Elasticsearch 인덱스 새로 고침 완료.");
  } catch (error) {
    if (error.meta && error.meta.body && error.meta.body.error) {
      console.error("Elasticsearch 오류:", JSON.stringify(error.meta.body.error, null, 2));
    } else {
      console.error("일반 오류:", error);
    }
  } finally {
    await mongoose.connection.close();
    console.log("MongoDB 연결 종료");
  }
}

bulkIndex();
