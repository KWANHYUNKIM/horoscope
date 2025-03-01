const express = require('express');
const client = require('../config/elasticsearch'); // Elasticsearch 클라이언트 가져오기
const router = express.Router();

router.get('/', async (req, res) => {
  // 캐시 사용 안하도록 설정
  res.set('Cache-Control', 'no-store');

  try {
    const { query } = req.query;
    if (!query || query.trim() === "") {
      return res.status(400).json({ error: "query 파라미터가 필요합니다." });
    }

    // 입력 쿼리를 공백 기준으로 토큰화 (예: "대전 정형외과" → ["대전", "정형외과"])
    const tokens = query.trim().split(/\s+/);

    // 각 토큰을 대상으로 multi_match 쿼리를 구성
    // 여러 필드에서 검색하도록 하여, 지역, 병원명, 전공 등 다양한 키워드를 인식
    const mustQueries = tokens.map(token => ({
      multi_match: {
        query: token,
        fields: ["yadmNm^3", "addr", "region", "major", "subject"],
        fuzziness: "AUTO"
      }
    }));

    // 동적 쿼리 구성: 모든 토큰을 must 조건으로 결합
    const autoCompleteQuery = {
      bool: {
        must: mustQueries
      }
    };

    const searchParams = {
      index: 'hospitals', // 실제 사용하는 인덱스명으로 변경
      size: 10,
      body: {
        query: autoCompleteQuery
      }
    };

    console.log("Elasticsearch AutoComplete 쿼리:", JSON.stringify(searchParams.body, null, 2));

    const response = await client.search(searchParams);
    const result = (typeof response.body !== 'undefined') ? response.body : response;
    console.log("자동완성 검색 응답:", JSON.stringify(result, null, 2));

    const suggestions = result.hits.hits.map(hit => hit._source);

    res.json(suggestions);
  } catch (error) {
    console.error(
      "자동완성 라우트 오류:",
      error.meta ? JSON.stringify(error.meta.body.error, null, 2) : error
    );
    res.status(500).json({ message: "자동완성 검색 중 오류가 발생했습니다." });
  }
});

module.exports = router;
