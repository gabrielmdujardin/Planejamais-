# Documentação Técnica Completa - Planeja+

## 1. Visão Geral do Projeto

### Introdução

O **Planeja+** é uma plataforma completa de gerenciamento de eventos que permite aos usuários criar, organizar e acompanhar todos os aspectos de seus eventos - desde casamentos e aniversários até eventos corporativos e formaturas.

**Problema que resolve:**
- Dificuldade em gerenciar múltiplos eventos simultaneamente
- Falta de controle sobre lista de convidados e confirmações
- Desorganização no orçamento e itens do evento
- Ausência de uma visão consolidada com métricas e analytics

**Meta principal:** Fornecer uma solução intuitiva e visualmente atraente para organizadores de eventos gerenciarem todos os aspectos de seus eventos em um único lugar.

---

### Tecnologias Utilizadas

| Categoria | Tecnologia | Versão |
|-----------|------------|--------|
| **Framework** | Next.js (App Router) | 14.1.0 |
| **Linguagem** | TypeScript | 5.9.3 |
| **UI Library** | React | 18.x |
| **Estilização** | Tailwind CSS | 3.x |
| **Componentes** | shadcn/ui | Latest |
| **State Management** | Zustand | 4.x |
| **Persistência Local** | localStorage (via Zustand Persist) | - |
| **Banco de Dados** | Supabase (PostgreSQL) | - |
| **Autenticação** | Context API (Demo) / Supabase Auth (Produção) | - |
| **Gráficos** | Recharts | 2.x |
| **Ícones** | Lucide React | Latest |
| **Validação** | Zod | 3.x |
| **Deploy** | Vercel | - |

---

### Pré-requisitos

