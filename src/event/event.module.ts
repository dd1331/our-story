import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { redisConfig } from '../config/redis.config';
import { Event } from './entities/event.entity';
import { PointApplication } from './entities/point-application.entity';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { RedisBasedEventRepository } from './repositories/redis-based-event.repository';
import { RedisCounterService } from './services/redis-counter.service';
import { RetryService } from './services/retry.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event, PointApplication]),
    CacheModule.register(redisConfig),
  ],
  controllers: [EventController],
  providers: [
    EventService,
    RedisBasedEventRepository,
    RedisCounterService,
    RetryService,
  ],
  exports: [EventService],
})
export class EventModule {}
