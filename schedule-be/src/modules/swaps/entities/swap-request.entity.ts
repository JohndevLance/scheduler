import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SwapStatus, SwapType } from '../../../common/enums/swap-status.enum';
import { User } from '../../users/entities/user.entity';
import { Shift } from '../../shifts/entities/shift.entity';

@Entity('swap_requests')
export class SwapRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'shift_id' })
  shiftId: string;

  @ManyToOne(() => Shift, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shift_id' })
  shift: Shift;

  @Column({ type: 'uuid', name: 'requester_id' })
  requesterId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requester_id' })
  requester: User;

  /** Null until a volunteer accepts (SWAP) or manager assigns coverage (DROP) */
  @Column({ type: 'uuid', name: 'cover_id', nullable: true })
  coverId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'cover_id' })
  cover: User | null;

  @Column({ type: 'enum', enum: SwapType })
  type: SwapType;

  @Column({
    type: 'enum',
    enum: SwapStatus,
    default: SwapStatus.PENDING_ACCEPTANCE,
  })
  status: SwapStatus;

  @Column({ type: 'varchar', length: 500, nullable: true })
  requesterNote: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  managerNote: string | null;

  @Column({ type: 'uuid', name: 'resolved_by_id', nullable: true })
  resolvedById: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'resolved_by_id' })
  resolvedBy: User | null;

  @Column({ type: 'timestamptz', nullable: true })
  resolvedAt: Date | null;

  /** Swap auto-expires if cover not found by this date */
  @Column({ type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
