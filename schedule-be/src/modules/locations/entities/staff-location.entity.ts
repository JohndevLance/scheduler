import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Location } from './location.entity';

/**
 * Certifies that a staff member is authorised to work at a location.
 * isActive = false means de-certified (soft approach).
 * Past shift assignments are preserved; future ones are blocked.
 */
@Entity('staff_locations')
export class StaffLocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => Location, (l) => l.staffCertifications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'location_id' })
  location: Location;

  @Column({ name: 'location_id' })
  locationId: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true, type: 'timestamp with time zone' })
  certifiedAt: Date | null;

  @Column({ nullable: true, type: 'timestamp with time zone' })
  decertifiedAt: Date | null;

  @Column({
    type: 'varchar',
    nullable: true,
    length: 255,
    comment: 'Reason for de-certification',
  })
  decertificationReason: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
