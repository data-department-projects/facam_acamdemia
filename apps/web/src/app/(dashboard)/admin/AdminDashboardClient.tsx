/**
 * Client du dashboard admin (premium) — Vue globale “wow” pour piloter la plateforme.
 *
 * Sections:
 * - KPI performance & engagement (apprenants, complétion, quiz, score, pass rate)
 * - Évolution dans le temps (score moyen + tentatives)
 * - Analyse des quiz (score par quiz)
 * - Top performers & profils les plus investis (minutes d’apprentissage estimées)
 * - Heatmap d’activité (tentatives / jour)
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Award,
  BarChart3,
  CalendarDays,
  Crown,
  Filter,
  Flame,
  GraduationCap,
  Layers3,
  LineChart as LineChartIcon,
  Sparkles,
  ArrowRight,
  Target,
  Timer,
  TrendingUp,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api-client';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

type ModuleItem = { id: string; title: string };

type OverviewResponse = {
  filters: {
    from: string;
    to: string;
    role: 'student' | 'employee' | 'all';
    moduleId: string | null;
  };
  kpi: {
    totalLearners: number;
    totalEnrollments: number;
    completionRate: number;
    quizzesTakenCount: number;
    avgQuizScore: number | null;
    passRate: number;
  };
  performanceOverTime: { day: string; attempts: number; avgScore: number }[];
  perQuiz: {
    quizId: string;
    title: string;
    attempts: number;
    avgScore: number;
    passRate: number;
  }[];
  top3Quizzes: { quizId: string; title: string }[];
  topPerformers: {
    userId: string;
    fullName: string;
    email: string;
    role: string;
    avatarUrl: string | null;
    avgQuizScore: number;
    quizzesTaken: number;
    bestScoreTop3Quizzes: number;
    minutesLearned: number;
    avgProgress: number;
    engagementScore: number;
  }[];
  mostInvested: OverviewResponse['topPerformers'];
};

export default function AdminDashboardClient() {
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'employee'>('all');
  const [moduleFilter, setModuleFilter] = useState<string>('');
  const [rangeFilter, setRangeFilter] = useState<'7d' | '30d' | '90d'>('30d');
  const [learnerSearch, setLearnerSearch] = useState('');

  const computeFromTo = useMemo(() => {
    const to = new Date();
    const days = rangeFilter === '7d' ? 7 : rangeFilter === '90d' ? 90 : 30;
    const from = new Date(to.getTime() - days * 86400000);
    return {
      from: from.toISOString(),
      to: to.toISOString(),
    };
  }, [rangeFilter]);

  const loadModules = async () => {
    try {
      const res = await api.get<{ data: ModuleItem[] }>('/formations?limit=100&catalogue=1');
      setModules(Array.isArray(res.data) ? res.data : []);
    } catch {
      setModules([]);
    }
  };

  const loadOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      qs.set('from', computeFromTo.from);
      qs.set('to', computeFromTo.to);
      qs.set('role', roleFilter);
      if (moduleFilter) qs.set('moduleId', moduleFilter);
      const data = await api.get<OverviewResponse>(`/analytics/admin/overview?${qs.toString()}`);
      setOverview(data);
    } catch (e) {
      setOverview(null);
      setError(e instanceof Error ? e.message : 'Impossible de charger les analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await loadModules();
      if (cancelled) return;
      await loadOverview();
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void loadOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter, moduleFilter, computeFromTo.from, computeFromTo.to]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-facam-dark via-[#0b2a8f] to-[#5b21b6] p-6 text-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.2em] text-white/70">Admin cockpit</p>
              <h1 className="text-2xl md:text-3xl font-extrabold">Dashboard global</h1>
              <p className="text-sm text-white/75">
                Performance, engagement et qualité d’apprentissage — en temps quasi réel.
              </p>
            </div>
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
          </div>
        </div>
      </div>
    );
  }

  const kpi = overview?.kpi;
  const perfSeries = overview?.performanceOverTime ?? [];
  const perQuiz = overview?.perQuiz ?? [];

  const heatmapDays = (() => {
    // Derniers 28 jours, intensité basée sur nb de tentatives.
    const days = 28;
    const to = new Date(computeFromTo.to);
    const map = new Map<string, number>();
    for (const d of perfSeries) map.set(d.day, d.attempts);
    const max = Math.max(1, ...perfSeries.map((d) => d.attempts));
    return Array.from({ length: days }, (_, i) => {
      const date = new Date(to.getTime() - (days - 1 - i) * 86400000);
      const key = date.toISOString().slice(0, 10);
      const attempts = map.get(key) ?? 0;
      const intensity = Math.round((attempts / max) * 100);
      return { key, attempts, intensity };
    });
  })();

  const KpiCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    accent,
  }: {
    title: string;
    value: React.ReactNode;
    subtitle: string;
    icon: typeof Users;
    accent: 'blue' | 'emerald' | 'violet' | 'gold';
  }) => {
    const accentClass =
      accent === 'emerald'
        ? 'from-emerald-500/15 to-emerald-500/0 text-emerald-700'
        : accent === 'violet'
          ? 'from-violet-500/15 to-violet-500/0 text-violet-700'
          : accent === 'gold'
            ? 'from-amber-500/20 to-amber-500/0 text-amber-700'
            : 'from-blue-500/15 to-blue-500/0 text-blue-700';
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Card className="border-gray-200 shadow-sm overflow-hidden">
          <div className={`h-1.5 bg-gradient-to-r ${accentClass}`} />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">{title}</CardTitle>
            <div className={`rounded-xl bg-gradient-to-br ${accentClass} p-2`}>
              <Icon className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-extrabold text-facam-dark">{value}</p>
            <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const explorerPreview = overview?.topPerformers?.slice(0, 5) ?? [];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-facam-dark via-[#0b2a8f] to-[#5b21b6] p-6 text-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide">
              <Sparkles className="size-4" />
              Cockpit premium • Analytics
            </div>
            <h1 className="mt-2 text-2xl md:text-3xl font-extrabold">
              Dashboard administrateur général
            </h1>
            <p className="text-sm text-white/75 max-w-2xl">
              Suivez la performance globale (scores, tentatives, complétion) et l’engagement
              (minutes d’apprentissage estimées).
            </p>
            {overview?.top3Quizzes?.length ? (
              <p className="mt-2 text-xs text-white/70">
                “3 quiz principaux” (plus tentés sur la période) :{' '}
                <span className="font-semibold text-white/90">
                  {overview.top3Quizzes.map((q) => q.title).join(' • ')}
                </span>
              </p>
            ) : null}
          </div>

          <div className="w-full md:w-auto rounded-2xl bg-white/10 p-4 backdrop-blur">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-white/80">
                <Filter className="size-4" />
                Filtres
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2">
                  <CalendarDays className="size-4 text-white/80" />
                  <select
                    value={rangeFilter}
                    onChange={(e) => setRangeFilter(e.target.value as typeof rangeFilter)}
                    className="bg-transparent text-sm font-semibold text-white outline-none"
                  >
                    <option value="7d">7 jours</option>
                    <option value="30d">30 jours</option>
                    <option value="90d">90 jours</option>
                  </select>
                </div>
                <div className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2">
                  <Layers3 className="size-4 text-white/80" />
                  <select
                    value={moduleFilter}
                    onChange={(e) => setModuleFilter(e.target.value)}
                    className="bg-transparent text-sm font-semibold text-white outline-none max-w-[240px]"
                  >
                    <option value="">Tous les modules</option>
                    {modules.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2">
                  <Users className="size-4 text-white/80" />
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
                    className="bg-transparent text-sm font-semibold text-white outline-none"
                  >
                    <option value="all">Étudiants + Employés</option>
                    <option value="student">Étudiants</option>
                    <option value="employee">Employés</option>
                  </select>
                </div>
                <Button
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10"
                  onClick={() => void loadOverview()}
                >
                  Actualiser
                </Button>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-white/60">
              Période:{' '}
              {new Date(overview?.filters.from ?? computeFromTo.from).toLocaleDateString('fr-FR')} →{' '}
              {new Date(overview?.filters.to ?? computeFromTo.to).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 text-sm">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Apprenants"
          value={kpi?.totalLearners ?? 0}
          subtitle="Étudiants + employés"
          icon={GraduationCap}
          accent="blue"
        />
        <KpiCard
          title="Complétion"
          value={`${kpi?.completionRate ?? 0}%`}
          subtitle="Taux de complétion (inscriptions)"
          icon={Award}
          accent="gold"
        />
        <KpiCard
          title="Quiz passés"
          value={kpi?.quizzesTakenCount ?? 0}
          subtitle="Tentatives sur la période"
          icon={BarChart3}
          accent="violet"
        />
        <KpiCard
          title="Score moyen"
          value={kpi?.avgQuizScore != null ? `${kpi.avgQuizScore}%` : '—'}
          subtitle={`Pass rate: ${kpi?.passRate ?? 0}%`}
          icon={TrendingUp}
          accent="emerald"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="border-gray-200 shadow-sm lg:col-span-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <LineChartIcon className="size-5 text-facam-blue" />
              Évolution des performances
            </CardTitle>
            <div className="text-xs text-gray-500">Score moyen & tentatives / jour</div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={perfSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" tickFormatter={(v) => String(v).slice(5)} />
                  <YAxis yAxisId="left" domain={[0, 100]} />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip
                    formatter={(value: number, name: string) =>
                      name === 'avgScore' ? [`${value}%`, 'Score moyen'] : [value, 'Tentatives']
                    }
                    labelFormatter={(label) =>
                      new Date(String(label)).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                      })
                    }
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="avgScore"
                    name="Score moyen"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{ r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="attempts"
                    name="Tentatives"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Flame className="size-5 text-amber-600" />
              Heatmap d’activité
            </CardTitle>
            <div className="text-xs text-gray-500">28 jours</div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {heatmapDays.map((d) => {
                const bg =
                  d.intensity === 0
                    ? 'bg-gray-100'
                    : d.intensity < 25
                      ? 'bg-blue-100'
                      : d.intensity < 50
                        ? 'bg-blue-200'
                        : d.intensity < 75
                          ? 'bg-blue-400'
                          : 'bg-blue-600';
                return (
                  <div
                    key={d.key}
                    title={`${new Date(d.key).toLocaleDateString('fr-FR')}: ${d.attempts} tentative(s)`}
                    className={`h-5 w-full rounded-md ${bg}`}
                  />
                );
              })}
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500">
              <span>Faible</span>
              <span>Élevée</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="border-gray-200 shadow-sm lg:col-span-7">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="size-5 text-violet-600" />
              Score par quiz
            </CardTitle>
            <div className="text-xs text-gray-500">Top 12 par volume</div>
          </CardHeader>
          <CardContent>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={perQuiz} margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="title" hide />
                  <YAxis domain={[0, 100]} />
                  <Tooltip
                    formatter={(value: number, name: string) =>
                      name === 'avgScore' ? [`${value}%`, 'Score moyen'] : [value, 'Tentatives']
                    }
                  />
                  <Legend />
                  <Bar dataKey="avgScore" name="Score moyen" fill="#7c3aed" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="attempts" name="Tentatives" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Astuce: cliquez sur un module dans les filtres pour une vue “module-centric”.
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm lg:col-span-5">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Crown className="size-5 text-amber-600" />
              Profils les plus performants
            </CardTitle>
            <div className="text-xs text-gray-500">Score moyen</div>
          </CardHeader>
          <CardContent>
            {overview?.topPerformers?.length ? (
              <ul className="space-y-3">
                {overview.topPerformers.map((u, idx) => (
                  <li key={u.userId} className="rounded-xl border border-gray-200 bg-white p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-facam-dark truncate">
                          #{idx + 1} {u.fullName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{u.email}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                          <span className="rounded-full bg-blue-50 px-2 py-1 font-semibold text-blue-700">
                            {u.avgQuizScore}% score moyen
                          </span>
                          <span className="rounded-full bg-emerald-50 px-2 py-1 font-semibold text-emerald-700">
                            {u.quizzesTaken} quiz
                          </span>
                          <span className="rounded-full bg-amber-50 px-2 py-1 font-semibold text-amber-800">
                            {u.bestScoreTop3Quizzes}% (top 3)
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-1 text-[11px] font-bold text-violet-700">
                          <Sparkles className="size-3" />
                          {u.engagementScore}
                        </div>
                        <p className="mt-2 text-[11px] text-gray-500">
                          {u.avgProgress}% progression
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">Aucune donnée sur la période.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Timer className="size-5 text-emerald-600" />
            Profils les plus investis
          </CardTitle>
          <div className="text-xs text-gray-500">Minutes d’apprentissage estimées</div>
        </CardHeader>
        <CardContent>
          {overview?.mostInvested?.length ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {overview.mostInvested.slice(0, 8).map((u) => (
                <div key={u.userId} className="rounded-2xl border border-gray-200 bg-white p-4">
                  <p className="font-bold text-facam-dark truncate">{u.fullName}</p>
                  <p className="text-xs text-gray-500 truncate">{u.email}</p>
                  <div className="mt-3 space-y-2 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-gray-600">
                        <Timer className="size-3" /> Minutes
                      </span>
                      <span className="font-bold text-emerald-700">{u.minutesLearned} min</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-gray-600">
                        <Activity className="size-3" /> Quiz
                      </span>
                      <span className="font-bold text-blue-700">{u.quizzesTaken}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-gray-600">
                        <Target className="size-3" /> Score
                      </span>
                      <span className="font-bold text-violet-700">{u.avgQuizScore}%</span>
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

      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="size-5 text-violet-700" />
              Learners Explorer (aperçu)
            </CardTitle>
            <p className="text-xs text-gray-500">
              Ouvrez la console complète pour recherche, tri, pagination et fiche 360°.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-[280px]">
              <Input
                value={learnerSearch}
                onChange={(e) => setLearnerSearch(e.target.value)}
                placeholder="Rechercher…"
              />
            </div>
            <Link
              href={`/admin/analytics/learners${learnerSearch.trim() ? `?q=${encodeURIComponent(learnerSearch.trim())}` : ''}`}
            >
              <Button variant="accent">
                Ouvrir la console <ArrowRight className="ml-1 size-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {explorerPreview.length === 0 ? (
            <p className="text-sm text-gray-500">Aucune donnée sur la période.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {explorerPreview.map((u) => (
                <Link
                  key={u.userId}
                  href={`/admin/analytics/learners/${u.userId}?from=${encodeURIComponent(overview?.filters.from ?? computeFromTo.from)}&to=${encodeURIComponent(overview?.filters.to ?? computeFromTo.to)}${moduleFilter ? `&moduleId=${encodeURIComponent(moduleFilter)}` : ''}`}
                  className="group"
                >
                  <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-facam">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-facam-dark truncate group-hover:text-facam-blue">
                          {u.fullName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{u.email}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                          <span className="rounded-full bg-blue-50 px-2 py-1 font-semibold text-blue-700">
                            {u.avgQuizScore}% score
                          </span>
                          <span className="rounded-full bg-emerald-50 px-2 py-1 font-semibold text-emerald-700">
                            {u.minutesLearned} min
                          </span>
                          <span className="rounded-full bg-amber-50 px-2 py-1 font-semibold text-amber-800">
                            {u.bestScoreTop3Quizzes}% (top 3)
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-1 text-[11px] font-bold text-violet-700">
                          <Flame className="size-3" />
                          {u.engagementScore}
                        </div>
                        <p className="mt-2 text-[11px] text-gray-500">{u.avgProgress}% prog.</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
