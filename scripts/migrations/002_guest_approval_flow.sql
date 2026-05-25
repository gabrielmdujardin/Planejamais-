-- Migration: Guest Approval Flow
-- Adiciona suporte para fluxo de aprovação de convidados e acompanhantes

-- 1. Adicionar novas colunas na tabela guests
ALTER TABLE guests ADD COLUMN IF NOT EXISTS token TEXT UNIQUE;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS confirmation_deadline TIMESTAMPTZ;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS dietary_restrictions TEXT;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS accessibility_needs TEXT;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';
ALTER TABLE guests ADD COLUMN IF NOT EXISTS requested_companions_count INTEGER DEFAULT 0;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Criar tabela de acompanhantes
CREATE TABLE IF NOT EXISTS guest_companions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  notes TEXT,
  status TEXT DEFAULT 'awaiting_approval' 
    CHECK (status IN ('awaiting_approval', 'approved', 'rejected', 'cancelled')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Habilitar RLS para guest_companions
ALTER TABLE guest_companions ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS para guest_companions
-- Admins podem ver acompanhantes dos seus eventos
CREATE POLICY "Users can view companions of their event guests" ON guest_companions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM guests g
      JOIN events e ON e.id = g.event_id
      WHERE g.id = guest_companions.guest_id 
      AND e.user_id = auth.uid()
    )
  );

-- Admins podem inserir acompanhantes
CREATE POLICY "Users can insert companions for their event guests" ON guest_companions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM guests g
      JOIN events e ON e.id = g.event_id
      WHERE g.id = guest_companions.guest_id 
      AND e.user_id = auth.uid()
    )
  );

-- Admins podem atualizar acompanhantes
CREATE POLICY "Users can update companions of their event guests" ON guest_companions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM guests g
      JOIN events e ON e.id = g.event_id
      WHERE g.id = guest_companions.guest_id 
      AND e.user_id = auth.uid()
    )
  );

-- Admins podem deletar acompanhantes
CREATE POLICY "Users can delete companions of their event guests" ON guest_companions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM guests g
      JOIN events e ON e.id = g.event_id
      WHERE g.id = guest_companions.guest_id 
      AND e.user_id = auth.uid()
    )
  );

-- 5. Política para acesso público (inserção via solicitação pública)
-- Isso será gerenciado via service role no backend

-- 6. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_guests_token ON guests(token);
CREATE INDEX IF NOT EXISTS idx_guests_status ON guests(status);
CREATE INDEX IF NOT EXISTS idx_guests_source ON guests(source);
CREATE INDEX IF NOT EXISTS idx_guest_companions_guest_id ON guest_companions(guest_id);
CREATE INDEX IF NOT EXISTS idx_guest_companions_status ON guest_companions(status);

-- 7. Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Triggers para atualizar updated_at
DROP TRIGGER IF EXISTS update_guests_updated_at ON guests;
CREATE TRIGGER update_guests_updated_at
  BEFORE UPDATE ON guests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_guest_companions_updated_at ON guest_companions;
CREATE TRIGGER update_guest_companions_updated_at
  BEFORE UPDATE ON guest_companions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
