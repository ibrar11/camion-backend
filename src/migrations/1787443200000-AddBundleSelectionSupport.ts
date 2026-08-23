import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBundleSelectionSupport1787443200000
  implements MigrationInterface
{
  name = 'AddBundleSelectionSupport1787443200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "bundles" ADD "minimum_selection_count" integer NOT NULL DEFAULT 2`,
    );
    await queryRunner.query(
      `ALTER TABLE "cart_items" ADD "bundle_source_uuid" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "cart_items" ADD "bundle_selection_uuid" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "cart_items" ADD "bundle_minimum_selection_count" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD "bundle_source_uuid" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD "bundle_selection_uuid" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD "bundle_minimum_selection_count" integer NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP COLUMN "bundle_minimum_selection_count"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP COLUMN "bundle_selection_uuid"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP COLUMN "bundle_source_uuid"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cart_items" DROP COLUMN "bundle_minimum_selection_count"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cart_items" DROP COLUMN "bundle_selection_uuid"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cart_items" DROP COLUMN "bundle_source_uuid"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bundles" DROP COLUMN "minimum_selection_count"`,
    );
  }
}
