'use client'

import { useState, useRef } from 'react'
import TranscriptView from './TranscriptView'
import LoadingSpinner from '../shared/LoadingSpinner'
import { API_BASE_URL } from '../../lib/constants'

interface TranscriptEntry {
  text: string
  type: 'recognized' | 'error' | 'unknown'
  response?: string
}

export default function VoiceDemo() {
  const [listening, setListening] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [entries, setEntries] = useState<TranscriptEntry[]>([])
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const startListening = () => {
    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      setEntries(e => [...e, { text: 'Web Speech API not supported in this browser.', type: 'error' }])
      return
    }
    const SR = window.SpeechRecognition ?? (window as typeof window & { webkitSpeechRecognition: typeof SpeechRecognition }).webkitSpeechRecognition
    const recognition = new SR()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognitionRef.current = recognition

    recognition.onresult = async (event) => {
      const text = event.results[0][0].transcript
      setListening(false)
      setProcessing(true)
      setEntries(e => [...e, { text, type: 'recognized' }])

      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/voice/intent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ utterance: text }),
        })
        const data = await res.json() as { result: string; intent: string }
        setEntries(e => [...e.slice(0, -1), { text, type: 'recognized', response: `[${data.intent}] ${data.result}` }])
      } catch {
        setEntries(e => [...e.slice(0, -1), { text, type: 'error', response: 'Failed to process intent' }])
      } finally {
        setProcessing(false)
      }
    }

    recognition.onerror = () => {
      setListening(false)
      setEntries(e => [...e, { text: 'Speech recognition error.', type: 'error' }])
    }

    recognition.onend = () => setListening(false)
    recognition.start()
    setListening(true)
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    setListening(false)
  }

  return (
    <div className="card p-8 flex flex-col items-center gap-6">
      <button
        onClick={listening ? stopListening : startListening}
        disabled={processing}
        className="relative w-24 h-24 rounded-full flex items-center justify-center text-4xl transition-all"
        style={{
          background: listening ? 'rgba(239,68,68,0.15)' : 'rgba(0,212,255,0.1)',
          border: `2px solid ${listening ? '#ef4444' : 'var(--accent)'}`,
          boxShadow: listening ? '0 0 30px rgba(239,68,68,0.4)' : '0 0 20px rgba(0,212,255,0.2)',
        }}
      >
        {processing ? <LoadingSpinner size={28} /> : listening ? '🛑' : '🎙️'}
        {listening && (
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 animate-pulse" />
        )}
      </button>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        {processing ? 'Processing…' : listening ? 'Listening… click to stop' : 'Click to speak'}
      </p>
      <TranscriptView entries={entries} />
    </div>
  )
}
