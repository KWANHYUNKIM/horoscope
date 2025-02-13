const client = require('../config/elasticsearch'); // ✅ 클라이언트 가져오기

async function deleteHospitalsIndex() {
  try {
    // 인덱스 존재 여부 확인
    const exists = await client.indices.exists({ index: 'hospitals' });
    if (!exists.body) {
      console.log("인덱스 'hospitals'가 존재하지 않습니다.");
      return;
    }

    // 인덱스 내 문서 수 확인
    const countResult = await client.count({ index: 'hospitals' });
    const documentCount = countResult.body.count;

    if (documentCount > 0) {
      console.log(`인덱스 'hospitals'에 데이터가 존재하므로 삭제하지 않습니다. (문서 수: ${documentCount})`);
      return;
    }

    // 문서가 없을 경우에만 인덱스 삭제
    const response = await client.indices.delete({ index: 'hospitals' });
    console.log("인덱스 'hospitals' 삭제 성공:", response.body);
  } catch (error) {
    if (error.meta && error.meta.body) {
      console.error("인덱스 삭제 중 오류:", JSON.stringify(error.meta.body.error, null, 2));
    } else {
      console.error("일반 오류:", error);
    }
  }
}

module.exports = { deleteHospitalsIndex };
