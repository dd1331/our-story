# 코딩 테스트 과제

이 프로젝트는 두 가지 과제를 포함합니다:

1. **피보나치 수열 성능 최적화**
2. **선착순 이벤트 페이지 구현**

## 과제 1: 피보나치 수열

### 다양한 방법

#### **1. 메모이제이션 (Memoization) - 기본 전략**

- **시간 복잡도**: O(n)
- **공간 복잡도**: O(n)
- **특징**: 중복 계산을 방지하여 성능 향상
- **적용**: 동적 프로그래밍 기법

#### **2. 반복문 (Iterative)**

- **시간 복잡도**: O(n)
- **공간 복잡도**: O(1)
- **특징**: 상수 공간만 사용하여 메모리 효율적
- **적용**: 단순 반복문으로 구현

#### **3. 행렬 거듭제곱 (Matrix Exponentiation)**

- **시간 복잡도**: O(log n)
- **공간 복잡도**: O(1)
- **특징**: 가장 빠른 알고리즘 중 하나
- **적용**: 행렬의 거듭제곱을 이용한 계산

#### **4. Binet 공식**

- **시간 복잡도**: O(1)
- **공간 복잡도**: O(1)
- **특징**: 수학적 공식으로 즉시 계산
- **제한**: 큰 수에서 정확도 문제

### 메모이제이션을 기본 전략으로 선택한 이유

1. **실용성**: 대부분의 실제 사용 사례에서 충분히 빠름
2. **안정성**: 정확한 결과 보장
3. **확장성**: 다른 전략으로 쉽게 교체 가능
4. **메모리 효율성**: 필요한 값만 저장
5. **구현 복잡도**: 이해하기 쉽고 유지보수 용이

### 전략 패턴의 유연성

**실시간 전략 변경 가능:**

```bash
# 현재 전략 확인
curl http://localhost:3000/fibonacci/strategy/current

# 전략 변경
curl -X POST http://localhost:3000/fibonacci/strategy \
  -H "Content-Type: application/json" \
  -d '{"strategy": "iterative"}'

# 변경된 전략으로 계산
curl http://localhost:3000/fibonacci/10
```

**지원하는 전략들:**

- `memoization`: 메모이제이션 (기본)
- `iterative`: 반복문
- `matrix`: 행렬 거듭제곱
- `binet`: Binet 공식

**전략 패턴의 장점:**

1. **런타임 전략 변경**: API를 통해 실시간으로 알고리즘 교체
2. **확장성**: 새로운 알고리즘 쉽게 추가 가능
3. **테스트 용이성**: 각 전략을 독립적으로 테스트
4. **성능 최적화**: 상황에 맞는 최적의 알고리즘 선택

### 실행 방법

#### **Node.js/TypeScript 환경**

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run start:dev

# 콘솔 테스트 실행
npm run fibonacci:test

# 성능 비교 테스트
npm run fibonacci:compare

# 단위 테스트
npm test

