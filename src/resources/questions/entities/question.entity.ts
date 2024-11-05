import { Exclude } from 'class-transformer'
import { Organization } from 'src/resources/organizations/entities/organization.entity'
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { QuestionLabel } from './question-label.entity'
import { QuestionRule } from './question-rule.entity'

@Entity()
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @ManyToOne(() => Organization, (organization) => organization.id, {
    onDelete: 'CASCADE',
  })
  organization!: Organization

  @Column({ name: 'content', type: 'text', nullable: false })
  content!: string

  @Column({
    name: 'notes',
    type: 'text',
    nullable: true,
  })
  notes!: string

  @OneToMany(() => QuestionRule, (rule) => rule.question, { cascade: true })
  rules!: QuestionRule[]

  @Column({ name: 'times_asked', type: 'int', default: 0 })
  timesAsked!: number

  @ManyToOne(() => QuestionLabel, (questionLabel) => questionLabel.id, {
    nullable: true,
  })
  label!: QuestionLabel

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

  constructor(partial: Partial<Question>) {
    Object.assign(this, partial)
  }
}
