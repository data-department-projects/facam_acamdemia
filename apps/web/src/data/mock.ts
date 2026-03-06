/**
 * Données mock pour le frontend (remplacées par l'API backend plus tard).
 * Images : Unsplash (libres de droit, usage autorisé).
 */

import type {
  Module,
  Chapter,
  Quiz,
  QuizQuestion,
  DashboardStats,
  User,
  LogEntry,
  CourseSection,
} from '@/types';

/** Catégories type Udemy pour la barre sous la nav */
export const MOCK_CATEGORIES = [
  'Développement',
  'Business',
  'Finance et comptabilité',
  'Informatique et logiciels',
  'Productivité bureautique',
  'Développement personnel',
  'Design',
  'Marketing',
  'Santé et bien-être',
  'Enseignement et académique',
] as const;

/** Cours "en cours" pour le dropdown Mon apprentissage (exemples Udemy) */
export const MOCK_MY_LEARNING_COURSES: Array<{
  id: string;
  title: string;
  imageUrl: string;
  progress: number;
  durationHours?: number;
}> = [
  {
    id: '1',
    title: 'Le Pack ULTIME sur les bases de données (22 cours en 1) 47h',
    imageUrl: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=240&h=135&fit=crop',
    progress: 35,
    durationHours: 47,
  },
  {
    id: '2',
    title: 'Devenir un expert de Power Bi - La formation complète 2026',
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=240&h=135&fit=crop',
    progress: 12,
    durationHours: 18,
  },
  {
    id: '3',
    title: 'SQL pour la Data (Analyst, Scientist, Engineer) 2025',
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=240&h=135&fit=crop',
    progress: 78,
    durationHours: 12,
  },
  {
    id: '4',
    title: 'Maîtrise Excel de A à Z : le cours ULTIME 2026 (IA inclus)',
    imageUrl: 'https://images.unsplash.com/photo-1618040996337-56904b7850b9?w=240&h=135&fit=crop',
    progress: 52,
    durationHours: 24,
  },
];

/** Sections type Udemy pour la page détail (accordéon) */
const MOCK_SECTIONS_1: CourseSection[] = [
  {
    id: 's1-1',
    title: 'Welcome & Full-Stack AI Engineer Journey',
    lessonCount: 4,
    durationMinutes: 28,
    lessons: [
      { id: 'l1', title: 'Introduction au parcours', durationMinutes: 5, isPreview: true },
      { id: 'l2', title: 'Objectifs et prérequis', durationMinutes: 8 },
      { id: 'l3', title: 'Structure du cours', durationMinutes: 10 },
      { id: 'l4', title: 'Ressources et support', durationMinutes: 5 },
    ],
  },
  {
    id: 's1-2',
    title: 'Python Foundations for AI & ML',
    lessonCount: 6,
    durationMinutes: 72,
    lessons: [
      { id: 'l5', title: "Installation de l'environnement", durationMinutes: 12, isPreview: true },
      { id: 'l6', title: 'Variables et types', durationMinutes: 15 },
      { id: 'l7', title: 'Structures de données', durationMinutes: 18 },
      { id: 'l8', title: 'Boucles et conditions', durationMinutes: 12 },
      { id: 'l9', title: 'Fonctions et modules', durationMinutes: 10 },
      { id: 'l10', title: 'Exercices pratiques', durationMinutes: 5 },
    ],
  },
  {
    id: 's1-3',
    title: 'Maintenance préventive et corrective',
    lessonCount: 5,
    durationMinutes: 95,
    lessons: [
      { id: 'l11', title: 'Plans de maintenance', durationMinutes: 25 },
      { id: 'l12', title: 'Diagnostic des pannes', durationMinutes: 30 },
      { id: 'l13', title: 'Documentation et rapports', durationMinutes: 20 },
      { id: 'l14', title: 'Outils et logiciels', durationMinutes: 15 },
      { id: 'l15', title: 'Cas pratiques', durationMinutes: 5 },
    ],
  },
];

