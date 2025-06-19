"# attedance_register_web" 

# 출석 관리 시스템 배포 가이드 (Cloudtype)

## 1. 환경 변수(.env) 예시
```
DB_HOST=attendance-register-db.crie04cusybr.ap-southeast-2.rds.amazonaws.com
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=attendance_db
DB_PORT=3306
```

Cloudtype 환경변수 설정에서 위 항목을 모두 등록하세요.

## 2. 빌드/실행 명령어
```
npm install
node server.js
```

## 3. AWS RDS 보안 그룹
- Cloudtype 서버의 IP(혹은 0.0.0.0/0, 테스트용)에서 3306 포트 인바운드 허용

## 4. 기타
- config.js는 환경변수 기반으로 동작합니다.
- .env 파일은 로컬 개발용, Cloudtype은 환경변수 UI에서 직접 입력 
