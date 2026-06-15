# Referencial Teórico

## 1. Introdução

O **Planeja+** é uma plataforma web voltada à organização colaborativa de eventos, reunindo em um único ambiente funcionalidades de criação de eventos, gerenciamento de convidados, confirmação de presença, controle de itens, divisão de responsabilidades, acompanhamento de custos, calendário e visualização de dados. Dessa forma, o projeto se apoia em fundamentos de gestão de eventos, gestão de projetos, colaboração digital, experiência do usuário, engenharia de software, segurança da informação e análise de dados.

O referencial teórico a seguir apresenta os principais conceitos que sustentam o desenvolvimento do sistema e demonstra como eles se relacionam com as funcionalidades implementadas na aplicação.

## 2. Gestão de Eventos

A gestão de eventos envolve o planejamento, a organização, a execução e o acompanhamento de atividades com objetivos, público, recursos e prazos definidos. Segundo Getz e Page (2020), eventos planejados exigem coordenação entre diferentes dimensões, como público participante, infraestrutura, orçamento, comunicação, cronograma e avaliação de resultados.

No contexto do Planeja+, essa fundamentação justifica a centralização das informações do evento em uma única plataforma. Ao permitir o cadastro de data, horário, local, descrição, convidados, itens e imagens, o sistema contribui para reduzir a dispersão de informações que normalmente ocorre quando o planejamento é feito por mensagens, planilhas e anotações manuais.

Allen (2009) destaca que a organização de eventos depende de controle sistemático de tarefas, fornecedores, convidados e custos. Essa visão se relaciona diretamente às funcionalidades de lista de convidados, confirmação de presença, atribuição de responsáveis e controle financeiro presentes no Planeja+.

## 3. Gestão de Projetos Aplicada ao Planejamento de Eventos

O planejamento de eventos pode ser compreendido como uma atividade próxima à gestão de projetos, pois envolve escopo, prazo, recursos, custos, partes interessadas e entregas. O Project Management Institute (2021) define projeto como um esforço temporário realizado para criar um produto, serviço ou resultado único. Essa definição se aplica aos eventos, pois cada casamento, aniversário, formatura, conferência ou reunião possui características próprias, data específica e objetivos definidos.

No Planeja+, os princípios de gestão de projetos aparecem na organização das etapas do evento, na definição de responsabilidades, no acompanhamento de itens necessários e no controle de custos. A criação de dashboards e indicadores também se relaciona ao monitoramento do andamento do planejamento, permitindo que o usuário acompanhe informações relevantes para a tomada de decisão.

## 4. Colaboração Digital e Coordenação de Grupos

Eventos sociais, acadêmicos, familiares e corporativos frequentemente dependem da participação de várias pessoas. A colaboração digital permite que usuários compartilhem informações, acompanhem mudanças e coordenem responsabilidades em ambientes mediados por tecnologia. De acordo com Laudon e Laudon (2022), sistemas de informação contribuem para integrar dados, processos e pessoas, melhorando a comunicação e a eficiência organizacional.

O Planeja+ se enquadra nesse conceito ao oferecer recursos como compartilhamento de links públicos, confirmação de presença, gerenciamento de contatos e organização de responsabilidades. A proposta do sistema é diminuir ruídos de comunicação e oferecer uma fonte única de informação para organizadores e participantes.

Além disso, ferramentas colaborativas favorecem maior transparência no processo de organização. Quando convidados, itens, status de confirmação e custos estão estruturados, o organizador tem mais controle sobre o evento e pode agir com maior previsibilidade.

## 5. Experiência do Usuário e Usabilidade

A experiência do usuário é um fator essencial para sistemas de organização pessoal e colaborativa, pois a utilidade da ferramenta depende da facilidade com que o usuário consegue realizar suas tarefas. Norman (2013) afirma que bons produtos digitais devem ser compreensíveis, funcionais e alinhados às necessidades reais das pessoas. Nielsen (1994) também destaca princípios de usabilidade como visibilidade do estado do sistema, consistência, prevenção de erros e facilidade de reconhecimento.

