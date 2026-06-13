import type { MigrationInterface, QueryRunner } from "typeorm";

/**
 * User 테이블에 관심 지역(interestRegions) 컬럼 추가.
 *
 * simple-array 는 콤마로 구분된 text 컬럼으로 저장된다.
 * 기존 행은 빈 문자열(= 빈 배열)로 채워진다.
 */
export class AddUserInterestRegions1748000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "interestRegions" text NOT NULL DEFAULT ''`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "interestRegions"`,
    );
  }
}
