import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1772536148452 implements MigrationInterface {
  name = 'InitialSchema1772536148452';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "availabilities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "dayOfWeek" integer NOT NULL, "startTime" TIME NOT NULL, "endTime" TIME NOT NULL, "isAvailable" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9562bd8681d40361b1a124ea52c" PRIMARY KEY ("id")); COMMENT ON COLUMN "availabilities"."dayOfWeek" IS '0=Sun, 1=Mon, ... 6=Sat'; COMMENT ON COLUMN "availabilities"."startTime" IS 'Start time in user local time e.g. 09:00'; COMMENT ON COLUMN "availabilities"."endTime" IS 'End time in user local time e.g. 17:00'`,
    );
    await queryRunner.query(
      `CREATE TABLE "availability_exceptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "date" date NOT NULL, "isUnavailableAllDay" boolean NOT NULL DEFAULT false, "startTime" TIME, "endTime" TIME, "reason" character varying(255), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f5a89a7a6221bc93b517a13351f" PRIMARY KEY ("id")); COMMENT ON COLUMN "availability_exceptions"."date" IS 'The specific date this exception applies to'; COMMENT ON COLUMN "availability_exceptions"."isUnavailableAllDay" IS 'If true, unavailable all day; overrides startTime/endTime'`,
    );
    await queryRunner.query(
      `CREATE TABLE "skills" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "description" character varying(255), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_81f05095507fd84aa2769b4a522" UNIQUE ("name"), CONSTRAINT "PK_0d3212120f4ecedf90864d7e298" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'manager', 'staff')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "firstName" character varying(100) NOT NULL, "lastName" character varying(100) NOT NULL, "email" character varying(255) NOT NULL, "password" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'staff', "isActive" boolean NOT NULL DEFAULT true, "desiredHoursPerWeek" integer, "phone" character varying(20), "timezone" character varying(50) NOT NULL DEFAULT 'UTC', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")); COMMENT ON COLUMN "users"."desiredHoursPerWeek" IS 'Desired hours per week'; COMMENT ON COLUMN "users"."timezone" IS 'User preferred display timezone'`,
    );
    await queryRunner.query(
      `CREATE TABLE "staff_locations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "location_id" uuid NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "certifiedAt" TIMESTAMP WITH TIME ZONE, "decertifiedAt" TIMESTAMP WITH TIME ZONE, "decertificationReason" character varying(255), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c70ad9e536ca9b66d55cf06bbf3" PRIMARY KEY ("id")); COMMENT ON COLUMN "staff_locations"."decertificationReason" IS 'Reason for de-certification'`,
    );
    await queryRunner.query(
      `CREATE TABLE "locations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(150) NOT NULL, "address" character varying(255) NOT NULL, "city" character varying(100) NOT NULL, "state" character varying(100) NOT NULL, "zipCode" character varying(20) NOT NULL, "timezone" character varying(60) NOT NULL DEFAULT 'America/New_York', "isActive" boolean NOT NULL DEFAULT true, "phone" character varying(20), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_7cc1c9e3853b94816c094825e74" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "shift_assignments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "shift_id" uuid NOT NULL, "user_id" uuid NOT NULL, "assigned_by_id" character varying NOT NULL, "isSwapPending" boolean NOT NULL DEFAULT false, "notes" character varying(255), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7a78d24f38deedd9fe0ea19685c" PRIMARY KEY ("id")); COMMENT ON COLUMN "shift_assignments"."isSwapPending" IS 'True once manager approval is given for a swap'`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."shifts_status_enum" AS ENUM('draft', 'published', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "shifts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "location_id" uuid NOT NULL, "required_skill_id" uuid, "startTime" TIMESTAMP WITH TIME ZONE NOT NULL, "endTime" TIMESTAMP WITH TIME ZONE NOT NULL, "headcount" integer NOT NULL DEFAULT '1', "status" "public"."shifts_status_enum" NOT NULL DEFAULT 'draft', "notes" character varying(500), "isPremium" boolean NOT NULL DEFAULT false, "published_at" TIMESTAMP WITH TIME ZONE, "published_by_id" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_84d692e367e4d6cdf045828768c" PRIMARY KEY ("id")); COMMENT ON COLUMN "shifts"."headcount" IS 'Number of staff slots required'`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_skills" ("user_id" uuid NOT NULL, "skill_id" uuid NOT NULL, CONSTRAINT "PK_816eba68a0ca1b837ec15daefc7" PRIMARY KEY ("user_id", "skill_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6926002c360291df66bb2c5fde" ON "user_skills" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_eb69710b0a00f42fb95fc2ac2f" ON "user_skills" ("skill_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "availabilities" ADD CONSTRAINT "FK_5bcd4627ceda8d42e0ada3e74a7" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "availability_exceptions" ADD CONSTRAINT "FK_4ff126b4c51e4f29de7b8b7a1ae" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "staff_locations" ADD CONSTRAINT "FK_d36d16f37f3b4e97b909994cfa1" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "staff_locations" ADD CONSTRAINT "FK_a3594db111e1bc28b559a4faf94" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "shift_assignments" ADD CONSTRAINT "FK_fe59c463f888b8ee0da19404b14" FOREIGN KEY ("shift_id") REFERENCES "shifts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "shift_assignments" ADD CONSTRAINT "FK_f1b9d618ce78a6d9f31e29a06bf" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "shifts" ADD CONSTRAINT "FK_c6bedcf1de66f642c442da3bdc8" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "shifts" ADD CONSTRAINT "FK_da35da98a8b1746becedd1ddfb3" FOREIGN KEY ("required_skill_id") REFERENCES "skills"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_skills" ADD CONSTRAINT "FK_6926002c360291df66bb2c5fdeb" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_skills" ADD CONSTRAINT "FK_eb69710b0a00f42fb95fc2ac2f5" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_skills" DROP CONSTRAINT "FK_eb69710b0a00f42fb95fc2ac2f5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_skills" DROP CONSTRAINT "FK_6926002c360291df66bb2c5fdeb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shifts" DROP CONSTRAINT "FK_da35da98a8b1746becedd1ddfb3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shifts" DROP CONSTRAINT "FK_c6bedcf1de66f642c442da3bdc8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shift_assignments" DROP CONSTRAINT "FK_f1b9d618ce78a6d9f31e29a06bf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shift_assignments" DROP CONSTRAINT "FK_fe59c463f888b8ee0da19404b14"`,
    );
    await queryRunner.query(
      `ALTER TABLE "staff_locations" DROP CONSTRAINT "FK_a3594db111e1bc28b559a4faf94"`,
    );
    await queryRunner.query(
      `ALTER TABLE "staff_locations" DROP CONSTRAINT "FK_d36d16f37f3b4e97b909994cfa1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "availability_exceptions" DROP CONSTRAINT "FK_4ff126b4c51e4f29de7b8b7a1ae"`,
    );
    await queryRunner.query(
      `ALTER TABLE "availabilities" DROP CONSTRAINT "FK_5bcd4627ceda8d42e0ada3e74a7"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_eb69710b0a00f42fb95fc2ac2f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6926002c360291df66bb2c5fde"`,
    );
    await queryRunner.query(`DROP TABLE "user_skills"`);
    await queryRunner.query(`DROP TABLE "shifts"`);
    await queryRunner.query(`DROP TYPE "public"."shifts_status_enum"`);
    await queryRunner.query(`DROP TABLE "shift_assignments"`);
    await queryRunner.query(`DROP TABLE "locations"`);
    await queryRunner.query(`DROP TABLE "staff_locations"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(`DROP TABLE "skills"`);
    await queryRunner.query(`DROP TABLE "availability_exceptions"`);
    await queryRunner.query(`DROP TABLE "availabilities"`);
  }
}
