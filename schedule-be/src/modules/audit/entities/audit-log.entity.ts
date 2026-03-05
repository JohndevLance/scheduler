import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('audit_logs')
@Index(['entityType', 'entityId'])
@Index(['actorId'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Null for system-initiated actions */
  @Column({ type: 'uuid', name: 'actor_id', nullable: true })
  actorId: string | null;

  /** e.g. 'shift.assign', 'shift.publish', 'swap.approve', 'role.change' */
  @Column({ length: 100 })
  action: string;

  /** e.g. 'Shift', 'User', 'SwapRequest' */
  @Column({ length: 100 })
  entityType: string;

  @Column({ type: 'varchar', length: 255 })
  entityId: string;

  @Column({ type: 'jsonb', nullable: true })
  before: Record<string, any> | null;

  @Column({ type: 'jsonb', nullable: true })
  after: Record<string, any> | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ip: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
