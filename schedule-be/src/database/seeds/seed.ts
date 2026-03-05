import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

// ── Entities ────────────────────────────────────────────────────────────────
import { User } from '../../modules/users/entities/user.entity';
import { Skill } from '../../modules/users/entities/skill.entity';
import { Availability } from '../../modules/users/entities/availability.entity';
import { AvailabilityException } from '../../modules/users/entities/availability-exception.entity';
import { Location } from '../../modules/locations/entities/location.entity';
import { StaffLocation } from '../../modules/locations/entities/staff-location.entity';
import { Shift } from '../../modules/shifts/entities/shift.entity';
import { ShiftAssignment } from '../../modules/shifts/entities/shift-assignment.entity';

import { Role } from '../../common/enums/role.enum';
import { ShiftStatus } from '../../common/enums/shift-status.enum';
import { DayOfWeek } from '../../common/enums/day-of-week.enum';

// ── DataSource ───────────────────────────────────────────────────────────────
const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'scheduler',
  entities: [
    User,
    Skill,
    Availability,
    AvailabilityException,
    Location,
    StaffLocation,
    Shift,
    ShiftAssignment,
  ],
  synchronize: false,
});

// ── Helpers ──────────────────────────────────────────────────────────────────
const hash = (pw: string) => bcrypt.hash(pw, 10);

function nextWeekday(dayOfWeek: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  while (d.getUTCDay() !== dayOfWeek) d.setUTCDate(d.getUTCDate() + 1);
  return d;
}

