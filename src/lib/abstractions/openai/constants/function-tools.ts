import { ChatCompletionTool } from 'openai/resources'

export const analyzeAssistantFunctions: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'submitAnalyze',
      description: 'Submit analyze for candidates answer for a question',
      parameters: {
        type: 'object',
        properties: {
          questionId: {
            type: 'string',
            description: 'The questions id which the analyze should be submitted for',
          },
          score: {
            type: 'number',
            description: 'The score for the candidates answer which is generated based on question rules: has to be from 0 to 10',
          },
          analyze: {
            type: 'string',
            description: 'The analyze of the candidates answer',
          },
          answerSummary: {
            type: 'string',
            description: 'A summary of what candidate answered for the question',
          },
        },
        required: ['questionId', 'score', 'analyze'],
      },
    },
  },
]

export const conversationAssistantFunctions: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'retrieveQuestion',
      description: 'Get the question that should be asked from candidate',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'endInterview',
      description: 'Ends the interview',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
]
