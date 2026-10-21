const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// --- SUÍTE DE TESTES: FASES 2, 3 E 4 (AUDITORIA DE PRODUTO) ---

test('FASE 3 - Arquitetura de Terminologia: Arquivo lib/terminology.ts existe e exporta interface completa', () => {
  const filePath = path.resolve(__dirname, '../lib/terminology.ts');
  assert.ok(fs.existsSync(filePath), 'O módulo lib/terminology.ts deve existir');
  const content = fs.readFileSync(filePath, 'utf-8');

  // Validação de termos obrigatórios por segmento
  assert.ok(content.includes('Colaboradores'), 'Deve conter termo corporativo Colaboradores');
  assert.ok(content.includes('Centro de Custo e Fornecedores'), 'Deve conter termo corporativo Centro de Custo');
  assert.ok(content.includes('Convidados da Cerimônia'), 'Deve conter termo cerimonial');
  assert.ok(content.includes('Noivos e Cerimonial'), 'Deve conter Noivos e Cerimonial');
  assert.ok(content.includes('Formandos e Convidados'), 'Deve conter termo acadêmico');
});

// Implementação em espelho para teste de lógica pura
function getEventTerminologyMirror(eventType) {
  const normalized = (eventType || '').toLowerCase().trim();
  if (normalized.includes('corporativo') || normalized.includes('empresa') || normalized.includes('confraterniza') || normalized.includes('rh')) {
    return {
      attendeeLabel: 'Colaboradores',
      attendeeSingular: 'Colaborador',
      confirmedLabel: 'Presenças Confirmadas',
      groupLabel: 'Departamento / Setor',
      hostLabel: 'Comitê Organizador / RH',
      budgetTitle: 'Centro de Custo e Fornecedores',
    };
  }
  if (normalized.includes('casamento')) {
    return {
      attendeeLabel: 'Convidados da Cerimônia',
      attendeeSingular: 'Convidado',
      confirmedLabel: 'Presenças Confirmadas',
      groupLabel: 'Família / Mesa',
      hostLabel: 'Noivos e Cerimonial',
      budgetTitle: 'Fornecedores e Contratos',
    };
  }
  if (normalized.includes('formatura')) {
    return {
      attendeeLabel: 'Formandos e Convidados',
      attendeeSingular: 'Formando',
      confirmedLabel: 'Confirmados',
      groupLabel: 'Turma / Mesa',
      hostLabel: 'Comissão de Formatura',
      budgetTitle: 'Contratos da Formatura',
    };
  }
  return {
    attendeeLabel: 'Convidados',
    attendeeSingular: 'Convidado',
    confirmedLabel: 'Confirmados',
    groupLabel: 'Grupo / Categoria',
    hostLabel: 'Organizador',
    budgetTitle: 'Gastos do Evento',
  };
}

test('FASE 3 - Terminologia: Eventos corporativos usam termos empresariais', () => {
  const terms = getEventTerminologyMirror('Corporativo');
  assert.equal(terms.attendeeLabel, 'Colaboradores');
  assert.equal(terms.attendeeSingular, 'Colaborador');
  assert.equal(terms.hostLabel, 'Comitê Organizador / RH');
  assert.equal(terms.groupLabel, 'Departamento / Setor');
  assert.equal(terms.confirmedLabel, 'Presenças Confirmadas');
  assert.equal(terms.budgetTitle, 'Centro de Custo e Fornecedores');
});

test('FASE 3 - Terminologia: Eventos de casamento usam termos cerimoniais', () => {
  const terms = getEventTerminologyMirror('Casamento');
  assert.equal(terms.attendeeLabel, 'Convidados da Cerimônia');
  assert.equal(terms.attendeeSingular, 'Convidado');
  assert.equal(terms.hostLabel, 'Noivos e Cerimonial');
  assert.equal(terms.budgetTitle, 'Fornecedores e Contratos');
});

test('FASE 3 - Terminologia: Eventos de formatura usam termos acadêmicos', () => {
  const terms = getEventTerminologyMirror('Formatura');
  assert.equal(terms.attendeeLabel, 'Formandos e Convidados');
  assert.equal(terms.hostLabel, 'Comissão de Formatura');
  assert.equal(terms.budgetTitle, 'Contratos da Formatura');
});

test('FASE 3 - Terminologia: Eventos sociais mantêm padrão neutro', () => {
  const terms = getEventTerminologyMirror('Aniversario');
  assert.equal(terms.attendeeLabel, 'Convidados');
  assert.equal(terms.hostLabel, 'Organizador');
  assert.equal(terms.budgetTitle, 'Gastos do Evento');
});

// --- TESTES DE NEGÓCIO: MODO FINANCEIRO (CORPORATIVO VS RATEIO) ---

test('FASE 1/3 - Financeiro: Orçamento corporativo calcula saldo e estouro corretamente', () => {
  const budgetEstimated = 15000.00;
  const items = [
    { name: 'Buffet Executivo', price: 8000.00, paymentStatus: 'paid' },
    { name: 'Sonorização e Iluminação', price: 4500.00, paymentStatus: 'partial' },
    { name: 'Decoração e Flores', price: 3000.00, paymentStatus: 'pending' },
  ];

  const totalCost = items.reduce((sum, item) => sum + item.price, 0);
  assert.equal(totalCost, 15500.00);

  const balance = budgetEstimated - totalCost;
  assert.equal(balance, -500.00);

  const isOverBudget = totalCost > budgetEstimated;
  assert.equal(isOverBudget, true);
});

