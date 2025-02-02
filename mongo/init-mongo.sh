#!/bin/bash
echo "🔄 Restoring MongoDB dump into container..."

# MongoDB가 시작될 때까지 대기
until mongosh --host localhost --eval "print('MongoDB is ready!')" > /dev/null 2>&1; do
  echo "⏳ Waiting for MongoDB to start..."
  sleep 3
done

# 기존 DB 삭제 (새로운 데이터를 강제 삽입)
mongosh --host localhost --eval "use horoscope_db; db.dropDatabase();"

# 데이터 복원
mongorestore --host localhost --port 27017 --db horoscope_db /data/backup/horoscope_db

echo "✅ MongoDB restore completed!"
