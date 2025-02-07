// server/src/routes/elastic/hospitalSearch.js
const express = require('express');
const client = require('../config/elasticsearch'); // ✅ 클라이언트 가져오기
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    // 쿼리 파라미터를 받아올 때 숫자형은 parseInt로 변환
    const {
      page = "1",
      limit = "10",
      region,
      subject,
      category,
      major,
      query,
      x,
      y,
      distance = "10km" // 기본 거리 설정
    } = req.query;

    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 10;

    console.log("Received query parameters:", req.query);
    console.log("Distance parameter:", distance);

    // Elasticsearch 쿼리 구성
    const must = [];
    const filter = [];

    // 검색 쿼리 추가
    if (query && query.trim() !== "") {
      must.push({
        multi_match: {
          query: query.trim(),
          fields: ["yadmNm^3", "addr", "major"], // 검색할 필드와 가중치 설정
          fuzziness: "AUTO" // 오타 허용 (선택 사항)
        }
      });
    }

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
    if (category) {
      if (category === "야간진료") {
        filter.push({ term: { nightCare: true } });
      } else if (category === "24시간진료") {
        filter.push({ term: { twentyfourCare: true } });
      } else if (category === "주말진료") {
        filter.push({ term: { weekendCare: true } });
      }
    }

    // 위치 기반 검색 추가
    if (x && y) {
      const userLocation = {
        lat: parseFloat(y),
        lon: parseFloat(x)
      };
      filter.push({
        geo_distance: {
          distance: distance, // 클라이언트에서 전달된 반경 사용
          location: userLocation // 'location' 필드는 Elasticsearch 인덱스의 Geo Point 필드명이어야 합니다.
        }
      });
    }

    const queryBody = {
      bool: {
        must: must.length > 0 ? must : [{ match_all: {} }],
        filter: filter
      }
    };

    console.log("Elasticsearch 쿼리:", JSON.stringify(queryBody, null, 2));

    const searchParams = {
      index: 'hospitals', // 인덱스명
      from: (pageNumber - 1) * limitNumber,
      size: limitNumber,
      body: {
        query: queryBody,
        // 위치 기반 검색 시 거리 순 정렬 추가
        sort: (x && y) ? [
          {
            "_geo_distance": {
              "location": { "lat": parseFloat(y), "lon": parseFloat(x) },
              "order": "asc",
              "unit": "km",
              "distance_type": "arc"
            }
          }
        ] : []
      }
    };

    const response = await client.search(searchParams);

    // response.body가 undefined라면 response 전체를 사용
    const result = (typeof response.body !== 'undefined') ? response.body : response;
    console.log("Full search response:", JSON.stringify(result, null, 2));

    let hits, totalCount;
    if (result && result.hits) {
      hits = result.hits.hits.map(hit => ({
        ...hit._source,
        _id: hit._id, // _id 값을 _source와 병합
      }));
      // total은 버전에 따라 다르게 반환될 수 있습니다.
      totalCount = typeof result.hits.total === 'number'
        ? result.hits.total
        : result.hits.total.value;
    } else {
      console.error("검색 응답 구조가 예상과 다릅니다:", result);
      throw new Error("검색 응답 구조가 예상과 다릅니다.");
    }

    const totalPages = Math.ceil(totalCount / limitNumber);

    res.json({
      data: hits,
      totalCount,
      currentPage: pageNumber,
      totalPages
    });
  } catch (error) {
    console.error(
      "검색 라우트 오류:",
      error.meta ? JSON.stringify(error.meta.body.error, null, 2) : error
    );
    res.status(500).json({ message: "검색 중 오류가 발생했습니다." });
  }
});

module.exports = router;
