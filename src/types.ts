import { Timestamp } from 'firebase/firestore';

export interface Question {
  id?: string;
  text: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  answer: 'A' | 'B' | 'C' | 'D';
  marks: number;
  createdAt?: Timestamp;
}

export interface ExamResult {
  id?: string;
  studentName: string;
  score: number;
  total: number;
  percentage: string;
  timestamp: Timestamp;
  answers: Record<number, string>;
  questions: Question[];
}

export interface UserAccount {
  id?: string;
  userId: string;
  password?: string;
  name: string;
  createdAt?: Timestamp;
}

export type Page = 'login' | 'admin' | 'setup' | 'exam' | 'history' | 'result';

export interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId: string;
    email: string;
    emailVerified: boolean;
    isAnonymous: boolean;
    providerInfo: { providerId: string; displayName: string; email: string; }[];
  }
}