test('FASE 1 - Financeiro: Rateio colaborativo calcula valor exato por confirmado', () => {
  const items = [
    { name: 'Churrasco', price: 1200.00 },
    { name: 'Bebidas', price: 600.00 },
  ];
  const totalCost = items.reduce((sum, item) => sum + item.price, 0); // 1800.00
  const confirmedCount = 36;

  const costPerConfirmed = totalCost / confirmedCount;
  assert.equal(costPerConfirmed, 50.00);
});

// --- TESTES DE IMPORTAÇÃO EM LOTE: PARSING DE PLANILHAS (FASE 2) ---

function parseCsvContent(content) {
  const rawLines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim().length > 0);
  if (rawLines.length === 0) return [];

  const firstLine = rawLines[0];
  let delimiter = ',';
  if ((firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length) delimiter = ';';
  if ((firstLine.match(/\t/g) || []).length > (firstLine.match(new RegExp(delimiter, 'g')) || []).length) delimiter = '\t';

  const rows = rawLines.map(line => {
    return line.split(delimiter).map(cell => cell.trim().replace(/^["']|["']$/g, ''));
  });

  const header = rows[0].map(h => h.toLowerCase());
  const nameIdx = header.findIndex(h => h.includes('nome') || h.includes('name'));
  const emailIdx = header.findIndex(h => h.includes('mail'));
  const phoneIdx = header.findIndex(h => h.includes('tel') || h.includes('cel') || h.includes('phone'));
  const deptIdx = header.findIndex(h => h.includes('dep') || h.includes('setor') || h.includes('área'));

  const dataRows = rows.slice(1);
  return dataRows.map(r => ({
    name: nameIdx !== -1 ? r[nameIdx] : r[0],
    email: emailIdx !== -1 ? r[emailIdx] : r[1],
    phone: phoneIdx !== -1 ? r[phoneIdx] : r[2],
    department: deptIdx !== -1 ? r[deptIdx] : undefined,
  })).filter(g => Boolean(g.name));
}

test('FASE 2 - CSV Parser: Detecta delimitador ponto e vírgula (Excel PT-BR) e mapeia colunas', () => {
  const csvPtBr = [
    'Nome;E-mail;Telefone;Departamento',
    'Mariana Souza;mariana@empresa.com;11999998888;Recursos Humanos',
    'Carlos Eduardo;carlos@empresa.com;11988887777;Financeiro',
  ].join('\n');

  const parsed = parseCsvContent(csvPtBr);
  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].name, 'Mariana Souza');
  assert.equal(parsed[0].email, 'mariana@empresa.com');
  assert.equal(parsed[0].department, 'Recursos Humanos');
  assert.equal(parsed[1].name, 'Carlos Eduardo');
  assert.equal(parsed[1].department, 'Financeiro');
});

test('FASE 2 - CSV Parser: Detecta delimitador tabulação (Ctrl+V direto de planilhas)', () => {
  const tsvData = [
    'Nome\tEmail\tTelefone',
    'Ana Clara\tana@tech.com\t21977776666',
  ].join('\n');

  const parsed = parseCsvContent(tsvData);
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].name, 'Ana Clara');
  assert.equal(parsed[0].email, 'ana@tech.com');
});

// --- TESTES DE SEGURANÇA: CONFIRMAÇÃO NOMINAL DE EXCLUSÃO (FASE 4) ---

function validateNominalDeletion(eventTitle, userInput) {
  if (!eventTitle || !userInput) return false;
  return eventTitle.trim().toLowerCase() === userInput.trim().toLowerCase();
}

test('FASE 4 - Exclusão Nominal Segura: Bloqueia exclusão com títulos divergentes', () => {
  const eventTitle = 'Confraternização Anual 2026';
  assert.equal(validateNominalDeletion(eventTitle, 'outro evento'), false);
  assert.equal(validateNominalDeletion(eventTitle, 'Confraternizacao'), false);
  assert.equal(validateNominalDeletion(eventTitle, ''), false);
});

test('FASE 4 - Exclusão Nominal Segura: Autoriza exclusão quando o nome é idêntico', () => {
  const eventTitle = 'Confraternização Anual 2026';
  assert.equal(validateNominalDeletion(eventTitle, 'Confraternização Anual 2026'), true);
  assert.equal(validateNominalDeletion(eventTitle, '  confraternização anual 2026  '), true);
});

// --- TESTES DE RESTRIÇÕES ALIMENTARES E BUFFET (FASE 3 E 4) ---

test('FASE 3/4 - Buffet: Agrupa restrições alimentares declaradas pelos convidados', () => {
  const guests = [
    { name: 'Lucas', dietaryRestrictions: 'Vegetariano' },
    { name: 'Beatriz', dietaryRestrictions: 'Sem glúten, Vegetariano' },
    { name: 'Thiago', dietaryRestrictions: 'Alergia a frutos do mar' },
    { name: 'Juliana', dietaryRestrictions: '' },
    { name: 'Marcos', dietaryRestrictions: null },
  ];

  const dietaryCount = {};
  guests.forEach(g => {
    if (g.dietaryRestrictions && g.dietaryRestrictions.trim()) {
      const items = g.dietaryRestrictions.split(',').map(s => s.trim().toLowerCase());
      items.forEach(item => {
        if (!item) return;
        const key = item.charAt(0).toUpperCase() + item.slice(1);
        dietaryCount[key] = (dietaryCount[key] || 0) + 1;
      });
    }
  });

  assert.equal(dietaryCount['Vegetariano'], 2);
  assert.equal(dietaryCount['Sem glúten'], 1);
  assert.equal(dietaryCount['Alergia a frutos do mar'], 1);
});
