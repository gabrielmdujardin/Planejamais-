-- Tabelas para pipeline de jobs
CREATE TABLE IF NOT EXISTS job_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_name VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'running', -- running, completed, failed
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_run_id UUID REFERENCES job_runs(id) ON DELETE CASCADE,
  level VARCHAR(10) NOT NULL DEFAULT 'info', -- info, warn, error
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabelas de staging para dados temporários
CREATE TABLE IF NOT EXISTS stg_event_costs (
  event_id UUID,
  total_cost DECIMAL(10,2),
  items_count INTEGER,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stg_rsvp_stats (
  event_id UUID,
  confirmed_count INTEGER,
  pending_count INTEGER,
  declined_count INTEGER,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabelas de fatos consolidados
CREATE TABLE IF NOT EXISTS facts_daily_events (
  date DATE,
  total_events INTEGER,
  total_guests INTEGER,
  total_cost DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (date)
);

-- Materialized views para performance
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_event_costs AS
SELECT 
  e.id,
  e.title,
  e.date,
  COALESCE(SUM(i.estimated_cost), 0) as total_cost,
  COUNT(i.id) as items_count
FROM events e
LEFT JOIN items i ON e.id = i.event_id
GROUP BY e.id, e.title, e.date;

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_rsvp_stats AS
SELECT 
  e.id,
  e.title,
  e.date,
  COUNT(CASE WHEN g.status = 'confirmed' THEN 1 END) as confirmed_count,
  COUNT(CASE WHEN g.status = 'pending' THEN 1 END) as pending_count,
  COUNT(CASE WHEN g.status = 'declined' THEN 1 END) as declined_count,
  COUNT(g.id) as total_guests
FROM events e
LEFT JOIN guests g ON e.id = g.event_id
GROUP BY e.id, e.title, e.date;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_job_runs_status ON job_runs(status);
CREATE INDEX IF NOT EXISTS idx_job_runs_job_name ON job_runs(job_name);
CREATE INDEX IF NOT EXISTS idx_job_logs_job_run_id ON job_logs(job_run_id);
CREATE INDEX IF NOT EXISTS idx_job_logs_level ON job_logs(level);

-- Row Level Security
ALTER TABLE job_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE stg_event_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE stg_rsvp_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE facts_daily_events ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (apenas service role pode acessar)
CREATE POLICY "Service role can manage job_runs" ON job_runs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage job_logs" ON job_logs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage staging tables" ON stg_event_costs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage staging tables" ON stg_rsvp_stats
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage facts" ON facts_daily_events
  FOR ALL USING (auth.role() = 'service_role');
