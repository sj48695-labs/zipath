import type { MigrationInterface, QueryRunner } from "typeorm";

/**
 * 베이스라인 마이그레이션 — 모든 엔티티의 현재 정의로부터 스키마 생성.
 *
 * production 에서 synchronize 가 한 번도 실행된 적 없는 DB(예: Render + Neon)에
 * 최초 한 번만 실행됨. 이 후의 스키마 변경은 `npm run migration:generate` 로
 * 정상적인 diff 마이그레이션을 만든다.
 */
export class InitialBaseline1746489600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.connection.synchronize(false);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const metas = [...queryRunner.connection.entityMetadatas].reverse();
    for (const meta of metas) {
      await queryRunner.dropTable(meta.tableName, true, true, true);
    }
  }
}
