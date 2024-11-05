import { Exclude } from 'class-transformer'
import { Organization } from 'src/resources/organizations/entities/organization.entity'
import { Column, CreateDateColumn, DeleteDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity()
export class Candidate {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'full_name', type: 'varchar', nullable: false })
  fullName!: string

  @Column({ name: 'email_address', type: 'varchar', nullable: false })
  emailAddress!: string

  @Column({
    name: 'notes',
    type: 'text',
    nullable: true,
  })
  notes!: string

  @ManyToOne(() => Organization, (organization) => organization.id, {
    onDelete: 'CASCADE',
  })
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

  @Exclude()
  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamp',
    nullable: true,
  })
  deletedAt!: Date

  constructor(partial: Partial<Candidate>) {
    Object.assign(this, partial)
  }
}
