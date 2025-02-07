const { deleteHospitalsIndex } = require('./deleteIndex');
const { createHospitalIndex } = require('./createIndex');
const { bulkIndex } = require('./bulkIndex');
const { deleteHospitalDetailIndex } = require('./deleteDetailIndex');
const { createHospitalDetailIndex } = require('./createDetailIndex');
const { bulkDetailIndex } = require('./bulkDetailIndex');

async function reindex() {
  console.log("🔄 Reindexing process started...");

  await deleteHospitalsIndex();  // 기존 색인 삭제
  await createHospitalIndex();  // 새 색인 생성
  await bulkIndex();  // 데이터 색인

  await deleteHospitalDetailIndex();
  await createHospitalDetailIndex();
  await bulkDetailIndex();

  console.log("✅ Reindexing complete!");
}

module.exports = { reindex };
