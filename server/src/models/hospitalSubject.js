const mongoose = require('mongoose');

// 스키마 정의
const hospitalSubjectSchema = new mongoose.Schema({
    ykiho: { type: String },
    dgsbjtCd: { type: String },
    dgsbjtCdNm: { type: String },
    cdiagDrCnt: { type: Number },
    dgsbjtPrSdrCnt: { type: Number },
});

let HospitalSubject;
try {
    HospitalSubject = mongoose.model('HospitalSubject');
} catch (error) {
    HospitalSubject = mongoose.model('HospitalSubject', hospitalSubjectSchema);
}


module.exports = { HospitalSubject };
