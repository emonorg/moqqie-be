import { Exclude } from 'class-transformer'
import { Candidate } from 'src/resources/candidates/entities/candidate.entity'
import { Organization } from 'src/resources/organizations/entities/organization.entity'
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { AssessmentQuestion } from './assessment-question.entity'

export enum AssessmentStatus {
  Draft = 'draft',
  Published = 'published',
}

@Entity()
export class Assessment {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @ManyToOne(() => Organization, (organization) => organization.id, {
    onDelete: 'CASCADE',
  })
  organization!: Organization

  @Column({ name: 'title', type: 'varchar', nullable: false })
  title!: string

  @Column({ name: 'description', type: 'text', nullable: false })
  description!: string

  @Column({
    name: 'notes',
    type: 'text',
    nullable: true,
  })
  notes!: string

  @Column({ name: 'goodbye_message', type: 'text', nullable: false })
  goodbyeMessage!: string

  @Column({ name: 'times_taken', type: 'int', default: 0 })
  timesTaken!: number

  @Column({
    name: 'status',
    type: 'enum',
    enum: AssessmentStatus,
    default: AssessmentStatus.Draft,
  })
  status!: AssessmentStatus

  @ManyToMany(() => Candidate)
  @JoinTable()
  candidates!: Candidate[]

  @Column({ name: 'ends_at', type: 'timestamp', nullable: false })
  endsAt!: Date

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

  questions!: AssessmentQuestion[]

  constructor(partial: Partial<Assessment>) {
    Object.assign(this, partial)
  }
}
