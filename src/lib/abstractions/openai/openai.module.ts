import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { OpenAIUsage } from './entities/openai-usage.entity'
import { OpenAIService } from './openai.service'

@Module({
  imports: [TypeOrmModule.forFeature([OpenAIUsage]), HttpModule],
  providers: [OpenAIService],
  exports: [OpenAIService],
})
export class OpenAIModule {}
