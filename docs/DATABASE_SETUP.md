# 데이터베이스 설정 가이드

## PostgreSQL 설치 및 설정

### 1. PostgreSQL 설치

#### Windows
```bash
# PostgreSQL 공식 사이트에서 설치
# https://www.postgresql.org/download/windows/
```

#### macOS (Homebrew)
```bash
brew install postgresql
brew services start postgresql
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. 데이터베이스 생성

PostgreSQL에 접속:
```bash
# Windows/Linux
psql -U postgres

# macOS
psql postgres
```

데이터베이스 생성:
```sql
CREATE DATABASE ict_rules_quiz;
CREATE USER quiz_admin WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE ict_rules_quiz TO quiz_admin;
\q
```

### 3. 환경 변수 설정

`server/.env` 파일 수정:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ict_rules_quiz
DB_USER=postgres
DB_PASSWORD=your_password
```

### 4. 마이그레이션 실행

```bash
cd server

# 의존성 설치
npm install

# 마이그레이션 실행 (테이블 생성)
npm run db:migrate

# Seeder 실행 (Admin 계정 생성)
npm run db:seed
```

### 5. 데이터베이스 확인

```bash
psql -U postgres -d ict_rules_quiz

# 테이블 목록 확인
\dt

# Users 테이블 확인
SELECT * FROM users;
```

## 마이그레이션 명령어

```bash
# 모든 마이그레이션 실행
npm run db:migrate

# 마이그레이션 되돌리기 (마지막 1개)
npx sequelize-cli db:migrate:undo

# 모든 마이그레이션 되돌리기
npx sequelize-cli db:migrate:undo:all

# Seeder 실행
npm run db:seed

# 데이터베이스 초기화 (모두 삭제 후 재생성)
npm run db:reset
```

## 기본 Admin 계정

설치 후 자동으로 생성되는 관리자 계정:

- **행원번호**: `admin`
- **비밀번호**: `admin@`

⚠️ **보안 경고**: 프로덕션 환경에서는 반드시 비밀번호를 변경하세요!

## 문제 해결

### Connection refused 에러
```bash
# PostgreSQL 서비스 상태 확인
# Windows
sc query postgresql-x64-14

# macOS/Linux
sudo systemctl status postgresql
```

### Authentication failed 에러
- `.env` 파일의 DB_USER와 DB_PASSWORD 확인
- PostgreSQL 사용자 비밀번호 재설정:
```sql
ALTER USER postgres PASSWORD 'new_password';
```

### 테이블이 생성되지 않음
```bash
# 마이그레이션 상태 확인
npx sequelize-cli db:migrate:status

# 마이그레이션 재실행
npm run db:reset
```
