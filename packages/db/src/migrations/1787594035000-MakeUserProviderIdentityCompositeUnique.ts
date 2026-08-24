import type { MigrationInterface, QueryRunner } from "typeorm";

/** SSO 사용자 식별자를 공급자별로 고유하게 만든다. */
export class MakeUserProviderIdentityCompositeUnique1787594035000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      DECLARE constraint_name text;
      BEGIN
        SELECT conname INTO constraint_name
        FROM pg_constraint
        WHERE conrelid = '"user"'::regclass
          AND contype = 'u'
          AND pg_get_constraintdef(oid) = 'UNIQUE ("providerId")';

        IF constraint_name IS NOT NULL THEN
          EXECUTE format('ALTER TABLE "user" DROP CONSTRAINT %I', constraint_name);
        END IF;

        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conrelid = '"user"'::regclass
            AND contype = 'u'
            AND pg_get_constraintdef(oid) = 'UNIQUE (provider, "providerId")'
        ) THEN
          ALTER TABLE "user"
            ADD CONSTRAINT "UQ_user_provider_providerId"
            UNIQUE ("provider", "providerId");
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      DECLARE constraint_name text;
      BEGIN
        SELECT conname INTO constraint_name
        FROM pg_constraint
        WHERE conrelid = '"user"'::regclass
          AND contype = 'u'
          AND pg_get_constraintdef(oid) = 'UNIQUE (provider, "providerId")';

        IF constraint_name IS NOT NULL THEN
          EXECUTE format('ALTER TABLE "user" DROP CONSTRAINT %I', constraint_name);
        END IF;

        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conrelid = '"user"'::regclass
            AND contype = 'u'
            AND pg_get_constraintdef(oid) = 'UNIQUE ("providerId")'
        ) THEN
          ALTER TABLE "user"
            ADD CONSTRAINT "UQ_user_providerId" UNIQUE ("providerId");
        END IF;
      END $$;
    `);
  }
}
