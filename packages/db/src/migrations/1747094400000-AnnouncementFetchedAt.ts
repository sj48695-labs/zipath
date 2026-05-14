import type { MigrationInterface, QueryRunner } from "typeorm";

/**
 * `externalId` + `fetchedAt` 컬럼 추가.
 * 기존 `organization`에 임시 저장됐던 합성 키(HOUSE_MANAGE_NO-PBLANC_NO)를 `externalId`로 이전.
 */
export class AnnouncementFetchedAt1747094400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // NULL 허용으로 추가 후 backfill, 그 다음 NOT NULL 제약 — 기존 row가 있어도 안전
    await queryRunner.query(
      `ALTER TABLE "announcement" ADD COLUMN "externalId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "announcement" ADD COLUMN "fetchedAt" TIMESTAMP`,
    );

    await queryRunner.query(
      `UPDATE "announcement" SET "externalId" = "organization", "fetchedAt" = "createdAt"`,
    );

    await queryRunner.query(
      `ALTER TABLE "announcement"
        ALTER COLUMN "externalId" SET NOT NULL,
        ALTER COLUMN "fetchedAt" SET NOT NULL,
        ALTER COLUMN "fetchedAt" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_announcement_external_id" ON "announcement" ("externalId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "UQ_announcement_external_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "announcement" DROP COLUMN "externalId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "announcement" DROP COLUMN "fetchedAt"`,
    );
  }
}
