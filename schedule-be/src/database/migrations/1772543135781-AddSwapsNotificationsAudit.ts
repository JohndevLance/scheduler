import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSwapsNotificationsAudit1772543135781 implements MigrationInterface {
  name = 'AddSwapsNotificationsAudit1772543135781';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."swap_requests_type_enum" AS ENUM('swap', 'drop')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."swap_requests_status_enum" AS ENUM('pending_acceptance', 'pending_approval', 'approved', 'rejected', 'cancelled', 'expired')`,
    );
    await queryRunner.query(
      `CREATE TABLE "swap_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "shift_id" uuid NOT NULL, "requester_id" uuid NOT NULL, "cover_id" uuid, "type" "public"."swap_requests_type_enum" NOT NULL, "status" "public"."swap_requests_status_enum" NOT NULL DEFAULT 'pending_acceptance', "requesterNote" character varying(500), "managerNote" character varying(500), "resolved_by_id" uuid, "resolvedAt" TIMESTAMP WITH TIME ZONE, "expiresAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4a3a8b292e0e8df37acbc47e648" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notifications_type_enum" AS ENUM('shift_assigned', 'shift_changed', 'shift_cancelled', 'schedule_published', 'swap_requested', 'swap_accepted', 'swap_rejected', 'swap_approved', 'swap_cancelled', 'swap_expired', 'drop_available', 'drop_claimed', 'overtime_warning', 'availability_changed', 'manager_override_required')`,
    );
    await queryRunner.query(
      `CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "type" "public"."notifications_type_enum" NOT NULL, "title" character varying(200) NOT NULL, "body" character varying(1000) NOT NULL, "referenceId" uuid, "referenceType" character varying(50), "isRead" boolean NOT NULL DEFAULT false, "readAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_47a28a1fd044a9aa3368903668" ON "notifications" ("user_id", "isRead") `,
    );
    await queryRunner.query(
      `CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "actor_id" uuid, "action" character varying(100) NOT NULL, "entityType" character varying(100) NOT NULL, "entityId" character varying(255) NOT NULL, "before" jsonb, "after" jsonb, "ip" character varying(45), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_177183f29f438c488b5e8510cd" ON "audit_logs" ("actor_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_13c69424c440a0e765053feb4b" ON "audit_logs" ("entityType", "entityId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "swap_requests" ADD CONSTRAINT "FK_1f63204bfa107c8e8b44f56cbd6" FOREIGN KEY ("shift_id") REFERENCES "shifts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "swap_requests" ADD CONSTRAINT "FK_5361b1dfafc1c0124525fbd2409" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "swap_requests" ADD CONSTRAINT "FK_64a8065c63e56153eabda2d10b8" FOREIGN KEY ("cover_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "swap_requests" ADD CONSTRAINT "FK_3e56fedb774fbf3c8e5a8d2f117" FOREIGN KEY ("resolved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "swap_requests" DROP CONSTRAINT "FK_3e56fedb774fbf3c8e5a8d2f117"`,
    );
    await queryRunner.query(
      `ALTER TABLE "swap_requests" DROP CONSTRAINT "FK_64a8065c63e56153eabda2d10b8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "swap_requests" DROP CONSTRAINT "FK_5361b1dfafc1c0124525fbd2409"`,
    );
    await queryRunner.query(
      `ALTER TABLE "swap_requests" DROP CONSTRAINT "FK_1f63204bfa107c8e8b44f56cbd6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_13c69424c440a0e765053feb4b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_177183f29f438c488b5e8510cd"`,
    );
    await queryRunner.query(`DROP TABLE "audit_logs"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_47a28a1fd044a9aa3368903668"`,
    );
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
    await queryRunner.query(`DROP TABLE "swap_requests"`);
    await queryRunner.query(`DROP TYPE "public"."swap_requests_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."swap_requests_type_enum"`);
  }
}
