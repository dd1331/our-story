import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { testDatabaseConfig } from '../src/config/database.config';
import { Event } from '../src/event/entities/event.entity';
import { PointApplication } from '../src/event/entities/point-application.entity';
import { RedisCounterService } from '../src/event/services/redis-counter.service';

describe('EventController (e2e)', () => {
  let app: INestApplication;
  let eventRepository: Repository<Event>;
  let pointApplicationRepository: Repository<PointApplication>;
  let redisCounterService: RedisCounterService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        TypeOrmModule.forRoot(testDatabaseConfig),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    eventRepository = moduleFixture.get<Repository<Event>>(
      getRepositoryToken(Event),
    );
    pointApplicationRepository = moduleFixture.get<
      Repository<PointApplication>
    >(getRepositoryToken(PointApplication));
    redisCounterService =
      moduleFixture.get<RedisCounterService>(RedisCounterService);
    await app.init();
  });

  beforeEach(async () => {
    // 테스트 전에 데이터베이스 초기화
    await pointApplicationRepository.clear();
    await eventRepository.clear();

    // Redis 카운터 초기화
    await redisCounterService.resetEventCounter(1);

    // 기본 이벤트 생성
    await eventRepository.save({
      id: 1,
      name: '선착순 포인트 이벤트',
      currentParticipants: 0,
      maxParticipants: 10000,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/event/apply (POST)', () => {
    it('should apply for points successfully', () => {
      return request(app.getHttpServer())
        .post('/event/apply')
        .send({ userId: 'testuser' })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.userId).toBe('testuser');
          expect(res.body.data.orderNumber).toBe(1);
          expect(res.body.data.points).toBe(100000);
          expect(res.body.data.timestamp).toBeDefined();
        });
    });

    it('should prevent duplicate applications', async () => {
      // 첫 번째 신청
      await request(app.getHttpServer())
        .post('/event/apply')
        .send({ userId: 'duplicateuser' })
        .expect(201);

      // 중복 신청 시도
      return request(app.getHttpServer())
        .post('/event/apply')
        .send({ userId: 'duplicateuser' })
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toBe('이미 포인트를 신청한 사용자입니다.');
        });
    });

    it('should assign correct points based on order', async () => {
      // 1-100번: 100,000점
      await request(app.getHttpServer())
        .post('/event/apply')
        .send({ userId: 'user1' })
        .expect(201)
        .expect((res) => {
          expect(res.body.data.orderNumber).toBe(1);
          expect(res.body.data.points).toBe(100000);
        });

      // 101-2000번: 50,000점 (100명 추가 신청)
      for (let i = 2; i <= 101; i++) {
        await request(app.getHttpServer())
          .post('/event/apply')
          .send({ userId: `user${i}` })
          .expect(201);
      }

      // 102번째 신청자 (50,000점)
      return request(app.getHttpServer())
        .post('/event/apply')
        .send({ userId: 'user102' })
        .expect(201)
        .expect((res) => {
          expect(res.body.data.orderNumber).toBe(102);
          expect(res.body.data.points).toBe(50000);
        });
    });
  });

  describe('/event/status/:userId (GET)', () => {
    it('should return user status for existing user', async () => {
      // 먼저 신청
      await request(app.getHttpServer())
        .post('/event/apply')
        .send({ userId: 'statususer' })
        .expect(201);

      // 상태 조회
      return request(app.getHttpServer())
        .get('/event/status/statususer')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.userId).toBe('statususer');
          expect(res.body.data.orderNumber).toBe(1);
          expect(res.body.data.points).toBe(100000);
        });
    });

    it('should return null for non-existent user', () => {
      return request(app.getHttpServer())
        .get('/event/status/nonexistent')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.data).toBeNull();
          expect(res.body.message).toBe('아직 포인트를 신청하지 않았습니다.');
        });
    });
  });

  describe('/event/stats (GET)', () => {
    it('should return event statistics', async () => {
      // 참가자 추가
      await request(app.getHttpServer())
        .post('/event/apply')
        .send({ userId: 'statsuser1' })
        .expect(201);

      await request(app.getHttpServer())
        .post('/event/apply')
        .send({ userId: 'statsuser2' })
        .expect(201);

      return request(app.getHttpServer())
        .get('/event/stats')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.totalParticipants).toBe(2);
          expect(res.body.data.remainingSlots).toBe(9998);
          expect(res.body.data.currentAllocation).toHaveLength(2);
        });
    });
  });

  describe('/event/participants (GET)', () => {
    it('should return all participants', async () => {
      // 참가자 추가
      await request(app.getHttpServer())
        .post('/event/apply')
        .send({ userId: 'participant1' })
        .expect(201);

      await request(app.getHttpServer())
        .post('/event/apply')
        .send({ userId: 'participant2' })
        .expect(201);

      return request(app.getHttpServer())
        .get('/event/participants')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveLength(2);
          expect(res.body.message).toBe('총 2명의 참가자가 있습니다.');
        });
    });
  });

  describe('/event/reset (POST)', () => {
    it('should reset event', async () => {
      // 참가자 추가
      await request(app.getHttpServer())
        .post('/event/apply')
        .send({ userId: 'resetuser' })
        .expect(201);

      // 초기화
      await request(app.getHttpServer())
        .post('/event/reset')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toBe('이벤트가 초기화되었습니다.');
        });

      // 초기화 후 통계 확인
      return request(app.getHttpServer())
        .get('/event/stats')
        .expect(200)
        .expect((res) => {
          expect(res.body.data.totalParticipants).toBe(0);
          expect(res.body.data.remainingSlots).toBe(10000);
        });
    });
  });
});
