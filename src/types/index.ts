export type QuestionIntensity = 'suave' | 'normal' | 'profunda';

export interface UserPreferences {
  theme: 'dark' | 'light';
  soundEnabled: boolean;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  emailVerified: boolean;
  photoURL: string;
  createdAt: number;
  preferences: UserPreferences;
}

export type InviteStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

export interface InviteCode {
  id: string; // The invite code string (e.g. "SINT-9A2K")
  creatorUid: string;
  creatorDisplayName: string;
  creatorEmail: string;
  creatorPhoto: string;
  createdAt: number;
  expiresAt: number;
  status: InviteStatus;
  usedByUid?: string | null;
  usedByName?: string | null;
  connectionId?: string | null;
}

export interface ConnectionParticipant {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
}

export interface ConnectionPreferences {
  categories: string[];
  intensity: QuestionIntensity;
}

export interface Connection {
  id: string;
  participants: [string, string]; // Exactly 2 participants
  participantProfiles: {
    [uid: string]: ConnectionParticipant;
  };
  createdAt: number;
  updatedAt: number;
  status: 'active' | 'archived';
  preferences: ConnectionPreferences;
  activeSessionId?: string | null;
  lastActivity: number;
  totalAnsweredQuestions: number;
}

export interface QuestionCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  accent: string;
  isAdultOnly?: boolean;
}

export interface Question {
  id: string;
  categoryId: string;
  intensity: QuestionIntensity;
  text: string;
  hint?: string;
}

export type TurnStatus = 'waiting_answers' | 'revealed';

export interface GameSession {
  id: string;
  connectionId: string;
  participants: [string, string];
  categories: string[];
  intensity: QuestionIntensity;
  status: 'active' | 'completed';
  startedAt: number;
  endedAt?: number;
  currentTurnIndex: number;
  currentQuestion: Question;
  turnStatus: TurnStatus;
  userAnswered: {
    [uid: string]: boolean;
  };
}

export interface TurnAnswer {
  id: string;
  sessionId: string;
  turnIndex: number;
  questionId: string;
  uid: string;
  displayName: string;
  answerText: string;
  answeredAt: number;
}

export interface HistoryTurnRecord {
  turnIndex: number;
  question: Question;
  answers: {
    [uid: string]: {
      displayName: string;
      answerText: string;
      answeredAt: number;
      photoURL?: string;
    };
  };
  revealedAt: number;
}
