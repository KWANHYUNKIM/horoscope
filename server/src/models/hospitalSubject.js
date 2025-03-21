const mongoose = require('mongoose');

// 스키마 정의
const hospitalSubjectSchema = new mongoose.Schema({
    ykiho: String,
    dgsbjtCd: String,
    dgsbjtCdNm: String,
    cdiagDrCnt: Number,
    dgsbjtPrSdrCnt: Number,
    updatedAt: { type: Date, default: Date.now }
});

// 모델이 이미 존재하는지 확인
let HospitalSubject;
try {
    HospitalSubject = mongoose.model('HospitalSubject');
} catch (error) {
    HospitalSubject = mongoose.model('HospitalSubject', hospitalSubjectSchema);
}

module.exports = HospitalSubject;
