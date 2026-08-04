type Row = Record<string, any>

const KEY = 'techbildacess:database:v1'
const SESSION_KEY = 'techbildacess:session:v1'
const FILE_PREFIX = 'techbildacess:file:'
const tables = ['profiles', 'events', 'ticket_batches', 'coupons', 'orders', 'tickets', 'guest_list', 'staff', 'checkin_logs', 'settings']
const uid = () => crypto.randomUUID()
const now = () => new Date().toISOString()

function database(): Record<string, Row[]> {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    return Object.fromEntries(tables.map((name) => [name, Array.isArray(saved[name]) ? saved[name] : []]))
  } catch { return Object.fromEntries(tables.map((name) => [name, []])) }
}
function save(db: Record<string, Row[]>) { localStorage.setItem(KEY, JSON.stringify(db)) }
function session() { try { return JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null') } catch { return null } }
function localProfile() { const user = session()?.user; return user ? database().profiles.find((p) => p.auth_user_id === user.id) : undefined }
const error = (message: string) => ({ data: null, error: { message } })

class Query {
  private filters: Array<(r: Row) => boolean> = []
  private sort?: { key: string; ascending: boolean }
  private take?: number
  private single = false
  private action: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select'
  private payload: Row[] = []
  private countOnly = false
  constructor(private table: string) {}
  select(_columns = '*', options?: { count?: string; head?: boolean }) { this.action = 'select'; this.countOnly = Boolean(options?.head); return this }
  eq(key: string, value: any) { this.filters.push((r) => r[key] === value); return this }
  ilike(key: string, value: string) { const term = value.replace(/%/g, '').toLowerCase(); this.filters.push((r) => String(r[key] ?? '').toLowerCase().includes(term)); return this }
  in(key: string, values: any[]) { this.filters.push((r) => values.includes(r[key])); return this }
  order(key: string, options?: { ascending?: boolean }) { this.sort = { key, ascending: options?.ascending !== false }; return this }
  limit(value: number) { this.take = value; return this }
  maybeSingle() { this.single = true; return this }
  insert(value: Row | Row[]) { this.action = 'insert'; this.payload = Array.isArray(value) ? value : [value]; return this }
  update(value: Row) { this.action = 'update'; this.payload = [value]; return this }
  delete() { this.action = 'delete'; return this }
  upsert(value: Row | Row[], _options?: unknown) { this.action = 'upsert'; this.payload = Array.isArray(value) ? value : [value]; return this }
  then(resolve: (value: any) => any, reject?: (reason: any) => any) { return this.run().then(resolve, reject) }
  private rows(db: Record<string, Row[]>) { return (db[this.table] ?? []).filter((row) => this.filters.every((filter) => filter(row))) }
  private async run() {
    const db = database(); const matching = this.rows(db)
    if (this.action === 'insert') {
      const created = this.payload.map((item) => ({ id: uid(), created_at: now(), ...item }))
      db[this.table].push(...created); save(db); return { data: created, error: null }
    }
    if (this.action === 'update') { matching.forEach((row) => Object.assign(row, this.payload[0])); save(db); return { data: matching, error: null } }
    if (this.action === 'delete') { db[this.table] = db[this.table].filter((row) => !matching.includes(row)); save(db); return { data: matching, error: null } }
    if (this.action === 'upsert') {
      this.payload.forEach((item) => { const found = db[this.table].find((row) => row.id === item.id || (item.key && row.key === item.key)); if (found) Object.assign(found, item); else db[this.table].push({ id: uid(), created_at: now(), ...item }) })
      save(db); return { data: this.payload, error: null }
    }
    let result = [...matching]
    if (this.sort) result.sort((a, b) => (a[this.sort!.key] > b[this.sort!.key] ? 1 : a[this.sort!.key] < b[this.sort!.key] ? -1 : 0) * (this.sort!.ascending ? 1 : -1))
    if (this.take != null) result = result.slice(0, this.take)
    return { data: this.countOnly ? null : this.single ? result[0] ?? null : result, error: null, count: this.countOnly ? result.length : null }
  }
}

function rpc(name: string, args: any) {
  const db = database(); const profile = localProfile()
  if (name === 'validate_coupon') {
    const coupon = db.coupons.find((c) => c.is_active && c.code.toLowerCase() === args.p_code.toLowerCase())
    if (!coupon || (coupon.event_id && coupon.event_id !== args.p_event_id) || (coupon.expires_at && new Date(coupon.expires_at) < new Date()) || (coupon.max_uses > 0 && coupon.used_count >= coupon.max_uses)) return Promise.resolve({ data: { valid: false, message: 'Cupom inválido ou indisponível' }, error: null })
    return Promise.resolve({ data: { valid: true, coupon_id: coupon.id, discount_type: coupon.discount_type, discount_value: coupon.discount_value, message: 'Cupom aplicado' }, error: null })
  }
  if (name === 'create_order') {
    if (!profile) return Promise.resolve(error('Usuário não autenticado'))
    const event = db.events.find((e) => e.id === args.p_event_id)
    if (!event || event.status !== 'published') return Promise.resolve(error('Evento indisponível'))
    const batches = args.p_items.map((i: any) => ({ item: i, batch: db.ticket_batches.find((b) => b.id === i.batch_id && b.event_id === event.id) }))
    if (!batches.length || batches.some(({ item, batch }: any) => !batch || !batch.is_active || item.quantity <= 0 || batch.quantity_sold + item.quantity > batch.quantity_total)) return Promise.resolve(error('Lote inválido ou sem disponibilidade'))
    const total = batches.reduce((sum: number, { item, batch }: any) => sum + Number(batch.price) * item.quantity, 0)
    const coupon = args.p_coupon_code ? db.coupons.find((c) => c.code.toLowerCase() === args.p_coupon_code.toLowerCase() && c.is_active && (!c.event_id || c.event_id === event.id)) : undefined
    const discount = coupon ? Math.min(total, coupon.discount_type === 'percent' ? total * Number(coupon.discount_value) / 100 : Number(coupon.discount_value)) : 0
    const order = { id: uid(), created_at: now(), user_id: profile.id, event_id: event.id, total_amount: total, discount_amount: discount, final_amount: total - discount, status: 'confirmed', payment_method: 'none', payment_status: total - discount === 0 ? 'free' : 'pending', coupon_id: coupon?.id ?? null, buyer_name: args.p_buyer?.name ?? null, buyer_email: args.p_buyer?.email ?? null, buyer_phone: args.p_buyer?.phone ?? null, buyer_cpf: args.p_buyer?.cpf ?? null }
    db.orders.push(order)
    batches.forEach(({ item, batch }: any) => { batch.quantity_sold += item.quantity; if (batch.quantity_sold >= batch.quantity_total) batch.is_active = false; for (let i = 0; i < item.quantity; i++) db.tickets.push({ id: uid(), created_at: now(), order_id: order.id, event_id: event.id, batch_id: batch.id, user_id: profile.id, qr_code: uid().replaceAll('-', ''), unique_code: `TBA-${uid().replaceAll('-', '').slice(0, 8).toUpperCase()}`, ticket_type: batch.ticket_type, holder_name: order.buyer_name, status: 'active', checked_in_at: null, checked_by: null }) })
    if (coupon) coupon.used_count += 1; save(db); return Promise.resolve({ data: { order_id: order.id, final_amount: order.final_amount }, error: null })
  }
  if (name === 'check_in_ticket') {
    const ticket = db.tickets.find((t) => t.qr_code === args.p_qr); const status = !ticket ? 'invalid' : ticket.event_id !== args.p_event_id ? 'wrong_event' : ticket.status === 'used' ? 'already_used' : ticket.status !== 'active' ? ticket.status : 'valid'
    const message: Record<string, string> = { valid: 'Entrada liberada', invalid: 'Ingresso inválido', wrong_event: 'Ingresso de outro evento', already_used: 'Ingresso já utilizado', cancelled: 'Ingresso cancelado', expired: 'Ingresso expirado' }
    if (ticket && status === 'valid') { ticket.status = 'used'; ticket.checked_in_at = now(); ticket.checked_by = profile?.id ?? null }
    db.checkin_logs.push({ id: uid(), created_at: now(), ticket_id: ticket?.id ?? null, event_id: args.p_event_id, checked_by: profile?.id ?? null, status, message: message[status] }); save(db)
    const batch = ticket && db.ticket_batches.find((b) => b.id === ticket.batch_id); return Promise.resolve({ data: { status, message: message[status], ticket: ticket ? { unique_code: ticket.unique_code, ticket_type: ticket.ticket_type, buyer: ticket.holder_name ?? '—', batch: batch?.name ?? '—', purchased_at: ticket.created_at, checked_in_at: ticket.checked_in_at } : undefined }, error: null })
  }
  return Promise.resolve(error(`Operação local não encontrada: ${name}`))
}

const listeners = new Set<(event: string, value: any) => void>()
export const localClient = {
  from: (table: string) => new Query(table), rpc,
  auth: {
    getSession: async () => ({ data: { session: session() } }),
    onAuthStateChange: (callback: (event: string, value: any) => void) => { listeners.add(callback); return { data: { subscription: { unsubscribe: () => listeners.delete(callback) } } } },
    signInWithOAuth: async () => { const email = (import.meta.env.VITE_ADMIN_EMAILS ?? 'igoraguiarviana@gmail.com').split(',')[0].trim().toLowerCase(); const user = { id: uid(), email, user_metadata: { full_name: 'Administrador local' } }; const value = { user }; localStorage.setItem(SESSION_KEY, JSON.stringify(value)); const db = database(); if (!db.profiles.some((p) => p.auth_user_id === user.id)) db.profiles.push({ id: uid(), auth_user_id: user.id, email, name: user.user_metadata.full_name, phone: null, cpf: null, role: 'admin', created_at: now() }); save(db); listeners.forEach((callback) => callback('SIGNED_IN', value)); return { data: { provider: 'local' }, error: null } },
    signOut: async () => { localStorage.removeItem(SESSION_KEY); listeners.forEach((callback) => callback('SIGNED_OUT', null)); return { error: null } },
  },
  storage: { from: (_bucket: string) => ({
    upload: async (path: string, file: File) => {
      const content = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(reader.error); reader.readAsDataURL(file) })
      localStorage.setItem(`${FILE_PREFIX}${path}`, content); return { data: { path }, error: null }
    },
    getPublicUrl: (path: string) => ({ data: { publicUrl: localStorage.getItem(`${FILE_PREFIX}${path}`) ?? path } }),
  }) },
}
