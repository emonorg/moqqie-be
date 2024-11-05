import { Exclude } from 'class-transformer'
import { IsEmail, IsNotEmpty, IsString } from 'class-validator'
import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

export enum AdminAccountStatus {
  Active = 'active',
  Suspended = 'suspended',
  Deleted = 'deleted',
}

@Entity()
export class Admin {
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

  @Column({
    name: 'account_status',
    type: 'enum',
    enum: AdminAccountStatus,
    default: AdminAccountStatus.Active,
  })
  accountStatus!: AdminAccountStatus

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

  constructor(partial: Partial<Admin>) {
    Object.assign(this, partial)
  }
}
