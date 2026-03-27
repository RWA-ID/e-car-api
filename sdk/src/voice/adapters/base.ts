export interface ParsedIntent {
  intent: string
  payload: unknown
  confidence: number
}

export abstract class BaseVoiceAdapter {
  abstract readonly name: string

  abstract parseIntent(utterance: string): Promise<ParsedIntent>

  abstract buildResponse(result: unknown): string

  protected normalize(text: string): string {
    return text.toLowerCase().trim()
  }
}
