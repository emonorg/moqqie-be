import { MigrationInterface, QueryRunner } from 'typeorm'

export class MeetingQuestionFollowUpTimes1720544310390 implements MigrationInterface {
  name = 'MeetingQuestionFollowUpTimes1720544310390'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`assessment_meeting_question\` ADD \`times_followup_asked\` int NOT NULL DEFAULT '0'`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`assessment_meeting_question\` DROP COLUMN \`times_followup_asked\``)
  }
}
