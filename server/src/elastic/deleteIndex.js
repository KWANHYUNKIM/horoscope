const { Client } = require('@elastic/elasticsearch');
const client = new Client({ node: 'http://localhost:9200' });

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

deleteHospitalsIndex();
