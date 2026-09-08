const test = require('node:test');
const assert = require('node:assert/strict');
const { z } = require('zod');

// 1. Re-import dos esquemas e utilitários oficiais
const { companionSchema, publicRsvpSchema } = require('../lib/validation.ts');
const { checkRateLimit } = require('../lib/rate-limit.ts');

// --- SUÍTE DE TESTES PARA PLAN-010 (Segurança do Endpoint RSVP) ---

test('PLAN-010: Payload RSVP válido passa na validação Zod', () => {
  const validPayload = {
    name: 'Gabriel Dujardin',
    email: 'gabriel@example.com',
    phone: '11987654321',
    attendanceStatus: 'confirmed',
    notes: 'Confirmado para o evento',
    companions: [
      { name: 'Maria Silva', email: 'maria@example.com', phone: '11912345678' }
    ]
  };

  const result = publicRsvpSchema.safeParse(validPayload);
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.name, 'Gabriel Dujardin');
    assert.equal(result.data.email, 'gabriel@example.com');
    assert.equal(result.data.companions.length, 1);
  }
});

test('PLAN-010: Rejeita nome com menos de 2 caracteres (Caso Limite)', () => {
  const invalidPayload = {
    name: 'A',
    email: 'test@example.com',
    phone: '11987654321',
  };

  const result = publicRsvpSchema.safeParse(invalidPayload);
  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.error.issues[0].message, 'Nome é obrigatório e deve ter pelo menos 2 caracteres');
  }
});

test('PLAN-010: Rejeita formato de e-mail malformado (Cenário de Erro)', () => {
  const invalidPayload = {
    name: 'Carlos Oliveira',
    email: 'email-invalido-sem-arroba',
    phone: '11987654321',
  };

  const result = publicRsvpSchema.safeParse(invalidPayload);
  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.error.issues[0].message, 'Formato de e-mail inválido');
  }
});

test('PLAN-010: Mass Assignment Protection - Ignora e descarta atributos sensíveis injetados (Segurança)', () => {
  const maliciousPayload = {
    name: 'Atacante',
    email: 'hacker@example.com',
    phone: '11999998888',
    // Tentativa de Mass Assignment para forçar aprovação direta
    status: 'approved',
    approved_by: 'admin_id_fake',
    role: 'super_admin',
  };

  const result = publicRsvpSchema.safeParse(maliciousPayload);
  assert.equal(result.success, true);
  if (result.success) {
    // Garante que o objeto parseado NÃO contém status, approved_by ou role
    assert.equal(result.data.status, undefined);
    assert.equal(result.data.approved_by, undefined);
    assert.equal(result.data.role, undefined);
  }
});

test('PLAN-010: companionSchema valida campos individuais de acompanhantes', () => {
  const invalidCompanion = {
    name: 'X', // muito curto
    email: 'email-invalido',
  };

  const result = companionSchema.safeParse(invalidCompanion);
  assert.equal(result.success, false);
});


// --- SUÍTE DE TESTES PARA PLAN-011 (Rate Limiting por IP) ---

test('PLAN-011: Rate Limiter permite até 10 requisições e bloqueia a 11ª', () => {
  const testIp = '192.168.1.200';

  // 10 requisições permitidas
  for (let i = 1; i <= 10; i++) {
    const res = checkRateLimit(testIp, 10, 60000);
    assert.equal(res.success, true, `Requisição ${i} deveria passar`);
    assert.equal(res.remaining, 10 - i);
  }

  // 11ª requisição deve ser bloqueada
  const blockedRes = checkRateLimit(testIp, 10, 60000);
  assert.equal(blockedRes.success, false, '11ª requisição deve ser bloqueada com status 429');
  assert.equal(blockedRes.remaining, 0);
  assert.ok(blockedRes.resetTime > Date.now());
});

test('PLAN-011: Rate Limiter isola limites entre diferentes IPs', () => {
  const ipA = '10.0.1.1';
  const ipB = '10.0.1.2';

  // Esgota limite para IP A
  for (let i = 0; i < 10; i++) {
    checkRateLimit(ipA, 10, 60000);
  }
  const resA = checkRateLimit(ipA, 10, 60000);
  assert.equal(resA.success, false, 'IP A deve estar bloqueado');

  // IP B continua funcionando normalmente
  const resB = checkRateLimit(ipB, 10, 60000);
  assert.equal(resB.success, true, 'IP B deve ser permitido independentemente do IP A');
});


// --- SUÍTE DE TESTES PARA PLAN-001 (Design System Core e Tokens) ---

test('PLAN-001: Validação dos componentes do Design System e utilitários', () => {
  const { isValidEmail, isValidPhone, formatPhone } = require('../lib/validation.ts');
  
  assert.equal(isValidEmail('usuario@planejamais.com'), true);
  assert.equal(isValidEmail('email-invalido'), false);

  assert.equal(isValidPhone('(11) 98765-4321'), true);
  assert.equal(formatPhone('11987654321'), '(11) 98765-4321');
});
