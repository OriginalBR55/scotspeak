'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';

// ── Data model (mirrors StudentSelectionClient) ──────────────────────────────
const STATIONS: Record<string, string[]> = {
  Guia: ['Augusto'],
  'Check-in': ['Ana Carolina'],
  'Estação 1': ['Diogo', 'João Pedro', 'Maria Eduarda S.', 'Maria Eduarda P.'],
  'Estação 2': ['Willian', 'Lavinnya', 'Esther', 'Lucas BK', 'G.H', 'Camily', 'Ruan'],
  'Estação 3': [
    'Sarah',
    'Derick',
    'Carlos H',
    'Robert',
    'Maria Eduarda O.',
    'Julia',
    'Eduardo',
    'Lucas Carlos',
    'Emanuella D.',
  ],
  'Estação 4': ['Yasmin', 'Gabrielle', 'Karen', 'Bryan', 'Dudu'],
};

// ── Types ────────────────────────────────────────────────────────────────────
interface StudentProgress {
  name: string;
  station: string;
  accuracy: number | null;
  attempts: number;
  lastPractice: string | null;
  hasScript: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function getAccuracyColor(accuracy: number | null): string {
  if (accuracy === null) return 'text-muted-foreground';
  if (accuracy >= 90) return 'text-emerald-600';
  if (accuracy >= 70) return 'text-green-600';
  if (accuracy >= 50) return 'text-amber-600';
  return 'text-red-600';
}

function getAccuracyBg(accuracy: number | null): string {
  if (accuracy === null) return 'bg-gray-100';
  if (accuracy >= 90) return 'bg-emerald-50';
  if (accuracy >= 70) return 'bg-green-50';
  if (accuracy >= 50) return 'bg-amber-50';
  return 'bg-red-50';
}

function getAccuracyBarColor(accuracy: number | null): string {
  if (accuracy === null) return 'bg-gray-200';
  if (accuracy >= 90) return 'bg-emerald-500';
  if (accuracy >= 70) return 'bg-green-500';
  if (accuracy >= 50) return 'bg-amber-500';
  return 'bg-red-500';
}

function formatLastPractice(dateStr: string | null): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Agora mesmo';
  if (diffMins < 60) return `${diffMins}min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 7) return `${diffDays} dias atrás`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div
      className="rounded-2xl p-4 md:p-5 flex flex-col gap-1"
      style={{ background: 'var(--card)', boxShadow: '0 2px 12px rgba(0,53,128,0.08)' }}
    >
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-2xl md:text-3xl font-extrabold" style={{ color: 'var(--primary)' }}>
        {value}
      </p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

// ── Student Row ──────────────────────────────────────────────────────────────
function StudentRow({ student, rank }: { student: StudentProgress; rank: number }) {
  const accuracy = student.accuracy;
  const barWidth = accuracy !== null ? `${accuracy}%` : '0%';

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-xl border border-border card-hover"
      style={{ background: 'var(--card)' }}
    >
      {/* Rank + Avatar */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="w-6 text-xs font-bold text-muted-foreground text-right">{rank}</span>
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          aria-hidden="true"
        >
          {student.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground truncate">{student.name}</p>
          <p className="text-xs text-muted-foreground truncate">{student.station}</p>
        </div>
      </div>

      {/* Progress bar + accuracy */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">Precisão</span>
          <span className={`text-sm font-bold ${getAccuracyColor(accuracy)}`}>
            {accuracy !== null ? `${accuracy}%` : '—'}
          </span>
        </div>
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${getAccuracyBarColor(accuracy)}`}
            style={{ width: barWidth }}
          />
        </div>
      </div>

      {/* Attempts */}
      <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-0 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          <span className="text-sm font-semibold text-foreground">{student.attempts}</span>
          <span className="text-xs text-muted-foreground">tentativas</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs text-muted-foreground">{formatLastPractice(student.lastPractice)}</span>
        </div>
      </div>

      {/* Script status badge */}
      <div className="flex-shrink-0">
        <span
          className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
            student.hasScript
              ? 'bg-blue-50 text-blue-700' :'bg-gray-100 text-gray-500'
          }`}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {student.hasScript ? 'Roteiro salvo' : 'Sem roteiro'}
        </span>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function EducatorDashboardClient() {
  const router = useRouter();
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [filterStation, setFilterStation] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'accuracy' | 'attempts' | 'lastPractice'>('accuracy');
  const [isLoaded, setIsLoaded] = useState(false);
  const [lastRefresh, setLastRefresh] = useState('');

  function loadData() {
    const allStudents: StudentProgress[] = [];

    for (const [station, names] of Object.entries(STATIONS)) {
      for (const name of names) {
        const scriptKey = `scotspeak_script_${name}`;
        const attemptsKey = `scotspeak_attempts_${localStorage.getItem(scriptKey)?.slice(0, 20) ?? ''}`;
        const script = localStorage.getItem(scriptKey) ?? '';
        const attempts = script
          ? parseInt(localStorage.getItem(`scotspeak_attempts_${script.slice(0, 20)}`) ?? '0', 10)
          : 0;
        const accuracyRaw = script
          ? localStorage.getItem(`scotspeak_accuracy_${name}`)
          : null;
        const lastPracticeRaw = script
          ? localStorage.getItem(`scotspeak_lastpractice_${name}`)
          : null;

        allStudents.push({
          name,
          station,
          accuracy: accuracyRaw !== null ? parseInt(accuracyRaw, 10) : null,
          attempts,
          lastPractice: lastPracticeRaw,
          hasScript: script.length > 0,
        });
      }
    }

    setStudents(allStudents);
    setIsLoaded(true);
    setLastRefresh(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
  }

  useEffect(() => {
    loadData();
  }, []);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const totalStudents = students.length;
  const withScript = students.filter((s) => s.hasScript).length;
  const withAttempts = students.filter((s) => s.attempts > 0).length;
  const avgAccuracy =
    students.filter((s) => s.accuracy !== null).length > 0
      ? Math.round(
          students
            .filter((s) => s.accuracy !== null)
            .reduce((sum, s) => sum + (s.accuracy ?? 0), 0) /
            students.filter((s) => s.accuracy !== null).length
        )
      : null;

  // ── Filter + Sort ──────────────────────────────────────────────────────────
  const filtered = students.filter((s) =>
    filterStation ? s.station === filterStation : true
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'accuracy') {
      if (a.accuracy === null && b.accuracy === null) return 0;
      if (a.accuracy === null) return 1;
      if (b.accuracy === null) return -1;
      return b.accuracy - a.accuracy;
    }
    if (sortBy === 'attempts') return b.attempts - a.attempts;
    if (sortBy === 'lastPractice') {
      if (!a.lastPractice && !b.lastPractice) return 0;
      if (!a.lastPractice) return 1;
      if (!b.lastPractice) return -1;
      return new Date(b.lastPractice).getTime() - new Date(a.lastPractice).getTime();
    }
    return 0;
  });

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin w-8 h-8" style={{ color: 'var(--primary)' }} fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <p className="text-muted-foreground text-sm font-medium">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-8 py-3 border-b border-border"
        style={{ background: 'var(--primary)', boxShadow: '0 2px 12px rgba(0,53,128,0.2)' }}
      >
        <div className="flex items-center gap-3">
          <AppLogo size={30} onClick={() => router.push('/')} />
          <span className="font-extrabold text-base text-white tracking-tight hidden sm:block">ScotSpeak</span>
          <span
            className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(201,168,76,0.25)', color: 'var(--accent)' }}
          >
            Painel do Educador
          </span>
        </div>
        <div className="flex items-center gap-2">
          {lastRefresh && (
            <span className="text-white/50 text-xs hidden sm:block">
              Atualizado às {lastRefresh}
            </span>
          )}
          <button
            onClick={loadData}
            className="rounded-lg p-2 text-white/70 hover:text-white hover:bg-white/10 transition-all duration-150 touch-manipulation"
            title="Atualizar dados"
            aria-label="Atualizar dados dos estudantes"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            onClick={() => router.push('/')}
            className="rounded-lg p-2 text-white/70 hover:text-white hover:bg-white/10 transition-all duration-150 touch-manipulation"
            title="Voltar para início"
            aria-label="Voltar para a página inicial"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 w-full max-w-screen-lg mx-auto px-3 md:px-8 py-5 md:py-8">
        {/* Page title */}
        <div className="mb-6 fade-in">
          <h1 className="text-xl md:text-2xl font-extrabold text-foreground">
            Progresso dos{' '}
            <span style={{ color: 'var(--primary)' }}>Estudantes</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Monitoramento de pronúncia · Evento Escócia 2026
          </p>
        </div>

        {/* Stats overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 fade-in">
          <StatCard label="Total de Alunos" value={totalStudents} />
          <StatCard label="Com Roteiro" value={withScript} sub={`${totalStudents - withScript} sem roteiro`} />
          <StatCard label="Praticaram" value={withAttempts} sub="ao menos 1 vez" />
          <StatCard
            label="Precisão Média"
            value={avgAccuracy !== null ? `${avgAccuracy}%` : '—'}
            sub={avgAccuracy !== null ? (avgAccuracy >= 70 ? 'Bom desempenho' : 'Precisa melhorar') : 'Sem dados'}
          />
        </div>

        {/* Filters + Sort */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5 fade-in">
          <div className="flex-1">
            <select
              value={filterStation}
              onChange={(e) => setFilterStation(e.target.value)}
              className="select-custom w-full rounded-xl border border-border bg-input text-foreground text-sm font-medium px-4 py-2.5 focus:outline-none focus:ring-2 focus:border-primary transition-all duration-150"
              aria-label="Filtrar por estação"
            >
              <option value="">Todas as estações</option>
              {Object.keys(STATIONS).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 flex-wrap">
            {(
              [
                { key: 'accuracy', label: 'Precisão' },
                { key: 'attempts', label: 'Tentativas' },
                { key: 'lastPractice', label: 'Recente' },
                { key: 'name', label: 'Nome' },
              ] as { key: typeof sortBy; label: string }[]
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 touch-manipulation ${
                  sortBy === key ? 'tab-active' : 'tab-inactive border border-border'
                }`}
                aria-pressed={sortBy === key}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Student count */}
        <p className="text-xs text-muted-foreground mb-3 fade-in">
          {sorted.length} estudante{sorted.length !== 1 ? 's' : ''}
          {filterStation ? ` em ${filterStation}` : ''}
          {' · '}ordenado por{' '}
          {{ accuracy: 'precisão', attempts: 'tentativas', lastPractice: 'mais recente', name: 'nome' }[sortBy]}
        </p>

        {/* Student list */}
        <div className="flex flex-col gap-2.5 fade-in">
          {sorted.map((student, idx) => (
            <StudentRow key={`${student.station}-${student.name}`} student={student} rank={idx + 1} />
          ))}
        </div>

        {sorted.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center fade-in">
            <svg className="w-12 h-12 text-muted mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-muted-foreground font-medium">Nenhum estudante encontrado</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 px-4 md:px-8 text-center">
        <p className="text-xs text-muted-foreground">
          ScotSpeak · Painel do Educador · Dados lidos do localStorage dos dispositivos dos alunos
        </p>
      </footer>
    </div>
  );
}
