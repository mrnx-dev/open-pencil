import { expect, test } from 'bun:test'

import type { UIMessage } from 'ai'
import type { ModelMessage, ToolResultPart } from 'ai'

import {
  requestMessages,
  resumableTransport,
  stepMessages
} from '@/app/ai/chat/history/continuation'

test('continuation omits unfinished tool calls without altering the saved transcript', async () => {
  const messages: UIMessage[] = [
    {
      id: 'partial',
      role: 'assistant',
      parts: [
        { type: 'text', text: 'Working on it' },
        { type: 'tool-edit', toolCallId: 'pending', state: 'input-available', input: {} },
        {
          type: 'tool-read',
          toolCallId: 'finished',
          state: 'output-available',
          input: {},
          output: {}
        }
      ]
    }
  ]
  let sent: UIMessage[] = []
  const transport = resumableTransport({
    reconnectToStream: async () => null,
    sendMessages: async (options) => {
      sent = options.messages
      return new ReadableStream({
        start(controller) {
          controller.close()
        }
      })
    }
  })
  await transport.sendMessages({
    chatId: 'chat',
    trigger: 'submit-message',
    messageId: undefined,
    messages,
    abortSignal: undefined
  })
  expect(sent[0]?.parts).toHaveLength(2)
  expect(messages[0]?.parts).toHaveLength(3)
  expect(
    sent[0]?.parts.some((part) => 'toolCallId' in part && part.toolCallId === 'finished')
  ).toBe(true)
})

function exportImageMessage(id: string, base64: string): UIMessage {
  return {
    id,
    role: 'assistant',
    parts: [
      {
        type: 'tool-export_image',
        toolCallId: `export-${id}`,
        state: 'output-available',
        input: {},
        output: { mimeType: 'image/png', base64, width: 100, height: 100 }
      }
    ]
  }
}

test('older export_image results leave the request, the newest stay and the transcript is whole', () => {
  const messages = [
    exportImageMessage('first', 'AAA'),
    exportImageMessage('second', 'BBB'),
    exportImageMessage('third', 'CCC')
  ]
  const [first, second, third] = requestMessages(messages)

  expect(messages).toHaveLength(3)

  expect(first?.parts[0]).toMatchObject({
    state: 'output-available',
    output: { imageElided: true }
  })
  expect(first?.parts[0]).not.toMatchObject({ output: { base64: expect.any(String) } })
  expect(second?.parts[0]).toMatchObject({ output: { base64: 'BBB' } })
  expect(third?.parts[0]).toMatchObject({ output: { base64: 'CCC' } })
})

test('errors and non-image outputs are never elided', () => {
  const messages: UIMessage[] = [
    {
      id: 'mixed',
      role: 'assistant',
      parts: [
        {
          type: 'tool-export_image',
          toolCallId: 'failed-export',
          state: 'output-error',
          input: {},
          errorText: 'No visible nodes to export'
        },
        {
          type: 'tool-export_image',
          toolCallId: 'empty-export',
          state: 'output-available',
          input: {},
          output: { error: 'The renderer returned no image for these nodes' }
        },
        exportImageMessage('kept', 'DDD')
      ]
    },
    exportImageMessage('oldest', 'EEE'),
    exportImageMessage('old', 'FFF')
  ]
  const [mixed, oldest, old] = requestMessages(messages)

  expect(mixed?.parts).toHaveLength(3)
  expect(mixed?.parts[0]).toMatchObject({ errorText: 'No visible nodes to export' })
  expect(mixed?.parts[1]).toMatchObject({
    output: { error: 'The renderer returned no image for these nodes' }
  })
  expect(mixed?.parts[2]).toEqual(exportImageMessage('kept', 'DDD'))
  // Only three image results exist, so all but none are dropped; the next export would elide EEE.
  expect(oldest?.parts[0]).toMatchObject({ output: { base64: 'EEE' } })
  expect(old?.parts[0]).toMatchObject({ output: { base64: 'FFF' } })
})

function toolMessage(id: string, payloads: Array<{ id: string; payload: unknown }>): ModelMessage {
  return {
    role: 'tool',
    content: payloads.map(({ id: callId, payload }) => ({
      type: 'tool-result' as const,
      toolCallId: `${id}-${callId}`,
      toolName: 'export_image',
      output:
        payload && typeof payload === 'object' && 'image' in (payload as Record<string, unknown>)
          ? {
              type: 'content' as const,
              value: [
                { type: 'text' as const, text: '{"width":100,"height":100}' },
                {
                  type: 'file' as const,
                  mediaType: 'image/png',
                  data: { type: 'data' as const, data: (payload as { image: string }).image }
                }
              ]
            }
          : { type: 'json' as const, value: payload }
    }))
  }
}

test("stepMessages elides the reply's own older exports, keeping the newest two", () => {
  const messages = [
    toolMessage('turn', [
      { id: 'e1', payload: { image: 'AAA' } },
      { id: 'e2', payload: { image: 'BBB' } },
      { id: 'e3', payload: { image: 'CCC' } }
    ])
  ]
  const [turn] = stepMessages(messages)

  const [first, second, third] = (turn?.content ?? []) as ToolResultPart[]
  expect(first).toMatchObject({ toolCallId: 'turn-e1', output: { type: 'content' } })
  expect(JSON.stringify(first?.output)).toContain('imageElided')
  expect(JSON.stringify(first?.output)).not.toContain('AAA')
  expect(second).toMatchObject({ toolCallId: 'turn-e2' })
  expect(JSON.stringify(second?.output)).toContain('BBB')
  expect(third).toMatchObject({ toolCallId: 'turn-e3' })
  expect(JSON.stringify(third?.output)).toContain('CCC')
})

test('stepMessages leaves non-image tool results untouched', () => {
  const messages = [
    toolMessage('turn', [
      { id: 'err', payload: { error: 'No visible nodes to export' } },
      { id: 'ok', payload: { image: 'DDD' } }
    ])
  ]
  const [turn] = stepMessages(messages)

  const [errorPart, imagePart] = (turn?.content ?? []) as ToolResultPart[]
  expect(errorPart).toMatchObject({
    output: { type: 'json', value: { error: 'No visible nodes to export' } }
  })
  expect(JSON.stringify(imagePart?.output)).toContain('DDD')
})
