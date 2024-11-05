import { Exclude } from 'class-transformer'
import { IsEmail, IsNotEmpty, IsString } from 'class-validator'
import { Organization } from 'src/resources/organizations/entities/organization.entity'
import { Column, CreateDateColumn, DeleteDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

export enum UserAccountStatus {
  PendingVerification = 'pending_verification',
  Active = 'active',
  Suspended = 'suspended',
  Deleted = 'deleted',
  Waiting = 'waiting',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({
    name: 'email_address',
    type: 'varchar',
    nullable: false,
    unique: true,
  })
  @IsEmail()
  @IsNotEmpty()
  emailAddress!: string

  @Exclude({ toPlainOnly: true })
  @Column({
    name: 'password_hash',
    type: 'text',
    nullable: false,
  })
  @IsString()
  @IsNotEmpty()
  passwordHash!: string

  @Column({
    type: 'varchar',
    name: 'display_name',
    nullable: false,
  })
  @IsString()
  @IsNotEmpty()
  displayName!: string

  @ManyToOne(() => Organization, (organization) => organization.members, {
    onDelete: 'CASCADE',
  })
  organization!: Organization

  @Column({
    name: 'account_status',
    type: 'enum',
    enum: UserAccountStatus,
    default: UserAccountStatus.PendingVerification,
  })
  accountStatus!: UserAccountStatus

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
    nullable: true,
  })
  deletedAt!: Date

  constructor(partial: Partial<User>) {
    Object.assign(this, partial)
  }
}
