const mongoose = require("mongoose");
const client = require("../config/elasticsearch");
const { Hospital } = require("../models/hospital");
const BATCH_SIZE = 500; // 배치 크기 증가
const PARALLEL_BATCHES = 5; // 병렬 처리 수 증가
const MAX_RETRIES = 10;
const RETRY_DELAY = 15000;
const TIME_WINDOW = 5;

// 로컬호스트 대신 127.0.0.1 사용
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/horoscope_db";

const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 300000, // 서버 선택 타임아웃 증가
  socketTimeoutMS: 300000, // 소켓 타임아웃 증가
  connectTimeoutMS: 300000, // 연결 타임아웃 증가
  maxPoolSize: 20, // 연결 풀 크기 증가
  minPoolSize: 10,
  retryWrites: true,
  retryReads: true,
  heartbeatFrequencyMS: 20000, // 하트비트 주기 증가
  maxIdleTimeMS: 120000, // 최대 유휴 시간 증가
  waitQueueTimeoutMS: 300000, // 대기 큐 타임아웃 증가
  family: 4, // IPv4 사용 강제
  keepAlive: true, // keepAlive 활성화
  keepAliveInitialDelay: 300000, // keepAlive 초기 지연 시간
  autoReconnect: true, // 자동 재연결 활성화
  reconnectTries: Number.MAX_VALUE, // 무한 재시도
  reconnectInterval: 1000 // 재연결 간격
};

