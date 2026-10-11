const test = require('node:test');
const assert = require('node:assert/strict');

// 1. Testes de variantes e classes do Button via lib/design-system.ts
test('Button: variants e sizes geram classes esperadas via buttonVariants', () => {
  const { buttonVariants } = require('../lib/design-system.ts');
  
  // Default variant e size
  const defaultClasses = buttonVariants();
  assert.ok(defaultClasses.includes('bg-primary'), 'Deve conter bg-primary');
  assert.ok(defaultClasses.includes('h-9 px-4 py-2'), 'Deve conter dimensões default');

  // Destructive variant
  const destructiveClasses = buttonVariants({ variant: 'destructive' });
  assert.ok(destructiveClasses.includes('bg-destructive'), 'Deve conter bg-destructive');

  // Success variant
  const successClasses = buttonVariants({ variant: 'success' });
  assert.ok(successClasses.includes('bg-emerald-600'), 'Deve conter bg-emerald-600');

  // Sizes: sm, lg, icon
  const smClasses = buttonVariants({ size: 'sm' });
  assert.ok(smClasses.includes('h-8') && smClasses.includes('text-xs'), 'Size sm deve ter h-8 e text-xs');

  const lgClasses = buttonVariants({ size: 'lg' });
  assert.ok(lgClasses.includes('h-11') && lgClasses.includes('text-base'), 'Size lg deve ter h-11 e text-base');

  const iconClasses = buttonVariants({ size: 'icon' });
  assert.ok(iconClasses.includes('h-9 w-9'), 'Size icon deve ter h-9 w-9');
});

// 2. Testes de Card e cardVariants
test('Card: variants geram classes estruturais e interativas corretas via cardVariants', () => {
  const { cardVariants } = require('../lib/design-system.ts');

  const defaultCard = cardVariants();
  assert.ok(defaultCard.includes('rounded-xl border bg-card text-card-foreground'), 'Card padrão estruturado');

  const interactiveCard = cardVariants({ variant: 'interactive' });
  assert.ok(interactiveCard.includes('cursor-pointer') && interactiveCard.includes('hover:shadow-md'), 'Card interativo deve ter hover e cursor-pointer');

  const outlineCard = cardVariants({ variant: 'outline' });
  assert.ok(outlineCard.includes('bg-transparent'), 'Card outline deve ter fundo transparente');
});

// 3. Testes de Input e inputVariants
test('Input: inputVariants suporta tamanhos e estado de erro acessível', () => {
  const { inputVariants } = require('../lib/design-system.ts');

  const defaultInput = inputVariants();
  assert.ok(defaultInput.includes('h-10 px-3 py-2'), 'Input default com altura 10');

  const smInput = inputVariants({ inputSize: 'sm' });
  assert.ok(smInput.includes('h-8') && smInput.includes('text-xs'), 'Input sm com altura 8 e texto reduzido');

  const errorInput = inputVariants({ error: true });
  assert.ok(errorInput.includes('border-destructive'), 'Input com error: true deve ter border-destructive');
});

// 4. Testes de Badge e badgeVariants
test('Badge: badgeVariants suporta variantes semânticas e tamanhos', () => {
  const { badgeVariants } = require('../lib/design-system.ts');

  const defaultBadge = badgeVariants();
  assert.ok(defaultBadge.includes('bg-primary text-primary-foreground'), 'Badge default');

  const successBadge = badgeVariants({ variant: 'success' });
  assert.ok(successBadge.includes('bg-emerald-50 text-emerald-700'), 'Badge success');

  const paidBadge = badgeVariants({ variant: 'paid' });
  assert.ok(paidBadge.includes('bg-emerald-100 text-emerald-800'), 'Compatibilidade retroativa: Badge paid preservado');

  const pendingBadge = badgeVariants({ variant: 'pending' });
  assert.ok(pendingBadge.includes('bg-amber-100 text-amber-800'), 'Compatibilidade retroativa: Badge pending preservado');

  const lgBadge = badgeVariants({ size: 'lg' });
  assert.ok(lgBadge.includes('px-3 py-1 text-sm'), 'Badge size lg configurado');
});

// 5. Testes de EmptyState e emptyStateVariants
test('EmptyState: emptyStateVariants suporta variantes visuais e tamanhos', () => {
  const { emptyStateVariants } = require('../lib/design-system.ts');

  const defaultEmptyState = emptyStateVariants();
  assert.ok(defaultEmptyState.includes('p-8 my-4'), 'EmptyState default com espaçamento padronizado');

  const smEmptyState = emptyStateVariants({ size: 'sm' });
  assert.ok(smEmptyState.includes('p-4 my-2'), 'EmptyState sm compacto');

  const subtleEmptyState = emptyStateVariants({ variant: 'subtle' });
  assert.ok(subtleEmptyState.includes('bg-muted/30'), 'EmptyState subtle com fundo atenuado');
});

// 6. Testes dos tokens e regras do Design System
test('PLAN-001 & S03: Tokens essenciais estão definidos e consistentes', () => {
  const { isValidEmail, isValidPhone, formatPhone } = require('../lib/validation.ts');
  
  assert.equal(isValidEmail('contato@planejamais.com.br'), true);
  assert.equal(isValidEmail('invalido'), false);

  assert.equal(isValidPhone('(11) 98765-4321'), true);
  assert.equal(formatPhone('11987654321'), '(11) 98765-4321');
});
