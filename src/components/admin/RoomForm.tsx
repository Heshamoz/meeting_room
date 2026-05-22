'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ROOM_COLORS } from '@/lib/utils'
import type { Room } from '@/types'

interface Props {
  room?: Room
  isEdit?: boolean
}

const AMENITIES_OPTIONS = [
  'بروجكتور', 'شاشة تلفزيون', 'لوح أبيض', 'تلفزيون ذكي',
  'نظام صوتي', 'مؤتمر مرئي', 'واي فاي', 'تكييف',
]

export default function RoomForm({ room, isEdit }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: room?.name || '',
    calendarId: room?.calendarId || '',
    pin: '',
    color: room?.color || 'blue',
    capacity: room?.capacity || 10,
    floor: room?.floor || '',
    amenities: room?.amenities || [],
  })

  function toggleAmenity(a: string) {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(a) ? f.amenities.filter((x) => x !== a) : [...f.amenities, a],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const url = isEdit ? `/api/rooms/${room!.id}` : '/api/rooms'
      const method = isEdit ? 'PUT' : 'POST'

      const body: Record<string, unknown> = {
        name: form.name,
        calendarId: form.calendarId,
        color: form.color,
        capacity: Number(form.capacity),
        floor: form.floor,
        amenities: form.amenities,
      }
      if (form.pin) body.pin = form.pin

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'حدث خطأ')
      }

      router.push('/admin/rooms')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            اسم القاعة <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="مثال: قاعة الماس"
            className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Calendar ID */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Google Calendar ID <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={form.calendarId}
            onChange={(e) => setForm((f) => ({ ...f, calendarId: e.target.value }))}
            placeholder="room@your-company.com أو معرف التقويم"
            className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
            dir="ltr"
          />
          <p className="text-xs text-slate-400 mt-1">
            تجده في إعدادات التقويم في Google Calendar ← &quot;معرّف التقويم&quot;
          </p>
        </div>

        {/* PIN */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            رمز PIN {!isEdit && <span className="text-red-500">*</span>}
            {isEdit && <span className="text-slate-400 text-xs mr-1">(اتركه فارغاً للإبقاء على الحالي)</span>}
          </label>
          <input
            type="password"
            required={!isEdit}
            value={form.pin}
            onChange={(e) => setForm((f) => ({ ...f, pin: e.target.value }))}
            placeholder="أدخل رمز PIN للتابلت (4-8 أرقام)"
            maxLength={8}
            minLength={4}
            pattern="[0-9]*"
            inputMode="numeric"
            className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Color */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">لون القاعة</label>
          <div className="flex flex-wrap gap-2">
            {ROOM_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, color: c.value }))}
                className={`w-9 h-9 rounded-full ${c.bg} transition-transform ${
                  form.color === c.value ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-105'
                }`}
                title={c.label}
              />
            ))}
          </div>
        </div>

        {/* Capacity + Floor */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">السعة (أشخاص)</label>
            <input
              type="number"
              min={1}
              max={500}
              value={form.capacity}
              onChange={(e) => setForm((f) => ({ ...f, capacity: Number(e.target.value) }))}
              className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">الطابق (اختياري)</label>
            <input
              type="text"
              value={form.floor}
              onChange={(e) => setForm((f) => ({ ...f, floor: e.target.value }))}
              placeholder="مثال: الأول، الثاني"
              className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Amenities */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">المرافق والمعدات</label>
          <div className="flex flex-wrap gap-2">
            {AMENITIES_OPTIONS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => toggleAmenity(a)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  form.amenities.includes(a)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-medium text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'جاري الحفظ...' : isEdit ? 'حفظ التعديلات' : 'إضافة القاعة'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 border border-slate-300 text-slate-600 py-2.5 rounded-xl font-medium text-sm hover:bg-slate-50 transition-colors"
          >
            إلغاء
          </button>
        </div>
      </div>
    </form>
  )
}
