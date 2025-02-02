const client = require('../config/elasticsearch'); // ✅ 클라이언트 가져오기

async function deleteHospitalsIndex() {
  try {
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