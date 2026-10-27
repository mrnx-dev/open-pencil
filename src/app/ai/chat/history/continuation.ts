import {
  getToolName,
  isToolUIPart,
  type ChatTransport,
  type UIDataTypes,
  type UIMessage,
  type UIMessagePart,
  type UITools
} from 'ai'

/** Older `export_image` results this many exports back leave each request, keeping the newest. */
const KEPT_IMAGE_RESULTS = 2

/** Replaces an elided image result, so the tool call stays paired with an output. */
const elidedImageResult = {
  imageElided: true,
  note: 'This older export_image result was removed to fit the context window; call export_image again to see it.'
}

type Part = UIMessagePart<UIDataTypes, UITools>

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** A finished call whose output is a base64 image the model no longer needs to see. */
const isImageResult = (part: Part): boolean =>
  'toolCallId' in part &&
  part.state === 'output-available' &&
  isToolUIPart(part) &&
  getToolName(part) === 'export_image' &&
  isRecord(part.output) &&
  typeof part.output.base64 === 'string'

/** The history a new request sends: partial tool activity stays in history, unpaired calls do not. */
export function requestMessages(messages: UIMessage[]): UIMessage[] {
  // Long design runs export a screenshot after nearly every edit; each stays in every later
  // request, so a 45-step run exceeds the context window. The transcript keeps every image —
  // only the request history drops all but the newest few. Replacing the base64 with a note
  // keeps the call paired with an output, which the next request's validation requires.
  let kept = 0
  return [...messages]
    .reverse()
    .map((message) => ({
      ...message,
      parts: message.parts.flatMap((part): Part[] => {
        if (!('toolCallId' in part)) return [part]
        if (
          part.state !== 'output-available' &&
          part.state !== 'output-error' &&
          part.state !== 'output-denied'
        )
          return []
        const image = isImageResult(part)
        if (image && kept >= KEPT_IMAGE_RESULTS)
          return [{ ...part, output: elidedImageResult } as Part]
        if (image) kept++
        return [part]
      })
    }))
    .filter((message) => message.parts.length > 0)
    .reverse()
}

/** Preserve partial tool activity in history but omit unpaired calls from new requests. */
export function resumableTransport(transport: ChatTransport<UIMessage>): ChatTransport<UIMessage> {
  return {
    reconnectToStream: (options) => transport.reconnectToStream(options),
    sendMessages: (options) =>
      transport.sendMessages({ ...options, messages: requestMessages(options.messages) })
  }
}
