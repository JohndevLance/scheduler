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

/**
 * One-off availability override for a specific date.
 * e.g. "I'm unavailable on 2026-03-15" or "I'm available 08:00-12:00 on 2026-03-20"
 */
@Entity('availability_exceptions')
export class AvailabilityException {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.availabilityExceptions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({
    type: 'date',
    comment: 'The specific date this exception applies to',
  })
  date: string;

  @Column({
    default: false,
    comment: 'If true, unavailable all day; overrides startTime/endTime',
  })
  isUnavailableAllDay: boolean;

  @Column({ type: 'time', nullable: true })
  startTime: string | null;

  @Column({ type: 'time', nullable: true })
  endTime: string | null;

  @Column({ type: 'varchar', nullable: true, length: 255 })
  reason: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
