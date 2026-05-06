/**
 * Types frontend pour FACAM ACADEMIA.
 * Utilisés pour les écrans catalogue, modules, quiz, dashboards.
 */

import type { UserRole } from '@facam-academia/shared';

export type { UserRole } from '@facam-academia/shared';
export type { InterfaceType } from '@facam-academia/shared';
export {
  getRoleHome,
  getInterfaceForRole,
  getDistinctInterfaces,
  ROLE_LABELS,
  MODULE_MANAGER_ROLE_VALUES,
  LEARNER_ROLE_VALUES,
} from '@facam-academia/shared';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  roles: UserRole[];
  employeeId?: string | null;
  phoneNumber1?: string | null;
  phoneNumber2?: string | null;
  avatarUrl?: string;
  createdAt: string;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  durationHours: number;
  chaptersCount: number;
  progress?: number;
  completedAt?: string;
  subtitle?: string;
  rating?: number;
  reviewCount?: number;
  instructor?: string;
  lastUpdated?: string;
  language?: string;
  learningOutcomes?: string[];
  prerequisites?: string[];
  sections?: CourseSection[];
  level?: 'debutant' | 'intermediaire' | 'avance';
  instructorAvatarUrl?: string;
  instructorBio?: string;
  quizCount?: number;
  downloadableResourcesCount?: number;
  hasCertificate?: boolean;
}

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
