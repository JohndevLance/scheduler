import { MigrationInterface, QueryRunner } from "typeorm";

export class AddShiftUnassignedNotificationType1772728855628 implements MigrationInterface {
    name = 'AddShiftUnassignedNotificationType1772728855628'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."notifications_type_enum" RENAME TO "notifications_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum" AS ENUM('shift_assigned', 'shift_unassigned', 'shift_changed', 'shift_cancelled', 'schedule_published', 'swap_requested', 'swap_accepted', 'swap_rejected', 'swap_approved', 'swap_cancelled', 'swap_expired', 'drop_available', 'drop_claimed', 'overtime_warning', 'availability_changed', 'manager_override_required')`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."notifications_type_enum" USING "type"::"text"::"public"."notifications_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum_old" AS ENUM('shift_assigned', 'shift_changed', 'shift_cancelled', 'schedule_published', 'swap_requested', 'swap_accepted', 'swap_rejected', 'swap_approved', 'swap_cancelled', 'swap_expired', 'drop_available', 'drop_claimed', 'overtime_warning', 'availability_changed', 'manager_override_required')`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."notifications_type_enum_old" USING "type"::"text"::"public"."notifications_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."notifications_type_enum_old" RENAME TO "notifications_type_enum"`);
    }

}
