import { Exclude } from 'class-transformer'
import { Candidate } from 'src/resources/candidates/entities/candidate.entity'
import { Tier } from 'src/resources/subscription-tiers/entities/tier.entity'
import { User } from 'src/resources/users/entities/user.entity'
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

export enum OrganizationStatus {
  Active = 'active',
  Suspended = 'suspended',
  Deleted = 'deleted',
}

@Entity()
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({
    name: 'name',
    type: 'varchar',
    nullable: false,
    unique: true,
  })
  name!: string

  @Column({
    name: 'status',
    type: 'enum',
    enum: OrganizationStatus,
    default: OrganizationStatus.Active,
  })
  status!: OrganizationStatus

  @OneToOne(() => Tier, (tier) => tier.organization)
  @JoinColumn()
  tier!: Tier

  @OneToMany(() => User, (user) => user.organization, { cascade: true })
  members!: User[]

  @OneToMany(() => Candidate, (candidate) => candidate.organization, {
    cascade: true,
  })
  candidates!: Candidate[]

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createdAt!: Date

  @Exclude()
  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  updatedAt!: Date

  @Exclude()
  @DeleteDateColumn({
    name: 'deleted_at',
  })
  deletedAt!: Date

  constructor(partial: Partial<Organization>) {
    Object.assign(this, partial)
  }
}
