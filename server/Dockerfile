# server/Dockerfile
# 1. Node.js 기본 이미지 사용
FROM node:18

# 2. 작업 디렉터리 설정
WORKDIR /usr/src/app

# 3. package.json 및 package-lock.json 복사
COPY package*.json ./

# 4. npm 패키지 설치
RUN npm install

# 5. 서버 코드 복사
COPY . .

# 6. 서버 실행 포트 설정
EXPOSE 3001

# 7. 서버 실행
CMD ["npm", "start"]
