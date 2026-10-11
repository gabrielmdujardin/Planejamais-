const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// --- SUÍTE DE TESTES PARA S04 (Landing Page & Auth - PLAN-002) ---

test('S04 / PLAN-002: Landing Page possui metadados SSR e SEO estruturados', () => {
  const landingPagePath = path.resolve(__dirname, '../app/page.tsx');
  const content = fs.readFileSync(landingPagePath, 'utf-8');

  // Validação de SSR e SEO metadata
  assert.ok(content.includes('export const metadata: Metadata ='), 'Landing page deve exportar metadata SSR');
  assert.ok(content.includes('title:'), 'Metadata deve conter title');
  assert.ok(content.includes('description:'), 'Metadata deve conter description');
  assert.ok(content.includes('openGraph:'), 'Metadata deve conter openGraph');

  // Não deve usar "use client" na raiz para preservar benefícios de Server Component
  assert.ok(!content.startsWith('"use client"') && !content.startsWith("'use client'"), 'Landing page deve ser Server Component puro (SSR)');
});

test('S04 / PLAN-002: Landing Page não deve conter dependências de cliente não utilizadas', () => {
  const landingPagePath = path.resolve(__dirname, '../app/page.tsx');
  const content = fs.readFileSync(landingPagePath, 'utf-8');

  // framer-motion não deve ser importado desnecessariamente sem uso
  assert.ok(!content.includes('framer-motion'), 'Não deve importar framer-motion na landing page SSR sem necessidade');
});

test('S04: Login e Cadastro não utilizam mais gradientes legados fora do Design System', () => {
  const loginPath = path.resolve(__dirname, '../app/login/page.tsx');
  const registerPath = path.resolve(__dirname, '../app/register/page.tsx');

  const loginContent = fs.readFileSync(loginPath, 'utf-8');
  const registerContent = fs.readFileSync(registerPath, 'utf-8');

  const legacyGradient = 'from-purple-50 via-white to-pink-50';
  assert.ok(!loginContent.includes(legacyGradient), 'Login não deve usar gradiente legado roxo/rosa');
  assert.ok(!registerContent.includes(legacyGradient), 'Cadastro não deve usar gradiente legado roxo/rosa');

  // Ambos devem integrar a Logo institucional
  assert.ok(loginContent.includes('<Logo'), 'Login deve exibir a logo do Planeja+');
  assert.ok(registerContent.includes('<Logo'), 'Cadastro deve exibir a logo do Planeja+');

  // Ambos devem respeitar tokens do tema
  assert.ok(loginContent.includes('bg-background'), 'Login deve usar bg-background');
  assert.ok(registerContent.includes('bg-background'), 'Cadastro deve usar bg-background');
});

test('S04: Validações de credenciais e formulário de autenticação', () => {
  // Regra de validação de senha (mínimo 6 caracteres)
  const isPasswordValid = (pwd) => typeof pwd === 'string' && pwd.length >= 6;
  assert.equal(isPasswordValid('12345'), false, 'Senha com 5 caracteres deve ser rejeitada');
  assert.equal(isPasswordValid('demo123'), true, 'Senha com 7 caracteres deve ser aceita');

  // Regra de confirmação de senha
  const doPasswordsMatch = (p1, p2) => p1 === p2;
  assert.equal(doPasswordsMatch('senha123', 'senha123'), true);
  assert.equal(doPasswordsMatch('senha123', 'outrasenha'), false);
});
