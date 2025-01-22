// src/kafka/producer.js

const kafka = require('kafka-node');
require('dotenv').config();

const Producer = kafka.Producer;
const client = new kafka.KafkaClient({ kafkaHost: process.env.KAFKA_HOST });
const producer = new Producer(client);

producer.on('ready', () => {
  console.log('Kafka Producer is connected and ready.');
});

producer.on('error', (err) => {
  console.error('Kafka Producer error:', err);
});

const sendMessage = (topic, message) => {
  const payloads = [
    { topic: topic, messages: JSON.stringify(message) },
  ];
  producer.send(payloads, (err, data) => {
    if (err) {
      console.error('Error sending message to Kafka:', err);
    } else {
      console.log('Message sent to Kafka:', data);
    }
  });
};

module.exports = sendMessage;