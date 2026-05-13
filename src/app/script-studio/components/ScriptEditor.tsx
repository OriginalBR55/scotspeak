'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';

type Props = {
  studentName: string;
  initialScript: string;
  onSave: (text: string) => void;
};

type FormValues = {
  scriptText: string;
};

export default function ScriptEditor({ studentName, initialScript, onSave }: Props) {
  const [isEditing, setIsEditing] = useState(!initialScript);
  const [savedText, setSavedText] = useState(initialScript);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { scriptText: initialScript },
  });

  const watchedText = watch('scriptText');
  const charCount = watchedText?.length ?? 0;
  const wordCount = watchedText?.trim().split(/\s+/).filter(Boolean).length ?? 0;

  // Track unsaved changes
  useEffect(() => {
    if (isEditing) {
      setHasUnsaved(watchedText !== savedText);
    }
  }, [watchedText, savedText, isEditing]);

  // Auto-resize textarea
  const { ref: hookFormRef, ...rest } = register('scriptText', {
    required: 'O roteiro não pode estar vazio.',
    minLength: { value: 10, message: 'O roteiro deve ter pelo menos 10 caracteres.' },
  });

  function setTextareaRef(el: HTMLTextAreaElement | null) {
    hookFormRef(el);
    textareaRef.current = el;
    autoResize(el);
  }

  function autoResize(el: HTMLTextAreaElement | null) {
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.max(el.scrollHeight, 200)}px`;
    }
  }

  function onSubmit(values: FormValues) {
    setIsSaving(true);
    // Simulate brief save delay
    setTimeout(() => {
      onSave(values.scriptText);
      setSavedText(values.scriptText);
      setIsEditing(false);
      setHasUnsaved(false);
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 600);
  }

  function handleEdit() {
    reset({ scriptText: savedText });
    setIsEditing(true);
    setSaveSuccess(false);
    setTimeout(() => textareaRef.current?.focus(), 50);
  }

  function handleCancel() {
    reset({ scriptText: savedText });
    setIsEditing(false);
    setHasUnsaved(false);
  }

  function handleClear() {
    reset({ scriptText: '' });
    textareaRef.current?.focus();
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Main editor / saved view */}
      <div className="xl:col-span-2">
        <div
          className="rounded-2xl border border-border overflow-hidden"
          style={{ background: 'var(--card)', boxShadow: '0 2px 12px rgba(0,53,128,0.08)' }}
        >
          {/* Card header */}
          <div
            className="flex items-center justify-between px-5 py-4 border-b border-border"
            style={{ background: 'var(--secondary)' }}
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h2 className="font-700 text-foreground text-sm" style={{ fontWeight: 700 }}>
                Roteiro de {studentName}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {savedText && !isEditing && (
                <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: '#dcfce7', color: '#166534' }}>
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Salvo
                </span>
              )}
              {isEditing && hasUnsaved && (
                <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: '#fef9c3', color: '#854d0e' }}>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                  </svg>
                  Alterações não salvas
                </span>
              )}
            </div>
          </div>

          {/* Editor body */}
          <div className="p-5">
            {isEditing ? (
              <form onSubmit={handleSubmit(onSubmit)}>
                <label htmlFor="scriptText" className="block text-sm font-600 text-foreground mb-1.5" style={{ fontWeight: 600 }}>
                  Seu roteiro em inglês
                </label>
                <p className="text-xs text-muted-foreground mb-3">
                  Digite ou cole seu texto aqui. Escreva exatamente como você vai falar no evento.
                </p>
                <textarea
                  id="scriptText"
                  {...rest}
                  ref={setTextareaRef}
                  onInput={(e) => autoResize(e.currentTarget)}
                  placeholder="Hello everyone! Welcome to our Scotland station. Today we're going to explore..."
                  className="w-full rounded-xl border border-border px-4 py-3 text-sm text-foreground font-medium leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-150 resize-none"
                  style={{
                    background: 'var(--input)',
                    minHeight: '200px',
                    fontFamily: 'var(--font-sans)',
                  }}
                  aria-describedby={errors.scriptText ? 'script-error' : undefined}
                />
                {errors.scriptText && (
                  <p id="script-error" className="mt-1.5 text-sm text-red-600 font-medium flex items-center gap-1">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errors.scriptText.message}
                  </p>
                )}

                {/* Stats bar */}
                <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                  <span>{wordCount} palavra{wordCount !== 1 ? 's' : ''}</span>
                  <span>{charCount} caractere{charCount !== 1 ? 's' : ''}</span>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap items-center gap-3 mt-5 pt-4 border-t border-border">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-600"
                    style={{ fontWeight: 600, minWidth: '140px' }}
                  >
                    {isSaving ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                        Salvar Minha Fala
                      </>
                    )}
                  </button>
                  {savedText && (
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="btn-outline flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-600"
                      style={{ fontWeight: 600 }}
                    >
                      Cancelar
                    </button>
                  )}
                  {watchedText && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="ml-auto text-xs text-muted-foreground hover:text-red-500 transition-colors duration-150 flex items-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Limpar texto
                    </button>
                  )}
                </div>
              </form>
            ) : savedText ? (
              /* Saved view */
              <div>
                {saveSuccess && (
                  <div className="mb-4 flex items-center gap-2 rounded-lg px-4 py-3 fade-in" style={{ background: '#dcfce7', border: '1px solid #86efac' }}>
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#166534' }} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-medium" style={{ color: '#166534' }}>
                      Roteiro salvo com sucesso!
                    </p>
                  </div>
                )}

                <div
                  className="rounded-xl p-5 leading-relaxed text-sm text-foreground font-medium whitespace-pre-wrap"
                  style={{ background: 'var(--input)', border: '1px solid var(--border)', minHeight: '160px' }}
                >
                  {savedText}
                </div>

                {/* Saved stats */}
                <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                  <span>
                    {savedText.trim().split(/\s+/).filter(Boolean).length} palavras ·{' '}
                    {savedText.length} caracteres
                  </span>
                </div>

                <div className="flex flex-wrap gap-3 mt-5 pt-4 border-t border-border">
                  <button
                    onClick={handleEdit}
                    className="btn-outline flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-600"
                    style={{ fontWeight: 600 }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Editar Roteiro
                  </button>
                </div>
              </div>
            ) : (
              /* Empty state */
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <svg className="w-12 h-12 text-muted mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="font-700 text-foreground text-base mb-1" style={{ fontWeight: 700 }}>
                  Nenhum roteiro ainda
                </h3>
                <p className="text-muted-foreground text-sm max-w-xs">
                  Digite seu roteiro em inglês no campo acima e clique em "Salvar Minha Fala" para começar a praticar.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tips sidebar */}
      <div className="xl:col-span-1 flex flex-col gap-4">
        {/* Tips card */}
        <div
          className="rounded-2xl border border-border p-5"
          style={{ background: 'var(--card)', boxShadow: '0 2px 12px rgba(0,53,128,0.08)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(201,168,76,0.15)' }}
            >
              <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="font-700 text-foreground text-sm" style={{ fontWeight: 700 }}>
              Dicas de Escrita
            </h3>
          </div>
          <ul className="space-y-3">
            {[
              'Escreva exatamente como você vai falar — inclua pausas e ênfases.',
              'Use frases curtas e claras para facilitar a memorização.',
              'Revise a ortografia antes de salvar — o reconhecimento é sensível.',
              'Inclua saudações e transições naturais entre os tópicos.',
              'Limite seu roteiro a 60–120 palavras para melhor controle.',
            ].map((tip, i) => (
              <li key={`tip-${i}`} className="flex items-start gap-2.5">
                <span
                  className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                  style={{ background: 'var(--primary)', color: 'white' }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <span className="text-xs text-muted-foreground leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Scotland fact card */}
        <div
          className="rounded-2xl border p-5 relative overflow-hidden"
          style={{ background: 'var(--primary)', borderColor: 'var(--primary)' }}
        >
          <div className="relative z-10">
            <p className="text-xs font-700 uppercase tracking-widest mb-2" style={{ color: 'var(--accent)', fontWeight: 700 }}>
              Scotland Fact
            </p>
            <p className="text-white text-sm leading-relaxed font-medium">
              The thistle has been Scotland&apos;s national emblem since the 13th century, symbolizing resilience and bravery.
            </p>
          </div>
          {/* Decorative cross */}
          <svg className="absolute right-0 bottom-0 opacity-10 w-24 h-24" viewBox="0 0 100 100" aria-hidden="true">
            <line x1="0" y1="0" x2="100" y2="100" stroke="white" strokeWidth="20" />
            <line x1="100" y1="0" x2="0" y2="100" stroke="white" strokeWidth="20" />
          </svg>
        </div>
      </div>
    </div>
  );
}