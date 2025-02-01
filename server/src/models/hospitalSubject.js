const mongoose = require('mongoose');

const HospitalSubjectSchema = new mongoose.Schema({
    ykiho: { type: String, required: true },
    dgsbjtCd: { type: String },
    dgsbjtCdNm: { type: String },
    cdiagDrCnt: { type: Number, default: 0 }, // 기본값 설정
    dgsbjtPrSdrCnt: { type: Number, default: 0 }, // 기본값 설정
}, {
    timestamps: true // 생성 및 수정 시간을 자동으로 추가
});

module.exports = mongoose.model('HospitalSubject', HospitalSubjectSchema);
