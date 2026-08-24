import type { MigrationInterface, QueryRunner } from "typeorm";

/** SSO 사용자 식별자를 공급자별로 고유하게 만든다. */
export class MakeUserProviderIdentityCompositeUnique1787594035000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      DECLARE
        constraint_name text;
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
          FROM pg_index
          WHERE indrelid = '"user"'::regclass
            AND indisunique
            AND indpred IS NULL
          AND indkey::text = format(
            '%s %s',
            (SELECT attnum FROM pg_attribute
             WHERE attrelid = '"user"'::regclass AND attname = 'provider'),
            (SELECT attnum FROM pg_attribute
             WHERE attrelid = '"user"'::regclass AND attname = 'providerId')
          )
        ) THEN
          CREATE UNIQUE INDEX "IDX_user_provider_providerId"
            ON "user" ("provider", "providerId");
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      DECLARE
        constraint_name text;
        index_name text;
      BEGIN
        SELECT conname INTO constraint_name
        FROM pg_constraint
        WHERE conrelid = '"user"'::regclass
          AND contype = 'u'
          AND pg_get_constraintdef(oid) = 'UNIQUE (provider, "providerId")';

        IF constraint_name IS NOT NULL THEN
          EXECUTE format('ALTER TABLE "user" DROP CONSTRAINT %I', constraint_name);
        ELSE
          SELECT indexrelid::regclass::text INTO index_name
          FROM pg_index
          WHERE indrelid = '"user"'::regclass
            AND indisunique
            AND indpred IS NULL
            AND indkey::text = format(
              '%s %s',
              (SELECT attnum FROM pg_attribute
               WHERE attrelid = '"user"'::regclass AND attname = 'provider'),
              (SELECT attnum FROM pg_attribute
               WHERE attrelid = '"user"'::regclass AND attname = 'providerId')
            );

          IF index_name IS NOT NULL THEN
            EXECUTE format('DROP INDEX %s', index_name);
          END IF;
        END IF;

        IF NOT EXISTS (
          SELECT 1
          FROM pg_index
          WHERE indrelid = '"user"'::regclass
            AND indisunique
            AND indpred IS NULL
            AND indkey::text = (
              SELECT attnum::text FROM pg_attribute
              WHERE attrelid = '"user"'::regclass AND attname = 'providerId'
            )
        ) THEN
          ALTER TABLE "user"
            ADD CONSTRAINT "UQ_user_providerId" UNIQUE ("providerId");
        END IF;
      END $$;
    `);
  }
}
