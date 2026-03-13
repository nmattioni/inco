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
do $$ begin
  create type user_role as enum ('owner', 'manager', 'financial', 'operational', 'viewer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type obra_status as enum ('planning', 'active', 'paused', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type etapa_status as enum ('pending', 'active', 'completed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type transaction_type as enum ('receivable', 'payable');
exception when duplicate_object then null; end $$;

do $$ begin
  create type transaction_status as enum ('pending', 'paid', 'overdue', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type invite_status as enum ('pending', 'accepted', 'expired');
exception when duplicate_object then null; end $$;

-- ============================================================
-- TENANTS (empresas)
-- ============================================================
create table if not exists tenants (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text unique not null,
  logo_url    text,
  plan        text not null default 'starter',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- PROFILES (espelho de auth.users com tenant)
-- ============================================================
create table if not exists profiles (
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
create index if not exists profiles_tenant_idx on profiles(tenant_id);

-- ============================================================
-- INVITES
-- ============================================================
create table if not exists invites (
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
create index if not exists invites_tenant_idx on invites(tenant_id);
create index if not exists invites_token_idx  on invites(token);

-- ============================================================
-- OBRAS
-- ============================================================
create table if not exists obras (
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
create index if not exists obras_tenant_idx on obras(tenant_id);

-- ============================================================
-- ETAPAS DE OBRA
-- ============================================================
create table if not exists etapas (
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
create index if not exists etapas_obra_idx   on etapas(obra_id);
create index if not exists etapas_tenant_idx on etapas(tenant_id);

-- ============================================================
-- ATUALIZAÇÕES / DIÁRIO DE OBRA
-- ============================================================
create table if not exists obra_updates (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  obra_id     uuid not null references obras(id) on delete cascade,
  etapa_id    uuid references etapas(id),
  author_id   uuid not null references profiles(id),
  content     text not null,
  photos      text[] default '{}',
  created_at  timestamptz not null default now()
);
create index if not exists updates_obra_idx   on obra_updates(obra_id);
create index if not exists updates_tenant_idx on obra_updates(tenant_id);

-- ============================================================
-- CONTATOS (clientes / fornecedores)
-- ============================================================
create table if not exists contacts (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  name        text not null,
  type        text not null default 'client',
  email       text,
  phone       text,
  document    text,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists contacts_tenant_idx on contacts(tenant_id);

-- ============================================================
-- TRANSAÇÕES FINANCEIRAS
-- ============================================================
create table if not exists transactions (
  id              uuid primary key default uuid_generate_v4(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  obra_id         uuid references obras(id),
  contact_id      uuid references contacts(id),
  type            transaction_type not null,
  status          transaction_status not null default 'pending',
  description     text not null,
  amount          numeric(14,2) not null check (amount > 0),
  due_date        date not null,
  paid_date       date,
  category        text,
  notes           text,
  attachment_url  text,
  created_by      uuid references profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists transactions_tenant_idx on transactions(tenant_id);
create index if not exists transactions_obra_idx   on transactions(obra_id);
create index if not exists transactions_due_idx    on transactions(due_date);

-- ============================================================
-- CATEGORIAS FINANCEIRAS
-- ============================================================
create table if not exists financial_categories (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  name        text not null,
  type        transaction_type not null,
  color       text default '#4A9B5C',
  created_at  timestamptz not null default now()
);
create index if not exists fin_categories_tenant_idx on financial_categories(tenant_id);

-- ============================================================
-- FOTOS DE OBRA
-- ============================================================
create table if not exists obra_photos (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  obra_id     uuid not null references obras(id) on delete cascade,
  etapa_id    uuid references etapas(id),
  url         text not null,
  caption     text,
  uploaded_by uuid references profiles(id),
  created_at  timestamptz not null default now()
);
create index if not exists photos_obra_idx   on obra_photos(obra_id);
create index if not exists photos_tenant_idx on obra_photos(tenant_id);

-- ============================================================
-- FUNÇÕES HELPER
-- ============================================================
create or replace function my_tenant_id()
returns uuid
language sql stable
as $$
  select tenant_id from profiles where id = auth.uid()
$$;

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

-- TENANTS
drop policy if exists "tenant_select" on tenants;
create policy "tenant_select" on tenants
  for select using (id = my_tenant_id());

drop policy if exists "tenant_update" on tenants;
create policy "tenant_update" on tenants
  for update using (id = my_tenant_id() and my_role() = 'owner');

-- PROFILES
drop policy if exists "profiles_select" on profiles;
create policy "profiles_select" on profiles
  for select using (tenant_id = my_tenant_id());

drop policy if exists "profiles_insert" on profiles;
create policy "profiles_insert" on profiles
  for insert with check (tenant_id = my_tenant_id());

drop policy if exists "profiles_update" on profiles;
create policy "profiles_update" on profiles
  for update using (
    tenant_id = my_tenant_id() and (
      my_role() = 'owner' or id = auth.uid()
    )
  );

drop policy if exists "profiles_delete" on profiles;
create policy "profiles_delete" on profiles
  for delete using (tenant_id = my_tenant_id() and my_role() = 'owner');

-- INVITES
drop policy if exists "invites_select" on invites;
create policy "invites_select" on invites
  for select using (tenant_id = my_tenant_id() and my_role() in ('owner', 'manager'));

drop policy if exists "invites_insert" on invites;
create policy "invites_insert" on invites
  for insert with check (tenant_id = my_tenant_id() and my_role() in ('owner', 'manager'));

drop policy if exists "invites_update" on invites;
create policy "invites_update" on invites
  for update using (tenant_id = my_tenant_id() and my_role() in ('owner', 'manager'));

-- OBRAS
drop policy if exists "obras_select" on obras;
create policy "obras_select" on obras
  for select using (tenant_id = my_tenant_id());

drop policy if exists "obras_insert" on obras;
create policy "obras_insert" on obras
  for insert with check (
    tenant_id = my_tenant_id() and
    my_role() in ('owner', 'manager', 'operational')
  );

drop policy if exists "obras_update" on obras;
create policy "obras_update" on obras
  for update using (
    tenant_id = my_tenant_id() and
    my_role() in ('owner', 'manager', 'operational')
  );

drop policy if exists "obras_delete" on obras;
create policy "obras_delete" on obras
  for delete using (
    tenant_id = my_tenant_id() and my_role() in ('owner', 'manager')
  );

-- ETAPAS
drop policy if exists "etapas_select" on etapas;
create policy "etapas_select" on etapas
  for select using (tenant_id = my_tenant_id());

drop policy if exists "etapas_insert" on etapas;
create policy "etapas_insert" on etapas
  for insert with check (
    tenant_id = my_tenant_id() and
    my_role() in ('owner', 'manager', 'operational')
  );

drop policy if exists "etapas_update" on etapas;
create policy "etapas_update" on etapas
  for update using (
    tenant_id = my_tenant_id() and
    my_role() in ('owner', 'manager', 'operational')
  );

drop policy if exists "etapas_delete" on etapas;
create policy "etapas_delete" on etapas
  for delete using (
    tenant_id = my_tenant_id() and my_role() in ('owner', 'manager')
  );

-- OBRA UPDATES
drop policy if exists "updates_select" on obra_updates;
create policy "updates_select" on obra_updates
  for select using (tenant_id = my_tenant_id());

drop policy if exists "updates_insert" on obra_updates;
create policy "updates_insert" on obra_updates
  for insert with check (
    tenant_id = my_tenant_id() and
    my_role() in ('owner', 'manager', 'operational')
  );

drop policy if exists "updates_update" on obra_updates;
create policy "updates_update" on obra_updates
  for update using (
    tenant_id = my_tenant_id() and (
      author_id = auth.uid() or my_role() in ('owner', 'manager')
    )
  );

drop policy if exists "updates_delete" on obra_updates;
create policy "updates_delete" on obra_updates
  for delete using (
    tenant_id = my_tenant_id() and (
      author_id = auth.uid() or my_role() in ('owner', 'manager')
    )
  );

-- CONTACTS
drop policy if exists "contacts_select" on contacts;
create policy "contacts_select" on contacts
  for select using (tenant_id = my_tenant_id());

drop policy if exists "contacts_insert" on contacts;
create policy "contacts_insert" on contacts
  for insert with check (
    tenant_id = my_tenant_id() and
    my_role() in ('owner', 'manager', 'financial')
  );

drop policy if exists "contacts_update" on contacts;
create policy "contacts_update" on contacts
  for update using (
    tenant_id = my_tenant_id() and
    my_role() in ('owner', 'manager', 'financial')
  );

drop policy if exists "contacts_delete" on contacts;
create policy "contacts_delete" on contacts
  for delete using (
    tenant_id = my_tenant_id() and my_role() in ('owner', 'manager')
  );

-- TRANSACTIONS
drop policy if exists "transactions_select" on transactions;
create policy "transactions_select" on transactions
  for select using (
    tenant_id = my_tenant_id() and
    my_role() in ('owner', 'manager', 'financial')
  );

drop policy if exists "transactions_insert" on transactions;
create policy "transactions_insert" on transactions
  for insert with check (
    tenant_id = my_tenant_id() and
    my_role() in ('owner', 'manager', 'financial')
  );

drop policy if exists "transactions_update" on transactions;
create policy "transactions_update" on transactions
  for update using (
    tenant_id = my_tenant_id() and
    my_role() in ('owner', 'manager', 'financial')
  );

drop policy if exists "transactions_delete" on transactions;
create policy "transactions_delete" on transactions
  for delete using (
    tenant_id = my_tenant_id() and my_role() in ('owner', 'manager')
  );

-- FINANCIAL CATEGORIES
drop policy if exists "fin_cat_select" on financial_categories;
create policy "fin_cat_select" on financial_categories
  for select using (
    tenant_id = my_tenant_id() and
    my_role() in ('owner', 'manager', 'financial')
  );

drop policy if exists "fin_cat_insert" on financial_categories;
create policy "fin_cat_insert" on financial_categories
  for insert with check (
    tenant_id = my_tenant_id() and my_role() in ('owner', 'manager')
  );

drop policy if exists "fin_cat_update" on financial_categories;
create policy "fin_cat_update" on financial_categories
  for update using (
    tenant_id = my_tenant_id() and my_role() in ('owner', 'manager')
  );

-- OBRA PHOTOS
drop policy if exists "photos_select" on obra_photos;
create policy "photos_select" on obra_photos
  for select using (tenant_id = my_tenant_id());

drop policy if exists "photos_insert" on obra_photos;
create policy "photos_insert" on obra_photos
  for insert with check (
    tenant_id = my_tenant_id() and
    my_role() in ('owner', 'manager', 'operational')
  );

drop policy if exists "photos_delete" on obra_photos;
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

drop trigger if exists set_updated_at on tenants;
create trigger set_updated_at before update on tenants
  for each row execute function set_updated_at();

drop trigger if exists set_updated_at on profiles;
create trigger set_updated_at before update on profiles
  for each row execute function set_updated_at();

drop trigger if exists set_updated_at on obras;
create trigger set_updated_at before update on obras
  for each row execute function set_updated_at();

drop trigger if exists set_updated_at on etapas;
create trigger set_updated_at before update on etapas
  for each row execute function set_updated_at();

drop trigger if exists set_updated_at on contacts;
create trigger set_updated_at before update on contacts
  for each row execute function set_updated_at();

drop trigger if exists set_updated_at on transactions;
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
  -- Se já existe um profile (criado pelo invite trigger), não cria tenant
  if exists (select 1 from profiles where id = new.id) then
    return new;
  end if;

  company_name := coalesce(new.raw_user_meta_data->>'company_name', 'Minha Empresa');
  company_slug := lower(regexp_replace(company_name, '[^a-zA-Z0-9]', '-', 'g'))
                  || '-' || substring(new.id::text, 1, 6);

  insert into tenants (name, slug)
  values (company_name, company_slug)
  returning id into new_tenant_id;

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

drop trigger if exists on_auth_user_created on auth.users;
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
  select * into inv
  from invites
  where token = new.raw_user_meta_data->>'invite_token'
    and status = 'pending'
    and expires_at > now();

  if inv.id is null then
    return new;
  end if;

  insert into profiles (id, tenant_id, full_name, email, role)
  values (
    new.id,
    inv.tenant_id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    inv.role
  )
  on conflict (id) do nothing;

  update invites set status = 'accepted' where id = inv.id;

  return new;
end;
$$;

drop trigger if exists on_auth_user_invite on auth.users;
create trigger on_auth_user_invite
  after insert on auth.users
  for each row
  when (new.raw_user_meta_data->>'invite_token' is not null)
  execute function handle_invite_signup();

-- ============================================================
-- SEED: categorias financeiras padrão
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

create or replace function auto_seed_categories()
returns trigger language plpgsql as $$
begin
  perform seed_default_categories(new.id);
  return new;
end;
$$;

drop trigger if exists on_tenant_created on tenants;
create trigger on_tenant_created
  after insert on tenants
  for each row execute function auto_seed_categories();

-- ============================================================
-- VIEWS ÚTEIS
-- ============================================================
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
