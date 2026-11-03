import React, { useState, useEffect } from 'react';
import { Connection, UserProfile, HistoryTurnRecord, QuestionIntensity } from '../types';
import { CATEGORIES } from '../data/questions';
import { updateConnectionPreferences, removeConnection } from '../services/connectionService';
import { getConnectionHistory } from '../services/sessionService';
import {
  ArrowLeft,
  Settings,
  History,
  Check,
  AlertTriangle,
  Play,
  Heart,
  Users,
  Sparkles,
  Flame,
  KeyRound,
  Scale,
  Tv,
  Shuffle,
  Compass,
  UserCheck
} from 'lucide-react';

interface ConnectionProfileScreenProps {
  connection: Connection;
  currentUser: UserProfile;
  onBack: () => void;
  onStartSession: (conn: Connection) => void;
  onConnectionRemoved: () => void;
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

export const ConnectionProfileScreen: React.FC<ConnectionProfileScreenProps> = ({
  connection,
  currentUser,
  onBack,
  onStartSession,
  onConnectionRemoved
}) => {
  // Find partner's info
  const partnerUid = connection.participants.find(uid => uid !== currentUser.uid) || '';
  const partner = connection.participantProfiles[partnerUid] || {
    displayName: 'Compañero/a',
    email: '',
    photoURL: 'avatar_1'
  };

  const [activeTab, setActiveTab] = useState<'history' | 'settings'>('history');
  const [history, setHistory] = useState<HistoryTurnRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Preference state
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    connection.preferences?.categories || ['pareja', 'amistad', 'profundas', 'diversion']
  );
  const [selectedIntensity, setSelectedIntensity] = useState<QuestionIntensity>(
    connection.preferences?.intensity || 'normal'
  );
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsMessage, setPrefsMessage] = useState<string | null>(null);

  // Disconnect confirmation
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchHistory = async () => {
      setLoadingHistory(true);
      try {
        const records = await getConnectionHistory(connection.id);
        if (mounted) setHistory(records);
      } catch (err) {
        console.error('Error fetching history:', err);
      } finally {
        if (mounted) setLoadingHistory(false);
      }
    };
    fetchHistory();
    return () => { mounted = false; };
  }, [connection.id]);

  const toggleCategory = (catId: string) => {
    if (selectedCategories.includes(catId)) {
      if (selectedCategories.length === 1) return; // Keep at least one
      setSelectedCategories(selectedCategories.filter(id => id !== catId));
    } else {
      setSelectedCategories([...selectedCategories, catId]);
    }
  };

  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    setPrefsMessage(null);
    try {
      await updateConnectionPreferences(connection.id, {
        categories: selectedCategories,
        intensity: selectedIntensity
      });
      setPrefsMessage('¡Preferencias de esta conexión guardadas con éxito!');
      setTimeout(() => setPrefsMessage(null), 2500);
    } catch (err: any) {
      alert(err.message || 'Error al guardar preferencias.');
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await removeConnection(connection.id);
      onConnectionRemoved();
    } catch (err: any) {
      alert(err.message || 'Error al desconectar.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      
      {/* Top Header Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al panel</span>
        </button>

        <button
          onClick={() => onStartSession(connection)}
          className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Jugar ahora</span>
        </button>
      </div>

      {/* Partner Profile Hero Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left transition-all duration-200">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg flex-shrink-0">
          {partner.displayName.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white truncate">{partner.displayName}</h2>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold">
              Conexión activa
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 truncate">{partner.email}</p>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-[11px] text-slate-600 dark:text-slate-400">
            <span>Preguntas respondidas: <strong className="text-slate-900 dark:text-white font-bold">{connection.totalAnsweredQuestions || history.length}</strong></span>
            <span>Intensidad: <strong className="text-indigo-600 dark:text-indigo-400 capitalize">{selectedIntensity}</strong></span>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <History className="w-4 h-4 text-indigo-500" />
          <span>Historial Revelado ({history.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4 text-purple-500" />
          <span>Categorías e Intensidad</span>
        </button>
      </div>

      {/* TAB CONTENT: HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {loadingHistory ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">
              <span className="inline-block w-5 h-5 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-2"></span>
              <p>Cargando vuestro historial compartido...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="p-8 text-center rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 space-y-2 shadow-sm">
              <Sparkles className="w-8 h-8 text-indigo-500 mx-auto mb-2 opacity-60" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Aún no hay respuestas en el historial</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Las preguntas respondidas se guardarán aquí automáticamente en cuanto ambos hayáis enviado vuestra respuesta.
              </p>
              <button
                onClick={() => onStartSession(connection)}
                className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Comenzar primera ronda
              </button>
            </div>
          ) : (
            history.map((record, index) => (
              <div 
                key={record.turnIndex || index}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4 transition-all"
              >
                {/* Question Info Header */}
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 font-bold capitalize text-[10px] border border-indigo-200 dark:border-indigo-500/20">
                    {record.question.categoryId} • {record.question.intensity}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Ronda #{record.turnIndex}
                  </span>
                </div>

                <h4 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                  {record.question.text}
                </h4>

                {/* Answers Revealed Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {/* Current User Answer */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-indigo-100 dark:border-indigo-500/20">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">
                        {currentUser.displayName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-300">Tú ({currentUser.displayName})</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed italic">
                      "{record.answers[currentUser.uid]?.answerText || 'Respuesta guardada'}"
                    </p>
                  </div>

                  {/* Partner Answer */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-purple-100 dark:border-purple-500/20">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center text-[10px] font-bold text-white">
                        {partner.displayName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-bold text-purple-600 dark:text-purple-300">{partner.displayName}</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed italic">
                      "{record.answers[partnerUid]?.answerText || 'Respuesta guardada'}"
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB CONTENT: SETTINGS */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-5 transition-all">
            
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                Intensidad predeterminada
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                Afecta al tipo y profundidad de las preguntas que se seleccionan para esta conexión.
              </p>
              
              <div className="grid grid-cols-3 gap-2">
                {(['suave', 'normal', 'profunda'] as QuestionIntensity[]).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSelectedIntensity(lvl)}
                    className={`py-2.5 px-3 rounded-2xl text-xs font-bold capitalize transition-all border cursor-pointer ${
                      selectedIntensity === lvl
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-transparent shadow-md'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                Categorías activas para esta conexión
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                Selecciona al menos una categoría para jugar con {partner.displayName}. (Todas tienen 520 preguntas).
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {CATEGORIES.map(cat => {
                  const isSelected = selectedCategories.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500/60 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800/80 text-slate-400 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div className={`p-2 rounded-xl bg-gradient-to-br ${cat.color} text-white shadow-sm flex-shrink-0`}>
                        {CATEGORY_ICONS[cat.id] || <Sparkles className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">{cat.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">{cat.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {prefsMessage && (
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs text-center font-medium">
                {prefsMessage}
              </div>
            )}

            <button
              onClick={handleSavePreferences}
              disabled={savingPrefs}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
            >
              {savingPrefs ? 'Guardando...' : 'Guardar preferencias de conexión'}
            </button>
          </div>

          {/* Danger Zone: Disconnect */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-500/20 space-y-3 shadow-md">
            <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Zona de desconexión</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Si te desconectas de {partner.displayName}, la conexión quedará archivada. Ninguno de los dos podrá iniciar nuevas sesiones a menos que volváis a generar y aceptar una nueva invitación.
            </p>

            {!showDisconnectConfirm ? (
              <button
                type="button"
                onClick={() => setShowDisconnectConfirm(true)}
                className="py-2.5 px-4 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Desconectar de {partner.displayName}
              </button>
            ) : (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/40 space-y-3">
                <p className="text-xs text-rose-800 dark:text-rose-200 font-semibold">
                  ¿Confirmas que deseas desconectarte de {partner.displayName}?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDisconnectConfirm(false)}
                    className="flex-1 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDisconnect}
                    className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Sí, desconectar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
