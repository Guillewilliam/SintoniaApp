import type { QuestionCategory, Question, QuestionIntensity } from '../types/index.ts';
import questionsRaw from './questionsBank.json' with { type: 'json' };

export const CATEGORIES: QuestionCategory[] = [
  {
    id: 'pareja',
    name: 'Pareja',
    description: 'Complicidad, convivencia, futuro y detalles de vuestro vínculo amoroso.',
    icon: 'Heart',
    color: 'from-rose-500 to-pink-600',
    accent: 'text-rose-500 dark:text-rose-400'
  },
  {
    id: 'amistad',
    name: 'Amistad',
    description: 'Lealtad, recuerdos compartidos, apoyo mutuo y anécdotas inolvidables.',
    icon: 'Users',
    color: 'from-blue-500 to-cyan-600',
    accent: 'text-blue-500 dark:text-blue-400'
  },
  {
    id: 'diversion',
    name: 'Diversión',
    description: 'Risas, situaciones disparatadas, locuras hipotéticas y buen rollo.',
    icon: 'Sparkles',
    color: 'from-amber-500 to-yellow-600',
    accent: 'text-amber-500 dark:text-amber-400'
  },
  {
    id: 'personalidad',
    name: 'Personalidad',
    description: 'Cómo te ves a ti mismo, virtudes, defectos curiosos y manías.',
    icon: 'UserCheck',
    color: 'from-emerald-500 to-teal-600',
    accent: 'text-emerald-500 dark:text-emerald-400'
  },
  {
    id: 'profundas',
    name: 'Profundas',
    description: 'Vulnerabilidad, miedos, valores, heridas del pasado y proyectos de vida.',
    icon: 'Compass',
    color: 'from-indigo-500 to-violet-600',
    accent: 'text-indigo-500 dark:text-indigo-400'
  },
  {
    id: 'picante',
    name: 'Picante',
    description: 'Atracción, picardía y fantasías con consentimiento y de buen gusto (18+).',
    icon: 'Flame',
    color: 'from-red-500 to-orange-600',
    accent: 'text-red-500 dark:text-red-400',
    isAdultOnly: true
  },
  {
    id: 'secretos',
    name: 'Secretos',
    description: 'Confesiones inocentes, placeres culpables y cosas que casi nadie sabe.',
    icon: 'KeyRound',
    color: 'from-purple-500 to-fuchsia-600',
    accent: 'text-purple-500 dark:text-purple-400'
  },
  {
    id: 'dilemas',
    name: 'Dilemas',
    description: '«¿Qué preferirías?», decisiones límite y debates morales intensos.',
    icon: 'Scale',
    color: 'from-cyan-500 to-blue-600',
    accent: 'text-cyan-500 dark:text-cyan-400'
  },
  {
    id: 'cultura_pop',
    name: 'Cultura Pop',
    description: 'Música, series, películas, memes y referencias generacionales.',
    icon: 'Tv',
    color: 'from-fuchsia-500 to-pink-600',
    accent: 'text-fuchsia-500 dark:text-fuchsia-400'
  },
  {
    id: 'aleatorias',
    name: 'Aleatorias',
    description: 'Preguntas espontáneas y desconcertantes de cualquier temática.',
    icon: 'Shuffle',
    color: 'from-violet-500 to-indigo-600',
    accent: 'text-violet-500 dark:text-violet-400'
  }
];

export const QUESTIONS_BANK: Question[] = questionsRaw as Question[];

/**
 * Helper to get the canonical date key YYYY-MM-DD
 */
export function getDayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns milliseconds remaining until exactly 00:00:00 of the next calendar day
 */
export function getMsUntilNextMidnight(now = new Date()): number {
  const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  return Math.max(0, nextMidnight.getTime() - now.getTime());
}

/**
 * Formats milliseconds into hours, minutes, and seconds
 */
export function formatTimeRemaining(ms: number): { hours: string; minutes: string; seconds: string; formatted: string } {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const hStr = String(hours).padStart(2, '0');
  const mStr = String(minutes).padStart(2, '0');
  const sStr = String(seconds).padStart(2, '0');
  return {
    hours: hStr,
    minutes: mStr,
    seconds: sStr,
    formatted: `${hStr}h ${mStr}m ${sStr}s`
  };
}

/**
 * Returns today's synchronized daily question for a specific category.
 * Rotates strictly at 00:00 every 24 hours.
 */
export function getDailyQuestionForCategory(categoryId: string, date = new Date()): Question {
  const catQuestions = QUESTIONS_BANK.filter(q => q.categoryId === categoryId);
  const pool = catQuestions.length > 0 ? catQuestions : QUESTIONS_BANK;

  const dayStr = getDayKey(date);
  const seedString = `${dayStr}_${categoryId}`;
  
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = (hash << 5) - hash + seedString.charCodeAt(i);
    hash |= 0;
  }

  const index = Math.abs(hash) % pool.length;
  return pool[index];
}

/**
 * Legacy list kept for backwards-compatibility
 */
export const DAILY_QUESTIONS: Question[] = [
  getDailyQuestionForCategory('pareja'),
  getDailyQuestionForCategory('amistad'),
  getDailyQuestionForCategory('profundas'),
  getDailyQuestionForCategory('diversion'),
  getDailyQuestionForCategory('dilemas')
];

/**
 * Filter questions based on selected categories and preferred intensity.
 * If no questions match exactly, fallback to categories.
 */
export function getQuestionsForSession(
  selectedCategories: string[],
  preferredIntensity: QuestionIntensity
): Question[] {
  const filtered = QUESTIONS_BANK.filter(q => {
    const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(q.categoryId);
    return categoryMatch && q.intensity === preferredIntensity;
  });

  if (filtered.length >= 3) {
    return shuffleArray(filtered);
  }

  // Fallback: match category regardless of intensity
  const categoryOnly = QUESTIONS_BANK.filter(q => {
    return selectedCategories.length === 0 || selectedCategories.includes(q.categoryId);
  });

  return shuffleArray(categoryOnly.length > 0 ? categoryOnly : QUESTIONS_BANK);
}

function shuffleArray<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
