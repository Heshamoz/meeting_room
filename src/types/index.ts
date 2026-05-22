export interface Room {
  id: string
  name: string
  calendarId: string
  pin: string // bcrypt hashed
  color: string
  capacity: number
  floor?: string
  amenities: string[]
  createdAt: string
  updatedAt: string
}

export interface RoomPublic {
  id: string
  name: string
  color: string
  capacity: number
  floor?: string
  amenities: string[]
}

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  organizer?: string
  organizerEmail?: string
  attendees: { email: string; name?: string; responseStatus?: string }[]
  startTime: string
  endTime: string
  isAllDay: boolean
  status: 'confirmed' | 'tentative' | 'cancelled'
  htmlLink?: string
}

export interface BookingRequest {
  title: string
  description?: string
  organizerEmail: string
  organizerName?: string
  attendeeEmails?: string[]
  startTime: string
  endTime: string
}

export type RoomStatus = 'available' | 'occupied' | 'ending-soon'
