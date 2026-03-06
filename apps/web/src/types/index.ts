/**
 * Types frontend pour FACAM ACADEMIA (mock / alignés avec le futur backend).
 * Utilisés pour les écrans catalogue, modules, quiz, dashboards.
 */

import type { UserRole } from '@facam-academia/shared';

export type { UserRole };

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  durationHours: number;
  chaptersCount: number;
  progress?: number;
  completedAt?: string;
  /** Sous-titre / accroche (page détail type Udemy) */
  subtitle?: string;
  /** Note moyenne (ex: 4.8) */
  rating?: number;
  /** Nombre d'évaluations / participants */
  reviewCount?: number;
  /** Créateur / formateur */
  instructor?: string;
  /** Dernière mise à jour */
  lastUpdated?: string;
  /** Langue du cours */
  language?: string;
  /** Compétences apprises ("Ce que vous apprendrez") */
  learningOutcomes?: string[];
  /** Prérequis recommandés (liste à puces) */
  prerequisites?: string[];
  /** Sections du contenu (accordéon) */
  sections?: CourseSection[];
  /** Niveau : debutant | intermediaire | avance */
  level?: 'debutant' | 'intermediaire' | 'avance';
  /** Formateur : photo (URL) */
  instructorAvatarUrl?: string;
  /** Formateur : courte bio ou titre */
  instructorBio?: string;
  /** Nombre de quiz dans le module */
  quizCount?: number;
  /** Ressources téléchargeables (nombre ou liste courte) */
  downloadableResourcesCount?: number;
  /** Indication certificat à la clé */
  hasCertificate?: boolean;
}

/** Section du contenu du cours (accordéon page détail) */
export interface CourseSection {
  id: string;
  title: string;
  lessonCount: number;
  durationMinutes: number;
  lessons: { id: string; title: string; durationMinutes: number; isPreview?: boolean }[];
}

export interface Chapter {
  id: string;
  moduleId: string;
  title: string;
  order: number;
  videoUrl?: string;
  documentUrls: { label: string; url: string }[];
  quizId?: string;
}

export interface QuizQuestion {
  id: string;
  type: 'mcq' | 'true_false' | 'open';
  question: string;
  options?: string[];
  correctAnswer: string | string[];
}

export interface Quiz {
  id: string;
  chapterId?: string;
  title: string;
  questions: QuizQuestion[];
  minScoreToPass: number;
}

export interface ModuleAttempt {
  id: string;
  moduleId: string;
  userId: string;
  score: number;
  passed: boolean;
  completedAt: string;
  certificateUrl?: string;
}

export interface DashboardStats {
  totalModules: number;
  completedModules: number;
  averageScore: number;
  totalStudents?: number;
  totalCompletions?: number;
}

export interface LogEntry {
  id: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
  source?: string;
}
