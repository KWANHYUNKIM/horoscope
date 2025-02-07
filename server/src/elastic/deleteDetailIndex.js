const client = require('../config/elasticsearch');

async function deleteHospitalDetailIndex() {
  try {
    const exists = await client.indices.exists({ index: 'hospital_details' });
    if (!exists.body) {
      console.log("인덱스 'hospital_details'가 존재하지 않습니다.");
      return;
    }

    await client.indices.delete({ index: 'hospital_details' });
    console.log("🚮 'hospital_details' 인덱스 삭제 완료!");
  } catch (error) {
    console.error("인덱스 삭제 오류:", error.meta ? error.meta.body.error : error);
  }
}

module.exports = { deleteHospitalDetailIndex };
