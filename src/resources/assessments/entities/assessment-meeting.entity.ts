import { Exclude } from 'class-transformer'
import { Candidate } from 'src/resources/candidates/entities/candidate.entity'
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { AssessmentMeetingConversation } from './assessment-meeting-conversation.entity'
import { AssessmentMeetingQuestion } from './assessment-meeting-questions.entity'
import { Assessment } from './assessment.entity'

export enum AssessmentMeetingStatus {
  Pending = 'pending',
  Completed = 'completed',
  Error = 'error',
  Joined = 'joined',
  Left = 'left',
}

@Entity()
export class AssessmentMeeting {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @ManyToOne(() => Assessment, (assessment) => assessment.id, {
    onDelete: 'CASCADE',
  })
  assessment!: Assessment

  @ManyToOne(() => Candidate, (candidate) => candidate.id, {
    onDelete: 'CASCADE',
  })
  candidate!: Candidate

  @OneToMany(() => AssessmentMeetingQuestion, (questions) => questions.assessmentMeeting, {
    cascade: true,
  })
  questions!: AssessmentMeetingQuestion[]

  @OneToOne(() => AssessmentMeetingConversation, { onDelete: 'CASCADE' })
  @JoinColumn()
  conversation!: AssessmentMeetingConversation

  @Column({
    name: 'status',
    type: 'enum',
    enum: AssessmentMeetingStatus,
    nullable: false,
    default: AssessmentMeetingStatus.Pending,
  })
  status!: AssessmentMeetingStatus

  @Column({
    name: 'start_time',
    type: 'timestamp',
    nullable: true,
  })
  startTime!: Date

  @Column({
    name: 'end_time',
    type: 'timestamp',
    nullable: true,
  })
  endTime!: Date

  @Column({
    name: 'video_uuid',
    type: 'varchar',
    nullable: true,
    default: null,
  })
  videoUUID!: string

  @Exclude()
  @Column({ name: 'password', type: 'varchar', nullable: false })
  passwordHash!: string

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

  constructor(partial: Partial<AssessmentMeeting>) {
    Object.assign(this, partial)
  }
}
