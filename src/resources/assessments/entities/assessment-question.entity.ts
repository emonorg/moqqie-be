import { Exclude } from 'class-transformer'
import { Question } from 'src/resources/questions/entities/question.entity'
import { Column, CreateDateColumn, DeleteDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { Assessment } from './assessment.entity'

export enum AssessmentStepStatus {
  Pending = 'pending',
  Answered = 'answered',
  Asked = 'asked',
  Analyzed = 'analyzed',
  Error = 'error',
}

@Entity()
export class AssessmentQuestion {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @ManyToOne(() => Assessment, (assessment) => assessment.id, {
    onDelete: 'CASCADE',
  })
  assessment!: Assessment

  @ManyToOne(() => Question, (question) => question.id, {
    onDelete: 'CASCADE',
  })
  question!: Question

  @Column({
    name: 'order',
    type: 'int',
    nullable: false,
  })
  order!: number

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

  constructor(partial: Partial<AssessmentQuestion>) {
    Object.assign(this, partial)
  }
}