export const MOCK_MODULES: Module[] = [
  {
    id: '1',
    title: 'AI Engineer 2026 Complete Course, GEN AI, Deep, Machine, LLM',
    subtitle: 'Parcours complet pour devenir ingénieur IA : modèles, évaluation et déploiement.',
    description:
      'Fondamentaux de la maintenance préventive et corrective en milieu industriel. Ce cours couvre également les bases du Machine Learning et des LLM pour les ingénieurs.',
    imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&h=400&fit=crop',
    durationHours: 12,
    chaptersCount: 5,
    progress: 60,
    rating: 4.8,
    reviewCount: 1240,
    instructor: 'FACAM ACADEMIA',
    lastUpdated: 'Février 2026',
    language: 'Français',
    learningOutcomes: [
      'Build and evaluate Machine Learning models',
      'Déployer des modèles en production',
      'Utiliser les LLM et la génération de texte',
      'Mettre en place une maintenance préventive efficace',
      'Diagnostiquer les pannes et documenter les interventions',
    ],
    prerequisites: ['Bases en programmation', 'Notions de statistiques'],
    sections: MOCK_SECTIONS_1,
    level: 'intermediaire',
    instructorAvatarUrl:
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop&crop=face',
    instructorBio: 'Expert IA et maintenance industrielle, formateur FACAM ACADEMIA.',
    quizCount: 3,
    downloadableResourcesCount: 5,
    hasCertificate: true,
  },
  {
    id: '2',
    title: 'Production et logistique',
    description: 'Organisation de la production, flux et gestion des stocks.',
    imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&h=400&fit=crop',
    durationHours: 10,
    chaptersCount: 4,
    progress: 0,
    rating: 4.6,
    reviewCount: 890,
    instructor: 'FACAM ACADEMIA',
    lastUpdated: 'Janvier 2026',
    language: 'Français',
    learningOutcomes: [
      'Organiser les flux de production',
      'Gérer les stocks et les approvisionnements',
      'Optimiser les délais et les coûts',
      'Piloter un atelier avec des indicateurs',
    ],
    prerequisites: ['Aucun'],
    level: 'debutant',
    instructorAvatarUrl:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    instructorBio: 'Responsable logistique, formateur FACAM ACADEMIA.',
    quizCount: 2,
    downloadableResourcesCount: 4,
    hasCertificate: true,
    sections: [
      {
        id: 's2-1',
        title: 'Introduction à la production',
        lessonCount: 3,
        durationMinutes: 45,
        lessons: [
          { id: 'a1', title: "Vue d'ensemble", durationMinutes: 15, isPreview: true },
          { id: 'a2', title: 'Types de production', durationMinutes: 15 },
          { id: 'a3', title: 'Indicateurs clés', durationMinutes: 15 },
        ],
      },
    ],
  },
  {
    id: '3',
    title: 'QHSE - Qualité Hygiène Sécurité Environnement',
    description: 'Normes, risques et bonnes pratiques en entreprise.',
    imageUrl: 'https://images.unsplash.com/photo-1569931721096-b8c4d011d2b8?w=600&h=400&fit=crop',
    durationHours: 15,
    chaptersCount: 6,
    progress: 100,
    completedAt: '2025-02-20T14:00:00Z',
    rating: 4.9,
    reviewCount: 2100,
    instructor: 'FACAM ACADEMIA',
    lastUpdated: 'Février 2026',
    language: 'Français',
    learningOutcomes: [
      'Appliquer les normes QHSE en entreprise',
      'Identifier et évaluer les risques',
      "Mettre en place des plans d'action",
      'Animer des formations sécurité',
    ],
    prerequisites: ['Sensibilisation sécurité'],
    level: 'intermediaire',
    instructorBio: 'Consultant QHSE, formateur FACAM ACADEMIA.',
    quizCount: 4,
    downloadableResourcesCount: 8,
    hasCertificate: true,
    sections: [],
  },
  {
    id: '4',
    title: 'Maintenance industrielle - Bases',
    description: 'Fondamentaux de la maintenance préventive et corrective.',
    imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&h=400&fit=crop',
    durationHours: 12,
    chaptersCount: 5,
    progress: 52,
    rating: 4.7,
    reviewCount: 560,
    instructor: 'FACAM ACADEMIA',
    lastUpdated: 'Décembre 2025',
    language: 'Français',
    learningOutcomes: [
      'Comprendre les types de maintenance',
      'Planifier des interventions',
      'Utiliser les outils de diagnostic',
    ],
    prerequisites: ['Connaissances techniques de base'],
    level: 'debutant',
    instructorBio: 'Ingénieur maintenance, formateur FACAM ACADEMIA.',
    quizCount: 3,
    downloadableResourcesCount: 6,
    hasCertificate: true,
    sections: MOCK_SECTIONS_1,
  },
];

