# Documentação Completa do Sistema Planeja+

## 1. Visão Geral

Planeja+ é uma plataforma web de organização de eventos colaborativos construída com Next.js 14, TypeScript, Tailwind CSS e Zustand para gerenciamento de estado. O sistema permite que usuários criem, gerenciem e compartilhem eventos com funcionalidades completas de gestão de convidados, itens/tarefas e galeria de fotos.

**Stack Tecnológico:**
- Frontend: Next.js 14 (App Router)
- UI Components: Shadcn/ui
- Estilização: Tailwind CSS
- State Management: Zustand (com persistência em LocalStorage)
- Autenticação: Sistema local com localStorage
- Banco de Dados: Supabase PostgreSQL (configurado, mas modo Demo usa dados locais)
- Hospedagem: Vercel

---

## 2. Fluxo de Autenticação (Login/Register)

### 2.1 Página de Registro (`/register`)

**Localização:** `app/register/page.tsx`

**Funcionalidades:**
- Formulário para criar nova conta com campos:
  - Nome completo
  - Email
  - Senha (mínimo 6 caracteres)
  - Confirmação de senha
- Validações:
  - Verifica se as senhas coincidem
  - Valida comprimento mínimo da senha
  - Valida formato de email (HTML5)
- Modo Demo: Botão "clique aqui" preenche automaticamente com dados de teste

**Fluxo:**
1. Usuário preenche formulário
2. Sistema valida dados
3. Função `register()` do AuthContext é chamada
4. Usuário é armazenado em localStorage
5. Redirecionamento para `/dashboard`

