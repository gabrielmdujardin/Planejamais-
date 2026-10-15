# 03 — Matriz de Permissões e Níveis de Acesso

> **Projeto:** Planeja+  
> **Auditoria:** Fase 3 — Auditoria de Segurança, Autorização e Governança de Acesso  
> **Objetivo:** Analisar os papéis existentes, contrastar a segurança da interface com a segurança do servidor e mapear as permissões reais necessárias para o modelo B2B.

---

## 1. Papéis de Usuário Existentes no Código

### 1.1 Situação Atual
Ao inspecionar `supabase/schema.sql`, `context/auth-context.tsx` e o middleware:
* **Não existe modelo de papéis (Role-Based Access Control - RBAC) implementado no banco ou na aplicação.**
* Existem apenas 3 estados de acesso em todo o ecossistema:
  1. **Anônimo (Público):** Acessa a Landing Page, Login, Cadastro e a rota `/convite/[token]` para responder RSVP ou solicitar participação.
  2. **Autenticado (Genérico):** Qualquer usuário com login ativo possui acesso irrestrito a todos os recursos dentro do seu próprio escopo de `user_id`. Não há distinção entre Administrador, Gerente, Operador ou Visualizador.
  3. **Service Role (Admin do Sistema):** Chave interna do Supabase utilizada exclusivamente para executar jobs analíticos de backend (`public.job_runs`).

---

## 2. Matriz de Níveis de Acesso: Situação Atual vs. Necessidade B2B

A matriz abaixo mapeia as operações do sistema.
- **Hoje (Real):** Como o código se comporta atualmente.
- **Necessário (B2B):** Como o produto deve operar para atender com segurança empresas (RH) e organizadores de eventos profissionais.

| Dimensão de Operação | Papel Atual (Único) | Operador RH / Assistente | Gerente RH / Decisor | Cerimonialista (Produtor) | Cliente Contratante (Noivos/Diretoria) | Verificação no Servidor (Atual) | Risco Identificado |
|---|---|---|---|---|---|---|---|
| **Visualizar Evento** | Permitido | Permitido | Permitido | Permitido | Permitido (apenas o seu) | Sim (RLS `auth.uid() = user_id`) | Baixo |
| **Criar Novo Evento** | Permitido | Permitido | Permitido | Permitido | Bloqueado | Sim (RLS `INSERT` com `auth.uid()`) | Baixo |
| **Editar Configurações do Evento** | Permitido | Permitido | Permitido | Permitido | Bloqueado | Sim (RLS `UPDATE`) | Médio (Operador pode mudar limites sem aval do gestor) |
| **Excluir Evento** | Permitido | **Bloqueado** | Permitido | Permitido | **Bloqueado** | Sim (RLS `DELETE`) | **Crítico:** Hoje qualquer operador pode deletar um evento de 500 pessoas acidentalmente |
| **Adicionar / Importar Convidados** | Permitido | Permitido | Permitido | Permitido | Bloqueado | Sim (RLS na tabela `guests`) | Baixo |
| **Aprovar Convidado / Acompanhante** | Permitido | Permitido | Permitido | Permitido | Permitido (Apenas acompanhar e sugerir) | Sim (`app/api/companions/[id]/approve`) | Baixo (Fluxo muito bem protegido) |
| **Cadastrar Custos / Fornecedores** | Permitido | Permitido | Permitido | Permitido | **Bloqueado** | Sim (RLS na tabela `items`) | **Alto:** Cliente final hoje veria custos internos se recebesse acesso de login |
| **Aprovar Orçamento Formal** | N/A (Não existe) | Bloqueado | Permitido | Bloqueado | Permitido (Aprova verba) | **Não existe no servidor** | **Alto:** Não há controle de alçada no backend |
| **Exportar Relatórios e Listas** | N/A (Sem botão) | Permitido | Permitido | Permitido | Permitido | **Não existe no servidor** | Médio |
| **Administrar Usuários da Equipe** | N/A (Não existe) | Bloqueado | Permitido | Bloqueado | Bloqueado | **Não existe no servidor** | **Crítico para B2B:** Sem suporte a múltiplos membros na mesma empresa |
| **Acessar Dados Sensíveis (Telefone/Email)** | Permitido | Permitido | Permitido | Permitido | Restrito (Apenas nomes) | Sim (RLS `guests`) | **Médio (LGPD):** Operador tem acesso irrestrito a dados pessoais |
| **Consultar Eventos de Outros Setores/Filiais**| N/A | Bloqueado | Restrito à Unidade | Permitido | Bloqueado | Sim (RLS isola por `user_id`) | **Inflexível:** Isola 100% por conta, impedindo colaboração entre colegas de RH |

