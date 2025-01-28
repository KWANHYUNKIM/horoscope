// server/src/routes/elastic/hospitalSearch.js
const express = require('express');
const { Client } = require('@elastic/elasticsearch');
const router = express.Router();

const ES_NODE = process.env.ES_NODE || 'http://localhost:9200';
const client = new Client({ node: ES_NODE });

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, region, subject, category, major } = req.query;

    // Elasticsearch 쿼리 구성
    const must = [];
    const filter = [];

    // 지역 필터
    if (region && region !== "전국") {
      filter.push({ term: { region: region } });
    }

    // 과목 필터 (subject)
    if (subject && subject !== "전체") {
      filter.push({ term: { subject: subject } });
    }

    // 전공 필터 (major)
    if (major && major !== "전체") {
      filter.push({ term: { major: major } });
    }

    // 추가 필터 (야간 진료, 24시간 진료, 주말 진료 등)
    if (category === "야간진료") {
      filter.push({ term: { nightCare: true } });
    } else if (category === "24시간진료") {
      filter.push({ term: { twentyfourCare: true } });
    } else if (category === "주말진료") {
      filter.push({ term: { weekendCare: true } });
    }

    const query = {
      bool: {
        must,
        filter
      }
    };

    console.log("Elasticsearch 쿼리:", JSON.stringify(query, null, 2));

    const response = await client.search({
      index: 'hospitals',
      from: (page - 1) * limit,
      size: parseInt(limit),
      body: {
        query
      }
    });

    // 전체 응답 로그 출력
    console.log("Full search response:", JSON.stringify(response, null, 2));

    // 응답 구조에 맞게 hits 접근
    let hits, totalCount;
    if (response.body && response.body.hits) {
      // @elastic/elasticsearch v7.x
      hits = response.body.hits.hits.map(hit => hit._source);
      totalCount = response.body.hits.total.value;
    } else if (response.hits && response.hits.hits) {
      // @elastic/elasticsearch v8.x 이상 또는 다른 구조
      hits = response.hits.hits.map(hit => hit._source);
      totalCount = response.hits.total.value;
    } else {
      console.error("검색 응답 구조가 예상과 다릅니다:", response);
      throw new Error("검색 응답 구조가 예상과 다릅니다.");
    }

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      data: hits,
      totalCount,
      currentPage: parseInt(page),
      totalPages
    });
  } catch (error) {
    console.error("검색 라우트 오류:", error.meta ? JSON.stringify(error.meta.body.error, null, 2) : error);
    res.status(500).json({ message: "검색 중 오류가 발생했습니다." });
  }
});

module.exports = router;
