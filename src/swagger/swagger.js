const swaggerJsDoc = require('swagger-jsdoc');
const path = require('path');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Horoscope API Documentation',
    version: '1.0.0',
    description: '운세 API에 대한 Swagger 문서입니다.',
    contact: {
      name: '김관현',
      email: 'molba06@naver.com',
    },
  },
  servers: [
    {
      url: 'http://localhost:3001', // API 서버 URL
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: [path.join(__dirname, '../routes/*.js')], // horoscopeRoutes.js 경로 지정
};

const swaggerSpec = swaggerJsDoc(options);

module.exports = swaggerSpec;