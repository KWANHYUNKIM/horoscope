FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ENV REACT_APP_API_URL=http://express_server:3001/api
RUN npm run build

FROM node:18-alpine as runner

WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/build ./build

# Cloud Run에서 주입하는 PORT 환경변수를 사용하도록 EXPOSE 및 CMD 설정
EXPOSE $PORT
CMD ["sh", "-c", "serve -s build -l ${PORT}"]
