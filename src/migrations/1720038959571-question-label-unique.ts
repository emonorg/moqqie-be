import { MigrationInterface, QueryRunner } from 'typeorm'

export class QuestionLabelUnique1720038959571 implements MigrationInterface {
  name = 'QuestionLabelUnique1720038959571'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`question_label\` ADD UNIQUE INDEX \`IDX_22c114a67d1cf0f133fec490d3\` (\`name\`)`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`question_label\` DROP INDEX \`IDX_22c114a67d1cf0f133fec490d3\``)
  }
}
