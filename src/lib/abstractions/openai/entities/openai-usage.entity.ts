import { Organization } from 'src/resources/organizations/entities/organization.entity'
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'

export enum OpenAIUsagePurpose {
  Analyze = 'analyze',
  InterviewProcess = 'interview_process',
  Report = 'report',
}

@Entity()
export class OpenAIUsage {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @ManyToOne(() => Organization, (organization) => organization.id)
  organization!: Organization

  @Column({
    name: 'purpose',
    type: 'enum',
    enum: OpenAIUsagePurpose,
    nullable: false,
  })
  purpose!: string

  @Column({
    name: 'input_token',
    type: 'int',
    nullable: false,
  })
  inputToken!: number

  @Column({
    name: 'output_token',
    type: 'int',
    nullable: false,
  })
  outputToken!: number

  @Column({
    name: 'total_cost',
    type: 'float',
    nullable: false,
  })
  totalCost!: number

  @Column({
    name: 'model',
    type: 'varchar',
    nullable: false,
  })
  model!: string

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createdAt!: Date

  constructor(partial: Partial<OpenAIUsage>) {
    Object.assign(this, partial)
  }
}
