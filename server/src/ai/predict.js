// src/ai/predict.js

const loadModel = require('./model');

let model;

const initializeModel = async () => {
  model = await loadModel();
};

const predict = async (inputData) => {
  if (!model) {
    await initializeModel();
  }
  const tensor = tf.tensor(inputData);
  const prediction = model.predict(tensor);
  return prediction.dataSync();
};

module.exports = { predict, initializeModel };