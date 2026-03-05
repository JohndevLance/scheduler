import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { StaffLocation } from './staff-location.entity';

@Entity('locations')
export class Location {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150 })
  name: string;

  @Column({ length: 255 })
  address: string;

  @Column({ length: 100 })
  city: string;

  @Column({ length: 100 })
  state: string;

  @Column({ length: 20 })
  zipCode: string;

  /**
   * IANA timezone string (e.g. "America/Los_Angeles", "America/New_York").
   * All shift times for this location are displayed in this timezone.
   */
  @Column({ length: 60, default: 'America/New_York' })
  timezone: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'varchar', nullable: true, length: 20 })
  phone: string | null;

  @OneToMany(() => StaffLocation, (sl) => sl.location)
  staffCertifications: StaffLocation[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;
}
