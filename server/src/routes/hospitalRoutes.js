// routes/hospitalRoutes.js
const express = require('express');
const router = express.Router();

// 이미 선언되어 있다고 가정
const Hospital = require('../models/hospital');
const HospitalSubject = require('../models/hospitalSubject'); // HospitalSubject 모델 추가
const HospitalTime = require('../models/hospitalTime');


router.get('/filter', async (req, res) => {
  try {
    const { region, subject, category, page = 1, limit = 10 } = req.query;

    // 숫자로 변환
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skipNum = (pageNum - 1) * limitNum;

    // 1) match 조건
    let matchConditions = {};

    // (예시) region, subject, category 별 필터
    if (region && region !== '전국') {
      matchConditions.sidoCdNm = region;
    }
    if (subject && subject !== '전체') {
      matchConditions.clCdNm = subject;
    }

    // 기본 파이프라인
    let pipeline = [
      { $match: matchConditions },
      {
        $lookup: {
          from: 'hospitaltimes',
          localField: 'ykiho',
          foreignField: 'ykiho',
          as: 'times'
        }
      }
    ];

    // category 필터
    if (category && category !== '전체') {
      if (category === '야간진료') {
        pipeline.push({ $match: { "times.emyNgtYn": "Y" } });
      } else if (category === '24시간진료') {
        pipeline.push({ $match: { "times.trmtMonEnd": "2400" } });
      } else if (category === '주말진료') {
        pipeline.push({
          $match: {
            $or: [
              { "times.noTrmtSat": { $ne: "휴무" } },
              { "times.noTrmtSun": { $ne: "휴무" } }
            ]
          }
        });
      }
      // 필요 시, "일반 진료" 등 다른 조건 추가
    }

    // 2) totalCount를 구하기 위한 별도 파이프라인
    //    (위 pipeline과 동일한 조건을 적용하되, $skip/$limit 전 BEFORE 상태에서 $count)
    const totalPipeline = [...pipeline, { $count: "totalCount" }];
    const totalCountArr = await Hospital.aggregate(totalPipeline);
    const totalCount = totalCountArr.length > 0 ? totalCountArr[0].totalCount : 0;

    // 3) 페이지네이션 적용 ($skip, $limit)
    pipeline.push({ $skip: skipNum });
    pipeline.push({ $limit: limitNum });

    // 4) 최종 병원 목록 쿼리
    const hospitals = await Hospital.aggregate(pipeline);

    // 5) 응답: data + totalCount + pagination 정보
    return res.json({
      data: hospitals,
      totalCount,
      currentPage: pageNum,
      totalPages: Math.ceil(totalCount / limitNum),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: '서버 에러' });
  }
});


// GET /api/hospitals: 모든 병원 및 관련 subject, time 정보를 함께 조회

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // 기본 1페이지
    const limit = parseInt(req.query.limit) || 20; // 페이지당 20건
    const skip = (page - 1) * limit;

    // skip과 limit을 적용해 필요한 데이터만 조회
    const hospitals = await Hospital.find({}).skip(skip).limit(limit);
    const totalCount = await Hospital.countDocuments({});

    // 각 병원마다 관련 subject와 time 데이터를 조회
    const results = await Promise.all(
      hospitals.map(async (hospital) => {
        const subject = await HospitalSubject.findOne({ ykiho: hospital.ykiho });
        const time = await HospitalTime.findOne({ ykiho: hospital.ykiho });
        return { ...hospital.toObject(), subject, time };
      })
    );

    res.json({ hospitals: results, totalCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/hospitals/:ykiho/subject: 주어진 ykiho의 subject 데이터 생성 또는 업데이트
router.post('/:ykiho/subject', async (req, res) => {
  try {
    const { ykiho } = req.params;
    const { dgsbjtCd, dgsbjtCdNm, cdiagDrCnt, dgsbjtPrSdrCnt } = req.body;
    let subject = await HospitalSubject.findOne({ ykiho });
    if (subject) {
      // 업데이트
      subject.dgsbjtCd = dgsbjtCd;
      subject.dgsbjtCdNm = dgsbjtCdNm;
      subject.cdiagDrCnt = cdiagDrCnt;
      subject.dgsbjtPrSdrCnt = dgsbjtPrSdrCnt;
      await subject.save();
    } else {
      // 신규 생성
      subject = new HospitalSubject({
        ykiho,
        dgsbjtCd,
        dgsbjtCdNm,
        cdiagDrCnt,
        dgsbjtPrSdrCnt,
      });
      await subject.save();
    }
    res.json({ message: 'Subject 데이터 저장 성공', subject });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/hospitals/:ykiho/time: 주어진 ykiho의 time 데이터 생성 또는 업데이트
router.post('/:ykiho/time', async (req, res) => {
  try {
    const { ykiho } = req.params;
    // req.body에 필요한 시간 관련 필드들이 포함되어 있다고 가정합니다.
    let time = await HospitalTime.findOne({ ykiho });
    if (time) {
      Object.assign(time, req.body);
      await time.save();
    } else {
      time = new HospitalTime({ ykiho, ...req.body });
      await time.save();
    }
    res.json({ message: 'Time 데이터 저장 성공', time });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
