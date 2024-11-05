import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class DemoBooking {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({
    name: 'first_name',
    type: 'varchar',
    nullable: false,
  })
  firstName!: string

  @Column({
    name: 'last_name',
    type: 'varchar',
    nullable: false,
  })
  lastName!: string

  @Column({
    name: 'organization_name',
    type: 'varchar',
    nullable: false,
  })
  organizationName!: string

  @Column({
    name: 'email_address',
    type: 'varchar',
    nullable: false,
  })
  emailAddress!: string

  @Column({
    name: 'phone_number',
    type: 'varchar',
    nullable: false,
  })
  phoneNumber!: string

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createdAt!: Date

  constructor(partial: Partial<DemoBooking>) {
    Object.assign(this, partial)
  }
}
