import { AssessmentMeeting } from 'src/resources/assessments/entities/assessment-meeting.entity'
import { Organization } from 'src/resources/organizations/entities/organization.entity'
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

export enum FeedbackStatus {
  Ready = 'ready',
  Preparing = 'preparing',
  Error = 'error',
}

@Entity()
export class Feedback {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @ManyToOne(() => Organization, (organization) => organization.id, {
    onDelete: 'CASCADE',
  })
  organization!: Organization

  @OneToOne(() => AssessmentMeeting, { onDelete: 'CASCADE' })
  @JoinColumn()
  assessmentMeeting!: AssessmentMeeting

  @Column({
    type: 'int',
    nullable: true,
    name: 'total_score',
    default: null,
  })
  totalScore!: number

  @Column({
    type: 'text',
    nullable: true,
    name: 'analysis',
  })
  analysis!: string

  @Column({
    enum: FeedbackStatus,
    type: 'enum',
    enumName: 'status',
    default: FeedbackStatus.Preparing,
  })
  status!: FeedbackStatus

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

  constructor(partial: Partial<Feedback>) {
    Object.assign(this, partial)
  }
}
