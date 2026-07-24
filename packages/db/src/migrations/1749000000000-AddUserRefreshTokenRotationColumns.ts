import type { MigrationInterface, QueryRunner } from "typeorm";

/**
 * User 테이블에 refresh token rotation 상태를 저장하는 컬럼 추가.
 *
 * 해시/만료시각/무효화시각을 nullable 로 두어 기존 사용자 데이터를 보존한다.
 */
export class AddUserRefreshTokenRotationColumns1749000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "refreshTokenHash" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "refreshTokenExpiresAt" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "refreshTokenInvalidatedAt" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "refreshTokenInvalidatedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "refreshTokenExpiresAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "refreshTokenHash"`,
    );
  }
}
