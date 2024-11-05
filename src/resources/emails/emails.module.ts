import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AmqpModule } from 'src/lib/abstractions/amqp/amqp.module'
import { EmailsService } from './emails.service'
import { Email } from './entities/email.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Email]), AmqpModule],
  controllers: [],
  providers: [EmailsService],
})
export class EmailsModule {}
