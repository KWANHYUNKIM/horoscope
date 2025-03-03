const express = require("express");
const client = require("../config/elasticsearch"); // Elasticsearch 클라이언트 가져오기
const router = express.Router();

router.get("/", async (req, res) => {
  //console.log("🚀 자동완성 요청 도착!");
  res.set("Cache-Control", "no-store");

  try {
    const { query } = req.query;
    //console.log(`✅ 검색어 수신: ${query}`);

    if (!query || query.trim() === "") {
      //console.log("❌ query 파라미터 없음");
      return res.status(400).json({ error: "query 파라미터가 필요합니다." });
    }

    const searchParams = {
      index: "hospitals",
      size: 20,
      body: {
        query: {
          bool: {
            should: [
              { match_phrase_prefix: { yadmNm: query } },
              { wildcard: { "addr.keyword": `*${query}*` } }, // 정확한 검색을 위해 `.keyword` 적용
              { wildcard: { "region.keyword": `*${query}*` } },
              { wildcard: { "subject.keyword": `*${query}*` } }
            ]
          }
        },
        sort: [{ _score: "desc" }]
      }
    };

    //console.log("🔍 Elasticsearch Query:", JSON.stringify(searchParams.body, null, 2));

    const response = await client.search(searchParams);

    // ✅ Elasticsearch 응답 데이터 확인
    //console.log("🔍 Elasticsearch Raw Response:", JSON.stringify(response, null, 2));

    // ✅ hits 데이터 확인
    const hits = response.hits?.hits || [];
    if (!hits.length) {
      //console.error("❌ Elasticsearch 응답 오류: 검색 결과 없음.");
      return res.status(404).json({ message: "검색 결과 없음" });
    }

    //console.log("✅ Elasticsearch 검색 결과 hits:", hits);

    const suggestions = {
      region: [],
      major: [],
      hospital: []
    };

    hits.forEach((hit) => {
      const item = hit._source;
      if (item.region && !suggestions.region.includes(item.region)) {
        suggestions.region.push(item.region);
      }
      if (item.major) {
        item.major.forEach((m) => {
          if (!suggestions.major.includes(m)) {
            suggestions.major.push(m);
          }
        });
      }
      if (item.yadmNm) {
        suggestions.hospital.push({
          name: item.yadmNm,
          address: item.addr,
          subject: item.subject
        });
      }
    });

   //console.log("✅ 최종 자동완성 응답 데이터:", JSON.stringify(suggestions, null, 2));
    res.json(suggestions);

  } catch (error) {
    console.error("❌ 자동완성 라우트 오류:", error);

    // ✅ Elasticsearch 상세 오류 로그 출력
    if (error.meta && error.meta.body) {
      //console.error("🔍 Elasticsearch 상세 오류:", JSON.stringify(error.meta.body, null, 2));
    }

    res.status(500).json({ message: "자동완성 검색 중 오류가 발생했습니다." });
  }
});

module.exports = router;

