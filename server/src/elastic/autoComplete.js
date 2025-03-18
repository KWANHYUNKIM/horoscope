const express = require("express");
const client = require("../config/elasticsearch");
const router = express.Router();

router.get("/", async (req, res) => {
  res.set("Cache-Control", "no-store");

  try {
    const { query } = req.query;

    if (!query || query.trim() === "") {
      return res.status(400).json({ error: "query 파라미터가 필요합니다." });
    }

    const searchParams = {
      index: "hospitals",
      size: 20,
      body: {
        query: {
          bool: {
            should: [
              { match_phrase_prefix: { "yadmNm": query } },
              { match_phrase_prefix: { "addr": query } },
              { match_phrase_prefix: { "subject": query } }, // ✅ 수정됨 (keyword -> text)
              { wildcard: { "region.keyword": `*${query}*` } }
            ]
          }
        },
        sort: [{ _score: "desc" }]
      }
    };

    const response = await client.search(searchParams);

    const hits = response.hits?.hits || [];
    if (!hits.length) {
      return res.status(404).json({ message: "검색 결과 없음" });
    }

    const suggestions = {
      hospital: hits.map(hit => ({
        name: hit._source.yadmNm,
        address: hit._source.addr,
        subject: hit._source.subject
      }))
    };

    res.json(suggestions);
  } catch (error) {
    console.error("❌ 자동완성 라우트 오류:", error);
    res.status(500).json({ message: "자동완성 검색 중 오류가 발생했습니다." });
  }
});

module.exports = router;
