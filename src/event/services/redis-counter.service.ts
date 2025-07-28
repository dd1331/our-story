import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class RedisCounterService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async incrementEventCounter(eventId: number): Promise<number> {
    const key = `event:${eventId}:counter`;
    const currentValue = (await this.cacheManager.get<number>(key)) || 0;
    const newValue = currentValue + 1;
    await this.cacheManager.set(key, newValue);
    return newValue;
  }

  /**
   * 이벤트 카운터 조회
   */
  async getEventCounter(eventId: number): Promise<number> {
    const key = `event:${eventId}:counter`;
    return (await this.cacheManager.get<number>(key)) || 0;
  }

  /**
   * 이벤트 카운터 설정
   */
  async setEventCounter(eventId: number, value: number): Promise<void> {
    const key = `event:${eventId}:counter`;
    await this.cacheManager.set(key, value);
  }

  /**
   * 이벤트 카운터 리셋
   */
  async resetEventCounter(eventId: number): Promise<void> {
    const key = `event:${eventId}:counter`;
    await this.cacheManager.del(key);
  }

  /**
   * 사용자 신청 상태 확인
   */
  async isUserApplied(eventId: number, userId: string): Promise<boolean> {
    const key = `event:${eventId}:user:${userId}`;
    return (await this.cacheManager.get<boolean>(key)) || false;
  }

  /**
   * 사용자 신청 상태 설정
   */
  async setUserApplied(
    eventId: number,
    userId: string,
    orderNumber: number,
  ): Promise<void> {
    const key = `event:${eventId}:user:${userId}`;
    await this.cacheManager.set(key, true);

    // 사용자 순서 정보 저장
    const orderKey = `event:${eventId}:user:${userId}:order`;
    await this.cacheManager.set(orderKey, orderNumber);
  }

  /**
   * 사용자 순서 번호 조회
   */
  async getUserOrder(eventId: number, userId: string): Promise<number | null> {
    const key = `event:${eventId}:user:${userId}:order`;
    return (await this.cacheManager.get<number>(key)) || null;
  }
}
