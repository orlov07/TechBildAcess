-- ============================================================================
-- TechBildAcess — Row Level Security (RLS)
-- Rode DEPOIS de 0001_init.sql.
-- ============================================================================

alter table public.profiles       enable row level security;
alter table public.events         enable row level security;
alter table public.ticket_batches enable row level security;
alter table public.coupons        enable row level security;
alter table public.orders         enable row level security;
alter table public.tickets        enable row level security;
alter table public.guest_list     enable row level security;
alter table public.staff          enable row level security;
alter table public.checkin_logs   enable row level security;
alter table public.settings       enable row level security;

-- Limpa políticas antigas (re-execução segura)
do $$
declare r record;
begin
  for r in select schemaname, tablename, policyname from pg_policies where schemaname = 'public'
  loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- profiles: cada um lê/edita o seu; admin vê tudo
-- ---------------------------------------------------------------------------
create policy profiles_select on public.profiles for select
  using (auth_user_id = auth.uid() or public.is_admin());
create policy profiles_insert on public.profiles for insert
  with check (auth_user_id = auth.uid());
create policy profiles_update on public.profiles for update
  using (auth_user_id = auth.uid() or public.is_admin())
  with check (auth_user_id = auth.uid() or public.is_admin());
create policy profiles_delete on public.profiles for delete
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- events: publicados são públicos; admin gerencia tudo
-- ---------------------------------------------------------------------------
create policy events_select on public.events for select
  using (status = 'published' or public.is_admin());
create policy events_admin_all on public.events for all
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- ticket_batches: lotes ativos de eventos publicados são públicos
-- ---------------------------------------------------------------------------
create policy batches_select on public.ticket_batches for select
  using (
    public.is_admin() or exists (
      select 1 from public.events e
      where e.id = event_id and e.status = 'published'
    )
  );
create policy batches_admin_all on public.ticket_batches for all
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- coupons: apenas admin (validação de cupom é via RPC SECURITY DEFINER)
-- ---------------------------------------------------------------------------
create policy coupons_admin_all on public.coupons for all
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- orders: cliente vê os seus; admin vê todos. Criação via RPC (definer).
-- ---------------------------------------------------------------------------
create policy orders_select on public.orders for select
  using (user_id = public.current_profile_id() or public.is_admin());
create policy orders_admin_write on public.orders for all
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- tickets: cliente vê os seus; fiscal/admin podem ler p/ validar
-- ---------------------------------------------------------------------------
create policy tickets_select on public.tickets for select
  using (
    user_id = public.current_profile_id()
    or public.is_admin()
    or public.can_validate_event(event_id)
  );
create policy tickets_admin_write on public.tickets for all
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- guest_list: admin gerencia; fiscal do evento pode ler
-- ---------------------------------------------------------------------------
create policy guests_select on public.guest_list for select
  using (public.is_admin() or public.can_validate_event(event_id));
create policy guests_admin_write on public.guest_list for all
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- staff: admin gerencia; fiscal vê o próprio registro
-- ---------------------------------------------------------------------------
create policy staff_select on public.staff for select
  using (public.is_admin() or lower(email) = public.current_email());
create policy staff_admin_write on public.staff for all
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- checkin_logs: admin e fiscal do evento leem; escrita via RPC (definer)
-- ---------------------------------------------------------------------------
create policy checkin_select on public.checkin_logs for select
  using (public.is_admin() or public.can_validate_event(event_id));
create policy checkin_admin_write on public.checkin_logs for all
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- settings: leitura pública (branding); escrita só admin
-- ---------------------------------------------------------------------------
create policy settings_select on public.settings for select using (true);
create policy settings_admin_write on public.settings for all
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Permissões de execução das RPCs
-- ---------------------------------------------------------------------------
grant execute on function public.create_order(uuid, jsonb, text, jsonb)  to authenticated;
grant execute on function public.check_in_ticket(text, uuid)             to authenticated;
grant execute on function public.validate_coupon(text, uuid)             to authenticated, anon;
grant execute on function public.is_admin()                              to authenticated, anon;
grant execute on function public.current_profile_id()                    to authenticated;
grant execute on function public.can_validate_event(uuid)                to authenticated;
