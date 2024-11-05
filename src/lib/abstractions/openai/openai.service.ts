import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { EventEmitter } from 'events'
import * as fs from 'fs'
import OpenAI from 'openai'
import { ChatCompletion, ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources'
import { lastValueFrom } from 'rxjs'
import { Socket } from 'socket.io'
import { Repository } from 'typeorm'
import { OpenAIUsage } from './entities/openai-usage.entity'
import { splitSentences } from './helpers/split-sentences.helper'

export interface OpenAIStatus {
  components: OpenAIStatusComponent[]
}

export interface OpenAIStatusComponent {
  id: string
  name: string
  status: string
}

export interface ChatCompletionBackoffOptions {
  delay: number
  maxRetries: number
}

const defaultChatCompletionRequestOptions = { timeout: 10000, maxRetries: 2 }

type openAIModel = 'gpt-3.5-turbo-0125' | 'gpt-4-0125-preview' | 'gpt-4o-mini'

@Injectable()
export class OpenAIService {
  private openAI!: OpenAI

  constructor(
    @InjectRepository(OpenAIUsage)
    private readonly chatGPTUsageRepository: Repository<OpenAIUsage>,
    private readonly configService: ConfigService,
    private readonly axios: HttpService,
  ) {
    this.init()
  }

  async init(): Promise<void> {
    this.openAI = new OpenAI({
      apiKey: await this.configService.getOrThrow('OPENAI_API_KEY'),
      organization: await this.configService.getOrThrow('OPENAI_ORG_ID'),
    })
  }

  async createTranscription(audioFilePath: string): Promise<string | null> {
    try {
      const response = await this.openAI.audio.transcriptions.create({
        model: 'whisper-1',
        file: fs.createReadStream(audioFilePath),
        language: 'en',
      })

      return response.text
    } catch (e) {
      Logger.error(e)
      return null
    }
  }

  async createChatCompletionsWithBackoff<T>(
    backoffOptions: ChatCompletionBackoffOptions,
    messages: ChatCompletionMessageParam[],
    maxTokens = 800,
    model: openAIModel = 'gpt-4o-mini',
  ): Promise<T | null> {
    try {
      const response = await this.openAI.chat.completions.create(
        {
          model,
          top_p: 0.1,
          messages,
          presence_penalty: -2,
          seed: 100,
          max_tokens: maxTokens,
        },
        defaultChatCompletionRequestOptions,
      )

      if (!response.usage) {
        throw new Error('Response usage is null -> createChatCompletionsWithBackoff -> error in chat completion request')
      }

      return response.choices[0].message.content as T
    } catch (e) {
      if (backoffOptions.maxRetries <= 0) {
        return null
      }

      Logger.error(e)
      await new Promise((resolve) => setTimeout(resolve, backoffOptions.delay))
      return await this.createChatCompletionsWithBackoff(
        {
          delay: backoffOptions.delay,
          maxRetries: backoffOptions.maxRetries - 1,
        },
        messages,
        maxTokens,
        model,
      )
    }
  }

  async createChatCompletionsAndStream<T>(
    eventEmitter: EventEmitter,
    messages: ChatCompletionMessageParam[],
    tools?: ChatCompletionTool[],
    maxTokens = 500,
    model: openAIModel = 'gpt-4o-mini',
  ): Promise<void> {
    try {
      const response = await this.openAI.chat.completions.create(
        {
          model,
          top_p: 0.1,
          max_tokens: maxTokens,
          messages,
          tools,
          presence_penalty: -2,
          seed: 100,
          stream: true,
          // parallel_tool_calls: false
        },
        defaultChatCompletionRequestOptions,
      )

      for await (const chunk of response) {
        try {
          eventEmitter.emit('chunk', chunk.choices[0].delta.content)
        } catch (error) {
          Logger.error('Error parsing stream chunk:', error)
          eventEmitter.emit('error', error)
        }
      }

      eventEmitter.emit('end')
    } catch (e) {
      throw e
    }
  }

  async createChatCompletions(
    messages: ChatCompletionMessageParam[],
    maxTokens = 500,
    model: openAIModel = 'gpt-4o-mini',
  ): Promise<string> {
    try {
      const response = await this.openAI.chat.completions.create(
        {
          model,
          top_p: 0.1,
          max_tokens: maxTokens,
          messages,
          presence_penalty: -2,
          seed: 100,
        },
        defaultChatCompletionRequestOptions,
      )

      if (!response.choices[0].message.content) {
        throw new Error('Response content is null -> createChatCompletions -> error in chat completion request')
      }

      return response.choices[0].message.content
    } catch (e) {
      throw e
    }
  }

  async createChatCompletionsWithStream(
    eventEmitter: EventEmitter,
    messages: ChatCompletionMessageParam[],
    maxTokens = 500,
    model: openAIModel = 'gpt-4o-mini',
  ): Promise<void> {
    try {
      const response = await this.openAI.chat.completions.create(
        {
          model,
          top_p: 0.1,
          max_tokens: maxTokens,
          messages,
          presence_penalty: -2,
          seed: 100,
          stream: true,
        },
        defaultChatCompletionRequestOptions,
      )

      for await (const chunk of response) {
        try {
          eventEmitter.emit('chunk', chunk.choices[0].delta.content)
        } catch (error) {
          Logger.error('Error parsing stream chunk:', error)
          eventEmitter.emit('error', error)
        }
      }

      eventEmitter.emit('end')
    } catch (e) {
      throw e
    }
  }

  async createChatCompletionsWithTools(
    messages: ChatCompletionMessageParam[],
    tools: ChatCompletionTool[],
    maxTokens = 500,
    model: openAIModel = 'gpt-4o-mini',
  ): Promise<ChatCompletion | null> {
    try {
      const response = await this.openAI.chat.completions.create(
        {
          model,
          top_p: 0.1,
          max_tokens: maxTokens,
          messages,
          tools,
          presence_penalty: -2,
          seed: 100,
          // parallel_tool_calls: false
        },
        defaultChatCompletionRequestOptions,
      )

      if (!response.usage) {
        return null
      }

      return response
    } catch (e) {
      Logger.error(e)
      return null
    }
  }

  async textToSpeechAndStreamToClient(socketClient: Socket, input: string): Promise<void> {
    try {
      const sentences = splitSentences(input)

      if (sentences.length === 0) {
        return
      }

      for (const sentence of sentences) {
        const response = await this.openAI.audio.speech.create({
          model: 'tts-1',
          voice: 'nova',
          input: sentence,
          response_format: 'mp3',
          speed: 1,
        })

        if (!response.body) {
          throw new Error('Response body is null')
        }

        const arrayBuffer = await response.arrayBuffer()

        socketClient.emit('interviewer-response', Buffer.from(arrayBuffer))
      }
    } catch (e) {
      throw e
    }
  }

  async textToSpeech(input: string): Promise<Buffer> {
    Logger.debug(`Text to speech requested`)
    const response = await this.openAI.audio.speech.create({
      model: 'tts-1',
      voice: 'nova',
      input,
      response_format: 'mp3',
      speed: 1,
    })

    if (!response.body) {
      throw new Error('Response body is null')
    }

    Logger.debug(`Text to speech done`)

    const arrayBuffer = await response.arrayBuffer()

    return Buffer.from(arrayBuffer)
  }

  async isOpenAIOperational(): Promise<boolean> {
    const response = lastValueFrom(await this.axios.get('https://status.openai.com/api/v2/summary.json'))

    if ((await response).status !== 200) {
      return false
    }

    for (const component of ((await response).data as OpenAIStatus).components) {
      if (component.name === 'API' && component.status !== 'operational') {
        return false
      }
    }

    return true
  }
}
