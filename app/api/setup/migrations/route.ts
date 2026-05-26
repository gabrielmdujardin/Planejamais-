import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabaseAdmin = createAdminClient()
    
    // Executar as migrações usando o service role

    // 1. Adicionar novas colunas na tabela guests
    const alterQueries = [
      `ALTER TABLE guests ADD COLUMN IF NOT EXISTS token TEXT UNIQUE`,
      `ALTER TABLE guests ADD COLUMN IF NOT EXISTS confirmation_deadline TIMESTAMPTZ`,
      `ALTER TABLE guests ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ`,
      `ALTER TABLE guests ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ`,
      `ALTER TABLE guests ADD COLUMN IF NOT EXISTS notes TEXT`,
      `ALTER TABLE guests ADD COLUMN IF NOT EXISTS dietary_restrictions TEXT`,
      `ALTER TABLE guests ADD COLUMN IF NOT EXISTS accessibility_needs TEXT`,
      `ALTER TABLE guests ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual'`,
      `ALTER TABLE guests ADD COLUMN IF NOT EXISTS requested_companions_count INTEGER DEFAULT 0`,
      `ALTER TABLE guests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`,
    ]

    for (const query of alterQueries) {
      const { error } = await supabaseAdmin.rpc("exec_sql", { query })
      if (error && !error.message.includes("already exists")) {
        console.log(`Warning: ${error.message}`)
      }
    }

    // 2. Criar tabela guest_companions
    const { error: createTableError } = await supabaseAdmin.rpc("exec_sql", {
      query: `
        CREATE TABLE IF NOT EXISTS guest_companions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          email TEXT,
          phone TEXT,
          notes TEXT,
          status TEXT DEFAULT 'awaiting_approval' 
            CHECK (status IN ('awaiting_approval', 'approved', 'rejected', 'cancelled')),
          approved_by UUID,
          approved_at TIMESTAMPTZ,
          rejected_at TIMESTAMPTZ,
          rejection_reason TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `,
    })

    if (createTableError && !createTableError.message.includes("already exists")) {
      console.log(`Warning creating table: ${createTableError.message}`)
    }

    // 3. Criar índices
    const indexQueries = [
      `CREATE INDEX IF NOT EXISTS idx_guests_token ON guests(token)`,
      `CREATE INDEX IF NOT EXISTS idx_guests_status ON guests(status)`,
      `CREATE INDEX IF NOT EXISTS idx_guests_source ON guests(source)`,
      `CREATE INDEX IF NOT EXISTS idx_guest_companions_guest_id ON guest_companions(guest_id)`,
      `CREATE INDEX IF NOT EXISTS idx_guest_companions_status ON guest_companions(status)`,
    ]

    for (const query of indexQueries) {
      await supabaseAdmin.rpc("exec_sql", { query })
    }

    return NextResponse.json({
      success: true,
      message: "Migrations executadas com sucesso",
    })
  } catch (error) {
    console.error("Erro ao executar migrations:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    )
  }
}
