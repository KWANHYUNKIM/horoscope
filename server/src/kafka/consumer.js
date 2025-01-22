// src/kafka/consumer.js

const kafka = require('kafka-node');
require('dotenv').config();

const Consumer = kafka.Consumer;
const client = new kafka.KafkaClient({ kafkaHost: process.env.KAFKA_HOST });
const consumer = new Consumer(
  client,
  [{ topic: 'your_topic', partition: 0 }],
  {
    autoCommit: true,
  }
);

consumer.on('message', (message) => {
  console.log('Received message from Kafka:', message);
  // 데이터 처리 로직 추가
});

consumer.on('error', (err) => {
  console.error('Kafka Consumer error:', err);
});