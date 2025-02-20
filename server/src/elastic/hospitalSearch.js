// server/src/routes/elastic/hospitalSearch.js
const express = require('express');
const client = require('../config/elasticsearch'); // ✅ Elasticsearch 클라이언트 가져오기
const router = express.Router();

router.get('/', async (req, res) => {
  try {
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
      distance = "10km"
    } = req.query;

    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 10;

    console.log("Received query parameters:", req.query);
    console.log("Distance parameter:", distance);

    const must = [];
    const filter = [];

    if (query && query.trim() !== "") {
      must.push({
        multi_match: {
          query: query.trim(),
          fields: ["yadmNm^3", "addr", "major"],
          fuzziness: "AUTO"
        }
      });
    }

    if (region && region !== "전국") {
      filter.push({ term: { region: region } });
    }

    if (subject && subject !== "전체") {
      filter.push({ term: { subject: subject } });
    }

    if (major && major !== "전체") {
      filter.push({ term: { major: major } });
    }

    // category 필터 처리
    if (category) {
      if (category === "야간진료") {
        filter.push({ term: { nightCare: true } });
      } else if (category === "주말진료") {
        filter.push({ term: { weekendCare: true } });
      } else if (category === "영업중") {
        // 영업중 필터: 현재 운영중인 병원만 반환
        filter.push({
          script: {
            script: {
              lang: "painless",
              source: `
                int currentTime = params.currentTime;
                String currentDay = params.currentDay;
                // 먼저 필드의 값이 존재하는지 size()로 확인
                if (doc["schedule." + currentDay + ".openTime"].size() == 0 ||
                    doc["schedule." + currentDay + ".closeTime"].size() == 0) {
                  return false;
                }
                // null 체크
                if (doc["schedule." + currentDay + ".openTime"].value == null ||
                    doc["schedule." + currentDay + ".closeTime"].value == null) {
                  return false;
                }
                String openTimeStr = doc["schedule." + currentDay + ".openTime"].value.toString();
                String closeTimeStr = doc["schedule." + currentDay + ".closeTime"].value.toString();
                if (openTimeStr.equals("-") || closeTimeStr.equals("-")) {
                  return false;
                }
                // 길이 체크: "HHmm" 형식이어야 함
                if (openTimeStr.length() < 4 || closeTimeStr.length() < 4) {
                  return false;
                }
                int openHour = Integer.parseInt(openTimeStr.substring(0,2));
                int openMin = Integer.parseInt(openTimeStr.substring(2,4));
                int closeHour = Integer.parseInt(closeTimeStr.substring(0,2));
                int closeMin = Integer.parseInt(closeTimeStr.substring(2,4));
                int openTime = openHour * 60 + openMin;
                int closeTime = closeHour * 60 + closeMin;
                return currentTime >= openTime && currentTime < closeTime;
              `,
              params: {
                // 아래 값은 아래에서 계산된 값으로 설정됩니다.
                currentTime: null,
                currentDay: null
              }
            }
          }
        });
      }
    }

    if (x && y) {
      const userLocation = {
        lat: parseFloat(y),
        lon: parseFloat(x)
      };
      filter.push({
        geo_distance: {
          distance: distance,
          location: userLocation
        }
      });
    }

    // 1. 현재 시간 및 요일 계산 (모든 스크립트에서 사용)
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const currentDay = days[now.getDay()];

    // 만약 category가 "영업중"이면, 스크립트 필터의 파라미터 값을 설정
    if (category === "영업중") {
      filter.forEach(f => {
        if (f.script && f.script.script) {
          f.script.script.params.currentTime = currentTime;
          f.script.script.params.currentDay = currentDay;
        }
      });
    }

    // 2. 기본 쿼리 구성
    const baseQuery = {
      bool: {
        must: must.length > 0 ? must : [{ match_all: {} }],
        filter: filter
      }
    };

    // 3. boost 기능: 운영시간 boost 적용 (영업 중이면 10점 부여)
    const boostedQuery = {
      function_score: {
        query: baseQuery,
        functions: [
          {
            script_score: {
              script: {
                lang: "painless",
                source: `
                  int currentTime = params.currentTime;
                  String currentDay = params.currentDay;
                  if (doc["schedule." + currentDay + ".openTime"].size() == 0 ||
                      doc["schedule." + currentDay + ".closeTime"].size() == 0) {
                    return 0;
                  }
                  if (doc["schedule." + currentDay + ".openTime"].value == null ||
                      doc["schedule." + currentDay + ".closeTime"].value == null) {
                    return 0;
                  }
                  String openTimeStr = doc["schedule." + currentDay + ".openTime"].value.toString();
                  String closeTimeStr = doc["schedule." + currentDay + ".closeTime"].value.toString();
                  if (openTimeStr.equals("-") || closeTimeStr.equals("-")) {
                    return 0;
                  }
                  if (openTimeStr.length() < 4 || closeTimeStr.length() < 4) {
                    return 0;
                  }
                  int openHour = Integer.parseInt(openTimeStr.substring(0,2));
                  int openMin = Integer.parseInt(openTimeStr.substring(2,4));
                  int closeHour = Integer.parseInt(closeTimeStr.substring(0,2));
                  int closeMin = Integer.parseInt(closeTimeStr.substring(2,4));
                  int openTime = openHour * 60 + openMin;
                  int closeTime = closeHour * 60 + closeMin;
                  if (currentTime >= openTime && currentTime < closeTime) {
                    return 10.0;
                  } else {
                    return 0;
                  }
                `,
                params: {
                  currentTime: currentTime,
                  currentDay: currentDay
                }
              }
            }
          }
        ],
        boost_mode: "sum",
        score_mode: "sum"
      }
    };

    const searchParams = {
      index: 'hospitals',
      from: (pageNumber - 1) * limitNumber,
      size: limitNumber,
      body: {
        query: boostedQuery,
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

    console.log("Elasticsearch 쿼리:", JSON.stringify(searchParams.body, null, 2));

    const response = await client.search(searchParams);
    const result = (typeof response.body !== 'undefined') ? response.body : response;
    console.log("Full search response:", JSON.stringify(result, null, 2));

    let hits, totalCount;
    if (result && result.hits) {
      hits = result.hits.hits.map(hit => ({
        ...hit._source,
        _id: hit._id,
      }));
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
