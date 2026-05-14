/*
  # ScotSpeak — Criação das tabelas principais

  ## Descrição
  Cria as tabelas necessárias para persistir os dados dos alunos do ScotSpeak
  no Supabase, substituindo o armazenamento em localStorage para que o painel
  do educador possa visualizar o progresso em tempo real de qualquer dispositivo.

  ## Novas tabelas

  ### `student_scripts`
  Armazena o roteiro de cada aluno.
  - `id` (uuid, PK)
  - `student_name` (text) — nome do aluno, chave lógica única por estação
  - `station` (text) — cargo/estação do aluno
  - `content` (text) — conteúdo do roteiro em inglês
  - `updated_at` (timestamptz) — última atualização

  ### `practice_sessions`
  Registra cada tentativa de prática de pronúncia.
  - `id` (uuid, PK)
  - `student_name` (text)
  - `station` (text)
  - `accuracy` (integer, 0-100)
  - `spoken_text` (text) — transcrição detectada pelo STT
  - `practiced_at` (timestamptz)

  ## Segurança
  - RLS habilitado em ambas as tabelas
  - Acesso público de leitura e escrita permitido via anon key (sem auth,
    pois o app não usa login de aluno — a identidade é dada pelo nome selecionado)
  - Políticas separadas para SELECT, INSERT e UPDATE
*/

-- ── student_scripts ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_scripts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name text NOT NULL,
  station      text NOT NULL,
  content      text NOT NULL DEFAULT '',
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_name, station)
);

ALTER TABLE student_scripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read student scripts"
  ON student_scripts FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public can insert student scripts"
  ON student_scripts FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public can update student scripts"
  ON student_scripts FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ── practice_sessions ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS practice_sessions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name text NOT NULL,
  station      text NOT NULL,
  accuracy     integer NOT NULL CHECK (accuracy >= 0 AND accuracy <= 100),
  spoken_text  text NOT NULL DEFAULT '',
  practiced_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read practice sessions"
  ON practice_sessions FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public can insert practice sessions"
  ON practice_sessions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Index para queries frequentes no painel do educador
CREATE INDEX IF NOT EXISTS idx_practice_sessions_student ON practice_sessions (student_name, station);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_practiced_at ON practice_sessions (practiced_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_scripts_student ON student_scripts (student_name, station);
