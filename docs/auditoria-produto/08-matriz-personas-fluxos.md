# 08 — Matriz Cruzada de Personas versus Fluxos

> **Projeto:** Planeja+  
> **Auditoria:** Fase 7 — Análise de Cobertura, Fricção e Aderência  
> **Convenção de Legenda:**  
> - **[ V ] Totalmente Atendido:** O fluxo atende integralmente às necessidades da persona com fluidez e segurança.  
> - **[ P ] Parcialmente Atendido:** O fluxo funciona, mas possui limitações relevantes de usabilidade, regras ou volume.  
> - **[ X ] Incompleto ou Quebrado:** Falta etapa essencial para a persona concluir seu objetivo.  
> - **[ D ] Desalinhado com o Perfil:** O fluxo foi desenhado para outra proposta e causa atrito ou constrangimento no perfil.  
> - **[ - ] Não Aplicável:** A persona não executa nem necessita deste fluxo em sua rotina.

---

## 1. Matriz Geral de Cobertura

| Persona | FL-01 (Auth) | FL-04 (Criação) | FL-08 (Painel) | FL-09 (Add Manual) | FL-10 (Import CSV) | FL-11 (Disparo) | FL-12/13 (RSVP) | FL-15 (Acomp.) | FL-17 (Financeiro) | FL-18 (Analytics) | FL-19 (Agenda) | FL-21 (Portaria) | Cobertura Geral |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **P1: Assistente RH (Pequena)** | V | V | V | V | P | X | V | V | **D** | P | V | - | **68%** |
| **P2: Gerente RH (Pequena)** | V | - | P | - | - | - | - | - | **D** | V | P | - | **60%** |
| **P3: Analista RH (Média)** | V | P | P | P | **X** | **X** | V | V | **D** | V | V | P | **50%** |
| **P4: Gerente RH (Média)** | P | - | P | - | - | - | - | - | **D** | V | P | - | **52%** |
| **P5: Especialista RH (Grande)**| P | P | P | P | **X** | **X** | P | P | **D** | P | P | **X** | **35%** |
| **P6: Diretor RH (Grande)** | **X** | - | - | - | - | - | - | - | **D** | P | - | - | **25%** |
| **P7: Produtora Pequena** | V | V | V | V | P | X | V | V | **P** | V | V | - | **75%** |
| **P8: Cerimonialista (Casamento)**| V | P | P | P | **X** | **X** | V | V | **D** | V | V | P | **58%** |
| **P9: Comercial de Espaço/Buffet**| V | V | P | - | - | - | V | - | P | V | V | - | **70%** |
| **P10: Cliente Contratante (Noivos)**| - | - | **P** | - | - | - | V | V | **D** | P | - | - | **45%** |

---

## 2. Diagnóstico Estruturado por Grupo de Personas

### 2.1 Empresas Pequenas (Personas 1 e 2)
* **Diagnóstico:** É o grupo **com maior índice de sucesso imediato no produto atual (60% a 70% de cobertura)**.
* **Por que funciona bem:** Pequenas empresas não exigem hierarquia de cargos no sistema, não precisam de importação massiva de planilhas (uma lista de 20 pessoas é rápida de cadastrar) e adoram o link público que não exige senha do colaborador.
* **O que impede a nota 10:** A presença das palavras *"rateio colaborativo"* na tela de gastos e a falta de disparo real de e-mails.

### 2.2 Empresas Médias (Personas 3 e 4)
* **Diagnóstico:** Apresentam **gargalos severos de escala operacional (50% de cobertura)**.
* **O maior gargalo:** A falta de importação de lista de convidados em CSV (FL-10). Um analista de RH de uma empresa de 250 funcionários não aceitará cadastrar a equipe um a um.
* **O que surpreende positivamente:** O fluxo de moderação de acompanhantes (FL-15) e o painel de Analytics com cálculo automático de risco atendem com excelência as expectativas do Gerente de RH.

### 2.3 Empresas Grandes e Corporações (Personas 5 e 6)
* **Diagnóstico:** **Inviável para adoção imediata (25% a 35% de cobertura)**.
* **Por que não atende hoje:** A ausência de suporte multi-tenant (múltiplas filiais na mesma empresa), a falta de Single Sign-On (SSO / Azure AD / Okta), a falta de perfis de permissão (RBAC) e a ausência de check-in na portaria via QR Code tornam o produto incompatível com os critérios de homologação de grandes departamentos de TI e Compliance.

### 2.4 Empresas de Eventos, Produtoras e Cerimoniais (Personas 7, 8, 9 e 10)
* **Diagnóstico:** **Excelente potencial com ajustes cirúrgicos (55% a 75% de cobertura)**.
* **Pontos de Destaque:** A gestão de convidados, prazos de RSVP, acompanhantes e a visão integrada de calendário atendem perfeitamente à rotina de produtoras independentes.
* **Ajuste Indispensável:** Transformar o módulo financeiro de "Rateio" em "Gestão de Fornecedores e Orçamento", e criar o "Link do Anfitrião" (Host Token) para que noivos e anfitriões possam acompanhar presenças sem ter acesso administrativo ao sistema.
