const test = require('node:test');
const assert = require('node:assert/strict');
const { z } = require('zod');

// 1. Definição do esquema idêntico ao lib/validation.ts para teste unitário
const companionSchema = z.object({
  name: z.string().trim().min(2, "Nome do acompanhante deve ter no mínimo 2 caracteres").max(100),
  email: z.string().trim().email("E-mail do acompanhante inválido").max(255).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

const publicRsvpSchema = z.object({
  name: z.string().trim().min(2, "Nome é obrigatório e deve ter pelo menos 2 caracteres").max(100),
  email: z.string().trim().email("Formato de e-mail inválido").max(255),
  phone: z.string().trim().min(8, "Telefone inválido").max(30),
  attendanceStatus: z.enum(["confirmed", "declined"]).default("confirmed"),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  dietaryRestrictions: z.string().trim().max(500).optional().or(z.literal("")),
  accessibilityNeeds: z.string().trim().max(500).optional().or(z.literal("")),
  companions: z.array(companionSchema).max(10).optional().default([]),
});

// Import do rate limiter
const { checkRateLimit } = require('../lib/rate-limit.ts');

test('Unit Test — Validação Zod de Payload RSVP Válido (Cenário de Sucesso)', () => {
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

test('Unit Test — Validação Zod rejeita Nome Curto ou Vazio (Caso Limite)', () => {
  const invalidPayload = {
    name: 'A', // menos de 2 caracteres
    email: 'test@example.com',
    phone: '11987654321',
  };

  const result = publicRsvpSchema.safeParse(invalidPayload);
  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.error.issues[0].message, 'Nome é obrigatório e deve ter pelo menos 2 caracteres');
  }
});

test('Unit Test — Validação Zod rejeita E-mail Malformado (Cenário de Erro)', () => {
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

test('Unit Test — Rate Limiter permite até 10 requisições e bloqueia a 11ª (Cenário de Limite)', () => {
  const testIp = '192.168.1.100';

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
});

test('Unit Test — Rate Limiter isola IPs diferentes', () => {
  const ipA = '10.0.0.1';
  const ipB = '10.0.0.2';

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
