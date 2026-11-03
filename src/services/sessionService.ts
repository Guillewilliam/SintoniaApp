import { db } from '../firebase/config';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  onSnapshot,
  getDocs,
  query,
  orderBy,
  deleteDoc
} from 'firebase/firestore';

import {
  GameSession,
  Question,
  QuestionIntensity,
  TurnAnswer,
  HistoryTurnRecord
} from '../types';
import { getQuestionsForSession } from '../data/questions';

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
}

// 2. SUBSCRIBE TO SESSION UPDATES
export function subscribeToSession(
  connectionId: string,
  sessionId: string,
  callback: (session: GameSession | null) => void
): () => void {
  const sessionRef = doc(db, 'connections', connectionId, 'sessions', sessionId);
  return onSnapshot(sessionRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data() as GameSession);
    } else {
      callback(null);
    }
  });
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

  const answerRef = doc(db, 'connections', connectionId, 'sessions', sessionId, 'answers', answerId);
  await setDoc(answerRef, answerDoc);

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
    await updateDoc(sessionRef, {
      userAnswered: updatedUserAnswered,
      turnStatus: 'revealed'
    });
    await recordTurnInHistory(connectionId, sessionId, turnIndex, question);
  } else {
    await updateDoc(sessionRef, {
      userAnswered: updatedUserAnswered
    });
  }

  await updateDoc(doc(db, 'connections', connectionId), {
    lastActivity: now
  });
}

// 4. FETCH REVEALED ANSWERS
export async function getRevealedAnswers(
  connectionId: string,
  sessionId: string,
  turnIndex: number,
  participants: [string, string]
): Promise<{ [uid: string]: TurnAnswer } | null> {
  const results: { [uid: string]: TurnAnswer } = {};

  for (const uid of participants) {
    const answerRef = doc(db, 'connections', connectionId, 'sessions', sessionId, 'answers', `${turnIndex}_${uid}`);
    try {
      const snap = await getDoc(answerRef);
      if (snap.exists()) {
        results[uid] = snap.data() as TurnAnswer;
      }
    } catch (err) {
      console.warn('Could not read answer for user:', uid, err);
    }
  }
  return results;
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
  const nextQuestion = candidateQuestions[currentTurnIndex % candidateQuestions.length];

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
}

// 6. RECORD HISTORY HELPER
async function recordTurnInHistory(
  connectionId: string,
  sessionId: string,
  turnIndex: number,
  question: Question
): Promise<void> {
  const historyRef = doc(db, 'connections', connectionId, 'history', `turn_${turnIndex}`);
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

// 7. GET CONNECTION HISTORY
export async function getConnectionHistory(connectionId: string): Promise<HistoryTurnRecord[]> {
  const q = query(
    collection(db, 'connections', connectionId, 'history'),
    orderBy('revealedAt', 'desc')
  );

  const snap = await getDocs(q);
  const records: HistoryTurnRecord[] = [];
  snap.forEach(d => records.push(d.data() as HistoryTurnRecord));

  return records;
}