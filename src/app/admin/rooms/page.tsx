import { getAllRooms } from '@/lib/kv'
import { getColorClasses } from '@/lib/utils'
import Link from 'next/link'
import DeleteRoomButton from '@/components/admin/DeleteRoomButton'

export const revalidate = 0

export default async function RoomsPage() {
  const rooms = await getAllRooms()

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">إدارة القاعات</h1>
          <p className="text-slate-500 text-sm mt-1">{rooms.length} قاعة مسجلة</p>
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

      {rooms.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <p className="text-slate-500">لا توجد قاعات. أضف أول قاعة.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-right text-xs font-semibold text-slate-500 px-5 py-3">القاعة</th>
                <th className="text-right text-xs font-semibold text-slate-500 px-5 py-3">السعة</th>
                <th className="text-right text-xs font-semibold text-slate-500 px-5 py-3">Calendar ID</th>
                <th className="text-right text-xs font-semibold text-slate-500 px-5 py-3">رابط التابلت</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {rooms.map((room, idx) => {
                const colors = getColorClasses(room.color)
                return (
                  <tr key={room.id} className={idx !== rooms.length - 1 ? 'border-b border-slate-100' : ''}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${colors.bg}`} />
                        <div>
                          <p className="font-medium text-slate-900">{room.name}</p>
                          {room.floor && <p className="text-xs text-slate-400">الطابق {room.floor}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600 text-sm">{room.capacity} شخص</td>
                    <td className="px-5 py-4">
                      <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 max-w-[200px] block truncate">
                        {room.calendarId}
                      </code>
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/room/${room.id}`}
                        target="_blank"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        /room/{room.id}
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        <Link
                          href={`/admin/rooms/${room.id}`}
                          className="text-xs text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          تعديل
                        </Link>
                        <DeleteRoomButton roomId={room.id} roomName={room.name} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
