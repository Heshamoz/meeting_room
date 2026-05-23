'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import type { CalendarEvent, RoomPublic } from '@/types'
import {
  getRoomStatus,
  getCurrentEvent,
  getUpcomingEvents,
  getMinutesUntilEnd,
  getMinutesUntilStart,
  formatTime,
  getColorClasses,
  getTimezone,
} from '@/lib/utils'
import BookingModal from './BookingModal'

interface Props {
  room: RoomPublic
  initialEvents: CalendarEvent[]
}

const REFRESH_INTERVAL = 30_000 // 30 seconds

export default function RoomDisplay({ room, initialEvents }: Props) {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents)
  const [now, setNow] = useState(new Date())
  const [showBooking, setShowBooking] = useState(false)
  const [lastSync, setLastSync] = useState(new Date())
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showReturnOverlay, setShowReturnOverlay] = useState(false)
  const [confirmedEventId, setConfirmedEventId] = useState<string | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)
  const tz = getTimezone()

  // Kiosk mode: fullscreen + prevent exit
  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen()
        }
      } catch { /* user denied */ }
    }

    // Enter fullscreen on first touch (browser requires user gesture)
    const handleFirstTouch = () => {
      enterFullscreen()
      document.removeEventListener('click', handleFirstTouch)
      document.removeEventListener('touchstart', handleFirstTouch)
    }
    document.addEventListener('click', handleFirstTouch)
    document.addEventListener('touchstart', handleFirstTouch)

    // When user exits fullscreen (e.g. presses Escape), show overlay
    const onFSChange = () => {
      const inFS = !!document.fullscreenElement
      setIsFullscreen(inFS)
      if (!inFS) setShowReturnOverlay(true)
      else setShowReturnOverlay(false)
    }
    document.addEventListener('fullscreenchange', onFSChange)

    // Prevent right-click context menu
    const preventContext = (e: MouseEvent) => e.preventDefault()
    document.addEventListener('contextmenu', preventContext)

    // Block common exit keyboard shortcuts
    const blockKeys = (e: KeyboardEvent) => {
      if (
        e.key === 'F11' ||
        (e.altKey && e.key === 'F4') ||
        (e.ctrlKey && (e.key === 'w' || e.key === 'W' || e.key === 'r' || e.key === 'R'))
      ) {
        e.preventDefault()
      }
    }
    document.addEventListener('keydown', blockKeys)

    // Prevent back navigation
    history.pushState(null, '', window.location.href)
    window.onpopstate = () => {
      history.pushState(null, '', window.location.href)
    }

    return () => {
      document.removeEventListener('click', handleFirstTouch)
      document.removeEventListener('touchstart', handleFirstTouch)
      document.removeEventListener('fullscreenchange', onFSChange)
      document.removeEventListener('contextmenu', preventContext)
      document.removeEventListener('keydown', blockKeys)
    }
  }, [])

  // Tick every second for the clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Fetch events every 30 seconds
  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch(`/api/rooms/${room.id}/events`, { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setEvents(data.events || [])
        setLastSync(new Date())
        // confirmation is managed locally per event ID
      }
    } catch {
      // keep existing events
    }
  }, [room.id])

  useEffect(() => {
    fetchEvents() // immediate fetch on mount
    const t = setInterval(fetchEvents, REFRESH_INTERVAL)
    return () => clearInterval(t)
  }, [fetchEvents])

  const status = getRoomStatus(events)
  const current = getCurrentEvent(events)
  const upcoming = getUpcomingEvents(events)

  // --- Confirmation logic (uses raw UTC timestamps to avoid timezone issues) ---
  const nowMs = now.getTime()

  // Find active event using simple raw timestamp comparison
  const activeEvent = events.find(e => {
    if (e.status === 'cancelled') return false
    const startMs = new Date(e.startTime).getTime()
    const endMs   = new Date(e.endTime).getTime()
    return startMs <= nowMs && nowMs <= endMs
  }) || null

  const confirmMinutesLeft = activeEvent
    ? Math.max(0, 30 - Math.floor((nowMs - new Date(activeEvent.startTime).getTime()) / 60000))
    : 0

  const isConfirmed = !!(activeEvent && confirmedEventId === activeEvent.id)

  const handleConfirm = async () => {
    if (!activeEvent || isConfirming) return
    setIsConfirming(true)
    // Confirm locally immediately (so UI updates even if API fails)
    setConfirmedEventId(activeEvent.id)
    try {
      await fetch(`/api/rooms/${room.id}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: activeEvent.id }),
      })
    } catch { /* local confirmation already set above */ }
    setIsConfirming(false)
  }
  const colors = getColorClasses(room.color)

  const zonedNow = toZonedTime(now, tz)
  const timeStr = format(zonedNow, 'hh:mm')
  const secondsStr = format(zonedNow, 'ss')
  const ampm = format(zonedNow, 'a')
  const dateStr = format(zonedNow, 'EEEE، d MMMM yyyy')

  const statusConfig = {
    available: {
      bg: 'bg-green-500',
      text: 'متاحة',
      textColor: 'text-green-700',
      bgLight: 'bg-green-50',
      border: 'border-green-200',
      gradientFrom: 'from-green-950',
      gradientVia: 'via-green-900',
      indicator: 'bg-green-400',
    },
    'ending-soon': {
      bg: 'bg-yellow-500',
      text: 'تنتهي قريباً',
      textColor: 'text-yellow-700',
      bgLight: 'bg-yellow-50',
      border: 'border-yellow-200',
      gradientFrom: 'from-yellow-950',
      gradientVia: 'via-yellow-900',
      indicator: 'bg-yellow-400 status-pulse',
    },
    occupied: {
      bg: 'bg-red-500',
      text: 'مشغولة',
      textColor: 'text-red-700',
      bgLight: 'bg-red-50',
      border: 'border-red-200',
      gradientFrom: 'from-red-950',
      gradientVia: 'via-red-900',
      indicator: 'bg-red-400',
    },
  }

  const sc = statusConfig[status]


  return (
    <div className={`min-h-screen bg-gradient-to-br ${sc.gradientFrom} ${sc.gradientVia} to-slate-900 flex flex-col tablet-display select-none`}>
      {/* Kiosk overlay: shown when user exits fullscreen */}
      {showReturnOverlay && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center cursor-pointer"
          onClick={async () => {
            try {
              await document.documentElement.requestFullscreen()
              setShowReturnOverlay(false)
            } catch { /* denied */ }
          }}
        >
          <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-6">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
            </svg>
          </div>
          <p className="text-white text-3xl font-bold mb-2">{room.name}</p>
          <p className="text-white/50 text-lg">اضغط للعودة</p>
        </div>
      )}

      {/* Top bar: Room name + status */}
      <div className="flex items-center justify-between px-8 pt-8 pb-4">
        <div className="flex items-center gap-4">
          <div className={`w-4 h-4 rounded-full ${sc.indicator}`} />
          <h1 className="text-white text-3xl font-bold">{room.name}</h1>
          {room.floor && <span className="text-white/50 text-lg">الطابق {room.floor}</span>}
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${sc.bg}`}>
          <span className="text-white font-semibold text-lg">{sc.text}</span>
        </div>
      </div>

      {/* ── Confirmation banner: fixed at bottom, above everything ── */}
      {activeEvent && !isConfirmed && (
        <div style={{
          position:'fixed', bottom:0, left:0, right:0, zIndex:9999,
          background:'#ea580c',
          padding:'20px 32px',
          display:'flex', alignItems:'center', justifyContent:'space-between', gap:'16px',
          boxShadow:'0 -4px 24px rgba(0,0,0,0.4)'
        }}>
          <div>
            <p style={{color:'#fff',fontWeight:'bold',fontSize:'1.35rem',margin:0}}>
              يرجى تأكيد حضورك في القاعة
            </p>
            <p style={{color:'rgba(255,255,255,0.85)',fontSize:'0.95rem',margin:'4px 0 0'}}>
              {`"${activeEvent.title}" · سيُلغى الحجز خلال ${confirmMinutesLeft} دقيقة`}
            </p>
          </div>
          <button
            onClick={handleConfirm}
            disabled={isConfirming}
            style={{
              background:'#fff', color:'#ea580c',
              fontWeight:'bold', fontSize:'1.2rem',
              padding:'14px 40px', borderRadius:'14px',
              border:'none', cursor:'pointer',
              whiteSpace:'nowrap',
              boxShadow:'0 2px 8px rgba(0,0,0,0.25)',
              opacity: isConfirming ? 0.6 : 1,
              flexShrink: 0
            }}
          >
            {isConfirming ? 'جاري التأكيد...' : '✓ تأكيد الحضور'}
          </button>
        </div>
      )}

      {activeEvent && isConfirmed && (
        <div style={{
          position:'fixed', bottom:0, left:0, right:0, zIndex:9999,
          background:'#16a34a',
          padding:'16px 32px',
          display:'flex', alignItems:'center', gap:'12px',
          boxShadow:'0 -4px 24px rgba(0,0,0,0.3)'
        }}>
          <span style={{color:'#fff',fontSize:'1.2rem',fontWeight:'700'}}>✓ تم تأكيد الحضور</span>
          <span style={{color:'rgba(255,255,255,0.7)',fontSize:'0.95rem'}}>{activeEvent.title}</span>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 grid grid-cols-5 gap-6 px-8 pb-8">
        {/* Left: Clock + Current meeting */}
        <div className="col-span-3 flex flex-col gap-6">
          {/* Clock */}
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
            <div className="flex items-end gap-3">
              <span className="text-white text-8xl font-thin tabular-nums">{timeStr}</span>
              <div className="mb-3">
                <span className="text-white/60 text-4xl clock-separator">:</span>
                <span className="text-white/60 text-3xl tabular-nums block">{secondsStr}</span>
              </div>
              <span className="text-white/60 text-2xl mb-4">{ampm}</span>
            </div>
            <p className="text-white/60 text-xl mt-2">{dateStr}</p>
          </div>

          {/* Current meeting */}
          {current ? (
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/10 flex-1">
              <p className="text-white/60 text-sm font-medium uppercase tracking-widest mb-4">الاجتماع الحالي</p>
              <h2 className="text-white text-4xl font-bold leading-tight mb-4 line-clamp-2">
                {current.title}
              </h2>

              <div className="flex items-center gap-6 mb-6">
                <div className="bg-white/10 rounded-xl px-4 py-2">
                  <p className="text-white/50 text-xs">البداية</p>
                  <p className="text-white text-xl font-semibold">{formatTime(current.startTime)}</p>
                </div>
                <div className="text-white/40 text-2xl">←</div>
                <div className="bg-white/10 rounded-xl px-4 py-2">
                  <p className="text-white/50 text-xs">النهاية</p>
                  <p className="text-white text-xl font-semibold">{formatTime(current.endTime)}</p>
                </div>
                <div className="mr-auto bg-white/20 rounded-xl px-4 py-2 text-center">
                  <p className="text-white/50 text-xs">المتبقي</p>
                  <p className="text-white text-xl font-bold">{getMinutesUntilEnd(current)} دقيقة</p>
                </div>
              </div>

              {current.organizer && (
                <p className="text-white/50 text-sm">
                  المنظم: <span className="text-white/80">{current.organizer}</span>
                </p>
              )}

              {current.attendees.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {current.attendees.slice(0, 4).map((a) => (
                    <span key={a.email} className="bg-white/10 text-white/70 text-xs px-3 py-1 rounded-full">
                      {a.name || a.email}
                    </span>
                  ))}
                  {current.attendees.length > 4 && (
                    <span className="text-white/40 text-xs px-3 py-1">
                      +{current.attendees.length - 4} آخرون
                    </span>
                  )}
                </div>
              )}

            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/10 flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-white text-3xl font-bold mb-2">القاعة متاحة</h2>
              {upcoming.length > 0 && (
                <p className="text-white/50 text-lg">
                  الاجتماع القادم خلال {getMinutesUntilStart(upcoming[0])} دقيقة
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right: Upcoming + Book */}
        <div className="col-span-2 flex flex-col gap-6">
          {/* Book button */}
          <button
            onClick={() => setShowBooking(true)}
            className="bg-white text-slate-900 font-bold text-xl py-5 rounded-2xl hover:bg-slate-100 active:bg-slate-200 transition-colors shadow-lg"
          >
            + حجز الآن
          </button>

          {/* Upcoming meetings */}
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/10 flex-1 overflow-hidden">
            <p className="text-white/60 text-sm font-medium uppercase tracking-widest mb-4">الاجتماعات القادمة</p>

            {upcoming.length === 0 ? (
              <div className="flex-1 flex items-center justify-center py-12">
                <p className="text-white/40 text-center">لا توجد اجتماعات قادمة اليوم</p>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-[400px]">
                {upcoming.map((e) => (
                  <div key={e.id} className="bg-white/10 rounded-2xl p-4 border border-white/5">
                    <p className="text-white font-semibold text-base truncate">{e.title}</p>
                    <p className="text-white/60 text-sm mt-1">
                      {formatTime(e.startTime)} - {formatTime(e.endTime)}
                    </p>
                    {e.organizer && (
                      <p className="text-white/40 text-xs mt-1 truncate">{e.organizer}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Room info + fullscreen */}
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <div className="flex items-center justify-between text-white/40 text-xs">
              <span>{room.capacity} شخص</span>
              <span style={{color: current ? '#f97316' : '#4ade80', fontWeight: 'bold'}}>
                {current ? `● اجتماع نشط: ${events.length} أحداث` : `○ لا يوجد اجتماع (${events.length} أحداث)`}
              </span>
              <span>مزامنة {format(toZonedTime(lastSync, tz), 'hh:mm')}</span>
              {!isFullscreen && (
                <button
                  onClick={async () => {
                    try { await document.documentElement.requestFullscreen() } catch { /* denied */ }
                  }}
                  className="text-white/40 hover:text-white/70 transition-colors"
                  title="شاشة كاملة"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBooking && (
        <BookingModal
          roomId={room.id}
          roomName={room.name}
          onClose={() => setShowBooking(false)}
          onBooked={fetchEvents}
        />
      )}
    </div>
  )
}
