const express = require("express");
const client = require("../config/elasticsearch"); // Elasticsearch 클라이언트 가져오기
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
              { match_phrase_prefix: { yadmNm: query } },
              { wildcard: { "addr.keyword": `*${query}*` } }, // addr 기반 검색
              { wildcard: { "region.keyword": `*${query}*` } },
              { wildcard: { "subject.keyword": `*${query}*` } }
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
      region: {
        level1: [],
        level2: [],
        level3: [],
        level4: []
      },
      major: [],
      hospital: []
    };

    // 중복 제거를 위한 Set 생성
    const regionLevels = {
      level1: new Set(),
      level2: new Set(),
      level3: new Set(),
      level4: new Set()
    };

    // 각 hit에서 병원 문서를 순회하며
    // - addr 필드를 파싱해서 앞 4개 토큰을 각 레벨에 추가
    // - major와 병원 정보는 기존과 동일하게 처리
    hits.forEach((hit) => {
      const item = hit._source;
      if (item.addr) {
        const tokens = parseAddr(item.addr);
        if (tokens.length >= 1) regionLevels.level1.add(tokens[0]);
        if (tokens.length >= 2) regionLevels.level2.add(tokens[1]);
        if (tokens.length >= 3) regionLevels.level3.add(tokens[2]);
        if (tokens.length >= 4) regionLevels.level4.add(tokens[3]);
      }
      if (item.major) {
        // major가 배열인지 문자열인지에 따라 처리
        if (Array.isArray(item.major)) {
          item.major.forEach((m) => {
            if (!suggestions.major.includes(m)) {
              suggestions.major.push(m);
            }
          });
        } else if (typeof item.major === "string") {
          item.major.split(",").forEach((m) => {
            const trimmed = m.trim();
            if (trimmed && !suggestions.major.includes(trimmed)) {
              suggestions.major.push(trimmed);
            }
          });
        }
      }
      if (item.yadmNm) {
        suggestions.hospital.push({
          name: item.yadmNm,
          address: item.addr,
          subject: item.subject
        });
      }
    });

    // Set을 배열로 변환하고 정렬
    suggestions.region.level1 = Array.from(regionLevels.level1).sort();
    suggestions.region.level2 = Array.from(regionLevels.level2).sort();
    suggestions.region.level3 = Array.from(regionLevels.level3).sort();
    suggestions.region.level4 = Array.from(regionLevels.level4).sort();

    res.json(suggestions);

  } catch (error) {
    console.error("❌ 자동완성 라우트 오류:", error);
    if (error.meta && error.meta.body) {
      //console.error("🔍 Elasticsearch 상세 오류:", JSON.stringify(error.meta.body, null, 2));
    }
    res.status(500).json({ message: "자동완성 검색 중 오류가 발생했습니다." });
  }
});

module.exports = router;

/**
 * parseAddr 함수
 * 주소 문자열(addr)을 공백, 콤마, 괄호 등을 구분자로 분할하여 배열로 반환
 */
function parseAddr(addrStr) {
  return addrStr.split(/[\s,()]+/).filter(Boolean);
}