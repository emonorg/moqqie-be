import { MigrationInterface, QueryRunner } from 'typeorm'

export class BookDemoUniqueRemoval1712611715097 implements MigrationInterface {
  name = 'BookDemoUniqueRemoval1712611715097'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX \`IDX_32374858200e5828c98102e144\` ON \`demo_booking\``)
    await queryRunner.query(`DROP INDEX \`IDX_8a476017151c205287fe0ce7b6\` ON \`demo_booking\``)
    await queryRunner.query(`DROP INDEX \`IDX_af246bbedf09bf83eccbda1a8a\` ON \`demo_booking\``)
    await queryRunner.query(`DROP INDEX \`IDX_c07c4d420365eca95dc1509eb3\` ON \`demo_booking\``)
    await queryRunner.query(`DROP INDEX \`IDX_d97e532f7130a7db0db05a15e4\` ON \`demo_booking\``)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_d97e532f7130a7db0db05a15e4\` ON \`demo_booking\` (\`email_address\`)`)
    await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_c07c4d420365eca95dc1509eb3\` ON \`demo_booking\` (\`organization_name\`)`)
    await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_af246bbedf09bf83eccbda1a8a\` ON \`demo_booking\` (\`phone_number\`)`)
    await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_8a476017151c205287fe0ce7b6\` ON \`demo_booking\` (\`last_name\`)`)
    await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_32374858200e5828c98102e144\` ON \`demo_booking\` (\`first_name\`)`)
  }
}
