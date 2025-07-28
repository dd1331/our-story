import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('point_applications')
export class PointApplication {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  eventId: number;

  @Column({ unique: true })
  userId: string;

  @Column()
  applicationOrder: number;

  @Column()
  points: number;

  @CreateDateColumn()
  createdAt: Date;
}
