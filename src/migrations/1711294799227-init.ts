import { MigrationInterface, QueryRunner } from 'typeorm'

export class Init1711294799227 implements MigrationInterface {
  name = 'Init1711294799227'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`candidate\` (\`id\` varchar(36) NOT NULL, \`full_name\` varchar(255) NOT NULL, \`email_address\` varchar(255) NOT NULL, \`notes\` text NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` timestamp(6) NULL, \`organization_id\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`tier\` (\`id\` varchar(36) NOT NULL, \`questions_per_assessment\` int NOT NULL DEFAULT '5', \`assessments_per_month\` int NOT NULL DEFAULT '15', \`members_per_organization\` int NOT NULL DEFAULT '5', \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`organization_id\` varchar(36) NULL, UNIQUE INDEX \`REL_e9ab899c4c2c9fa906637c521b\` (\`organization_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`user\` (\`id\` varchar(36) NOT NULL, \`email_address\` varchar(255) NOT NULL, \`password_hash\` text NOT NULL, \`display_name\` varchar(255) NOT NULL, \`account_status\` enum ('pending_verification', 'active', 'suspended', 'deleted', 'waiting') NOT NULL DEFAULT 'pending_verification', \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`organization_id\` varchar(36) NULL, UNIQUE INDEX \`IDX_a8979f71f59cb66a8b03bde38c\` (\`email_address\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`organization\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`status\` enum ('active', 'suspended', 'deleted') NOT NULL DEFAULT 'active', \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`tier_id\` varchar(36) NULL, UNIQUE INDEX \`IDX_c21e615583a3ebbb0977452afb\` (\`name\`), UNIQUE INDEX \`REL_a92dd2a2329231d703a1a36397\` (\`tier_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`question_rule\` (\`id\` varchar(36) NOT NULL, \`content\` text NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` timestamp(6) NULL, \`question_id\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`question\` (\`id\` varchar(36) NOT NULL, \`content\` text NOT NULL, \`notes\` text NULL, \`times_asked\` int NOT NULL DEFAULT '0', \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` timestamp(6) NULL, \`organization_id\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`demo_booking\` (\`id\` varchar(36) NOT NULL, \`organization_name\` varchar(255) NOT NULL, \`email_address\` varchar(255) NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_c07c4d420365eca95dc1509eb3\` (\`organization_name\`), UNIQUE INDEX \`IDX_d97e532f7130a7db0db05a15e4\` (\`email_address\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`notification\` (\`id\` varchar(36) NOT NULL, \`category\` varchar(64) NOT NULL, \`title\` varchar(64) NOT NULL, \`description\` varchar(255) NOT NULL, \`reference_id\` varchar(255) NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`organization_id\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`invitation\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`invitation_token\` varchar(255) NOT NULL, \`status\` enum ('pending', 'accepted') NOT NULL DEFAULT 'pending', \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`expires_at\` timestamp NOT NULL, \`organization_id\` varchar(36) NULL, UNIQUE INDEX \`IDX_7718ba9074bdaf42775ff19b52\` (\`name\`, \`organization_id\`), UNIQUE INDEX \`IDX_4570a9eb86d536b209003c9043\` (\`invitation_token\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`assessment_meeting_conversation\` (\`id\` varchar(36) NOT NULL, \`conversation\` longtext NOT NULL, \`created_at\` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`assessment_meeting_question\` (\`id\` varchar(36) NOT NULL, \`score\` int NULL, \`answer\` text NULL, \`analysis\` text NULL, \`status\` enum ('pending', 'answered', 'asked', 'analyzed', 'error') NOT NULL DEFAULT 'pending', \`question\` text NOT NULL, \`rules\` text NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` timestamp(6) NULL, \`assessment_meeting_id\` varchar(36) NULL, \`question_reference_id\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`assessment\` (\`id\` varchar(36) NOT NULL, \`title\` varchar(255) NOT NULL, \`description\` text NOT NULL, \`notes\` text NULL, \`goodbye_message\` text NOT NULL, \`times_taken\` int NOT NULL DEFAULT '0', \`status\` enum ('draft', 'published') NOT NULL DEFAULT 'draft', \`ends_at\` timestamp NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` timestamp(6) NULL, \`organization_id\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`assessment_meeting\` (\`id\` varchar(36) NOT NULL, \`status\` enum ('pending', 'completed', 'error', 'joined') NOT NULL DEFAULT 'pending', \`password\` varchar(255) NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` timestamp(6) NULL, \`assessment_id\` varchar(36) NULL, \`candidate_id\` varchar(36) NULL, \`conversation_id\` varchar(36) NULL, UNIQUE INDEX \`REL_3efa95103fc9b735b7b26a78c5\` (\`conversation_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`feedback\` (\`id\` varchar(36) NOT NULL, \`total_score\` int NULL, \`analysis\` text NULL, \`status\` enum ('ready', 'preparing', 'error') NOT NULL DEFAULT 'preparing', \`created_at\` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`organization_id\` varchar(36) NULL, \`assessment_meeting_id\` varchar(36) NULL, UNIQUE INDEX \`REL_bb620c66fef8a9ee444c1c81ee\` (\`assessment_meeting_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`email\` (\`id\` varchar(36) NOT NULL, \`email_address\` varchar(255) NOT NULL, \`subject\` varchar(255) NOT NULL, \`content\` text NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`user_session\` (\`id\` varchar(36) NOT NULL, \`token_hash\` text NOT NULL, \`agent\` varchar(255) NOT NULL, \`ip_address\` varchar(255) NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`expires_at\` timestamp NOT NULL, \`user_id\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`assessment_question\` (\`id\` varchar(36) NOT NULL, \`order\` int NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` timestamp(6) NULL, \`assessment_id\` varchar(36) NULL, \`question_id\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`admin\` (\`id\` varchar(36) NOT NULL, \`email_address\` varchar(255) NOT NULL, \`password_hash\` text NOT NULL, \`display_name\` varchar(255) NOT NULL, \`account_status\` enum ('active', 'suspended', 'deleted') NOT NULL DEFAULT 'active', \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, UNIQUE INDEX \`IDX_69f513c9fedabdca632c9c9a3c\` (\`email_address\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`service_configuration\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`value\` varchar(255) NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_cc66c7f837aa07408b16affb57\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`open_ai_usage\` (\`id\` varchar(36) NOT NULL, \`purpose\` enum ('analyze', 'interview_process', 'report') NOT NULL, \`input_token\` int NOT NULL, \`output_token\` int NOT NULL, \`total_cost\` float NOT NULL, \`model\` varchar(255) NOT NULL, \`created_at\` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6), \`organization_id\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`assessment_candidates_candidate\` (\`assessment_id\` varchar(36) NOT NULL, \`candidate_id\` varchar(36) NOT NULL, INDEX \`IDX_12e2ccb965a69a0241e9cec174\` (\`assessment_id\`), INDEX \`IDX_928f3ec23663f984347c711156\` (\`candidate_id\`), PRIMARY KEY (\`assessment_id\`, \`candidate_id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `ALTER TABLE \`candidate\` ADD CONSTRAINT \`FK_5483f13ff7d1a237e9148b0cb7e\` FOREIGN KEY (\`organization_id\`) REFERENCES \`organization\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`tier\` ADD CONSTRAINT \`FK_e9ab899c4c2c9fa906637c521bc\` FOREIGN KEY (\`organization_id\`) REFERENCES \`organization\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD CONSTRAINT \`FK_3e103cdf85b7d6cb620b4db0f0c\` FOREIGN KEY (\`organization_id\`) REFERENCES \`organization\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`organization\` ADD CONSTRAINT \`FK_a92dd2a2329231d703a1a36397c\` FOREIGN KEY (\`tier_id\`) REFERENCES \`tier\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`question_rule\` ADD CONSTRAINT \`FK_0effd03eee1dc3149f5011f1a82\` FOREIGN KEY (\`question_id\`) REFERENCES \`question\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`question\` ADD CONSTRAINT \`FK_ae81e848b15074e2dc608146466\` FOREIGN KEY (\`organization_id\`) REFERENCES \`organization\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`notification\` ADD CONSTRAINT \`FK_203543da9a28e0d7bd87e66cd20\` FOREIGN KEY (\`organization_id\`) REFERENCES \`organization\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`invitation\` ADD CONSTRAINT \`FK_de7c148c7834d738ac7113f3dd8\` FOREIGN KEY (\`organization_id\`) REFERENCES \`organization\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`assessment_meeting_question\` ADD CONSTRAINT \`FK_194bb8227f6356a21ed7512d73c\` FOREIGN KEY (\`assessment_meeting_id\`) REFERENCES \`assessment_meeting\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`assessment_meeting_question\` ADD CONSTRAINT \`FK_cfda30aeff8de6b9457ed953603\` FOREIGN KEY (\`question_reference_id\`) REFERENCES \`question\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`assessment\` ADD CONSTRAINT \`FK_2f8bded1b93538471b579aa43c7\` FOREIGN KEY (\`organization_id\`) REFERENCES \`organization\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`assessment_meeting\` ADD CONSTRAINT \`FK_2c8b0ab992f3fd05001b2c41e01\` FOREIGN KEY (\`assessment_id\`) REFERENCES \`assessment\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`assessment_meeting\` ADD CONSTRAINT \`FK_64d11a66e586a82b610f9c2f447\` FOREIGN KEY (\`candidate_id\`) REFERENCES \`candidate\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`assessment_meeting\` ADD CONSTRAINT \`FK_3efa95103fc9b735b7b26a78c55\` FOREIGN KEY (\`conversation_id\`) REFERENCES \`assessment_meeting_conversation\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`feedback\` ADD CONSTRAINT \`FK_81d4381bd8e43b31c7acaea9ce7\` FOREIGN KEY (\`organization_id\`) REFERENCES \`organization\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`feedback\` ADD CONSTRAINT \`FK_bb620c66fef8a9ee444c1c81ee7\` FOREIGN KEY (\`assessment_meeting_id\`) REFERENCES \`assessment_meeting\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`user_session\` ADD CONSTRAINT \`FK_13275383dcdf095ee29f2b3455a\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`assessment_question\` ADD CONSTRAINT \`FK_3a4afedaf9bc1f964a29c51a9a2\` FOREIGN KEY (\`assessment_id\`) REFERENCES \`assessment\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`assessment_question\` ADD CONSTRAINT \`FK_7d07c2a2a6dee4ae85a23d22a7a\` FOREIGN KEY (\`question_id\`) REFERENCES \`question\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`open_ai_usage\` ADD CONSTRAINT \`FK_9bb6b5dc8471779cebefa032811\` FOREIGN KEY (\`organization_id\`) REFERENCES \`organization\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`assessment_candidates_candidate\` ADD CONSTRAINT \`FK_12e2ccb965a69a0241e9cec174b\` FOREIGN KEY (\`assessment_id\`) REFERENCES \`assessment\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    )
    await queryRunner.query(
      `ALTER TABLE \`assessment_candidates_candidate\` ADD CONSTRAINT \`FK_928f3ec23663f984347c711156f\` FOREIGN KEY (\`candidate_id\`) REFERENCES \`candidate\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`assessment_candidates_candidate\` DROP FOREIGN KEY \`FK_928f3ec23663f984347c711156f\``)
    await queryRunner.query(`ALTER TABLE \`assessment_candidates_candidate\` DROP FOREIGN KEY \`FK_12e2ccb965a69a0241e9cec174b\``)
    await queryRunner.query(`ALTER TABLE \`open_ai_usage\` DROP FOREIGN KEY \`FK_9bb6b5dc8471779cebefa032811\``)
    await queryRunner.query(`ALTER TABLE \`assessment_question\` DROP FOREIGN KEY \`FK_7d07c2a2a6dee4ae85a23d22a7a\``)
    await queryRunner.query(`ALTER TABLE \`assessment_question\` DROP FOREIGN KEY \`FK_3a4afedaf9bc1f964a29c51a9a2\``)
    await queryRunner.query(`ALTER TABLE \`user_session\` DROP FOREIGN KEY \`FK_13275383dcdf095ee29f2b3455a\``)
    await queryRunner.query(`ALTER TABLE \`feedback\` DROP FOREIGN KEY \`FK_bb620c66fef8a9ee444c1c81ee7\``)
    await queryRunner.query(`ALTER TABLE \`feedback\` DROP FOREIGN KEY \`FK_81d4381bd8e43b31c7acaea9ce7\``)
    await queryRunner.query(`ALTER TABLE \`assessment_meeting\` DROP FOREIGN KEY \`FK_3efa95103fc9b735b7b26a78c55\``)
    await queryRunner.query(`ALTER TABLE \`assessment_meeting\` DROP FOREIGN KEY \`FK_64d11a66e586a82b610f9c2f447\``)
    await queryRunner.query(`ALTER TABLE \`assessment_meeting\` DROP FOREIGN KEY \`FK_2c8b0ab992f3fd05001b2c41e01\``)
    await queryRunner.query(`ALTER TABLE \`assessment\` DROP FOREIGN KEY \`FK_2f8bded1b93538471b579aa43c7\``)
    await queryRunner.query(`ALTER TABLE \`assessment_meeting_question\` DROP FOREIGN KEY \`FK_cfda30aeff8de6b9457ed953603\``)
    await queryRunner.query(`ALTER TABLE \`assessment_meeting_question\` DROP FOREIGN KEY \`FK_194bb8227f6356a21ed7512d73c\``)
    await queryRunner.query(`ALTER TABLE \`invitation\` DROP FOREIGN KEY \`FK_de7c148c7834d738ac7113f3dd8\``)
    await queryRunner.query(`ALTER TABLE \`notification\` DROP FOREIGN KEY \`FK_203543da9a28e0d7bd87e66cd20\``)
    await queryRunner.query(`ALTER TABLE \`question\` DROP FOREIGN KEY \`FK_ae81e848b15074e2dc608146466\``)
    await queryRunner.query(`ALTER TABLE \`question_rule\` DROP FOREIGN KEY \`FK_0effd03eee1dc3149f5011f1a82\``)
    await queryRunner.query(`ALTER TABLE \`organization\` DROP FOREIGN KEY \`FK_a92dd2a2329231d703a1a36397c\``)
    await queryRunner.query(`ALTER TABLE \`user\` DROP FOREIGN KEY \`FK_3e103cdf85b7d6cb620b4db0f0c\``)
    await queryRunner.query(`ALTER TABLE \`tier\` DROP FOREIGN KEY \`FK_e9ab899c4c2c9fa906637c521bc\``)
    await queryRunner.query(`ALTER TABLE \`candidate\` DROP FOREIGN KEY \`FK_5483f13ff7d1a237e9148b0cb7e\``)
    await queryRunner.query(`DROP INDEX \`IDX_928f3ec23663f984347c711156\` ON \`assessment_candidates_candidate\``)
    await queryRunner.query(`DROP INDEX \`IDX_12e2ccb965a69a0241e9cec174\` ON \`assessment_candidates_candidate\``)
    await queryRunner.query(`DROP TABLE \`assessment_candidates_candidate\``)
    await queryRunner.query(`DROP TABLE \`open_ai_usage\``)
    await queryRunner.query(`DROP INDEX \`IDX_cc66c7f837aa07408b16affb57\` ON \`service_configuration\``)
    await queryRunner.query(`DROP TABLE \`service_configuration\``)
    await queryRunner.query(`DROP INDEX \`IDX_69f513c9fedabdca632c9c9a3c\` ON \`admin\``)
    await queryRunner.query(`DROP TABLE \`admin\``)
    await queryRunner.query(`DROP TABLE \`assessment_question\``)
    await queryRunner.query(`DROP TABLE \`user_session\``)
    await queryRunner.query(`DROP TABLE \`email\``)
    await queryRunner.query(`DROP INDEX \`REL_bb620c66fef8a9ee444c1c81ee\` ON \`feedback\``)
    await queryRunner.query(`DROP TABLE \`feedback\``)
    await queryRunner.query(`DROP INDEX \`REL_3efa95103fc9b735b7b26a78c5\` ON \`assessment_meeting\``)
    await queryRunner.query(`DROP TABLE \`assessment_meeting\``)
    await queryRunner.query(`DROP TABLE \`assessment\``)
    await queryRunner.query(`DROP TABLE \`assessment_meeting_question\``)
    await queryRunner.query(`DROP TABLE \`assessment_meeting_conversation\``)
    await queryRunner.query(`DROP INDEX \`IDX_4570a9eb86d536b209003c9043\` ON \`invitation\``)
    await queryRunner.query(`DROP INDEX \`IDX_7718ba9074bdaf42775ff19b52\` ON \`invitation\``)
    await queryRunner.query(`DROP TABLE \`invitation\``)
    await queryRunner.query(`DROP TABLE \`notification\``)
    await queryRunner.query(`DROP INDEX \`IDX_d97e532f7130a7db0db05a15e4\` ON \`demo_booking\``)
    await queryRunner.query(`DROP INDEX \`IDX_c07c4d420365eca95dc1509eb3\` ON \`demo_booking\``)
    await queryRunner.query(`DROP TABLE \`demo_booking\``)
    await queryRunner.query(`DROP TABLE \`question\``)
    await queryRunner.query(`DROP TABLE \`question_rule\``)
    await queryRunner.query(`DROP INDEX \`REL_a92dd2a2329231d703a1a36397\` ON \`organization\``)
    await queryRunner.query(`DROP INDEX \`IDX_c21e615583a3ebbb0977452afb\` ON \`organization\``)
    await queryRunner.query(`DROP TABLE \`organization\``)
    await queryRunner.query(`DROP INDEX \`IDX_a8979f71f59cb66a8b03bde38c\` ON \`user\``)
    await queryRunner.query(`DROP TABLE \`user\``)
    await queryRunner.query(`DROP INDEX \`REL_e9ab899c4c2c9fa906637c521b\` ON \`tier\``)
    await queryRunner.query(`DROP TABLE \`tier\``)
    await queryRunner.query(`DROP TABLE \`candidate\``)
  }
}
