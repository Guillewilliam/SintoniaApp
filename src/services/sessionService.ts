import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  onSnapshot,
  getDocs,
  query,
  orderBy
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/config';
import {
  GameSession,
  Question,
  QuestionIntensity,
  TurnAnswer,
  HistoryTurnRecord
} from '../types';
import { getQuestionsForSession } from '../data/questions';

const LOCAL_SESSIONS_KEY = 'sintonia_local_sessions';
const LOCAL_ANSWERS_KEY = 'sintonia_local_answers';
const LOCAL_HISTORY_KEY = 'sintonia_local_history';

// 1. START OR RESUME SESSION
export async function startOrResumeSession(
  connectionId: string,
  participants: [string, string],
  categories: string[],
  intensity: QuestionIntensity
): Promise<GameSession> {
  const sessionId = `sess_${connectionId}`;
  const questions = getQuestionsForSession(categories, intensity);
  const firstQuestion = questions[0];

  const initialSession: GameSession = {
    id: sessionId,
    connectionId,
    participants,
    categories,
    intensity,
    status: 'active',
    startedAt: Date.now(),
    currentTurnIndex: 1,
    currentQuestion: firstQuestion,
    turnStatus: 'waiting_answers',
    userAnswered: {
      [participants[0]]: false,
      [participants[1]]: false
    }
  };

  if (isFirebaseConfigured && db) {
    const sessionRef = doc(db, 'connections', connectionId, 'sessions', sessionId);
    const existingSnap = await getDoc(sessionRef);

    if (existingSnap.exists() && existingSnap.data().status === 'active') {
      return existingSnap.data() as GameSession;
    }

    await setDoc(sessionRef, initialSession);
    await updateDoc(doc(db, 'connections', connectionId), {
      activeSessionId: sessionId,
      lastActivity: Date.now()
    });
    return initialSession;
  } else {
    const sessions: Record<string, GameSession> = 
      JSON.parse(localStorage.getItem(LOCAL_SESSIONS_KEY) || '{}');
    
    if (sessions[sessionId] && sessions[sessionId].status === 'active') {
      return sessions[sessionId];
    }

    sessions[sessionId] = initialSession;
    localStorage.setItem(LOCAL_SESSIONS_KEY, JSON.stringify(sessions));
    window.dispatchEvent(new Event('storage'));
    return initialSession;
  }
}

// 2. SUBSCRIBE TO SESSION UPDATES (Real-time sync)
export function subscribeToSession(
  connectionId: string,
  sessionId: string,
  callback: (session: GameSession | null) => void
): () => void {
  if (isFirebaseConfigured && db) {
    const sessionRef = doc(db, 'connections', connectionId, 'sessions', sessionId);
    const unsubscribe = onSnapshot(sessionRef, (snap) => {
      if (snap.exists()) {
        callback(snap.data() as GameSession);
      } else {
        callback(null);
      }
    });
    return unsubscribe;
  } else {
    const loadLocal = () => {
      const sessions: Record<string, GameSession> = 
        JSON.parse(localStorage.getItem(LOCAL_SESSIONS_KEY) || '{}');
      callback(sessions[sessionId] || null);
    };

    loadLocal();
    const handler = () => loadLocal();
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }
}

