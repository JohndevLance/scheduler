import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Location } from '../../locations/entities/location.entity';
import { Skill } from '../../users/entities/skill.entity';
import { ShiftAssignment } from './shift-assignment.entity';
import { ShiftStatus } from '../../../common/enums/shift-status.enum';

@Entity('shifts')
export class Shift {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Location, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'location_id' })
  location: Location;

  @Column({ name: 'location_id' })
  locationId: string;

  @ManyToOne(() => Skill, { nullable: true, eager: true })
  @JoinColumn({ name: 'required_skill_id' })
  requiredSkill: Skill | null;

  @Column({ name: 'required_skill_id', type: 'uuid', nullable: true })
  requiredSkillId: string | null;

  /**
   * All times stored in UTC. Use location.timezone for display.
   */
  @Column({ type: 'timestamp with time zone' })
  startTime: Date;

  @Column({ type: 'timestamp with time zone' })
  endTime: Date;

  @Column({
    type: 'int',
    default: 1,
    comment: 'Number of staff slots required',
  })
  headcount: number;

  @Column({ type: 'enum', enum: ShiftStatus, default: ShiftStatus.DRAFT })
  status: ShiftStatus;

  @Column({ type: 'varchar', nullable: true, length: 500 })
  notes: string | null;

  /**
   * Friday/Saturday evening (after 17:00 local) shifts are tagged premium
   * for fairness tracking.
   */
  @Column({ default: false })
  isPremium: boolean;

  @Column({
    name: 'published_at',
    nullable: true,
    type: 'timestamp with time zone',
  })
  publishedAt: Date | null;

  @Column({ name: 'published_by_id', type: 'uuid', nullable: true })
  publishedById: string | null;

  @OneToMany(() => ShiftAssignment, (a) => a.shift, { cascade: true })
  assignments: ShiftAssignment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  get durationHours(): number {
    return (
      (this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60 * 60)
    );
  }

  get isOvernight(): boolean {
    const start = new Date(this.startTime);
    const end = new Date(this.endTime);
    return end.getUTCDate() !== start.getUTCDate() || end <= start;
  }
}
