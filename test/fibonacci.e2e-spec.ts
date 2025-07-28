import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('FibonacciController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/fibonacci/:n (GET)', () => {
    it('should return fibonacci number using memoization method', () => {
      return request(app.getHttpServer())
        .get('/fibonacci/10')
        .expect(200)
        .expect((res) => {
          expect(res.body.method).toBe('memoization');
          expect(res.body.input).toBe(10);
          expect(res.body.result).toBe('55');
          expect(res.body.timestamp).toBeDefined();
        });
    });

    it('should handle large numbers correctly', () => {
      return request(app.getHttpServer())
        .get('/fibonacci/20')
        .expect(200)
        .expect((res) => {
          expect(res.body.method).toBe('memoization');
          expect(res.body.input).toBe(20);
          expect(res.body.result).toBe('6765');
        });
    });

    it('should handle zero input', () => {
      return request(app.getHttpServer())
        .get('/fibonacci/0')
        .expect(200)
        .expect((res) => {
          expect(res.body.method).toBe('memoization');
          expect(res.body.input).toBe(0);
          expect(res.body.result).toBe('0');
        });
    });

    it('should handle one input', () => {
      return request(app.getHttpServer())
        .get('/fibonacci/1')
        .expect(200)
        .expect((res) => {
          expect(res.body.method).toBe('memoization');
          expect(res.body.input).toBe(1);
          expect(res.body.result).toBe('1');
        });
    });

    it('should return 400 for invalid input', () => {
      return request(app.getHttpServer()).get('/fibonacci/abc').expect(400);
    });

    it('should return 400 for negative input', () => {
      return request(app.getHttpServer()).get('/fibonacci/-1').expect(400);
    });

    it('should demonstrate memoization efficiency', async () => {
      // 첫 번째 호출
      const firstCall = await request(app.getHttpServer())
        .get('/fibonacci/30')
        .expect(200);

      // 두 번째 호출 (메모이제이션 효과)
      const secondCall = await request(app.getHttpServer())
        .get('/fibonacci/30')
        .expect(200);

      // 결과가 동일한지 확인
      expect(firstCall.body.result).toBe(secondCall.body.result);
      expect(firstCall.body.result).toBe(secondCall.body.result);
    });
  });
});
