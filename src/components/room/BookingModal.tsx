'use client'

import { useState } from 'react'
import { format, addMinutes, startOfMinute } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { getTimezone } from '@/lib/utils'

interface Props {
  roomId: string
  roomName: string
  onClose: () => void
  onBooked: () => void
}

const DURATION_OPTIONS = [30, 60, 90, 120]

export default function BookingModal({ roomId, roomName, onClose, onBooked }: Props) {
  const tz = getTimezone()
  const nowZoned = toZonedTime(new Date(), tz)
  const roundedNow = startOfMinute(addMinutes(nowZoned, 1))

  const toLocalInput = (d: Date) => format(d, "yyyy-MM-dd'T'HH:mm")

  const [form, setForm] = useState({
    title: '',
    organizerEmail: '',
    organizerName: '',
    attendeeEmails: '',
    startTime: toLocalInput(roundedNow),
    duration: 60,
    description: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function getEndTime(): string {
    const start = new Date(form.startTime)
    const end = addMinutes(start, form.duration)
    return end.toISOString()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const start = new Date(form.startTime)
      const end = addMinutes(start, form.duration)

      const attendeeEmails = form.attendeeEmails
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean)

      const res = await fetch(`/api/rooms/${roomId}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          organizerEmail: form.organizerEmail,
          organizerName: form.organizerName,
          attendeeEmails,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          description: form.description,
        }),
      })

      if (res.ok) {
        setSuccess(true)
        await onBooked()
        setTimeout(onClose, 2500)
      } else {
        const data = await res.json()
        setError(data.error || 'فشل الحجز')
      }
    } catch {
      setError('حدث خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl p-12 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">تم الحجز!</h2>
          <p className="text-slate-500">تم إنشاء الاجتماع وإرسال دعوات البريد الإلكتروني</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-xl">حجز اجتماع</h2>
            <p className="text-slate-400 text-sm">{roomName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-700"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              موضوع الاجتماع <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="مثال: اجتماع الفريق الأسبوعي"
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Organizer */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                الاسم <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.organizerName}
                onChange={(e) => setForm((f) => ({ ...f, organizerName: e.target.value }))}
                placeholder="اسمك"
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                البريد الإلكتروني <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={form.organizerEmail}
                onChange={(e) => setForm((f) => ({ ...f, organizerEmail: e.target.value }))}
                placeholder="email@company.com"
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                dir="ltr"
              />
            </div>
          </div>

          {/* Start time + Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                وقت البداية <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={form.startTime}
                onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">المدة</label>
              <div className="grid grid-cols-2 gap-1.5">
                {DURATION_OPTIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, duration: d }))}
                    className={`py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      form.duration === d
                        ? 'bg-blue-600 text-white'
                        : 'border border-slate-300 text-slate-600 hover:border-blue-400'
                    }`}
                  >
                    {d < 60 ? `${d}د` : `${d / 60}س`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* End time display */}
          <div className="bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-600">
            وقت الانتهاء: <strong>{form.startTime ? format(addMinutes(new Date(form.startTime), form.duration), 'hh:mm a') : '--'}</strong>
          </div>

          {/* Attendees */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              المشاركون (اختياري)
            </label>
            <input
              type="text"
              value={form.attendeeEmails}
              onChange={(e) => setForm((f) => ({ ...f, attendeeEmails: e.target.value }))}
              placeholder="email1@co.com, email2@co.com"
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              dir="ltr"
            />
            <p className="text-xs text-slate-400 mt-1">افصل بين الإيميلات بفاصلة</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              وصف (اختياري)
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              placeholder="أجندة الاجتماع أو ملاحظات..."
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'جاري الحجز...' : 'تأكيد الحجز'}
          </button>
        </form>
      </div>
    </div>
  )
}
