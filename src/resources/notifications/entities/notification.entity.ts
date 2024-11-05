import { Organization } from 'src/resources/organizations/entities/organization.entity'
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity()
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({
    type: 'varchar',
    length: 64,
    nullable: false,
  })
  category!: string

  @Column({
    type: 'varchar',
    length: 64,
    nullable: false,
  })
  title!: string

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  description!: string

  @ManyToOne(() => Organization, (organization) => organization.id, {
    onDelete: 'CASCADE',
  })
  organization!: Organization

  @Column({
    type: 'varchar',
    nullable: true,
    default: null,
  })
  referenceId!: string

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

  constructor(partial: Partial<Notification>) {
    Object.assign(this, partial)
  }
}
