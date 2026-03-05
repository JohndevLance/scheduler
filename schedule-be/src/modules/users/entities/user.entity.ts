import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Role } from '../../../common/enums/role.enum';
import { Availability } from './availability.entity';
import { AvailabilityException } from './availability-exception.entity';
import { Skill } from './skill.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  firstName: string;

  @Column({ length: 100 })
  lastName: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ type: 'enum', enum: Role, default: Role.STAFF })
  role: Role;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'int', nullable: true, comment: 'Desired hours per week' })
  desiredHoursPerWeek: number | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({
    length: 50,
    default: 'UTC',
    comment: 'User preferred display timezone',
  })
  timezone: string;

  @ManyToMany(() => Skill, { eager: true })
  @JoinTable({
    name: 'user_skills',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'skill_id', referencedColumnName: 'id' },
  })
  skills: Skill[];

  @OneToMany(() => Availability, (a) => a.user, { cascade: true })
  availabilities: Availability[];

  @OneToMany(() => AvailabilityException, (ae) => ae.user, { cascade: true })
  availabilityExceptions: AvailabilityException[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