No Planeja+, esses princípios aparecem na construção de uma interface visual com dashboard, cards de eventos, formulários, modais, filtros, calendários e gráficos. A aplicação busca tornar tarefas complexas, como organizar convidados e controlar itens, mais simples e visuais. A utilização de componentes reutilizáveis, ícones, temas claro/escuro e feedbacks visuais contribui para uma navegação mais intuitiva.

Outro ponto importante é a responsividade. Como o público-alvo pode organizar eventos em diferentes contextos, inclusive pelo celular, a interface precisa se adaptar a diferentes tamanhos de tela. Essa preocupação está alinhada à ideia de acessibilidade e facilidade de uso em aplicações web modernas.

## 6. Engenharia de Software e Arquitetura Web

A engenharia de software fornece métodos, práticas e princípios para criar sistemas confiáveis, manuteníveis e escaláveis. Sommerville (2019) afirma que sistemas de software devem ser desenvolvidos considerando requisitos funcionais, requisitos não funcionais, manutenção, evolução e qualidade. No Planeja+, os requisitos funcionais incluem criar eventos, gerenciar convidados, confirmar presença, organizar itens e visualizar dados; já os requisitos não funcionais envolvem segurança, desempenho, responsividade, manutenibilidade e escalabilidade.

A arquitetura do projeto utiliza **Next.js**, **React**, **TypeScript**, **Tailwind CSS**, **Zustand** e **Supabase/PostgreSQL**. Essa escolha tecnológica favorece modularidade, separação de responsabilidades e evolução incremental. Fowler (2002) defende que padrões de arquitetura ajudam a organizar sistemas corporativos e reduzir acoplamento entre camadas. No Planeja+, essa separação aparece na divisão entre páginas, componentes, serviços, stores, rotas de API, validações e integração com banco de dados.

O uso de TypeScript também contribui para a confiabilidade do sistema, pois adiciona tipagem estática ao desenvolvimento JavaScript, reduzindo erros comuns em tempo de execução. Já o uso de componentes reutilizáveis fortalece a manutenção da interface e evita repetição excessiva de código.

## 7. Qualidade de Software

A qualidade de software pode ser analisada por atributos como funcionalidade, usabilidade, confiabilidade, desempenho, segurança, manutenibilidade e portabilidade. A ISO/IEC 25010 (2011) apresenta um modelo de qualidade que permite avaliar sistemas a partir dessas características.

No Planeja+, a adequação funcional é observada na correspondência entre as funcionalidades do sistema e as necessidades de organização de eventos. A usabilidade está relacionada à clareza dos fluxos de criação, edição e acompanhamento. A segurança se relaciona ao controle de acesso, autenticação, validação de dados e proteção das informações dos usuários. A manutenibilidade aparece na estrutura modular do projeto, no uso de componentes e na organização das camadas da aplicação.

Esses atributos são relevantes porque o sistema lida com dados pessoais de convidados, datas, locais, contatos, imagens e informações financeiras do evento. Portanto, a qualidade do software não se limita ao funcionamento técnico, mas também envolve confiança, estabilidade e clareza para o usuário final.

## 8. Segurança da Informação e Proteção de Dados

Sistemas web que armazenam dados de usuários e convidados precisam considerar princípios de segurança e privacidade. A Lei Geral de Proteção de Dados Pessoais, Lei nº 13.709/2018, estabelece diretrizes para o tratamento de dados pessoais no Brasil, incluindo princípios como finalidade, adequação, necessidade, segurança, transparência e prevenção.

No Planeja+, essa base teórica justifica cuidados com autenticação, autorização, validação de entradas, controle de acesso e proteção das informações pessoais. O uso do Supabase com PostgreSQL permite aplicar políticas de segurança, como Row Level Security, restringindo o acesso aos dados conforme o usuário autenticado.

Além da LGPD, as recomendações da OWASP (2021) são relevantes para aplicações web, pois apontam riscos comuns como falhas de controle de acesso, falhas criptográficas, injeção, configurações inseguras e identificação/autenticação deficientes. Esses riscos devem orientar decisões técnicas relacionadas a validação de formulários, proteção de rotas, armazenamento seguro de credenciais e tratamento adequado de permissões.

