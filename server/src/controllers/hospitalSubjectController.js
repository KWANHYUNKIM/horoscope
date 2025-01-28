const axios = require('axios');
const Subject = require('../models/hospitalSubject');
const Hospital = require('../models/Hospital');

const fetchSubjects = async (req, res) => {
  const API_KEY = process.env.API_KEY;
  const BASE_URL = 'https://apis.data.go.kr/B551182/hospInfoServicev2/getHospBasisList';

  const SUBJECT_API_KEY = process.env.API_KEY;
  const SUBJECT_BASE_URL = 'https://apis.data.go.kr/B551182/MadmDtlInfoService2.7/getDgsbjtInfo2.7';

  try {
    let pageNo = 1;
    const numOfRows = 100;
    let totalCount = 0;
    let fetchedCount = 0;

    do {
      // 병원 데이터 가져오기
      const response = await axios.get(BASE_URL, {
        params: {
          serviceKey: API_KEY,
          pageNo,
          numOfRows,
        },
      });

      // 병원 데이터 총 개수 초기화
      if (pageNo === 1) {
        totalCount = parseInt(response.data.response.body.totalCount, 10);
        console.log(`(Subject List) totalCount = ${totalCount}`);
      }
      const hospitals = response.data.response.body.items.item;

      if (hospitals && hospitals.length > 0) {
        const savePromises = hospitals.map(async (hospital) => {
          const hospitalData = {
            ykiho: hospital.ykiho || null,
          };

          try {
            await Hospital.create(hospitalData);
          } catch (err) {
            console.error(`Failed to save hospital: ${hospital.yadmNm}`, err.message);
          }

          if (hospital.ykiho) {
            let subjectPageNo = 1;
            const subjectNumOfRows = 10;
            let subjectTotalCount = 0;
            let subjectFetchedCount = 0;

            do {
              try {
                const subjectResponse = await axios.get(SUBJECT_BASE_URL, {
                  params: {
                    serviceKey: SUBJECT_API_KEY,
                    ykiho: hospital.ykiho,
                    pageNo: subjectPageNo,
                    numOfRows: subjectNumOfRows,
                  },
                });

                // 과목 데이터 총 개수 초기화
                if (subjectPageNo === 1) {
                  subjectTotalCount = parseInt(
                    subjectResponse.data.response.body.totalCount,
                    10
                  );
                  console.log(
                    `[Detail] ykiho=${hospital.ykiho}, totalCount=${subjectTotalCount}`
                  );
                }

                let subjectItems = subjectResponse.data.response.body.items.item;
                if (!Array.isArray(subjectItems)) {
                  subjectItems = [subjectItems];
                }

                const subjectSavePromises = subjectItems.map(async (subjectItem) => {
                  // 유효한 데이터만 저장
                  if (
                    subjectItem.dgsbjtCd && // 진료 과목 코드 존재
                    subjectItem.dgsbjtCdNm && // 진료 과목 이름 존재
                    (subjectItem.cdiagDrCnt || subjectItem.dgsbjtPrSdrCnt) // 진료 의사 수나 기타 수치가 존재
                  ) {
                    const subjectData = {
                      ykiho: hospital.ykiho,
                      dgsbjtCd: subjectItem.dgsbjtCd,
                      dgsbjtCdNm: subjectItem.dgsbjtCdNm,
                      cdiagDrCnt: subjectItem.cdiagDrCnt || 0, // 기본값 0
                      dgsbjtPrSdrCnt: subjectItem.dgsbjtPrSdrCnt || 0, // 기본값 0
                    };
                
                    try {
                      await Subject.create(subjectData);
                      console.log(`Saved subject for ykiho ${hospital.ykiho}`);
                    } catch (err) {
                      console.error(
                        `Failed to save detail item for ykiho ${hospital.ykiho}. Error: ${err.message}`
                      );
                    }
                  } else {
                    console.log(
                      `Skipping subject for ykiho ${hospital.ykiho}. Missing necessary fields: ${JSON.stringify(
                        subjectItem
                      )}`
                    );
                  }
                });

                await Promise.all(subjectSavePromises);
                subjectFetchedCount += subjectItems.length;
              } catch (err) {
                console.error(
                  `Failed to fetch detail pageNo=${subjectPageNo}, ykiho=${hospital.ykiho}`,
                  err.message
                );
                break;
              }

              // 다음 과목 페이지
              subjectPageNo++;
            } while (subjectFetchedCount < subjectTotalCount);
          }
        });

        await Promise.all(savePromises);
        fetchedCount += hospitals.length;
      }

      // 다음 병원 페이지
      pageNo++;
    } while (fetchedCount < totalCount);

    return res.status(200).json({
      message: `Fetched and saved ${fetchedCount} subjects.`,
    });
  } catch (err) {
    console.error('Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch and save hospitals' });
  }
};

module.exports = { fetchSubjects };
