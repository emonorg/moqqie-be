import { MigrationInterface, QueryRunner } from 'typeorm'

export class BookDemoNewFields1712611484004 implements MigrationInterface {
  name = 'BookDemoNewFields1712611484004'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`demo_booking\` ADD \`first_name\` varchar(255) NOT NULL`)
    await queryRunner.query(`ALTER TABLE \`demo_booking\` ADD UNIQUE INDEX \`IDX_32374858200e5828c98102e144\` (\`first_name\`)`)
    await queryRunner.query(`ALTER TABLE \`demo_booking\` ADD \`last_name\` varchar(255) NOT NULL`)
    await queryRunner.query(`ALTER TABLE \`demo_booking\` ADD UNIQUE INDEX \`IDX_8a476017151c205287fe0ce7b6\` (\`last_name\`)`)
    await queryRunner.query(`ALTER TABLE \`demo_booking\` ADD \`phone_number\` varchar(255) NOT NULL`)
    await queryRunner.query(`ALTER TABLE \`demo_booking\` ADD UNIQUE INDEX \`IDX_af246bbedf09bf83eccbda1a8a\` (\`phone_number\`)`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`demo_booking\` DROP INDEX \`IDX_af246bbedf09bf83eccbda1a8a\``)
    await queryRunner.query(`ALTER TABLE \`demo_booking\` DROP COLUMN \`phone_number\``)
    await queryRunner.query(`ALTER TABLE \`demo_booking\` DROP INDEX \`IDX_8a476017151c205287fe0ce7b6\``)
    await queryRunner.query(`ALTER TABLE \`demo_booking\` DROP COLUMN \`last_name\``)
    await queryRunner.query(`ALTER TABLE \`demo_booking\` DROP INDEX \`IDX_32374858200e5828c98102e144\``)
    await queryRunner.query(`ALTER TABLE \`demo_booking\` DROP COLUMN \`first_name\``)
  }
}
