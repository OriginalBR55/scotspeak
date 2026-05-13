'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import Link from 'next/link';

// ── Data model ──────────────────────────────────────────────────────────────
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

const STATION_KEYS = Object.keys(STATIONS);

// ── Decorative St Andrew's Cross SVG ────────────────────────────────────────
function SaltireBg() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none select-none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <line
        x1="0" y1="0" x2="100%" y2="100%"
        stroke="rgba(255,255,255,0.07)"
        strokeWidth="80"
      />
      <line
        x1="100%" y1="0" x2="0" y2="100%"
        stroke="rgba(255,255,255,0.07)"
        strokeWidth="80"
      />
    </svg>
  );
}

// ── Thistle icon (decorative) ────────────────────────────────────────────────
function ThistleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* stem */}
      <path d="M24 44 L24 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* leaves */}
      <path d="M24 32 Q16 28 14 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M24 28 Q32 24 34 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* bloom petals */}
      <circle cx="24" cy="13" r="5" fill="currentColor" opacity="0.9" />
      <path d="M24 8 L25.5 4 L24 6 L22.5 4 Z" fill="currentColor" />
      <path d="M29 10 L33 8 L30 11 L33 13 Z" fill="currentColor" />
      <path d="M19 10 L15 8 L18 11 L15 13 Z" fill="currentColor" />
      <path d="M26 17 L28 21 L25 19 L27 22 Z" fill="currentColor" />
      <path d="M22 17 L20 21 L23 19 L21 22 Z" fill="currentColor" />
    </svg>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function StudentSelectionClient() {
  const router = useRouter();
  const [selectedStation, setSelectedStation] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const [error, setError] = useState('');
  const [isEntering, setIsEntering] = useState(false);

  const names = selectedStation ? STATIONS[selectedStation] : [];

  function handleStationChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setSelectedStation(e.target.value);
    setSelectedName('');
    setError('');
  }

  function handleNameChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setSelectedName(e.target.value);
    setError('');
  }

  function handleEnter() {
    if (!selectedStation || !selectedName) {
      setError('Por favor, selecione seu cargo e seu nome antes de continuar.');
      return;
    }
    setIsEntering(true);
    // Backend integration point: POST /api/session/start { station, name }
    sessionStorage.setItem(
      'scotspeak_student',
      JSON.stringify({ station: selectedStation, name: selectedName })
    );
    router.push('/script-studio');
  }

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden" style={{ background: 'var(--primary)' }}>
      {/* Background decorative saltire */}
      <SaltireBg />

      {/* Radial glow top-right */}
      <div
        className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%)',
          transform: 'translate(30%, -30%)',
        }}
      />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-10">
        <div className="flex items-center gap-3">
          <AppLogo size={36} />
          <span className="font-extrabold text-xl tracking-tight text-white">ScotSpeak</span>
        </div>
        <div className="flex items-center gap-3 text-white/60 text-sm font-medium">
          <Link
            href="/educator"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 touch-manipulation"
            style={{ background: 'rgba(201,168,76,0.2)', color: 'var(--accent)' }}
            aria-label="Acessar painel do educador"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="hidden sm:inline">Educador</span>
          </Link>
          <ThistleIcon className="w-5 h-5 text-accent" />
          <span>Scotland Event 2026</span>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md slide-up">
          {/* Hero text */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <ThistleIcon className="w-14 h-14 text-accent" />
            </div>
            <h1 className="text-hero-title font-extrabold text-white leading-tight mb-3">
              Bem-vindo ao<br />
              <span style={{ color: 'var(--accent)' }}>ScotSpeak</span>
            </h1>
            <p className="text-white/70 text-base font-medium leading-relaxed">
              Escreva, memorize e treine a pronúncia<br className="hidden sm:block" />
              do seu roteiro em inglês.
            </p>
          </div>

          {/* Selection card */}
          <div
            className="rounded-2xl p-6 md:p-8"
            style={{
              background: 'var(--card)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
            }}
          >
            <h2 className="text-lg font-700 text-foreground mb-1" style={{ fontWeight: 700 }}>
              Identifique-se
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Selecione seu cargo e nome para acessar seu estúdio pessoal.
            </p>

            {/* Station dropdown */}
            <div className="mb-4">
              <label
                htmlFor="station-select"
                className="block text-sm font-600 text-foreground mb-1.5"
                style={{ fontWeight: 600 }}
              >
                Cargo / Estação
              </label>
              <select
                id="station-select"
                value={selectedStation}
                onChange={handleStationChange}
                className="select-custom w-full rounded-xl border border-border bg-input text-foreground text-sm font-medium px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-150"
              >
                <option value="">— Selecione seu cargo —</option>
                {STATION_KEYS.map((station) => (
                  <option key={`station-${station}`} value={station}>
                    {station}
                  </option>
                ))}
              </select>
            </div>

            {/* Name dropdown */}
            <div className="mb-6">
              <label
                htmlFor="name-select"
                className="block text-sm font-600 text-foreground mb-1.5"
                style={{ fontWeight: 600 }}
              >
                Seu Nome
              </label>
              <select
                id="name-select"
                value={selectedName}
                onChange={handleNameChange}
                disabled={!selectedStation}
                className="select-custom w-full rounded-xl border border-border bg-input text-foreground text-sm font-medium px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {selectedStation ? '— Selecione seu nome —' : '— Selecione o cargo primeiro —'}
                </option>
                {names.map((name) => (
                  <option key={`name-${name}`} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              {selectedStation && (
                <p className="text-xs text-muted-foreground mt-1.5">
                  {names.length} estudante{names.length !== 1 ? 's' : ''} em {selectedStation}
                </p>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-lg px-4 py-3 bg-red-50 border border-red-200 fade-in">
                <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            {/* CTA button */}
            <button
              onClick={handleEnter}
              disabled={isEntering}
              className="btn-primary w-full rounded-xl py-3.5 text-base font-700 flex items-center justify-center gap-2"
              style={{ fontWeight: 700 }}
            >
              {isEntering ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Entrando...
                </>
              ) : (
                <>
                  Entrar no Estúdio
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </div>

          {/* Footer note */}
          <p className="text-center text-white/50 text-xs mt-6">
            Seus dados são salvos localmente neste dispositivo.
          </p>
        </div>
      </main>

      {/* Bottom wave decoration */}
      <div className="relative z-10 mt-auto">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full" aria-hidden="true">
          <path
            d="M0 40 Q360 80 720 40 Q1080 0 1440 40 L1440 80 L0 80 Z"
            fill="rgba(255,255,255,0.05)"
          />
        </svg>
      </div>
    </div>
  );
}