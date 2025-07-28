import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Event } from '../event/entities/event.entity';
import { PointApplication } from '../event/entities/point-application.entity';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'event_db',
  entities: [Event, PointApplication],
  synchronize: process.env.NODE_ENV === 'development', // 개발 환경에서만 사용
  logging: process.env.NODE_ENV === 'development',
};

export const testDatabaseConfig: TypeOrmModuleOptions = {
  type: 'mysql',
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT || '3306'),
  username: process.env.TEST_DB_USERNAME || 'root',
  password: process.env.TEST_DB_PASSWORD || 'password',
  database: process.env.TEST_DB_DATABASE || 'event_test_db',
  entities: [Event, PointApplication],
  synchronize: true, // 테스트에서는 항상 동기화
  logging: false,
};
