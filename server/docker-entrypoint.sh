#!/bin/sh
set -e

echo "🔄 데이터베이스 마이그레이션 실행 중..."

# 마이그레이션 실행
npx sequelize-cli db:migrate

echo "✅ 마이그레이션 완료!"

# 서버 시작
echo "🚀 서버 시작 중..."
exec node server.js
