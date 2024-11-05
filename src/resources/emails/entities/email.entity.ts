import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm'

export enum EmailType {
  Verification = 'verification',
  ResetPassword = 'reset_password',
  Invitation = 'invitation',
  Welcome = 'welcome',
  Assessment = 'assessment',
}

@Entity()
export class Email {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({
    name: 'email_address',
    type: 'varchar',
    nullable: false,
  })
  emailAddress!: string

  @Column({
    name: 'subject',
    type: 'varchar',
    nullable: false,
  })
  subject!: string

  @Column({
    name: 'content',
    type: 'text',
    nullable: false,
  })
  content!: string

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createdAt!: Date

  constructor(partial: Partial<Email>) {
    Object.assign(this, partial)
  }
}
