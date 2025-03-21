const { deleteHospitalsIndex } = require('./deleteIndex');
const { createHospitalIndex } = require('./createIndex');
const { bulkIndex } = require('./bulkIndex');
const { deleteHospitalDetailIndex } = require('./deleteDetailIndex');
const { createHospitalDetailIndex } = require('./createDetailIndex');
const { bulkDetailIndex } = require('./bulkDetailIndex');

async function reindex() {
  try {
    console.log("🔄 Starting reindexing process...");
    
    console.log("Step 1: Deleting existing hospitals index...");
    await deleteHospitalsIndex();
    
    console.log("Step 2: Creating new hospitals index...");
    await createHospitalIndex();
    
    console.log("Step 3: Bulk indexing hospitals...");
    await bulkIndex();
    

    //await deleteHospitalDetailIndex();
    //await createHospitalDetailIndex();
    //await bulkDetailIndex();
    
    console.log("✅ Reindexing process completed successfully!");
  } catch (error) {
    console.error("❌ Error during reindexing process:");
    console.error("Error message:", error.message);
    console.error("Stack trace:", error.stack);
    throw error; // 상위로 에러를 전파
  }
}

module.exports = { reindex };
