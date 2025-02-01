const axios = require('axios');
const Hospital = require('../models/Hospital');

const fetchHospitals = async (req, res) => {
  const API_KEY = process.env.API_KEY;
  const BASE_URL = 'https://apis.data.go.kr/B551182/hospInfoServicev2/getHospBasisList';

  try {
    let pageNo = 1; // 시작 페이지 번호
    const numOfRows = 100; // 한 번에 가져올 최대 데이터 수
    let totalCount = 0; // 전체 데이터 수
    let fetchedCount = 0; // 가져온 데이터 수

    do {
      // API 요청
      const response = await axios.get(BASE_URL, {
        params: {
          serviceKey: API_KEY,
          pageNo, // 현재 페이지
          numOfRows, // 한 페이지 결과 수
        },
      });

      // 전체 데이터 수 초기화
      if (pageNo === 1) {
        totalCount = parseInt(response.data.response.body.totalCount, 10);
        console.log(`Total hospitals to fetch: ${totalCount}`);
      }

      // 데이터 파싱
      const hospitals = response.data.response.body.items.item;

      console.log("Fetched hospitals data:", hospitals);

      if (hospitals && hospitals.length > 0) {
        // 비동기 저장 작업 배열 생성
        const savePromises = hospitals.map(async (hospital) => {
          const hospitalData = {};

          // 값이 존재할 경우에만 추가
          if (hospital.addr) hospitalData.addr = hospital.addr;
          if (hospital.clCd !== undefined) hospitalData.clCd = hospital.clCd;
          if (hospital.clCdNm) hospitalData.clCdNm = hospital.clCdNm;
          if (hospital.cmdcGdrCnt !== undefined) hospitalData.cmdcGdrCnt = hospital.cmdcGdrCnt;
          if (hospital.cmdcIntnCnt !== undefined) hospitalData.cmdcIntnCnt = hospital.cmdcIntnCnt;
          if (hospital.cmdcResdntCnt !== undefined) hospitalData.cmdcResdntCnt = hospital.cmdcResdntCnt;
          if (hospital.cmdcSdrCnt !== undefined) hospitalData.cmdcSdrCnt = hospital.cmdcSdrCnt;
          if (hospital.detyGdrCnt !== undefined) hospitalData.detyGdrCnt = hospital.detyGdrCnt;
          if (hospital.detyIntnCnt !== undefined) hospitalData.detyIntnCnt = hospital.detyIntnCnt;
          if (hospital.detyResdntCnt !== undefined) hospitalData.detyResdntCnt = hospital.detyResdntCnt;
          if (hospital.detySdrCnt !== undefined) hospitalData.detySdrCnt = hospital.detySdrCnt;
          if (hospital.drTotCnt !== undefined) hospitalData.drTotCnt = hospital.drTotCnt;
          if (hospital.emdongNm) hospitalData.emdongNm = hospital.emdongNm;
          if (hospital.estbDd !== undefined) hospitalData.estbDd = hospital.estbDd;
          if (hospital.hospUrl) hospitalData.hospUrl = hospital.hospUrl;
          if (hospital.mdeptGdrCnt !== undefined) hospitalData.mdeptGdrCnt = hospital.mdeptGdrCnt;
          if (hospital.mdeptIntnCnt !== undefined) hospitalData.mdeptIntnCnt = hospital.mdeptIntnCnt;
          if (hospital.mdeptResdntCnt !== undefined) hospitalData.mdeptResdntCnt = hospital.mdeptResdntCnt;
          if (hospital.mdeptSdrCnt !== undefined) hospitalData.mdeptSdrCnt = hospital.mdeptSdrCnt;
          if (hospital.pnursCnt !== undefined) hospitalData.pnursCnt = hospital.pnursCnt;
          if (hospital.postNo !== undefined) hospitalData.postNo = hospital.postNo;
          if (hospital.sgguCd !== undefined) hospitalData.sgguCd = hospital.sgguCd;
          if (hospital.sgguCdNm) hospitalData.sgguCdNm = hospital.sgguCdNm;
          if (hospital.sidoCd !== undefined) hospitalData.sidoCd = hospital.sidoCd;
          if (hospital.sidoCdNm) hospitalData.sidoCdNm = hospital.sidoCdNm;
          if (hospital.telno) hospitalData.telno = hospital.telno;
          if (hospital.XPos !== undefined) hospitalData.XPos = hospital.XPos;
          if (hospital.YPos !== undefined) hospitalData.YPos = hospital.YPos;
          if (hospital.yadmNm) hospitalData.yadmNm = hospital.yadmNm;
          if (hospital.ykiho) hospitalData.ykiho = hospital.ykiho;

          try {
            await Hospital.create(hospitalData);
          } catch (err) {
            console.error(`Failed to save hospital: ${hospital.yadmNm}`, err.message);
          }
        });

        // 비동기 작업 병렬 처리
        await Promise.all(savePromises);
        fetchedCount += hospitals.length;
        console.log(`Fetched and saved ${fetchedCount} hospitals so far.`);
      }

      // 다음 페이지로 이동
      pageNo++;
    } while (fetchedCount < totalCount);

    res.status(200).json({ message: `Fetched and saved ${fetchedCount} hospitals.` });
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch and save hospitals' });
  }
};

module.exports = { fetchHospitals };
