import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

export interface AssessmentMeetingConversationSchema {
  isQuestionAsked: boolean
  questionId?: string
  content: string
  role: 'user' | 'assistant'
}

@Entity()
export class AssessmentMeetingConversation {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({
    name: 'conversation',
    type: 'json',
  })
  conversation!: AssessmentMeetingConversationSchema[]

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createdAt!: Date

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  updatedAt!: Date

  constructor(partial: Partial<AssessmentMeetingConversation>) {
    Object.assign(this, partial)
  }
}
