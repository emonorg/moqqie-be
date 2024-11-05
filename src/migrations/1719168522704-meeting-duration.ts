import { MigrationInterface, QueryRunner } from 'typeorm'

export class MeetingDuration1719168522704 implements MigrationInterface {
  name = 'MeetingDuration1719168522704'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`assessment_meeting\` ADD \`start_time\` timestamp NULL`)
    await queryRunner.query(`ALTER TABLE \`assessment_meeting\` ADD \`end_time\` timestamp NULL`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`assessment_meeting\` DROP COLUMN \`end_time\``)
    await queryRunner.query(`ALTER TABLE \`assessment_meeting\` DROP COLUMN \`start_time\``)
  }
}
