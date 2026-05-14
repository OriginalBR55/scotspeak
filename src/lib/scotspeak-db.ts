import { createClient } from './supabase/client';

export interface StudentScript {
  id: string;
  student_name: string;
  station: string;
  content: string;
  updated_at: string;
}

export interface PracticeSession {
  id: string;
  student_name: string;
  station: string;
  accuracy: number;
  spoken_text: string;
  practiced_at: string;
}

export interface StudentProgress {
  name: string;
  station: string;
  accuracy: number | null;
  attempts: number;
  lastPractice: string | null;
  hasScript: boolean;
}

// ── Scripts ──────────────────────────────────────────────────────────────────

export async function loadScript(studentName: string, station: string): Promise<string> {
  const supabase = createClient();
  const { data } = await supabase
    .from('student_scripts')
    .select('content')
    .eq('student_name', studentName)
    .eq('station', station)
    .maybeSingle();
  return data?.content ?? '';
}

export async function saveScript(
  studentName: string,
  station: string,
  content: string
): Promise<void> {
  const supabase = createClient();
  await supabase.from('student_scripts').upsert(
    { student_name: studentName, station, content, updated_at: new Date().toISOString() },
    { onConflict: 'student_name,station' }
  );
}

// ── Practice sessions ────────────────────────────────────────────────────────

export async function savePracticeSession(
  studentName: string,
  station: string,
  accuracy: number,
  spokenText: string
): Promise<void> {
  const supabase = createClient();
  await supabase.from('practice_sessions').insert({
    student_name: studentName,
    station,
    accuracy,
    spoken_text: spokenText,
    practiced_at: new Date().toISOString(),
  });
}

export async function loadAttemptCount(studentName: string, station: string): Promise<number> {
  const supabase = createClient();
  const { count } = await supabase
    .from('practice_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('student_name', studentName)
    .eq('station', station);
  return count ?? 0;
}

// ── Educator dashboard ───────────────────────────────────────────────────────

export async function loadAllStudentProgress(
  stations: Record<string, string[]>
): Promise<StudentProgress[]> {
  const supabase = createClient();

  const [scriptsRes, sessionsRes] = await Promise.all([
    supabase.from('student_scripts').select('student_name, station, content, updated_at'),
    supabase
      .from('practice_sessions')
      .select('student_name, station, accuracy, practiced_at')
      .order('practiced_at', { ascending: false }),
  ]);

  const scripts: StudentScript[] = scriptsRes.data ?? [];
  const sessions: Pick<PracticeSession, 'student_name' | 'station' | 'accuracy' | 'practiced_at'>[] =
    sessionsRes.data ?? [];

  const scriptMap = new Map(scripts.map((s) => [`${s.student_name}|${s.station}`, s]));

  // Group sessions per student to compute attempts + latest accuracy
  const sessionMap = new Map<
    string,
    { attempts: number; lastAccuracy: number | null; lastPractice: string | null }
  >();
  for (const sess of sessions) {
    const key = `${sess.student_name}|${sess.station}`;
    if (!sessionMap.has(key)) {
      sessionMap.set(key, {
        attempts: 0,
        lastAccuracy: sess.accuracy,
        lastPractice: sess.practiced_at,
      });
    }
    const entry = sessionMap.get(key)!;
    entry.attempts += 1;
  }

  const result: StudentProgress[] = [];
  for (const [station, names] of Object.entries(stations)) {
    for (const name of names) {
      const key = `${name}|${station}`;
      const script = scriptMap.get(key);
      const sessData = sessionMap.get(key);
      result.push({
        name,
        station,
        accuracy: sessData?.lastAccuracy ?? null,
        attempts: sessData?.attempts ?? 0,
        lastPractice: sessData?.lastPractice ?? null,
        hasScript: (script?.content ?? '').length > 0,
      });
    }
  }
  return result;
}