\`\`\`bash
# Software necessário
Node.js >= 18.0.0
npm >= 9.0.0 ou yarn >= 1.22.0
Git

# Variáveis de ambiente (Supabase)
SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret

# Variáveis PostgreSQL (via Supabase)
POSTGRES_URL=your_postgres_url
POSTGRES_PRISMA_URL=your_prisma_url
POSTGRES_URL_NON_POOLING=your_non_pooling_url
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password
POSTGRES_DATABASE=your_database
POSTGRES_HOST=your_host
\`\`\`

---

## 2. Etapas de Construção e Arquitetura

### Arquitetura do Sistema

O Planeja+ utiliza uma arquitetura **Cliente-Servidor Híbrida** com o Next.js App Router, combinando:
- **Server Components (RSC)** para páginas estáticas e SEO
- **Client Components** para interatividade
- **API Routes** para operações server-side

\`\`\`
┌─────────────────────────────────────────────────────────────────────────┐
│                         ARQUITETURA PLANEJA+                            │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Landing Page  │     │   Login/Registro│     │   Rotas Públicas│
│   (Marketing)   │     │   (Auth)        │     │   (Convites)    │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │      MIDDLEWARE         │
                    │   (Proteção de Rotas)   │
                    └────────────┬────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌────────▼────────┐     ┌────────▼────────┐     ┌────────▼────────┐
│    Dashboard    │     │    Calendário   │     │    Contatos     │
│   (Analytics)   │     │    (Agenda)     │     │    (CRM)        │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │     ZUSTAND STORES      │
                    │  (State Management)     │
                    ├─────────────────────────┤
                    │  • event-store.ts       │
                    │  • contact-store.ts     │
                    └────────────┬────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
     ┌────────▼────────┐ ┌──────▼──────┐ ┌────────▼────────┐
     │   localStorage  │ │  Supabase   │ │   API Routes    │
     │   (Persistência)│ │  (Database) │ │   (Server)      │
     └─────────────────┘ └─────────────┘ └─────────────────┘
\`\`\`

---

### Estrutura de Pastas

\`\`\`
planeja-plus/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Grupo de rotas de autenticação
│   │   ├── login/
│   │   │   └── page.tsx          # Página de login
│   │   └── register/
│   │       └── page.tsx          # Página de registro
│   ├── dashboard/                # Área principal do app
│   │   ├── page.tsx              # Dashboard principal
│   │   ├── analytics/
│   │   │   └── page.tsx          # Página de analytics
│   │   ├── visualization/
│   │   │   └── page.tsx          # Visualização de dados
│   │   └── user-testing/
│   │       └── page.tsx          # Testes de usuário
│   ├── event/
│   │   └── [id]/
│   │       └── page.tsx          # Página individual do evento
│   ├── calendar/
│   │   └── page.tsx              # Calendário de eventos
│   ├── contacts/
│   │   └── page.tsx              # Gerenciamento de contatos
│   ├── create-event/
│   │   └── page.tsx              # Criação de novo evento
│   ├── confirm-invitation/       # Confirmação pública de convites
│   │   ├── [eventId]/
│   │   │   └── [guestId]/
│   │   │       └── page.tsx
│   │   └── thank-you/
│   │       └── page.tsx
│   ├── profile/
│   │   └── page.tsx              # Perfil do usuário
│   ├── about/
│   │   └── page.tsx              # Sobre o sistema
│   ├── pricing/
│   │   └── page.tsx              # Planos e preços
│   ├── api/                      # API Routes
│   │   ├── ics/
│   │   │   └── [userId]/
│   │   │       └── route.ts      # Exportação ICS
│   │   └── jobs/                 # Jobs agendados
│   │       ├── calendar-sync/
│   │       ├── cleanup/
│   │       ├── daily-aggregate/
│   │       └── pending-invites/
│   ├── layout.tsx                # Layout principal
│   ├── page.tsx                  # Landing page
│   ├── globals.css               # Estilos globais
│   └── manifest.ts               # PWA manifest
│
├── components/                   # Componentes React
│   ├── ui/                       # Componentes shadcn/ui
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── table.tsx
│   │   └── ... (50+ componentes)
│   ├── charts/                   # Componentes de gráficos
│   │   ├── bar-chart-wrapper.tsx
│   │   ├── pie-chart-wrapper.tsx
│   │   └── index.tsx
│   ├── event-card.tsx            # Card de evento
│   ├── event-hero.tsx            # Hero banner do evento
│   ├── event-gallery.tsx         # Galeria de fotos
│   ├── guest-list.tsx            # Lista de convidados
│   ├── items-list.tsx            # Lista de itens/orçamento
│   ├── navbar.tsx                # Barra de navegação
│   ├── add-guest-dialog.tsx      # Modal de adicionar convidado
│   ├── add-item-dialog.tsx       # Modal de adicionar item
│   ├── edit-event-dialog.tsx     # Modal de editar evento
│   ├── image-upload.tsx          # Componente de upload
│   └── ... (outros componentes)
│
├── stores/                       # Zustand Stores
│   ├── event-store.ts            # Store de eventos
│   └── contact-store.ts          # Store de contatos
│
├── context/                      # React Contexts
│   └── auth-context.tsx          # Contexto de autenticação
│
├── lib/                          # Utilitários e configurações
│   ├── supabase/
│   │   ├── client.ts             # Cliente browser Supabase
│   │   ├── server.ts             # Cliente server Supabase
│   │   └── types.ts              # Tipos do banco
│   ├── event-theme.ts            # Temas por tipo de evento
│   ├── utils.ts                  # Funções utilitárias
│   └── validation.ts             # Schemas Zod
│
├── hooks/                        # Custom Hooks
│   ├── use-toast.ts              # Hook de notificações
│   └── use-mobile.tsx            # Hook de detecção mobile
│
├── jobs/                         # Jobs de background
│   ├── calendar-sync.ts
│   ├── cleanup.ts
│   ├── daily-aggregate.ts
│   └── pending-invites.ts
│
├── middleware.ts                 # Next.js Middleware
├── tailwind.config.ts            # Configuração Tailwind
├── next.config.mjs               # Configuração Next.js
└── tsconfig.json                 # Configuração TypeScript
\`\`\`

---

### Backend - Componentes Principais

#### Controllers / API Routes

| Rota | Método | Função |
|------|--------|--------|
| `/api/ics/[userId]` | GET | Gera arquivo ICS para sincronização com calendários |
| `/api/jobs/calendar-sync` | POST | Sincroniza eventos com calendários externos |
| `/api/jobs/cleanup` | POST | Limpa dados antigos e temporários |
| `/api/jobs/daily-aggregate` | POST | Agrega métricas diárias para analytics |
| `/api/jobs/pending-invites` | POST | Envia lembretes de convites pendentes |

#### Autenticação e Autorização

\`\`\`typescript
// context/auth-context.tsx

// Fluxo de Autenticação:
// 1. Usuário acessa /login ou /register
// 2. Credenciais são validadas (Demo: mock, Produção: Supabase)
// 3. Token/sessão é armazenado em localStorage
// 4. AuthProvider disponibiliza estado globalmente
// 5. Middleware protege rotas privadas

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  isLoading: boolean
}

// Modo Demo: Login com qualquer email/senha funciona
// Modo Produção: Autenticação real via Supabase Auth
\`\`\`

---

### Frontend - Estrutura de Componentes

#### Hierarquia de Componentes

\`\`\`
App Layout
├── ThemeProvider (Tema claro/escuro)
├── AuthProvider (Estado de autenticação)
├── Navbar (Navegação global)
└── Page Content
    ├── Container Components (Lógica de negócio)
    │   ├── Dashboard
    │   ├── EventPage
    │   ├── CalendarPage
    │   └── ContactsPage
    └── Presentation Components (UI pura)
        ├── EventCard
        ├── GuestList
        ├── ItemsList
        └── Charts
\`\`\`

#### Gestão de Estado (Zustand)

\`\`\`typescript
// stores/event-store.ts - Store principal de eventos

interface EventStore {
  // Estado
  events: Event[]
  
  // Actions - Eventos
  setEvents: (events: Event[]) => void
  addEvent: (event: Event) => void
  updateEvent: (id: string, event: Partial<Event>) => void
  removeEvent: (id: string) => void
  getEventById: (id: string) => Event | undefined

  // Actions - Itens do evento
  addItem: (eventId: string, item: Item) => void
  updateItem: (eventId: string, itemId: string, item: Item) => void
  removeItem: (eventId: string, itemId: string) => void

  // Actions - Convidados
  addGuests: (eventId: string, guests: Guest[]) => void
  updateGuest: (eventId: string, guestId: string, guest: Guest) => void
  removeGuest: (eventId: string, guestId: string) => void
  updateGuestStatus: (eventId: string, guestId: string, status: Status) => void

  // Actions - Fotos
  addPhoto: (eventId: string, photo: PhotoData) => void
  removePhoto: (eventId: string, photoId: string) => void
  updatePhoto: (eventId: string, photoId: string, updates: Partial<Photo>) => void
}
\`\`\`

---

### Configuração do Ambiente

#### Instalação Local

\`\`\`bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/planeja-plus.git
cd planeja-plus

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais

# 4. Execute em desenvolvimento
npm run dev

# 5. Acesse http://localhost:3000
\`\`\`

#### Scripts Disponíveis

\`\`\`json
{
  "dev": "next dev",           // Servidor de desenvolvimento
  "build": "next build",       // Build de produção
  "start": "next start",       // Inicia servidor de produção
  "lint": "next lint"          // Verifica código com ESLint
}
\`\`\`

---

## 3. Design e Estrutura do Banco de Dados

### Tecnologia do Banco de Dados

- **SGBD:** PostgreSQL (via Supabase)
- **ORM:** Nenhum (SQL direto com cliente Supabase)
- **Persistência Local:** Zustand + localStorage

### Arquitetura de Dados Híbrida

O Planeja+ utiliza uma **arquitetura híbrida**:

1. **localStorage (Zustand Persist):** Dados do modo Demo e cache local
2. **Supabase (PostgreSQL):** Dados de produção com sincronização em tempo real

\`\`\`
┌─────────────────────────────────────────────────────────────────────────┐
│                    ARQUITETURA DE DADOS HÍBRIDA                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐                         ┌─────────────────┐
│   MODO DEMO     │                         │  MODO PRODUÇÃO  │
│                 │                         │                 │
│  ┌───────────┐  │                         │  ┌───────────┐  │
│  │ Zustand   │  │                         │  │ Supabase  │  │
│  │ Store     │  │                         │  │ Client    │  │
│  └─────┬─────┘  │                         │  └─────┬─────┘  │
│        │        │                         │        │        │
│  ┌─────▼─────┐  │                         │  ┌─────▼─────┐  │
│  │localStorage│ │                         │  │PostgreSQL │  │
│  │  (JSON)   │  │                         │  │ (Tables)  │  │
│  └───────────┘  │                         │  └───────────┘  │
└─────────────────┘                         └─────────────────┘

Dados pré-carregados:                       Dados reais:
• 5 eventos de exemplo                      • Usuários autenticados
• 760 convidados                            • Eventos persistentes
• 15 itens de orçamento                     • RLS (Row Level Security)
• 5 contatos                                • Sincronização real-time
\`\`\`

---

### Diagrama de Entidade-Relacionamento (ERD)

\`\`\`
┌─────────────────────────────────────────────────────────────────────────┐
│                      DIAGRAMA ENTIDADE-RELACIONAMENTO                   │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│      USERS       │         │      EVENTS      │         │     CONTACTS     │
├──────────────────┤         ├──────────────────┤         ├──────────────────┤
│ PK id            │◄────────┤ FK user_id       │         │ PK id            │
│    email         │    1:N  │ PK id            │         │ FK user_id       │◄─┐
│    name          │         │    title         │         │    name          │  │
│    avatar        │         │    type          │         │    email         │  │
│    created_at    │         │    category      │         │    phone         │  │
└──────────────────┘         │    date          │         │    is_favorite   │  │
                             │    time          │         │    avatar        │  │
                             │    location      │         │    created_at    │  │
                             │    description   │         └──────────────────┘  │
                             │    banner_image  │                               │
                             │    created_at    │         ┌──────────────────┐  │
                             │    updated_at    │         │  CONTACT_LISTS   │  │
                             └────────┬─────────┘         ├──────────────────┤  │
                                      │                   │ PK id            │  │
                    ┌─────────────────┼─────────────────┐ │ FK user_id       │──┘
                    │                 │                 │ │    name          │
                    ▼                 ▼                 ▼ │    created_at    │
          ┌──────────────┐   ┌──────────────┐   ┌──────────────┐            │
          │    GUESTS    │   │    ITEMS     │   │    PHOTOS    │            │
          ├──────────────┤   ├──────────────┤   ├──────────────┤            │
          │ PK id        │   │ PK id        │   │ PK id        │            │
          │ FK event_id  │   │ FK event_id  │   │ FK event_id  │            │
          │ FK contact_id│───│    name      │   │    url       │            │
          │    name      │   │    price     │   │    filename  │            │
          │    email     │   │    assigned  │   │    uploaded_by│           │
          │    phone     │   │    image     │   │    description│           │
          │    status    │   └──────────────┘   │    tags      │            │
          └──────────────┘                      │    uploaded_at│           │
                                                └──────────────┘            │
                                                                            │
┌──────────────────────────────────────────────────────────────────────────┘
│
│   ┌────────────────────┐
│   │ CONTACT_LIST_ITEMS │
│   ├────────────────────┤
└──►│ FK list_id         │
    │ FK contact_id      │
    └────────────────────┘
\`\`\`

---

### Schema Detalhado das Tabelas

#### Tabela: `events`

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | Identificador único do evento |
| `user_id` | UUID | FK → users(id), NOT NULL | ID do usuário proprietário |
| `title` | VARCHAR(255) | NOT NULL | Nome do evento |
| `type` | VARCHAR(100) | NOT NULL | Tipo (Casamento, Aniversário, etc.) |
| `category` | VARCHAR(100) | | Categoria (Social, Corporativo, etc.) |
| `date` | DATE | NOT NULL | Data do evento |
| `time` | TIME | NOT NULL | Horário do evento |
| `location` | VARCHAR(500) | | Local do evento |
| `description` | TEXT | | Descrição detalhada |
| `banner_image` | TEXT | | URL da imagem do banner |
| `confirmed_guests` | INTEGER | DEFAULT 0 | Total de confirmados |
| `total_guests` | INTEGER | DEFAULT 0 | Total de convidados |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Data de criação |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Data de atualização |

#### Tabela: `guests`

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | Identificador único |
| `event_id` | UUID | FK → events(id), ON DELETE CASCADE | Evento associado |
| `contact_id` | UUID | FK → contacts(id), NULLABLE | Contato vinculado |
| `name` | VARCHAR(255) | NOT NULL | Nome do convidado |
| `email` | VARCHAR(255) | | Email do convidado |
| `phone` | VARCHAR(50) | | Telefone do convidado |
| `status` | ENUM | DEFAULT 'pending' | Status: confirmed, pending, declined |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Data de criação |

#### Tabela: `items`

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | Identificador único |
| `event_id` | UUID | FK → events(id), ON DELETE CASCADE | Evento associado |
| `name` | VARCHAR(255) | NOT NULL | Nome do item |
| `price` | DECIMAL(10,2) | NOT NULL, DEFAULT 0 | Preço do item |
| `assigned_to` | JSONB | | Pessoas responsáveis |
| `image` | TEXT | | URL da imagem |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Data de criação |

#### Tabela: `photos`

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | Identificador único |
| `event_id` | UUID | FK → events(id), ON DELETE CASCADE | Evento associado |
| `url` | TEXT | NOT NULL | URL da foto |
| `filename` | VARCHAR(255) | NOT NULL | Nome do arquivo |
| `uploaded_by` | VARCHAR(255) | NOT NULL | Quem fez upload |
| `description` | TEXT | | Descrição da foto |
| `tags` | TEXT[] | | Tags da foto |
| `uploaded_at` | TIMESTAMPTZ | DEFAULT NOW() | Data do upload |

#### Tabela: `contacts`

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | Identificador único |
| `user_id` | UUID | FK → users(id), NOT NULL | Proprietário do contato |
| `name` | VARCHAR(255) | NOT NULL | Nome do contato |
| `email` | VARCHAR(255) | | Email |
| `phone` | VARCHAR(50) | | Telefone |
| `is_favorite` | BOOLEAN | DEFAULT false | Marcado como favorito |
| `avatar` | TEXT | | URL do avatar |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Data de criação |

#### Tabela: `contact_lists`

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | Identificador único |
| `user_id` | UUID | FK → users(id), NOT NULL | Proprietário da lista |
| `name` | VARCHAR(255) | NOT NULL | Nome da lista |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Data de criação |

---

### Estrutura TypeScript (Zustand Store)

\`\`\`typescript
// Interfaces principais usadas no frontend

interface Event {
  id: string
  title: string
  type: string
  category?: string
  date: string
  time: string
  fullDate?: string
  location: string
  description: string
  confirmedGuests: number
  totalGuests: number
  items: Item[]
  guests: Guest[]
  photos: EventPhoto[]
  bannerImage?: string
  createdAt: string
  updatedAt: string
}

interface Guest {
  id: string
  name: string
  email: string
  phone: string
  status: "confirmed" | "pending" | "declined"
  contactId?: string
}

interface Item {
  id: string
  name: string
  price: number
  assignedTo: Person[] | null
  image?: string | null
}

interface EventPhoto {
  id: string
  url: string
  filename: string
  uploadedBy: string
  uploadedAt: string
  description?: string
  tags?: string[]
}

interface Contact {
  id: string
  name: string
  email: string
  phone: string
  isFavorite: boolean
  lists: string[]
  avatar?: string
  createdAt: string
}

interface ContactList {
  id: string
  name: string
  contacts: string[]
  createdAt: string
}
\`\`\`

---

## 4. Instruções de Deploy e Manutenção

### Deploy para Produção (Vercel)

#### Método 1: Via Interface Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login
2. Clique em "Add New Project"
3. Importe o repositório do GitHub
4. Configure as variáveis de ambiente na aba "Environment Variables"
5. Clique em "Deploy"

#### Método 2: Via CLI

\`\`\`bash
# Instale o Vercel CLI
npm i -g vercel

# Faça login
vercel login

# Deploy
vercel --prod
\`\`\`

#### Variáveis de Ambiente para Produção

\`\`\`bash
# Supabase
SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
SUPABASE_JWT_SECRET=your-jwt-secret

# PostgreSQL
POSTGRES_URL=postgres://user:pass@host:5432/db
POSTGRES_DATABASE=postgres
POSTGRES_HOST=db.xxx.supabase.co
POSTGRES_PASSWORD=your-password
POSTGRES_USER=postgres
\`\`\`

---

### Testes

#### Tipos de Testes Implementados

| Tipo | Status | Descrição |
|------|--------|-----------|
| **Unitários** | Planejado | Testes de funções utilitárias e stores |
| **Integração** | Planejado | Testes de fluxos completos |
| **E2E** | Planejado | Testes de interface com Playwright |
| **Manual** | Disponível | Página de testes em `/dashboard/user-testing` |

#### Executando Testes Manuais

1. Acesse `/dashboard/user-testing`
2. Execute os cenários de teste disponíveis
3. Verifique os resultados nos console logs

---

### Manutenção

#### Atualizando Dependências

\`\`\`bash
# Verificar atualizações disponíveis
npm outdated

# Atualizar dependências
npm update

# Atualizar para versões major (cuidado!)
npx npm-check-updates -u
npm install
\`\`\`

#### Monitoramento

- **Vercel Analytics:** Dashboard de performance automático
- **Logs:** Disponíveis no painel Vercel
- **Erros:** Capturados via console do navegador

---

## 5. Dados de Demonstração

### Eventos Pré-carregados

O sistema vem com 5 eventos de exemplo para demonstração:

| # | Evento | Tipo | Data | Convidados | Orçamento |
|---|--------|------|------|------------|-----------|
| 1 | Casamento Maria & João | Casamento | 15/03/2025 | 150 (120 confirmados) | R$ 28.000 |
| 2 | Aniversário 15 Anos Ana | Aniversário | 20/04/2025 | 100 (80 confirmados) | R$ 14.000 |
| 3 | Tech Summit | Corporativo | 10/05/2025 | 250 (200 confirmados) | R$ 10.000 |
| 4 | Formatura Turma 2025 | Formatura | 25/06/2025 | 200 (180 confirmados) | R$ 22.000 |
| 5 | Chá de Bebê Beatriz | Chá de Bebê | 30/03/2025 | 60 (50 confirmados) | R$ 8.000 |

### Contatos de Exemplo

| Nome | Email | Telefone | Favorito |
|------|-------|----------|----------|
| João Silva | joao@example.com | (11) 98765-4321 | Sim |
| Maria Oliveira | maria@example.com | (11) 91234-5678 | Sim |
| Pedro Santos | pedro@example.com | (11) 99876-5432 | Não |
| Ana Costa | ana@example.com | (11) 95555-4444 | Não |
| Lucas Ferreira | lucas@example.com | (11) 93333-2222 | Não |

---

## 6. Fluxo do Usuário

\`\`\`
┌─────────────────────────────────────────────────────────────────────────┐
│                         FLUXO DO USUÁRIO                                │
└─────────────────────────────────────────────────────────────────────────┘

    ┌─────────┐
    │  START  │
    └────┬────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│  Landing Page   │────►│  Login/Registro │
│       (/)       │     │  ou Modo Demo   │
└─────────────────┘     └────────┬────────┘
                                 │
                                 ▼
                     ┌───────────────────────┐
                     │      Dashboard        │
                     │  (Visão Geral)        │
                     └───────────┬───────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Criar Evento   │     │   Ver Evento    │     │   Calendário    │
│                 │     │   (Detalhes)    │     │                 │
└────────┬────────┘     └────────┬────────┘     └─────────────────┘
         │                       │
         │              ┌────────┴────────┐
         │              │                 │
         ▼              ▼                 ▼
┌─────────────────┐  ┌──────────┐  ┌──────────────┐
│ Gerenciar       │  │ Gerenciar│  │ Gerenciar    │
│ Convidados      │  │ Itens    │  │ Fotos        │
└─────────────────┘  └──────────┘  └──────────────┘
         │
         ▼
┌─────────────────┐
│  Enviar Convite │
│  (Link Público) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Convidado      │
│  Confirma/Recusa│
└─────────────────┘
\`\`\`

---

## 7. Segurança

### Práticas Implementadas

- **Autenticação:** JWT via Supabase Auth
- **Autorização:** Row Level Security (RLS) no banco
- **Validação:** Zod schemas para inputs
- **Sanitização:** Escape de HTML em inputs
- **HTTPS:** Forçado via Vercel

### Row Level Security (Exemplo)

\`\`\`sql
-- Política: Usuários só veem seus próprios eventos
CREATE POLICY "Users can view own events"
ON events FOR SELECT
USING (auth.uid() = user_id);

-- Política: Usuários só podem editar seus próprios eventos
CREATE POLICY "Users can update own events"
ON events FOR UPDATE
USING (auth.uid() = user_id);
\`\`\`

---

## 8. Suporte e Contato

- **Documentação:** Este arquivo
- **Issues:** GitHub Issues do repositório
- **Email:** suporte@planejaplus.com.br

---

*Documentação gerada em 26/11/2025*
*Versão do Sistema: 1.0.0*
