import { MigrationInterface, QueryRunner } from 'typeorm'

export class QuestionLabel1720038856115 implements MigrationInterface {
  name = 'QuestionLabel1720038856115'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`question_label\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`organization_id\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(`ALTER TABLE \`question\` ADD \`label_id\` varchar(36) NULL`)
    await queryRunner.query(
      `ALTER TABLE \`question_label\` ADD CONSTRAINT \`FK_2d79041cf3091f1e6879084eb6c\` FOREIGN KEY (\`organization_id\`) REFERENCES \`organization\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`question\` ADD CONSTRAINT \`FK_3d9abc398dc6d7d0c12253a2d1b\` FOREIGN KEY (\`label_id\`) REFERENCES \`question_label\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`question\` DROP FOREIGN KEY \`FK_3d9abc398dc6d7d0c12253a2d1b\``)
    await queryRunner.query(`ALTER TABLE \`question_label\` DROP FOREIGN KEY \`FK_2d79041cf3091f1e6879084eb6c\``)
    await queryRunner.query(`ALTER TABLE \`question\` DROP COLUMN \`label_id\``)
    await queryRunner.query(`DROP TABLE \`question_label\``)
  }
}
