import { Injectable } from '@nestjs/common';
import { RedisBasedEventRepository } from './repositories/redis-based-event.repository';

@Injectable()
export class EventService {
  private readonly defaultEventId = 1; // 기본 이벤트 ID

  constructor(
    private readonly redisBasedEventRepository: RedisBasedEventRepository,
  ) {}

  async applyForPoints(userId: string): Promise<{
    userId: string;
    orderNumber: number;
    points: number;
    timestamp: Date;
  }> {
    // Redis 기반 방식으로 포인트 신청
    const application =
      await this.redisBasedEventRepository.applyForPointsWithRedis(
        this.defaultEventId,
        userId,
      );

    return {
      userId: application.userId,
      orderNumber: application.applicationOrder,
      points: application.points,
      timestamp: application.createdAt,
    };
  }

  // 이벤트 초기화 (첫 실행 시 사용)
  async initializeEvent(): Promise<void> {
    const existingEvent =
      await this.redisBasedEventRepository.findActiveEvent();
    if (!existingEvent) {
      await this.redisBasedEventRepository.createEvent(
        '선착순 포인트 이벤트',
        10000,
      );
    }
  }
}
