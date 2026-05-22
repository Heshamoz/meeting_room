'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function RoomPinPage() {
  const router = useRouter()
  const params = useParams()
  const roomId = params.roomId as string

  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleKey(digit: string) {
    if (pin.length >= 8) return
    setPin((p) => p + digit)
    setError('')
  }

  function handleBackspace() {
    setPin((p) => p.slice(0, -1))
  }

  async function handleSubmit() {
    if (pin.length < 4) {
      setError('أدخل رمز PIN (4-8 أرقام)')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/rooms/${roomId}/verify-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      })

      if (res.ok) {
        router.replace(`/room/${roomId}/display`)
      } else {
        const data = await res.json()
        setError(data.error || 'رمز PIN غير صحيح')
        setPin('')
      }
    } catch {
      setError('حدث خطأ. تحقق من الاتصال.')
    } finally {
      setLoading(false)
    }
  }

  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', '⌫'],
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-6 tablet-display">
      <div className="w-full max-w-xs">
        {/* Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-white text-xl font-semibold">أدخل رمز PIN</h1>
          <p className="text-slate-400 text-sm mt-1">للوصول إلى شاشة القاعة</p>
        </div>

        {/* PIN Display */}
        <div className="flex justify-center gap-3 mb-6">
          {Array.from({ length: Math.max(4, pin.length) }).map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all ${
                i < pin.length ? 'bg-blue-400' : 'bg-slate-600'
              }`}
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-300 text-sm text-center rounded-xl px-4 py-2 mb-4">
            {error}
          </div>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {keys.flat().map((key, idx) => {
            if (!key) return <div key={idx} />
            if (key === '⌫') {
              return (
                <button
                  key={idx}
                  onPointerDown={handleBackspace}
                  className="h-16 rounded-2xl bg-slate-700 text-white text-xl flex items-center justify-center active:bg-slate-600 transition-colors"
                >
                  ⌫
                </button>
              )
            }
            return (
              <button
                key={idx}
                onPointerDown={() => handleKey(key)}
                className="h-16 rounded-2xl bg-slate-700 text-white text-2xl font-semibold flex items-center justify-center active:bg-blue-700 active:scale-95 transition-all"
              >
                {key}
              </button>
            )
          })}
        </div>

        {/* Enter button */}
        <button
          onClick={handleSubmit}
          disabled={loading || pin.length < 4}
          className="w-full h-14 bg-blue-600 text-white font-semibold text-lg rounded-2xl active:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? 'جاري التحقق...' : 'دخول'}
        </button>
      </div>
    </div>
  )
}
