import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EventService } from './event.service';
import { RedisBasedEventRepository } from './repositories/redis-based-event.repository';
import { RedisCounterService } from './services/redis-counter.service';

describe('EventService', () => {
  let service: EventService;

  const mockRedisBasedEventRepository = {
    findActiveEvent: jest.fn(),
    createEvent: jest.fn(),
    applyForPointsWithRedis: jest.fn(),
  };

  const mockRedisCounterService = {
    incrementEventCounter: jest.fn(),
    getEventCounter: jest.fn(),
    resetEventCounter: jest.fn(),
    isUserApplied: jest.fn(),
    setUserApplied: jest.fn(),
    getUserOrder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventService,
        {
          provide: RedisBasedEventRepository,
          useValue: mockRedisBasedEventRepository,
        },
        {
          provide: RedisCounterService,
          useValue: mockRedisCounterService,
        },
      ],
    }).compile();

    service = module.get<EventService>(EventService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('applyForPoints', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should successfully apply for points for first user', async () => {
      mockRedisBasedEventRepository.applyForPointsWithRedis.mockResolvedValue({
        userId: 'user1',
        applicationOrder: 1,
        points: 100000,
        createdAt: new Date(),
      });

      const result = await service.applyForPoints('user1');

      expect(result.userId).toBe('user1');
      expect(result.orderNumber).toBe(1);
      expect(result.points).toBe(100000);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should assign correct points based on order', async () => {
      // 1-100번: 100,000점
      mockRedisBasedEventRepository.applyForPointsWithRedis.mockResolvedValue({
        userId: 'user1',
        applicationOrder: 1,
        points: 100000,
        createdAt: new Date(),
      });

      const user1 = await service.applyForPoints('user1');
      expect(user1.orderNumber).toBe(1);
      expect(user1.points).toBe(100000);

      // 101-2000번: 50,000점
      mockRedisBasedEventRepository.applyForPointsWithRedis.mockResolvedValue({
        userId: 'user102',
        applicationOrder: 102,
        points: 50000,
        createdAt: new Date(),
      });

      const user102 = await service.applyForPoints('user102');
      expect(user102.orderNumber).toBe(102);
      expect(user102.points).toBe(50000);
    });

    it('should prevent duplicate applications', async () => {
      mockRedisBasedEventRepository.applyForPointsWithRedis.mockRejectedValue(
        new ConflictException('이미 포인트를 신청한 사용자입니다.'),
      );

      try {
        await service.applyForPoints('user1');
        fail('Should have thrown ConflictException');
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictException);
        expect((error as ConflictException).message).toBe(
          '이미 포인트를 신청한 사용자입니다.',
        );
      }
    });

    it('should prevent applications after max participants reached', async () => {
      mockRedisBasedEventRepository.applyForPointsWithRedis.mockRejectedValue(
        new BadRequestException('이벤트 참가 인원이 마감되었습니다.'),
      );

      try {
        await service.applyForPoints('user10001');
        fail('Should have thrown BadRequestException');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).message).toBe(
          '이벤트 참가 인원이 마감되었습니다.',
        );
      }
    });
  });

  describe('concurrency control', () => {
    it('should handle concurrent applications correctly', async () => {
      // 첫 번째 요청
      mockRedisBasedEventRepository.applyForPointsWithRedis.mockResolvedValueOnce(
        {
          userId: 'user1',
          applicationOrder: 1,
          points: 100000,
          createdAt: new Date(),
        },
      );

      // 두 번째 요청 (동시에)
      mockRedisBasedEventRepository.applyForPointsWithRedis.mockResolvedValueOnce(
        {
          userId: 'user2',
          applicationOrder: 2,
          points: 100000,
          createdAt: new Date(),
        },
      );

      // 동시 실행
      const [result1, result2] = await Promise.all([
        service.applyForPoints('user1'),
        service.applyForPoints('user2'),
      ]);

      expect(result1.orderNumber).toBe(1);
      expect(result2.orderNumber).toBe(2);
      expect(result1.userId).toBe('user1');
      expect(result2.userId).toBe('user2');
    });

    it('should prevent duplicate applications in concurrent scenarios', async () => {
      // 첫 번째 요청 성공
      mockRedisBasedEventRepository.applyForPointsWithRedis.mockResolvedValueOnce(
        {
          userId: 'duplicateuser',
          applicationOrder: 1,
          points: 100000,
          createdAt: new Date(),
        },
      );

      // 두 번째 요청 실패 (중복)
      mockRedisBasedEventRepository.applyForPointsWithRedis.mockRejectedValueOnce(
        new ConflictException('이미 포인트를 신청한 사용자입니다.'),
      );

      // 첫 번째 요청은 성공
      const result1 = await service.applyForPoints('duplicateuser');
      expect(result1.orderNumber).toBe(1);

      // 두 번째 요청은 실패
      try {
        await service.applyForPoints('duplicateuser');
        fail('Should have thrown ConflictException');
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictException);
      }
    });
  });
});
