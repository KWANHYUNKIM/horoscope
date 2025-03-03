const { Client } = require('@elastic/elasticsearch');

// 환경 변수에서 Elasticsearch 노드 주소 불러오기
const ES_NODE = process.env.ES_NODE || 'http://localhost:9200';

const client = new Client({ node: ES_NODE });

//console.log(`✅ Elasticsearch 연결 주소: ${ES_NODE}`);

module.exports = client;