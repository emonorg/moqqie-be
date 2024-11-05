import { Exclude } from 'class-transformer'
import { User } from 'src/resources/users/entities/user.entity'
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class UserSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
  user!: User

  @Column({
    name: 'token_hash',
    type: 'text',
    nullable: false,
  })
  tokenHash!: string

  @Column({
    name: 'agent',
    type: 'varchar',
    nullable: false,
  })
  agent!: string

  @Column({
    name: 'ip_address',
    type: 'varchar',
    nullable: false,
  })
  ipAddress!: string

  @Exclude()
  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createdAt!: Date

  @Column({
    name: 'expires_at',
    type: 'timestamp',
    nullable: false,
  })
  expiresAt!: Date

  constructor(partial: Partial<UserSession>) {
    Object.assign(this, partial)
  }
}
