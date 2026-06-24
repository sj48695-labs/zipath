import type { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Notification 테이블에 referenceId 컬럼 추가 + 중복 방지 partial unique index.
 *
 * - 컬럼: `referenceId varchar NULL`
 *   - 가격 알림: `<regionCodeOrName>:<yearMonth>`
 *   - 공고 알림: `announcement:<announcementId>`
 *   - 시스템 알림: NULL (중복 제약 적용 안 함)
 *
 * - 인덱스: `UQ_notification_user_type_reference (userId, type, referenceId)`
 *   - `WHERE "referenceId" IS NOT NULL` → NULL 행은 unique 제약 미적용 (Postgres 동작).
 */
export class AddNotificationReferenceId1747000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notification" ADD COLUMN IF NOT EXISTS "referenceId" character varying`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_notification_user_type_reference" ` +
        `ON "notification" ("userId", "type", "referenceId") ` +
        `WHERE "referenceId" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "UQ_notification_user_type_reference"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification" DROP COLUMN IF EXISTS "referenceId"`,
    );
  }
}
