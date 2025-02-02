FROM mongo:6.0

# MongoDB 초기 데이터 복사
COPY backup/ /data/backup/

# 데이터 자동 복원 스크립트 추가
COPY init-mongo.sh /docker-entrypoint-initdb.d/init-mongo.sh
RUN chmod +x /docker-entrypoint-initdb.d/init-mongo.sh
