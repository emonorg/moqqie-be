import { Organization } from 'src/resources/organizations/entities/organization.entity'
import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity()
export class Tier {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({
    name: 'questions_per_assessment',
    type: 'int',
    nullable: false,
    default: 5,
  })
  questionsPerAssessment!: number

  @Column({
    name: 'assessments_per_month',
    type: 'int',
    nullable: false,
    default: 15,
  })
  assessmentsPerMonth!: number

  @Column({
    name: 'members_per_organization',
    type: 'int',
    nullable: false,
    default: 5,
  })
  membersPerOrganization!: number

  @OneToOne(() => Organization, (organization) => organization.tier)
  @JoinColumn()
  organization!: Organization

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

  constructor(partial: Partial<Tier>) {
    Object.assign(this, partial)
  }
}