export const MOCK_CHAPTERS: Chapter[] = [
  {
    id: 'c1',
    moduleId: '1',
    title: 'Introduction à la maintenance',
    order: 1,
    documentUrls: [{ label: 'PDF du chapitre', url: '#' }],
    quizId: 'q1',
  },
  {
    id: 'c2',
    moduleId: '1',
    title: 'Maintenance préventive',
    order: 2,
    documentUrls: [{ label: 'Support PDF', url: '#' }],
    quizId: 'q2',
  },
  {
    id: 'c3',
    moduleId: '1',
    title: 'Diagnostic des pannes',
    order: 3,
    documentUrls: [],
    quizId: 'q3',
  },
];

export const MOCK_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'qq1',
    type: 'mcq',
    question: "Quelle est la première étape d'une maintenance préventive ?",
    options: ['Inspection', 'Démontage', 'Commande de pièces', 'Documentation'],
    correctAnswer: 'Inspection',
  },
  {
    id: 'qq2',
    type: 'true_false',
    question: 'La maintenance corrective intervient après une panne.',
    options: ['Vrai', 'Faux'],
    correctAnswer: 'Vrai',
  },
  {
    id: 'qq3',
    type: 'mcq',
    question: 'Quel outil est essentiel pour le diagnostic ?',
    options: ['Multimètre', 'Marteau', 'Clé à molette', 'Pince'],
    correctAnswer: 'Multimètre',
  },
];

export const MOCK_QUIZ: Quiz = {
  id: 'q1',
  chapterId: 'c1',
  title: 'Quiz - Introduction à la maintenance',
  questions: MOCK_QUIZ_QUESTIONS,
  minScoreToPass: 70,
};

export const MOCK_STATS_STUDENT: DashboardStats = {
  totalModules: 3,
  completedModules: 1,
  averageScore: 78,
};

export const MOCK_STATS_MODULE_MANAGER: DashboardStats = {
  totalModules: 5,
  completedModules: 0,
  averageScore: 0,
  totalStudents: 42,
  totalCompletions: 28,
};

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    email: 'etudiant@facam.com',
    fullName: 'Étudiant Demo',
    role: 'student',
    createdAt: '2025-01-15T10:00:00Z',
  },
  {
    id: 'u2',
    email: 'responsable@facam.com',
    fullName: 'Responsable Demo',
    role: 'module_manager',
    createdAt: '2025-01-10T09:00:00Z',
  },
  {
    id: 'u3',
    email: 'admin@facam.com',
    fullName: 'Admin Demo',
    role: 'admin',
    createdAt: '2025-01-01T08:00:00Z',
  },
];

export const MOCK_LOGS: LogEntry[] = [
  {
    id: 'l1',
    level: 'info',
    message: 'Server started on port 3000',
    timestamp: '2025-02-27T10:00:00Z',
    source: 'api',
  },
  {
    id: 'l2',
    level: 'warn',
    message: 'High memory usage detected',
    timestamp: '2025-02-27T09:55:00Z',
    source: 'system',
  },
  {
    id: 'l3',
    level: 'error',
    message: 'Database connection timeout',
    timestamp: '2025-02-27T09:50:00Z',
    source: 'db',
  },
  {
    id: 'l4',
    level: 'info',
    message: 'User login: etudiant@facam.com',
    timestamp: '2025-02-27T09:45:00Z',
    source: 'auth',
  },
];
