import { google } from 'googleapis'
import type { CalendarEvent, BookingRequest } from '@/types'

function getAuth(impersonateEmail?: string) {
  const privateKey = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n')

  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: privateKey,
    scopes: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ],
    subject: impersonateEmail || process.env.GOOGLE_ADMIN_EMAIL,
  })

  return auth
}

function getCalendar(impersonateEmail?: string) {
  const auth = getAuth(impersonateEmail)
  return google.calendar({ version: 'v3', auth })
}

export async function getRoomEvents(
  calendarId: string,
  daysAhead = 1
): Promise<CalendarEvent[]> {
  const calendar = getCalendar()

  const now = new Date()
  const timeMin = new Date(now)
  timeMin.setHours(0, 0, 0, 0)
  const timeMax = new Date(now)
  timeMax.setDate(timeMax.getDate() + daysAhead)
  timeMax.setHours(23, 59, 59, 999)

  try {
    const res = await calendar.events.list({
      calendarId,
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 50,
    })

    const items = res.data.items || []

    return items
      .filter((e) => e.status !== 'cancelled')
      .map((e) => ({
        id: e.id || '',
        title: e.summary || 'اجتماع بدون عنوان',
        description: e.description || undefined,
        organizer: e.organizer?.displayName || e.organizer?.email,
        organizerEmail: e.organizer?.email,
        attendees: (e.attendees || []).map((a) => ({
          email: a.email || '',
          name: a.displayName || undefined,
          responseStatus: a.responseStatus || undefined,
        })),
        startTime: e.start?.dateTime || e.start?.date || '',
        endTime: e.end?.dateTime || e.end?.date || '',
        isAllDay: !e.start?.dateTime,
        status: (e.status || 'confirmed') as CalendarEvent['status'],
        htmlLink: e.htmlLink || undefined,
      }))
  } catch (err) {
    console.error('Error fetching calendar events:', err)
    return []
  }
}

export async function createBooking(
  calendarId: string,
  booking: BookingRequest
): Promise<CalendarEvent> {
  const calendar = getCalendar()

  const attendees = [
    { email: booking.organizerEmail, displayName: booking.organizerName },
    ...(booking.attendeeEmails || []).map((email) => ({ email })),
    { email: calendarId }, // invite the room resource
  ]

  const res = await calendar.events.insert({
    calendarId,
    sendUpdates: 'all',
    requestBody: {
      summary: booking.title,
      description: booking.description,
      start: { dateTime: booking.startTime, timeZone: process.env.NEXT_PUBLIC_TIMEZONE || 'Asia/Riyadh' },
      end: { dateTime: booking.endTime, timeZone: process.env.NEXT_PUBLIC_TIMEZONE || 'Asia/Riyadh' },
      organizer: { email: booking.organizerEmail, displayName: booking.organizerName },
      attendees,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 30 },
          { method: 'popup', minutes: 10 },
        ],
      },
    },
  })

  const e = res.data
  return {
    id: e.id || '',
    title: e.summary || booking.title,
    description: e.description || undefined,
    organizer: e.organizer?.displayName || e.organizer?.email,
    organizerEmail: e.organizer?.email,
    attendees: (e.attendees || []).map((a) => ({
      email: a.email || '',
      name: a.displayName || undefined,
    })),
    startTime: e.start?.dateTime || '',
    endTime: e.end?.dateTime || '',
    isAllDay: false,
    status: 'confirmed',
    htmlLink: e.htmlLink || undefined,
  }
}

export async function cancelEvent(calendarId: string, eventId: string): Promise<void> {
  const calendar = getCalendar()
  await calendar.events.delete({
    calendarId,
    eventId,
    sendUpdates: 'all',
  })
}
