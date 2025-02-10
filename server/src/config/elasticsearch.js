require('dotenv').config();
const { Client } = require('@elastic/elasticsearch');

// 환경 변수 ES_NODE가 지정되어 있으면 사용하고,
// 없으면 NODE_ENV 값에 따라 기본값을 선택합니다.
const ES_NODE = process.env.ES_NODE ||
  (process.env.NODE_ENV === 'development'
    ? 'http://localhost:9200'
    : 'http://34.22.68.206:9200/');

const client = new Client({ node: ES_NODE });

console.log(`✅ Elasticsearch 연결 주소: ${ES_NODE}`);

module.exports = client;
