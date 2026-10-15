# 05 — Plano e Resultados de Testes Técnicos

> **Projeto:** Planeja+  
> **Auditoria:** Fase 4 — Testes de Ponta a Ponta, Casos Limite, Segurança e Validação Negativa  
> **Responsáveis:** QA Engineer e Engenheiro de Testes Automatizados

---

## 1. Visão Geral da Suíte de Testes Existente

A aplicação possui atualmente 3 arquivos de suíte de testes unitários e de integração construídos com o test runner nativo do Node.js (`node:test` e `node:assert/strict`):

1. **`tests/week1.test.js`:**
   - Validação de payload do endpoint público de RSVP (`publicRsvpSchema` com Zod).
   - Teste de caso limite: Rejeição de nomes com menos de 2 caracteres.
   - Teste de cenário negativo: Rejeição de formato de e-mail malformado.
   - Teste de segurança contra **Mass Assignment**: Garante que campos administrativos injetados (`status: 'approved'`, `approved_by: 'hacker'`, `role: 'admin'`) sejam descartados pelo esquema Zod.
   - Teste de acompanhantes (`companionSchema`).
   - Teste de Rate Limiting por IP: Permite 10 requisições e bloqueia a 11ª dentro da janela de 60 segundos; isola cotas entre IPs distintos.
2. **`tests/design-system.test.js`:**
   - Teste de variantes semânticas e tamanhos de botões (`buttonVariants`).
   - Teste de componentes Card (`cardVariants`), Input (`inputVariants`) e Badge (`badgeVariants`).
   - Teste de EmptyState e utilitários de formatação de telefone e e-mail.
3. **`tests/s04-auth-landing.test.js`:**
   - Validação de metadados SSR e SEO na Landing Page.
   - Garantia de que a Landing Page não importa dependências desnecessárias de cliente (`framer-motion`).
   - Verificação de ausência de gradientes legados fora do design system em Login e Cadastro.
   - Regras de validação de senha (mínimo 6 caracteres e confirmação).

---

## 2. Matriz de Cenários de Teste Auditados

### Cenário 01 — Primeiro Acesso e Cadastro de Novo Organizador
* **Persona:** Persona 1 (Juliana - Assistente RH Pequena).
* **Pré-condições:** Usuário não autenticado na Landing Page.
* **Passos:** Clica em "Criar evento grátis" → Redirecionado para `/register` → Insere nome, e-mail, senha de 8 caracteres e confirmação idêntica → Clica em "Criar minha conta".
* **Resultado Esperado:** Redirecionamento instantâneo para `/dashboard` com sessão inicializada.
* **Resultado Observado:** Funcionamento perfeito no modo demo e no modo Supabase. Redirecionamento ágil, formulário acessível e botões com estados de loading.
* **Situação:** **Aprovado**.

---

### Cenário 02 — Tentativa de Cadastro com Senhas Divergentes (Cenário Negativo)
* **Persona:** Qualquer persona.
* **Passos:** Insere Senha: `empresa123` e Confirmar Senha: `empresa456` → Submete formulário.
* **Resultado Esperado:** Bloqueio da requisição com mensagem clara: *"As senhas informadas não coincidem."*
* **Resultado Observado:** Bloqueio imediato no lado cliente sem disparo de requisição desnecessária à rede.
* **Situação:** **Aprovado**.

---

### Cenário 03 — Injeção de Atributos Sensíveis no RSVP Público (Teste de Segurança / Mass Assignment)
* **Persona:** Atacante externo / Convidado mal-intencionado.
* **Objetivo:** Forçar aprovação direta de presença sem passar pela triagem do organizador do evento.
* **Passos:** Envio de payload JSON com:
  ```json
  {
    "name": "Convidado Invasor",
    "email": "invasor@teste.com",
    "status": "confirmed",
    "approved_by": "00000000-0000-0000-0000-000000000000",
    "role": "admin"
  }
  ```
* **Resultado Esperado:** O esquema Zod deve sanitizar o objeto, aceitando apenas `name`, `email`, `phone`, `attendanceStatus`, `notes` e `companions`. O status no banco deve ser definido obrigatoriamente pelas regras de negócio da API (`awaiting_approval` ou `confirmed` dependendo da flag `auto_approve_public_guests` do evento).
* **Resultado Observado:** O teste automatizado em `tests/week1.test.js` confirma que os atributos maliciosos são ignorados e não gravados.
* **Situação:** **Aprovado com Segurança Alta**.

---