// 3. SUBMIT ANSWER
export async function submitTurnAnswer(
  connectionId: string,
  sessionId: string,
  turnIndex: number,
  question: Question,
  uid: string,
  displayName: string,
  answerText: string
): Promise<void> {
  const answerId = `${turnIndex}_${uid}`;
  const now = Date.now();

  const answerDoc: TurnAnswer = {
    id: answerId,
    sessionId,
    turnIndex,
    questionId: question.id,
    uid,
    displayName,
    answerText: answerText.trim(),
    answeredAt: now
  };

  if (isFirebaseConfigured && db) {
    // 1. Write the private answer doc to subcollection
    const answerRef = doc(db, 'connections', connectionId, 'sessions', sessionId, 'answers', answerId);
    await setDoc(answerRef, answerDoc);

    // 2. Fetch session to inspect if partner already answered
    const sessionRef = doc(db, 'connections', connectionId, 'sessions', sessionId);
    const sessionSnap = await getDoc(sessionRef);
    if (!sessionSnap.exists()) return;

    const currentSession = sessionSnap.data() as GameSession;
    const partnerUid = currentSession.participants.find(p => p !== uid);
    const partnerAlreadyAnswered = partnerUid ? currentSession.userAnswered[partnerUid] : false;

    const updatedUserAnswered = {
      ...currentSession.userAnswered,
      [uid]: true
    };

    if (partnerAlreadyAnswered) {
      // BOTH have answered! Reveal the answers and record into history
      await updateDoc(sessionRef, {
        userAnswered: updatedUserAnswered,
        turnStatus: 'revealed'
      });

      // Also record history
      await recordTurnInHistory(connectionId, sessionId, turnIndex, question);
    } else {
      // Only current user has answered so far
      await updateDoc(sessionRef, {
        userAnswered: updatedUserAnswered
      });
    }

    // Update connection activity
    await updateDoc(doc(db, 'connections', connectionId), {
      lastActivity: now
    });
  } else {
    // Local sandbox mode
    const answersKey = `${LOCAL_ANSWERS_KEY}_${sessionId}`;
    const answers: Record<string, TurnAnswer> = 
      JSON.parse(localStorage.getItem(answersKey) || '{}');
    answers[answerId] = answerDoc;
    localStorage.setItem(answersKey, JSON.stringify(answers));

    const sessions: Record<string, GameSession> = 
      JSON.parse(localStorage.getItem(LOCAL_SESSIONS_KEY) || '{}');
    const currentSession = sessions[sessionId];

    if (currentSession) {
      const partnerUid = currentSession.participants.find(p => p !== uid);
      const partnerAlreadyAnswered = partnerUid ? currentSession.userAnswered[partnerUid] : false;

      currentSession.userAnswered[uid] = true;

      if (partnerAlreadyAnswered) {
        currentSession.turnStatus = 'revealed';
        // Save local history
        saveLocalTurnHistory(connectionId, sessionId, turnIndex, question);
      }

      sessions[sessionId] = currentSession;
      localStorage.setItem(LOCAL_SESSIONS_KEY, JSON.stringify(sessions));
      window.dispatchEvent(new Event('storage'));
    }
  }
}

// 4. FETCH REVEALED ANSWERS
export async function getRevealedAnswers(
  connectionId: string,
  sessionId: string,
  turnIndex: number,
  participants: [string, string]
): Promise<{ [uid: string]: TurnAnswer } | null> {
  if (isFirebaseConfigured && db) {
    const results: { [uid: string]: TurnAnswer } = {};
    for (const uid of participants) {
      const answerRef = doc(db, 'connections', connectionId, 'sessions', sessionId, 'answers', `${turnIndex}_${uid}`);
      try {
        const snap = await getDoc(answerRef);
        if (snap.exists()) {
          results[uid] = snap.data() as TurnAnswer;
        }
      } catch (err) {
        // If security rules block reading partner's answer because not revealed, will throw
        console.warn('Could not read answer for user:', uid, err);
      }
    }
    return results;
  } else {
    const answersKey = `${LOCAL_ANSWERS_KEY}_${sessionId}`;
    const answers: Record<string, TurnAnswer> = 
      JSON.parse(localStorage.getItem(answersKey) || '{}');

    const results: { [uid: string]: TurnAnswer } = {};
    for (const uid of participants) {
      const item = answers[`${turnIndex}_${uid}`];
      if (item) results[uid] = item;
    }
    return results;
  }
}

