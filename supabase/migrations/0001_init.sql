-- ============================================================================
-- TechBildAcess — Migration inicial (schema + funções + triggers + RLS + RPCs)
-- Rode este arquivo inteiro no Supabase SQL Editor de um projeto novo.
-- É idempotente na medida do possível (DROP/CREATE OR REPLACE onde faz sentido).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Extensões
-- ----------------------------------------------------------------------------
create extension if not exists "pgcrypto";        -- gen_random_uuid()

-- ----------------------------------------------------------------------------
-- ENUM-like: usamos TEXT + CHECK para flexibilidade
-- ----------------------------------------------------------------------------

-- ============================================================================
-- TABELAS
-- ============================================================================

-- profiles: espelho de auth.users com dados do cliente / papel
create table if not exists public.profiles (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  uuid unique references auth.users(id) on delete cascade,
  name          text,
  email         text unique,
  phone         text,
  cpf           text,
  role          text not null default 'client' check (role in ('client','admin','fiscal')),
  created_at    timestamptz not null default now()
);

-- events: eventos do estabelecimento
create table if not exists public.events (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text,
  banner_url    text,
  category      text not null default 'outro'
                  check (category in ('show','festa','teatro','esporte','palestra','festival','outro')),
  date          date,
  "time"        time,
  location_name text,
  address       text,
  city          text,
  max_capacity  integer default 0,
  status        text not null default 'draft'
                  check (status in ('draft','published','finished','cancelled')),
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);

-- ticket_batches: lotes por evento
create table if not exists public.ticket_batches (
  id             uuid primary key default gen_random_uuid(),
  event_id       uuid not null references public.events(id) on delete cascade,
  name           text not null,
  ticket_type    text not null default 'pista'
                   check (ticket_type in ('pista','vip','camarote','mesa','area_especial')),
  price          numeric(10,2) not null default 0 check (price >= 0),
  quantity_total integer not null default 0 check (quantity_total >= 0),
  quantity_sold  integer not null default 0 check (quantity_sold >= 0),
  limit_per_user integer not null default 0,   -- 0 = sem limite
  starts_at      timestamptz,
  ends_at        timestamptz,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);

-- coupons: cupons de desconto
create table if not exists public.coupons (
  id             uuid primary key default gen_random_uuid(),
  code           text not null unique,
  discount_type  text not null default 'percent' check (discount_type in ('percent','fixed')),
  discount_value numeric(10,2) not null default 0 check (discount_value >= 0),
  event_id       uuid references public.events(id) on delete cascade,  -- null = todos os eventos
  max_uses       integer not null default 0,   -- 0 = ilimitado
  used_count     integer not null default 0,
  expires_at     timestamptz,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);

-- orders: pedidos de compra
create table if not exists public.orders (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  event_id        uuid not null references public.events(id) on delete cascade,
  total_amount    numeric(10,2) not null default 0,
  discount_amount numeric(10,2) not null default 0,
  final_amount    numeric(10,2) not null default 0,
  status          text not null default 'confirmed'
                    check (status in ('pending','confirmed','cancelled','refunded')),
  payment_method  text default 'none',
  payment_status  text not null default 'pending'
                    check (payment_status in ('pending','paid','failed','refunded','free')),
  coupon_id       uuid references public.coupons(id) on delete set null,
  buyer_name      text,
  buyer_email     text,
  buyer_phone     text,
  buyer_cpf       text,
  created_at      timestamptz not null default now()
);

-- tickets: ingressos individuais (1 QR = 1 ingresso)
create table if not exists public.tickets (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid references public.orders(id) on delete cascade,
  event_id      uuid not null references public.events(id) on delete cascade,
  batch_id      uuid references public.ticket_batches(id) on delete set null,
  user_id       uuid references public.profiles(id) on delete set null,
  qr_code       text not null unique,   -- token que o QR Code carrega
  unique_code   text not null unique,   -- código curto legível
  ticket_type   text not null default 'pista',
  holder_name   text,
  status        text not null default 'active'
                  check (status in ('active','used','cancelled','expired')),
  checked_in_at timestamptz,
  checked_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);

-- guest_list: convidados (ingressos gratuitos manuais)
create table if not exists public.guest_list (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references public.events(id) on delete cascade,
  name         text not null,
  email        text,
  phone        text,
  ticket_type  text not null default 'pista',
  qr_code      text not null unique,
  unique_code  text not null unique,
  status       text not null default 'active' check (status in ('active','used','cancelled')),
  checked_in_at timestamptz,
  created_at   timestamptz not null default now()
);