## 9. Visualização de Dados e Apoio à Decisão

A visualização de dados transforma informações brutas em representações visuais que auxiliam a compreensão e a tomada de decisão. Few (2012) defende que dashboards devem apresentar informações relevantes de forma clara, objetiva e acionável. Para um sistema de eventos, isso significa permitir que o organizador compreenda rapidamente métricas como quantidade de convidados, confirmações, pendências, distribuição de eventos e custos.

No Planeja+, os dashboards e gráficos contribuem para que o usuário acompanhe o status do planejamento sem depender de cálculos manuais. A visualização de dados também fortalece a previsibilidade, pois permite identificar atrasos, pendências e excesso de gastos durante a preparação do evento.

## 10. Metodologias Ágeis no Desenvolvimento do Sistema

O desenvolvimento de uma plataforma como o Planeja+ pode se beneficiar de práticas ágeis, principalmente por envolver evolução contínua de funcionalidades e validação com usuários. O Manifesto Ágil (BECK et al., 2001) valoriza indivíduos e interações, software em funcionamento, colaboração com o cliente e resposta a mudanças. Esses princípios se alinham ao desenvolvimento incremental de funcionalidades como criação de eventos, convites, dashboards, calendário e automações.

Pressman e Maxim (2020) destacam que métodos ágeis favorecem entregas frequentes e adaptação a mudanças de requisitos. Para o Planeja+, essa abordagem é adequada porque o sistema pode evoluir conforme novas necessidades forem identificadas, como integração com pagamentos, notificações push, inteligência artificial para previsão de presença e automações de lembretes.

## 11. Relação entre Teoria e Funcionalidades do Planeja+

| Fundamento teórico | Aplicação no Planeja+ |
| --- | --- |
| Gestão de eventos | Cadastro de eventos, convidados, itens, custos, fotos e responsabilidades |
| Gestão de projetos | Organização por escopo, prazo, recursos, acompanhamento e indicadores |
| Colaboração digital | Compartilhamento de links, RSVP, contatos e coordenação entre participantes |
| Usabilidade e UX | Interface visual, responsiva, com formulários, cards, modais, filtros e dashboards |
| Engenharia de software | Arquitetura modular com Next.js, TypeScript, componentes, stores e serviços |
| Qualidade de software | Segurança, manutenibilidade, confiabilidade, desempenho e adequação funcional |
| Segurança da informação | Autenticação, controle de acesso, validação de dados e conformidade com LGPD |
| Visualização de dados | Dashboards, gráficos e métricas para apoio à decisão |
| Métodos ágeis | Evolução incremental e adaptação a novas funcionalidades |

## 12. Considerações Finais

O referencial teórico demonstra que o Planeja+ não é apenas uma aplicação de cadastro de eventos, mas uma solução apoiada em conceitos de gestão, colaboração, tecnologia e experiência do usuário. Ao centralizar informações, estruturar tarefas, acompanhar confirmações e apresentar indicadores visuais, o sistema busca resolver problemas reais de organização e comunicação em eventos colaborativos.

Assim, a fundamentação apresentada sustenta tanto a relevância prática do projeto quanto suas decisões técnicas, demonstrando que a proposta combina princípios de gestão de eventos com boas práticas de desenvolvimento de software moderno.

## Referências

ALLEN, Judy. *Event planning: the ultimate guide to successful meetings, corporate events, fundraisers, and parties*. 2. ed. Hoboken: John Wiley & Sons, 2009.

BECK, Kent et al. *Manifesto for Agile Software Development*. 2001. Disponível em: <https://agilemanifesto.org/>. Acesso em: 15 jun. 2026.

BRASIL. *Lei nº 13.709, de 14 de agosto de 2018*. Lei Geral de Proteção de Dados Pessoais (LGPD). Brasília, DF: Presidência da República, 2018.

FEW, Stephen. *Information dashboard design: displaying data for at-a-glance monitoring*. 2. ed. Burlingame: Analytics Press, 2012.

