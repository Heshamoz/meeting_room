import { getAllRooms } from '@/lib/kv'
import { getRoomEvents } from '@/lib/google-calendar'
import { getRoomStatus, formatTime, getColorClasses } from '@/lib/utils'
import Link from 'next/link'

export const revalidate = 30

export default async function AdminDashboard() {
  const rooms = await getAllRooms()

  const roomsWithStatus = await Promise.all(
    rooms.map(async (room) => {
      try {
        const events = await getRoomEvents(room.calendarId)
        const status = getRoomStatus(events)
        const current = events.find((e) => {
          const now = new Date()
          return new Date(e.startTime) <= now && new Date(e.endTime) >= now
        })
        const next = events.find((e) => new Date(e.startTime) > new Date())
        return { room, events, status, current, next }
      } catch {
        return { room, events: [], status: 'available' as const, current: null, next: null }
      }
    })
  )

  const available = roomsWithStatus.filter((r) => r.status === 'available').length
  const occupied = roomsWithStatus.filter((r) => r.status !== 'available').length

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">لوحة التحكم</h1>
          <p className="text-slate-500 text-sm mt-1">نظرة عامة على جميع القاعات</p>
        </div>
        <Link
          href="/admin/rooms/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          إضافة قاعة
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm">إجمالي القاعات</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{rooms.length}</p>
        </div>
        <div className="bg-green-50 rounded-2xl p-5 border border-green-200 shadow-sm">
          <p className="text-green-700 text-sm">متاحة الآن</p>
          <p className="text-3xl font-bold text-green-700 mt-1">{available}</p>
        </div>
        <div className="bg-red-50 rounded-2xl p-5 border border-red-200 shadow-sm">
          <p className="text-red-700 text-sm">مشغولة الآن</p>
          <p className="text-3xl font-bold text-red-700 mt-1">{occupied}</p>
        </div>
      </div>

      {/* Rooms Grid */}
      {rooms.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <p className="text-slate-600 font-medium">لا توجد قاعات بعد</p>
          <p className="text-slate-400 text-sm mt-1">أضف قاعتك الأولى للبدء</p>
          <Link
            href="/admin/rooms/new"
            className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            إضافة قاعة
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roomsWithStatus.map(({ room, status, current, next }) => {
            const colors = getColorClasses(room.color)
            return (
              <div key={room.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Color bar */}
                <div className={`h-1.5 ${colors.bg}`} />

                <div className="p-5">
                  {/* Room name + status */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h2 className="font-bold text-slate-900 text-lg">{room.name}</h2>
                      {room.floor && (
                        <p className="text-slate-400 text-xs mt-0.5">الطابق {room.floor}</p>
                      )}
                    </div>
                    <StatusBadge status={status} />
                  </div>

                  {/* Capacity + amenities */}
                  <div className="flex items-center gap-3 text-slate-500 text-xs mb-4">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {room.capacity} شخص
                    </span>
                    {room.amenities.slice(0, 2).map((a) => (
                      <span key={a} className="bg-slate-100 px-2 py-0.5 rounded-full">{a}</span>
                    ))}
                  </div>

                  {/* Current / Next meeting */}
                  {current ? (
                    <div className="bg-red-50 rounded-xl p-3 border border-red-100">
                      <p className="text-xs text-red-600 font-medium mb-1">الاجتماع الحالي</p>
                      <p className="text-sm font-semibold text-red-900 truncate">{current.title}</p>
                      <p className="text-xs text-red-600 mt-0.5">
                        {formatTime(current.startTime)} - {formatTime(current.endTime)}
                      </p>
                    </div>
                  ) : next ? (
                    <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                      <p className="text-xs text-blue-600 font-medium mb-1">الاجتماع القادم</p>
                      <p className="text-sm font-semibold text-blue-900 truncate">{next.title}</p>
                      <p className="text-xs text-blue-600 mt-0.5">
                        {formatTime(next.startTime)} - {formatTime(next.endTime)}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                      <p className="text-xs text-green-600">لا توجد اجتماعات اليوم</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <Link
                      href={`/admin/rooms/${room.id}`}
                      className="flex-1 text-center text-xs font-medium text-slate-600 border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      تعديل
                    </Link>
                    <Link
                      href={`/room/${room.id}`}
                      target="_blank"
                      className="flex-1 text-center text-xs font-medium text-blue-600 border border-blue-200 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      فتح شاشة القاعة
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <p className="text-center text-slate-400 text-xs mt-8">
        تحديث تلقائي كل 30 ثانية · آخر تحديث: الآن
      </p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'available') {
    return (
      <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">
        <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
        متاحة
      </span>
    )
  }
  if (status === 'ending-soon') {
    return (
      <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 text-xs font-medium px-2.5 py-1 rounded-full">
        <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full status-pulse" />
        تنتهي قريباً
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs font-medium px-2.5 py-1 rounded-full">
      <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
      مشغولة
    </span>
  )
}
