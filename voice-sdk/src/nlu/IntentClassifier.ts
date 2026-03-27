export interface BaseIntent {
  name: string
  patterns: string[]
  execute(params: unknown): Promise<string>
}

export interface ClassificationResult {
  intent: BaseIntent
  confidence: number
  params: unknown
}

const UNKNOWN_INTENT: BaseIntent = {
  name: 'UNKNOWN',
  patterns: [],
  execute: async () => "I didn't understand that command.",
}

export class IntentClassifier {
  private intents: BaseIntent[] = []

  register(intent: BaseIntent): void {
    this.intents.push(intent)
  }

  classify(utterance: string): ClassificationResult {
    const normalized = utterance.toLowerCase().trim()
    let bestMatch: ClassificationResult = {
      intent: UNKNOWN_INTENT,
      confidence: 0,
      params: { utterance },
    }

    for (const intent of this.intents) {
      let maxScore = 0

      for (const pattern of intent.patterns) {
        const patternWords = pattern.toLowerCase().split(' ')
        const utteranceWords = normalized.split(' ')
        let matchCount = 0

        for (const word of patternWords) {
          if (utteranceWords.some((uw) => uw.includes(word) || word.includes(uw))) {
            matchCount++
          }
        }

        const score = matchCount / patternWords.length
        if (score > maxScore) maxScore = score
      }

      if (maxScore > bestMatch.confidence) {
        bestMatch = {
          intent,
          confidence: maxScore,
          params: this.extractParams(normalized, intent),
        }
      }
    }

    return bestMatch
  }

  private extractParams(utterance: string, intent: BaseIntent): unknown {
    // Basic param extraction — looks for numbers and addresses
    const params: Record<string, unknown> = { utterance }

    const numbers = utterance.match(/\d+(\.\d+)?/g)
    if (numbers) params['amounts'] = numbers.map(Number)

    const ethAddresses = utterance.match(/0x[a-fA-F0-9]{40}/g)
    if (ethAddresses) params['addresses'] = ethAddresses

    return params
  }

  getIntentNames(): string[] {
    return this.intents.map((i) => i.name)
  }
}
