import { Organization } from 'src/resources/organizations/entities/organization.entity'
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { Question } from './question.entity'

@Entity()
export class QuestionLabel {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @ManyToOne(() => Organization, (organization) => organization.id, {
    onDelete: 'CASCADE',
  })
  organization!: Organization

  @Column({ name: 'name', type: 'varchar', nullable: false, unique: true })
  name!: string

  @OneToMany(() => Question, (question) => question.label, { cascade: true })
  questions!: Question[]

  constructor(partial: Partial<QuestionLabel>) {
    Object.assign(this, partial)
  }
}
