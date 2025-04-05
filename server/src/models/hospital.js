const mongoose = require('mongoose');

// 스키마 정의
const hospitalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    index: true
  },
  address: {
    type: String,
    required: true
  },
  yadmNm: String,
  addr: String,
  telno: String,
  clCd: Number,
  clCdNm: String,
  cmdcGdrCnt: Number,
  cmdcIntnCnt: Number,
  cmdcResdntCnt: Number,
  cmdcSdrCnt: Number,
  detyGdrCnt: Number,
  detyIntnCnt: Number,
  detyResdntCnt: Number,
  detySdrCnt: Number,
  drTotCnt: Number,
  emdongNm: String,
  estbDd: Number,
  hospUrl: String,
  mdeptGdrCnt: Number,
  mdeptIntnCnt: Number,
  mdeptResdntCnt: Number,
  mdeptSdrCnt: Number,
  pnursCnt: Number,
  postNo: Number,
  sgguCd: Number,
  sgguCdNm: String,
  sidoCd: Number,
  sidoCdNm: String,
  XPos: Number,
  YPos: Number,
  ykiho: String,
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// 모델이 이미 존재하는지 확인
let Hospital;
try {
    Hospital = mongoose.model('Hospital');
} catch (error) {
    Hospital = mongoose.model('Hospital', hospitalSchema);
}

module.exports = { Hospital };
