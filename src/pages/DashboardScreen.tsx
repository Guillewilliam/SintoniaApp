import React, { useState, useEffect } from 'react';
import { Connection, UserProfile, Question } from '../types';
import { subscribeToUserConnections, updateConnectionPreferences } from '../services/connectionService';
import {
  CATEGORIES,
  getDailyQuestionForCategory,
  getDayKey,
  getMsUntilNextMidnight,
  formatTimeRemaining
} from '../data/questions';
import {
  Sparkles,
  UserPlus,
  KeyRound,
  Play,
  Heart,
  Users,
  Clock,
  ChevronRight,
  Flame,
  CheckCircle2,
  Share2,
  Compass,
  Scale,
  Tv,
  Shuffle,
  UserCheck,
  Filter,
  Check,
  Send,
  Calendar,
  Layers,
  Settings
} from 'lucide-react';

interface DashboardScreenProps {
  user: UserProfile;
  onOpenCreateInvite: () => void;
  onOpenEnterCode: () => void;
  onSelectConnection: (conn: Connection) => void;
  onStartSession: (conn: Connection) => void;
}

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

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  user,
  onOpenCreateInvite,
  onOpenEnterCode,
  onSelectConnection,
  onStartSession
}) => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Selectable Category for the Daily Question
  const [selectedDailyCat, setSelectedDailyCat] = useState<string>(() => {
    return localStorage.getItem('sintonia_daily_cat') || 'pareja';
  });

  // 2. 24-Hour Timer (resets at 00:00:00 every day)
  const [msRemaining, setMsRemaining] = useState<number>(() => getMsUntilNextMidnight());
  const [dayKey, setDayKey] = useState<string>(() => getDayKey());

  useEffect(() => {
    const timer = setInterval(() => {
      const ms = getMsUntilNextMidnight();
      setMsRemaining(ms);
      // If midnight passed, dayKey changes
      const currentDay = getDayKey();
      if (currentDay !== dayKey) {
        setDayKey(currentDay);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [dayKey]);

  const countdown = formatTimeRemaining(msRemaining);
  const currentDailyQuestion: Question = getDailyQuestionForCategory(selectedDailyCat);

  // 3. Daily Answer state
  const storageAnswerKey = `sintonia_daily_ans_${dayKey}_${selectedDailyCat}`;
  const [dailyAnswerText, setDailyAnswerText] = useState<string>(() => {
    return localStorage.getItem(storageAnswerKey) || '';
  });
  const [isAnswerSaved, setIsAnswerSaved] = useState<boolean>(() => {
    return !!localStorage.getItem(storageAnswerKey);
  });
  const [isAnswering, setIsAnswering] = useState<boolean>(false);
  const [copiedShare, setCopiedShare] = useState<boolean>(false);

  // Keep answer synced when category changes
  useEffect(() => {
    const key = `sintonia_daily_ans_${dayKey}_${selectedDailyCat}`;
    const saved = localStorage.getItem(key);
    setDailyAnswerText(saved || '');
    setIsAnswerSaved(!!saved);
    localStorage.setItem('sintonia_daily_cat', selectedDailyCat);
  }, [selectedDailyCat, dayKey]);

  const handleSaveDailyAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dailyAnswerText.trim()) return;
    const key = `sintonia_daily_ans_${dayKey}_${selectedDailyCat}`;
    localStorage.setItem(key, dailyAnswerText.trim());
    setIsAnswerSaved(true);
    setIsAnswering(false);
  };

  const handleShareQuestion = async () => {
    const text = `✨ Pregunta del día en Sintonía (${CATEGORIES.find(c => c.id === selectedDailyCat)?.name}):\n\n"${currentDailyQuestion.text}"\n\n¿Qué responderías tú?`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Pregunta de Sintonía',
          text
        });
      } catch {}
    } else {
      navigator.clipboard.writeText(text);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };

  // 4. Category Filter Modal for Sessions
  const [editingConnForCats, setEditingConnForCats] = useState<Connection | null>(null);
  const [tempCats, setTempCats] = useState<string[]>([]);
  const [savingCats, setSavingCats] = useState(false);

  // Subscribe to connections
  useEffect(() => {
    const unsubscribe = subscribeToUserConnections(user.uid, (conns) => {
      setConnections(conns);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [user.uid]);

  const formatLastActivity = (timestamp: number) => {
    if (!timestamp) return 'Reciente';
    const diffHours = Math.round((Date.now() - timestamp) / (1000 * 60 * 60));
    if (diffHours < 1) return 'Hace unos momentos';
    if (diffHours < 24) return `Hace ${diffHours} h`;
    const diffDays = Math.round(diffHours / 24);
    return `Hace ${diffDays} d`;
  };

  const openCategoryModalFor = (conn: Connection) => {
    setEditingConnForCats(conn);
    setTempCats(conn.preferences?.categories || ['pareja', 'amistad', 'profundas']);
  };

  const toggleModalCat = (catId: string) => {
    if (tempCats.includes(catId)) {
      if (tempCats.length === 1) return;
      setTempCats(tempCats.filter(c => c !== catId));
    } else {
      setTempCats([...tempCats, catId]);
    }
  };

  const handleSaveConnectionCats = async () => {
    if (!editingConnForCats) return;
    setSavingCats(true);
    try {
      await updateConnectionPreferences(editingConnForCats.id, {
        categories: tempCats,
        intensity: editingConnForCats.preferences?.intensity || 'normal'
      });
      setEditingConnForCats(null);
    } catch (err: any) {
      alert(err.message || 'Error al guardar categorías');
    } finally {
      setSavingCats(false);
    }
  };

  const activeCategoryObj = CATEGORIES.find(c => c.id === selectedDailyCat) || CATEGORIES[0];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-7">
      
      {/* Personalized Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Hola, {user.displayName} 👋
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            ¿Listo para conectar con tu pareja o amigos hoy?
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCreateInvite}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invitar</span>
          </button>

          <button
            onClick={onOpenEnterCode}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <KeyRound className="w-4 h-4 text-indigo-500" />
            <span>Introducir código</span>
          </button>
        </div>
      </div>

      {/* 24-HOUR DAILY QUESTION SPARK CARD WITH SELECTABLE CATEGORIES */}
      <div className="relative p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden transition-all duration-200">
        
        {/* Soft atmospheric gradient accent */}
        <div className={`absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-br ${activeCategoryObj.color} opacity-15 rounded-full blur-3xl pointer-events-none`}></div>

        {/* Card Header: 24h Timer & Refresh notice */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                Pregunta del Día • 24 Horas
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block -mt-0.5">
                Cambia automáticamente a las 00:00 cada día
              </span>
            </div>
          </div>

          {/* Countdown Clock */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 self-start sm:self-auto shadow-sm">
            <Clock className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
            <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
              {countdown.formatted}
            </span>
          </div>
        </div>

        {/* SELECTABLE CATEGORIES HORIZONTAL PILLS */}
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Selecciona categoría diaria:
            </span>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
              520 preguntas por categoría
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 pt-0.5 no-scrollbar scroll-smooth">
            {CATEGORIES.map(cat => {
              const isSelected = cat.id === selectedDailyCat;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedDailyCat(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex-shrink-0 ${
                    isSelected
                      ? `bg-gradient-to-r ${cat.color} text-white shadow-md scale-102`
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-slate-700/60'
                  }`}
                >
                  <span className="flex-shrink-0">{CATEGORY_ICONS[cat.id]}</span>
                  <span>{cat.name}</span>
                  {cat.isAdultOnly && (
                    <span className="text-[9px] px-1 py-0.2 bg-red-600 text-white rounded-md font-mono">18+</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* The Question Text Display */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/90 dark:border-slate-800 mb-4 shadow-inner">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2.5 py-0.5 rounded-md bg-gradient-to-r ${activeCategoryObj.color} text-white text-[10px] font-extrabold uppercase`}>
              {activeCategoryObj.name}
            </span>
            <span className="text-[10px] text-slate-500 font-medium capitalize">
              Intensidad {currentDailyQuestion.intensity}
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
            "{currentDailyQuestion.text}"
          </h3>
        </div>

        {/* Interaction / Response Section */}
        {isAnswerSaved && !isAnswering ? (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-medium">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>Has respondido a la pregunta de hoy en <strong>{activeCategoryObj.name}</strong></span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAnswering(true)}
                className="px-2.5 py-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-[11px] font-semibold underline cursor-pointer"
              >
                Ver / Editar
              </button>
              <button
                onClick={handleShareQuestion}
                className="px-3 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-sm cursor-pointer"
              >
                <Share2 className="w-3 h-3 text-indigo-500" />
                <span>{copiedShare ? '¡Copiado!' : 'Compartir'}</span>
              </button>
            </div>
          </div>
        ) : isAnswering ? (
          <form onSubmit={handleSaveDailyAnswer} className="space-y-3 animate-fadeIn">
            <textarea
              required
              rows={3}
              value={dailyAnswerText}
              onChange={(e) => setDailyAnswerText(e.target.value)}
              placeholder={`Escribe tu respuesta a esta pregunta de ${activeCategoryObj.name}...`}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white text-xs rounded-xl p-3 outline-none resize-none transition-all shadow-inner"
            ></textarea>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAnswering(false)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-500/20 cursor-pointer"
              >
                <Send className="w-3 h-3" />
                <span>Guardar respuesta de hoy</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              onClick={() => setIsAnswering(true)}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5 cursor-pointer"
            >
              <span>Escribir mi respuesta de hoy</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleShareQuestion}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <Share2 className="w-3.5 h-3.5 text-indigo-500" />
              <span>{copiedShare ? '¡Copiado!' : 'Compartir'}</span>
            </button>
          </div>
        )}

      </div>

      {/* CONNECTIONS SECTION */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <span>Tus Conexiones</span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
              {connections.length}
            </span>
          </h3>
          <span className="text-[11px] text-slate-500">
            Canales 1 a 1 privados
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            <span className="inline-block w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-2"></span>
            <p>Cargando tus conexiones...</p>
          </div>
        ) : connections.length === 0 ? (
          /* Empty state */
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-2">
              <Users className="w-8 h-8" />
            </div>

            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              Aún no tienes conexiones
            </h4>

            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              Cada conexión es completamente independiente: puedes tener una con tu pareja y otras con tus amigos por separado, con sus propias preguntas y categorías seleccionables.
            </p>

            <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
              <button
                onClick={onOpenCreateInvite}
                className="px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Generar código de invitación
              </button>
              <button
                onClick={onOpenEnterCode}
                className="px-5 py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer border border-slate-200 dark:border-slate-700 shadow-sm"
              >
                Tengo un código para unirme
              </button>
            </div>
          </div>
        ) : (
          /* List of connections */
          <div className="grid grid-cols-1 gap-3">
            {connections.map((conn) => {
              const partnerUid = conn.participants.find(u => u !== user.uid) || '';
              const partner = conn.participantProfiles[partnerUid] || {
                displayName: 'Compañero/a',
                email: '',
                photoURL: 'avatar_1'
              };

              const activeCats = conn.preferences?.categories || ['pareja', 'amistad', 'profundas'];

              return (
                <div
                  key={conn.id}
                  className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 shadow-md hover:shadow-lg transition-all group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  {/* Left info */}
                  <div 
                    onClick={() => onSelectConnection(conn)}
                    className="flex items-center gap-3.5 cursor-pointer flex-1"
                  >
                    <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-xl font-bold text-white shadow-md flex-shrink-0">
                      {partner.displayName.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                          {partner.displayName}
                        </h4>
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{partner.email}</p>
                      
                      {/* Active Categories Pills for this connection */}
                      <div className="flex items-center gap-1.5 flex-wrap mt-2">
                        {activeCats.slice(0, 3).map(cid => (
                          <span
                            key={cid}
                            className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-semibold capitalize flex items-center gap-1"
                          >
                            {CATEGORY_ICONS[cid]}
                            <span>{cid}</span>
                          </span>
                        ))}
                        {activeCats.length > 3 && (
                          <span className="text-[10px] text-slate-400 font-bold">
                            +{activeCats.length - 3} más
                          </span>
                        )}
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {conn.totalAnsweredQuestions || 0} respondidas
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => openCategoryModalFor(conn)}
                      title="Seleccionar categorías activas para esta conexión"
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700 shadow-sm"
                    >
                      <Filter className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Categorías</span>
                    </button>

                    <button
                      onClick={() => onStartSession(conn)}
                      className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Jugar</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 10 CATEGORIES SHOWCASE WITH QUESTIONS COUNTER */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-500" />
            <span>10 Categorías Disponibles</span>
          </h3>
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
            5.200 preguntas en total
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {CATEGORIES.map(cat => {
            const isSelected = cat.id === selectedDailyCat;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedDailyCat(cat.id)}
                className={`p-3 rounded-2xl text-center space-y-1.5 transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500/50 shadow-md ring-2 ring-indigo-500/20'
                    : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 hover:border-indigo-400/50 shadow-sm'
                }`}
              >
                <div className={`w-9 h-9 mx-auto rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-white text-xs shadow-md`}>
                  {CATEGORY_ICONS[cat.id]}
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                  {cat.name}
                </span>
                <span className="inline-block px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[9px] font-bold text-indigo-600 dark:text-indigo-400">
                  520 preguntas
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CATEGORY SELECTOR MODAL FOR CONNECTIONS */}
      {editingConnForCats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-scaleIn">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Filter className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    Categorías seleccionables
                  </h4>
                  <p className="text-xs text-slate-500">
                    Elige qué categorías se jugarán con esta persona
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
              {CATEGORIES.map(cat => {
                const isChecked = tempCats.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleModalCat(cat.id)}
                    className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isChecked
                        ? 'bg-indigo-50 dark:bg-indigo-500/15 border-indigo-500/60 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`p-1.5 rounded-lg bg-gradient-to-br ${cat.color} text-white text-xs`}>
                        {CATEGORY_ICONS[cat.id]}
                      </span>
                      <div className="truncate">
                        <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                          {cat.name}
                        </span>
                        <span className="text-[10px] text-slate-500 block">520 preg.</span>
                      </div>
                    </div>
                    {isChecked ? (
                      <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 flex-shrink-0"></span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500 font-semibold">
                {tempCats.length} categorías seleccionadas
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingConnForCats(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveConnectionCats}
                  disabled={savingCats || tempCats.length === 0}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 cursor-pointer disabled:opacity-40"
                >
                  {savingCats ? 'Guardando...' : 'Aplicar'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
