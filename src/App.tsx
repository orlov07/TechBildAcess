import { Routes, Route, Navigate } from 'react-router-dom'
import { CartProvider } from '@/context/CartContext'
import { PublicLayout } from '@/components/layouts/PublicLayout'
import { AdminLayout } from '@/components/layouts/AdminLayout'
import { FiscalLayout } from '@/components/layouts/FiscalLayout'
import { RequireAuth, RequireAdmin, RequireFiscal } from '@/components/guards'

// Público
import Landing from '@/pages/public/Landing'
import Events from '@/pages/public/Events'
import EventDetail from '@/pages/public/EventDetail'
import Login from '@/pages/public/Login'

// Cliente
import ClientEvents from '@/pages/client/ClientEvents'
import Checkout from '@/pages/client/Checkout'
import OrderConfirmation from '@/pages/client/OrderConfirmation'
import MyTickets from '@/pages/client/MyTickets'
import TicketDetail from '@/pages/client/TicketDetail'
import History from '@/pages/client/History'
import Profile from '@/pages/client/Profile'

// Admin
import Dashboard from '@/pages/admin/Dashboard'
import AdminEvents from '@/pages/admin/AdminEvents'
import EventForm from '@/pages/admin/EventForm'
import AdminBatches from '@/pages/admin/AdminBatches'
import AdminTickets from '@/pages/admin/AdminTickets'
import AdminClients from '@/pages/admin/AdminClients'
import AdminCoupons from '@/pages/admin/AdminCoupons'
import AdminGuests from '@/pages/admin/AdminGuests'
import AdminFiscals from '@/pages/admin/AdminFiscals'
import AdminFinance from '@/pages/admin/AdminFinance'
import AdminReports from '@/pages/admin/AdminReports'
import AdminSettings from '@/pages/admin/AdminSettings'

// Fiscal
import FiscalHome from '@/pages/fiscal/FiscalHome'
import Checkin from '@/pages/fiscal/Checkin'
import FiscalHistory from '@/pages/fiscal/FiscalHistory'

import NotFound from '@/pages/NotFound'

export default function App() {
  return (
    <CartProvider>
      <Routes>
        {/* Público + Cliente compartilham layout */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/eventos" element={<Events />} />
          <Route path="/evento/:id" element={<EventDetail />} />

          <Route path="/app" element={<RequireAuth><ClientEvents /></RequireAuth>} />
          <Route path="/app/checkout/:eventId" element={<RequireAuth><Checkout /></RequireAuth>} />
          <Route path="/app/pedido/:orderId" element={<RequireAuth><OrderConfirmation /></RequireAuth>} />
          <Route path="/app/meus-ingressos" element={<RequireAuth><MyTickets /></RequireAuth>} />
          <Route path="/app/ingresso/:id" element={<RequireAuth><TicketDetail /></RequireAuth>} />
          <Route path="/app/historico" element={<RequireAuth><History /></RequireAuth>} />
          <Route path="/app/perfil" element={<RequireAuth><Profile /></RequireAuth>} />
        </Route>

        <Route path="/login" element={<Login />} />

        {/* Admin */}
        <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
          <Route index element={<Dashboard />} />
          <Route path="eventos" element={<AdminEvents />} />
          <Route path="eventos/novo" element={<EventForm />} />
          <Route path="eventos/:id" element={<EventForm />} />
          <Route path="lotes" element={<AdminBatches />} />
          <Route path="ingressos" element={<AdminTickets />} />
          <Route path="clientes" element={<AdminClients />} />
          <Route path="cupons" element={<AdminCoupons />} />
          <Route path="convidados" element={<AdminGuests />} />
          <Route path="fiscais" element={<AdminFiscals />} />
          <Route path="financeiro" element={<AdminFinance />} />
          <Route path="relatorios" element={<AdminReports />} />
          <Route path="configuracoes" element={<AdminSettings />} />
        </Route>

        {/* Fiscal */}
        <Route path="/fiscal" element={<RequireFiscal><FiscalLayout /></RequireFiscal>}>
          <Route index element={<FiscalHome />} />
          <Route path="checkin" element={<Checkin />} />
          <Route path="historico" element={<FiscalHistory />} />
        </Route>

        <Route path="*" element={<NotFound />} />
        <Route path="/index.html" element={<Navigate to="/" replace />} />
      </Routes>
    </CartProvider>
  )
}
