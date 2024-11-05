import { Exclude } from 'class-transformer'
import { Organization } from 'src/resources/organizations/entities/organization.entity'
import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

export enum InvitationStatus {
  Pending = 'pending',
  Accepted = 'accepted',
}

@Entity()
@Index(['emailAddress', 'organization'], { unique: true })
export class Invitation {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'name', type: 'varchar', nullable: false })
  emailAddress!: string

  @ManyToOne(() => Organization, (organization) => organization.id, {
    onDelete: 'CASCADE',
  })
  organization!: Organization

  @Exclude()
  @Column({
    name: 'invitation_token',
    type: 'varchar',
    nullable: false,
    unique: true,
  })
  invitationToken!: string

  @Column({
    name: 'status',
    type: 'enum',
    enum: InvitationStatus,
    nullable: false,
    default: InvitationStatus.Pending,
  })
  status!: InvitationStatus

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

  @Column({
    name: 'expires_at',
    type: 'timestamp',
    nullable: false,
  })
  expiresAt!: Date

  constructor(partial: Partial<Invitation>) {
    Object.assign(this, partial)
  }
}
