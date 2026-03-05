import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { DayOfWeek } from '../../../common/enums/day-of-week.enum';

/**
 * Recurring weekly availability window.
 * e.g. every Monday 09:00–17:00
 */
@Entity('availabilities')
export class Availability {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.availabilities, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'int', comment: '0=Sun, 1=Mon, ... 6=Sat' })
  dayOfWeek: DayOfWeek;

  @Column({ type: 'time', comment: 'Start time in user local time e.g. 09:00' })
  startTime: string;

  @Column({ type: 'time', comment: 'End time in user local time e.g. 17:00' })
  endTime: string;

  @Column({ default: true })
  isAvailable: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
