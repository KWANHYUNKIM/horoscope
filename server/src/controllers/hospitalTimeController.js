// controllers/hospitalController.js
const axios = require('axios');
const Hospital = require('../models/Hospital');
const HospitalDetail = require('../models/HospitalTime');

const fetchHospitalsTime = async (req, res) => {
  // 첫 번째 API
  const API_KEY = process.env.API_KEY;
  const BASE_URL = 'https://apis.data.go.kr/B551182/hospInfoServicev2/getHospBasisList';

  // 두 번째 API
  const DETAIL_API_KEY = process.env.DETAIL_API_KEY || API_KEY;
  const DETAIL_BASE_URL = 'https://apis.data.go.kr/B551182/MadmDtlInfoService2.7/getDtlInfo2.7';

  try {
    // 첫 번째 API 페이징 설정
    let pageNo = 1;
    const numOfRows = 100; // 한 페이지당 가져올 병원 수
    let totalCount = 0;
    let fetchedCount = 0;

    do {
      // --- (1) 첫 번째 API 요청 ---
      const response = await axios.get(BASE_URL, {
        params: {
          serviceKey: API_KEY,
          pageNo,
          numOfRows,
        },
      });

      // totalCount 초기화
      if (pageNo === 1) {
        totalCount = parseInt(response.data.response.body.totalCount, 10);
        console.log(`(Hospital List) totalCount = ${totalCount}`);
      }

      const hospitals = response.data.response.body.items.item;

      if (hospitals && hospitals.length > 0) {
        // (2) 각 병원마다 데이터 저장
        const savePromises = hospitals.map(async (hospital) => {
          const hospitalData = {};
          if (hospital.ykiho) hospitalData.ykiho = hospital.ykiho;

          // (2-1) Hospital 모델에 기본 정보 저장
          try {
            await Hospital.create(hospitalData);
          } catch (err) {
            console.error(`Failed to save hospital: ${hospital.yadmNm}`, err.message);
          }

          // (2-2) 두 번째 API 호출: ykiho 기준으로 상세정보 전체 페이지 가져오기
          if (hospital.ykiho) {
            // 이 병원에 대한 상세정보 전체를 가져올 때까지 pageNo 증가
            let detailPageNo = 1;
            const detailNumOfRows = 10; // 한 페이지당 몇 개씩 볼지(예시)
            let detailTotalCount = 0;
            let detailFetchedCount = 0;

            do {
              try {
                const detailResponse = await axios.get(DETAIL_BASE_URL, {
                  params: {
                    serviceKey: DETAIL_API_KEY,
                    ykiho: hospital.ykiho,
                    pageNo: detailPageNo,
                    numOfRows: detailNumOfRows,
                  },
                });

                // 상세 API의 totalCount 추출
                if (detailPageNo === 1) {
                  detailTotalCount = parseInt(
                    detailResponse.data.response.body.totalCount,
                    10
                  );
                  console.log(
                    `[Detail] ykiho=${hospital.ykiho}, totalCount=${detailTotalCount}`
                  );
                }

                // 상세 아이템들
                let detailItems = detailResponse.data.response.body.items.item;

                // 응답이 단일 객체일 수도 있으므로 배열 형태로 처리
                if (!Array.isArray(detailItems)) {
                  // 단일 아이템인 경우 배열로 감싸기
                  detailItems = [detailItems];
                }

                // (2-3) 페이지별 상세 아이템 저장
                const detailSavePromises = detailItems.map(async (detailItem) => {
                  // 실제 응답 구조에 맞춰 데이터 구성
                  const detailData = {
                    ykiho: hospital.ykiho, // 식별자
                  };

                  if (detailItem.emyDayTelNo1) detailData.emyDayTelNo1 = detailItem.emyDayTelNo1;
                  if (detailItem.emyDayTelNo2) detailData.emyDayTelNo2 = detailItem.emyDayTelNo2;
                  if (detailItem.emyDayYn) detailData.emyDayYn = detailItem.emyDayYn;
                  if (detailItem.emyNgtTelNo1) detailData.emyNgtTelNo1 = detailItem.emyNgtTelNo1;
                  if (detailItem.emyNgtTelNo2) detailData.emyNgtTelNo2 = detailItem.emyNgtTelNo2;
                  if (detailItem.emyNgtYn) detailData.emyNgtYn = detailItem.emyNgtYn;
                  if (detailItem.lunchWeek) detailData.lunchWeek = detailItem.lunchWeek;
                  if (detailItem.noTrmtHoli) detailData.noTrmtHoli = detailItem.noTrmtHoli;
                  if (detailItem.noTrmtSun) detailData.noTrmtSun = detailItem.noTrmtSun;
                  if (detailItem.parkEtc) detailData.parkEtc = detailItem.parkEtc;
                  if (detailItem.parkQty) detailData.parkQty = Number(detailItem.parkQty);
                  if (detailItem.parkXpnsYn) detailData.parkXpnsYn = detailItem.parkXpnsYn;
                  if (detailItem.plcDir) detailData.plcDir = detailItem.plcDir;
                  if (detailItem.plcDist) detailData.plcDist = detailItem.plcDist;
                  if (detailItem.plcNm) detailData.plcNm = detailItem.plcNm;
                  if (detailItem.rcvSat) detailData.rcvSat = detailItem.rcvSat;
                  if (detailItem.rcvWeek) detailData.rcvWeek = detailItem.rcvWeek;
                  if (detailItem.trmtFriEnd) detailData.trmtFriEnd = detailItem.trmtFriEnd;
                  if (detailItem.trmtFriStart) detailData.trmtFriStart = detailItem.trmtFriStart;
                  if (detailItem.trmtMonEnd) detailData.trmtMonEnd = detailItem.trmtMonEnd;
                  if (detailItem.trmtMonStart) detailData.trmtMonStart = detailItem.trmtMonStart;
                  if (detailItem.trmtSatEnd) detailData.trmtSatEnd = detailItem.trmtSatEnd;
                  if (detailItem.trmtSatStart) detailData.trmtSatStart = detailItem.trmtSatStart;
                  if (detailItem.trmtThuEnd) detailData.trmtThuEnd = detailItem.trmtThuEnd;
                  if (detailItem.trmtThuStart) detailData.trmtThuStart = detailItem.trmtThuStart;
                  if (detailItem.trmtTueEnd) detailData.trmtTueEnd = detailItem.trmtTueEnd;
                  if (detailItem.trmtTueStart) detailData.trmtTueStart = detailItem.trmtTueStart;
                  if (detailItem.trmtWedEnd) detailData.trmtWedEnd = detailItem.trmtWedEnd;
                  if (detailItem.trmtWedStart) detailData.trmtWedStart = detailItem.trmtWedStart;

                  // (예시) 상세 API 페이징 정보도 저장하고 싶다면:
                  // detailData.detailPageNo = detailPageNo;
                  // detailData.detailNumOfRows = detailNumOfRows;

                  // HospitalDetail 저장
                  try {
                    await HospitalDetail.create(detailData);
                  } catch (err) {
                    console.error(
                      `Failed to save detail item for ykiho ${hospital.ykiho}`,
                      err.message
                    );
                  }
                });

                // 상세페이지 아이템 병렬 저장 대기
                await Promise.all(detailSavePromises);

                // 페이지별로 누적
                detailFetchedCount += detailItems.length;
              } catch (err) {
                console.error(
                  `Failed to fetch detail pageNo=${detailPageNo}, ykiho=${hospital.ykiho}`,
                  err.message
                );
                // 에러 발생 시, 필요하면 반복 중단하거나, 계속 진행할지 결정
                break;
              }

              // 다음 페이지
              detailPageNo++;
            } while (detailFetchedCount < detailTotalCount);
          }
        });

        // 모든 병원 저장 대기
        await Promise.all(savePromises);
        fetchedCount += hospitals.length;
        console.log(`Fetched+saved ${fetchedCount} hospital(s) so far.`);
      }

      // 첫 번째 API 다음 페이지
      pageNo++;
    } while (fetchedCount < totalCount);

    return res.status(200).json({
      message: `Fetched and saved ${fetchedCount} hospitals (and all detail pages).`,
    });
  } catch (err) {
    console.error('Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch and save hospitals' });
  }
};

module.exports = { fetchHospitalsTime };
