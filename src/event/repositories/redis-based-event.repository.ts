import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Event } from '../entities/event.entity';
import { PointApplication } from '../entities/point-application.entity';
import { RedisCounterService } from '../services/redis-counter.service';
import { RetryService } from '../services/retry.service';

@Injectable()
export class RedisBasedEventRepository {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(PointApplication)
    private readonly pointApplicationRepository: Repository<PointApplication>,
    private readonly dataSource: DataSource,
    private readonly redisCounterService: RedisCounterService,
    private readonly retryService: RetryService,
  ) {}

  async findActiveEvent(): Promise<Event | null> {
    return await this.eventRepository.findOne({
      where: { isActive: true },
    });
  }

  async createEvent(
    name: string,
    maxParticipants: number = 10000,
  ): Promise<Event> {
    const event = this.eventRepository.create({
      name,
      maxParticipants,
      currentParticipants: 0,
      isActive: true,
    });
    return await this.eventRepository.save(event);
  }

  async applyForPointsWithRedis(
    eventId: number,
    userId: string,
  ): Promise<PointApplication> {
    // 1. 중복 신청 체크 (Redis에서 먼저 확인)
    await this.validateUserApplication(eventId, userId);

    // 2. 이벤트 유효성 검사
    const event = await this.validateEvent(eventId);

    // 3. Redis 원자적 카운터 증가 (동시성 보장)
    const applicationOrder = await this.incrementRedisCounter(
      eventId,
      event.maxParticipants,
    );

    // 4. MySQL 트랜잭션에서 저장 (외부 재시도 서비스 위임)
    const savedApplication = await this.saveApplicationToDatabase(
      eventId,
      userId,
      applicationOrder,
    );

    // 5. Redis 사용자 상태 저장
    await this.saveUserApplicationState(eventId, userId, applicationOrder);

    return savedApplication;
  }

  private async validateUserApplication(
    eventId: number,
    userId: string,
  ): Promise<void> {
    const isAlreadyApplied = await this.redisCounterService.isUserApplied(
      eventId,
      userId,
    );
    if (isAlreadyApplied) {
      throw new ConflictException('이미 포인트를 신청한 사용자입니다.');
    }
  }

  private async validateEvent(eventId: number): Promise<Event> {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
    });

    if (!event) {
      throw new BadRequestException('이벤트를 찾을 수 없습니다.');
    }

    if (!event.isActive) {
      throw new BadRequestException('이벤트가 비활성화되었습니다.');
    }

    return event;
  }

  private async saveUserApplicationState(
    eventId: number,
    userId: string,
    applicationOrder: number,
  ): Promise<void> {
    await this.redisCounterService.setUserApplied(
      eventId,
      userId,
      applicationOrder,
    );
  }

  private async incrementRedisCounter(
    eventId: number,
    maxParticipants: number,
  ): Promise<number> {
    // Redis 원자적 카운터 증가
    const applicationOrder =
      await this.redisCounterService.incrementEventCounter(eventId);

    if (applicationOrder > maxParticipants) {
      // 카운터 되돌리기 (실제로는 Redis의 DECR 사용이 더 좋지만, 여기서는 단순화)
      await this.redisCounterService.setEventCounter(
        eventId,
        applicationOrder - 1,
      );
      throw new BadRequestException('이벤트 참가 인원이 마감되었습니다.');
    }

    return applicationOrder;
  }

  private async saveApplicationToDatabase(
    eventId: number,
    userId: string,
    applicationOrder: number,
  ): Promise<PointApplication> {
    return await this.dataSource
      .transaction(async (manager) => {
        // 1. 이벤트 테이블에 락 걸고 조회
        const event = await manager.findOne(Event, {
          where: { id: eventId },
          lock: { mode: 'pessimistic_write' }, // SELECT ... FOR UPDATE
        });

        if (!event) {
          throw new BadRequestException('이벤트를 찾을 수 없습니다.');
        }

        // 2. 중복 신청 체크 (MySQL에서 확인)
        const existingApplication = await manager.findOne(PointApplication, {
          where: { userId, eventId },
        });

        if (existingApplication) {
          throw new ConflictException('이미 포인트를 신청한 사용자입니다.');
        }

        // 3. 포인트 계산
        const points = this.calculatePoints(applicationOrder);

        // 4. 포인트 신청 저장
        const pointApplication = manager.create(PointApplication, {
          eventId,
          userId,
          applicationOrder,
          points,
        });

        const savedApplication = await manager.save(pointApplication);

        // 5. 이벤트 카운터 업데이트 (Redis 카운터와 동기화)
        await manager.update(Event, eventId, {
          currentParticipants: applicationOrder,
        });

        return savedApplication;
      })
      .catch((error: Error) => {
        this.retryService.delegateToExternalRetryService(error);
        throw error;
      });
  }

  private calculatePoints(applicationOrder: number): number {
    if (applicationOrder <= 100) return 100000;
    if (applicationOrder <= 2000) return 50000;
    if (applicationOrder <= 5000) return 20000;
    if (applicationOrder <= 10000) return 10000;
    return 0;
  }
}
