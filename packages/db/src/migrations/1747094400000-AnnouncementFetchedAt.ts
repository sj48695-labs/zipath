import type { MigrationInterface, QueryRunner } from "typeorm";

/**
 * #59 — Announcement 엔티티에 `externalId` + `fetchedAt` 컬럼 추가.
 *
 * - `externalId`: data.go.kr 응답의 `HOUSE_MANAGE_NO-PBLANC_NO` 자연 키.
 *   기존 코드는 이를 `organization` 컬럼에 임시 저장(hack)했으므로 backfill 로 복사한다.
 * - `fetchedAt`: 마지막 API 동기화 시각. cleanup 3개월 정책 + upsert 갱신 기준.
 *
 * 절차:
 *   1) 두 컬럼을 NULL 허용으로 추가
 *   2) 기존 row backfill (`external_id = organization`, `fetched_at = created_at`)
 *   3) NOT NULL + UNIQUE 제약 부여
 */
export class AnnouncementFetchedAt1747094400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1) 컬럼 추가 (nullable)
    await queryRunner.query(
      `ALTER TABLE "announcement" ADD COLUMN "externalId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "announcement" ADD COLUMN "fetchedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
    );

    // 2) 기존 데이터 backfill — organization 에 임시 저장된 합성 키를 externalId 로 이전
    await queryRunner.query(
      `UPDATE "announcement" SET "externalId" = "organization" WHERE "externalId" IS NULL`,
    );
    await queryRunner.query(
      `UPDATE "announcement" SET "fetchedAt" = "createdAt" WHERE "fetchedAt" IS NULL`,
    );

    // 3) NOT NULL + UNIQUE 제약 부여
    await queryRunner.query(
      `ALTER TABLE "announcement" ALTER COLUMN "externalId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "announcement" ALTER COLUMN "fetchedAt" SET NOT NULL`,
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
      `ALTER TABLE "announcement" DROP COLUMN "fetchedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "announcement" DROP COLUMN "externalId"`,
    );
  }
}
