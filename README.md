# Inco — Gestão de Obras e Finanças

Sistema multi-tenant para construtoras e incorporadoras.

## Stack
- **Frontend**: React + Vite + Tailwind CSS
- **Backend/DB**: Supabase (Auth + PostgreSQL + RLS + Storage)
- **Auth**: Supabase Auth (email/password)

---

## Setup

### 1. Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Vá em **SQL Editor** e execute o arquivo `supabase/schema.sql` completo
3. Em **Storage**, crie dois buckets:
   - `obra-photos` (privado)
   - `avatars` (privado)
4. Copie a **Project URL** e **anon key** (Settings → API)

### 2. Variáveis de ambiente

Crie um arquivo `.env` na raiz:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

### 3. Instalar e rodar

```bash
npm install
npm run dev
```

---

## Estrutura de Roles

| Role | Obras | Financeiro | Equipe | Settings |
|------|-------|------------|--------|----------|
| **owner** | ✓ total | ✓ total | ✓ | ✓ |
| **manager** | ✓ total | ✓ total | ✓ | — |
| **financial** | 👁 ver | ✓ total | — | — |
| **operational** | ✓ editar | — | — | — |
| **viewer** | 👁 ver | — | — | — |

---

## Fluxo de cadastro

### Novo proprietário (self-service)
1. Acessa `/register`
2. Preenche nome, **nome da empresa**, email, senha
3. Trigger `handle_new_user` cria automaticamente:
   - Novo `tenant`
   - `profile` com `role = 'owner'`

### Convite de colaborador
1. Owner/Manager vai em **Equipe → Convidar membro**
2. Informa email e cargo
3. Um invite é criado com token único (válido 7 dias)
4. Compartilha link: `/register?invite=TOKEN`
5. Colaborador preenche nome, email, senha
6. Trigger `handle_invite_signup` cria o `profile` no tenant correto

---

## Estrutura de arquivos

```
src/
  contexts/
    AuthContext.jsx      # Auth + tenant + permissões
  hooks/
    useData.js           # useObras, useObra, useTransactions, useTeam, useDashboard
  lib/
    supabase.js          # Client + types + ROLE_PERMISSIONS
  components/
    ui/index.jsx         # Button, Card, Badge, Input, Modal, StatCard...
    layout/Layout.jsx    # Sidebar + topbar
  pages/
    Auth.jsx             # Login + Register
    Dashboard.jsx        # Visão geral
    Obras.jsx            # Lista + detalhe de obra
    Financeiro.jsx       # Contas a pagar/receber
    Equipe.jsx           # Gestão de usuários
  App.jsx                # Router + rotas protegidas
supabase/
  schema.sql             # Schema completo + RLS + triggers
```

---

## Próximas features (backlog)

- [ ] Upload de fotos (Supabase Storage)
- [ ] Relatório PDF por obra
- [ ] Notificações de vencimento (Supabase Edge Functions)
- [ ] App mobile (React Native / PWA)
- [ ] Dashboard de rentabilidade por obra
- [ ] Integração com banco (Open Finance)
- [ ] Portal do cliente (role viewer com link externo)
