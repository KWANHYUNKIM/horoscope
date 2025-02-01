const mongoose = require('mongoose');

const HospitalTimeSchema = new mongoose.Schema({
    ykiho: { type: String, required: true },
    // 아래는 새로 추가된(또는 수정된) 필드들
    emyDayTelNo1: { type: String },
    emyDayTelNo2: { type: String },
    emyDayYn: { type: String },
    emyNgtTelNo1: { type: String },
    emyNgtTelNo2: { type: String },
    emyNgtYn: { type: String },
    lunchWeek: { type: String },
    noTrmtHoli: { type: String },
    noTrmtSun: { type: String },
    parkEtc: { type: String },
    parkQty: { type: Number },
    parkXpnsYn: { type: String },
    plcDir: { type: String },
    plcDist: { type: String },
    plcNm: { type: String },
    rcvSat: { type: String },
    rcvWeek: { type: String },
    trmtFriEnd: { type: String },
    trmtFriStart: { type: String },
    trmtMonEnd: { type: String },
    trmtMonStart: { type: String },
    trmtSatEnd: { type: String },
    trmtSatStart: { type: String },
    trmtThuEnd: { type: String },
    trmtThuStart: { type: String },
    trmtTueEnd: { type: String },
    trmtTueStart: { type: String },
    trmtWedEnd: { type: String },
    trmtWedStart: { type: String },
});

module.exports = mongoose.model('hospitalTime', HospitalTimeSchema);