// 5. ADVANCE TO NEXT QUESTION
export async function advanceToNextTurn(
  connectionId: string,
  sessionId: string,
  currentTurnIndex: number,
  categories: string[],
  intensity: QuestionIntensity
): Promise<void> {
  const candidateQuestions = getQuestionsForSession(categories, intensity);
  // Pick next question cycling through pool
  const nextQuestion = candidateQuestions[currentTurnIndex % candidateQuestions.length];

  const updateData: Partial<GameSession> = {
    currentTurnIndex: currentTurnIndex + 1,
    currentQuestion: nextQuestion,
    turnStatus: 'waiting_answers',
    userAnswered: {
      [sessionId]: false // reset
    }
  };

  if (isFirebaseConfigured && db) {
    const sessionRef = doc(db, 'connections', connectionId, 'sessions', sessionId);
    const snap = await getDoc(sessionRef);
    if (!snap.exists()) return;

    const current = snap.data() as GameSession;
    const resetAnswered: Record<string, boolean> = {};
    current.participants.forEach(p => { resetAnswered[p] = false; });

    await updateDoc(sessionRef, {
      currentTurnIndex: currentTurnIndex + 1,
      currentQuestion: nextQuestion,
      turnStatus: 'waiting_answers',
      userAnswered: resetAnswered
    });

    const connRef = doc(db, 'connections', connectionId);
    const connSnap = await getDoc(connRef);
    if (connSnap.exists()) {
      const count = (connSnap.data().totalAnsweredQuestions || 0) + 1;
      await updateDoc(connRef, {
        totalAnsweredQuestions: count,
        lastActivity: Date.now()
      });
    }
  } else {
    const sessions: Record<string, GameSession> = 
      JSON.parse(localStorage.getItem(LOCAL_SESSIONS_KEY) || '{}');
    const current = sessions[sessionId];
    if (current) {
      current.currentTurnIndex = currentTurnIndex + 1;
      current.currentQuestion = nextQuestion;
      current.turnStatus = 'waiting_answers';
      current.participants.forEach(p => { current.userAnswered[p] = false; });
      sessions[sessionId] = current;
      localStorage.setItem(LOCAL_SESSIONS_KEY, JSON.stringify(sessions));
      window.dispatchEvent(new Event('storage'));
    }
  }
}

// 6. RECORD HISTORY HELPER
async function recordTurnInHistory(
  connectionId: string,
  sessionId: string,
  turnIndex: number,
  question: Question
): Promise<void> {
  if (!db) return;
  const historyRef = doc(db, 'connections', connectionId, 'history', `turn_${turnIndex}`);
  
  // Read both answers
  const answersSnap = await getDocs(
    collection(db, 'connections', connectionId, 'sessions', sessionId, 'answers')
  );
  
  const answersMap: Record<string, any> = {};
  answersSnap.forEach(d => {
    const data = d.data() as TurnAnswer;
    if (data.turnIndex === turnIndex) {
      answersMap[data.uid] = {
        displayName: data.displayName,
        answerText: data.answerText,
        answeredAt: data.answeredAt
      };
    }
  });

  const record: HistoryTurnRecord = {
    turnIndex,
    question,
    answers: answersMap,
    revealedAt: Date.now()
  };

  await setDoc(historyRef, record);
}

function saveLocalTurnHistory(
  connectionId: string,
  sessionId: string,
  turnIndex: number,
  question: Question
) {
  const answersKey = `${LOCAL_ANSWERS_KEY}_${sessionId}`;
  const answers: Record<string, TurnAnswer> = 
    JSON.parse(localStorage.getItem(answersKey) || '{}');

  const historyKey = `${LOCAL_HISTORY_KEY}_${connectionId}`;
  const history: Record<string, HistoryTurnRecord> = 
    JSON.parse(localStorage.getItem(historyKey) || '{}');

  const answersMap: Record<string, any> = {};
  Object.values(answers).forEach(a => {
    if (a.turnIndex === turnIndex) {
      answersMap[a.uid] = {
        displayName: a.displayName,
        answerText: a.answerText,
        answeredAt: a.answeredAt
      };
    }
  });

  history[`turn_${turnIndex}`] = {
    turnIndex,
    question,
    answers: answersMap,
    revealedAt: Date.now()
  };

  localStorage.setItem(historyKey, JSON.stringify(history));
}

// 7. GET CONNECTION HISTORY
export async function getConnectionHistory(connectionId: string): Promise<HistoryTurnRecord[]> {
  if (isFirebaseConfigured && db) {
    const q = query(
      collection(db, 'connections', connectionId, 'history'),
      orderBy('revealedAt', 'desc')
    );
    const snap = await getDocs(q);
    const records: HistoryTurnRecord[] = [];
    snap.forEach(d => records.push(d.data() as HistoryTurnRecord));
    return records;
  } else {
    const historyKey = `${LOCAL_HISTORY_KEY}_${connectionId}`;
    const historyMap: Record<string, HistoryTurnRecord> = 
      JSON.parse(localStorage.getItem(historyKey) || '{}');
    const records = Object.values(historyMap);
    records.sort((a, b) => b.revealedAt - a.revealedAt);
    return records;
  }
}
