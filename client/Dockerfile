# ---- 1단계: React 애플리케이션 빌드 ----
    FROM node:18-alpine as builder

    WORKDIR /app
    
    # package.json 및 package-lock.json 복사
    COPY package*.json ./
    
    # 의존성 설치
    RUN npm install
    
    # React 소스 전체 복사
    COPY . .
    
    # 빌드 시점에 API 호출 URL 설정 (Express 서버 컨테이너 이름 사용)
    ENV REACT_APP_API_URL=http://express_server:3001/api
    
    # 프로덕션 빌드
    RUN npm run build
    
    # ---- 2단계: Node 기반 정적 파일 서버 (serve) 사용 ----
    FROM node:18-alpine as runner
    
    WORKDIR /app
    
    # 정적 파일 서빙을 위한 serve 패키지 전역 설치
    RUN npm install -g serve
    
    # 빌드 결과물을 runner 단계로 복사
    COPY --from=builder /app/build ./build
    
    # 컨테이너 내부에서 사용할 포트 (여기서는 3000번 사용)
    EXPOSE 3001
    
    # serve 명령어를 사용해 빌드 결과물을 서빙 (SPA 모드)
    CMD ["serve", "-s", "build", "-l", "3001"]
    