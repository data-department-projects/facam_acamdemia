/**
 * Statistiques des modules (admin) — Dashboard dédié à l'analyse des modules.
 * KPIs: modules, étudiants, employés, certifiés, taux complétion, taux quiz, quiz passés
 * Graphiques: courbe certifiés/en cours, barres horizontales scores, tableau modules drill-down
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Award,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Filter,
  GraduationCap,
  Layers3,
  MoreHorizontal,
  Sparkles,
  Timer,
  TrendingUp,
  Users,
  Briefcase,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { MissionSuccessDialog } from '@/components/ui/mission-success-dialog';
import Select1 from '@/components/ui/select-1';
import { api } from '@/lib/api-client';
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

type ModuleItem = { id: string; title: string; moduleType?: string };

const RANGE_OPTIONS: ReadonlyArray<{ label: string; value: '7d' | '30d' | '90d' }> = [
  { label: '7 jours', value: '7d' },
  { label: '30 jours', value: '30d' },
  { label: '90 jours', value: '90d' },
];

const MODULE_TYPE_OPTIONS: ReadonlyArray<{ label: string; value: 'all' | 'interne' | 'externe' }> =
  [
    { label: 'Tous les types', value: 'all' },
    { label: 'Interne (employés)', value: 'interne' },
    { label: 'Externe (étudiants)', value: 'externe' },
  ];

type ModuleStatsResponse = {
  filters: {
    from: string;
    to: string;
    moduleType: 'interne' | 'externe' | 'all';
    moduleId: string | null;
  };
  kpi: {
    totalModules: number;
    totalStudents: number;
    totalEmployees: number;
    totalCertified: number;
    completionRate: number;
    avgQuizScore: number | null;
    quizzesTakenCount: number;
  };
  modulesPerformance: {
    moduleId: string;
    moduleTitle: string;
    certified: number;
    inProgress: number;
    studentCertified: number;
    studentInProgress: number;
    employeeCertified: number;
    employeeInProgress: number;
    bestFinalScore: number;
  }[];
  modulesTable: {
    moduleId: string;
    moduleTitle: string;
    totalQuizzes: number;
    avgFinalScore: number | null;
    chaptersQuizzes: {
      chapterId: string;
      chapterTitle: string;
      quizCount: number;
      avgScore: number | null;
    }[];
  }[];
  learnersTable: {
    userId: string;
    fullName: string;
    email: string;
    role: string;
    avatarUrl: string | null;
    tokenCount: number;
    minutesLearned: number;
  }[];
  mostInvested: {
    userId: string;
    fullName: string;
    email: string;
    role: string;
    avatarUrl: string | null;
    minutesLearned: number;
    tokenCount: number;
    quizzesTaken: number;
    avgQuizScore: number;
    engagementScore: number;
  }[];
  finalScoreDetails: {
    moduleId: string;
    learners: {
      userId: string;
      fullName: string;
      role: string;
      bestScore: number;
    }[];
  }[];
  chapterQuizDetails: {
    chapterId: string;
    learners: {
      userId: string;
      fullName: string;
      role: string;
      bestScore: number;
    }[];
  }[];
};

export default function AdminModulesStatsPage() {
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [stats, setStats] = useState<ModuleStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [moduleTypeFilter, setModuleTypeFilter] = useState<'all' | 'interne' | 'externe'>('all');
  const [moduleFilter, setModuleFilter] = useState<string>('');
  const [rangeFilter, setRangeFilter] = useState<'7d' | '30d' | '90d'>('30d');

  // Modal states
  const [scoreModal, setScoreModal] = useState<{
    type: 'final' | 'chapter';
    moduleId?: string;
    chapterId?: string;
    title: string;
  } | null>(null);
  const [chapterLearnersDialog, setChapterLearnersDialog] = useState<{
    chapterId: string;
    chapterTitle: string;
  } | null>(null);

  const computeFromTo = useMemo(() => {
    const to = new Date();
    const days = rangeFilter === '7d' ? 7 : rangeFilter === '90d' ? 90 : 30;
    const from = new Date(to.getTime() - days * 86400000);
    return { from: from.toISOString(), to: to.toISOString() };
  }, [rangeFilter]);

  const loadModules = async () => {
    try {
      const res = await api.get<{ data: ModuleItem[] }>('/formations?limit=100&catalogue=1');
      setModules(Array.isArray(res.data) ? res.data : []);
    } catch {
      setModules([]);
    }
  };

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      qs.set('from', computeFromTo.from);
      qs.set('to', computeFromTo.to);
      qs.set('moduleType', moduleTypeFilter);
      if (moduleFilter) qs.set('moduleId', moduleFilter);
      const data = await api.get<ModuleStatsResponse>(
        `/analytics/admin/modules-stats?${qs.toString()}`
      );
      setStats(data);
    } catch (e) {
      setStats(null);
      setError(e instanceof Error ? e.message : 'Impossible de charger les statistiques.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await loadModules();
      if (cancelled) return;
      await loadStats();
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void loadStats();
    setChapterLearnersDialog(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleTypeFilter, moduleFilter, computeFromTo.from, computeFromTo.to]);

  const moduleOptions = useMemo(
    () => [
      { label: 'Tous les modules', value: '' },
      ...modules
        .filter((m) => moduleTypeFilter === 'all' || m.moduleType === moduleTypeFilter)
        .map((m) => ({ label: m.title, value: m.id })),
    ],
    [modules, moduleTypeFilter]
  );

  const getScoreDetails = (type: 'final' | 'chapter', id: string) => {
    if (type === 'final') {
      return stats?.finalScoreDetails?.find((d) => d.moduleId === id)?.learners ?? [];
    }
    return stats?.chapterQuizDetails?.find((d) => d.chapterId === id)?.learners ?? [];
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="relative h-44 rounded-2xl overflow-hidden">
          <Image src="/F12.jpg" alt="Background" fill className="object-cover object-top" />
          <div className="absolute inset-0 bg-gradient-to-r from-facam-blue/90 via-facam-blue/70 to-facam-blue/40" />
          <div className="relative z-10 flex items-center justify-center h-full">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
          </div>
        </div>
      </div>
    );
  }

  const kpi = stats?.kpi;

  // Données pour le graphique courbe (certifiés vs en cours par module)
  const performanceData = stats?.modulesPerformance ?? [];
  const stackedPerformanceData = performanceData.map((item) => ({
    ...item,
    moduleShortTitle:
      item.moduleTitle.length > 18 ? `${item.moduleTitle.slice(0, 18)}…` : item.moduleTitle,
  }));

  // Données pour le graphique barres horizontales (meilleurs scores quiz final)
  const barData =
    stats?.modulesPerformance?.map((m) => ({
      name: m.moduleTitle.length > 20 ? m.moduleTitle.slice(0, 20) + '…' : m.moduleTitle,
      fullName: m.moduleTitle,
      score: m.bestFinalScore,
    })) ?? [];

  // KPI Card coloré style image
  const ColorKpiCard = ({
    title,
    value,
    icon: Icon,
    gradient,
  }: {
    title: string;
    value: React.ReactNode;
    icon: typeof Users;
    gradient: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-lg ${gradient}`}>
        <div className="absolute right-3 top-3 opacity-30">
          <Icon className="size-12" />
        </div>
        <p className="text-3xl font-extrabold">{value}</p>
        <p className="mt-1 text-sm font-medium uppercase tracking-wide opacity-90">{title}</p>
      </div>
    </motion.div>
  );

  // KPI Taux circulaire style image
  const RateKpiCard = ({
    title,
    value,
    subtitle,
  }: {
    title: string;
    value: number;
    subtitle?: string;
  }) => {
    const data = [
      { name: 'value', value: value },
      { name: 'rest', value: 100 - value },
    ];
    const COLORS = ['#10b981', '#f59e0b', '#3b82f6'];
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-6">
            <p className="mb-2 text-sm font-semibold text-gray-600">{title}</p>
            <div className="relative h-32 w-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={55}
                    startAngle={90}
                    endAngle={-270}
                    paddingAngle={2}
                  >
                    <Cell fill={COLORS[0]} />
                    <Cell fill="#e5e7eb" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold text-gray-800">{value}%</span>
              </div>
            </div>
            {subtitle && <p className="mt-2 text-xs text-gray-500">{subtitle}</p>}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header avec image F12 et filtres */}
      <div className="relative overflow-hidden rounded-2xl min-h-[260px] md:min-h-[310px]">
        <Image
          src="/F12.jpg"
          alt="Statistiques modules"
          fill
          priority
          className="object-cover object-[center_-50px] md:object-[center_-140px]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-facam-blue/90 via-facam-blue/70 to-facam-blue/40" />
        <div className="relative z-10 flex min-h-[260px] flex-col gap-6 p-5 md:min-h-[310px] md:p-6">
          {/* Ligne 1: Badge + Titre */}
          <div className="flex flex-col gap-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold tracking-wide text-white backdrop-blur-sm w-fit">
              <Sparkles className="size-3" />
              Cockpit premium • Analytics
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-white">
              Statistiques des modules
            </h1>
            <p className="max-w-2xl text-xs text-white/80 md:text-sm">
              Analysez les performances par module : certifications, scores aux quiz, progression
              des apprenants.
            </p>
          </div>

          {/* Ligne 2: Filtres alignés horizontalement */}
          <div className="mt-auto rounded-2xl bg-black/15 p-3 backdrop-blur-sm md:p-4">
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <div className="flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-2 text-xs font-semibold text-white/90 backdrop-blur-sm">
                <Filter className="size-3.5" />
                <span>Filtres</span>
              </div>

              <div className="flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1.5 backdrop-blur-sm min-w-[165px]">
                <CalendarDays className="size-3.5 text-white/80" />
                <Select1
                  value={rangeFilter}
                  onValueChange={(value) => setRangeFilter(value as typeof rangeFilter)}
                  options={RANGE_OPTIONS}
                  triggerClassName="h-8 w-full border-0 bg-transparent px-1 text-sm text-white hover:bg-white/10"
                  popupClassName="border-gray-200 bg-white text-gray-800"
                />
              </div>

              <div className="flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1.5 backdrop-blur-sm min-w-[220px]">
                <Briefcase className="size-3.5 text-white/80" />
                <Select1
                  value={moduleTypeFilter}
                  onValueChange={(value) => setModuleTypeFilter(value as typeof moduleTypeFilter)}
                  options={MODULE_TYPE_OPTIONS}
                  triggerClassName="h-8 w-full border-0 bg-transparent px-1 text-sm text-white hover:bg-white/10"
                  popupClassName="border-gray-200 bg-white text-gray-800"
                />
              </div>

              <div className="flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1.5 backdrop-blur-sm min-w-[250px] flex-1">
                <Layers3 className="size-3.5 text-white/80" />
                <Select1
                  value={moduleFilter}
                  onValueChange={setModuleFilter}
                  options={moduleOptions}
                  triggerClassName="h-8 w-full border-0 bg-transparent px-1 text-sm text-white hover:bg-white/10"
                  popupClassName="border-gray-200 bg-white text-gray-800"
                />
              </div>

              <Button
                size="sm"
                className="h-8 bg-white px-4 font-semibold text-facam-blue hover:bg-white/90"
                onClick={() => void loadStats()}
              >
                Actualiser
              </Button>
            </div>

            {/* Période sous les filtres */}
            <p className="mt-2 text-[10px] text-white/70 md:text-xs">
              Période :{' '}
              {new Date(stats?.filters.from ?? computeFromTo.from).toLocaleDateString('fr-FR')} →{' '}
              {new Date(stats?.filters.to ?? computeFromTo.to).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 text-sm">
          {error}
        </div>
      )}

      {/* KPIs colorés */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ColorKpiCard
          title="Modules"
          value={kpi?.totalModules ?? 0}
          icon={BookOpen}
          gradient="bg-gradient-to-br from-teal-500 to-teal-600"
        />
        <ColorKpiCard
          title="Étudiants"
          value={kpi?.totalStudents ?? 0}
          icon={GraduationCap}
          gradient="bg-gradient-to-br from-purple-500 to-purple-600"
        />
        <ColorKpiCard
          title="Employés"
          value={kpi?.totalEmployees ?? 0}
          icon={Briefcase}
          gradient="bg-gradient-to-br from-orange-500 to-red-500"
        />
        <ColorKpiCard
          title="Certifiés"
          value={kpi?.totalCertified ?? 0}
          icon={Award}
          gradient="bg-gradient-to-br from-blue-500 to-blue-600"
        />
      </div>

      {/* KPIs Taux circulaires + Quiz passés */}
      <div className="grid gap-4 md:grid-cols-3">
        <RateKpiCard
          title="Taux de complétion"
          value={kpi?.completionRate ?? 0}
          subtitle="Formations terminées"
        />
        <RateKpiCard
          title="Taux moyen au quiz"
          value={kpi?.avgQuizScore ?? 0}
          subtitle="Score moyen global"
        />
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <Card className="border-gray-200 shadow-sm h-full">
            <CardContent className="flex flex-col items-center justify-center py-6 h-full">
              <div className="rounded-full bg-violet-100 p-4 mb-3">
                <BarChart3 className="size-8 text-violet-600" />
              </div>
              <p className="text-3xl font-extrabold text-gray-800">{kpi?.quizzesTakenCount ?? 0}</p>
              <p className="mt-1 text-sm font-medium text-gray-600">Quiz passés</p>
              <p className="text-xs text-gray-500">Sur la période</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Graphique barres empilées : Certifiés vs non certifiés par type d'apprenant */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="size-5 text-blue-600" />
            Répartition par modules : certifiés vs non certifiés
          </CardTitle>
          <p className="text-xs text-gray-500">
            Vue empilée par module avec légende étudiants et employés, certifiés et non certifiés
          </p>
        </CardHeader>
        <CardContent>
          {stackedPerformanceData.length > 0 ? (
            <div className="h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stackedPerformanceData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 55 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="moduleShortTitle" angle={-25} textAnchor="end" height={70} />
                  <YAxis allowDecimals={false} />
                  <Tooltip
                    formatter={(value: number, name: string) => [value, name]}
                    labelFormatter={(label) => `Module: ${label}`}
                  />
                  <Legend />
                  <Bar
                    dataKey="studentCertified"
                    name="Étudiants certifiés"
                    stackId="learners"
                    fill="#003566"
                  />
                  <Bar
                    dataKey="studentInProgress"
                    name="Étudiants en cours"
                    stackId="learners"
                    fill="#4a6fa5"
                  />
                  <Bar
                    dataKey="employeeCertified"
                    name="Employés certifiés"
                    stackId="learners"
                    fill="#ffc300"
                  />
                  <Bar
                    dataKey="employeeInProgress"
                    name="Employés en cours"
                    stackId="learners"
                    fill="#ffe066"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Aucune donnée disponible.</p>
          )}
        </CardContent>
      </Card>

      {/* Tableau des modules avec drill-down */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="size-5 text-teal-600" />
            Détail par module
          </CardTitle>
          <p className="text-xs text-gray-500">
            Cliquez sur le score moyen pour voir les détails des apprenants
          </p>
        </CardHeader>
        <CardContent>
          {stats?.modulesTable && stats.modulesTable.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-600">
                    <th className="pb-3 pr-4 font-semibold">Module</th>
                    <th className="pb-3 pr-4 font-semibold text-center">Nb Quiz</th>
                    <th className="pb-3 pr-4 font-semibold text-center">Score moyen (final)</th>
                    <th className="pb-3 font-semibold">Quiz par chapitre</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.modulesTable.map((mod) => (
                    <tr key={mod.moduleId} className="border-b border-gray-100">
                      <td className="py-3 pr-4 font-medium text-facam-dark">{mod.moduleTitle}</td>
                      <td className="py-3 pr-4 text-center">{mod.totalQuizzes}</td>
                      <td className="py-3 pr-4 text-center">
                        {mod.avgFinalScore != null ? (
                          <button
                            type="button"
                            onClick={() =>
                              setScoreModal({
                                type: 'final',
                                moduleId: mod.moduleId,
                                title: `Score final — ${mod.moduleTitle}`,
                              })
                            }
                            className="rounded-lg bg-emerald-50 px-3 py-1 font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
                          >
                            {mod.avgFinalScore}%
                          </button>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3">
                        {mod.chaptersQuizzes.length > 0 ? (
                          <div className="space-y-2">
                            {mod.chaptersQuizzes.map((ch) => (
                              <div
                                key={ch.chapterId}
                                className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 text-xs"
                              >
                                <span className="font-medium text-gray-800 truncate">
                                  {ch.chapterTitle}
                                </span>
                                <span className="text-gray-500 whitespace-nowrap">
                                  {ch.quizCount} quiz
                                </span>
                                <span
                                  className={`rounded px-2 py-0.5 whitespace-nowrap ${
                                    ch.avgScore != null
                                      ? 'bg-blue-50 text-blue-700 font-medium'
                                      : 'text-gray-400'
                                  }`}
                                >
                                  {ch.avgScore != null ? `${ch.avgScore}%` : '—'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setChapterLearnersDialog({
                                      chapterId: ch.chapterId,
                                      chapterTitle: ch.chapterTitle,
                                    })
                                  }
                                  className="rounded bg-facam-blue/10 px-2 py-0.5 text-facam-blue hover:bg-facam-blue/20 whitespace-nowrap"
                                >
                                  Voir apprenants
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Aucun chapitre</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Aucun module disponible.</p>
          )}
        </CardContent>
      </Card>

      {/* Graphique barres horizontales : Meilleurs scores quiz final par module */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="size-5 text-violet-600" />
            Meilleurs scores quiz final par module
          </CardTitle>
          <p className="text-xs text-gray-500">
            Score le plus élevé obtenu au quiz final de chaque module
          </p>
        </CardHeader>
        <CardContent>
          {barData.length > 0 ? (
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" margin={{ left: 20, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, 'Meilleur score']}
                    labelFormatter={(_, payload) => payload[0]?.payload?.fullName ?? ''}
                  />
                  <Bar
                    dataKey="score"
                    name="Meilleur score"
                    fill="#001B61"
                    radius={[0, 8, 8, 0]}
                    barSize={24}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Aucune donnée disponible.</p>
          )}
        </CardContent>
      </Card>

      {/* Tableau étudiants et employés */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="size-5 text-blue-600" />
            Apprenants
          </CardTitle>
          <p className="text-xs text-gray-500">
            Liste des étudiants et employés inscrits avec tokens reçus et minutes passées.
          </p>
        </CardHeader>
        <CardContent>
          {stats?.learnersTable && stats.learnersTable.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-600">
                    <th className="pb-3 pr-4 font-semibold">Photo</th>
                    <th className="pb-3 pr-4 font-semibold">Nom</th>
                    <th className="pb-3 pr-4 font-semibold">Prénom</th>
                    <th className="pb-3 pr-4 font-semibold">Type</th>
                    <th className="pb-3 pr-4 font-semibold text-center">Tokens</th>
                    <th className="pb-3 pr-4 font-semibold text-center">Minutes passées</th>
                    <th className="pb-3 font-semibold w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {stats.learnersTable.map((learner) => {
                    const nameParts = learner.fullName.split(' ');
                    const lastName = nameParts.slice(0, -1).join(' ') || nameParts[0];
                    const firstName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
                    return (
                      <tr key={learner.userId} className="border-b border-gray-100">
                        <td className="py-3 pr-4">
                          <div className="size-10 rounded-full bg-gray-200 overflow-hidden">
                            {learner.avatarUrl ? (
                              <Image
                                src={learner.avatarUrl}
                                alt={learner.fullName}
                                width={40}
                                height={40}
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full text-gray-500 font-semibold">
                                {learner.fullName.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 pr-4 font-medium text-facam-dark">{lastName}</td>
                        <td className="py-3 pr-4 text-gray-600">{firstName}</td>
                        <td className="py-3 pr-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                              learner.role === 'employee'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {learner.role === 'employee' ? (
                              <>
                                <Briefcase className="size-3" /> Employé
                              </>
                            ) : (
                              <>
                                <GraduationCap className="size-3" /> Étudiant
                              </>
                            )}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-center">
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                            {learner.tokenCount}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-center">
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                            {learner.minutesLearned} min
                          </span>
                        </td>
                        <td className="py-3">
                          <Link
                            href={`/admin/analytics/learners/${learner.userId}?from=${encodeURIComponent(stats.filters.from)}&to=${encodeURIComponent(stats.filters.to)}`}
                          >
                            <button
                              type="button"
                              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-facam-blue"
                              aria-label="Voir les statistiques"
                            >
                              <MoreHorizontal className="size-5" />
                            </button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Aucun apprenant trouvé.</p>
          )}
        </CardContent>
      </Card>

      {/* Profils les plus investis */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Timer className="size-5 text-emerald-600" />
            Profils les plus investis
          </CardTitle>
          <div className="text-xs text-gray-500">Minutes d'apprentissage (tokens × 15 min)</div>
        </CardHeader>
        <CardContent>
          {stats?.mostInvested?.length ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {stats.mostInvested.slice(0, 8).map((u) => (
                <div key={u.userId} className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="size-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                      {u.avatarUrl ? (
                        <Image
                          src={u.avatarUrl}
                          alt={u.fullName}
                          width={40}
                          height={40}
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-500 font-semibold">
                          {u.fullName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-facam-dark truncate">{u.fullName}</p>
                      <p className="text-xs text-gray-500 truncate">{u.email}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-gray-600">
                        <Timer className="size-3" /> Minutes
                      </span>
                      <span className="font-bold text-emerald-700">{u.minutesLearned} min</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-gray-600">
                        <Sparkles className="size-3" /> Tokens
                      </span>
                      <span className="font-bold text-blue-700">{u.tokenCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-gray-600">
                        <Activity className="size-3" /> Quiz
                      </span>
                      <span className="font-bold text-violet-700">{u.quizzesTaken}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-gray-600">
                        <CheckCircle2 className="size-3" /> Score
                      </span>
                      <span className="font-bold text-amber-700">{u.avgQuizScore}%</span>
                    </div>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-blue-500"
                      style={{ width: `${Math.min(100, u.engagementScore)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Aucune donnée sur la période.</p>
          )}
        </CardContent>
      </Card>

      {/* Modal détails scores */}
      <Modal
        open={scoreModal !== null}
        onClose={() => setScoreModal(null)}
        title={scoreModal?.title ?? 'Détails des scores'}
        className="max-w-2xl"
      >
        {scoreModal && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Liste des apprenants ayant passé ce quiz avec leurs meilleurs scores.
            </p>
            {(() => {
              const details = getScoreDetails(
                scoreModal.type,
                scoreModal.type === 'final' ? scoreModal.moduleId! : scoreModal.chapterId!
              );
              if (details.length === 0) {
                return (
                  <p className="text-sm text-gray-500">Aucun apprenant n'a encore passé ce quiz.</p>
                );
              }
              return (
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-white">
                      <tr className="border-b border-gray-200 text-left text-gray-600">
                        <th className="pb-2 pr-4 font-semibold">Nom</th>
                        <th className="pb-2 pr-4 font-semibold">Type</th>
                        <th className="pb-2 font-semibold text-right">Meilleur score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {details.map((l) => (
                        <tr key={l.userId} className="border-b border-gray-100">
                          <td className="py-2 pr-4 font-medium text-facam-dark">{l.fullName}</td>
                          <td className="py-2 pr-4">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                                l.role === 'employee'
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {l.role === 'employee' ? 'Employé' : 'Étudiant'}
                            </span>
                          </td>
                          <td className="py-2 text-right">
                            <span className="rounded-lg bg-emerald-50 px-2 py-1 font-semibold text-emerald-700">
                              {l.bestScore}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setScoreModal(null)}>
                Fermer
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <MissionSuccessDialog
        isOpen={chapterLearnersDialog !== null}
        onClose={() => setChapterLearnersDialog(null)}
        title={`Quiz chapitre — ${chapterLearnersDialog?.chapterTitle ?? ''}`}
        description="Liste des apprenants ayant passé ce quiz de chapitre avec leur meilleur score."
        maxWidthClassName="max-w-2xl"
      >
        <div className="max-h-[55vh] overflow-y-auto">
          {chapterLearnersDialog &&
          getScoreDetails('chapter', chapterLearnersDialog.chapterId).length > 0 ? (
            <div className="space-y-2">
              {getScoreDetails('chapter', chapterLearnersDialog.chapterId).map((learner) => (
                <div
                  key={learner.userId}
                  className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-facam-dark">
                      {learner.fullName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {learner.role === 'employee' ? 'Employé' : 'Étudiant'}
                    </p>
                  </div>
                  <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    {learner.bestScore}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Aucun apprenant n&apos;a encore passé ce quiz.</p>
          )}
        </div>
      </MissionSuccessDialog>
    </div>
  );
}
