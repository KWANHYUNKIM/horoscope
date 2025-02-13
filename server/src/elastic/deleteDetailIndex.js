const client = require('../config/elasticsearch');

async function deleteHospitalDetailIndex() {
  try {
    // 인덱스 존재 여부 확인
    const exists = await client.indices.exists({ index: 'hospital_details' });
    if (!exists.body) {
      console.log("인덱스 'hospital_details'가 존재하지 않습니다.");
      return;
    }

    // 인덱스 내 문서 수 확인
    const countResult = await client.count({ index: 'hospital_details' });
    const documentCount = countResult.body.count;

    if (documentCount > 0) {
      console.log(`인덱스 'hospital_details'에 데이터가 존재하므로 삭제하지 않습니다. (문서 수: ${documentCount})`);
      return;
    }

    // 문서가 없을 경우에만 인덱스 삭제
    await client.indices.delete({ index: 'hospital_details' });
    console.log("🚮 'hospital_details' 인덱스 삭제 완료!");
  } catch (error) {
    console.error("인덱스 삭제 오류:", error.meta ? error.meta.body.error : error);
  }
}

module.exports = { deleteHospitalDetailIndex };
