const mongoose = require('mongoose');

const hospitalEmbeddingSchema = new mongoose.Schema({
  ykiho: {
    type: String,
    required: true,
    unique: true
  },
  embedding: {
    type: [Number],
    required: true
  },
  text: {
    type: String,
    required: true
  },
  metadata: {
    yadmNm: String,
    addr: String,
    region: String,
    category: String,
    subjects: [String],
    updatedAt: { type: Date, default: Date.now }
  }
});

// 벡터 검색을 위한 인덱스 생성
hospitalEmbeddingSchema.index({ embedding: 'vector' });

let HospitalEmbedding;
try {
  HospitalEmbedding = mongoose.model('HospitalEmbedding');
} catch (error) {
  HospitalEmbedding = mongoose.model('HospitalEmbedding', hospitalEmbeddingSchema);
}

module.exports = { HospitalEmbedding }; 