FOWLER, Martin. *Patterns of enterprise application architecture*. Boston: Addison-Wesley, 2002.

GETZ, Donald; PAGE, Stephen J. *Event studies: theory, research and policy for planned events*. 4. ed. London: Routledge, 2020.

ISO/IEC. *ISO/IEC 25010:2011: Systems and software engineering: Systems and software Quality Requirements and Evaluation (SQuaRE): System and software quality models*. Geneva: ISO, 2011.

LAUDON, Kenneth C.; LAUDON, Jane P. *Management information systems: managing the digital firm*. 17. ed. Harlow: Pearson, 2022.

NIELSEN, Jakob. *Usability engineering*. San Francisco: Morgan Kaufmann, 1994.

NORMAN, Donald A. *The design of everyday things*. Revised and expanded edition. New York: Basic Books, 2013.

OWASP FOUNDATION. *OWASP Top 10: the ten most critical web application security risks*. 2021. Disponível em: <https://owasp.org/www-project-top-ten/>. Acesso em: 15 jun. 2026.

PRESSMAN, Roger S.; MAXIM, Bruce R. *Software engineering: a practitioner's approach*. 9. ed. New York: McGraw-Hill Education, 2020.

PROJECT MANAGEMENT INSTITUTE. *A guide to the Project Management Body of Knowledge (PMBOK Guide)*. 7. ed. Newtown Square: Project Management Institute, 2021.

SOMMERVILLE, Ian. *Software engineering*. 10. ed. Harlow: Pearson, 2019.

## 13. Kanban no GitHub

O projeto **Planejamais** utiliza o GitHub como ferramenta de apoio ao fluxo Kanban, aplicando conceitos simples de maneira prática e integrada ao desenvolvimento. Abaixo estão os principais pontos adotados:

- **Issues como cartões**: Cada tarefa ou funcionalidade foi criada como uma *Issue* no repositório. O título descreve a tarefa e o corpo contém detalhes, critérios de aceitação e referências.
- **Projects (Board)**: Foi habilitado o recurso *GitHub Projects (beta)* no repositório, configurado como um quadro Kanban com as colunas **Backlog**, **Em progresso** e **Concluído**. As *Issues* são movidas entre as colunas de acordo com seu status.
- **WIP limit**: Embora o GitHub não ofereça limite de trabalho em progresso nativo, o time adotou a prática de limitar manualmente a quantidade de cartões na coluna *Em progresso* a **3**. Quando o limite é atingido, novas tarefas permanecem em *Backlog* até que algum cartão seja concluído.
- **Etiquetas (Labels)**: Foram criadas etiquetas para categorizar as tarefas: `feature`, `bug`, `enhancement`, `priority:high`, `priority:low`. As etiquetas ajudam a filtrar o board e priorizar itens críticos.
- **Milestones**: Cada sprint ou ciclo de entrega recebeu um *Milestone* no GitHub. As *Issues* são associadas ao *Milestone* correspondente, permitindo visualizar o progresso do sprint no relatório de *burndown*.
- **Pull Requests como “Done”**: Quando uma *Issue* é resolvida, um *Pull Request* é aberto vinculando‑a. Ao mesclar o PR, a *Issue* é automaticamente movida para a coluna **Concluído** e o estado é fechado, completando o ciclo Kanban.
- **Automação via GitHub Actions**: Um workflow simples foi criado para validar que a *Issue* vinculada ao PR tem a label `ready-for-review` antes de permitir o merge, reforçando a disciplina do fluxo.

Essas práticas mantêm todo o time visível sobre o que está sendo trabalhado, facilitam a priorização e permitem que o histórico de decisões fique registrado diretamente no repositório, integrando gestão de projeto e desenvolvimento de código em um único lugar.

> **Observação**: O Kanban adotado aqui é deliberadamente simples, focado em melhorar a comunicação e fluxo de trabalho sem introduzir ferramentas externas complexas. A equipe pode evoluir para recursos mais avançados (por exemplo, automações de limites WIP ou integração com métricas de lead time) conforme a necessidade.
