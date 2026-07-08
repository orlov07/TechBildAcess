import { createContext, useContext, useState, type ReactNode } from 'react'

interface CartState {
  eventId: string | null
  items: Record<string, number> // batchId -> quantity
  setEvent: (eventId: string) => void
  setQty: (batchId: string, qty: number) => void
  clear: () => void
  totalItems: number
}

const CartCtx = createContext<CartState | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [eventId, setEventId] = useState<string | null>(null)
  const [items, setItems] = useState<Record<string, number>>({})

  function setEvent(id: string) {
    if (id !== eventId) {
      setEventId(id)
      setItems({})
    }
  }
  function setQty(batchId: string, qty: number) {
    setItems((prev) => {
      const next = { ...prev }
      if (qty <= 0) delete next[batchId]
      else next[batchId] = qty
      return next
    })
  }
  function clear() {
    setItems({})
    setEventId(null)
  }

  const totalItems = Object.values(items).reduce((a, b) => a + b, 0)

  return (
    <CartCtx.Provider value={{ eventId, items, setEvent, setQty, clear, totalItems }}>
      {children}
    </CartCtx.Provider>
  )
}

export function useCart(): CartState {
  const ctx = useContext(CartCtx)
  if (!ctx) throw new Error('useCart deve estar dentro de CartProvider')
  return ctx
}
