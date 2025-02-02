# ---- 1) React build 단계 ----
    FROM node:18-alpine as builder

    WORKDIR /app
    
    # package.json, package-lock.json 복사
    COPY package*.json ./
    
    RUN npm install
    
    # 나머지 React 소스 전체 복사
    COPY . .
    
    # 프로덕션 빌드
    RUN npm run build
    
    # ---- 2) Nginx를 사용해 정적 파일 서빙 ----
    FROM nginx:alpine
    
    # 빌드된 결과물(builder 단계)을 /usr/share/nginx/html/ 에 복사
    COPY --from=builder /app/build /usr/share/nginx/html
    
    # default.conf (Nginx 설정 파일) 복사
    COPY default.conf /etc/nginx/conf.d/default.conf
    
    EXPOSE 8080
    CMD ["nginx", "-g", "daemon off;"]
    