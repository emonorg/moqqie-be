import { Exclude } from 'class-transformer'
import { Column, CreateDateColumn, DeleteDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { Question } from './question.entity'

@Entity()
export class QuestionRule {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'content', type: 'text', nullable: false })
  content!: string

  @ManyToOne(() => Question, (question) => question.rules, {
    onDelete: 'CASCADE',
  })
  question!: Question

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

  constructor(partial: Partial<QuestionRule>) {
    Object.assign(this, partial)
  }
}