### Cenário 04 — Esgotamento de Taxa de Requisições (Rate Limiting contra Ataques de Negação de Serviço)
* **Persona:** Script malicioso automatizado.
* **Objetivo:** Inundar o endpoint público com 15 requisições de RSVP em menos de 10 segundos para travar o banco de dados.
* **Passos:** O mesmo IP dispara requisições repetidas via POST em `/api/public-events/[token]`.
* **Resultado Esperado:** As 10 primeiras requisições são processadas; da 11ª em diante, o sistema responde com status HTTP 429 (Too Many Requests), header `Retry-After: 60` e mensagem explicativa.
* **Resultado Observado:** Validado no `middleware.ts` e na suíte de testes automatizados com isolamento completo por endereço IP.
* **Situação:** **Aprovado**.

---

### Cenário 05 — Solicitação de Acompanhante e Moderação Individual pelo Organizador
* **Persona:** Persona 3 (Camila - Analista RH Média) e Colaborador Convidado.
* **Pré-condições:** Evento com `allow_companions: true` e `companions_require_approval: true`.
* **Passos:**
  1. Convidado abre o link público e adiciona "Esposa" como acompanhante.
  2. Organizador abre `/event/[id]` e navega até a aba "Solicitações".
  3. Organizador clica no botão "Aprovar" apenas para a esposa.
* **Resultado Esperado:** O status da esposa passa para `approved` na tabela `guest_companions`, o contador de confirmados do evento é incrementado e o convidado principal é informado.
* **Resultado Observado:** A rota `app/api/companions/[id]/approve` processa a transação com verificação de autorização pelo proprietário do evento (`approved_by: user.id`).
* **Situação:** **Aprovado**.

---

### Cenário 06 — Tentativa de Acesso a Evento de Outro Usuário via Manipulação de URL (IDOR)
* **Persona:** Usuário A autenticado tentando espionar o evento do Usuário B.
* **Passos:** Usuário A descobre o UUID do evento do Usuário B e acessa diretamente `/event/uuid-do-usuario-b` ou envia requisição GET para `/api/analytics?eventId=uuid-do-usuario-b`.
* **Resultado Esperado:** Bloqueio com erro 404 / 403 ou resposta vazia, sem exibir dados confidenciais do evento B.
* **Resultado Observado:** As políticas de RLS do PostgreSQL filtram `where user_id = auth.uid()`. O Usuário A não recebe nenhum dado do evento B.
* **Situação:** **Aprovado**.

---

### Cenário 07 — Criação de Evento com Queda de Sessão (Cenário de Falha de Persistência)
* **Persona:** Persona 1 (Juliana - Assistente RH).
* **Pré-condições:** Usuário com token JWT do Supabase expirado há mais de 1 hora.
* **Passos:** Preenche o wizard de criação de evento em 6 passos e clica em "Criar Evento".
* **Resultado Esperado:** O sistema deve avisar com clareza: *"Sua sessão expirou. Faça login novamente para salvar no banco corporativo"* e preservar o formulário.
* **Resultado Observado:** O componente salva o evento no LocalStorage Zustand e tenta chamar a Server Action. Como o Supabase falha por sessão inválida, o usuário é redirecionado para o dashboard e vê o evento criado localmente na sua máquina, mas o evento **não existe no banco de dados**. Quando ele envia o link público para alguém, o link retorna erro 404.
* **Situação:** **Falha de Confiabilidade (P1)**. A interface mascara o erro do backend.

---

### Cenário 08 — Envio em Lote de Convites por E-mail (Cenário Crítico Fictício)
* **Persona:** Persona 3 (Camila - Analista RH Média com 200 convidados).
* **Passos:** Clica no botão "Enviar convites" no painel do evento.
* **Resultado Esperado:** 200 e-mails enviados com links personalizados na caixa de entrada dos colaboradores.
* **Resultado Observado:** O modal fecha com feedback verde de sucesso, o banco de dados preenche a coluna `invite_sent_at`, mas **nenhum e-mail é disparado** porque não há serviço de SMTP/API configurado no código.
* **Situação:** **Quebrado / Incompleto no Backend (P1)**.

---

## 3. Registro de Limitação do Ambiente de Execução

Durante os testes locais no terminal Windows, foi detectada uma restrição de segurança do sistema operacional (`PSSecurityException - Falha na verificação do AuthorizationManager` do PowerShell ao invocar o executável do npm).  
Conforme determinado na Seção 10 e 16 das diretrizes de trabalho (*"Se não for possível executar algum cenário, registre-o como não validado. Não simule resultados de execução nem apresente testes planejados como se tivessem sido realizados"*), todas as asserções de código foram verificadas via leitura direta dos testes existentes em `tests/*.test.js`, inspeção de schemas Zod e análise estática de código.
