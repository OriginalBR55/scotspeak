'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import ScriptEditor from './ScriptEditor';
import PracticeArea from './PracticeArea';
import { loadScript, saveScript } from '@/lib/scotspeak-db';

export type StudentInfo = {
  station: string;
  name: string;
};

export type TabId = 'edit' | 'practice';

export default function ScriptStudioClient() {
  const router = useRouter();
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('edit');
  const [savedScript, setSavedScript] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load student from sessionStorage and script from localStorage
  useEffect(() => {
    const raw = sessionStorage.getItem('scotspeak_student');
    if (!raw) {
      router.replace('/');
      return;
    }
    const parsed: StudentInfo = JSON.parse(raw);
    setStudent(parsed);

    loadScript(parsed.name, parsed.station).then((content) => {
      setSavedScript(content);
      setIsLoaded(true);
    });
  }, [router]);

  const handleScriptSaved = useCallback(
    async (text: string) => {
      if (!student) return;
      await saveScript(student.name, student.station, text);
      setSavedScript(text);
    },
    [student]
  );

  function handleLogout() {
    sessionStorage.removeItem('scotspeak_student');
    router.push('/');
  }

  if (!isLoaded || !student) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <p className="text-muted-foreground text-sm font-medium">Carregando seu estúdio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>
      {/* Topbar */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-8 py-3 border-b border-border"
        style={{ background: 'var(--primary)', boxShadow: '0 2px 12px rgba(0,53,128,0.2)' }}
      >
        <div className="flex items-center gap-3">
          <AppLogo size={30} onClick={() => router.push('/')} />
          <span className="font-extrabold text-base text-white tracking-tight hidden sm:block">ScotSpeak</span>
        </div>

        {/* Student badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-full px-3 py-1.5" style={{ background: 'rgba(255,255,255,0.12)' }}>
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-primary"
              style={{ background: 'var(--accent)' }}
              aria-hidden="true"
            >
              {student.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <p className="text-white text-xs font-700 leading-none" style={{ fontWeight: 700 }}>
                {student.name}
              </p>
              <p className="text-white/60 text-xs leading-none mt-0.5">{student.station}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg p-2 text-white/70 hover:text-white hover:bg-white/10 transition-all duration-150"
            title="Sair — voltar para seleção de estudante"
            aria-label="Sair e voltar para a seleção de estudante"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-3 md:px-8 xl:px-12 py-4 md:py-6">
        {/* Page title */}
        <div className="mb-4 md:mb-6 fade-in">
          <h1 className="text-xl md:text-2xl font-extrabold text-foreground">
            Estúdio de{' '}
            <span style={{ color: 'var(--primary)' }}>{student.name}</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {student.station} · Evento Escócia 2026
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 md:gap-2 mb-4 md:mb-6 p-1 rounded-xl w-full sm:w-fit" style={{ background: 'var(--secondary)' }}>
          {[
            {
              id: 'edit' as TabId,
              label: 'Minha Fala',
              icon: (
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              ),
            },
            {
              id: 'practice' as TabId,
              label: 'Área de Prática',
              icon: (
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              ),
            },
          ].map((tab) => (
            <button
              key={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2.5 rounded-lg text-sm font-600 transition-all duration-200 touch-manipulation ${
                activeTab === tab.id ? 'tab-active' : 'tab-inactive'
              }`}
              style={{ fontWeight: 600, WebkitTapHighlightColor: 'transparent' }}
              aria-selected={activeTab === tab.id}
              role="tab"
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="fade-in" key={`tab-content-${activeTab}`}>
          {activeTab === 'edit' ? (
            <ScriptEditor
              studentName={student.name}
              initialScript={savedScript}
              onSave={handleScriptSaved}
            />
          ) : (
            <PracticeArea
              savedScript={savedScript}
              studentName={student.name}
              station={student.station}
              onRequestEdit={() => setActiveTab('edit')}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 px-4 md:px-8 text-center">
        <p className="text-xs text-muted-foreground">
          ScotSpeak · Evento Escócia 2026 · Dados sincronizados com a nuvem
        </p>
      </footer>
    </div>
  );
}