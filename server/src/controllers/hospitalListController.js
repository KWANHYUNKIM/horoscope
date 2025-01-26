const Hospital = require('../models/hospital');
const HospitalDetail = require('../models/hospitalTime');

/**
 * 병원 목록을 가져오되,
 *  - region, subject (Hospital 컬렉션 필드)
 *  - additionalFilter (예: 야간진료, 주말진료 등)는 HospitalDetail 컬렉션 필드
 * 을 조합하여 필터링
 */
const getHospitalsList = async (req, res) => {
  try {
    const {
      region,          // "서울", "부산" 등
      subject,         // "내과", "치과" 등
      additionalFilter // "야간 진료", "주말 진료", "24시간" 등
    } = req.query;

    // 1) Hospital 컬렉션 필터(기본정보)
    const hospitalFilter = {};
    if (region && region !== '전국') {
      hospitalFilter.region = region;
    }
    if (subject && subject !== '전체') {
      hospitalFilter.subject = subject;
    }

    // 2) HospitalDetail(시간정보) 쪽 필터 작성
    //    실제 어떤 필드를 어떻게 필터링할지는
    //    DB에 저장된 "시작/종료 시간" 또는 "휴무/24시간" 값에 따라 달라짐
    let detailFilter = {};

    // 예시: "야간 진료" → 금요일 종료시간(trmtFriEnd)이 "18:00 이후"라고 가정
    if (additionalFilter === '야간 진료') {
      // 실제 DB가 "1700", "1800" 등 숫자로 저장되어 있다면, 파싱해서 비교
      // 여기서는 단순 문자열 비교 예시
      detailFilter.trmtFriEnd = { $gte: '18:00' };
    }
    // 예시: "24시간 진료" → 월~일 중 어떤 필드가 "24시간"인지?
    else if (additionalFilter === '24시간 진료') {
      // 예) 월요일 시작/끝이 "00:00 ~ 24:00"으로 저장돼 있다고 가정
      detailFilter.trmtMonStart = '00:00';
      detailFilter.trmtMonEnd = '24:00';
    }
    // 예시: "주말 진료" → 토 or 일 중 하나가 휴무가 아닐 것
    else if (additionalFilter === '주말 진료') {
      // MongoDB에서 OR 조건으로 작성 가능:
      // Sat가 휴무가 아니거나, Sun이 휴무가 아닌 documents
      // 여기서는 간단히 "토요일 끝이 '휴무'가 아닌 필드"라고 가정
      detailFilter.$or = [
        { trmtSatEnd: { $ne: '휴무' } },
        { trmtSunEnd: { $ne: '휴무' } },
      ];
    }
    // "전체" or 다른 경우: detailFilter 생략(즉, 시간 필터 안 함)

    // 3) HospitalDetail에서 detailFilter를 만족하는 문서 찾기
    //    (만약 additionalFilter가 "전체"면, 모든 ykiho가 대상)
    let matchedYkiho = [];   // 시간 조건 만족하는 ykiho 리스트
    if (Object.keys(detailFilter).length > 0) {
      // detailFilter가 있다면 필터링
      const matchedDetails = await HospitalDetail.find(detailFilter, { ykiho: 1, _id: 0 });
      matchedYkiho = matchedDetails.map(d => d.ykiho);

      // 만약 조건에 맞는 병원이 하나도 없다면, 결과는 빈 배열 반환
      if (matchedYkiho.length === 0) {
        return res.json([]);
      }
    }

    // 4) Hospital에서 hospitalFilter + ykiho(in) 조건으로 최종 문서 찾기
    //    만약 detailFilter가 비어 있다면(전체), ykiho 필터를 걸지 않음
    if (matchedYkiho.length > 0) {
      hospitalFilter.ykiho = { $in: matchedYkiho };
    }

    // 병원 목록 조회
    const hospitals = await Hospital.find(hospitalFilter);

    return res.json(hospitals);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch hospitals' });
  }
};

module.exports = { getHospitalsList };
