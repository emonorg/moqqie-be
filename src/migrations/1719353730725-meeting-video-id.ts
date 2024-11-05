import { MigrationInterface, QueryRunner } from 'typeorm'

export class MeetingVideoId1719353730725 implements MigrationInterface {
  name = 'MeetingVideoId1719353730725'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`assessment_meeting\` ADD \`video_uuid\` varchar(255) NULL`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`assessment_meeting\` DROP COLUMN \`video_uuid\``)
  }
}
