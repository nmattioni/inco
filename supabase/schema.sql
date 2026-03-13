-- ============================================================
-- INCO — Schema Supabase
-- Multi-tenancy com Row Level Security
-- Roles: owner | manager | financial | operational | viewer
-- ============================================================

-- Extensões
create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================
create type user_role as enum ('owner', 'manager', 'financial', 'operational', 'viewer');
create type obra_status as enum ('planning', 'active', 'paused', 'completed', 'cancelled');
create type etapa_status as enum ('pending', 'active', 'completed');
create type transaction_type as enum ('receivable', 'payable');
create type transaction_status as enum ('pending', 'paid', 'overdue', 'cancelled');
create type invite_status as enum ('pending', 'accepted', 'expired');

-- ============================================================
-- TENANTS (empresas)
-- ============================================================
create table tenants (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text unique not null,
  logo_url    text,
  plan        text not null default 'starter', -- starter | pro | enterprise
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- PROFILES (espelho de auth.users com tenant)
-- ============================================================
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  tenant_id   uuid not null references tenants(id) on delete cascade,
  full_name   text not null,
  email       text not null,
  role        user_role not null default 'operational',
  avatar_url  text,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index profiles_tenant_idx on profiles(tenant_id);

-- ============================================================
-- INVITES
-- ============================================================
create table invites (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  invited_by  uuid not null references profiles(id),
  email       text not null,
  role        user_role not null default 'operational',
  token       text unique not null default encode(gen_random_bytes(32), 'hex'),
  status      invite_status not null default 'pending',
  expires_at  timestamptz not null default (now() + interval '7 days'),
  created_at  timestamptz not null default now()
);
create index invites_tenant_idx on invites(tenant_id);
create index invites_token_idx  on invites(token);

-- ============================================================
-- OBRAS
-- ============================================================
create table obras (
  id              uuid primary key default uuid_generate_v4(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  name            text not null,
  address         text,
  city            text,
  state           text,
  area_m2         numeric(10,2),
  budget          numeric(14,2),
  status          obra_status not null default 'active',
  start_date      date,
  expected_end    date,
  actual_end      date,
  notes           text,
  cover_url       text,
  created_by      uuid references profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index obras_tenant_idx on obras(tenant_id);

-- ============================================================
-- ETAPAS DE OBRA
-- ============================================================
create table etapas (
  id              uuid primary key default uuid_generate_v4(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  obra_id         uuid not null references obras(id) on delete cascade,
  name            text not null,
  description     text,
  order_index     integer not null default 0,
  status          etapa_status not null default 'pending',
  progress_pct    integer not null default 0 check (progress_pct between 0 and 100),
  start_date      date,
  expected_end    date,
  actual_end      date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index etapas_obra_idx   on etapas(obra_id);
create index etapas_tenant_idx on etapas(tenant_id);

-- ============================================================
-- ATUALIZAÇÕES / DIÁRIO DE OBRA
-- ============================================================
create table obra_updates (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  obra_id     uuid not null references obras(id) on delete cascade,
  etapa_id    uuid references etapas(id),
  author_id   uuid not null references profiles(id),
  content     text not null,
  photos      text[] default '{}',   -- array de URLs (Supabase Storage)
  created_at  timestamptz not null default now()
);
create index updates_obra_idx   on obra_updates(obra_id);
create index updates_tenant_idx on obra_updates(tenant_id);

-- ============================================================
-- CONTATOS (clientes / fornecedores)
-- ============================================================
create table contacts (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  name        text not null,
  type        text not null default 'client', -- client | supplier | both
  email       text,
  phone       text,
  document    text,  -- CPF ou CNPJ
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index contacts_tenant_idx on contacts(tenant_id);

-- ============================================================
-- TRANSAÇÕES FINANCEIRAS
-- ============================================================
create table transactions (
  id              uuid primary key default uuid_generate_v4(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  obra_id         uuid references obras(id),      -- opcional: vinculada a uma obra
  contact_id      uuid references contacts(id),   -- cliente ou fornecedor
  type            transaction_type not null,
  status          transaction_status not null default 'pending',
  description     text not null,
  amount          numeric(14,2) not null check (amount > 0),
  due_date        date not null,
  paid_date       date,
  category        text,                            -- ex: mao_de_obra, material, servico, cliente
  notes           text,
  attachment_url  text,
  created_by      uuid references profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index transactions_tenant_idx on transactions(tenant_id);
create index transactions_obra_idx   on transactions(obra_id);
create index transactions_due_idx    on transactions(due_date);

-- ============================================================
-- CATEGORIAS FINANCEIRAS (customizáveis por tenant)
-- ============================================================
create table financial_categories (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  name        text not null,
  type        transaction_type not null,
  color       text default '#4A9B5C',
  created_at  timestamptz not null default now()
);
create index fin_categories_tenant_idx on financial_categories(tenant_id);

-- ============================================================
-- FOTOS DE OBRA (Supabase Storage refs)
-- ============================================================
create table obra_photos (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  obra_id     uuid not null references obras(id) on delete cascade,
  etapa_id    uuid references etapas(id),
  url         text not null,
  caption     text,
  uploaded_by uuid references profiles(id),
  created_at  timestamptz not null default now()
);
create index photos_obra_idx   on obra_photos(obra_id);
create index photos_tenant_idx on obra_photos(tenant_id);

-- ============================================================
-- FUNÇÃO HELPER: retorna tenant_id do usuário logado
-- ============================================================
create or replace function my_tenant_id()
returns uuid
language sql stable
as $$
  select tenant_id from profiles where id = auth.uid()
$$;

-- ============================================================
-- FUNÇÃO HELPER: retorna role do usuário logado
-- ============================================================
create or replace function my_role()
returns user_role
language sql stable
as $$
  select role from profiles where id = auth.uid()
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table tenants              enable row level security;
alter table profiles             enable row level security;
alter table invites              enable row level security;
alter table obras                enable row level security;
alter table etapas               enable row level security;
alter table obra_updates         enable row level security;
alter table contacts             enable row level security;
alter table transactions         enable row level security;
alter table financial_categories enable row level security;
alter table obra_photos          enable row level security;

-- ── TENANTS ──────────────────────────────────────────────────
-- Usuário só vê o próprio tenant
create policy "tenant_select" on tenants
  for select using (id = my_tenant_id());

-- Só owner pode atualizar dados do tenant
create policy "tenant_update" on tenants
  for update using (id = my_tenant_id() and my_role() = 'owner');

-- ── PROFILES ─────────────────────────────────────────────────
-- Ver todos do mesmo tenant
create policy "profiles_select" on profiles
  for select using (tenant_id = my_tenant_id());

-- Owner e manager podem inserir (criar usuário via invite)
create policy "profiles_insert" on profiles
  for insert with check (tenant_id = my_tenant_id());

-- Owner pode atualizar qualquer perfil; usuário atualiza o próprio
create policy "profiles_update" on profiles
  for update using (
    tenant_id = my_tenant_id() and (
      my_role() = 'owner' or id = auth.uid()
    )
  );

-- Só owner pode desativar/remover
create policy "profiles_delete" on profiles
  for delete using (tenant_id = my_tenant_id() and my_role() = 'owner');

-- ── INVITES ──────────────────────────────────────────────────
create policy "invites_select" on invites
  for select using (tenant_id = my_tenant_id() and my_role() in ('owner', 'manager'));

create policy "invites_insert" on invites
  for insert with check (tenant_id = my_tenant_id() and my_role() in ('owner', 'manager'));

create policy "invites_update" on invites
  for update using (tenant_id = my_tenant_id() and my_role() in ('owner', 'manager'));

-- ── OBRAS ────────────────────────────────────────────────────
-- Todos do tenant veem obras
create policy "obras_select" on obras
  for select using (tenant_id = my_tenant_id());

-- Owner, manager e operational podem criar
create policy "obras_insert" on obras
  for insert with check (
    tenant_id = my_tenant_id() and
    my_role() in ('owner', 'manager', 'operational')
  );

-- Owner, manager e operational podem editar
create policy "obras_update" on obras
  for update using (
    tenant_id = my_tenant_id() and
    my_role() in ('owner', 'manager', 'operational')
  );

-- Só owner e manager podem arquivar/deletar
create policy "obras_delete" on obras
  for delete using (
    tenant_id = my_tenant_id() and my_role() in ('owner', 'manager')
  );

-- ── ETAPAS ───────────────────────────────────────────────────
create policy "etapas_select" on etapas
  for select using (tenant_id = my_tenant_id());

create policy "etapas_insert" on etapas
  for insert with check (
    tenant_id = my_tenant_id() and
    my_role() in ('owner', 'manager', 'operational')
  );

create policy "etapas_update" on etapas
  for update using (
    tenant_id = my_tenant_id() and
    my_role() in ('owner', 'manager', 'operational')
  );

create policy "etapas_delete" on etapas
  for delete using (
    tenant_id = my_tenant_id() and my_role() in ('owner', 'manager')
  );

-- ── OBRA UPDATES ─────────────────────────────────────────────
create policy "updates_select" on obra_updates
  for select using (tenant_id = my_tenant_id());

create policy "updates_insert" on obra_updates
  for insert with check (
    tenant_id = my_tenant_id() and
    my_role() in ('owner', 'manager', 'operational')
  );

-- Só o autor ou owner/manager pode editar/deletar update
create policy "updates_update" on obra_updates
  for update using (
    tenant_id = my_tenant_id() and (
      author_id = auth.uid() or my_role() in ('owner', 'manager')
    )
  );

create policy "updates_delete" on obra_updates
  for delete using (
    tenant_id = my_tenant_id() and (
      author_id = auth.uid() or my_role() in ('owner', 'manager')
    )
  );

-- ── CONTACTS ─────────────────────────────────────────────────
create policy "contacts_select" on contacts
  for select using (tenant_id = my_tenant_id());

create policy "contacts_insert" on contacts
  for insert with check (
    tenant_id = my_tenant_id() and
    my_role() in ('owner', 'manager', 'financial')
  );

create policy "contacts_update" on contacts
  for update using (
    tenant_id = my_tenant_id() and
    my_role() in ('owner', 'manager', 'financial')
  );

create policy "contacts_delete" on contacts
  for delete using (
    tenant_id = my_tenant_id() and my_role() in ('owner', 'manager')
  );

-- ── TRANSACTIONS ─────────────────────────────────────────────
-- Financial, owner e manager veem transações; operational e viewer NÃO
create policy "transactions_select" on transactions
  for select using (
    tenant_id = my_tenant_id() and
    my_role() in ('owner', 'manager', 'financial')
  );

create policy "transactions_insert" on transactions
  for insert with check (
    tenant_id = my_tenant_id() and
    my_role() in ('owner', 'manager', 'financial')
  );

create policy "transactions_update" on transactions
  for update using (
    tenant_id = my_tenant_id() and
    my_role() in ('owner', 'manager', 'financial')
  );

create policy "transactions_delete" on transactions
  for delete using (
    tenant_id = my_tenant_id() and my_role() in ('owner', 'manager')
  );

-- ── FINANCIAL CATEGORIES ─────────────────────────────────────
create policy "fin_cat_select" on financial_categories
  for select using (
    tenant_id = my_tenant_id() and
    my_role() in ('owner', 'manager', 'financial')
  );

create policy "fin_cat_insert" on financial_categories
  for insert with check (
    tenant_id = my_tenant_id() and my_role() in ('owner', 'manager')
  );

create policy "fin_cat_update" on financial_categories
  for update using (
    tenant_id = my_tenant_id() and my_role() in ('owner', 'manager')
  );

-- ── OBRA PHOTOS ──────────────────────────────────────────────
create policy "photos_select" on obra_photos
  for select using (tenant_id = my_tenant_id());

create policy "photos_insert" on obra_photos
  for insert with check (
    tenant_id = my_tenant_id() and
    my_role() in ('owner', 'manager', 'operational')
  );

create policy "photos_delete" on obra_photos
  for delete using (
    tenant_id = my_tenant_id() and (
      uploaded_by = auth.uid() or my_role() in ('owner', 'manager')
    )
  );

-- ============================================================
-- TRIGGERS: updated_at automático
-- ============================================================
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on tenants
  for each row execute function set_updated_at();
create trigger set_updated_at before update on profiles
  for each row execute function set_updated_at();
create trigger set_updated_at before update on obras
  for each row execute function set_updated_at();
create trigger set_updated_at before update on etapas
  for each row execute function set_updated_at();
create trigger set_updated_at before update on contacts
  for each row execute function set_updated_at();
create trigger set_updated_at before update on transactions
  for each row execute function set_updated_at();

-- ============================================================
-- TRIGGER: cria profile e tenant quando usuário se registra
-- (owner flow — self-service)
-- ============================================================
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  new_tenant_id uuid;
  company_name  text;
  company_slug  text;
begin
  -- pega dados do metadata passados no signUp
  company_name := coalesce(new.raw_user_meta_data->>'company_name', 'Minha Empresa');
  company_slug := lower(regexp_replace(company_name, '[^a-zA-Z0-9]', '-', 'g'))
                  || '-' || substring(new.id::text, 1, 6);

  -- cria tenant
  insert into tenants (name, slug)
  values (company_name, company_slug)
  returning id into new_tenant_id;

  -- cria profile como owner
  insert into profiles (id, tenant_id, full_name, email, role)
  values (
    new.id,
    new_tenant_id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    'owner'
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- TRIGGER: aceitar invite — cria profile no tenant correto
-- ============================================================
create or replace function handle_invite_signup()
returns trigger language plpgsql security definer as $$
declare
  inv record;
begin
  -- busca invite pelo token passado nos metadados
  select * into inv
  from invites
  where token = new.raw_user_meta_data->>'invite_token'
    and status = 'pending'
    and expires_at > now();

  if inv.id is null then
    return new; -- sem invite válido, handle_new_user() cria tenant normal
  end if;

  -- cria profile no tenant do invite (sem criar novo tenant)
  insert into profiles (id, tenant_id, full_name, email, role)
  values (
    new.id,
    inv.tenant_id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    inv.role
  )
  on conflict (id) do nothing;

  -- marca invite como aceito
  update invites set status = 'accepted' where id = inv.id;

  return new;
end;
$$;

-- Obs: handle_invite_signup roda ANTES de handle_new_user
-- O segundo trigger não cria tenant se o profile já existe
create trigger on_auth_user_invite
  after insert on auth.users
  for each row
  when (new.raw_user_meta_data->>'invite_token' is not null)
  execute function handle_invite_signup();

-- ============================================================
-- SEED: categorias financeiras padrão (inseridas via função)
-- Chame após criar o primeiro tenant em produção, ou use
-- a trigger abaixo para seedar automaticamente.
-- ============================================================
create or replace function seed_default_categories(p_tenant_id uuid)
returns void language plpgsql as $$
begin
  insert into financial_categories (tenant_id, name, type, color) values
    (p_tenant_id, 'Mão de obra',     'payable',    '#C8974A'),
    (p_tenant_id, 'Material',        'payable',    '#4A9B5C'),
    (p_tenant_id, 'Equipamentos',    'payable',    '#5A8BC8'),
    (p_tenant_id, 'Serviços',        'payable',    '#9B4A9B'),
    (p_tenant_id, 'Parcela cliente', 'receivable', '#2C5530'),
    (p_tenant_id, 'Sinal',           'receivable', '#1C2B1E'),
    (p_tenant_id, 'Reembolso',       'receivable', '#4A9B5C');
end;
$$;

-- Trigger: seed categorias ao criar tenant
create or replace function auto_seed_categories()
returns trigger language plpgsql as $$
begin
  perform seed_default_categories(new.id);
  return new;
end;
$$;

create trigger on_tenant_created
  after insert on tenants
  for each row execute function auto_seed_categories();

-- ============================================================
-- STORAGE BUCKETS (execute no dashboard do Supabase ou via CLI)
-- ============================================================
-- insert into storage.buckets (id, name, public) values ('obra-photos', 'obra-photos', false);
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', false);

-- Storage RLS — fotos de obra
-- create policy "photos_upload" on storage.objects for insert
--   with check (bucket_id = 'obra-photos' and auth.uid() is not null);
-- create policy "photos_read" on storage.objects for select
--   using (bucket_id = 'obra-photos' and auth.uid() is not null);

-- ============================================================
-- VIEWS ÚTEIS (opcional, facilita queries no front)
-- ============================================================

-- Resumo financeiro por obra
create or replace view obra_financial_summary as
select
  o.id as obra_id,
  o.tenant_id,
  o.name as obra_name,
  o.budget,
  coalesce(sum(case when t.type = 'payable'    and t.status != 'cancelled' then t.amount else 0 end), 0) as total_payable,
  coalesce(sum(case when t.type = 'receivable' and t.status != 'cancelled' then t.amount else 0 end), 0) as total_receivable,
  coalesce(sum(case when t.type = 'payable'    and t.status = 'paid'       then t.amount else 0 end), 0) as paid_out,
  coalesce(sum(case when t.type = 'receivable' and t.status = 'paid'       then t.amount else 0 end), 0) as received,
  coalesce(sum(case when t.type = 'payable'    and t.status = 'pending' and t.due_date <= current_date + 7 then t.amount else 0 end), 0) as due_soon_payable,
  coalesce(sum(case when t.type = 'receivable' and t.status = 'pending' and t.due_date <= current_date + 7 then t.amount else 0 end), 0) as due_soon_receivable
from obras o
left join transactions t on t.obra_id = o.id
group by o.id, o.tenant_id, o.name, o.budget;

-- Progresso geral da obra (média das etapas)
create or replace view obra_progress_summary as
select
  obra_id,
  tenant_id,
  count(*) as total_etapas,
  count(*) filter (where status = 'completed') as etapas_concluidas,
  round(avg(progress_pct)) as avg_progress,
  round(avg(progress_pct) filter (where status != 'pending')) as active_progress
from etapas
group by obra_id, tenant_id;
