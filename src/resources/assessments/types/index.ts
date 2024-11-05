export interface MeetingConversationMessage {
  isQuestionAsked: boolean
  questionId?: string
  content: string
  role: MeetingConversationMessageRole
}

export interface MeetingRetrievedQuestion {
  id: string
  content: string
}

export type MeetingConversationMessageRole = 'assistant' | 'user'
