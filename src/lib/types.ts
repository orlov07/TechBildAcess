export type Role = 'client' | 'admin' | 'fiscal'

export type EventStatus = 'draft' | 'published' | 'finished' | 'cancelled'
export type EventCategory =
  | 'show'
  | 'festa'
  | 'teatro'
  | 'esporte'
  | 'palestra'
  | 'festival'
  | 'outro'
export type TicketType = 'pista' | 'vip' | 'camarote' | 'mesa' | 'area_especial'
export type TicketStatus = 'active' | 'used' | 'cancelled' | 'expired'
export type OrderStatus = 'pending' | 'confirmed' | 'cancelled' | 'refunded'

export interface Profile {
  id: string
  auth_user_id: string
  name: string | null
  email: string | null
  phone: string | null
  cpf: string | null
  role: Role
  created_at: string
}

export interface EventRow {
  id: string
  title: string
  description: string | null
  banner_url: string | null
  category: EventCategory
  date: string | null
  time: string | null
  location_name: string | null
  address: string | null
  city: string | null
  max_capacity: number | null
  status: EventStatus
  created_at: string
}

export interface Batch {
  id: string
  event_id: string
  name: string
  ticket_type: TicketType
  price: number
  quantity_total: number
  quantity_sold: number
  limit_per_user: number
  starts_at: string | null
  ends_at: string | null
  is_active: boolean
  created_at: string
}

export interface Coupon {
  id: string
  code: string
  discount_type: 'percent' | 'fixed'
  discount_value: number
  event_id: string | null
  max_uses: number
  used_count: number
  expires_at: string | null
  is_active: boolean
  created_at: string
}

export interface Order {
  id: string
  user_id: string
  event_id: string
  total_amount: number
  discount_amount: number
  final_amount: number
  status: OrderStatus
  payment_method: string | null
  payment_status: string
  coupon_id: string | null
  buyer_name: string | null
  buyer_email: string | null
  buyer_phone: string | null
  buyer_cpf: string | null
  created_at: string
}

export interface Ticket {
  id: string
  order_id: string | null
  event_id: string
  batch_id: string | null
  user_id: string | null
  qr_code: string
  unique_code: string
  ticket_type: TicketType
  holder_name: string | null
  status: TicketStatus
  checked_in_at: string | null
  checked_by: string | null
  created_at: string
}

export interface Guest {
  id: string
  event_id: string
  name: string
  email: string | null
  phone: string | null
  ticket_type: TicketType
  qr_code: string
  unique_code: string
  status: 'active' | 'used' | 'cancelled'
  checked_in_at: string | null
  created_at: string
}

export interface Staff {
  id: string
  name: string
  email: string
  event_id: string | null
  is_active: boolean
  created_at: string
}

export interface CheckinLog {
  id: string
  ticket_id: string | null
  event_id: string | null
  checked_by: string | null
  status: string
  message: string | null
  created_at: string
}

export const TICKET_TYPE_LABEL: Record<TicketType, string> = {
  pista: 'Pista',
  vip: 'VIP',
  camarote: 'Camarote',
  mesa: 'Mesa',
  area_especial: 'Área especial',
}

export const CATEGORY_LABEL: Record<EventCategory, string> = {
  show: 'Show',
  festa: 'Festa',
  teatro: 'Teatro',
  esporte: 'Esporte',
  palestra: 'Palestra',
  festival: 'Festival',
  outro: 'Outro',
}

export const EVENT_STATUS_LABEL: Record<EventStatus, string> = {
  draft: 'Rascunho',
  published: 'Publicado',
  finished: 'Encerrado',
  cancelled: 'Cancelado',
}

export const TICKET_STATUS_LABEL: Record<TicketStatus, string> = {
  active: 'Ativo',
  used: 'Usado',
  cancelled: 'Cancelado',
  expired: 'Expirado',
}
