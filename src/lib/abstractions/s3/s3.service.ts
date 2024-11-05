import { Injectable, Logger } from '@nestjs/common'

import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { ConfigService } from '@nestjs/config'
import { Readable } from 'stream'

const isDev = process.env.NODE_ENV === 'dev'

export interface ReadableStreamWithRange {
  stream: Readable
  contentRange: string
}

@Injectable()
export class S3BucketsService {
  private s3Client!: S3Client
  private bucketName!: string

  constructor(private readonly configService: ConfigService) {
    this.init()
  }

  async init(): Promise<void> {
    this.s3Client = new S3Client({
      endpoint: await this.configService.getOrThrow('S3_DO_ENDPOINT'),
      region: await this.configService.getOrThrow('S3_DO_REGION'),
      credentials: {
        accessKeyId: '',
        secretAccessKey: '',
      },
    })

    this.bucketName = 'moqqie-meeting-videos'
  }

  async putObject(objectId: string, file: Buffer): Promise<void> {
    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: isDev ? `dev/${objectId}` : objectId,
          Body: file,
        }),
      )
    } catch (err) {
      throw err
    }
  }

  async getObject(objectId: string, range: string): Promise<ReadableStreamWithRange | undefined> {
    try {
      const headObject = await this.s3Client.send(
        new HeadObjectCommand({
          Bucket: this.bucketName,
          Key: isDev ? `dev/${objectId}` : objectId,
        }),
      )

      const totalSize = headObject.ContentLength

      if (!totalSize) {
        return undefined
      }

      let contentRange: string | undefined
      if (range) {
        const [start, end] = range.replace(/bytes=/, '').split('-')
        const startRange = parseInt(start, 10)
        const endRange = end ? parseInt(end, 10) : totalSize - 1

        contentRange = `bytes ${startRange}-${endRange}/${totalSize}`
      } else {
        contentRange = `bytes 0-${totalSize - 1}/${totalSize}`
      }

      const s3Stream = await this.s3Client.send(
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: isDev ? `dev/${objectId}` : objectId,
          Range: range,
        }),
      )

      if (!s3Stream.Body) {
        return undefined
      }

      const readableStream = Readable.from(s3Stream.Body as Readable)
      return { stream: readableStream, contentRange }
    } catch (err) {
      Logger.error(err)
    }
  }
}
