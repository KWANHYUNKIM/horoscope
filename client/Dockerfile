# ---- 1) React build 단계 ----
    FROM node:18-alpine as builder

    WORKDIR /app
    
    # package.json, package-lock.json 복사
    COPY package*.json ./
    
    RUN npm install
    
    # 나머지 React 소스 전체 복사
    COPY . .
    
    # 로컬 개발 환경에서 사용할 API URL 설정 (빌드 시 React 내부에 적용됨)
    ENV REACT_APP_API_URL=http://localhost:3001/api
    
    # 프로덕션 빌드
    RUN npm run build
    
    # ---- 2) Nginx를 사용해 정적 파일 서빙 ----
    FROM nginx:alpine
    
    # 빌드된 결과물(builder 단계)을 /usr/share/nginx/html/ 에 복사
    COPY --from=builder /app/build /usr/share/nginx/html
    
    # default.conf.template (템플릿 파일) 복사
    COPY default.conf.template /etc/nginx/conf.d/default.conf.template
    
    # run.sh 스크립트 복사 및 실행 권한 부여
    COPY run.sh /run.sh
    RUN chmod +x /run.sh
    
    # API_BACKEND 환경 변수를 기본값으로 설정 (원하는 값으로 수정 가능)
    # 예: 로컬에서는 localhost:3002, Docker에서는 express_server:3001 등으로 설정.
    ENV API_BACKEND=localhost:3002
    
    EXPOSE 8080
    
    # run.sh 스크립트를 실행하여 Nginx 설정을 생성한 후, Nginx 실행
    CMD ["/run.sh"]
    