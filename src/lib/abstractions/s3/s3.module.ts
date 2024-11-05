import { Module } from '@nestjs/common'
import { S3BucketsService } from './s3.service'

@Module({
  providers: [S3BucketsService],
  exports: [S3BucketsService],
})
export class S3BucketsModule {}
