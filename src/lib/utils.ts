import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, isWithinInterval, parseISO, differenceInMinutes } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import type { CalendarEvent, RoomStatus } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getTimezone(): string {
  return process.env.NEXT_PUBLIC_TIMEZONE || 'Asia/Riyadh'
}

export function getNow(): Date {
  return toZonedTime(new Date(), getTimezone())
}

export function formatTime(dateStr: string): string {
  const tz = getTimezone()
  const d = toZonedTime(parseISO(dateStr), tz)
  return format(d, 'hh:mm a')
}

export function formatDate(dateStr: string): string {
  const tz = getTimezone()
  const d = toZonedTime(parseISO(dateStr), tz)
  return format(d, 'EEEE، d MMMM yyyy')
}

export function formatDateTime(dateStr: string): string {
  return `${formatDate(dateStr)} - ${formatTime(dateStr)}`
}

export function getRoomStatus(events: CalendarEvent[]): RoomStatus {
  const now = getNow()
  const current = getCurrentEvent(events)

  if (!current) return 'available'

  const endTime = toZonedTime(parseISO(current.endTime), getTimezone())
  const minutesLeft = differenceInMinutes(endTime, now)

  if (minutesLeft <= 15) return 'ending-soon'
  return 'occupied'
}

export function getCurrentEvent(events: CalendarEvent[]): CalendarEvent | null {
  const now = getNow()
  return (
    events.find((e) => {
      if (e.status === 'cancelled') return false
      const start = toZonedTime(parseISO(e.startTime), getTimezone())
      const end = toZonedTime(parseISO(e.endTime), getTimezone())
      return isWithinInterval(now, { start, end })
    }) || null
  )
}

export function getUpcomingEvents(events: CalendarEvent[]): CalendarEvent[] {
  const now = getNow()
  return events
    .filter((e) => {
      if (e.status === 'cancelled') return false
      const start = toZonedTime(parseISO(e.startTime), getTimezone())
      return start > now
    })
    .slice(0, 5)
}

export function getMinutesUntilEnd(event: CalendarEvent): number {
  const now = getNow()
  const end = toZonedTime(parseISO(event.endTime), getTimezone())
  return Math.max(0, differenceInMinutes(end, now))
}

export function getMinutesUntilStart(event: CalendarEvent): number {
  const now = getNow()
  const start = toZonedTime(parseISO(event.startTime), getTimezone())
  return Math.max(0, differenceInMinutes(start, now))
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

export const ROOM_COLORS = [
  { value: 'blue', label: 'أزرق', bg: 'bg-blue-500', text: 'text-blue-500', border: 'border-blue-500' },
  { value: 'green', label: 'أخضر', bg: 'bg-green-500', text: 'text-green-500', border: 'border-green-500' },
  { value: 'purple', label: 'بنفسجي', bg: 'bg-purple-500', text: 'text-purple-500', border: 'border-purple-500' },
  { value: 'orange', label: 'برتقالي', bg: 'bg-orange-500', text: 'text-orange-500', border: 'border-orange-500' },
  { value: 'pink', label: 'وردي', bg: 'bg-pink-500', text: 'text-pink-500', border: 'border-pink-500' },
  { value: 'teal', label: 'تيل', bg: 'bg-teal-500', text: 'text-teal-500', border: 'border-teal-500' },
  { value: 'red', label: 'أحمر', bg: 'bg-red-500', text: 'text-red-500', border: 'border-red-500' },
  { value: 'yellow', label: 'أصفر', bg: 'bg-yellow-500', text: 'text-yellow-500', border: 'border-yellow-500' },
]

export function getColorClasses(color: string) {
  return ROOM_COLORS.find((c) => c.value === color) || ROOM_COLORS[0]
}