async function connectWithRetry(retries = MAX_RETRIES) {
  let lastError = null;
  
  for (let i = 0; i < retries; i++) {
    try {
      if (mongoose.connection.readyState === 1) {
        console.log("✅ MongoDB 연결 유지 중...");
        return true;
      }
      
      console.log(`🔄 MongoDB 연결 시도 중... (시도 ${i + 1}/${retries})`);
      await mongoose.connect(MONGO_URI, mongooseOptions);
      console.log("✅ MongoDB 연결 성공!");
      return true;
    } catch (error) {
      lastError = error;
      console.error(`⚠️ 연결 실패 (시도 ${i + 1}/${retries}):`, error.message);
      
      if (i < retries - 1) {
        const waitTime = RETRY_DELAY * (i + 1); // 점진적으로 대기 시간 증가
        console.log(`⏳ ${waitTime/1000}초 후 재시도...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw lastError;
}

// 이동 평균을 계산하는 함수
function calculateMovingAverage(times, windowSize) {
  if (times.length < windowSize) return times.reduce((a, b) => a + b, 0) / times.length;
  const recentTimes = times.slice(-windowSize);
  return recentTimes.reduce((a, b) => a + b, 0) / windowSize;
}

function parseTimeToMinutes(timeStr) {
  if (!timeStr) return null;
  
  // 휴진, 마감 등의 특수 케이스 처리
  if (timeStr.includes('휴진') || timeStr.includes('마감')) return null;
  
  // 시간 범위에서 시작 시간만 추출
  const timeMatch = timeStr.match(/(\d{1,2})[시:](\d{1,2})?/);
  if (!timeMatch) return null;
  
  const hours = parseInt(timeMatch[1]);
  const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
  
  return hours * 60 + minutes;
}

async function fetchAdditionalInfo(hospital) {
  try {
    const [
      subjects,
      equipment,
      foodTreatment,
      intensiveCare,
      nursingGrade,
      personnel,
      speciality
    ] = await Promise.all([
      mongoose.connection.db.collection('hospitalsubjects').find({ ykiho: hospital.ykiho }).toArray(),
      mongoose.connection.db.collection('hospital_equipment').find({ ykiho: hospital.ykiho }).toArray(),
      mongoose.connection.db.collection('hospital_food_treatment_info').find({ ykiho: hospital.ykiho }).toArray(),
      mongoose.connection.db.collection('hospital_intensive_care_info').find({ ykiho: hospital.ykiho }).toArray(),
      mongoose.connection.db.collection('hospital_nursing_grade').find({ ykiho: hospital.ykiho }).toArray(),
      mongoose.connection.db.collection('hospital_personnel_info').find({ ykiho: hospital.ykiho }).toArray(),
      mongoose.connection.db.collection('hospital_speciality_info').find({ ykiho: hospital.ykiho }).toArray()
    ]);

    return {
      subjects,
      equipment,
      food_treatment_info: foodTreatment,
      intensive_care_info: intensiveCare,
      nursing_grade: nursingGrade,
      personnel_info: personnel,
      speciality_info: speciality
    };
  } catch (error) {
    console.error(`⚠️ 병원 ${hospital.ykiho} 추가 정보 조회 중 오류:`, error);
    return {
      subjects: [],
      equipment: [],
      food_treatment_info: [],
      intensive_care_info: [],
      nursing_grade: [],
      personnel_info: [],
      speciality_info: []
    };
  }
}

function convertTimesToSchedule(times) {
  if (!times) return null;

  const schedule = {
    Monday: { openTime: times.rcvWeek || null, closeTime: null, lunchStart: null, lunchEnd: null },
    Tuesday: { openTime: times.rcvWeek || null, closeTime: null, lunchStart: null, lunchEnd: null },
    Wednesday: { openTime: times.rcvWeek || null, closeTime: null, lunchStart: null, lunchEnd: null },
    Thursday: { openTime: times.rcvWeek || null, closeTime: null, lunchStart: null, lunchEnd: null },
    Friday: { openTime: times.rcvWeek || null, closeTime: null, lunchStart: null, lunchEnd: null },
    Saturday: { openTime: times.rcvSat || null, closeTime: null, lunchStart: null, lunchEnd: null },
    Sunday: { openTime: times.rcvSun || null, closeTime: null, lunchStart: null, lunchEnd: null }
  };

  return schedule;
}

async function processHospitalBatch(hospitals, batchNumber) {
  const startTime = Date.now();
  const body = [];
  
  // 병원별 추가 정보를 병렬로 가져오기
  const additionalInfoPromises = hospitals.map(hospital => fetchAdditionalInfo(hospital));
  const additionalInfoResults = await Promise.all(additionalInfoPromises);
  
  // 모든 병원의 위치 정보를 한 번에 가져오기
  const hospitalLocations = hospitals
    .filter(h => h.YPos && h.XPos)
    .map(h => ({
      ykiho: h.ykiho,
      YPos: h.YPos,
      XPos: h.XPos
    }));

  // 약국 정보를 한 번에 가져오기
  let nearbyPharmaciesMap = new Map();
  if (hospitalLocations.length > 0) {
    const pharmacyCursor = await mongoose.connection.db.collection('pharmacies')
      .find({
        Ypos: { $exists: true },
        Xpos: { $exists: true }
      })
      .project({
        yadmNm: 1,
        clCd: 1,
        clCdNm: 1,
        sidoCd: 1,
        sidoCdNm: 1,
        sgguCd: 1,
        sgguCdNm: 1,
        emdongNm: 1,
        postNo: 1,
        addr: 1,
        telno: 1,
        estbDd: 1,
        Ypos: 1,
        Xpos: 1
      })
      .batchSize(1000);

    const pharmacies = await pharmacyCursor.toArray();
    
    // 각 병원에 대해 가까운 약국 매핑
    for (const hospital of hospitalLocations) {
      const nearby = pharmacies
        .filter(pharmacy => {
          const distance = calculateDistance(
            hospital.YPos,
            hospital.XPos,
            pharmacy.Ypos,
            pharmacy.Xpos
          );
          return distance <= 100;
        })
        .map(pharmacy => ({
          ...pharmacy,
          distance: calculateDistance(
            hospital.YPos,
            hospital.XPos,
            pharmacy.Ypos,
            pharmacy.Xpos
          )
        }));
      
      nearbyPharmaciesMap.set(hospital.ykiho, nearby);
    }
  }
  
  for (let i = 0; i < hospitals.length; i++) {
    const h = hospitals[i];
    const additionalInfo = additionalInfoResults[i];
    
    // times 정보 가져오기
    const times = await mongoose.connection.db.collection('hospitaltimes')
      .findOne({ ykiho: h.ykiho }, {
        projection: {
          _id: 0,
          ykiho: 0
        }
      });
    
    const hospitalData = {
      ykiho: h.ykiho || h._id.toString(),
      yadmNm: h.yadmNm || "-",
      addr: h.addr || "-",
      region: h.sidoCdNm || "-",
      category: h.clCdNm || "-",
      location: (h.YPos && h.XPos) ? { lat: h.YPos, lon: h.XPos } : null,
      hospUrl: h.hospUrl || "-",
      telno: h.telno || "-",
      veteran_hospital: h.veteran_hospital,
      nightCare: times?.emyNgtYn === "Y",
      weekendCare: times?.noTrmtSat !== "휴무" || times?.noTrmtSun !== "휴무",
      schedule: convertTimesToSchedule(times),
      ...additionalInfo,
      nearby_pharmacies: nearbyPharmaciesMap.get(h.ykiho) || []
    };

    // 과목 정보
    const subjects = h.subjects || [];
    hospitalData.subject = subjects.length > 0 
      ? subjects.map(s => s.dgsbjtCdNm).join(", ")
      : "-";
    hospitalData.major = subjects.length > 0
      ? subjects.map(s => s.dgsbjtCdNm)
      : ["-"];

    // 장비 정보
    hospitalData.equipment = (h.equipment || []).map(({ typeCd, typeCdNm, typeCnt }) => ({
      typeCd,
      typeCdNm,
      typeCnt
    }));

    // 식이치료 정보
    hospitalData.food_treatment = (h.food_treatment_info || []).map(({ typeCd, typeCdNm, genMealAddYn, psnlCnt }) => ({
      typeCd,
      typeCdNm,
      genMealAddYn,
      psnlCnt
    }));

    // 중환자실 정보
    hospitalData.intensive_care = (h.intensive_care_info || []).map(({ typeCd, typeCdNm }) => ({
      typeCd,
      typeCdNm
    }));

    // 간호등급 정보
    hospitalData.nursing_grade = (h.nursing_grade || []).map(({ typeCd, typeCdNm, nursingRt }) => ({
      typeCd,
      typeCdNm,
      nursingRt
    }));

    // 인력 정보
    hospitalData.personnel = (h.personnel_info || []).map(({ pharmCd, pharmCdNm, pharmCnt }) => ({
      pharmCd,
      pharmCdNm,
      pharmCnt
    }));

    // 전문과목 정보
    hospitalData.speciality = (h.speciality_info || []).map(({ typeCd, typeCdNm }) => ({
      typeCd,
      typeCdNm
    }));

    // upsert 방식으로 변경
    body.push({ 
      update: { 
        _index: "hospitals", 
        _id: hospitalData.ykiho 
      } 
    });
    body.push({ 
      doc: hospitalData,
      doc_as_upsert: true 
    });
  }

  try {
    const resp = await client.bulk({ refresh: false, body });
    if (resp.errors) {
      const erroredDocuments = resp.items.filter(item => item.update && item.update.error);
      erroredDocuments.forEach(doc => {
        console.error(`❌ 색인 오류 (ID: ${doc.update._id}):`, doc.update.error);
      });
    }
    const endTime = Date.now();
    const processingTime = (endTime - startTime) / 1000;
    console.log(`✅ 배치 ${batchNumber} 처리 완료 (${hospitals.length}개 문서, 소요시간: ${processingTime.toFixed(2)}초)`);
    return { count: hospitals.length, time: processingTime };
  } catch (error) {
    console.error(`❌ 배치 ${batchNumber} 처리 중 오류 발생:`, error);
    return { count: 0, time: 0 };
  }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

async function processBatches(hospitals, startIndex, batchSize) {
  const batches = [];
  for (let i = 0; i < PARALLEL_BATCHES; i++) {
    const currentIndex = startIndex + (i * batchSize);
    if (currentIndex >= hospitals.length) break;
    
    const batch = hospitals.slice(currentIndex, currentIndex + batchSize);
    batches.push(processHospitalBatch(batch, Math.floor(currentIndex / batchSize) + 1));
  }
  return Promise.all(batches);
}

async function bulkIndex() {
  const startTime = Date.now();
  const processingTimes = [];
  
  try {
    await connectWithRetry();
    console.log(`✅ MongoDB 연결 성공! ${MONGO_URI}`);

    const totalHospitals = await Hospital.countDocuments();
    console.log(`🔍 총 ${totalHospitals}개의 병원 데이터를 처리합니다.`);

    let processedCount = 0;
    let batchCount = 0;
    let consecutiveErrors = 0;
    let lastSuccessfulBatch = Date.now();
    let lastId = null;

    while (processedCount < totalHospitals) {
      try {
        if (Date.now() - lastSuccessfulBatch > 300000) {
          console.log("⚠️ 오랜 시간 성공적인 배치가 없어 연결을 재확인합니다...");
          await connectWithRetry();
        }

        if (consecutiveErrors >= 3) {
          console.log("⚠️ 연속 오류 발생으로 30초 대기...");
          await new Promise(resolve => setTimeout(resolve, 30000));
          consecutiveErrors = 0;
          await connectWithRetry();
        }

        // 커서 기반 페이지네이션
        const query = lastId 
          ? { _id: { $gt: lastId } }
          : {};
        
        const hospitals = await Hospital.find(query)
          .sort({ _id: 1 })
          .limit(BATCH_SIZE * PARALLEL_BATCHES)
          .lean();

        if (hospitals.length === 0) break;

        lastId = hospitals[hospitals.length - 1]._id;

        const results = await processBatches(hospitals, 0, BATCH_SIZE);
        const processed = results.reduce((sum, result) => sum + result.count, 0);
        const batchTimes = results.map(result => result.time);
        processingTimes.push(...batchTimes);
        
        processedCount += processed;
        batchCount += PARALLEL_BATCHES;
        consecutiveErrors = 0;
        lastSuccessfulBatch = Date.now();

        const progress = (processedCount / totalHospitals) * 100;
        const elapsedTime = (Date.now() - startTime) / 1000;
        
        const avgProcessingTime = calculateMovingAverage(processingTimes, TIME_WINDOW);
        const remainingBatches = Math.ceil((totalHospitals - processedCount) / (BATCH_SIZE * PARALLEL_BATCHES));
        const estimatedRemainingTime = remainingBatches * avgProcessingTime;
        
        console.log(`📊 진행 상황: ${processedCount}/${totalHospitals} (${Math.round(progress)}%)`);
        console.log(`⏱️ 예상 남은 시간: ${Math.round(estimatedRemainingTime / 60)}분`);
        console.log(`⚡ 평균 처리 속도: ${(BATCH_SIZE * PARALLEL_BATCHES / avgProcessingTime).toFixed(2)} 문서/초`);

        // 배치 처리 후 대기 시간을 동적으로 조정
        const waitTime = Math.max(1000, Math.min(5000, avgProcessingTime * 1000));
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } catch (error) {
        console.error(`❌ 배치 ${batchCount + 1} 처리 중 오류 발생:`, error);
        consecutiveErrors++;
        
        if (error.name === 'MongoNetworkError' || error.name === 'MongoNetworkTimeoutError') {
          console.log("🔄 MongoDB 연결 재시도...");
          await connectWithRetry();
          continue;
        }
        throw error;
      }
    }

    await client.indices.refresh({ index: "hospitals" });
    const totalTime = (Date.now() - startTime) / 1000;
    console.log(`✅ 인덱싱 완료! 총 소요시간: ${Math.round(totalTime / 60)}분`);
    console.log(`📈 평균 처리 속도: ${(totalHospitals / totalTime).toFixed(2)} 문서/초`);
  } catch (error) {
    console.error("❌ 인덱싱 중 오류 발생:", error);
  } finally {
    await mongoose.disconnect();
  }
}

module.exports = { bulkIndex };