# E2E 테스트
npm run test:e2e
```

#### **HTTP API 사용**

```bash
# 피보나치 계산
curl http://localhost:3000/fibonacci/10
```

**응답 예시:**

```json
{
  "method": "memoization",
  "input": 10,
  "result": "55",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 과제 2: 선착순 이벤트 페이지 구현

### 아키텍처

#### **Redis-MySQL 하이브리드 방식**

- **Redis**: 고성능 원자적 카운터 및 빠른 중복 체크
- **MySQL**: 영구 저장소 및 데이터 일관성 보장
- **외부 재시도 위임**: 네트워크 장애나 일시적 DB 문제 대응

#### **동시성 제어 플로우**

```
1. Redis 중복 체크 (빠른 조회)
2. Redis 원자적 카운터 증가 (동시성 보장)
3. MySQL 트랜잭션 처리 (외부 재시도 위임)
4. Redis 사용자 상태 저장 (캐싱)
```

#### **재시도 로직 (Resilience Pattern)**

- **외부 위임 방식**: RetryService로 재시도 로직을 외부로 위임
- **다양한 위임 방식**: 큐, 이벤트, 배치 등으로 위임 가능
- **재시도 대상**: 네트워크 오류, DB 연결 실패, 데드락 등
- **재시도 제외**: 중복 신청 에러 (ConflictException)
- **실패 시 처리**: Redis 카운터 되돌리기

### 처리 로직 설명

#### **1. 선착순 판별 방식**

- **Redis 원자적 카운터**: `INCR` 명령으로 순서 번호 할당
- **동시성 보장**: Redis의 원자적 연산으로 중복 순서 방지
- **실시간 처리**: 메모리 기반 빠른 카운터 증가

**INCR 명령 사용 위치**:

```typescript
// src/event/services/redis-counter.service.ts
async incrementEventCounter(eventId: number): Promise<number> {
  const key = `event:${eventId}:counter`;
  const currentValue = (await this.cacheManager.get<number>(key)) || 0;
  const newValue = currentValue + 1;
  await this.cacheManager.set(key, newValue);
  return newValue;
}
```

#### **2. 동시성/중복 방지 처리 방식**

##### **재시도 로직 (Resilience)**

```typescript
// 외부 재시도 서비스에 위임
const savedApplication = await this.saveApplicationToDatabase(
  eventId,
  userId,
  applicationOrder,
).catch((error: Error) => {
  this.retryService.delegateToExternalRetryService(error);
  throw error;
});
```

### API 명세

#### **포인트 신청**

```http
POST /event/apply
Content-Type: application/json

{
  "userId": "user123"
}
```

**응답 예시**:

```json
{
  "success": true,
  "data": {
    "userId": "user123",
    "orderNumber": 1,
    "points": 100000,
    "timestamp": "2024-01-15T10:30:00.000Z"
  },
  "message": "포인트 신청이 완료되었습니다. 1번째 참가자로 100,000포인트가 지급됩니다."
}
```

**에러 응답 예시**:

```json
{
  "success": false,
  "message": "이미 포인트를 신청한 사용자입니다.",
  "statusCode": 409
}
```

### 프로젝트 실행 방법

#### **방법 1: Docker (권장)**

```bash
# 모든 서비스 실행 (MySQL, Redis, 애플리케이션)
docker-compose up -d

# 로그 확인
docker-compose logs -f app

# 서비스 상태 확인
docker-compose ps
```

#### **방법 2: 로컬 설치**

```bash
# Node.js 18+ 설치 필요

# 의존성 설치
npm install

# MySQL 설치 및 설정
# - MySQL 8.0 설치
# - 데이터베이스 생성: CREATE DATABASE event_db;

# Redis 설치 및 설정
# - Redis 7+ 설치
# - 기본 포트 6379 사용

# 환경 변수 설정
export DB_HOST=localhost
export DB_PORT=3306
export DB_USERNAME=root
export DB_PASSWORD=your_password
export DB_DATABASE=event_db
export REDIS_HOST=localhost
export REDIS_PORT=6379

# 애플리케이션 실행
npm run start:dev
```

### 테스트

#### **단위 테스트**

```bash
npm test
```

#### **E2E 테스트**

```bash
npm run test:e2e
```

#### **콘솔 테스트 케이스**

```bash
# 피보나치 테스트
npm run fibonacci:test

# 성능 비교
npm run fibonacci:compare
```

### 서비스 중지

```bash
# Docker 환경
docker-compose down

# 데이터까지 삭제
docker-compose down -v
```

## 기술적 특징

### **피보나치 수열**

- **전략 패턴**: 다양한 알고리즘 쉽게 교체 가능
- **성능 최적화**: 메모이제이션, 행렬 거듭제곱 등
- **확장성**: 새로운 알고리즘 쉽게 추가 가능

### **이벤트 페이지**

- **동시성 제어**: Redis-MySQL 하이브리드
- **고성능**: 원자적 카운터로 빠른 처리
- **안정성**: 트랜잭션과 재시도 로직
- **확장성**: 마이크로서비스 아키텍처 준비
