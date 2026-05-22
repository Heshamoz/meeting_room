import RoomForm from '@/components/admin/RoomForm'
import Link from 'next/link'

export default function NewRoomPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/rooms" className="text-slate-400 hover:text-slate-600 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">إضافة قاعة جديدة</h1>
          <p className="text-slate-500 text-sm mt-0.5">أضف قاعة اجتماعات وربطها بتقويم Google</p>
        </div>
      </div>
      <RoomForm />
    </div>
  )
}
