import React, { useState, useEffect } from 'react';
import { Connection, GameSession, UserProfile, TurnAnswer } from '../types';
import {
  startOrResumeSession,
  subscribeToSession,
  submitTurnAnswer,
  getRevealedAnswers,
  advanceToNextTurn
} from '../services/sessionService';
import { CATEGORIES } from '../data/questions';
import {
  ArrowLeft,
  Send,
  Lock,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  Flame,
  Heart,
  Users,
  Compass,
  KeyRound,
  Scale,
  Tv,
  Shuffle,
  UserCheck,
  Filter,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SessionGameScreenProps {
  connection: Connection;
  currentUser: UserProfile;
  onBack: () => void;
  onOpenHistory: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  pareja: 'from-rose-500 to-pink-600',
  amistad: 'from-blue-500 to-cyan-600',
  diversion: 'from-amber-500 to-yellow-600',
  personalidad: 'from-emerald-500 to-teal-600',
  profundas: 'from-indigo-500 to-violet-600',
  picante: 'from-red-500 to-orange-600',
  secretos: 'from-purple-500 to-fuchsia-600',
  dilemas: 'from-cyan-500 to-blue-600',
  cultura_pop: 'from-fuchsia-500 to-pink-600',
  aleatorias: 'from-violet-500 to-indigo-600'
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  pareja: <Heart className="w-4 h-4" />,
  amistad: <Users className="w-4 h-4" />,
  diversion: <Sparkles className="w-4 h-4" />,
  personalidad: <UserCheck className="w-4 h-4" />,
  profundas: <Compass className="w-4 h-4" />,
  picante: <Flame className="w-4 h-4" />,
  secretos: <KeyRound className="w-4 h-4" />,
  dilemas: <Scale className="w-4 h-4" />,
  cultura_pop: <Tv className="w-4 h-4" />,
  aleatorias: <Shuffle className="w-4 h-4" />
};

export const SessionGameScreen: React.FC<SessionGameScreenProps> = ({
  connection,
  currentUser,
  onBack,
  onOpenHistory
}) => {
  const partnerUid = connection.participants.find(u => u !== currentUser.uid) || '';
  const partner = connection.participantProfiles[partnerUid] || {
    displayName: 'Compañero/a',
    email: '',
    photoURL: 'avatar_1'
  };

  const [session, setSession] = useState<GameSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [myAnswerText, setMyAnswerText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [advancing, setAdvancing] = useState(false);

  // Active categories for session
  const [activeSessionCats, setActiveSessionCats] = useState<string[]>(
    connection.preferences?.categories || ['pareja', 'amistad', 'profundas']
  );
  const [showCatPicker, setShowCatPicker] = useState(false);

  // When revealed, holds the two decrypted/fetched answers
  const [revealedAnswers, setRevealedAnswers] = useState<{ [uid: string]: TurnAnswer } | null>(null);

  // 1. Initialize or resume session
  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | null = null;

    const init = async () => {
      setLoading(true);
      try {
        const gameSession = await startOrResumeSession(
          connection.id,
          connection.participants,
          activeSessionCats,
          connection.preferences?.intensity || 'normal'
        );

        if (!mounted) return;
        setSession(gameSession);

        // Subscribe to real-time updates for this session
        unsubscribe = subscribeToSession(connection.id, gameSession.id, (updatedSession) => {
          if (!mounted) return;
          if (updatedSession) {
            setSession(updatedSession);
          }
        });
      } catch (err) {
        console.error('Error starting game session:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    return () => {
      mounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [connection.id]);

  // 2. Watch for revealed status changes to fetch answers and trigger confetti
  useEffect(() => {
    if (!session) return;

    if (session.turnStatus === 'revealed') {
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 }
        });
      } catch {}

      getRevealedAnswers(
        connection.id,
        session.id,
        session.currentTurnIndex,
        session.participants
      ).then(answers => {
        setRevealedAnswers(answers);
      });
    } else {
      setRevealedAnswers(null);
    }
  }, [session?.turnStatus, session?.currentTurnIndex]);

  // Status checks
  const myAnswerSubmitted = session?.userAnswered?.[currentUser.uid] === true;
  const partnerAnswerSubmitted = session?.userAnswered?.[partnerUid] === true;
  const isBothRevealed = session?.turnStatus === 'revealed';

  // Handle submit answer
  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !myAnswerText.trim() || submitting) return;

    setSubmitting(true);
    try {
      await submitTurnAnswer(
        connection.id,
        session.id,
        session.currentTurnIndex,
        session.currentQuestion,
        currentUser.uid,
        currentUser.displayName,
        myAnswerText.trim()
      );
      setMyAnswerText('');
    } catch (err: any) {
      alert(err.message || 'Error al enviar la respuesta.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle advance turn
  const handleNextQuestion = async () => {
    if (!session || advancing) return;
    setAdvancing(true);
    try {
      await advanceToNextTurn(
        connection.id,
        session.id,
        session.currentTurnIndex,
        activeSessionCats,
        session.intensity
      );
      setMyAnswerText('');
      setRevealedAnswers(null);
    } catch (err: any) {
      alert(err.message || 'Error al avanzar a la siguiente pregunta.');
    } finally {
      setAdvancing(false);
    }
  };

  const toggleSessionCat = (catId: string) => {
    if (activeSessionCats.includes(catId)) {
      if (activeSessionCats.length === 1) return;
      setActiveSessionCats(activeSessionCats.filter(c => c !== catId));
    } else {
      setActiveSessionCats([...activeSessionCats, catId]);
    }
  };

  if (loading || !session) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
        <span className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-3"></span>
        <p className="text-sm text-slate-600 dark:text-slate-300">Conectando sesión sincronizada...</p>
      </div>
    );
  }

  const categoryGradient = CATEGORY_COLORS[session.currentQuestion.categoryId] || 'from-indigo-500 to-purple-600';
  const categoryName = CATEGORIES.find(c => c.id === session.currentQuestion.categoryId)?.name || session.currentQuestion.categoryId;

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
      
      {/* Session Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al inicio</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            Jugando con <strong className="text-slate-900 dark:text-white">{partner.displayName}</strong>
          </span>
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-[10px] font-bold text-white shadow">
            {partner.displayName.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Turn indicator & category badges with selectable filter button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full bg-gradient-to-r ${categoryGradient} text-white text-[11px] font-bold capitalize shadow-sm flex items-center gap-1`}>
            {CATEGORY_ICONS[session.currentQuestion.categoryId]}
            <span>{categoryName}</span>
          </span>
          <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-semibold uppercase tracking-wider border border-slate-200 dark:border-slate-700">
            {session.intensity}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCatPicker(!showCatPicker)}
            className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold flex items-center gap-1 border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            <Filter className="w-3 h-3 text-indigo-500" />
            <span>{activeSessionCats.length} categorías activas</span>
          </button>
          <span className="text-xs font-mono font-bold text-slate-500">
            #{session.currentTurnIndex}
          </span>
        </div>
      </div>

      {/* Quick Category Picker Dropdown in Session */}
      {showCatPicker && (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-3 animate-scaleIn">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              Filtrar categorías para las próximas preguntas:
            </span>
            <button
              onClick={() => setShowCatPicker(false)}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-bold cursor-pointer"
            >
              Listo
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {CATEGORIES.map(c => {
              const active = activeSessionCats.includes(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => toggleSessionCat(c.id)}
                  className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-between border transition-all cursor-pointer ${
                    active
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500/50 text-indigo-900 dark:text-indigo-200'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 text-slate-500 opacity-60'
                  }`}
                >
                  <span className="truncate">{c.name}</span>
                  {active && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Question Card */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-all duration-200">
        
        {/* Glow ambient accent */}
        <div className={`absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-br ${categoryGradient} opacity-15 rounded-full blur-3xl pointer-events-none`}></div>

        <p className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Vuestra pregunta sincronizada</span>
        </p>

        <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-relaxed">
          {session.currentQuestion.text}
        </h3>

        {/* Sync Status Badge */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${myAnswerSubmitted ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
            <span className="text-slate-600 dark:text-slate-400">
              Tú: <strong className={myAnswerSubmitted ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                {myAnswerSubmitted ? 'Respondido ✓' : 'Pendiente'}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${partnerAnswerSubmitted ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
            <span className="text-slate-600 dark:text-slate-400">
              {partner.displayName}: <strong className={partnerAnswerSubmitted ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                {partnerAnswerSubmitted ? 'Respondido ✓' : 'Pendiente'}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Gameplay State Sections */}

      {/* STATE 1: WAITING FOR MY ANSWER */}
      {!myAnswerSubmitted && !isBothRevealed && (
        <form onSubmit={handleSubmitAnswer} className="space-y-4 animate-fadeIn">
          <div className="relative">
            <textarea
              required
              rows={4}
              value={myAnswerText}
              onChange={(e) => setMyAnswerText(e.target.value)}
              placeholder="Escribe tu respuesta con total sinceridad... Nadie podrá leerla hasta que ambos hayáis respondido."
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white text-sm rounded-2xl p-4 outline-none transition-all resize-none shadow-inner"
            ></textarea>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-2 px-1">
              <Lock className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
              <span>Respuesta protegida: se revelará únicamente cuando {partner.displayName} envíe la suya.</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !myAnswerText.trim()}
            className="w-full py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
          >
            {submitting ? (
              <span className="inline-block w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <span>Enviar mi respuesta protegida</span>
                <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      {/* STATE 2: WAITING FOR PARTNER'S ANSWER */}
      {myAnswerSubmitted && !isBothRevealed && (
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4 animate-fadeIn shadow-xl">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h4 className="text-lg font-bold text-slate-900 dark:text-white">
            ¡Tu respuesta ha sido guardada!
          </h4>

          <div className="flex items-center justify-center gap-2 text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 py-2 px-4 rounded-xl max-w-sm mx-auto font-medium">
            <Clock className="w-4 h-4 animate-spin text-amber-500" />
            <span>Esperando a que {partner.displayName} responda...</span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            Por seguridad y complicidad, la respuesta permanece oculta en la base de datos hasta que ambos hayáis participado.
          </p>

          <p className="text-[11px] text-indigo-600 dark:text-indigo-400 italic">
            La pantalla se actualizará automáticamente en cuanto {partner.displayName} pulse enviar.
          </p>
        </div>
      )}

      {/* STATE 3: BOTH ANSWERED — REVEAL! */}
      {isBothRevealed && (
        <div className="space-y-5 animate-scaleIn">
          <div className="text-center">
            <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-extrabold text-xs tracking-wider uppercase border border-emerald-200 dark:border-emerald-500/30 shadow-md">
              🎉 ¡Ambos habéis respondido! Respuestas reveladas
            </span>
          </div>

          {/* Side by side / stacked reveal cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* My Answer Card */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-500/30 shadow-xl space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow">
                  {currentUser.displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white">Tú ({currentUser.displayName})</h5>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">Tu respuesta</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                "{revealedAnswers?.[currentUser.uid]?.answerText || 'Cargando tu respuesta...'}"
              </div>
            </div>

            {/* Partner's Answer Card */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-pink-200 dark:border-pink-500/30 shadow-xl space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-xs font-bold text-white shadow">
                  {partner.displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white">{partner.displayName}</h5>
                  <span className="text-[10px] text-pink-600 dark:text-pink-400 font-medium">Su respuesta</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                "{revealedAnswers?.[partnerUid]?.answerText || 'Cargando respuesta de tu compañero/a...'}"
              </div>
            </div>

          </div>

          {/* Actions: Next Question */}
          <div className="space-y-2 pt-2">
            <button
              onClick={handleNextQuestion}
              disabled={advancing}
              className="w-full py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold text-sm rounded-2xl shadow-xl shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {advancing ? (
                <span className="inline-block w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  <span>Siguiente pregunta</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              onClick={onOpenHistory}
              className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors text-center cursor-pointer"
            >
              Ver todo el historial de preguntas respondidas
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