// ── Main Seed ────────────────────────────────────────────────────────────────
async function seed() {
  await AppDataSource.initialize();
  console.log('🌱 Connected — seeding...');

  const userRepo = AppDataSource.getRepository(User);
  const skillRepo = AppDataSource.getRepository(Skill);
  const availRepo = AppDataSource.getRepository(Availability);
  const locRepo = AppDataSource.getRepository(Location);
  const staffLocRepo = AppDataSource.getRepository(StaffLocation);
  const shiftRepo = AppDataSource.getRepository(Shift);
  const assignRepo = AppDataSource.getRepository(ShiftAssignment);

  // ── Wipe existing seed data (idempotent) ─────────────────────────────────
  await assignRepo.query(`DELETE FROM shift_assignments`);
  await shiftRepo.query(`DELETE FROM shifts`);
  await staffLocRepo.query(`DELETE FROM staff_locations`);
  await availRepo.query(`DELETE FROM availabilities`);
  await userRepo.query(`DELETE FROM user_skills`);
  await userRepo.query(`DELETE FROM users`);
  await locRepo.query(`DELETE FROM locations`);
  await skillRepo.query(`DELETE FROM skills`);

  // ── Skills ───────────────────────────────────────────────────────────────
  const skills = await skillRepo.save([
    skillRepo.create({
      name: 'Barista',
      description: 'Espresso & specialty drinks',
    }),
    skillRepo.create({ name: 'Cashier', description: 'POS and cash handling' }),
    skillRepo.create({ name: 'Kitchen', description: 'Food prep and cooking' }),
    skillRepo.create({
      name: 'Supervisor',
      description: 'Shift lead responsibilities',
    }),
    skillRepo.create({
      name: 'Drive-Thru',
      description: 'Drive-thru window operation',
    }),
  ]);
  const [barista, cashier, kitchen, supervisor, driveThru] = skills;
  console.log(`✅ ${skills.length} skills created`);

  // ── Locations ─────────────────────────────────────────────────────────────
  const locations = await locRepo.save([
    locRepo.create({
      name: 'Coastal Eats Downtown',
      address: '123 Ocean Drive',
      city: 'Miami',
      state: 'FL',
      zipCode: '33101',
      timezone: 'America/New_York',
      phone: '+13051110001',
    }),
    locRepo.create({
      name: 'Coastal Eats Midtown',
      address: '456 Brickell Ave',
      city: 'Miami',
      state: 'FL',
      zipCode: '33131',
      timezone: 'America/New_York',
      phone: '+13051110002',
    }),
    locRepo.create({
      name: 'Coastal Eats Airport',
      address: '2100 NW 42nd Ave',
      city: 'Miami',
      state: 'FL',
      zipCode: '33142',
      timezone: 'America/New_York',
      phone: '+13051110003',
    }),
  ]);
  const [downtown, midtown, airport] = locations;
  console.log(`✅ ${locations.length} locations created`);

  // ── Users ─────────────────────────────────────────────────────────────────
  const pw = await hash('Password1!');

  const admin = await userRepo.save(
    userRepo.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@coastaleats.com',
      password: pw,
      role: Role.ADMIN,
      timezone: 'America/New_York',
      desiredHoursPerWeek: 40,
      skills: [supervisor],
    }),
  );

  const mgr1 = await userRepo.save(
    userRepo.create({
      firstName: 'Marcus',
      lastName: 'Lee',
      email: 'manager.downtown@coastaleats.com',
      password: pw,
      role: Role.MANAGER,
      timezone: 'America/New_York',
      desiredHoursPerWeek: 40,
      skills: [supervisor, barista],
    }),
  );

  const mgr2 = await userRepo.save(
    userRepo.create({
      firstName: 'Nina',
      lastName: 'Park',
      email: 'manager.midtown@coastaleats.com',
      password: pw,
      role: Role.MANAGER,
      timezone: 'America/New_York',
      desiredHoursPerWeek: 40,
      skills: [supervisor, cashier],
    }),
  );

  const staffData = [
    {
      firstName: 'Alex',
      lastName: 'Rivera',
      email: 'alex@coastaleats.com',
      skills: [barista, cashier],
    },
    {
      firstName: 'Beth',
      lastName: 'Santos',
      email: 'beth@coastaleats.com',
      skills: [kitchen, cashier],
    },
    {
      firstName: 'Carl',
      lastName: 'Nguyen',
      email: 'carl@coastaleats.com',
      skills: [barista, driveThru],
    },
    {
      firstName: 'Dana',
      lastName: 'Kim',
      email: 'dana@coastaleats.com',
      skills: [cashier, driveThru],
    },
    {
      firstName: 'Evan',
      lastName: 'Patel',
      email: 'evan@coastaleats.com',
      skills: [kitchen],
    },
    {
      firstName: 'Fiona',
      lastName: 'Cruz',
      email: 'fiona@coastaleats.com',
      skills: [barista, kitchen],
    },
  ];

  const staffUsers = await Promise.all(
    staffData.map((s) =>
      userRepo.save(
        userRepo.create({
          ...s,
          password: pw,
          role: Role.STAFF,
          timezone: 'America/New_York',
          desiredHoursPerWeek: 32,
        }),
      ),
    ),
  );
  const [alex, beth, carl, dana, evan, fiona] = staffUsers;
  console.log(`✅ ${2 + staffUsers.length + 1} users created`);

  // ── Availability (Mon–Fri 08:00–20:00 for all staff) ─────────────────────
  const workDays = [
    DayOfWeek.MONDAY,
    DayOfWeek.TUESDAY,
    DayOfWeek.WEDNESDAY,
    DayOfWeek.THURSDAY,
    DayOfWeek.FRIDAY,
  ];
  const availRecords: Partial<Availability>[] = [];
  for (const u of [...staffUsers, mgr1, mgr2]) {
    for (const day of workDays) {
      availRecords.push({
        userId: u.id,
        dayOfWeek: day,
        startTime: '08:00',
        endTime: '20:00',
        isAvailable: true,
      });
    }
  }
  await availRepo.save(availRecords);
  console.log(`✅ ${availRecords.length} availability records created`);

  // ── Staff Certifications ──────────────────────────────────────────────────
  const certs: Partial<StaffLocation>[] = [
    // Downtown: mgr1 + alex + beth + carl
    { userId: mgr1.id, locationId: downtown.id },
    { userId: alex.id, locationId: downtown.id },
    { userId: beth.id, locationId: downtown.id },
    { userId: carl.id, locationId: downtown.id },
    // Midtown: mgr2 + dana + evan + fiona
    { userId: mgr2.id, locationId: midtown.id },
    { userId: dana.id, locationId: midtown.id },
    { userId: evan.id, locationId: midtown.id },
    { userId: fiona.id, locationId: midtown.id },
    // Airport: admin + carl + dana (cross-trained)
    { userId: admin.id, locationId: airport.id },
    { userId: carl.id, locationId: airport.id },
    { userId: dana.id, locationId: airport.id },
  ];
  await staffLocRepo.save(
    certs.map((c) =>
      staffLocRepo.create({ ...c, isActive: true, certifiedAt: new Date() }),
    ),
  );
  console.log(`✅ ${certs.length} staff certifications created`);

  // ── Sample Shifts ─────────────────────────────────────────────────────────
  // Next Monday
  const mon = nextWeekday(1);
  const tue = new Date(mon);
  tue.setUTCDate(mon.getUTCDate() + 1);
  const wed = new Date(mon);
  wed.setUTCDate(mon.getUTCDate() + 2);
  const fri = new Date(mon);
  fri.setUTCDate(mon.getUTCDate() + 4);
  const sat = new Date(mon);
  sat.setUTCDate(mon.getUTCDate() + 5);

  function ts(base: Date, hour: number): Date {
    const d = new Date(base);
    d.setUTCHours(hour, 0, 0, 0);
    return d;
  }

  const shiftDefs = [
    // Downtown shifts
    {
      locationId: downtown.id,
      startTime: ts(mon, 8),
      endTime: ts(mon, 16),
      headcount: 2,
      status: ShiftStatus.PUBLISHED,
      notes: 'Monday morning [seed]',
    },
    {
      locationId: downtown.id,
      startTime: ts(mon, 16),
      endTime: ts(tue, 0),
      headcount: 2,
      status: ShiftStatus.PUBLISHED,
      notes: 'Monday evening [seed]',
      isPremium: false,
    },
    {
      locationId: downtown.id,
      startTime: ts(wed, 10),
      endTime: ts(wed, 18),
      headcount: 2,
      status: ShiftStatus.PUBLISHED,
      notes: 'Wednesday mid [seed]',
    },
    {
      locationId: downtown.id,
      startTime: ts(fri, 17),
      endTime: ts(sat, 1),
      headcount: 3,
      status: ShiftStatus.PUBLISHED,
      notes: 'Friday dinner premium [seed]',
      isPremium: true,
    },
    // Midtown shifts
    {
      locationId: midtown.id,
      startTime: ts(mon, 9),
      endTime: ts(mon, 17),
      headcount: 2,
      status: ShiftStatus.PUBLISHED,
      notes: 'Midtown Monday [seed]',
    },
    {
      locationId: midtown.id,
      startTime: ts(tue, 11),
      endTime: ts(tue, 19),
      headcount: 2,
      status: ShiftStatus.PUBLISHED,
      notes: 'Midtown Tuesday [seed]',
    },
    {
      locationId: midtown.id,
      startTime: ts(fri, 8),
      endTime: ts(fri, 16),
      headcount: 2,
      status: ShiftStatus.DRAFT,
      notes: 'Midtown Friday draft [seed]',
    },
    // Airport shifts
    {
      locationId: airport.id,
      startTime: ts(mon, 5),
      endTime: ts(mon, 13),
      headcount: 1,
      status: ShiftStatus.PUBLISHED,
      notes: 'Airport early Monday [seed]',
    },
    {
      locationId: airport.id,
      startTime: ts(wed, 13),
      endTime: ts(wed, 21),
      headcount: 1,
      status: ShiftStatus.PUBLISHED,
      notes: 'Airport Wednesday pm [seed]',
    },
    {
      locationId: airport.id,
      startTime: ts(sat, 6),
      endTime: ts(sat, 14),
      headcount: 2,
      status: ShiftStatus.DRAFT,
      notes: 'Airport Saturday draft [seed]',
    },
  ];

  const shifts = await shiftRepo.save(
    shiftDefs.map((s) =>
      shiftRepo.create({
        ...s,
        publishedAt:
          s.status === ShiftStatus.PUBLISHED ? new Date() : undefined,
      }),
    ),
  );
  console.log(`✅ ${shifts.length} shifts created`);

  // ── Sample Assignments ────────────────────────────────────────────────────
  // Assign a couple of staff to published shifts
  const assignments = [
    { shiftId: shifts[0].id, userId: alex.id, assignedById: mgr1.id }, // Downtown Mon AM
    { shiftId: shifts[0].id, userId: beth.id, assignedById: mgr1.id },
    { shiftId: shifts[1].id, userId: carl.id, assignedById: mgr1.id }, // Downtown Mon PM
    { shiftId: shifts[3].id, userId: alex.id, assignedById: mgr1.id }, // Downtown Fri premium
    { shiftId: shifts[4].id, userId: dana.id, assignedById: mgr2.id }, // Midtown Mon
    { shiftId: shifts[5].id, userId: evan.id, assignedById: mgr2.id }, // Midtown Tue
    { shiftId: shifts[7].id, userId: carl.id, assignedById: admin.id }, // Airport Mon early
  ];

  await assignRepo.save(assignments.map((a) => assignRepo.create(a)));
  console.log(`✅ ${assignments.length} shift assignments created`);

  await AppDataSource.destroy();
  console.log(
    '\n🎉 Seed complete! Login with any @coastaleats.com user, password: Password1!',
  );
}

// Need Like for the idempotent wipe
import { Like } from 'typeorm';

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
