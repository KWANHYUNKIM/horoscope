// server/src/routes/elastic/hospitalDetailSearch.js
const express = require('express');
const client = require('../config/elasticsearch'); // Elasticsearch 클라이언트
const router = express.Router();

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "❌ 요청에 `_id` 값이 없습니다." });
    }

    let response;
    try {
      // Elasticsearch에서 _id를 기반으로 문서를 조회
      response = await client.get({
        index: 'hospital_details',
        id: id,
      });
    } catch (error) {
      // 만약 Elasticsearch에서 404 에러가 발생하면 해당 문서가 없다는 의미
      if (error.meta && error.meta.statusCode === 404) {
        return res.status(404).json({ error: `❌ 병원을 찾을 수 없습니다. (_id: ${id})` });
      }
      // 그 외의 오류는 다시 throw하여 상위 catch로 전달
      throw error;
    }

    // Elasticsearch 클라이언트 버전에 따라 응답 객체 구조가 다를 수 있으므로,
    // response.body가 있으면 사용하고, 없으면 response 전체를 사용하도록 합니다.
    const result = (typeof response.body !== 'undefined') ? response.body : response;

    // result에 _source가 없다면 오류 처리
    if (!result || !result._source) {
      return res.status(500).json({ error: "❌ Elasticsearch 응답이 없습니다." });
    }

    // 성공 시 _source에 담긴 상세 정보를 클라이언트에 반환
    res.json(result._source);
  } catch (error) {
    console.error(
      "❌ 병원 상세 검색 오류:",
      error.meta ? JSON.stringify(error.meta.body.error, null, 2) : error
    );
    res.status(500).json({ error: "병원 정보를 검색하는 중 오류 발생" });
  }
});

module.exports = router;

