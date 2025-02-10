# server/Dockerfile
FROM node:18
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

# 운영 환경으로 설정
ENV NODE_ENV=production
# (선택) 운영 DB 서버 주소가 필요하다면
ENV MONGO_URI=mongodb://34.64.58.121:27017/horoscope_db

EXPOSE 3001
CMD ["npm", "start"]
