import { Exclude } from 'class-transformer'
import { Question } from 'src/resources/questions/entities/question.entity'
import { Column, CreateDateColumn, DeleteDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { AssessmentMeeting } from './assessment-meeting.entity'

export enum AssessmentMeetingQuestionStatus {
  Pending = 'pending',
  Answered = 'answered',
  Asked = 'asked',
  Analyzed = 'analyzed',
  Error = 'error',
}

@Entity()
export class AssessmentMeetingQuestion {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @ManyToOne(() => AssessmentMeeting, (assessmentMeeting) => assessmentMeeting.id, {
    onDelete: 'CASCADE',
  })
  assessmentMeeting!: AssessmentMeeting

  @ManyToOne(() => Question, (question) => question.id, {
    onDelete: 'CASCADE',
  })
  questionReference!: Question

  @Column({
    name: 'score',
    type: 'int',
    nullable: true,
  })
  score!: number

  @Column({
    name: 'answer',
    type: 'text',
    nullable: true,
  })
  answer!: string

  @Column({
    name: 'analysis',
    type: 'text',
    nullable: true,
  })
  analysis!: string

  @Column({
    name: 'status',
    type: 'enum',
    enum: AssessmentMeetingQuestionStatus,
    nullable: false,
    default: AssessmentMeetingQuestionStatus.Pending,
  })
  status!: AssessmentMeetingQuestionStatus

  @Column({ name: 'question', type: 'text', nullable: false })
  question!: string

  @Column({ name: 'rules', type: 'text', nullable: false })
  rules!: string

  @Column({
    name: 'times_followup_asked',
    type: 'int',
    nullable: false,
    default: 0,
  })
  timesFollowupAsked!: number

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createdAt!: Date

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  updatedAt!: Date

  @Exclude()
  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamp',
    nullable: true,
  })
  deletedAt!: Date

  constructor(partial: Partial<AssessmentMeetingQuestion>) {
    Object.assign(this, partial)
  }
}
