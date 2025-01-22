// src/ai/model.js

const tf = require('@tensorflow/tfjs-node');
// 또는 브라우저용 모델을 사용할 경우 '@tensorflow/tfjs'

const loadModel = async () => {
  const model = await tf.loadLayersModel('file://path/to/model.json');
  return model;
};

module.exports = loadModel;