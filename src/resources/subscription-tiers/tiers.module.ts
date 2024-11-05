import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AssessmentMeeting } from '../assessments/entities/assessment-meeting.entity'
import { User } from '../users/entities/user.entity'
import { Tier } from './entities/tier.entity'
import { TiersController } from './tiers.controller'
import { TiersService } from './tiers.service'

@Module({
  imports: [TypeOrmModule.forFeature([Tier, AssessmentMeeting, User])],
  controllers: [TiersController],
  providers: [TiersService],
  exports: [],
})
export class TiersModule {}