---

## 3. Auditoria Técnica de Segurança: Interface vs. Servidor

Conforme a Regra Fundamental da missão (*"A autorização deve ser verificada no servidor, e não somente na interface"*), inspecionamos as barreiras em cada camada:

### 3.1 Camada de Banco de Dados (Supabase RLS)
* **Ponto Forte:** As políticas em `supabase/schema.sql` estão tecnicamente bem construídas. Todas as tabelas sensíveis possuem:
  ```sql
  create policy "Users can view guests of their events" on public.guests
    for select to authenticated
    using (exists (select 1 from public.events e where e.id = guests.event_id and e.user_id = auth.uid()));
  ```
* **Eficácia:** Se um usuário mal-intencionado tentar alterar o `event_id` na requisição para visualizar convidados de outro organizador, o PostgreSQL **rejeita a consulta no nível do banco**, retornando conjunto vazio. Não há vazamento direto entre contas distintas no Supabase.

### 3.2 Camada de Middleware (`middleware.ts`)
* **Falha de Autorização Identificada:**
  * O middleware atua apenas como limitador de taxa (Rate Limiting) e deixa passar rotas administrativas:
  ```typescript
  if (publicPaths.some((path) => pathname === path || pathname.startsWith("/confirm-invitation"))) {
    return NextResponse.next()
  }
  return NextResponse.next() // Todas as rotas privadas passam direto sem checagem de token JWT!
  ```
  * **Consequência:** A verificação de sessão ocorre apenas no cliente via React (`useAuth`). Se o usuário desativar o JavaScript ou manipular o estado local, ele consegue renderizar esqueletos e layouts de páginas privadas antes de qualquer redirecionamento, dependendo unicamente de o backend falhar nas chamadas de API subsequentes.

### 3.3 Camada de API Pública (`app/api/public-events/[token]/route.ts`)
* **Ponto Positivo (Segurança por Design):**
  * O endpoint público não expõe a tabela `events` inteira. Ele seleciona explicitamente colunas públicas:
  ```typescript
  .select("id, title, date, time, location, address, description, public_invite_enabled, rsvp_deadline, allow_companions, max_companions")
  ```
  * Colunas financeiras e sensíveis (`budget_estimated`, `financial_notes`, `initial_estimated_cost`, `user_id`) são **omitidas na query SQL**, impedindo que participantes externos descubram custos internos ou a chave de proprietário do evento via inspecionar elemento / interceptador de requisições.

---

## 4. Divergências e Riscos de Autorização Encontrados

1. **Risco de "Conta Compartilhada" (Shadow Sharing):**
   * Como não há como convidar colegas de equipe para a mesma conta da empresa, profissionais de RH são forçados a compartilhar login e senha (`demo@planeja.app` ou uma senha comum da equipe). Isso quebra completamente a rastreabilidade e viola requisitos básicos de conformidade e auditoria ISO/SOC2.
2. **Ausência de Tenant Organizacional:**
   * O vínculo de tudo no banco é `user_id` (pessoa física). Se a analista de RH que criou a festa de fim de ano for desligada da empresa e sua conta excluída, todos os eventos históricos, métricas de presença e dados de convidados associados são apagados em cascata (`on delete cascade`).
3. **Ausência de Perfil "Somente Leitura" para Clientes:**
   * Uma cerimonialista que deseja mostrar o andamento das confirmações aos noivos precisa mandar prints de tela ou arriscar passar sua senha, expondo outros eventos de outros clientes na mesma listagem.

---

## 5. Recomendações de Arquitetura de Autorização (RBAC para B2B)

Para preparar o produto para comercialização com empresas e cerimoniais, recomendamos a adoção de um modelo baseado em **Organizações e Papéis**:

```
[Organização / Empresa / Cerimonial]
   │
   ├── Membro (Role: Admin / Diretor) ── Acesso irrestrito a orçamentos, auditoria e usuários
   ├── Membro (Role: Gestor / Cerimonialista) ── Cria e edita eventos, aprova despesas
   ├── Membro (Role: Operador / Assistente) ── Gerencia lista de convidados e check-in
   └── Convidado Externo (Role: Client / Noivos) ── Acesso exclusivo com permissão de visualização e moderação de convidados
```
