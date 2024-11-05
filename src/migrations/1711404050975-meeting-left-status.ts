import { MigrationInterface, QueryRunner } from 'typeorm'

export class MeetingLeftStatus1711404050975 implements MigrationInterface {
  name = 'MeetingLeftStatus1711404050975'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`assessment_meeting\` CHANGE \`status\` \`status\` enum ('pending', 'completed', 'error', 'joined', 'left') NOT NULL DEFAULT 'pending'`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`assessment_meeting\` CHANGE \`status\` \`status\` enum ('pending', 'completed', 'error', 'joined') NOT NULL DEFAULT 'pending'`,
    )
  }
}
