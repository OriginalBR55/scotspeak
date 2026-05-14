'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { savePracticeSession, loadAttemptCount } from '@/lib/scotspeak-db';

// ── Types ────────────────────────────────────────────────────────────────────
type WordStatus = 'neutral' | 'correct' | 'incorrect' | 'pending';

type WordResult = {
  word: string;
  status: WordStatus;
};

type RecordingState = 'idle' | 'recording' | 'processing' | 'done';

type SpeechRecognitionEvent = {
  results: SpeechRecognitionResultList;
};

type SpeechRecognitionErrorEvent = {
  error: string;
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function normalizeWord(w: string): string {
  return w
    .toLowerCase()
    .replace(/[^a-z0-9']/g, '')
    .trim();
}

function compareScripts(original: string, spoken: string): WordResult[] {
  const originalWords = original.trim().split(/\s+/).filter(Boolean);
  const spokenNormalized = spoken
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(normalizeWord);

  return originalWords.map((word) => {
    const norm = normalizeWord(word);
    const found = spokenNormalized.includes(norm);
    return { word, status: found ? 'correct' : 'incorrect' };
  });
}

function calcAccuracy(results: WordResult[]): number {
  if (results.length === 0) return 0;
  const correct = results.filter((r) => r.status === 'correct').length;
  return Math.round((correct / results.length) * 100);
}

function getAccuracyLabel(pct: number): { label: string; className: string } {
  if (pct >= 90) return { label: 'Excelente!', className: 'accuracy-excellent' };
  if (pct >= 70) return { label: 'Muito bom!', className: 'accuracy-good' };
  if (pct >= 50) return { label: 'Continue praticando', className: 'accuracy-fair' };
  return { label: 'Precisa melhorar', className: 'accuracy-poor' };
}

// ── Props ────────────────────────────────────────────────────────────────────
type Props = {
  savedScript: string;
  studentName: string;
  station: string;
  onRequestEdit: () => void;
};

// ── Main Component ───────────────────────────────────────────────────────────
export default function PracticeArea({ savedScript, studentName, station, onRequestEdit }: Props) {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [wordResults, setWordResults] = useState<WordResult[]>([]);
  const [spokenText, setSpokenText] = useState('');
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);
  const [ttsSupported, setTtsSupported] = useState(true);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  // FIX: use a ref to track whether a result was received, avoiding stale closure in onend
  const resultReceivedRef = useRef(false);

  useEffect(() => {
    const SpeechRecognitionAPI =
      (window as Window & { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition })
        .SpeechRecognition ||
      (window as Window & { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition })
        .webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setSpeechSupported(false);
    }
    if (!window.speechSynthesis) {
      setTtsSupported(false);
    }
    loadAttemptCount(studentName, station).then((count) => setAttemptCount(count));
  }, [savedScript, studentName, station]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) recognitionRef.current.abort();
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  // ── TTS ──────────────────────────────────────────────────────────────────
  const handleListen = useCallback(() => {
    if (!ttsSupported || !savedScript) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(savedScript);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1;

    const voices = window.speechSynthesis.getVoices();
    const enVoice = voices.find(
      (v) => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha'))
    ) || voices.find((v) => v.lang.startsWith('en'));
    if (enVoice) utterance.voice = enVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [savedScript, isSpeaking, ttsSupported]);

  // ── Speech Recognition ───────────────────────────────────────────────────
  const startRecording = useCallback(() => {
    if (!speechSupported) return;
    setError('');
    setWordResults([]);
    setSpokenText('');
    setAccuracy(null);
    // FIX: reset the result-received guard before each new attempt
    resultReceivedRef.current = false;

    const SpeechRecognitionAPI =
      (window as Window & { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition })
        .SpeechRecognition ||
      (window as Window & { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition })
        .webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setRecordingState('recording');
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // FIX: mark that we received a result so onend won't reset to idle
      resultReceivedRef.current = true;
      const transcript = event.results[0][0].transcript;
      setSpokenText(transcript);
      setRecordingState('processing');
      if (timerRef.current) clearInterval(timerRef.current);

      setTimeout(() => {
        const results = compareScripts(savedScript, transcript);
        setWordResults(results);
        const pct = calcAccuracy(results);
        setAccuracy(pct);
        setRecordingState('done');

        savePracticeSession(studentName, station, pct, transcript).then(() => {
          setAttemptCount((prev) => prev + 1);
        });
      }, 400);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // FIX: mark as result received so onend doesn't double-reset
      resultReceivedRef.current = true;
      setRecordingState('idle');
      if (timerRef.current) clearInterval(timerRef.current);
      if (event.error === 'no-speech') {
        setError('Nenhuma fala detectada. Tente novamente e fale claramente para o microfone.');
      } else if (event.error === 'not-allowed') {
        setError('Acesso ao microfone negado. Verifique as permissões do navegador e tente novamente.');
      } else if (event.error === 'network') {
        setError('Erro de rede ao processar o áudio. Verifique sua conexão e tente novamente.');
      } else if (event.error === 'aborted') {
        // User manually stopped — no error message needed
      } else {
        setError(`Erro no reconhecimento de voz: ${event.error}. Tente novamente.`);
      }
    };

    recognition.onend = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      // FIX: only reset to idle if no result/error was already handled
      if (!resultReceivedRef.current) {
        setRecordingState('idle');
        setError('Nenhuma fala detectada. Tente novamente e fale claramente para o microfone.');
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setError('Não foi possível iniciar o microfone. Recarregue a página e tente novamente.');
      setRecordingState('idle');
    }
  }, [speechSupported, savedScript]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  function handleReset() {
    setWordResults([]);
    setSpokenText('');
    setAccuracy(null);
    setRecordingState('idle');
    setError('');
  }

  // ── No script state ──────────────────────────────────────────────────────
  if (!savedScript) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
          style={{ background: 'var(--secondary)' }}
        >
          <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </div>
        <h3 className="font-700 text-foreground text-lg mb-2" style={{ fontWeight: 700 }}>
          Nenhum roteiro salvo
        </h3>
        <p className="text-muted-foreground text-sm mb-6 max-w-sm">
          Você precisa escrever e salvar seu roteiro na aba "Minha Fala" antes de começar a praticar.
        </p>
        <button
          onClick={onRequestEdit}
          className="btn-primary flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-600"
          style={{ fontWeight: 600 }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Escrever Meu Roteiro
        </button>
      </div>
    );
  }

  const accuracyInfo = accuracy !== null ? getAccuracyLabel(accuracy) : null;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
      {/* Practice controls — main column */}
      <div className="xl:col-span-2 flex flex-col gap-4 md:gap-5">

        {/* Script reference card */}
        <div
          className="rounded-2xl border border-border overflow-hidden"
          style={{ background: 'var(--card)', boxShadow: '0 2px 12px rgba(0,53,128,0.08)' }}
        >
          <div
            className="flex items-center justify-between px-4 md:px-5 py-3 md:py-4 border-b border-border"
            style={{ background: 'var(--secondary)' }}
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <h2 className="font-700 text-foreground text-sm" style={{ fontWeight: 700 }}>
                Roteiro de Referência
              </h2>
            </div>
            {/* TTS button */}
            <button
              onClick={handleListen}
              disabled={!ttsSupported || recordingState === 'recording'}
              className={`flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-600 transition-all duration-150 ${
                isSpeaking ? 'btn-danger' : 'btn-accent'
              }`}
              style={{ fontWeight: 600 }}
              title={isSpeaking ? 'Parar leitura' : 'Ouvir Roteiro com voz en-US'}
              aria-label={isSpeaking ? 'Parar leitura do roteiro' : 'Ouvir roteiro em inglês'}
            >
              {isSpeaking ? (
                <>
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                  <span className="hidden sm:inline">Parar</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6v12m-3.536-9.536a5 5 0 000 7.072" />
                  </svg>
                  <span>Ouvir Roteiro</span>
                </>
              )}
            </button>
          </div>
          <div className="p-4 md:p-5">
            {wordResults.length > 0 ? (
              <div className="text-sm font-medium leading-loose">
                {wordResults.map((wr, idx) => (
                  <span
                    key={`word-${idx}`}
                    className={`inline-block mr-1 mb-1 ${
                      wr.status === 'correct' ? 'word-correct'
                        : wr.status === 'incorrect' ? 'word-incorrect' : 'word-neutral'
                    }`}
                  >
                    {wr.word}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm font-medium leading-relaxed text-foreground whitespace-pre-wrap">
                {savedScript}
              </p>
            )}

            {wordResults.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-1.5">
                  <span className="word-correct text-xs px-2 py-0.5 rounded">correto</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="word-incorrect text-xs px-2 py-0.5 rounded">incorreto</span>
                </div>
                <p className="text-xs text-muted-foreground ml-auto">
                  {wordResults.filter((w) => w.status === 'correct').length} de {wordResults.length} palavras corretas
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recording controls card */}
        <div
          className="rounded-2xl border border-border overflow-hidden"
          style={{ background: 'var(--card)', boxShadow: '0 2px 12px rgba(0,53,128,0.08)' }}
        >
          <div
            className="px-4 md:px-5 py-3 md:py-4 border-b border-border"
            style={{ background: 'var(--secondary)' }}
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <h2 className="font-700 text-foreground text-sm" style={{ fontWeight: 700 }}>
                Gravar Pronúncia
              </h2>
              {attemptCount > 0 && (
                <span className="ml-auto text-xs text-muted-foreground">
                  {attemptCount} tentativa{attemptCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          <div className="p-4 md:p-6">
            {/* Browser support warning */}
            {!speechSupported && (
              <div className="mb-4 flex items-start gap-3 rounded-xl px-4 py-3 border" style={{ background: '#fef9c3', borderColor: '#fde047' }}>
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#854d0e' }} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-700 mb-0.5" style={{ color: '#854d0e', fontWeight: 700 }}>
                    Reconhecimento de voz não disponível
                  </p>
                  <p className="text-xs" style={{ color: '#92400e' }}>
                    Seu navegador não suporta a Web Speech API. Use Google Chrome ou Microsoft Edge para ativar esta funcionalidade.
                  </p>
                </div>
              </div>
            )}

            {/* Error display */}
            {error && (
              <div className="mb-4 flex items-start gap-3 rounded-xl px-4 py-3 border fade-in" style={{ background: '#fee2e2', borderColor: '#fca5a5' }}>
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-red-700">{error}</p>
                  <button
                    onClick={() => setError('')}
                    className="text-xs text-red-500 underline mt-1"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            )}

            {/* Main recording button area */}
            <div className="flex flex-col items-center gap-4 md:gap-5 py-3 md:py-4">
              {/* Big record button */}
              <div className="relative">
                {recordingState === 'recording' && (
                  <div className="absolute inset-0 rounded-full pulse-ring" />
                )}
                <button
                  onClick={
                    recordingState === 'recording'
                      ? stopRecording
                      : recordingState === 'idle' || recordingState === 'done'
                      ? startRecording
                      : undefined
                  }
                  disabled={!speechSupported || recordingState === 'processing'}
                  className={`relative w-24 h-24 md:w-20 md:h-20 rounded-full flex items-center justify-center transition-all duration-200 touch-manipulation ${
                    recordingState === 'recording' ? 'bg-red-500 hover:bg-red-600 active:bg-red-700 shadow-lg'
                      : recordingState === 'processing' ? 'bg-muted cursor-not-allowed' : 'btn-primary shadow-lg hover:shadow-xl'
                  }`}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                  aria-label={
                    recordingState === 'recording' ? 'Parar gravação'
                      : recordingState === 'processing' ? 'Processando...' : 'Gravar pronúncia'
                  }
                >
                  {recordingState === 'processing' ? (
                    <svg className="animate-spin w-9 h-9 md:w-8 md:h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  ) : recordingState === 'recording' ? (
                    <svg className="w-9 h-9 md:w-8 md:h-8 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <rect x="6" y="6" width="12" height="12" rx="2" />
                    </svg>
                  ) : (
                    <svg className="w-9 h-9 md:w-8 md:h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Status label */}
              <div className="text-center">
                {recordingState === 'idle' && (
                  <p className="text-sm font-600 text-foreground" style={{ fontWeight: 600 }}>
                    Pronto para gravar
                  </p>
                )}
                {recordingState === 'recording' && (
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" aria-hidden="true" />
                      <p className="text-sm font-700 text-red-600" style={{ fontWeight: 700 }}>
                        Gravando...
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono tabular-nums">
                      {String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:
                      {String(recordingSeconds % 60).padStart(2, '0')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Toque no botão para parar quando terminar
                    </p>
                  </div>
                )}
                {recordingState === 'processing' && (
                  <p className="text-sm font-600 text-muted-foreground" style={{ fontWeight: 600 }}>
                    Analisando pronúncia...
                  </p>
                )}
                {recordingState === 'done' && (
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-sm font-700 text-foreground" style={{ fontWeight: 700 }}>
                      Análise concluída
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Toque novamente para tentar de novo
                    </p>
                  </div>
                )}
              </div>

              {/* Instructions */}
              {recordingState === 'idle' && (
                <p className="text-xs text-muted-foreground text-center max-w-xs px-2">
                  Toque no botão e leia seu roteiro em voz alta em inglês. O app vai comparar o que você falou com o texto salvo.
                </p>
              )}
            </div>

            {/* Spoken text display */}
            {spokenText && (
              <div className="mt-4 rounded-xl p-4 border fade-in" style={{ background: 'var(--input)', borderColor: 'var(--border)' }}>
                <p className="text-xs font-700 text-muted-foreground uppercase tracking-wide mb-2" style={{ fontWeight: 700 }}>
                  O que foi detectado:
                </p>
                <p className="text-sm text-foreground font-medium leading-relaxed italic">
                  &ldquo;{spokenText}&rdquo;
                </p>
              </div>
            )}

            {/* Reset button */}
            {recordingState === 'done' && (
              <div className="mt-4 flex justify-end fade-in">
                <button
                  onClick={handleReset}
                  className="btn-outline flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-600 touch-manipulation"
                  style={{ fontWeight: 600, WebkitTapHighlightColor: 'transparent' }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Limpar e Tentar Novamente
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right sidebar — accuracy + tips */}
      <div className="xl:col-span-1 flex flex-col gap-4 md:gap-5">
        {/* Accuracy score card */}
        <div
          className="rounded-2xl border border-border overflow-hidden"
          style={{ background: 'var(--card)', boxShadow: '0 2px 12px rgba(0,53,128,0.08)' }}
        >
          <div
            className="px-4 md:px-5 py-3 md:py-4 border-b border-border"
            style={{ background: 'var(--secondary)' }}
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="font-700 text-foreground text-sm" style={{ fontWeight: 700 }}>
                Precisão
              </h3>
            </div>
          </div>
          <div className="p-4 md:p-5">
            {accuracy !== null && accuracyInfo ? (
              <div className="flex flex-col items-center gap-3 fade-in">
                {/* Circular score */}
                <div className="relative w-28 h-28">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90" aria-hidden="true">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="var(--muted)" strokeWidth="10" />
                    <circle
                      cx="50" cy="50" r="42"
                      fill="none"
                      stroke={
                        accuracy >= 90 ? '#16a34a'
                          : accuracy >= 70 ? '#22c55e'
                          : accuracy >= 50 ? '#f59e0b' : '#ef4444'
                      }
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 42}`}
                      strokeDashoffset={`${2 * Math.PI * 42 * (1 - accuracy / 100)}`}
                      style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-3xl font-extrabold tabular-nums leading-none ${accuracyInfo.className}`}>
                      {accuracy}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">%</span>
                  </div>
                </div>

                <div className="text-center">
                  <p className={`text-base font-700 ${accuracyInfo.className}`} style={{ fontWeight: 700 }}>
                    {accuracyInfo.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {wordResults.filter((w) => w.status === 'correct').length} de {wordResults.length} palavras
                  </p>
                </div>

                <div className="w-full rounded-lg overflow-hidden h-3 flex" style={{ background: 'var(--muted)' }}>
                  <div
                    className="h-full transition-all duration-700"
                    style={{
                      width: `${accuracy}%`,
                      background: accuracy >= 70 ? '#16a34a' : accuracy >= 50 ? '#f59e0b' : '#ef4444',
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground self-start">
                  Tentativa #{attemptCount}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--secondary)' }}
                >
                  <svg className="w-7 h-7 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-sm font-600 text-foreground" style={{ fontWeight: 600 }}>
                  Nenhuma tentativa ainda
                </p>
                <p className="text-xs text-muted-foreground">
                  Grave sua pronúncia para ver sua precisão aqui.
                </p>
                {attemptCount > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Sessões anteriores: {attemptCount} tentativa{attemptCount !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Practice tips card */}
        <div
          className="rounded-2xl border border-border p-4 md:p-5"
          style={{ background: 'var(--card)', boxShadow: '0 2px 12px rgba(0,53,128,0.08)' }}
        >
          <div className="flex items-center gap-2 mb-3 md:mb-4">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(0,53,128,0.08)' }}
            >
              <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-700 text-foreground text-sm" style={{ fontWeight: 700 }}>
              Dicas de Prática
            </h3>
          </div>
          <ul className="space-y-2.5 md:space-y-3">
            {[
              { icon: '🎧', tip: 'Ouça o roteiro primeiro para aprender a pronúncia correta.' },
              { icon: '🗣️', tip: 'Fale devagar e claramente — não tente ser rápido.' },
              { icon: '🔁', tip: 'Repita até atingir 90% de precisão consistentemente.' },
              { icon: '📍', tip: 'Palavras em vermelho indicam onde focar seu treino.' },
              { icon: '🎙️', tip: 'Fale próximo ao microfone em ambiente silencioso.' },
            ].map((item, i) => (
              <li key={`practice-tip-${i}`} className="flex items-start gap-2.5">
                <span className="text-base flex-shrink-0 mt-0.5" aria-hidden="true">{item.icon}</span>
                <span className="text-xs text-muted-foreground leading-relaxed">{item.tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Usage hint */}
        <div
          className="rounded-xl p-4 border"
          style={{ background: 'var(--secondary)', borderColor: 'var(--border)' }}
        >
          <p className="text-xs font-700 text-muted-foreground mb-2 uppercase tracking-wide" style={{ fontWeight: 700 }}>
            Dica de Uso
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Use o botão <strong className="text-foreground">"Ouvir Roteiro"</strong> para aprender a pronúncia antes de gravar. Depois toque em <strong className="text-foreground">"Gravar Pronúncia"</strong> e leia o texto em voz alta.
          </p>
        </div>
      </div>
    </div>
  );
}