-- staff: fiscais/validadores
create table if not exists public.staff (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  event_id    uuid references public.events(id) on delete cascade,  -- null = todos os eventos
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists staff_email_idx on public.staff (lower(email));

-- checkin_logs: log de todas as validações
create table if not exists public.checkin_logs (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid references public.tickets(id) on delete set null,
  event_id    uuid references public.events(id) on delete cascade,
  checked_by  uuid references public.profiles(id) on delete set null,
  status      text not null,       -- valid / already_used / cancelled / invalid / wrong_event / expired
  message     text,
  created_at  timestamptz not null default now()
);

-- settings: configurações da plataforma (chave/valor)
create table if not exists public.settings (
  id         uuid primary key default gen_random_uuid(),
  key        text not null unique,
  value      text,
  created_at timestamptz not null default now()
);

-- Índices úteis
create index if not exists events_status_idx        on public.events (status);
create index if not exists batches_event_idx        on public.ticket_batches (event_id);
create index if not exists orders_user_idx          on public.orders (user_id);
create index if not exists orders_event_idx         on public.orders (event_id);
create index if not exists tickets_user_idx         on public.tickets (user_id);
create index if not exists tickets_event_idx        on public.tickets (event_id);
create index if not exists tickets_status_idx       on public.tickets (status);
create index if not exists tickets_qr_idx           on public.tickets (qr_code);
create index if not exists checkin_event_idx        on public.checkin_logs (event_id);

-- ============================================================================
-- FUNÇÕES AUXILIARES
-- ============================================================================

-- E-mail do usuário logado (via JWT)
create or replace function public.current_email()
returns text language sql stable as $$
  select nullif(lower(coalesce(auth.jwt() ->> 'email', '')), '')
$$;

-- É admin? Reconhecido por e-mail autorizado.
create or replace function public.is_admin()
returns boolean language sql stable as $$
  select coalesce(
    public.current_email() in (
      'igoraguiarviana@gmail.com',
      'techbilld@gmail.com',
      'igor.vianaaidev@gmail.com'
    ), false)
$$;

-- id do profile do usuário logado
create or replace function public.current_profile_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.profiles where auth_user_id = auth.uid() limit 1
$$;

-- É fiscal para um evento específico? (staff ativo, evento vinculado ou global)
create or replace function public.is_fiscal_for(p_event_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.staff s
    where s.is_active
      and lower(s.email) = public.current_email()
      and (s.event_id is null or s.event_id = p_event_id)
  )
$$;

-- Pode validar (check-in) o evento? Admin OU fiscal autorizado.
create or replace function public.can_validate_event(p_event_id uuid)
returns boolean language sql stable as $$
  select public.is_admin() or public.is_fiscal_for(p_event_id)
$$;

-- Gera um código curto legível (ex.: TBA-7F3K9Q2A)
create or replace function public.gen_unique_code()
returns text language sql volatile as $$
  select 'TBA-' || upper(substr(replace(gen_random_uuid()::text,'-',''), 1, 8))
$$;

-- ============================================================================
-- TRIGGER: cria profile automaticamente ao registrar usuário no Auth
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_role text := 'client';
begin
  if lower(new.email) in ('igoraguiarviana@gmail.com','techbilld@gmail.com','igor.vianaaidev@gmail.com') then
    v_role := 'admin';
  elsif exists (select 1 from public.staff s where lower(s.email) = lower(new.email) and s.is_active) then
    v_role := 'fiscal';
  end if;

  insert into public.profiles (auth_user_id, email, name, role)
  values (
    new.id,
    lower(new.email),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email,'@',1)),
    v_role
  )
  on conflict (auth_user_id) do update
    set email = excluded.email,
        name  = coalesce(public.profiles.name, excluded.name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- RPC: validar cupom (SECURITY DEFINER — não expõe a tabela de cupons)
-- ============================================================================
create or replace function public.validate_coupon(p_code text, p_event_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare c public.coupons;
begin
  select * into c from public.coupons
  where lower(code) = lower(p_code) and is_active limit 1;

  if not found then
    return jsonb_build_object('valid', false, 'message', 'Cupom inválido');
  end if;
  if c.expires_at is not null and c.expires_at < now() then
    return jsonb_build_object('valid', false, 'message', 'Cupom expirado');
  end if;
  if c.max_uses > 0 and c.used_count >= c.max_uses then
    return jsonb_build_object('valid', false, 'message', 'Cupom esgotado');
  end if;
  if c.event_id is not null and c.event_id <> p_event_id then
    return jsonb_build_object('valid', false, 'message', 'Cupom não válido para este evento');
  end if;

  return jsonb_build_object(
    'valid', true,
    'coupon_id', c.id,
    'discount_type', c.discount_type,
    'discount_value', c.discount_value,
    'message', 'Cupom aplicado'
  );
end;
$$;

-- ============================================================================
-- RPC: criar pedido + gerar ingressos (preço e regras validados no servidor)
-- p_items: jsonb array de { "batch_id": uuid, "quantity": int }
-- ============================================================================
create or replace function public.create_order(
  p_event_id uuid,
  p_items jsonb,
  p_coupon_code text default null,
  p_buyer jsonb default '{}'::jsonb
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_profile uuid := public.current_profile_id();
  v_event public.events;
  v_item jsonb;
  v_batch public.ticket_batches;
  v_qty int;
  v_total numeric(10,2) := 0;
  v_discount numeric(10,2) := 0;
  v_final numeric(10,2) := 0;
  v_coupon_id uuid;
  v_coupon_res jsonb;
  v_order_id uuid;
  v_already int;
  i int;
begin
  if v_profile is null then
    raise exception 'Usuário não autenticado';
  end if;

  select * into v_event from public.events where id = p_event_id;
  if not found then raise exception 'Evento não encontrado'; end if;
  if v_event.status <> 'published' then raise exception 'Evento não está disponível para venda'; end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Nenhum item selecionado';
  end if;

  -- Valida cada item e soma total (com lock nas linhas de lote)
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := coalesce((v_item ->> 'quantity')::int, 0);
    if v_qty <= 0 then continue; end if;

    select * into v_batch from public.ticket_batches
      where id = (v_item ->> 'batch_id')::uuid and event_id = p_event_id
      for update;
    if not found then raise exception 'Lote inválido para este evento'; end if;
    if not v_batch.is_active then raise exception 'Lote "%" está inativo', v_batch.name; end if;
    if v_batch.starts_at is not null and v_batch.starts_at > now() then
      raise exception 'Lote "%" ainda não começou', v_batch.name; end if;
    if v_batch.ends_at is not null and v_batch.ends_at < now() then
      raise exception 'Lote "%" já encerrou', v_batch.name; end if;
    if v_batch.quantity_sold + v_qty > v_batch.quantity_total then
      raise exception 'Lote "%" sem quantidade suficiente', v_batch.name; end if;

    if v_batch.limit_per_user > 0 then
      select count(*) into v_already from public.tickets
        where batch_id = v_batch.id and user_id = v_profile and status <> 'cancelled';
      if v_already + v_qty > v_batch.limit_per_user then
        raise exception 'Limite por comprador excedido no lote "%"', v_batch.name; end if;
    end if;

    v_total := v_total + (v_batch.price * v_qty);
  end loop;

  if v_total = 0 and not exists (
      select 1 from jsonb_array_elements(p_items) e where coalesce((e->>'quantity')::int,0) > 0) then
    raise exception 'Nenhum item selecionado';
  end if;

  -- Cupom
  if p_coupon_code is not null and length(trim(p_coupon_code)) > 0 then
    v_coupon_res := public.validate_coupon(p_coupon_code, p_event_id);
    if (v_coupon_res ->> 'valid')::boolean then
      v_coupon_id := (v_coupon_res ->> 'coupon_id')::uuid;
      if (v_coupon_res ->> 'discount_type') = 'percent' then
        v_discount := round(v_total * (v_coupon_res ->> 'discount_value')::numeric / 100, 2);
      else
        v_discount := (v_coupon_res ->> 'discount_value')::numeric;
      end if;
    end if;
  end if;

  if v_discount > v_total then v_discount := v_total; end if;
  v_final := v_total - v_discount;

  -- Cria pedido
  insert into public.orders (
    user_id, event_id, total_amount, discount_amount, final_amount,
    status, payment_method, payment_status, coupon_id,
    buyer_name, buyer_email, buyer_phone, buyer_cpf
  ) values (
    v_profile, p_event_id, v_total, v_discount, v_final,
    'confirmed', 'none', case when v_final = 0 then 'free' else 'pending' end, v_coupon_id,
    p_buyer ->> 'name', p_buyer ->> 'email', p_buyer ->> 'phone', p_buyer ->> 'cpf'
  ) returning id into v_order_id;

  -- Gera ingressos e decrementa estoque
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := coalesce((v_item ->> 'quantity')::int, 0);
    if v_qty <= 0 then continue; end if;
    select * into v_batch from public.ticket_batches where id = (v_item ->> 'batch_id')::uuid;

    for i in 1..v_qty loop
      insert into public.tickets (
        order_id, event_id, batch_id, user_id, qr_code, unique_code,
        ticket_type, holder_name, status
      ) values (
        v_order_id, p_event_id, v_batch.id, v_profile,
        replace(gen_random_uuid()::text,'-',''), public.gen_unique_code(),
        v_batch.ticket_type, p_buyer ->> 'name', 'active'
      );
    end loop;

    update public.ticket_batches
      set quantity_sold = quantity_sold + v_qty,
          is_active = case when quantity_sold + v_qty >= quantity_total then false else is_active end
      where id = v_batch.id;
  end loop;

  -- Consome cupom
  if v_coupon_id is not null then
    update public.coupons set used_count = used_count + 1 where id = v_coupon_id;
  end if;

  return jsonb_build_object('order_id', v_order_id, 'final_amount', v_final);
end;
$$;

-- ============================================================================
-- RPC: check-in / validação de ingresso
-- ============================================================================
create or replace function public.check_in_ticket(p_qr text, p_event_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_ticket public.tickets;
  v_batch public.ticket_batches;
  v_buyer text;
  v_result text;
  v_message text;
  v_checker uuid := public.current_profile_id();
begin
  if not public.can_validate_event(p_event_id) then
    return jsonb_build_object('status','unauthorized','message','Você não tem permissão para validar este evento');
  end if;

  select * into v_ticket from public.tickets where qr_code = p_qr;

  if not found then
    insert into public.checkin_logs(ticket_id,event_id,checked_by,status,message)
      values (null, p_event_id, v_checker, 'invalid', 'QR não encontrado');
    return jsonb_build_object('status','invalid','message','Ingresso inválido');
  end if;

  select * into v_batch from public.ticket_batches where id = v_ticket.batch_id;
  select name into v_buyer from public.profiles where id = v_ticket.user_id;
  v_buyer := coalesce(v_ticket.holder_name, v_buyer, '—');

  if v_ticket.event_id <> p_event_id then
    v_result := 'wrong_event'; v_message := 'Ingresso de outro evento';
  elsif v_ticket.status = 'cancelled' then
    v_result := 'cancelled'; v_message := 'Ingresso cancelado';
  elsif v_ticket.status = 'expired' then
    v_result := 'expired'; v_message := 'Ingresso expirado';
  elsif v_ticket.status = 'used' then
    v_result := 'already_used'; v_message := 'Ingresso já utilizado';
  else
    update public.tickets
      set status = 'used', checked_in_at = now(), checked_by = v_checker
      where id = v_ticket.id;
    v_result := 'valid'; v_message := 'Ingresso válido';
  end if;

  insert into public.checkin_logs(ticket_id,event_id,checked_by,status,message)
    values (v_ticket.id, p_event_id, v_checker, v_result, v_message);

  return jsonb_build_object(
    'status', v_result,
    'message', v_message,
    'ticket', jsonb_build_object(
      'unique_code', v_ticket.unique_code,
      'ticket_type', v_ticket.ticket_type,
      'buyer', v_buyer,
      'batch', coalesce(v_batch.name,'—'),
      'purchased_at', v_ticket.created_at,
      'checked_in_at', case when v_result='valid' then now() else v_ticket.checked_in_at end
    )
  );
end;
$$;

-- ============================================================================
-- SEED: configurações padrão da plataforma
-- ============================================================================
insert into public.settings (key, value) values
  ('platform_name', 'TechBildAcess'),
  ('primary_color', '#7c5cfc'),
  ('logo_url', ''),
  ('establishment_name', ''),
  ('cancellation_policy', 'Cancelamentos podem ser solicitados até 24h antes do evento.'),
  ('terms', 'Ao comprar, você concorda com os termos de uso da plataforma.')
on conflict (key) do nothing;

-- ============================================================================
-- RLS — políticas de segurança
-- Rode o arquivo 0002_rls.sql em seguida.
-- ============================================================================