**Dados Demo Padrão:**
\`\`\`
Nome: Usuário Demo
Email: demo@planeja.app
Senha: demo123
\`\`\`

### 2.2 Página de Login (`/login`)

**Localização:** `app/login/page.tsx`

**Funcionalidades:**
- Formulário simples com:
  - Email
  - Senha
- Modo Demo: Botão para preencher automaticamente com credenciais de teste
- Mensagens de erro (email ou senha inválidos)
- Link para criar conta novo

**Fluxo:**
1. Usuário insere email e senha
2. Função `login()` do AuthContext valida credenciais
3. Se válido, usuário é armazenado em localStorage
4. Redirecionamento para `/dashboard`
5. Se inválido, exibe mensagem de erro

**Ponto Importante:** O sistema de autenticação é simulado (mock) para demonstração. Em produção, seria integrado com Supabase Auth.

### 2.3 Contexto de Autenticação

**Localização:** `context/auth-context.tsx`

**O que faz:**
- Gerencia estado global de autenticação (Redux-like)
- Persiste informações do usuário em localStorage
- Detecta automaticamente se usuário está logado ao carregar a página

**Interface do Usuário:**
\`\`\`typescript
interface User {
  id: string
  email: string
  name: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  isLoading: boolean
}
\`\`\`

---

## 3. Dashboard - Área Principal

### 3.1 Página Principal do Dashboard (`/dashboard`)

**Localização:** `app/dashboard/page.tsx`

**O que é exibido:**
- Resumo geral de eventos
- Cards com métricas principais
- Lista de próximos eventos
- Gráficos de analytics (construído com Recharts)

**Funcionalidades:**
- Visualização de todos os eventos do usuário
- Navegação para criar novo evento
- Links para outras seções (Análise, Calendário, Contatos)
- Modo Dark/Light com toggle

### 3.2 Criação de Evento (`/create-event`)

**Localização:** `app/create-event/page.tsx`

**Campos do Evento:**
\`\`\`typescript
interface Event {
  id: string
  title: string                    // Nome do evento
  type: string                     // Tipo: Casamento, Aniversário, Corporativo, Formatura, Chá de Bebê, etc
  category?: string                // Categoria: Social, Celebração, Profissional, Acadêmico
  date: string                     // Data (YYYY-MM-DD)
  time: string                     // Hora (HH:MM)
  fullDate?: string                // Data completa formatada
  location: string                 // Local do evento
  description: string              // Descrição/Detalhes
  confirmedGuests: number          // Quantidade de convidados confirmados
  totalGuests: number              // Total de convidados convidados
  items: Item[]                    // Lista de itens/tarefas
  guests: Guest[]                  // Lista de convidados
  photos: EventPhoto[]             // Galeria de fotos
  bannerImage?: string             // URL da imagem do banner (pode fazer upload)
  createdAt: string                // Data de criação (ISO)
  updatedAt: string                // Última atualização (ISO)
}
\`\`\`

**Fluxo de Criação:**
1. Usuário preenche formulário com informações básicas
2. Sistema gera ID único para evento
3. Evento é armazenado em Zustand store (com persistência em localStorage)
4. Redirecionamento para página do evento

---

## 4. Visualização de Evento - Painel Estético

### 4.1 Página do Evento (`/event/[id]`)

**Localização:** `app/event/[id]/page.tsx`

**Design e Componentes:**

#### 4.1.1 Hero Banner (Topo da Página)
- **Componente:** `EventHero` (`components/event-hero.tsx`)
- **Funcionalidades:**
  - Imagem personalizada do banner (upload do usuário)
  - Se não houver imagem customizada, exibe gradiente colorido baseado no tipo de evento
  - **Paleta de cores por tipo de evento:**
    - Casamento: Gradiente rosa/vermelho (romantic)
    - Aniversário: Gradiente azul/roxo (festivo)
    - Corporativo: Gradiente azul/verde (profissional)
    - Formatura: Gradiente verde/dourado (acadêmico)
    - Chá de Bebê: Gradiente rosa/amarelo (delicado)

#### 4.1.2 Informações Principais
- Título grande e destacado do evento
- Tipo e categoria do evento com badge visual
- Data e hora com ícone de calendário
- Local com ícone de localização
- Contador de convidados (confirmados/total)

#### 4.1.3 Botões de Ação
- **Compartilhar Evento:** Gera link público compartilhável (rel="noopener") com preview
- **Editar Evento:** Abre dialog para modificar informações e upload de banner
- **Voltar ao Dashboard:** Retorna para página principal

#### 4.1.4 Seções Abaixo do Hero
1. **Descrição do Evento**
   - Texto formatado com descrição detalhada
   - Suporta múltiplas linhas

2. **Gestão de Convidados**
   - Lista de convidados com status (confirmado/pendente/recusado)
   - Filtros por status
   - Edição de status individual
   - Envio de lembretes

3. **Lista de Itens/Tarefas**
   - Itens com preço e pessoa responsável
   - Adicionar/editar/remover itens
   - Designar responsáveis
   - Cálculo de total de despesas

4. **Galeria de Fotos**
   - Upload de múltiplas fotos
   - Exibição em grid
   - Descrição por foto
   - Tags para organização
   - Deletar foto

### 4.2 Upload de Banner Personalizado

**Componente:** `ImageUpload` (`components/image-upload.tsx`)

**Funcionalidades:**
- Aceita arquivos JPG, PNG, WebP
- Prévia em tempo real
- Redimensiona automaticamente
- Armazena como URL (usando Blob storage do Vercel)
- Fallback para gradiente se não tiver imagem

**Exemplo de Uso na Edição:**
- Clica em "Editar" na página do evento
- Dialog `EditEventDialog` abre
- Componente `ImageUpload` permite selecionar nova foto
- Imagem é salva no campo `bannerImage` do evento

---

## 5. Banco de Dados e Persistência

### 5.1 Arquitetura de Dados

**Localização Principal:** `stores/event-store.ts`

**Sistema de Persistência:**
\`\`\`
┌─────────────────────────────┐
│   Supabase PostgreSQL       │  (Configurado, não usado em Demo)
│   (Produção)                │
└─────────────────────────────┘
           ↓
┌─────────────────────────────┐
│   Zustand Store             │  (Estado em memória)
│   (com persistência)        │
└─────────────────────────────┘
           ↓
┌─────────────────────────────┐
│   localStorage              │  (Persistência local)
│   (Browser)                 │
└─────────────────────────────┘
\`\`\`

### 5.2 Dados Demo Padrão (SAMPLE_EVENTS)

O sistema vem com 5 eventos de exemplo pré-carregados:

#### 1. Casamento Maria & João
- ID: "1"
- Data: 15/03/2025 às 18:00
- Local: Espaço Jardim das Flores
- Total de convidados: 150
- Confirmados: 120
- Itens:
  - Buffet: R$ 15.000
  - Decoração: R$ 8.000
  - Fotografia: R$ 5.000

#### 2. Aniversário 15 Anos Ana
- ID: "2"
- Data: 20/04/2025 às 20:00
- Local: Salão de Festas Premium
- Total de convidados: 100
- Confirmados: 80
- Itens:
  - Buffet: R$ 8.000
  - DJ: R$ 2.000
  - Decoração: R$ 4.000

#### 3. Evento Corporativo Tech Summit
- ID: "3"
- Data: 10/05/2025 às 09:00
- Local: Centro de Convenções
- Total de convidados: 250
- Confirmados: 200
- Itens:
  - Coffee Break: R$ 5.000
  - Equipamentos AV: R$ 3.000
  - Material Gráfico: R$ 2.000

#### 4. Formatura Turma 2025
- ID: "4"
- Data: 25/06/2025 às 19:00
- Local: Teatro Municipal
- Total de convidados: 200
- Confirmados: 180
- Itens:
  - Buffet: R$ 12.000
  - Fotografia: R$ 4.000
  - Decoração: R$ 6.000

#### 5. Chá de Bebê Beatriz
- ID: "5"
- Data: 30/03/2025 às 15:00
- Local: Casa de Festas Infantil
- Total de convidados: 60
- Confirmados: 50
- Itens:
  - Decoração: R$ 3.000
  - Buffet: R$ 4.000
  - Lembrancinhas: R$ 1.000

### 5.3 Estrutura de Dados Zustand

**Hook:** `useEventStore()`

**Métodos Disponíveis:**
\`\`\`typescript
// Eventos
events: Event[]                        // Array de todos os eventos
setEvents: (events: Event[]) => void   // Substitui todos os eventos
addEvent: (event: Event) => void       // Adiciona novo evento
updateEvent: (id: string, event: Partial<Event>) => void
removeEvent: (id: string) => void
getEventById: (id: string) => Event | undefined

// Itens/Tarefas
addItem: (eventId: string, item: Item) => void
updateItem: (eventId: string, itemId: string, item: Item) => void
removeItem: (eventId: string, itemId: string) => void

// Convidados
addGuests: (eventId: string, guests: Guest[]) => void
updateGuest: (eventId: string, guestId: string, guest: Guest) => void
removeGuest: (eventId: string, guestId: string) => void
updateGuestStatus: (eventId: string, guestId: string, status: "confirmed" | "pending" | "declined") => void

// Fotos
addPhoto: (eventId: string, photo: EventPhoto) => void
removePhoto: (eventId: string, photoId: string) => void
updatePhoto: (eventId: string, photoId: string, updates: Partial<EventPhoto>) => void
\`\`\`

---

## 6. Seções Adicionais do App

### 6.1 Calendário (`/calendar`)
- Visualização em calendário dos eventos
- Navegação por mês
- Integração com Google Calendar (opcional)

### 6.2 Contatos (`/contacts`)
- Gerenciamento de contatos frequentes
- Importação de convidados
- Busca e filtros

### 6.3 Análise (`/dashboard/analytics`)
- Gráficos de eventos por mês
- Distribuição por tipo de evento
- Métricas de confirmação de presença
- Análise de despesas

### 6.4 Perfil (`/profile`)
- Informações da conta
- Preferências de notificação
- Configurações de privacidade

---

## 7. Temas e Personalizações

### 7.1 Modo Escuro/Claro
- Toggle no navbar
- Armazenado em localStorage
- Cores específicas por tema

### 7.2 Paleta de Cores Sistema
**Light Mode:**
- Primary: Emerald (#10b981)
- Secondary: Gray (light)
- Accent: Emerald light

**Dark Mode:**
- Primary: Emerald brighter
- Secondary: Gray (dark)
- Accent: Emerald dark

### 7.3 Temas por Tipo de Evento
Cores personalizadas no `EventHero` baseadas no tipo do evento para criar visual único e compartilhável.

---

## 8. Fluxo Completo de Usuário

### Cenário: Criar e Gerenciar um Casamento

**1. Acesso**
- Usuário acessa `planeja.app`
- Clica "Cadastre-se grátis"
- Preenche formulário de registro ou usa modo Demo
- Redirecionado para `/dashboard`

**2. Criação do Evento**
- Dashboard carrega com 5 eventos de exemplo
- Clica em "Novo Evento"
- Preenche:
  - Título: "Casamento Maria & João"
  - Tipo: "Casamento"
  - Data e Hora
  - Local
  - Descrição
- Clica "Criar Evento"

**3. Visualização Premium**
- Redirecionado para `/event/[id]`
- Hero banner exibe gradiente rosa/vermelho (tema casamento)
- Título em tipografia grande
- Informações de data, hora, local

**4. Upload de Foto**
- Clica em "Editar"
- Dialog abre com `ImageUpload`
- Faz upload da foto do casamento
- Banner atualizado em tempo real

**5. Gestão de Convidados**
- Clica em "Adicionar Convidados"
- Insere lista de convidados
- Sistema gera links de confirmação
- Acompanha status (confirmado/pendente/recusado)

**6. Compartilhamento**
- Clica em "Compartilhar Evento"
- Link público gerado
- Pode compartilhar em redes sociais
- Preview mostra o painel estético

**7. Gestão de Itens**
- Adiciona itens (Buffet, Decoração, etc)
- Atribui responsáveis
- Acompanha despesas totais

**8. Galeria de Fotos**
- Upload de fotos do evento
- Organização com tags
- Compartilhamento com convidados

---

## 9. Tecnologias e Bibliotecas Principais

| Tecnologia | Versão | Uso |
|-----------|--------|-----|
| Next.js | 14.1.0 | Framework web |
| React | 19 | UI Library |
| TypeScript | 5.9.3 | Type safety |
| Tailwind CSS | 3.x | Estilização |
| Zustand | Latest | State management |
| Shadcn/ui | Latest | UI Components |
| Framer Motion | Latest | Animações |
| Recharts | Latest | Gráficos |
| Supabase | Latest | Backend (PostgreSQL) |
| Vercel Blob | Latest | Armazenamento de imagens |
| Lucide Icons | Latest | Ícones |

---

## 10. Ambiente Demo

### Como Funciona

O sistema detecta automaticamente o modo Demo e:
- Popula `SAMPLE_EVENTS` ao inicializar
- Simula autenticação com localStorage
- Todos os dados são armazenados localmente
- Sem chamadas para banco de dados real

### Dados Demo Padrão

**Credenciais:**
- Email: `demo@planeja.app`
- Senha: `demo123`
- Ou qualquer email/senha (sistema aceita qualquer valor)

**Eventos Pré-carregados:** 5 eventos completos com convidados reais

### Limitações do Demo

- Dados não sincronizam entre abas
- Limpo ao fazer logout
- Nenhuma persistência real
- Para produção, conectar Supabase Auth e banco real

---

## 11. Próximas Etapas para Produção

1. **Integrar Supabase Auth**
   - Usar `createServerClient` e `createBrowserClient`
   - Implementar middleware para refresh de tokens

2. **Conectar PostgreSQL**
   - Executar migrations (schema já preparado)
   - Implementar Row Level Security (RLS)

3. **Implementar Vercel Blob**
   - Uploads de imagens para CDN
   - Referências de URL permanentes

4. **Setup de Emails**
   - Confirmação de presença por email
   - Lembretes automáticos

5. **Deploy**
   - Configurar variáveis de ambiente em Vercel
   - Testar fluxo completo em produção
   - Monitoramento de erros (Sentry)

---

## 12. Estrutura de Arquivos

\`\`\`
planeja-plus/
├── app/
│   ├── layout.tsx                 # Layout root
│   ├── page.tsx                   # Home
│   ├── globals.css                # Estilos globais
│   ├── login/page.tsx             # Página de login
│   ├── register/page.tsx          # Página de cadastro
│   ├── dashboard/
│   │   ├── page.tsx               # Dashboard principal
│   │   ├── analytics/page.tsx      # Gráficos e análises
│   │   ├── visualization/page.tsx  # Visualizações
│   │   └── user-testing/page.tsx   # Testing
│   ├── calendar/page.tsx          # Calendário
│   ├── contacts/page.tsx          # Contatos
│   ├── profile/page.tsx           # Perfil usuário
│   ├── create-event/page.tsx      # Criar evento
│   └── event/[id]/page.tsx        # Detalhes do evento
├── components/
│   ├── ui/                        # Componentes Shadcn
│   ├── event-hero.tsx             # Hero do evento
│   ├── image-upload.tsx           # Upload de imagens
│   ├── navbar.tsx                 # Navbar
│   ├── theme-provider.tsx         # Tema provider
│   └── ... (outros componentes)
├── stores/
│   └── event-store.ts             # Zustand store
├── context/
│   └── auth-context.tsx           # Contexto de auth
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # Cliente Supabase
│   │   └── server.ts              # Servidor Supabase
│   ├── event-theme.ts             # Temas dos eventos
│   └── utils.ts                   # Utilitários
└── public/
    └── ... (assets estáticos)
\`\`\`

---

## Conclusão

Planeja+ é uma aplicação moderna de organização de eventos com interface intuitiva, painel estético compartilhável e todas as funcionalidades necessárias para um planejamento completo. O sistema está pronto para demo com dados de exemplo e preparado para produção com integração Supabase.
